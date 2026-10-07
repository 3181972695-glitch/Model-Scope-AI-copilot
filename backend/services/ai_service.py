"""
DeepSeek API 对话服务

职责：
- 按 mode 加载对应的 system prompt
- 支持多轮上下文（history）
- 支持外部注入的实时上下文（context，如 GitHub 仓库真实指标）
- 上游不可用时降级到 services.simulator 的本地知识库，保证服务不中断

降级策略是本项目的可用性设计：AI 不可用（余额不足 / 网络异常 / 超时 / 空回复）时
不向前端抛 500，而是返回本地知识库内容，并通过 source 字段如实告知内容来源。
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import AsyncIterator, Iterable

from openai import AsyncOpenAI

from config import (
    DEEPSEEK_API_KEY,
    DEEPSEEK_BASE_URL,
    DEEPSEEK_MODEL,
    ENABLE_REASONING,
    MAX_HISTORY_MESSAGES,
    MAX_TOKENS,
    REQUEST_TIMEOUT,
)
from data.prompts import SYSTEM_PROMPTS
from services import simulator

# 内容来源标识
SOURCE_AI = "ai"
SOURCE_LOCAL = "local"

# 降级内容的来源标识。前端据此说明「本回答不是模型生成的」，
# 避免降级内容被误当成模型输出（AI 披露一致性的关键一环）。
MODEL_LOCAL = "local-knowledge-base"

# 单条历史消息的最大长度，防止前端塞超长内容放大 token 成本
_MAX_MESSAGE_CHARS = 4000

_client = AsyncOpenAI(
    api_key=DEEPSEEK_API_KEY,
    base_url=DEEPSEEK_BASE_URL,
    timeout=REQUEST_TIMEOUT,
    max_retries=1,
)


# 推理模型的思维链开关。本项目默认关闭以换取响应速度（实测 54s → 4.4s），
# 关闭方式为 DeepSeek 的 thinking.type = disabled。开启时不传该参数。
_REASONING_KWARGS: dict = (
    {} if ENABLE_REASONING else {"extra_body": {"thinking": {"type": "disabled"}}}
)


@dataclass
class AIResult:
    """一次问答的结果，附带内容来源，便于前端如实展示。"""

    answer: str
    source: str = SOURCE_AI


def _sanitize_history(history: Iterable | None) -> list[dict[str, str]]:
    """清洗历史消息：只保留合法的 user/assistant 对，限制条数与长度。"""
    if not history:
        return []

    cleaned: list[dict[str, str]] = []
    for item in history:
        role = getattr(item, "role", None)
        content = getattr(item, "content", None)
        if isinstance(item, dict):
            role = item.get("role")
            content = item.get("content")
        if role not in ("user", "assistant"):
            continue
        if not isinstance(content, str) or not content.strip():
            continue
        cleaned.append({"role": role, "content": content.strip()[:_MAX_MESSAGE_CHARS]})

    return cleaned[-MAX_HISTORY_MESSAGES:]


def _build_messages(
    mode: str,
    question: str,
    history: Iterable | None = None,
    context: str | None = None,
) -> list[dict[str, str]]:
    """组装发送给模型的 messages：system + 历史上下文 + 本轮提问。"""
    system_prompt = SYSTEM_PROMPTS.get(mode, SYSTEM_PROMPTS["beginner"])

    # 外部实时数据作为 system 补充信息，明确要求模型优先依据这些数据作答
    if context:
        system_prompt = (
            f"{system_prompt}\n\n"
            "## 实时数据（由系统抓取，优先依据这些数据作答）\n"
            f"{context}\n\n"
            "要求：以上述实时数据为准做分析与归因，不要凭空编造指标；"
            "数据缺失的维度请直接说明「该维度数据未获取到」。"
        )

    messages: list[dict[str, str]] = [{"role": "system", "content": system_prompt}]
    messages.extend(_sanitize_history(history))
    messages.append({"role": "user", "content": question})
    return messages


async def chat(
    mode: str,
    question: str,
    history: Iterable | None = None,
    context: str | None = None,
) -> AIResult:
    """非流式问答。上游失败时降级到本地知识库。"""
    messages = _build_messages(mode, question, history, context)

    try:
        response = await _client.chat.completions.create(
            model=DEEPSEEK_MODEL,
            messages=messages,
            temperature=0.7,
            max_tokens=MAX_TOKENS,
            **_REASONING_KWARGS,
        )
        choice = response.choices[0]
        content = (choice.message.content or "").strip()
        if content:
            return AIResult(answer=content, source=SOURCE_AI)

        # 推理模型会先输出思维链，与正式回答共用 max_tokens 额度。
        # 若思维链耗尽了额度，会出现 content 为空但 reasoning_content 有内容的情况，
        # 此时 finish_reason 通常为 length —— 明确报出来，便于定位而不是笼统说「空内容」。
        reasoning = getattr(choice.message, "reasoning_content", None) or ""
        raise RuntimeError(
            f"DeepSeek 未返回正式回答（finish_reason={choice.finish_reason}，"
            f"思维链 {len(reasoning)} 字），可能是 max_tokens={MAX_TOKENS} 不足被截断"
        )
    except Exception as exc:  # noqa: BLE001 — 任何上游异常都不应让前端 500
        print(f"[ai_service] DeepSeek 调用失败，降级到本地知识库：{type(exc).__name__}: {exc}")
        answer, _keyword = simulator.generate(mode, question)
        return AIResult(answer=answer, source=SOURCE_LOCAL)


async def stream_chat(
    mode: str,
    question: str,
    history: Iterable | None = None,
    context: str | None = None,
) -> AsyncIterator[dict]:
    """流式问答，产出事件字典：

    - {"type": "thinking"}                         模型开始输出思维链（推理模型）
    - {"type": "meta",  "source": "ai" | "local"}  声明内容来源
    - {"type": "delta", "text": "..."}             增量文本
    - {"type": "done"}                             正常结束
    - {"type": "error", "message": "..."}          流中途失败或被长度截断

    思维链（reasoning_content）不推送给前端作为回答内容，但会在开始时告知前端
    「正在思考」，避免推理期间界面长时间无反馈。流式同样受 max_tokens 约束，
    被截断时会显式提示，而不是静默给出半截回答。

    上游在首字前失败 → 降级为本地知识库并一次性推送；
    上游中途失败 → 保留已推送内容并追加错误事件，避免前端出现半截空白。
    """
    messages = _build_messages(mode, question, history, context)

    yielded = False
    thinking_announced = False
    finish_reason: str | None = None
    try:
        stream = await _client.chat.completions.create(
            model=DEEPSEEK_MODEL,
            messages=messages,
            temperature=0.7,
            max_tokens=MAX_TOKENS,
            stream=True,
            **_REASONING_KWARGS,
        )

        async for chunk in stream:
            if not chunk.choices:
                continue
            choice = chunk.choices[0]
            if choice.finish_reason:
                finish_reason = choice.finish_reason

            delta = choice.delta
            reasoning = getattr(delta, "reasoning_content", None)
            if reasoning and not yielded and not thinking_announced:
                thinking_announced = True
                yield {"type": "thinking"}

            text = getattr(delta, "content", None)
            if not text:
                continue
            if not yielded:
                yield {"type": "meta", "source": SOURCE_AI, "model": DEEPSEEK_MODEL}
                yielded = True
            yield {"type": "delta", "text": text}

        if not yielded:
            raise RuntimeError(
                f"DeepSeek 流式未返回正式回答（finish_reason={finish_reason}），"
                f"可能是 max_tokens={MAX_TOKENS} 不足"
            )

        if finish_reason == "length":
            yield {
                "type": "error",
                "message": "回答达到长度上限被截断，可针对更具体的问题再问一次。",
            }
        yield {"type": "done"}
        return

    except Exception as exc:  # noqa: BLE001
        print(f"[ai_service] DeepSeek 流式调用失败：{type(exc).__name__}: {exc}")

        if yielded:
            # 已有输出，保留内容并如实告知中断
            yield {"type": "error", "message": "AI 响应中断，以上内容可能不完整，请重试。"}
            return

        # 尚未输出，整段降级到本地知识库
        answer, _keyword = simulator.generate(mode, question)
        yield {"type": "meta", "source": SOURCE_LOCAL, "model": MODEL_LOCAL}
        yield {"type": "delta", "text": answer}
        yield {"type": "done"}
