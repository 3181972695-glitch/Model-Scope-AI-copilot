import { AlertTriangle, Shield, Info, FileText } from 'lucide-react';

const CARDS = [
  {
    icon: Info,
    color: 'indigo',
    title: 'AI 使用范围',
    items: ['前端代码框架生成', 'UI / UX 设计方案讨论', '模拟对话内容创作', '文档与注释撰写'],
  },
  {
    icon: Shield,
    color: 'emerald',
    title: '人工审查措施',
    items: ['所有代码经人工 Review', 'AI 对话内容人工校验', '界面设计人工调整优化', '安全与隐私合规检查'],
  },
  {
    icon: FileText,
    color: 'purple',
    title: '合规与伦理',
    items: ['遵守开源社区规范', '不收集用户个人信息', '对话内容仅供演示参考', '遵循 ModelScope 使用条款'],
  },
];

export default function AIDisclosure() {
  return (
    <section id="披露" className="relative section section-disclosure">
      <div className="container-main">
        {/* ── Section header ── */}
        <div className="text-center mb-16">
          <p className="text-xs font-semibold tracking-[0.2em] text-amber-400 uppercase mb-4">
            Transparency
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-5 tracking-tight">
            AI 使用披露
          </h2>
          <p className="text-slate-400/80 max-w-xl mx-auto">
            透明公开，负责任地使用 AI 技术
          </p>
        </div>

        {/* ── Main card ── */}
        <div className="rounded-3xl border border-amber-400/[0.06] bg-[#0c1525]/60 backdrop-blur-sm p-8 md:p-10">
          {/* Header */}
          <div className="flex flex-col items-center text-center gap-5 mb-10 p-6 rounded-2xl bg-amber-400/[0.03] border border-amber-400/[0.06]">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/10 flex items-center justify-center shrink-0">
              <AlertTriangle size={22} className="text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-2">AI 技术声明</h3>
              <p className="text-sm text-slate-400/80 leading-loose">
                本项目在开发过程中使用了 AI 辅助工具（包括但不限于大语言模型用于代码生成、内容创作和交互设计），
                所有由 AI 生成的内容均已通过人工审查和修改，确保符合项目目标与质量标准。
              </p>
            </div>
          </div>

          {/* Detail cards */}
          <div className="grid md:grid-cols-3 gap-5 stagger">
            {CARDS.map((card) => (
              <div
                key={card.title}
                className="group p-6 rounded-2xl bg-white/[0.01] border border-white/[0.04] hover:bg-white/[0.03] hover:border-white/[0.08] transition-all duration-300 text-center"
              >
                <div className={`w-10 h-10 rounded-xl bg-${card.color}-400/10 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform mx-auto`}>
                  <card.icon size={18} className={`text-${card.color}-400`} />
                </div>
                <h4 className="text-sm font-semibold text-white mb-4">{card.title}</h4>
                <ul className="space-y-3 inline-block text-left">
                  {card.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-xs text-slate-400/80 leading-loose">
                      <span className={`text-${card.color}-400/60 mt-0.5 shrink-0`}>▹</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Warning footer */}
          <div className="mt-8 p-5 rounded-2xl bg-amber-400/[0.03] border border-amber-400/[0.08] flex flex-col items-center text-center gap-3">
            <AlertTriangle size={16} className="text-amber-400/60 shrink-0" />
            <p className="text-xs text-amber-300/60 leading-loose">
              <strong className="text-amber-300/80">重要提示：</strong>
              本 Demo 中的 AI 对话基于 DeepSeek 大模型实时生成，回复内容由 AI 自动产出，可能存在不准确之处。
              实际使用中请以 ModelScope 官方文档为准。
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
