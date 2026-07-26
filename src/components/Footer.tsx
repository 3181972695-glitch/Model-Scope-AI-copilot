import { ExternalLink, Heart, Zap } from 'lucide-react';
import { GithubIcon } from './Icons';

const LINKS = [
  { label: '项目介绍', id: '项目介绍' },
  { label: '核心功能', id: '功能' },
  { label: 'AI Demo', id: 'Demo' },
  { label: 'AI 披露', id: '披露' },
];

function jumpTo(id: string) {
  const el = document.getElementById(id);
  if (el) document.documentElement.scrollTop = el.getBoundingClientRect().top + window.scrollY - 64;
}

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.04] bg-[#040810]">
      <div className="container-main py-14 text-center">
        {/* Brand */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center text-white font-extrabold text-sm">
              MS
            </div>
            <span className="font-bold text-lg text-white">
              ModelScope <span className="text-indigo-400">Copilot</span>
            </span>
          </div>
          <p className="text-xs text-slate-500">
            AI Creation Workshop 2026 — 用 AI 降低开源参与的门槛
          </p>
        </div>

        {/* Links */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          {LINKS.map((link) => (
            <button
              key={link.label}
              onClick={() => jumpTo(link.id)}
              className="px-4 py-2 rounded-xl text-xs text-slate-500 hover:text-slate-300 hover:bg-white/[0.03] transition-all cursor-pointer"
            >
              {link.label}
            </button>
          ))}
        </div>

        {/* Bottom */}
        <div className="pt-6 border-t border-white/[0.03] flex flex-col items-center gap-3">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
            Made with <Heart size={11} className="text-red-400" /> for AI Creation Workshop 2026
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-600">
            <a
              href="https://github.com/modelscope"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-slate-400 transition-colors"
            >
              <GithubIcon size={13} />
              ModelScope
              <ExternalLink size={9} />
            </a>
            <span className="flex items-center gap-1">
              <Zap size={11} className="text-indigo-500" />
              Powered by DeepSeek
            </span>
            <span>© 2026 Copilot Team</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
