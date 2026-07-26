# ModelScope AI Community Copilot

> AI 创作工坊 2026 — 主题一「AI + 开源社区生态」

魔搭社区（ModelScope）智能助手，通过 AI 驱动的对话式交互，降低开源社区参与门槛，提升协作效率，激发社区活力。

## 🎯 社区价值

```
新人入门降门槛 → 项目落地提效率 → 贡献产出提质量 → 协作沟通降成本 → 社区活力整体提升
```

| 服务人群 | 核心价值 |
|----------|----------|
| 新人开发者 | 分阶段入门路径 + Good First Issue 匹配，从零到首次 PR |
| 普通贡献者 | 模型推荐 + 推理代码 + 创空间发布模板，成果反哺社区 |
| 项目维护者 | Issue 智能摘要 + 结构化讨论分析，降低维护沟通成本 |

## 🚀 四大功能

| 功能 | 描述 |
|------|------|
| 🧭 新手导航 | 按「模型体验→Notebook微调→发布创空间→社区贡献」全流程分阶段指引 |
| 🧠 模型推荐 | 推荐模型 + 官方卡片链接 + 推理代码 + 一键 Notebook + 创空间发布规范 |
| 🚀 贡献规划 | Issue 智能匹配 + PR 模板生成 + CLA/commit 校验清单 |
| 📋 议题摘要 | Issue 结构化摘要：核心诉求 / 环境信息 / 争议分歧 / 进展 / 待决策 |

## 🏗 技术架构

```
React 19 + TypeScript + Tailwind CSS (Vite)
         ↕ /api/chat
FastAPI + Pydantic (Python)
         ↕ OpenAI SDK
DeepSeek V4 Pro (deepseek-v4-pro)
```

## 📦 一键启动

```bash
# 1. 后端
cd backend
pip install -r requirements.txt
DEEPSEEK_API_KEY="your-key" uvicorn main:app --port 8000 --reload

# 2. 前端
npm install
npm run dev
```

打开 http://localhost:5173（前端代理 /api → 后端 :8000）

## 📂 项目结构

```
├── src/
│   ├── components/
│   │   ├── Navbar.tsx          # 导航栏
│   │   ├── Hero.tsx            # 首页 + 社区价值看板
│   │   ├── FeatureCards.tsx    # 四大功能卡片
│   │   ├── ChatDemo.tsx        # AI 对话（调用 /api/chat）
│   │   ├── AIDisclosure.tsx    # AI 使用披露 + 项目介绍
│   │   └── Footer.tsx          # 页脚
│   ├── App.tsx                 # 主页面
│   └── index.css               # Tailwind + 样式
├── backend/
│   ├── main.py                 # FastAPI 入口
│   ├── routers/chat.py         # POST /api/chat
│   ├── services/ai_service.py  # DeepSeek API 调用
│   ├── schemas/chat.py         # Pydantic 请求/响应模型
│   └── data/prompts.py         # 四场景 System Prompt
└── vite.config.ts              # Vite + API 代理
```

## 🤖 AI 使用披露

本项目在开发中借助了 AI 工具（前端/后端/Prompt/文案），所有 AI 生成内容均通过人工审查与校验。详见页面「AI 使用披露」区域或 `AIDisclosure.tsx`。

## 📄 License

MIT
