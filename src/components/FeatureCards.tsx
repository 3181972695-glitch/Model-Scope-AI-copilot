import { Compass, Cpu, GitBranch, ArrowRight, Check } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Feature {
  id: string;
  step: string;
  icon: LucideIcon;
  title: string;
  subtitle: string;
  description: string;
  highlights: string[];
  gradient: string;
  iconBg: string;
  borderColor: string;
}

const features: Feature[] = [
  {
    id: 'onboarding',
    step: '01',
    icon: Compass,
    title: '新手导航',
    subtitle: 'Beginner Onboarding',
    description: '通过 AI 对话，了解 ModelScope 平台的核心功能、社区规范与最佳实践，从零开始成为开源社区活跃贡献者。',
    highlights: ['平台功能引导', '学习路线规划', '社区规范解读'],
    gradient: 'from-indigo-500 via-indigo-600 to-purple-600',
    iconBg: 'from-indigo-500/20 to-indigo-500/5',
    borderColor: 'border-indigo-400/20',
  },
  {
    id: 'recommend',
    step: '02',
    icon: Cpu,
    title: '模型推荐',
    subtitle: 'Model Recommendation',
    description: '根据任务需求和使用场景，智能推荐最合适的预训练模型、数据集和微调方案，让 AI 开发事半功倍。',
    highlights: ['多领域覆盖', '参数对比分析', '一键在线体验'],
    gradient: 'from-cyan-400 via-teal-400 to-emerald-500',
    iconBg: 'from-cyan-500/20 to-cyan-500/5',
    borderColor: 'border-cyan-400/20',
  },
  {
    id: 'contribute',
    step: '03',
    icon: GitBranch,
    title: '贡献规划',
    subtitle: 'Contribution Roadmap',
    description: '基于技能与兴趣，生成个性化开源贡献路线图。从文档翻译到核心代码，每一步都有明确指引。',
    highlights: ['文档 / 代码 / 运营', '分阶段路线图', 'Good First Issue'],
    gradient: 'from-purple-400 via-violet-500 to-pink-500',
    iconBg: 'from-purple-500/20 to-purple-500/5',
    borderColor: 'border-purple-400/20',
  },
];

interface Props {
  activeFeature: string | null;
  onSelect: (id: string) => void;
}

export default function FeatureCards({ activeFeature, onSelect }: Props) {
  return (
    <section id="功能" className="relative section section-features">
      <div className="container-main">
        {/* ── Section header ── */}
        <div className="text-center mb-20">
          <p className="text-xs font-semibold tracking-[0.2em] text-indigo-400 uppercase mb-4">
            Core Features
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-6 tracking-tight">
            三大核心功能
          </h2>
          <p className="text-slate-400/80 max-w-xl mx-auto text-base leading-loose">
            每个功能都内置了智能 AI 助手，通过对话式交互为你提供个性化指导
          </p>
        </div>

        {/* ── Cards grid: 3 cols desktop, 2 tablet, 1 mobile ── */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 stagger">
          {features.map((f) => {
            const isActive = activeFeature === f.id;
            return (
              <button
                key={f.id}
                onClick={() => onSelect(f.id)}
                className={`group relative text-center rounded-[24px] transition-all duration-500
                  ${isActive ? 'scale-[1.03] shadow-2xl z-10' : 'hover:scale-[1.01] hover:shadow-xl'}`}
              >
                {/* Glow ring */}
                <div
                  className={`absolute -inset-[1px] rounded-[24px] bg-gradient-to-br ${f.gradient} opacity-0 transition-opacity duration-500 blur-sm
                    ${isActive ? 'opacity-70' : 'group-hover:opacity-30'}`}
                />

                {/* Card body */}
                <div
                  className={`relative h-full rounded-[24px] p-8 flex flex-col
                    bg-gradient-to-b ${f.iconBg}
                    border ${isActive ? f.borderColor : 'border-white/[0.05]'}
                    ${isActive ? 'bg-[#0f1a2e]' : 'bg-[#0c1525]'}
                    transition-all duration-500`}
                >
                  {/* Step number — top-right decorative */}
                  <div className="flex items-center justify-end mb-4">
                    <span className="text-[80px] font-black text-white/[0.03] select-none leading-none">
                      {f.step}
                    </span>
                    {isActive && (
                      <span className="absolute top-6 left-6 flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-full animate-scale-in">
                        <Check size={12} />
                        已选中
                      </span>
                    )}
                  </div>

                  {/* Icon */}
                  <div
                    className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-6 shadow-lg
                      group-hover:shadow-xl transition-shadow duration-300 mx-auto`}
                  >
                    <f.icon size={26} className="text-white" />
                  </div>

                  {/* Title */}
                  <h3 className="text-xl lg:text-2xl font-bold text-white mb-2">
                    {f.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono tracking-wider mb-5 uppercase">
                    {f.subtitle}
                  </p>

                  {/* Description */}
                  <p className="text-sm text-slate-400/80 leading-loose mb-6 flex-1">
                    {f.description}
                  </p>

                  {/* Highlights */}
                  <div className="flex flex-wrap gap-2 mb-6 justify-center">
                    {f.highlights.map((h) => (
                      <span
                        key={h}
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/[0.04] text-slate-400"
                      >
                        {h}
                      </span>
                    ))}
                  </div>

                  {/* CTA */}
                  <div
                    className={`inline-flex items-center gap-2 text-sm font-semibold transition-all duration-300 mx-auto
                      bg-gradient-to-r ${f.gradient} bg-clip-text text-transparent
                      ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                  >
                    {isActive ? '对话中' : '开始体验'}
                    {!isActive && <ArrowRight size={15} />}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
