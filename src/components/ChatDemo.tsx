import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, ArrowLeft, Zap, MessageSquare } from 'lucide-react';
import Feedback from './Feedback';

interface Message { role: 'user' | 'assistant'; content: string; }

const MODE_MAP: Record<string, string> = {
  onboarding: 'beginner', recommend: 'model', contribute: 'contribution', summary: 'summary', health: 'health_check',
};

const WELCOME: Record<string, string> = {
  onboarding: '👋 欢迎来到魔搭社区！\n\n我是你的新手导航助手。请告诉我你的技术栈和参与目标，我会按「模型体验→Notebook工坊→发布创空间→社区贡献」全流程为你规划入门路线。\n\n💡 点击下方「🎬 演示」查看示例。',
  recommend: '🎯 我是你的模型推荐助手！\n\n请描述任务需求与硬件条件，我会从魔搭模型库中推荐最合适的模型，并附推理代码、一键Notebook入口与发布到创空间的规范。\n\n💡 点击下方「🎬 演示」查看示例。',
  contribute: '🚀 我是你的贡献路线规划师！\n\n请告诉我你的技术栈与可用时间，我会匹配魔搭社区的新手 Issue，生成 PR 描述模板与提交校验清单。\n\n💡 点击下方「🎬 演示」查看示例。',
  summary: '📋 我是社区议题分析师！\n\n请提供魔搭 GitHub Issue/Discussion 链接或内容，我会按「核心诉求/环境信息/争议分歧/当前进展/待决策事项」生成结构化摘要。\n\n💡 点击下方「🎬 演示」查看示例。',
  health: '📊 我是项目健康度诊断专家！\n\n请输入魔搭社区项目地址，我会从贡献活跃度、Issue 响应效率、文档完善度、新人友好度四个维度评估项目健康度，并给出治理优化建议。\n\n💡 点击下方「🎬 演示」查看示例。',
};

const DEMOS: Record<string, { label: string; question: string }> = {
  onboarding: { label: '🎬 演示：前端新手入门', question: '我是前端开发者，第一次来 ModelScope，想参与社区贡献，给我入门路径' },
  recommend: { label: '🎬 演示：老照片修复推荐', question: '我需要做老照片修复，适配西湖老影像数字化场景，推荐合适的模型' },
  contribute: { label: '🎬 演示：新手贡献规划', question: '我熟悉 Python，每周 3 小时，想参与 modelscope/swift 仓库的文档贡献，帮我匹配 Issue' },
  summary: { label: '🎬 演示：部署报错摘要', question: '给我一个模型部署报错 Issue 的摘要示例' },
  health: { label: '🎬 演示：CV 模型项目诊断', question: '帮我诊断 ModelScope 上一个主流 CV 模型项目的健康度' },
};

const DEMO_FALLBACK: Record<string, string> = {
  beginner: '🧭 **分阶段入门路线**\n\n| 阶段 | 任务 | 平台入口 | 耗时 |\n|------|------|----------|------|\n| 第1周·模型体验 | 注册账号，浏览模型库，运行在线Demo | modelscope.cn | 30min |\n| 第2-4周·上手实践 | 学习SWIFT微调框架，Notebook工坊完成首次微调 | github.com/modelscope/swift | 2h |\n| 第1-3月·社区贡献 | 认领Good First Issue，签署CLA，提交首个PR | github.com/modelscope/modelscope/issues | 3h |\n\n💡 下一步：选择一个 Good First Issue 开始你的首次贡献！',
  model: '📸 **推荐模型：ResNet-50**\n\n| 项目 | 内容 |\n|------|------|\n| 模型名称 | ResNet-50 |\n| 模型卡片 | modelscope.cn/models/xxx |\n| 参数量 | 25.6M |\n| 适用场景 | 图像分类 / 特征提取 |\n\n**推理代码：**\n```python\nfrom modelscope.pipelines import pipeline\npipe = pipeline(\'image-classification\', model=\'ResNet-50\')\nresult = pipe(\'input.jpg\')\n```\n\n📤 完成后可发布到魔搭创空间（modelscope.cn/studios），让更多开发者使用你的模型！',
  contribution: '📋 **Issue 智能匹配**\n\n| Issue | 仓库 | 难度 | 耗时 |\n|-------|------|------|------|\n| #247 文档汉化 | modelscope/swift | ⭐ 新手 | 2h |\n| #312 API文档补充 | modelscope/swift | ⭐⭐ | 3h |\n\n**PR 模板：**\n```markdown\n## 关联 Issue\nFixes #247\n## 改动说明\n汉化 README 核心章节\n## 测试\n- [x] 本地预览通过\n```\n\n✅ 提交清单：☑ CLA签署 ☑ commit格式(docs:) ☑ PR关联Issue',
  summary: '📋 **Issue 摘要分析**\n\n### 📌 核心诉求\n讨论为 Pipeline 增加 batch inference 支持\n\n### 🔧 环境信息\nmodelscope v1.18.0 / Python 3.10 / CUDA 12.1\n\n### ⚡ 争议/分歧\n方案A：新增 batch_infer() vs 方案B：infer()增加batch_size参数\n\n### 📊 当前进展\n已有 PR #567 关联，采用方案A，等待 Review\n\n### ✅ 待决策\n需维护者确认 API 设计是否符合 modelscope 接口规范',
  health_check: '{"overall_score":72,"dimensions":[{"name":"贡献活跃度","score":75,"level":"良好","comment":"每周8次提交，3位活跃贡献者"},{"name":"Issue响应效率","score":60,"level":"一般","comment":"平均响应2天，15%超30天未解决"},{"name":"文档完善度","score":85,"level":"优秀","comment":"README完整，API文档与示例代码齐全"},{"name":"新人友好度","score":68,"level":"一般","comment":"有Good First Issue但缺少新手教程"}],"suggestions":[{"priority":1,"title":"建立Issue响应SLA","detail":"48小时首次响应目标，issue-bot自动打标签"},{"priority":2,"title":"补充新手入门文档","detail":"新增CONTRIBUTING_CN.md关联魔搭新手教程"},{"priority":3,"title":"定期社区同步会","detail":"每两周线上Office Hour同步进展收集反馈"}]}',
};

async function callAPI(mode: string, question: string): Promise<string> {
  const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode, question }) });
  if (res.ok) { const data = await res.json(); return data.answer; }
  return DEMO_FALLBACK[mode] || '👋 演示模式 — AI 服务未连接。以下是该场景的预设演示回复，完整功能需启动后端服务。';
}

const FEATURE_META: Record<string, { label: string; gradient: string; icon: string }> = {
  onboarding: { label: '新手导航', gradient: 'from-blue-500 to-purple-600', icon: '🧭' },
  recommend: { label: '模型推荐', gradient: 'from-cyan-400 to-teal-500', icon: '🧠' },
  contribute: { label: '贡献规划', gradient: 'from-purple-400 to-pink-500', icon: '🚀' },
  summary: { label: '议题摘要', gradient: 'from-amber-400 to-orange-500', icon: '📋' },
  health: { label: '健康度诊断', gradient: 'from-emerald-400 to-teal-500', icon: '📊' },
};

const QUICK_REPLIES: Record<string, string[]> = {
  onboarding: ['我是 Python 新手', '我想参与代码贡献', '我想发布模型'],
  recommend: ['图像分类', '文本生成', '语音识别', '多模态模型'],
  contribute: ['文档贡献', '代码贡献', 'Issue 维护', '社区运营'],
  summary: ['分析 Issue', '分析 Discussion', '社区动态简报'],
  health: ['诊断 CV 项目', '诊断 NLP 项目', '诊断多模态项目'],
};

function Markdown({ text }: { text: string }) {
  const html = text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" class="text-[#5B9BFF] underline">$1</a>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .split('\n')
    .map((line) => {
      if (/^\|.*\|$/.test(line)) {
        const cells = line.split('|').filter(Boolean).map(c => c.trim());
        if (line.includes('---')) return '';
        if (/^[-–—]+$/.test(cells[0] || '')) return '';
        return `<tr>${cells.map((c: string) => `<td>${c}</td>`).join('')}</tr>`;
      }
      if (line.startsWith('### ')) return `<h3>${line.slice(4)}</h3>`;
      if (line.startsWith('## ')) return `<h2>${line.slice(3)}</h2>`;
      if (line.startsWith('# ')) return `<h1>${line.slice(2)}</h1>`;
      if (line.startsWith('- ') || line.startsWith('→ ')) return `<li>${line.slice(2)}</li>`;
      if (/^\d+\.\s/.test(line)) return `<li>${line.replace(/^\d+\.\s/, '')}</li>`;
      if (line === '') return '<br/>';
      return `<p>${line}</p>`;
    })
    .join('\n')
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
    .replace(/(<tr>.*<\/tr>\n?)+/g, '<table>$&</table>');
  return <div className="chat-content text-slate-200" dangerouslySetInnerHTML={{ __html: html }} />;
}

function ChatConversation({ feature, meta }: { feature: string; meta: { label: string; gradient: string; icon: string } }) {
  const [messages, setMessages] = useState<Message[]>(() => [{ role: 'assistant' as const, content: WELCOME[feature] || '' }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatBodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => { const el = chatBodyRef.current; if (el) el.scrollTop = el.scrollHeight; }, [messages]);

  const ask = (question: string) => {
    setLoading(true);
    callAPI(MODE_MAP[feature], question).then(answer => {
      setMessages(prev => [...prev, { role: 'assistant', content: answer }]);
      setLoading(false);
    }).catch(() => {
      setMessages(prev => [...prev, { role: 'assistant', content: '请求超时，请重试。' }]);
      setLoading(false);
    });
  };

  const selectScenario = (keyword: string) => {
    setMessages([{ role: 'user', content: keyword }]);
    setLoading(true);
    callAPI(MODE_MAP[feature], keyword).then(answer => {
      setMessages([{ role: 'user', content: keyword }, { role: 'assistant', content: answer }]);
      setLoading(false);
    });
  };

  const handleSend = (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setInput('');
    ask(msg);
  };

  return (
    <div>
      {/* Messages */}
      <div ref={chatBodyRef} className="h-[560px] overflow-y-auto p-5 flex flex-col gap-4 bg-transparent">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`} style={{ animation: 'fadeInUp 0.3s ease-out forwards' }}>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${m.role === 'assistant' ? 'bg-white/[0.06] border border-white/[0.08]' : 'bg-[#165DFF]'}`}>
              {m.role === 'assistant' ? <Bot size={14} className="text-slate-300" /> : <User size={14} className="text-white" />}
            </div>
            <div className={`max-w-[85%] rounded-2xl px-5 py-4 text-sm leading-relaxed ${m.role === 'assistant' ? 'bg-white/[0.04] border border-white/[0.06] text-slate-200 rounded-tl-md' : 'bg-[#165DFF]/90 text-white rounded-tr-md'}`}>
              <Markdown text={m.content} />
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3" style={{ animation: 'fadeInUp 0.3s ease-out forwards' }}>
            <div className="w-8 h-8 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center shrink-0"><Bot size={14} className="text-slate-300" /></div>
            <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl rounded-tl-md px-4 py-3"><div className="flex gap-1.5"><span className="typing-dot w-2 h-2 rounded-full bg-slate-400"/><span className="typing-dot w-2 h-2 rounded-full bg-slate-400"/><span className="typing-dot w-2 h-2 rounded-full bg-slate-400"/></div></div>
          </div>
        )}
        {messages.length > 0 && !loading && (
          <div className="px-1"><Feedback feature={feature} question={messages.find(m => m.role === 'user')?.content || ''} /></div>
        )}
        <div />
      </div>

      {/* Quick replies */}
      <div className="px-5 pt-4 pb-3 border-t border-white/[0.06] bg-white/[0.02] backdrop-blur-sm">
        <p className="text-[10px] text-slate-400 font-medium mb-3">快捷选择</p>
        <div className="flex flex-wrap gap-2">
          {QUICK_REPLIES[feature]?.map(qr => (
            <button type="button" key={qr} onClick={() => selectScenario(qr)}
              className="px-3.5 py-2 rounded-full border border-white/[0.08] text-[11px] text-slate-300 bg-white/[0.04] hover:text-white hover:border-[#165DFF]/40 hover:bg-white/[0.06] hover:-translate-y-0.5 active:scale-95 transition-all duration-200 ease-out cursor-pointer">{qr}</button>
          ))}
          {DEMOS[feature] && (
            <button type="button" onClick={() => selectScenario(DEMOS[feature].question)}
              className="px-3.5 py-2 rounded-full border border-[#165DFF]/40 text-[11px] text-[#4d94ff] bg-[#165DFF]/15 shadow-sm shadow-[#165DFF]/20 hover:text-white hover:border-[#165DFF]/60 hover:bg-[#165DFF]/25 hover:-translate-y-0.5 active:scale-95 transition-all duration-200 ease-out cursor-pointer">{DEMOS[feature].label}</button>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="px-5 pt-3 pb-4 border-t border-white/[0.06] bg-white/[0.02] backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <input ref={inputRef} type="text" value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder={`向 ${meta.label} 助手提问...`} disabled={loading}
            className="flex-1 bg-white/[0.05] border border-white/[0.08] rounded-2xl px-5 py-3.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-[#165DFF]/50 focus:ring-1 focus:ring-[#165DFF]/30 transition-all duration-200 ease-out disabled:opacity-40" />
          <button type="button" onClick={() => handleSend()} disabled={!input.trim() || loading}
            className={`shrink-0 p-3.5 rounded-2xl transition-all duration-200 ease-out ${input.trim() && !loading ? 'bg-[#165DFF] text-white shadow-md shadow-[#165DFF]/25 hover:bg-[#165DFF]/90 hover:shadow-lg hover:shadow-[#165DFF]/35 active:scale-95' : 'bg-white/[0.04] text-slate-500 cursor-not-allowed opacity-50'}`}>
            <Send size={17} />
          </button>
        </div>
        <p className="text-center text-[10px] text-slate-500 mt-3 flex items-center justify-center gap-1.5"><Zap size={10} className="text-[#165DFF]/60" />基于 DeepSeek V4 Pro · 内容由 AI 生成，仅供参考</p>
      </div>
    </div>
  );
}

export default function ChatDemo({ feature, onBack }: { feature: string | null; onBack: () => void }) {
  const meta = feature ? FEATURE_META[feature] : null;
  return (
    <section id="Demo" className="relative section section-demo">
      <div className="container-main">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold tracking-[0.2em] text-cyan-400 uppercase mb-4">Interactive Demo</p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-4 tracking-tight">AI 对话体验</h2>
          <p className="text-slate-400/80 max-w-xl mx-auto text-sm">{meta ? `当前场景：${meta.icon} ${meta.label} — 与 AI 助手实时对话` : '请先在上方选择一个功能场景开始体验'}</p>
        </div>

        <div className={`rounded-3xl border overflow-hidden transition-all duration-500 bg-white/[0.02] backdrop-blur-2xl ${meta ? 'border-white/[0.08] shadow-2xl shadow-[#165DFF]/5' : 'border-white/[0.04] opacity-80'}`}>
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.06] bg-white/[0.02]">
            {meta && <button onClick={onBack} className="p-2 rounded-xl hover:bg-white/[0.06] text-slate-400 hover:text-white transition-all cursor-pointer"><ArrowLeft size={17} /></button>}
            <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${meta?.gradient || 'from-slate-600 to-slate-700'} flex items-center justify-center`}><Bot size={15} className="text-white" /></div>
            <div>
              <p className="text-sm font-semibold text-white leading-tight">{meta ? `Copilot · ${meta.label}` : 'ModelScope Copilot'}</p>
              <p className="text-[10px] text-emerald-400/80 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]"/>{meta ? '在线 · Ready' : '待机中'}</p>
            </div>
          </div>

          {meta ? <ChatConversation key={feature} feature={feature!} meta={meta} /> : (
            <div className="h-[560px] flex items-center justify-center bg-transparent">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#165DFF]/20 to-[#5B9BFF]/10 border border-[#165DFF]/10 flex items-center justify-center mx-auto mb-5"><MessageSquare size={28} className="text-[#5B9BFF]" /></div>
                <p className="text-slate-400 text-sm">点击上方功能卡片开始对话</p>
                <p className="text-slate-500 text-xs mt-1">AI 助手将根据场景提供个性化指导</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
