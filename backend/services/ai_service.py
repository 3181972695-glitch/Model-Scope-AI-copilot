"""
DeepSeek API 对话服务
按 mode 加载对应的 system prompt，调用 DeepSeek 生成回答。
"""

from openai import AsyncOpenAI

from config import DEEPSEEK_API_KEY, DEEPSEEK_BASE_URL, DEEPSEEK_MODEL
from data.prompts import SYSTEM_PROMPTS

_client = AsyncOpenAI(
    api_key=DEEPSEEK_API_KEY,
    base_url=DEEPSEEK_BASE_URL,
)


async def chat(mode: str, question: str) -> str:
    """调用 DeepSeek API，返回 AI 回答文本。"""
    system_prompt = SYSTEM_PROMPTS.get(mode, SYSTEM_PROMPTS["beginner"])

    response = await _client.chat.completions.create(
        model=DEEPSEEK_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": question},
        ],
        temperature=0.7,
        max_tokens=1024,
    )

    return response.choices[0].message.content or ""
