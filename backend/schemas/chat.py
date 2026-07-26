from enum import Enum

from pydantic import BaseModel, Field


class Mode(str, Enum):
    beginner = "beginner"
    model = "model"
    contribution = "contribution"


class ChatRequest(BaseModel):
    question: str = Field(
        ...,
        min_length=1,
        max_length=2000,
        description="用户提出的问题",
        examples=["如何注册 ModelScope？"],
    )
    mode: Mode = Field(
        ...,
        description="对话模式：beginner（新手导航）| model（模型推荐）| contribution（贡献规划）",
    )


class ChatResponse(BaseModel):
    mode: Mode = Field(..., description="当前对话模式")
    question: str = Field(..., description="用户原始问题")
    answer: str = Field(..., description="AI 生成的回答")
    model: str = Field(default="deepseek-v4-pro", description="使用的 AI 模型")
