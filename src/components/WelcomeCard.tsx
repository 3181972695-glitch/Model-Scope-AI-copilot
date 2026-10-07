import { Sparkles, BookOpen, GitPullRequest } from 'lucide-react';

interface WelcomeCardProps {
  onSelect: (feature: string) => void;
}

const CARDS = [
  {
    id: 'recommend',
    icon: Sparkles,
    title: '模型推荐',
    desc: '根据任务选择最佳模型',
    cta: '开始探索',
  },
  {
    id: 'onboarding',
    icon: BookOpen,
    title: '学习路线',
    desc: '制定 AI 学习路径',
    cta: '生成路线',
  },
  {
    id: 'contribute',
    icon: GitPullRequest,
    title: '开源贡献',
    desc: '找到适合你的贡献方式',
    cta: '参与社区',
  },
];

export default function WelcomeCard({ onSelect }: WelcomeCardProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6">
      {/* Logo */}
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/10 border border-indigo-500/20 flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/5">
        <span className="text-3xl">🤖</span>
      </div>

      {/* Title */}
      <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">ModelScope Copilot</h2>
      <p className="text-sm text-slate-400 mb-12">你的 AI 模型探索与开源助手</p>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl">
        {CARDS.map((card) => (
          <button
            key={card.id}
            type="button"
            onClick={() => onSelect(card.id)}
            className="group relative flex flex-col items-center gap-4 p-6 rounded-2xl bg-[#0B1220] border border-white/[0.06] hover:border-indigo-500/30 hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo-500/[0.06] active:scale-[0.98] transition-all duration-300 ease-out cursor-pointer"
          >
            {/* Icon */}
            <div className="relative w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center group-hover:scale-110 group-hover:border-indigo-500/40 group-hover:shadow-[0_0_20px_rgba(99,102,241,0.15)] transition-all duration-300">
              <card.icon size={20} className="text-indigo-400 group-hover:text-indigo-300 transition-colors" />
            </div>

            {/* Text */}
            <div className="text-center">
              <p className="text-sm font-semibold text-white mb-1">{card.title}</p>
              <p className="text-xs text-slate-500">{card.desc}</p>
            </div>

            {/* CTA */}
            <span className="text-xs text-indigo-400/70 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all duration-200">
              {card.cta} →
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
