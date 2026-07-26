import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, ArrowLeft, Zap, MessageSquare } from 'lucide-react';

interface Message { role: 'user' | 'assistant'; content: string; }

const MODE_MAP: Record<string, string> = {
  onboarding: 'beginner',
  recommend: 'model',
  contribute: 'contribution',
};

const WELCOME: Record<string, string> = {
  onboarding: '👋 欢迎加入 ModelScope 开源社区！\n\n我是你的新手导航助手，可以帮你了解 ModelScope 平台的核心功能、社区规范与最佳实践。',
  recommend: '🎯 我是你的模型推荐助手！\n\n根据你的任务需求，我会从 ModelScope 平台海量模型中为你推荐最合适的选择。',
  contribute: '🚀 我是你的贡献路线规划师！\n\n开源贡献不只是写代码，文档、Issue 维护、社区运营都是重要的参与方式。',
};

async function callAPI(mode: string, question: string): Promise<string> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode, question }),
  });
  if (!res.ok) return '抱歉，AI 服务暂时不可用，请稍后重试。';
  const data = await res.json();
  return data.answer;
}

const FEATURE_META: Record<string, { label: string; gradient: string; icon: string }> = {
  onboarding: { label: '新手导航', gradient: 'from-indigo-500 to-purple-600', icon: '🧭' },
  recommend: { label: '模型推荐', gradient: 'from-cyan-400 to-teal-500', icon: '🧠' },
  contribute: { label: '贡献规划', gradient: 'from-purple-400 to-pink-500', icon: '🚀' },
};

const QUICK_REPLIES: Record<string, string[]> = {
  onboarding: ['如何注册？', '学习路径', '社区规范', '活动推荐'],
  recommend: ['图像分类', '文本生成', '语音识别', '多模态模型'],
  contribute: ['文档贡献', '代码贡献', 'Issue 维护', '社区运营'],
};

function Markdown({ text }: { text: string }) {
  const html = text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" class="text-cyan-400 underline">$1</a>')
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
  return <div className="chat-content" dangerouslySetInnerHTML={{ __html: html }} />;
}

function ChatConversation({ feature, meta }: {
  feature: string;
  meta: { label: string; gradient: string; icon: string };
}) {
  const [messages, setMessages] = useState<Message[]>(() => [
    { role: 'assistant' as const, content: WELCOME[feature] || '' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatBodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = chatBodyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const ask = async (question: string) => {
    setLoading(true);
    try {
      const answer = await callAPI(MODE_MAP[feature], question);
      setMessages(prev => [...prev, { role: 'assistant', content: answer }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '抱歉，请求超时，请重试。' }]);
    } finally {
      setLoading(false);
    }
  };

  const selectScenario = (keyword: string) => {
    setMessages([{ role: 'assistant', content: '...' }]);
    setLoading(true);
    callAPI(MODE_MAP[feature], keyword).then(answer => {
      setMessages([{ role: 'assistant', content: answer }]);
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div>
      <div ref={chatBodyRef} className="h-[560px] overflow-y-auto p-6 flex flex-col gap-5 bg-[#060b18]/60">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex gap-3 animate-fade-in-up ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-lg ${
              m.role === 'assistant'
                ? `bg-gradient-to-br ${meta.gradient}`
                : 'bg-slate-700/80'
            }`}>
              {m.role === 'assistant' ? <Bot size={16} className="text-white" /> : <User size={16} className="text-white" />}
            </div>
            <div className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              m.role === 'assistant'
                ? 'bg-white/[0.03] border border-white/[0.05] text-slate-300 rounded-tl-lg'
                : 'bg-gradient-to-br from-indigo-500/15 to-indigo-500/8 border border-indigo-400/10 text-slate-200 rounded-tr-lg'
            }`}>
              <Markdown text={m.content} />
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 animate-fade-in-up">
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${meta.gradient} flex items-center justify-center shrink-0`}>
              <Bot size={16} className="text-white" />
            </div>
            <div className="bg-white/[0.03] border border-white/[0.05] rounded-2xl rounded-tl-lg px-5 py-4">
              <div className="flex gap-1.5">
                <span className="typing-dot w-2 h-2 rounded-full bg-slate-500" />
                <span className="typing-dot w-2 h-2 rounded-full bg-slate-500" />
                <span className="typing-dot w-2 h-2 rounded-full bg-slate-500" />
              </div>
            </div>
          </div>
        )}
        <div />
      </div>

      <div className="px-6 pt-5 pb-4 border-t border-white/[0.04] bg-[#0b1424]/60">
        <p className="text-[11px] text-slate-600 mb-3">快捷选择</p>
        <div className="flex flex-wrap gap-2">
        {QUICK_REPLIES[feature]?.map((qr) => (
          <button
            type="button"
            key={qr}
            onClick={() => selectScenario(qr)}
            className="px-3 py-1.5 rounded-lg border border-white/[0.04] text-[11px] text-slate-500
              hover:text-slate-300 hover:border-white/[0.08] hover:bg-white/[0.02]
              active:scale-95 transition-all duration-200 cursor-pointer"
          >
            {qr}
          </button>
        ))}
        </div>
      </div>

      <div className="px-6 py-4 border-t border-white/[0.05] bg-[#0b1424]/90 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`向 ${meta.label} 助手提问...`}
            disabled={loading}
            className="flex-1 bg-white/[0.03] border border-white/[0.06] rounded-2xl px-5 py-3.5 text-sm
              text-white placeholder:text-slate-600
              focus:outline-none focus:border-indigo-400/30 focus:bg-white/[0.05]
              transition-all duration-200 disabled:opacity-40"
          />
          <button
            type="button"
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className={`p-3.5 rounded-2xl transition-all duration-200 ${
              input.trim() && !loading
                ? `bg-gradient-to-br ${meta.gradient} text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95`
                : 'bg-white/[0.04] text-slate-600 cursor-not-allowed'
            }`}
          >
            <Send size={18} />
          </button>
        </div>
        <div className="flex items-center gap-2 mt-2.5 text-[11px] text-slate-600">
          <Zap size={11} className="text-indigo-500" />
          基于 DeepSeek 大模型实时生成 · 内容由 AI 生成，仅供参考
        </div>
      </div>
    </div>
  );
}

export default function ChatDemo({ feature, onBack }: { feature: string | null; onBack: () => void }) {
  const meta = feature ? FEATURE_META[feature] : null;

  return (
    <section id="Demo" className="relative section section-demo">
      <div className="container-main">
        <div className="text-center mb-16">
          <p className="text-xs font-semibold tracking-[0.2em] text-cyan-400 uppercase mb-4">Interactive Demo</p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-5 tracking-tight">AI 对话体验</h2>
          <p className="text-slate-400/80 max-w-xl mx-auto">
            {meta ? `当前场景：${meta.icon} ${meta.label} — 与 AI 助手实时对话` : '请先在上方选择一个功能场景开始体验'}
          </p>
        </div>

        <div className={`rounded-3xl border overflow-hidden transition-all duration-500 ${
          meta ? 'border-white/[0.08] shadow-2xl shadow-indigo-500/5' : 'border-white/[0.04] opacity-80'
        }`}>
          <div className="flex items-center gap-3 px-6 py-4 border-b border-white/[0.05] bg-[#0b1424]/90 backdrop-blur-xl">
            {meta && (
              <button onClick={onBack} className="p-2 rounded-xl hover:bg-white/[0.06] text-slate-400 hover:text-white transition-all cursor-pointer" title="返回选择">
                <ArrowLeft size={18} />
              </button>
            )}
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${meta?.gradient || 'from-slate-600 to-slate-700'} flex items-center justify-center shadow-lg`}>
                <Bot size={17} className="text-white" />
              </div>
              <div>
                <div className="text-sm font-semibold text-white leading-tight">
                  {meta ? `Copilot · ${meta.label}` : 'ModelScope Copilot'}
                </div>
                <div className="text-[11px] text-emerald-400/80 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]" />
                  {meta ? '在线 · Ready' : '待机中'}
                </div>
              </div>
            </div>
          </div>

          {meta ? (
            <ChatConversation key={feature} feature={feature!} meta={meta} />
          ) : (
            <div className="h-[560px] flex items-center justify-center bg-[#060b18]/60">
              <div className="text-center animate-fade-in">
                <div className="w-20 h-20 rounded-3xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-center mx-auto mb-6">
                  <MessageSquare size={32} className="text-slate-600" />
                </div>
                <p className="text-slate-500 text-sm">点击上方功能卡片开始对话</p>
                <p className="text-slate-600 text-xs mt-1">AI 助手将根据场景提供个性化指导</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
