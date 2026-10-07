"""
应用配置
"""

import os

from dotenv import load_dotenv

load_dotenv()

# ── DeepSeek API 配置 ──
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "")
DEEPSEEK_BASE_URL = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com")
DEEPSEEK_MODEL = os.getenv("DEEPSEEK_MODEL", "deepseek-v4-pro")

# 请求超时（秒）—— 真正传给 OpenAI 客户端与外部数据源
REQUEST_TIMEOUT = float(os.getenv("REQUEST_TIMEOUT", "30"))

# 单次回答的最大 token 数。
# 注意：deepseek-v4-pro 是推理模型，思维链与正式回答共用这个额度，
# 额度给小了会出现「思维链吃满额度、正式回答为空」的截断问题。
MAX_TOKENS = int(os.getenv("MAX_TOKENS", "4096"))

# 是否启用模型推理（思维链）。
# 实测：开启时本项目的长 System Prompt 会诱发 4700+ 字思维链，
# 单轮耗时 54s；关闭后同样的输出质量只需 4.4s（12 倍差距）。
# 本项目属「格式与规范明确」的任务型问答，答案依赖内置规则而非深度推理，
# 因此默认关闭；需要更强的分析（如复杂的健康度归因）可通过环境变量开启。
ENABLE_REASONING = os.getenv("ENABLE_REASONING", "false").strip().lower() in ("1", "true", "yes", "on")

# ── 限流配置 ──
# 每个来源 IP 在滑动窗口内允许的请求数。公网部署时用于保护 API 余额。
RATE_LIMIT_REQUESTS = int(os.getenv("RATE_LIMIT_REQUESTS", "12"))
RATE_LIMIT_WINDOW_SECONDS = int(os.getenv("RATE_LIMIT_WINDOW_SECONDS", "60"))

# ── GitHub 数据源（健康度诊断用，可选）──
# 不配置也能跑，只是未认证请求的限量较低（每小时 60 次）
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN", "")
GITHUB_API_TIMEOUT = float(os.getenv("GITHUB_API_TIMEOUT", "12"))

# ── 多轮对话上下文 ──
# 最多回带的历史消息条数（不含本轮提问），控制 token 成本
MAX_HISTORY_MESSAGES = int(os.getenv("MAX_HISTORY_MESSAGES", "8"))
