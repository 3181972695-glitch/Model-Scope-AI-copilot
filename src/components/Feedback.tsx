import { useState } from 'react';
import { ThumbsUp, ThumbsDown, Check } from 'lucide-react';

interface Props {
  feature: string;
  question: string;
}

export default function Feedback({ feature, question }: Props) {
  const [submitted, setSubmitted] = useState(false);

  const handle = (type: 'up' | 'down') => {
    if (submitted) return;
    setSubmitted(true);
    // 本地收集，适配后续接入后端反馈接口
    const entry = {
      feature,
      question: question.slice(0, 200),
      type,
      time: new Date().toISOString(),
    };
    console.log('[Feedback]', entry);
    try {
      const prev = JSON.parse(localStorage.getItem('copilot_feedback') || '[]');
      prev.push(entry);
      localStorage.setItem('copilot_feedback', JSON.stringify(prev.slice(-50)));
    } catch { /* ignore */ }
  };

  if (submitted) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
        <Check size={12} />
        感谢反馈
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 text-[11px] text-slate-600">
      <span>回答是否对你有帮助？</span>
      <button
        type="button"
        onClick={() => handle('up')}
        className="p-1 rounded hover:text-emerald-400 hover:bg-white/[0.04] transition-colors cursor-pointer"
        title="有帮助"
      >
        <ThumbsUp size={12} />
      </button>
      <button
        type="button"
        onClick={() => handle('down')}
        className="p-1 rounded hover:text-red-400 hover:bg-white/[0.04] transition-colors cursor-pointer"
        title="有误"
      >
        <ThumbsDown size={12} />
      </button>
    </span>
  );
}
