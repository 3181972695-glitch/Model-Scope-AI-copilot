from enum import Enum
from typing import Literal

from pydantic import BaseModel, Field


class Mode(str, Enum):
    beginner = "beginner"
    model = "model"
    contribution = "contribution"
    summary = "summary"
    health_check = "health_check"


class HistoryMessage(BaseModel):
    """一轮历史对话。用于让模型理解上下文，支持追问。"""

    role: Literal["user", "assistant"] = Field(..., description="消息角色")
    content: str = Field(..., min_length=1, max_length=4000, description="消息内容")


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
        description="对话模式：beginner（新手导航）| model（模型推荐）| contribution（贡献规划）| summary（议题摘要）| health_check（健康度诊断）",
    )
    history: list[HistoryMessage] = Field(
        default_factory=list,
        max_length=20,
        description="最近若干轮对话（不含本轮提问），用于多轮上下文；服务端只取最后若干条",
    )


class ChatResponse(BaseModel):
    mode: Mode = Field(..., description="当前对话模式")
    question: str = Field(..., description="用户原始问题")
    answer: str = Field(..., description="AI 生成的回答")
    source: Literal["ai", "local"] = Field(
        default="ai",
        description="内容来源：ai=DeepSeek 实时生成；local=上游不可用时的本地知识库降级内容",
    )
    model: str = Field(default="deepseek-v4-pro", description="使用的 AI 模型")
