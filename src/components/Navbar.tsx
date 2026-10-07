import { useState, useEffect, useCallback } from 'react';
import { Menu, X, ExternalLink } from 'lucide-react';
import { GithubIcon } from './Icons';
import { assetUrl } from '../lib/backend';

const NAV_ITEMS = [
  { label: '项目介绍', id: '项目介绍' },
  { label: '功能', id: '功能' },
  { label: 'Demo', id: 'Demo' },
];

const NAV_HEIGHT = 64;

/** 平滑跳转 */
function jumpTo(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  window.scrollTo({
    top: el.getBoundingClientRect().top + window.scrollY - NAV_HEIGHT,
    behavior: 'smooth',
  });
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState('项目介绍');

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const y = window.scrollY;
          setScrolled(y > 20);

          // 滚动高亮：找出当前处于视口上部的章节
          let current = '项目介绍';
          for (const item of NAV_ITEMS) {
            const el = document.getElementById(item.id);
            if (el && el.getBoundingClientRect().top <= NAV_HEIGHT + 80) {
              current = item.id;
            }
          }
          // 页面底部时高亮最后一个章节
          if (window.innerHeight + y >= document.documentElement.scrollHeight - 4) {
            current = 'Demo';
          }
          setActive(current);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleNav = useCallback((id: string) => {
    setOpen(false);
    jumpTo(id);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#060b18]/85 backdrop-blur-xl border-b border-white/[0.06] shadow-lg shadow-black/10'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="container-main h-16 flex items-center justify-between">
        {/* Logo */}
        <button
          onClick={() => jumpTo('项目介绍')}
          className="flex items-center gap-3 group cursor-pointer"
        >
          <img src={assetUrl('logo.png')} alt="ModelScope" className="w-8 h-8 rounded-lg group-hover:scale-105 transition-transform" />
          <span className="font-bold text-lg text-white tracking-tight">
            ModelScope <span className="text-indigo-400">Copilot</span>
          </span>
        </button>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.label}
              onClick={() => handleNav(item.id)}
              className={`relative px-4 py-2 rounded-xl text-sm transition-all cursor-pointer ${
                active === item.id
                  ? 'text-white bg-white/[0.05]'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              {item.label}
              {active === item.id && (
                <span className="absolute left-1/2 -translate-x-1/2 -bottom-[7px] w-1 h-1 rounded-full bg-indigo-400" />
              )}
            </button>
          ))}
          <a
            href="https://github.com/modelscope"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-3 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm text-slate-400
              hover:text-white hover:bg-white/[0.04] border border-white/[0.06] transition-all"
          >
            <GithubIcon size={15} />
            GitHub
            <ExternalLink size={11} />
          </a>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.04] transition-all cursor-pointer"
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-white/[0.06] bg-[#060b18]/95 backdrop-blur-xl py-3 animate-fade-in">
          <div className="container-main flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.label}
              onClick={() => handleNav(item.id)}
              className={`px-4 py-2.5 rounded-xl text-sm transition-all text-left cursor-pointer ${
                active === item.id
                  ? 'text-white bg-white/[0.05]'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              {item.label}
            </button>
          ))}
          </div>
        </div>
      )}
    </nav>
  );
}
