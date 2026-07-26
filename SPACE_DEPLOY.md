# 部署到 ModelScope 创空间指南

## 前置条件

1. 注册魔搭社区账号：https://modelscope.cn
2. 安装 modelscope SDK：`pip install modelscope`

## 步骤

### 1. 准备项目

```bash
# 构建生产版本
npm run build

# 确认 dist/ 目录存在
ls dist/
# 输出: index.html  assets/
```

### 2. 创建创空间

1. 登录魔搭社区 → 创空间：https://modelscope.cn/studios
2. 点击「创建创空间」
3. 选择框架：**Static HTML**（本项目为纯前端）
4. 填写名称：`ModelScope-AI-Copilot`
5. 填写简介：魔搭社区 AI 智能助手，降低开源参与门槛

### 3. 上传文件

将 `dist/` 目录下所有文件上传至创空间：
- `index.html`
- `assets/index-*.js`
- `assets/index-*.css`

### 4. 配置后端

创空间默认不支持运行 Python 后端，需将 FastAPI 服务单独部署：

- **推荐方案**：使用 ModelScope 创空间 + Gradio 包装 FastAPI
  1. 创建 Python 创空间，选择 Gradio SDK
  2. 上传 `backend/` 目录
  3. 在 `app.py` 中使用 Gradio 包装 FastAPI
  4. 前端 API 地址指向创空间生成的 URL

- **简化方案（演示用）**：前端使用内嵌模拟数据
  修改 `ChatDemo.tsx` 中的 `callAPI` 函数，在无后端时返回模拟响应

### 5. 一键部署脚本

```bash
#!/bin/bash
# deploy.sh — 一键构建并准备创空间文件

npm run build

# 创建部署目录
mkdir -p space_deploy
cp -r dist/* space_deploy/

# 若无后端，替换为模拟数据版本
# cp src/fallback.ts space_deploy/

echo "✅ 部署文件已准备到 space_deploy/"
echo "📤 上传至 ModelScope 创空间 https://modelscope.cn/studios"
```

## 创空间规格

| 项目 | 值 |
|------|-----|
| SDK | Static HTML / Gradio |
| 资源 | CPU: 2 核 / 内存: 8GB |
| 访问 | 公网 URL，支持分享 |

## 注意事项

- API Key 不可上传至创空间，需通过环境变量注入
- 生产环境建议搭建完整后端服务
- 演示模式下可用浏览器 localStorage 存储交互记录
