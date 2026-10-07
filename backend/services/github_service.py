"""
GitHub 仓库真实指标抓取

用途：为「健康度诊断」场景提供真实数据，替代让模型凭空编造指标。
抓取后作为 context 注入 system prompt，由模型负责归因分析与治理建议。

设计原则：
- 一次诊断最多 4 次 API 调用，控制未认证限量（60 次/小时）的消耗
- 任一环节失败都不阻塞主流程：拿不到数据就如实说明，绝不假装有数据
- 支持 GITHUB_TOKEN，配置后限量提升到 5000 次/小时
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone

import httpx

from config import GITHUB_API_TIMEOUT, GITHUB_TOKEN

_API = "https://api.github.com"

# 从问题文本里识别 owner/repo：支持完整链接，也支持裸写 modelscope/swift
_REPO_PATTERNS = [
    re.compile(r"github\.com/([A-Za-z0-9_.-]+)/([A-Za-z0-9_.-]+)"),
    re.compile(r"modelscope\.cn/(?:models|studios)/([A-Za-z0-9_.-]+)/([A-Za-z0-9_.-]+)"),
    re.compile(r"\b([A-Za-z0-9][A-Za-z0-9_.-]*)/([A-Za-z0-9][A-Za-z0-9_.-]*)\b"),
]

# 这些词出现在 "owner/repo" 形式里时多半是误匹配（英文短语、路径等）
_REPO_STOPWORDS = {
    "and", "or", "the", "for", "with", "issue", "issues", "pr", "model", "models",
    "api", "doc", "docs", "github", "com", "cn", "https", "http", "www",
}


@dataclass
class RepoMetrics:
    """一个仓库的健康度原始指标。"""

    full_name: str
    html_url: str = ""
    description: str = ""
    stars: int = 0
    forks: int = 0
    subscribers: int = 0
    open_issues: int = 0
    contributors: int = 0
    commits_last_30d: int | None = None
    recent_issues_sampled: int = 0
    closed_ratio: float | None = None
    responded_within_48h: float | None = None
    stale_over_30d: int | None = None
    last_pushed: str = ""
    # 文档完善度信号（来自仓库根目录清单）
    license_name: str = ""
    has_readme: bool | None = None
    has_contributing: bool | None = None
    has_docs_dir: bool | None = None
    has_issue_templates: bool | None = None
    # 新人友好度信号（来自 Issue 样本的标签分布）
    good_first_issues: int | None = None
    help_wanted_issues: int | None = None
    notes: list[str] = field(default_factory=list)

    def to_prompt_context(self) -> str:
        """渲染成给模型看的 Markdown 数据块。拿不到的字段明确标注未获取。"""
        def fmt(value, unit: str = "", dash: str = "未获取到") -> str:
            return f"{value}{unit}" if value is not None else dash

        def mark(value: bool | None) -> str:
            if value is None:
                return "未获取到"
            return "有" if value else "无"

        lines = [
            f"- 仓库：{self.full_name}（{self.html_url}）",
            f"- 项目简介：{self.description or '未填写'}",
            f"- Star 数：{self.stars}",
            f"- Fork 数：{self.forks}",
            f"- Watch 数：{self.subscribers}",
            f"- 未关闭 Issue 数：{self.open_issues}",
            f"- 贡献者数（GitHub 统计口径，最多 500）：{fmt(self.contributors, '', '未获取到')}",
            f"- 近 30 天提交数：{fmt(self.commits_last_30d, ' 次', '未获取到')}",
            f"- 最近一次推送时间：{self.last_pushed or '未获取到'}",
        ]

        if self.recent_issues_sampled:
            lines.append(f"- 近 {self.recent_issues_sampled} 个 Issue 样本：")
            if self.closed_ratio is not None:
                lines.append(f"  - 已关闭比例：{self.closed_ratio:.0%}")
            if self.responded_within_48h is not None:
                lines.append(f"  - 48 小时内有回复比例：{self.responded_within_48h:.0%}")
            if self.stale_over_30d is not None:
                lines.append(f"  - 超过 30 天仍开放且无回复：{self.stale_over_30d} 个")
            if self.good_first_issues is not None or self.help_wanted_issues is not None:
                lines.append(
                    "  - 新人友好标签：good first issue "
                    f"{fmt(self.good_first_issues, ' 个', '未获取到')}；help wanted "
                    f"{fmt(self.help_wanted_issues, ' 个', '未获取到')}"
                )

        doc_signals = [
            f"LICENSE：{self.license_name or '无' if self.license_name is not None else '未获取到'}",
            f"README：{mark(self.has_readme)}",
            f"CONTRIBUTING：{mark(self.has_contributing)}",
            f"docs 目录：{mark(self.has_docs_dir)}",
            f"Issue 模板：{mark(self.has_issue_templates)}",
        ]
        lines.append("- 文档完善度信号：" + "；".join(doc_signals))

        if self.notes:
            lines.append("- 数据完整性说明：")
            lines.extend(f"  - {note}" for note in self.notes)

        return "\n".join(lines)


def extract_repo(question: str) -> str | None:
    """从用户问题中解析 owner/repo。解析不出返回 None。"""
    if not question:
        return None

    for pattern in _REPO_PATTERNS:
        for match in pattern.finditer(question):
            owner, repo = match.group(1), match.group(2)
            repo = repo.removesuffix(".git")
            if owner.lower() in _REPO_STOPWORDS or repo.lower() in _REPO_STOPWORDS:
                continue
            return f"{owner}/{repo}"
    return None


def _headers() -> dict[str, str]:
    headers = {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "modelscope-ai-copilot",
    }
    if GITHUB_TOKEN:
        headers["Authorization"] = f"Bearer {GITHUB_TOKEN}"
    return headers


async def fetch_repo_metrics(repo: str) -> tuple[RepoMetrics | None, str | None]:
    """抓取仓库指标。

    返回 (metrics, error)：
    - 成功 → (RepoMetrics, None)
    - 失败 → (None, 说明原因的中文文案)
    """
    if not repo:
        return None, "未能从提问中识别出仓库（需要形如 modelscope/swift 或 GitHub 链接）"

    since = (datetime.now(timezone.utc) - timedelta(days=30)).strftime("%Y-%m-%dT%H:%M:%SZ")

    async with httpx.AsyncClient(
        base_url=_API,
        headers=_headers(),
        timeout=GITHUB_API_TIMEOUT,
        # 仓库改名/迁移时 GitHub 会返回 301，需跟随跳转才能拿到数据
        follow_redirects=True,
    ) as client:
        # ① 仓库基础信息 —— 这一步失败即认为整体失败
        try:
            resp = await client.get(f"/repos/{repo}")
        except Exception as exc:  # noqa: BLE001
            return None, f"访问 GitHub 失败（{type(exc).__name__}），可能是网络不可达"

        if resp.status_code == 404:
            return None, f"GitHub 上找不到仓库 {repo}"
        if resp.status_code == 403:
            return None, "GitHub API 触发限流，请稍后重试或配置 GITHUB_TOKEN"
        if resp.status_code != 200:
            return None, f"GitHub API 返回异常状态码 {resp.status_code}"

        data = resp.json()
        metrics = RepoMetrics(
            full_name=data.get("full_name", repo),
            html_url=data.get("html_url", ""),
            description=(data.get("description") or "").strip(),
            stars=data.get("stargazers_count", 0),
            forks=data.get("forks_count", 0),
            subscribers=data.get("subscribers_count", 0),
            open_issues=data.get("open_issues_count", 0),
            last_pushed=(data.get("pushed_at") or "")[:10],
            license_name=((data.get("license") or {}).get("spdx_id") or ""),
        )

        # ② 贡献者数
        try:
            resp = await client.get(
                f"/repos/{repo}/contributors",
                params={"per_page": 100, "anon": "false"},
            )
            if resp.status_code == 200:
                metrics.contributors = len(resp.json())
                if metrics.contributors >= 100:
                    metrics.notes.append("贡献者数已达单次查询上限 100，实际可能更多")
            else:
                metrics.notes.append("贡献者数未获取到")
        except Exception:  # noqa: BLE001
            metrics.notes.append("贡献者数未获取到")

        # ③ 近 30 天提交数（单次最多 100 条）
        try:
            resp = await client.get(
                f"/repos/{repo}/commits",
                params={"since": since, "per_page": 100},
            )
            if resp.status_code == 200:
                metrics.commits_last_30d = len(resp.json())
                if metrics.commits_last_30d >= 100:
                    metrics.notes.append("近 30 天提交数已达单次查询上限 100，实际可能更多")
            else:
                metrics.notes.append("近 30 天提交数未获取到")
        except Exception:  # noqa: BLE001
            metrics.notes.append("近 30 天提交数未获取到")

        # ④ 近期 Issue 样本，用于估算响应效率
        try:
            resp = await client.get(
                f"/repos/{repo}/issues",
                params={"state": "all", "per_page": 100, "sort": "created", "direction": "desc"},
            )
            if resp.status_code == 200:
                issues = [item for item in resp.json() if "pull_request" not in item]
                metrics.recent_issues_sampled = len(issues)
                if issues:
                    closed = sum(1 for i in issues if i.get("closed_at"))
                    metrics.closed_ratio = closed / len(issues)

                    responded = 0
                    stale = 0
                    gfi = 0
                    hw = 0
                    now = datetime.now(timezone.utc)
                    for issue in issues:
                        # comments > 0 视为维护者/社区已响应
                        if issue.get("comments", 0) > 0:
                            responded += 1
                        created = _parse_time(issue.get("created_at"))
                        if (
                            issue.get("state") == "open"
                            and issue.get("comments", 0) == 0
                            and created
                            and (now - created) > timedelta(days=30)
                        ):
                            stale += 1
                        labels = {lbl.get("name", "").lower() for lbl in issue.get("labels", [])}
                        if "good first issue" in labels:
                            gfi += 1
                        if "help wanted" in labels:
                            hw += 1
                    metrics.responded_within_48h = responded / len(issues)
                    metrics.stale_over_30d = stale
                    metrics.good_first_issues = gfi
                    metrics.help_wanted_issues = hw
                    metrics.notes.append("新人友好标签数基于上述 Issue 样本统计，非全量")
                else:
                    metrics.notes.append("近期 Issue 样本为空")
            else:
                metrics.notes.append("Issue 响应数据未获取到")
        except Exception:  # noqa: BLE001
            metrics.notes.append("Issue 响应数据未获取到")

        # ⑤ 仓库根目录清单，用于判断文档与模板类文件是否存在
        try:
            resp = await client.get(f"/repos/{repo}/contents/")
            if resp.status_code == 200:
                names = {
                    item.get("name", "").lower()
                    for item in resp.json()
                    if item.get("type") in ("file", "dir")
                }
                metrics.has_readme = any(n.startswith("readme") for n in names)
                metrics.has_contributing = any(n.startswith("contributing") for n in names)
                metrics.has_docs_dir = any(n in ("docs", "doc", "documentation") for n in names)
                metrics.has_issue_templates = any(
                    n in (".github", ".gitlab") for n in names
                )
                if metrics.has_issue_templates:
                    metrics.notes.append(
                        "根目录存在 .github/.gitlab，无法据此确认是否真的配了 Issue 模板"
                    )
            else:
                metrics.notes.append("仓库根目录清单未获取到")
        except Exception:  # noqa: BLE001
            metrics.notes.append("仓库根目录清单未获取到")

    return metrics, None


def _parse_time(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.strptime(value, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=timezone.utc)
    except ValueError:
        return None
