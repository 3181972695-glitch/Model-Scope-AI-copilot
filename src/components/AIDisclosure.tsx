import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Bot, Code, Palette, FileText, Sprout, Users, GitMerge, Zap, ArrowRight } from 'lucide-react';
import { fetchBackendMeta, prettyModel } from '../lib/backend';

const CHAIN = [
  { icon: Sprout, label: '新人入门\n降门槛', color: 'border-indigo-400/30 bg-indigo-400/8 text-indigo-300' },
  { icon: Zap, label: '项目落地\n提效率', color: 'border-cyan-400/30 bg-cyan-400/8 text-cyan-300' },
  { icon: GitMerge, label: '贡献产出\n提质量', color: 'border-purple-400/30 bg-purple-400/8 text-purple-300' },
  { icon: Users, label: '协作沟通\n降成本', color: 'border-amber-400/30 bg-amber-400/8 text-amber-300' },
  { icon: Bot, label: '社区活力\n整体提升', color: 'border-emerald-400/30 bg-emerald-400/8 text-emerald-300' },
];

const ROLES = [
  { who: '新人开发者', desc: '分阶段入门路径 + Good First Issue 匹配，从零到首次 PR' },
  { who: '普通贡献者', desc: '模型推荐 + 推理代码 + 创空间发布模板，成果反哺社区' },
  { who: '项目维护者', desc: 'Issue 智能摘要 + 结构化讨论分析，降低维护沟通成本' },
];

const CORE_ITEMS = [
  // 「AI 模型」一项在组件内按后端自述动态填充，避免披露内容与实际部署不一致
  { label: 'AI 模型', value: '' },
  { label: '调用方式', value: 'FastAPI + OpenAI SDK，SSE 流式响应（首字约 1 秒）' },
  { label: '五个场景', value: '新手导航 / 模型推荐 / 贡献规划 / 议题摘要 / 健康度诊断', isTags: true },
  { label: 'System Prompt', value: '每场景独立 prompt，植入魔搭官方术语、规则与溯源要求' },
  { label: '实时数据', value: '健康度诊断接入 GitHub REST API 抓取真实指标（Star / 提交频率 / Issue 响应率 / 文档信号），由模型负责归因分析，缺失维度如实标注而未获取' },
  { label: '多轮上下文', value: '每轮携带最近若干轮对话，支持连续追问，服务端限制条数与长度以控制成本' },
  { label: '可用性设计', value: '上游不可用时自动降级到本地知识库，服务不中断；每条回答标注内容来源（实时生成 / 本地降级 / 内置演示）' },
  { label: '访问保护', value: '按来源 IP 的滑动窗口限流，防止公开部署后接口被刷爆导致 Key 余额损失' },
];

const DEV_ITEMS = [
  { icon: Code, iconColor: 'text-cyan-400', iconBg: 'bg-cyan-400/10', label: '前端开发', ai: 'React 组件结构生成、Tailwind CSS 样式实现、交互逻辑编写、布局方案建议', human: '组件代码逐行审查、UI 细节手动调优、响应式适配验证、交互体验测试' },
  { icon: Code, iconColor: 'text-purple-400', iconBg: 'bg-purple-400/10', label: '后端开发', ai: 'FastAPI 路由结构生成、Pydantic Schema 定义、OpenAI SDK 调用封装、CORS/异常处理模板', human: 'API 设计评审、安全配置审查（API Key 脱敏）、错误处理补全、接口联调测试' },
  { icon: FileText, iconColor: 'text-emerald-400', iconBg: 'bg-emerald-400/10', label: 'Prompt 工程', ai: '五场景 system prompt 初稿生成、输出格式结构化建议、术语表对照检查', human: '与魔搭官方文档逐条核对、社区规则准确性验证、场景边界测试、多轮效果调优' },
  { icon: Palette, iconColor: 'text-amber-400', iconBg: 'bg-amber-400/10', label: '文案整理', ai: 'README / 披露文案 / 演示脚本草稿生成、项目介绍文案初版', human: '全文人工审校、术语统一为魔搭官方用语、工坊活动合规检查、语气专业度调整' },
];

export default function AIDisclosure() {
  // 后端自述的模型标识。取不到（后端未部署 / 未提供 /api/meta）时保持未知，
  // 披露页据此退回到中性描述，而不是写死一个可能与实际不符的模型名。
  const [modelId, setModelId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetchBackendMeta().then(meta => {
      if (alive) setModelId(meta?.model ?? null);
    });
    return () => {
      alive = false;
    };
  }, []);

  const modelName = prettyModel(modelId ?? undefined);
  const modelLabel = modelName ? `${modelName}（${modelId}）` : '后端大模型（模型标识未获取到）';
  const coreItems = useMemo(
    () => CORE_ITEMS.map(item => (item.label === 'AI 模型' ? { ...item, value: modelLabel } : item)),
    [modelLabel],
  );

  return (
    <section id="披露" className="relative section-disclosure flex justify-center">
      <div className="w-full max-w-[1080px] px-4 md:px-6">

        {/* ── Top title ── */}
        <div className="text-center mb-16">
          <p className="text-xs font-semibold tracking-[0.25em] text-amber-400/80 uppercase mb-5">
            Transparency
          </p>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-4 tracking-tight">
            AI 使用披露
          </h2>
          <p className="text-sm text-slate-500">透明公开，负责任地使用 AI 技术</p>
        </div>

        {/* ── Main card ── */}
        <div className="rounded-[24px] border border-white/[0.10] bg-white/[0.05] backdrop-blur-lg shadow-[inset_0_1px_1px_rgba(255,255,255,0.04)] shadow-lg shadow-black/10 p-10 md:p-16 space-y-24">

          {/* ══════════ 项目介绍 ══════════ */}
          <div className="text-center">
            <h3 className="text-xl font-bold text-white mb-6">ModelScope AI Community Copilot</h3>
            <p className="text-sm text-slate-400/80 leading-loose max-w-4xl mx-auto">
              本项目对应<strong className="text-white"> AI 创作工坊主题一「AI + 开源社区生态」</strong>，
              围绕魔搭社区（ModelScope）的<strong className="text-white">成长与活力提升</strong>和
              <strong className="text-white">协作效率提升</strong>两大核心维度，
              通过 AI 驱动的智能助手服务社区三类人群，形成正向循环：
            </p>

            {/* Value chain — capsule buttons */}
            <div className="flex flex-wrap items-center justify-center gap-2.5 mt-8 mb-8">
              {CHAIN.map((item, i) => (
                <span key={i} className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full border text-xs font-medium transition-all duration-200 ease-out cursor-default ${item.color}`}>
                    <item.icon size={13} />
                    <span className="whitespace-pre-line leading-tight">{item.label}</span>
                  </span>
                  {i < 4 && <ArrowRight size={14} className="text-slate-600 shrink-0" />}
                </span>
              ))}
            </div>

            {/* Three roles — 3-column cards */}
            <div className="grid md:grid-cols-3 gap-5 max-w-3xl mx-auto mt-10">
              {ROLES.map((item) => (
                <div key={item.who} className="group p-5 rounded-xl bg-white/[0.04] border border-white/[0.10] text-center hover:bg-white/[0.06] hover:-translate-y-0.5 transition-all duration-200 ease-out">
                  <p className="text-sm font-semibold text-white mb-1.5">{item.who}</p>
                  <p className="text-xs text-slate-400/80 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <hr className="border-white/[0.06]" />

          {/* ══════════ Copilot 核心 AI ══════════ */}
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-indigo-400/10 border border-indigo-400/15 flex items-center justify-center">
                <Bot size={20} className="text-indigo-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Copilot 对话 AI（项目核心功能）</h3>
                <p className="text-xs text-slate-500 mt-1">用于赋能四大社区场景的智能对话引擎</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {coreItems.map((item) => (
                <div key={item.label} className="flex items-start gap-3 p-5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-all duration-200 ease-out">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] text-slate-500 mb-1.5 font-medium">{item.label}</p>
                    {item.isTags ? (
                      <div className="flex flex-wrap gap-1.5">
                        {['新手导航', '模型推荐', '贡献规划', '议题摘要', '健康度诊断'].map(tag => (
                          <span key={tag} className="px-2.5 py-0.5 rounded-full bg-indigo-400/8 border border-indigo-400/15 text-[11px] text-indigo-300/80">
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-300 leading-relaxed">{item.value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <hr className="border-white/[0.06]" />

          {/* ══════════ AI 工具四象限 ══════════ */}
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/15 flex items-center justify-center">
                <AlertTriangle size={20} className="text-amber-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">网页制作中借助的 AI 工具</h3>
                <p className="text-xs text-slate-500 mt-1">所有由 AI 生成的内容均经过人工审查与修改</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              {DEV_ITEMS.map((item) => (
                <div key={item.label} className="group flex items-start gap-4 p-6 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-200 ease-out">
                  <div className={`w-9 h-9 rounded-lg ${item.iconBg} border border-white/[0.06] flex items-center justify-center shrink-0`}>
                    <item.icon size={16} className={item.iconColor} />
                  </div>
                  <div className="min-w-0 text-xs">
                    <p className="text-white font-semibold mb-3">{item.label}</p>
                    <p className="text-slate-500 leading-relaxed mb-2.5">
                      <span className="text-slate-600 text-[11px]">AI 参与：</span>{item.ai}
                    </p>
                    <p className="text-slate-500 leading-relaxed">
                      <span className="text-slate-600 text-[11px]">人工校验：</span>{item.human}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <hr className="border-white/[0.06]" />

          {/* ══════════ 底部合规提示 ══════════ */}
          <div className="p-6 rounded-2xl bg-amber-400/[0.04] border border-amber-400/[0.10] text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <AlertTriangle size={15} className="text-amber-400 shrink-0" />
              <strong className="text-amber-300/90 text-sm">重要提示：</strong>
            </div>
            <p className="text-xs text-amber-300/70 leading-loose max-w-3xl mx-auto">
              本 Demo 中的 AI 对话由 <strong className="text-amber-200/90">{modelLabel}</strong> 实时生成，
              所有 AI 辅助开发的代码与内容均已通过人工审查与校验。
              AI 服务不可用时，系统会自动降级到本地知识库以保证服务不中断，此时每条回答都会标注「本地知识库降级」，
              不会将降级内容冒充为模型输出。健康度诊断的指标来自 GitHub REST API 实时抓取，数据缺失的维度会明确标注。
              项目遵循魔搭社区规范与使用条款，不收集用户个人信息。AI 生成内容可能包含不准确之处，
              最终请以 ModelScope 官方文档为准。
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}
