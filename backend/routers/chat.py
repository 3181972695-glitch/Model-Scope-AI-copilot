from fastapi import APIRouter

from schemas.chat import ChatRequest, ChatResponse
from services.ai_service import chat as ai_chat

router = APIRouter(prefix="/api", tags=["chat"])


@router.post("/chat", response_model=ChatResponse)
async def chat(body: ChatRequest) -> ChatResponse:
    """处理聊天请求，调用 DeepSeek API 生成回答。"""
    answer = await ai_chat(mode=body.mode.value, question=body.question)

    return ChatResponse(
        mode=body.mode,
        question=body.question,
        answer=answer,
    )
