import { useState, useRef, useEffect, useMemo } from 'react';
import { Send, Bot, User, ArrowLeft, Zap } from 'lucide-react';
import Feedback from './Feedback';
import QuickActions from './QuickActions';
import { apiUrl, prettyModel } from '../lib/backend';

/** 回答来源：ai=模型实时生成；local=后端降级到本地知识库；fallback=后端不可达时的前端内置内容 */
type Source = 'ai' | 'local' | 'fallback';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  source?: Source;
  /** 产生该回答的模型标识（来自后端），用于界面如实展示 */
  model?: string;
  streaming?: boolean;
}

const MODE_MAP: Record<string, string> = {
  onboarding: 'beginner', recommend: 'model', contribute: 'contribution', summary: 'summary', health: 'health_check',
};

const WELCOME: Record<string, string> = {
  onboarding: '👋 欢迎来到魔搭社区！\n\n我是你的新手导航助手。请告诉我你的技术栈和参与目标，我会按「模型体验→Notebook工坊→发布创空间→社区贡献」全流程为你规划入门路线。\n\n💡 点击下方「✨ 演示」查看示例。',
  recommend: '🎯 我是你的模型推荐助手！\n\n请描述任务需求与硬件条件，我会从魔搭模型库中推荐最合适的模型，并附推理代码、一键Notebook入口与发布到创空间的规范。\n\n💡 点击下方「✨ 演示」查看示例。',
  contribute: '🚀 我是你的贡献路线规划师！\n\n请告诉我你的技术栈与可用时间，我会匹配魔搭社区的新手 Issue，生成 PR 描述模板与提交校验清单。\n\n💡 点击下方「✨ 演示」查看示例。',
  summary: '📋 我是社区议题分析师！\n\n请提供魔搭 GitHub Issue/Discussion 链接或内容，我会按「核心诉求/环境信息/争议分歧/当前进展/待决策事项」生成结构化摘要。\n\n💡 点击下方「✨ 演示」查看示例。',
  health: '📊 我是项目健康度诊断专家！\n\n请输入魔搭社区项目地址，我会从贡献活跃度、Issue 响应效率、文档完善度、新人友好度四个维度评估项目健康度，并给出治理优化建议。\n\n💡 点击下方「✨ 演示」查看示例。',
};

const DEMOS: Record<string, { label: string; question: string }> = {
  onboarding: { label: '🎬 前端新手入门', question: '我是前端开发者，第一次来 ModelScope，想参与社区贡献，给我入门路径' },
  recommend: { label: '🎬 老照片修复推荐', question: '我需要做老照片修复，适配西湖老影像数字化场景，推荐合适的模型' },
  contribute: { label: '🎬 新手贡献规划', question: '我熟悉 Python，每周 3 小时，想参与 modelscope/swift 仓库的文档贡献，帮我匹配 Issue' },
  summary: { label: '🎬 部署报错摘要', question: '给我一个模型部署报错 Issue 的摘要示例' },
  health: { label: '🎬 ms-swift 项目诊断', question: '帮我诊断 https://github.com/modelscope/ms-swift 的项目健康度' },
};

const DEMO_FALLBACK: Record<string, string> = {
  beginner: '🧭 **分阶段入门路线**\n\n| 阶段 | 任务 | 平台入口 | 耗时 |\n|------|------|----------|------|\n| 第1周·模型体验 | 注册账号，浏览模型库，运行在线Demo | modelscope.cn | 30min |\n| 第2-4周·上手实践 | 学习SWIFT微调框架，Notebook工坊完成首次微调 | github.com/modelscope/swift | 2h |\n| 第1-3月·社区贡献 | 认领Good First Issue，签署CLA，提交首个PR | github.com/modelscope/modelscope/issues | 3h |\n\n💡 下一步：选择一个 Good First Issue 开始你的首次贡献！',
  model: '📸 **推荐模型：ResNet-50**\n\n| 项目 | 内容 |\n|------|------|\n| 模型名称 | ResNet-50 |\n| 模型卡片 | modelscope.cn/models/xxx |\n| 参数量 | 25.6M |\n| 适用场景 | 图像分类 / 特征提取 |\n\n**推理代码：**\n```python\nfrom modelscope.pipelines import pipeline\npipe = pipeline(\'image-classification\', model=\'ResNet-50\')\nresult = pipe(\'input.jpg\')\n```\n\n📤 完成后可发布到魔搭创空间（modelscope.cn/studios），让更多开发者使用你的模型！',
  contribution: '📋 **Issue 智能匹配**\n\n| Issue | 仓库 | 难度 | 耗时 |\n|-------|------|------|------|\n| #247 文档汉化 | modelscope/swift | ⭐ 新手 | 2h |\n| #312 API文档补充 | modelscope/swift | ⭐⭐ | 3h |\n\n**PR 模板：**\n```markdown\n## 关联 Issue\nFixes #247\n## 改动说明\n汉化 README 核心章节\n## 测试\n- [x] 本地预览通过\n```\n\n✅ 提交清单：☑ CLA签署 ☑ commit格式(docs:) ☑ PR关联Issue',
  summary: '📋 **Issue 摘要分析**\n\n### 📌 核心诉求\n讨论为 Pipeline 增加 batch inference 支持\n\n### 🔧 环境信息\nmodelscope v1.18.0 / Python 3.10 / CUDA 12.1\n\n### ⚡ 争议/分歧\n方案A：新增 batch_infer() vs 方案B：infer()增加batch_size参数\n\n### 📊 当前进展\n已有 PR #567 关联，采用方案A，等待 Review\n\n### ✅ 待决策\n需维护者确认 API 设计是否符合 modelscope 接口规范',
  health_check: '### 📊 项目健康度诊断报告\n\n**综合评分：72 / 100** — 良好\n\n| 维度 | 得分 | 评级 | 说明 |\n|------|------|------|------|\n| 贡献活跃度 | 75 | 良好 | 每周约 8 次提交，3 位活跃贡献者 |\n| Issue 响应效率 | 60 | 一般 | 平均首次响应 2 天，15% 超 30 天未解决 |\n| 文档完善度 | 85 | 优秀 | README 完整，API 文档与示例代码齐全 |\n| 新人友好度 | 68 | 一般 | 有 Good First Issue，但缺少新手教程 |\n\n### 🛠 治理优化建议\n\n1. **建立 Issue 响应 SLA** — 设定 48 小时首次响应目标，用 issue-bot 自动打标签分流\n2. **补充新手入门文档** — 新增 CONTRIBUTING_CN.md 并关联魔搭新手教程\n3. **定期社区同步会** — 每两周一次线上 Office Hour 同步进展、收集反馈\n\n⚠ 演示数据，请以实际仓库指标为准',
};

interface StreamHandlers {
  onMeta?: (source: Source, model?: string) => void;
  onThinking?: () => void;
  onDelta: (text: string) => void;
  onError?: (message: string) => void;
}

/**
 * 非流式请求后端，作为流式接口不可用时的回退。
 *
 * 兼容两种响应结构：本项目后端返回 { answer, source }；
 * 简化后端只返回 { answer }，此时按实时生成处理。
 */
async function syncChat(
  mode: string,
  question: string,
  history: { role: string; content: string }[],
): Promise<{ answer: string; source: Source; model?: string }> {
  const res = await fetch(apiUrl('/api/chat'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode, question, history }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data: { answer?: unknown; source?: unknown; model?: unknown } = await res.json();
  const answer = typeof data.answer === 'string' ? data.answer : '';
  if (!answer.trim()) throw new Error('后端返回空内容');
  return {
    answer,
    source: data.source === 'local' ? 'local' : 'ai',
    model: typeof data.model === 'string' ? data.model : undefined,
  };
}

/**
 * 后端是否已知不支持流式接口。
 *
 * 首次探测到 404/405（接口不存在）后记住结论，后续请求直接走非流式，
 * 避免每个场景都白发一次请求、控制台堆一串 404。
 * 网络抖动等临时故障不会写入此标记，不影响下次继续尝试流式。
 */
let streamUnsupported = false;

/**
 * 请求后端并产出回答，按三级降级保证任何部署形态下页面都可用：
 *   ① POST /api/chat/stream  流式，逐块回调 onDelta，首字 1 秒级
 *   ② POST /api/chat         非流式回退，兼容尚未提供 /stream 的部署
 *   ③ 前端内置内容           后端整体不可达时兜底，并如实标注来源为 fallback
 * 通过 onMeta 如实回调内容来源，避免把降级内容当作模型输出。
 */
async function askCopilot(
  mode: string,
  question: string,
  history: { role: string; content: string }[],
  handlers: StreamHandlers,
): Promise<Source> {
  let streamStatus: number | undefined;

  // ① 流式
  if (!streamUnsupported) {
    try {
      const res = await fetch(apiUrl('/api/chat/stream'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, question, history }),
      });
      if (!res.ok || !res.body) {
        streamStatus = res.status;
        if (res.status === 404 || res.status === 405) streamUnsupported = true;
        throw new Error(`HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let source: Source = 'ai';

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // SSE 事件以空行分隔，最后一段可能不完整，留在 buffer 中
        const chunks = buffer.split('\n\n');
        buffer = chunks.pop() ?? '';

        for (const chunk of chunks) {
          const line = chunk.trim();
          if (!line.startsWith('data:')) continue;
          const payload = line.slice(5).trim();
          if (!payload) continue;

          let event: { type?: string; text?: string; source?: string; message?: string; model?: string };
          try {
            event = JSON.parse(payload);
          } catch {
            continue;
          }

          if (event.type === 'meta') {
            source = event.source === 'local' ? 'local' : 'ai';
            handlers.onMeta?.(source, typeof event.model === 'string' ? event.model : undefined);
          } else if (event.type === 'delta') {
            handlers.onDelta(event.text ?? '');
          } else if (event.type === 'thinking') {
            handlers.onThinking?.();
          } else if (event.type === 'error') {
            handlers.onError?.(event.message ?? '服务异常，请稍后重试。');
          }
        }
      }

      return source;
    } catch {
      // ① 流式不可用（后端尚未提供 /stream，或流中断）→ 继续尝试 ②
    }
  }

  // ② 非流式回退
  try {
    const { answer, source, model } = await syncChat(mode, question, history);
    handlers.onMeta?.(source, model);
    handlers.onDelta(answer);
    return source;
  } catch {
    // ② 也不可用 → 落到 ③
  }

  // ③ 前端内置内容兜底
  handlers.onMeta?.('fallback');
  handlers.onDelta(
    streamStatus === 429
      ? `⏳ 当前访问过于频繁（已触发限流），请稍等片刻再试。\n\n以下为内置示例内容：\n\n${DEMO_FALLBACK[mode] || ''}`
      : DEMO_FALLBACK[mode] || '👋 AI 服务暂未连接。以下为内置演示内容，完整功能需后端服务在线。',
  );
  return 'fallback';
}

const FEATURE_META: Record<string, { label: string; icon: string; desc: string }> = {
  onboarding: { label: '新手导航', icon: '🧭', desc: '分阶段入门路径指引' },
  recommend: { label: '模型推荐', icon: '🧠', desc: '匹配最佳模型与代码' },
  contribute: { label: '贡献规划', icon: '🚀', desc: 'Issue 匹配与 PR 指导' },
  summary: { label: '议题摘要', icon: '📋', desc: '结构化分析社区讨论' },
  health: { label: '健康度诊断', icon: '📊', desc: '多维度项目评估' },
};

const QUICK_REPLIES: Record<string, string[]> = {
  onboarding: ['我是 Python 新手', '我想参与代码贡献', '我想发布模型'],
  recommend: ['图像分类', '文本生成', '语音识别', '多模态模型'],
  contribute: ['文档贡献', '代码贡献', 'Issue 维护', '社区运营'],
  summary: ['分析 Issue', '分析 Discussion', '社区动态简报'],
  health: ['诊断 CV 项目', '诊断 NLP 项目', '诊断多模态项目'],
};

/* ── Markdown renderer — safe HTML escaping + tables/code/lists ── */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** 只放行安全协议，阻断 javascript: / data: / vbscript: 等危险 scheme */
const SAFE_LINK_SCHEME = /^(https?:|mailto:)/i;

function inlineMd(s: string): string {
  return s
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_match, text: string, href: string) => {
      const url = href.trim();
      if (!SAFE_LINK_SCHEME.test(url)) return text;
      return `<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>`;
    });
}

function renderMarkdown(text: string): string {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const out: string[] = [];
  let inCode = false;
  let codeBuf: string[] = [];
  let inTable = false;
  let isHeaderRow = true;
  let listType: 'ul' | 'ol' | null = null;
  let listBuf: string[] = [];

  // 先转义 HTML，再做行内 Markdown 解析
  const inline = (s: string) => inlineMd(escapeHtml(s));

  const closeList = () => {
    if (listType && listBuf.length) {
      out.push(`<${listType}>${listBuf.join('')}</${listType}>`);
    }
    listType = null;
    listBuf = [];
  };

  const closeTable = () => {
    if (inTable) {
      out.push('</tbody></table></div>');
      inTable = false;
      isHeaderRow = true;
    }
  };

  for (const raw of lines) {
    const line = raw.trim();

    // ── Code fences ──
    if (line.startsWith('```')) {
      if (inCode) {
        out.push(
          `<pre class="code-block"><button type="button" class="code-copy" data-copy aria-label="复制代码">复制</button><code>${escapeHtml(codeBuf.join('\n'))}</code></pre>`
        );
        codeBuf = [];
        inCode = false;
      } else {
        closeList();
        closeTable();
        inCode = true;
      }
      continue;
    }
    if (inCode) {
      codeBuf.push(raw);
      continue;
    }

    // ── Tables ──
    if (/^\|.*\|$/.test(line)) {
      closeList();
      if (/^\|[\s:|-]+\|$/.test(line) && line.includes('-')) continue; // separator row
      const cells = line.split('|').slice(1, -1).map(c => inline(c.trim()));
      if (!inTable) {
        inTable = true;
        isHeaderRow = true;
        // 外层包一层滚动容器，窄屏下宽表格不会撑破气泡
        out.push('<div class="table-wrap"><table>');
      }
      if (isHeaderRow) {
        out.push(`<thead><tr>${cells.map(c => `<th>${c}</th>`).join('')}</tr></thead><tbody>`);
        isHeaderRow = false;
      } else {
        out.push(`<tr>${cells.map(c => `<td>${c}</td>`).join('')}</tr>`);
      }
      continue;
    }
    closeTable();

    // ── Headings ──
    const heading = /^(#{1,3})\s+(.*)$/.exec(line);
    if (heading) {
      closeList();
      const level = heading[1].length;
      out.push(`<h${level}>${inline(heading[2])}</h${level}>`);
      continue;
    }

    // ── Lists ──
    const ul = /^[-*→]\s+(.*)$/.exec(line);
    const ol = /^\d+[.)]\s+(.*)$/.exec(line);
    if (ul || ol) {
      closeTable();
      const type = ul ? 'ul' : 'ol';
      const content = inline((ul ? ul[1] : ol![1]).trim());
      if (listType !== type) {
        closeList();
        listType = type;
      }
      listBuf.push(`<li>${content}</li>`);
      continue;
    }
    closeList();

    if (line === '') {
      out.push('<br/>');
      continue;
    }

    out.push(`<p>${inline(line)}</p>`);
  }

  if (inCode) {
    out.push(
      `<pre class="code-block"><button type="button" class="code-copy" data-copy aria-label="复制代码">复制</button><code>${escapeHtml(codeBuf.join('\n'))}</code></pre>`
    );
  }
  closeList();
  closeTable();
  return out.join('\n');
}

function Markdown({ text }: { text: string }) {
  const html = useMemo(() => renderMarkdown(text), [text]);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const btn = (e.target as HTMLElement).closest('button[data-copy]') as HTMLButtonElement | null;
    if (!btn) return;
    const code = btn.closest('pre')?.querySelector('code');
    if (!code) return;
    const copyText = code.textContent || '';
    const done = () => {
      btn.textContent = '已复制';
      btn.setAttribute('data-copied', 'true');
      window.setTimeout(() => {
        btn.textContent = '复制';
        btn.removeAttribute('data-copied');
      }, 1500);
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(copyText).then(done).catch(done);
    } else {
      done();
    }
  };

  return (
    <div
      className="chat-content"
      onClick={handleClick}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

const SOURCE_META: Record<Source, { label: string; className: string; title: string }> = {
  ai: {
    label: 'AI 实时生成',
    className: 'text-indigo-300/80 border-indigo-400/20 bg-indigo-400/[0.07]',
    title: '内容由后端大模型实时生成',
  },
  local: {
    label: '本地知识库降级',
    className: 'text-amber-300/80 border-amber-400/25 bg-amber-400/[0.07]',
    title: 'AI 服务暂不可用，本回答来自后端本地知识库，用以保证服务不中断',
  },
  fallback: {
    label: '内置演示内容',
    className: 'text-slate-400 border-white/10 bg-white/[0.04]',
    title: '后端未连接，本回答为前端内置演示内容',
  },
};

/** 如实标注每条回答的内容来源与实际模型，避免把降级内容误认为模型输出 */
function SourceBadge({ source, model }: { source: Source; model?: string }) {
  const meta = SOURCE_META[source];
  const name = source === 'ai' ? prettyModel(model) : null;
  const label = name ? `${name} 实时生成` : meta.label;
  const title = name ? `内容由 ${model} 实时生成` : meta.title;
  return (
    <span
      title={title}
      className={`mt-2.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] cursor-help ${meta.className}`}
    >
      <span className="w-1 h-1 rounded-full bg-current opacity-70" />
      {label}
    </span>
  );
}

/* ── Chat conversation (feature active) ── */
function ChatConversation({ feature }: { feature: string }) {
  const [messages, setMessages] = useState<Message[]>(() => [{ role: 'assistant' as const, content: WELCOME[feature] || '' }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  // 推理模型会先输出思维链再给正式回答，用于区分「正在推理」与「正在连接」
  const [thinking, setThinking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatBodyRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);

  // 用户停留在底部附近时才自动滚动
  useEffect(() => {
    const el = chatBodyRef.current;
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight;
  }, [messages, loading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleChatScroll = () => {
    const el = chatBodyRef.current;
    if (!el) return;
    stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 140;
  };

  const clearChat = () => {
    setMessages([{ role: 'assistant', content: WELCOME[feature] || '' }]);
    setInput('');
    setLoading(false);
    setThinking(false);
    stickToBottom.current = true;
    inputRef.current?.focus();
  };

  /** 就地更新最后一条消息（流式增量与来源标记都作用在它上面） */
  const patchLast = (updater: (m: Message) => Message) => {
    setMessages(prev => {
      if (!prev.length) return prev;
      const next = [...prev];
      next[next.length - 1] = updater(next[next.length - 1]);
      return next;
    });
  };

  const ask = (question: string) => {
    // 历史不含欢迎语（第 0 条是前端自我介绍）与本轮提问，供模型理解追问
    const history = messages
      .slice(1)
      .filter(m => m.content.trim())
      .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    setLoading(true);
    setThinking(false);
    setMessages(prev => [...prev, { role: 'assistant', content: '', streaming: true }]);

    askCopilot(MODE_MAP[feature], question, history, {
      onMeta: (source, model) => patchLast(m => ({ ...m, source, model })),
      onThinking: () => setThinking(true),
      onDelta: text => {
        setThinking(false);
        patchLast(m => ({ ...m, content: m.content + text }));
      },
      onError: message => patchLast(m => ({ ...m, content: `${m.content}\n\n> ⚠️ ${message}` })),
    }).finally(() => {
      setLoading(false);
      setThinking(false);
      patchLast(m => ({ ...m, streaming: false }));
    });
  };

  const selectScenario = (keyword: string) => {
    if (loading) return;
    setMessages(prev => [...prev, { role: 'user', content: keyword }]);
    ask(keyword);
  };

  const handleSend = (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setInput('');
    ask(msg);
  };

  return (
    <div className="flex flex-col h-[640px]">
      {/* ── Messages ── */}
      <div ref={chatBodyRef} onScroll={handleChatScroll} className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : ''}`}
            style={{ animation: 'fadeInUp 0.35s ease-out forwards' }}>
            {/* AI avatar */}
            {m.role === 'assistant' && (
              <div className="w-7 h-7 rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center shrink-0 mt-0.5">
                <Bot size={13} className="text-slate-400" />
              </div>
            )}
            {/* Bubble */}
            <div className={`text-sm leading-relaxed ${
              m.role === 'assistant'
                ? 'max-w-[80%] px-4 py-3 bg-white/[0.04] border border-white/[0.07] rounded-2xl rounded-tl-md text-slate-200'
                : 'max-w-[75%] px-4 py-3 bg-gradient-to-br from-indigo-600/60 to-purple-600/60 border border-indigo-400/20 rounded-2xl rounded-tr-md text-white shadow-sm shadow-indigo-500/10'
            }`}>
              {m.role === 'assistant' && m.content === '' ? (
                <span className="inline-flex items-center gap-2 text-slate-400">
                  <span className="flex gap-1">
                    <span className="typing-dot w-1.5 h-1.5 rounded-full bg-slate-500" />
                    <span className="typing-dot w-1.5 h-1.5 rounded-full bg-slate-500" />
                    <span className="typing-dot w-1.5 h-1.5 rounded-full bg-slate-500" />
                  </span>
                  <span className="text-[11px]">{thinking ? '模型正在推理…' : '正在连接…'}</span>
                </span>
              ) : (
                <Markdown text={m.content} />
              )}
              {/* 流结束后标注内容来源 */}
              {m.role === 'assistant' && !m.streaming && m.source && <SourceBadge source={m.source} model={m.model} />}
            </div>
            {/* User avatar */}
            {m.role === 'user' && (
              <div className="w-7 h-7 rounded-lg bg-indigo-500/80 flex items-center justify-center shrink-0 mt-0.5">
                <User size={13} className="text-white" />
              </div>
            )}
          </div>
        ))}

        {/* Feedback */}
        {messages.length > 1 && !loading && (
          <div className="px-1">
            <Feedback feature={feature} question={messages.find(m => m.role === 'user')?.content || ''} />
          </div>
        )}
      </div>

      {/* ── Quick actions ── */}
      <QuickActions
        items={QUICK_REPLIES[feature] || []}
        demoLabel={DEMOS[feature]?.label}
        demoQuestion={DEMOS[feature]?.question}
        onSelect={selectScenario}
      />

      {/* ── Input (sticky bottom) ── */}
      <div className="px-4 pb-4">
        <div className="flex items-center gap-2.5 bg-white/[0.04] border border-white/[0.08] rounded-3xl px-4 py-2 focus-within:border-indigo-500/40 focus-within:bg-white/[0.06] focus-within:shadow-[0_0_0_3px_rgba(99,102,241,0.08)] transition-all duration-200">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="描述你的 AI 任务，或选择一个方向..."
            disabled={loading}
            className="flex-1 bg-transparent border-none outline-none text-sm text-slate-100 placeholder:text-slate-500 py-2 disabled:opacity-40 min-w-0"
            aria-label="输入消息"
          />
          <button
            type="button"
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 ${
              input.trim() && !loading
                ? 'bg-indigo-500 text-white hover:bg-indigo-400 active:scale-90 shadow-sm shadow-indigo-500/25'
                : 'bg-white/[0.06] text-slate-600 cursor-not-allowed'
            }`}
          >
            <Send size={14} />
          </button>
        </div>
        <p className="text-center text-[10px] text-slate-600 mt-2.5 flex items-center justify-center gap-1">
          <Zap size={9} className="text-indigo-500/30" />
          内容由后端大模型实时生成 · 每条回答标注来源与模型，仅供参考
          {messages.length > 1 && (
            <button
              type="button"
              onClick={clearChat}
              className="ml-3 text-slate-500 hover:text-slate-300 hover:underline transition-colors cursor-pointer"
            >
              清空对话
            </button>
          )}
        </p>
      </div>
    </div>
  );
}

/* ── Main ChatDemo export ── */
export default function ChatDemo({ feature, onBack }: {
  feature: string | null;
  onBack: () => void;
}) {
  const meta = feature ? FEATURE_META[feature] : null;

  return (
    <section id="Demo" className="relative section-demo flex justify-center">
      <div className="w-full max-w-[900px] px-4 md:px-6">
        {/* ── Chat state ── */}
        {meta ? (
          <div className="rounded-2xl border border-white/[0.08] bg-[#0B1220]/80 backdrop-blur-lg shadow-xl shadow-black/10 overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-3 border-b border-white/[0.06] bg-white/[0.015]">
              <button
                onClick={onBack}
                className="p-1.5 rounded-lg hover:bg-white/[0.06] text-slate-400 hover:text-white transition-all duration-200 cursor-pointer"
              >
                <ArrowLeft size={16} />
              </button>

              <div className="w-7 h-7 rounded-lg bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center shrink-0">
                <span className="text-sm">{meta.icon}</span>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white leading-tight">
                  {meta.label} <span className="text-slate-500 font-normal text-xs">助手</span>
                </p>
                <p className="text-[10px] text-slate-500">{meta.desc}</p>
              </div>

              <span className="flex items-center gap-1 text-[10px] text-slate-500">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.4)] animate-pulse" />
                在线
              </span>
            </div>

            {/* Chat body */}
            <ChatConversation key={feature} feature={feature!} />
          </div>
        ) : (
          <div className="rounded-2xl border border-white/[0.06] bg-[#0B1220]/60 backdrop-blur-md shadow-lg shadow-black/10 overflow-hidden">
            <div className="h-[400px] flex items-center justify-center">
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/15 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🤖</span>
                </div>
                <p className="text-slate-400 text-sm font-medium">ModelScope Copilot</p>
                <p className="text-slate-600 text-xs mt-1.5">点击上方功能卡片选择场景，开始 AI 对话</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
