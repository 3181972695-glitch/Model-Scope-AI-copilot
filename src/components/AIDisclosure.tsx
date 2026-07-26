import { AlertTriangle, Bot, Code, Palette, FileText, Sprout, Users, GitMerge, Zap } from 'lucide-react';

export default function AIDisclosure() {
  return (
    <section id="披露" className="relative section section-disclosure">
      <div className="container-main">
        <div className="text-center mb-16">
          <p className="text-xs font-semibold tracking-[0.2em] text-amber-400 uppercase mb-4">Transparency</p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-5 tracking-tight">AI 使用披露</h2>
          <p className="text-slate-400/80 max-w-xl mx-auto">透明公开，负责任地使用 AI 技术</p>
        </div>

        <div className="rounded-3xl border border-amber-400/[0.06] bg-[#0c1525]/60 backdrop-blur-sm p-8 md:p-10 space-y-12">

          {/* ══════════ 项目介绍 ══════════ */}
          <div className="text-center">
            <h3 className="text-xl font-bold text-white mb-4">ModelScope AI Community Copilot</h3>
            <p className="text-sm text-slate-400/80 leading-loose max-w-3xl mx-auto">
              本项目对应<strong className="text-white"> AI 创作工坊主题一「AI + 开源社区生态」</strong>，
              围绕魔搭社区（ModelScope）的<strong className="text-white">成长与活力提升</strong>和
              <strong className="text-white">协作效率提升</strong>两大核心维度，
              通过 AI 驱动的智能助手服务社区三类人群，形成正向循环：
            </p>

            {/* 正向循环链 */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-5 mb-5 text-xs">
              {[
                { icon: <Sprout size={14} />, label: '新人入门\n降门槛', color: 'indigo' },
                { icon: <Zap size={14} />, label: '项目落地\n提效率', color: 'cyan' },
                { icon: <GitMerge size={14} />, label: '贡献产出\n提质量', color: 'purple' },
                { icon: <Users size={14} />, label: '协作沟通\n降成本', color: 'amber' },
                { icon: <Bot size={14} />, label: '社区活力\n整体提升', color: 'emerald' },
              ].map((item, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  <span className={`px-3 py-1.5 rounded-lg bg-${item.color}-400/[0.06] border border-${item.color}-400/10 text-${item.color}-300 inline-flex items-center gap-1.5`}>
                    {item.icon}
                    <span className="whitespace-pre-line leading-tight">{item.label}</span>
                  </span>
                  {i < 4 && <span className="text-slate-600 text-lg">→</span>}
                </span>
              ))}
            </div>

            {/* 三类人群 */}
            <div className="grid md:grid-cols-3 gap-4 mt-6 max-w-3xl mx-auto">
              {[
                { who: '新人开发者', desc: '分阶段入门路径 + Good First Issue 匹配，从零到首次 PR' },
                { who: '普通贡献者', desc: '模型推荐 + 推理代码 + 创空间发布模板，成果反哺社区' },
                { who: '项目维护者', desc: 'Issue 智能摘要 + 结构化讨论分析，降低维护沟通成本' },
              ].map((item) => (
                <div key={item.who} className="p-4 rounded-xl bg-white/[0.01] border border-white/[0.04] text-center">
                  <p className="text-sm font-semibold text-white mb-1">{item.who}</p>
                  <p className="text-xs text-slate-400/80 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <hr className="border-white/[0.04]" />

          {/* ══════════ 第一层：Copilot 核心 AI ══════════ */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-indigo-400/10 flex items-center justify-center">
                <Bot size={20} className="text-indigo-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Copilot 对话 AI（项目核心功能）</h3>
                <p className="text-xs text-slate-500">用于赋能四大社区场景的智能对话引擎</p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { label: 'AI 模型', value: 'DeepSeek V4 Pro（deepseek-v4-pro）' },
                { label: '调用方式', value: 'FastAPI + OpenAI SDK 异步调用' },
                { label: '四个场景', value: '新手导航 / 模型推荐 / 贡献规划 / 议题摘要' },
                { label: 'System Prompt', value: '每场景独立 prompt，植入魔搭官方术语、规则与溯源要求' },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.01] border border-white/[0.04]">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">{item.label}</p>
                    <p className="text-xs text-slate-300">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <hr className="border-white/[0.04]" />

          {/* ══════════ 第二层：网页制作借助的 AI ══════════ */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-amber-400/10 flex items-center justify-center">
                <AlertTriangle size={20} className="text-amber-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">网页制作中借助的 AI 工具</h3>
                <p className="text-xs text-slate-500">所有由 AI 生成的内容均经过人工审查与修改</p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                {
                  icon: <Code size={16} className="text-cyan-400" />,
                  label: '前端开发',
                  ai: 'React 组件结构生成、Tailwind CSS 样式实现、交互逻辑编写、布局方案建议',
                  human: '组件代码逐行审查、UI 细节手动调优、响应式适配验证、交互体验测试',
                },
                {
                  icon: <Code size={16} className="text-purple-400" />,
                  label: '后端开发',
                  ai: 'FastAPI 路由结构生成、Pydantic Schema 定义、OpenAI SDK 调用封装、CORS/异常处理模板',
                  human: 'API 设计评审、安全配置审查（API Key 脱敏）、错误处理补全、接口联调测试',
                },
                {
                  icon: <FileText size={16} className="text-emerald-400" />,
                  label: 'Prompt 工程',
                  ai: '四场景 system prompt 初稿生成、输出格式结构化建议、术语表对照检查',
                  human: '与魔搭官方文档逐条核对、社区规则准确性验证、场景边界测试、多轮效果调优',
                },
                {
                  icon: <Palette size={16} className="text-amber-400" />,
                  label: '文案整理',
                  ai: 'README / 披露文案 / 演示脚本草稿生成、项目介绍文案初版',
                  human: '全文人工审校、术语统一为魔搭官方用语、工坊活动合规检查、语气专业度调整',
                },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.01] border border-white/[0.04]">
                  <div className="mt-0.5 shrink-0">{item.icon}</div>
                  <div className="text-xs">
                    <p className="text-white font-medium mb-1.5">{item.label}</p>
                    <p className="text-slate-500 leading-relaxed mb-1"><span className="text-slate-600">AI 参与：</span>{item.ai}</p>
                    <p className="text-slate-500 leading-relaxed"><span className="text-slate-600">人工校验：</span>{item.human}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <hr className="border-white/[0.04]" />

          <div className="p-5 rounded-2xl bg-amber-400/[0.03] border border-amber-400/[0.08] text-center">
            <p className="text-xs text-amber-300/70 leading-loose">
              ⚠ <strong className="text-amber-300/90">重要提示：</strong>
              本 Demo 中的 AI 对话由 DeepSeek V4 Pro 实时生成，所有 AI 辅助开发的代码与内容均已通过人工审查与校验。
              项目遵循魔搭社区规范与使用条款，不收集用户个人信息。AI 生成内容可能包含不准确之处，
              最终请以 ModelScope 官方文档为准。
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
