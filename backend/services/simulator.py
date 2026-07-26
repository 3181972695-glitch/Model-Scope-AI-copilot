"""
模拟 AI 回答服务
按 mode 选择回答库，在 question 中匹配关键词，返回对应模板。
无匹配时返回 default 模板。
"""

from data.responses import BEGINNER_RESPONSES, MODEL_RESPONSES, CONTRIBUTION_RESPONSES


_MODE_MAP = {
    "beginner": BEGINNER_RESPONSES,
    "model": MODEL_RESPONSES,
    "contribution": CONTRIBUTION_RESPONSES,
}


def generate(mode: str, question: str) -> tuple[str, str | None]:
    """返回 (answer, matched_keyword | None)"""
    responses = _MODE_MAP.get(mode, BEGINNER_RESPONSES)
    lower = question.lower()

    # 按 key 长度降序匹配，优先匹配更长的关键词（如「多模态」>「文本」）
    for keyword in sorted(responses.keys(), key=len, reverse=True):
        if keyword == "default":
            continue
        if keyword.lower() in lower:
            return responses[keyword], keyword

    return responses["default"], None
