interface QuickActionsProps {
  items: string[];
  demoLabel?: string;
  demoQuestion?: string;
  onSelect: (keyword: string) => void;
}

const EMOJI: Record<string, string> = {
  '图像分类': '🖼', '文本生成': '✍️', '语音识别': '🎙',
  '多模态模型': '🌈', '我是 Python 新手': '🐍',
  '我想参与代码贡献': '💻', '我想发布模型': '📦',
  '文档贡献': '📝', '代码贡献': '💻',
  'Issue 维护': '🔧', '社区运营': '💬',
  '分析 Issue': '🔍', '分析 Discussion': '💬', '社区动态简报': '📊',
  '诊断 CV 项目': '👁', '诊断 NLP 项目': '🗣', '诊断多模态项目': '🌈',
};

export default function QuickActions({ items, demoLabel, demoQuestion, onSelect }: QuickActionsProps) {
  return (
    <div className="px-5 pb-3">
      <p className="text-[11px] text-slate-500 mb-2.5 font-medium">快速开始</p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onSelect(item)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/[0.06] text-[11px] text-slate-400 bg-white/[0.02] hover:text-slate-200 hover:border-white/[0.14] hover:bg-white/[0.04] active:scale-95 transition-all duration-200 ease-out cursor-pointer"
          >
            <span>{EMOJI[item] || '💡'}</span>
            {item}
          </button>
        ))}
        {demoLabel && demoQuestion && (
          <button
            type="button"
            onClick={() => onSelect(demoQuestion)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-indigo-500/30 text-[11px] text-indigo-400 bg-indigo-500/8 hover:border-indigo-500/50 hover:bg-indigo-500/15 active:scale-95 transition-all duration-200 ease-out cursor-pointer"
          >
            ✨ {demoLabel}
          </button>
        )}
      </div>
    </div>
  );
}
