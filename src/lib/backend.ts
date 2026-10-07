/**
 * 后端接口与能力自述。
 *
 * 为什么需要统一在这里：
 * - 作品会部署在子路径下（如 https://demo.tom-thu.cn/copilot/），接口必须相对
 *   部署前缀请求，写绝对路径 /api/... 会打到站点根目录而 404。
 * - AI 披露页需要说明「由哪个模型提供服务」，而这个模型取决于部署时的后端配置。
 *   由后端通过 GET /api/meta 自述，前端如实展示，避免披露内容与实际不一致。
 */

/** 部署前缀：本地开发为 '/'，平台构建（VITE_BASE=/copilot/）为 '/copilot' */
export const API_BASE = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '');

/** 拼接相对部署前缀的接口地址 */
export const apiUrl = (path: string) => `${API_BASE}${path}`;

/**
 * 拼接静态资源地址。
 *
 * 放在 public/ 下的资源（logo.png 等）必须同样走部署前缀：
 * 写成 /logo.png 的话，作品挂在 /copilot/ 下时会去站点根目录找而 404。
 */
export const assetUrl = (name: string) => `${API_BASE}/${name.replace(/^\/+/, '')}`;

export interface BackendMeta {
  model?: string;
  streaming?: boolean;
  modes?: string[];
  real_repo_metrics?: boolean;
  rate_limit?: { requests?: number; window_seconds?: number };
}

/** 同一页面内多个组件共享一次探测结果 */
let cached: Promise<BackendMeta | null> | null = null;

/**
 * 探测后端能力。
 *
 * 后端未部署、未提供 /api/meta（如只提供 /api/chat 的简化实现）时返回 null，
 * 调用方应据此退回到中性描述，而不是假装知道模型是什么。
 */
export function fetchBackendMeta(): Promise<BackendMeta | null> {
  if (!cached) {
    cached = fetch(apiUrl('/api/meta'))
      .then(res => (res.ok ? (res.json() as Promise<BackendMeta>) : null))
      .catch(() => null);
  }
  return cached;
}

/** 把后端返回的模型标识转成界面上的可读名称，未知模型原样展示 */
export function prettyModel(model?: string): string | null {
  if (!model) return null;
  const id = model.toLowerCase();
  if (id.includes('local-knowledge')) return '本地知识库';
  if (id.includes('deepseek')) return 'DeepSeek';
  if (id.includes('qwen') || id.includes('tongyi')) return '通义千问';
  return model;
}
