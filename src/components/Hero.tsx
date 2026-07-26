import { ArrowRight, Sparkles, ChevronDown, Bot, Cpu, GitBranch } from 'lucide-react';
import { useEffect, useState } from 'react';

function CountUp({ end, suffix = '', duration = 1500 }: { end: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [end, duration]);

  return <>{count}{suffix}</>;
}

const STATS = [
  { value: 30, suffix: '万+', label: '开源模型' },
  { value: 10, suffix: '万+', label: '社区开发者' },
  { value: 500, suffix: '+', label: '活跃组织' },
];

export default function Hero() {
  return (
    <section id="项目介绍" className="relative section section-hero min-h-screen overflow-hidden">
      {/* ── Background layers ── */}
      <div className="absolute inset-0 bg-grid" />
      <div className="absolute inset-0 bg-dots opacity-30" />

      {/* Glow orbs — symmetric sizes and positions */}
      {/* Reduced blur radii — 150→100, 180→120 — for GPU performance */}
      <div className="absolute top-1/4 -left-32 w-[500px] h-[500px] bg-indigo-500/6 rounded-full blur-[100px] animate-float" />
      <div className="absolute top-1/4 -right-32 w-[500px] h-[500px] bg-cyan-400/5 rounded-full blur-[100px] animate-float" style={{ animationDelay: '-3s' }} />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-purple-500/4 rounded-full blur-[120px]" />

      {/* Floating icons — evenly distributed */}
      <div className="absolute top-[18%] left-[8%] opacity-15 animate-float" style={{ animationDelay: '-1s' }}>
        <Cpu size={32} className="text-indigo-400" />
      </div>
      <div className="absolute top-[25%] right-[8%] opacity-12 animate-float" style={{ animationDelay: '-4s' }}>
        <GitBranch size={28} className="text-cyan-400" />
      </div>
      <div className="absolute bottom-[22%] left-[12%] opacity-12 animate-float" style={{ animationDelay: '-2s' }}>
        <Bot size={30} className="text-purple-400" />
      </div>
      <div className="absolute bottom-[28%] right-[10%] opacity-15 animate-float" style={{ animationDelay: '-5s' }}>
        <Sparkles size={24} className="text-indigo-300" />
      </div>

      {/* ── Content: flex-col centering replaces the old flex+container-main conflict ── */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-10 max-w-[1280px] mx-auto">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-400/20 bg-indigo-400/[0.04] text-indigo-300/80 text-sm mb-10">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-400" />
          </span>
          AI Creation Workshop 2026
        </div>

        {/* Heading — explicit full-width centering */}
        <h1 className="w-full text-center text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight mb-10 leading-tight">
          <span className="text-white">ModelScope </span>
          <span className="gradient-text animate-gradient">AI Copilot</span>
        </h1>

        {/* Subtitle */}
        <p className="w-full text-center text-lg md:text-xl text-slate-400/80 max-w-2xl mb-14 leading-loose">
          为 ModelScope 开源社区打造的智能助手 ——
          <br className="hidden sm:block" />
          用 AI 降低开源门槛，让每个人都能轻松参与模型开发与社区贡献
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
          <button
            onClick={() => {
              const el = document.getElementById('功能');
              if (el) document.documentElement.scrollTop = el.getBoundingClientRect().top + window.scrollY - 64;
            }}
            className="group relative inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-semibold shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
          >
            <Sparkles size={20} className="group-hover:scale-110 transition-transform" />
            探索功能
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            onClick={() => {
              const el = document.getElementById('Demo');
              if (el) document.documentElement.scrollTop = el.getBoundingClientRect().top + window.scrollY - 64;
            }}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl border border-white/[0.08] text-slate-300 font-medium hover:bg-white/[0.04] hover:border-white/20 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
          >
            <Bot size={20} />
            查看 Demo
          </button>
        </div>

        {/* ── Stats ── */}
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl md:text-4xl font-extrabold text-white mb-3 tabular-nums tracking-tight">
                <CountUp end={stat.value} suffix={stat.suffix} />
              </div>
              <div className="text-xs md:text-sm text-slate-500 group-hover:text-slate-400 transition-colors">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-slate-600">
          <ChevronDown size={20} className="animate-bounce" />
        </div>
      </div>
    </section>
  );
}
