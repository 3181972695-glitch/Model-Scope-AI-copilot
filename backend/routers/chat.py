import json

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse

from config import DEEPSEEK_MODEL, ENABLE_REASONING, RATE_LIMIT_REQUESTS, RATE_LIMIT_WINDOW_SECONDS
from schemas.chat import ChatRequest, ChatResponse, Mode
from services import github_service
from services.ai_service import MODEL_LOCAL, chat as ai_chat, stream_chat
from services.ratelimit import enforce_rate_limit

router = APIRouter(prefix="/api", tags=["chat"])


@router.get("/meta")
async def meta() -> dict:
    """服务能力自述。前端据此如实展示「由哪个模型提供服务」，
    避免披露页写死的模型名与实际部署不一致。"""
    return {
        "service": "modelscope-ai-copilot-backend",
        "model": DEEPSEEK_MODEL,
        "reasoning_enabled": ENABLE_REASONING,
        "modes": [m.value for m in Mode],
        "streaming": True,
        "real_repo_metrics": True,
        "rate_limit": {"requests": RATE_LIMIT_REQUESTS, "window_seconds": RATE_LIMIT_WINDOW_SECONDS},
    }


async def _build_context(mode: str, question: str) -> str | None:
    """按场景准备注入模型的实时数据。

    目前只有「健康度诊断」需要外部数据：抓取 GitHub 真实指标，
    避免模型凭空编造星标数与响应时长。抓取失败时返回说明文案，
    让模型如实告知用户数据不可得，而不是继续编。
    """
    if mode != "health_check":
        return None

    repo = github_service.extract_repo(question)
    if not repo:
        return (
            "系统未能从用户提问中识别出具体的仓库标识。\n"
            "请在回答中明确说明：需要形如 `owner/repo` 或 GitHub 链接才能抓取真实指标，"
            "并给出你将诊断的四个维度框架，同时标注本次未获取到真实数据。"
        )

    metrics, error = await github_service.fetch_repo_metrics(repo)
    if metrics:
        return f"数据来源：GitHub REST API 实时抓取\n{metrics.to_prompt_context()}"

    return (
        f"系统尝试抓取仓库 `{repo}` 的实时指标，但失败了，原因：{error}。\n"
        "请在回答开头如实说明数据未获取到及原因，再基于通用开源项目治理经验给出"
        "四维度评估框架与检查清单，并明确标注这不是该仓库的真实测评结果。"
    )


@router.post(
    "/chat",
    response_model=ChatResponse,
    dependencies=[Depends(enforce_rate_limit)],
)
async def chat(body: ChatRequest) -> ChatResponse:
    """非流式问答：返回完整回答与内容来源。"""
    context = await _build_context(body.mode.value, body.question)
    result = await ai_chat(
        mode=body.mode.value,
        question=body.question,
        history=body.history,
        context=context,
    )

    return ChatResponse(
        mode=body.mode,
        question=body.question,
        answer=result.answer,
        source=result.source,
        model=DEEPSEEK_MODEL if result.source == "ai" else MODEL_LOCAL,
    )


@router.post("/chat/stream", dependencies=[Depends(enforce_rate_limit)])
async def chat_stream(body: ChatRequest) -> StreamingResponse:
    """流式问答：以 SSE 逐块推送，首字延迟显著低于非流式接口。

    事件格式（每条 `data:` 为一个 JSON）：
      {"type":"thinking"}                          模型开始输出思维链（推理模型）
      {"type":"meta","source":"ai"|"local","model":"..."}
      {"type":"delta","text":"..."}
      {"type":"done"}
      {"type":"error","message":"..."}
    """
    context = await _build_context(body.mode.value, body.question)

    async def event_source():
        try:
            async for event in stream_chat(
                mode=body.mode.value,
                question=body.question,
                history=body.history,
                context=context,
            ):
                yield f"data: {json.dumps(event, ensure_ascii=False)}\n\n"
        except Exception as exc:  # noqa: BLE001 — 保证连接正常收尾，前端能收到错误提示
            print(f"[chat] 流式响应异常：{type(exc).__name__}: {exc}")
            payload = json.dumps(
                {"type": "error", "message": "服务异常，请稍后重试。"}, ensure_ascii=False
            )
            yield f"data: {payload}\n\n"

    return StreamingResponse(
        event_source(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            # 反代（如创空间网关）下禁止缓冲，保证逐块透传
            "X-Accel-Buffering": "no",
        },
    )
