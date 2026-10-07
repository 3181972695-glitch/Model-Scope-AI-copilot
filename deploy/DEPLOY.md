# 部署与更新说明（交给部署负责人）

> 一句话：**前端必须用 `npm run build:demo` 构建**（产物带 `/copilot/` 前缀），
> 直接 `npm run build` 的包传上去会整站白屏。后端建议一并替换，五项功能才能全部可用。

- 展示地址：https://demo.tom-thu.cn/copilot/
- 前端产物：`dist/`（构建后生成）
- 后端：`backend/`（FastAPI）
- 本仓库：`github.com/3181972695-glitch/Model-Scope-AI-copilot`

---

## 一、为什么这次更新不能只 `npm run build`

本次改版后，前端所有资源与接口路径都跟随**部署前缀**（Vite `base`）。
平台把作品挂在 `/copilot/` 子路径下，因此：

| 项目 | 直接 build 的结果 | 平台要求 |
|---|---|---|
| JS/CSS 地址 | `/assets/xxx.js` → 打到站点根 → **404 白屏** | `/copilot/assets/xxx.js` |
| 接口地址 | `/api/chat` → **404** | `/copilot/api/chat` |
| logo / favicon | `/logo.png` → **404** | `/copilot/logo.png` |

**正确构建命令（已写进 package.json）：**

```bash
npm run build:demo        # 等价于 VITE_BASE=/copilot/ npm run build
```

---

## 二、上线前本地自检（1 分钟，强烈建议）

仓库自带了一个「按平台形态运行」的脚本，能在本地复现 `/copilot/` + 反代的部署结构：

```bash
# 终端 1：起后端
cd backend && pip install -r requirements.txt && uvicorn main:app --port 8000

# 终端 2：构建 + 按平台形态运行
npm run build:demo
python3 deploy/serve_like_platform.py --port 8080
```

浏览器打开 `http://127.0.0.1:8080/copilot/`，点 5 张功能卡各发一次问。
**页面无报错、徽标显示模型名、健康度诊断给出真实 GitHub 数据 = 通过。**

> 这个脚本同时会校验 dist 的资源前缀是否正确，前缀不对会直接报错而不是白屏。

---

## 三、更新前端（最小方案，5 分钟，不换后端也能上）

```bash
git pull
npm install
npm run build:demo
```

把 **`dist/` 目录的全部内容**覆盖到站点的 `/copilot/` 根（保留平台注入的返回主页脚本与备案页脚，如平台是自动注入则无需关心）。

**不换后端也能用**：新前端对旧后端做了三级兼容（流式 → 非流式 → 内置内容），
对话不会挂。但受现有后端能力所限：

- 第 5 张卡「健康度诊断」会显示前端内置示例（旧后端没有 `health_check` 模式，请求会 422）
- 无流式打字效果、无多轮追问、徽标显示「通义千问」（读取自旧后端响应里的 `model` 字段）

**适合**：时间紧张，先保证「不白屏、能对话」。

---

## 四、更新前端 + 后端（完整方案，推荐）

### 1. 部署后端

```bash
git pull
cd backend
pip install -r requirements.txt
cp .env.example .env      # 填入 DEEPSEEK_API_KEY，建议也填 GITHUB_TOKEN
uvicorn main:app --host 127.0.0.1 --port 8000
```

或用 Docker（仓库根目录执行）：

```bash
docker build -t msc-copilot-backend -f deploy/Dockerfile.backend .
docker run -d --name msc-copilot-backend -p 8000:8000 --env-file backend/.env msc-copilot-backend
```

### 2. 反向代理

把 `/copilot/api/*` 转发到后端的 `/api/*`，关键配置（nginx）：

```nginx
location /copilot/api/ {
    proxy_pass http://127.0.0.1:8000/api/;     # 末尾斜杠会去掉 /copilot/api 前缀
    proxy_http_version 1.1;
    proxy_buffering off;                        # 必须：SSE 流式不能被缓冲
    proxy_read_timeout 300s;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $remote_addr;   # 限流按 IP 统计依赖它
}
```

> `proxy_buffering off` 与 `X-Forwarded-For` 两项最容易漏：
> 前者漏了流式会变成「等半分钟一次性吐完」，后者漏了限流会把所有人算成同一个 IP。

### 3. 替换前端

同第三节（`npm run build:demo` → 上传 `dist/`）。

**换上后端后的效果**：五个场景全可用、流式打字（首字约 1–2 秒）、多轮追问、
健康度诊断基于 GitHub 实时指标（会标注数据来源与日期）、限流保护、
界面与 AI 披露页自动显示真实服务模型。

---

## 五、上线后验收清单（2 分钟）

依次点击五张功能卡，并按 F12 看 Network：

| 检查项 | 期望 |
|---|---|
| 页面样式与图片 | 正常，无白屏，Console 无红色 404 |
| 请求路径 | 全部是 `/copilot/api/...`，无 `/api/...` 直连根路径 |
| 回答徽标 | 显示「DeepSeek 实时生成」（或当前后端模型名） |
| 健康度诊断 | 出现真实数值（Star/Issue 数），并标注数据来源与日期 |
| 连点 15 次 | 第 13 次左右返回限流提示，而不是一直转圈 |

任一不达标，先看第三节的自检脚本能否在本地复现，再查 nginx 配置。

---

## 六、安全与配置注意事项

1. **`DEEPSEEK_API_KEY` 只放服务器环境变量或 `backend/.env`**，不要写进任何会进仓库的文件。
2. **历史遗留**：早期提交 `d409611` / `abcf7e0` 的 git 历史里泄露过一把 API Key（尾号 `b44c`），
   建议到 DeepSeek 后台确认已吊销；如需彻底清除历史可用 `git filter-repo`。
3. `GITHUB_TOKEN` 建议配置（只读公开仓库、无需任何权限）：未认证限量 60 次/小时，
   一次诊断约消耗 5 次；配置后 5000 次/小时，答辩现场多人演示更稳。
4. 限流默认每 IP 每分钟 12 次，可用环境变量 `RATE_LIMIT_REQUESTS` 调整；
   评委现场若多人同时演示，建议适当调大。
