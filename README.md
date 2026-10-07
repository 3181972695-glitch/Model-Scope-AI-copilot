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

## 🚀 五大功能

| 功能 | 描述 |
|------|------|
| 🧭 新手导航 | 按「模型体验→Notebook微调→发布创空间→社区贡献」全流程分阶段指引 |
| 🧠 模型推荐 | 推荐模型 + 官方卡片链接 + 推理代码 + 一键 Notebook + 创空间发布规范 |
| 🚀 贡献规划 | Issue 智能匹配 + PR 模板生成 + CLA/commit 校验清单 |
| 📋 议题摘要 | Issue 结构化摘要：核心诉求 / 环境信息 / 争议分歧 / 进展 / 待决策 |
| 📊 健康度诊断 | 抓取 GitHub 真实指标，按贡献活跃度 / Issue 响应效率 / 文档完善度 / 新人友好度四维评分并给出治理建议 |

## 🏗 技术架构

```
React 19 + TypeScript + Tailwind CSS (Vite)
         ↕ /api/chat            非流式问答
         ↕ /api/chat/stream     SSE 流式问答（首字约 1 秒）
FastAPI + Pydantic (Python)
         ↕ OpenAI SDK          DeepSeek V4 Pro（deepseek-v4-pro）
         ↕ httpx               GitHub REST API（健康度诊断的真实指标）

降级链路：DeepSeek 不可用 → 后端本地知识库 → 前端内置演示内容
          （每级都会在回答下方标注内容来源）
```

### 关键设计

| 机制 | 说明 |
|------|------|
| 多轮上下文 | 请求携带最近若干轮对话（`history`），支持连续追问；服务端限制条数与单条长度 |
| 流式响应 | `/api/chat/stream` 以 SSE 逐块推送，首字延迟约 1 秒 |
| 真实数据 | 健康度诊断抓取 GitHub 真实指标（Star / 30 天提交数 / Issue 48 小时响应率 / 文档信号 / good first issue 标签数），模型只负责归因分析 |
| 内容来源标注 | 每条回答标注「DeepSeek 实时生成 / 本地知识库降级 / 内置演示内容」 |
| 访问限流 | 按来源 IP 的滑动窗口限流（默认 12 次 / 60 秒），防止公开部署被刷爆 Key 余额 |

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

### 🚀 部署到展示平台（demo.tom-thu.cn/copilot/）

作品挂在 `/copilot/` 子路径下，**必须带前缀构建**，否则上传后整站白屏：

```bash
npm run build:demo      # 等价于 VITE_BASE=/copilot/ npm run build
```

然后把 `dist/` 内容覆盖到站点 `/copilot/` 根；后端单独部署并把 `/copilot/api/*` 反代到后端 `/api/*`（记得 `proxy_buffering off` 以支持 SSE）。

- 详细步骤与 nginx 配置：**[deploy/DEPLOY.md](deploy/DEPLOY.md)**
- 上线前本地自检：`python3 deploy/serve_like_platform.py --port 8080`（复现平台形态，能提前发现前缀/代理问题）
- 后端 Docker 镜像：`deploy/Dockerfile.backend`
- 答辩演示流程与问答预案：`docs/答辩演示脚本.md`

> 前端对后端做了三级兼容（流式 → 非流式 → 内置内容），因此「只更新前端、暂不换后端」也不会挂：
> 旧后端缺 `/stream` 时自动走非流式，缺 `health_check` 模式时第 5 张卡显示内置示例并如实标注。

### 环境变量（均可选，除 API Key 外都有默认值）

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `DEEPSEEK_API_KEY` | 无 | DeepSeek API Key（必填） |
| `DEEPSEEK_MODEL` | `deepseek-v4-pro` | 模型名 |
| `ENABLE_REASONING` | `false` | 是否启用思维链。关闭时单轮约 4 秒；开启会诱发数千字思维链、单轮约 54 秒 |
| `MAX_TOKENS` | `4096` | 单次回答上限（思维链与正文共用） |
| `REQUEST_TIMEOUT` | `30` | 上游请求超时（秒） |
| `RATE_LIMIT_REQUESTS` | `12` | 限流窗口内允许的请求数 |
| `RATE_LIMIT_WINDOW_SECONDS` | `60` | 限流滑动窗口长度（秒） |
| `MAX_HISTORY_MESSAGES` | `8` | 随请求回带的最大历史消息条数 |
| `GITHUB_TOKEN` | 空 | 可选。配置后 GitHub 限量从 60 次/小时提升到 5000 次/小时 |

> 未配置 `GITHUB_TOKEN` 时，健康度诊断每小时约可诊断 12 个仓库（每次诊断 5 次 API 调用）。

## 📂 项目结构

```
├── src/
│   ├── components/
│   │   ├── Navbar.tsx          # 导航栏
│   │   ├── Hero.tsx            # 首页 + 社区价值看板
│   │   ├── FeatureCards.tsx    # 五大功能卡片
│   │   ├── ChatDemo.tsx        # AI 对话（SSE 流式 + 多轮上下文 + 来源标注）
│   │   ├── AIDisclosure.tsx    # AI 使用披露 + 项目介绍
│   │   └── Footer.tsx          # 页脚
│   ├── App.tsx                 # 主页面
│   └── index.css               # Tailwind + 样式
├── backend/
│   ├── main.py                 # FastAPI 入口
│   ├── config.py               # 配置（超时 / 限流 / 模型参数）
│   ├── routers/chat.py         # POST /api/chat、POST /api/chat/stream
│   ├── services/
│   │   ├── ai_service.py       # DeepSeek 调用 + 流式 + 降级
│   │   ├── github_service.py   # GitHub 真实指标抓取
│   │   ├── ratelimit.py        # 滑动窗口限流
│   │   └── simulator.py        # 本地知识库（降级用）
│   ├── schemas/chat.py         # Pydantic 请求/响应模型
│   ├── data/prompts.py         # 五场景 System Prompt
│   └── .env.example            # 环境变量模板
├── deploy/
│   ├── DEPLOY.md               # 部署 / 更新说明（给部署负责人）
│   ├── serve_like_platform.py  # 按平台形态本地自检（前缀 + API 反代）
│   └── Dockerfile.backend      # 后端镜像
├── docs/
│   └── 答辩演示脚本.md          # 5 分钟演示讲稿 + 评委问答预案
└── vite.config.ts              # Vite（base 由 VITE_BASE 注入）+ API 代理
```

## 🤖 AI 使用披露

本项目在开发中借助了 AI 工具（前端/后端/Prompt/文案），所有 AI 生成内容均通过人工审查与校验。详见页面「AI 使用披露」区域或 `AIDisclosure.tsx`。

## 📄 License

MIT
