"""
应用配置
"""

import os

# DeepSeek API 配置
DEEPSEEK_API_KEY = os.getenv(
    "DEEPSEEK_API_KEY",
    "sk-85410d82861343088d9087d5d82bb44c",
)
DEEPSEEK_BASE_URL = "https://api.deepseek.com"
DEEPSEEK_MODEL = "deepseek-v4-pro"

# 请求超时（秒）
REQUEST_TIMEOUT = 30
