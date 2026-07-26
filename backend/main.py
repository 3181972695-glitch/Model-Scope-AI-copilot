"""
ModelScope AI Community Copilot — FastAPI Backend
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers.chat import router as chat_router

app = FastAPI(
    title="ModelScope AI Community Copilot",
    description="帮助 ModelScope 社区新人学习、选择模型、规划贡献路线的 AI 助手 API",
    version="0.1.0",
)

# CORS —— 允许前端跨域访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router)


@app.get("/")
def root():
    return {
        "service": "ModelScope AI Community Copilot",
        "version": "0.1.0",
        "docs": "/docs",
    }
