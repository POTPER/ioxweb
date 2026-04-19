import React, { useState } from 'react';
import { X, FolderOpen, ChevronRight, CheckCircle2 } from 'lucide-react';

type ModalType = 'A' | 'A_img' | 'B' | 'C' | 'C_img' | 'D' | null;

export const FrameworkGuide: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  return (
    <div className="fixed inset-0 z-[300] bg-industrial-bg text-industrial-fg overflow-auto">
      {/* Close button */}
      <button onClick={onClose} className="fixed top-4 right-4 z-[310] w-8 h-8 bg-industrial-fg text-industrial-bg flex items-center justify-center hover:opacity-80">
        <X size={16} />
      </button>

      <div className="max-w-5xl mx-auto px-8 py-12 space-y-12">
        <h1 className="text-2xl font-bold tracking-[0.15em] uppercase border-b-[3px] border-industrial-fg pb-4">通用界面框架</h1>

        {/* === Section 1: Page Layout === */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold tracking-wider uppercase">页面结构</h2>

          {/* Layout diagram */}
          <div className="border-2 border-industrial-fg bg-white" style={{ minHeight: 420 }}>
            {/* Title bar */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b-2 border-industrial-fg bg-industrial-fg text-industrial-bg">
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-mono border border-industrial-bg/40 px-2.5 py-1 opacity-50">退出</span>
              </div>
              <span className="font-bold text-sm tracking-[0.2em]">{'{ 实训标题 }'}</span>
              <button className="flex items-center gap-1.5 text-[11px] font-mono border border-industrial-bg/40 px-2.5 py-1">
                <FolderOpen size={12} /> 项目资料
              </button>
            </div>

            <div className="flex" style={{ minHeight: 360 }}>
              {/* Sidebar */}
              <div className="w-44 border-r-2 border-industrial-fg p-3 space-y-1 bg-industrial-bg/50 text-[11px] font-mono flex flex-col">
                <div className="text-[9px] font-bold uppercase tracking-widest opacity-40 mb-2">分区A</div>
                <div className="flex items-center gap-2 px-2 py-1.5 bg-industrial-fg text-industrial-bg font-bold">
                  <ChevronRight size={10} /> * 当前步骤
                </div>
                <div className="flex items-center gap-2 px-2 py-1.5 text-green-600">
                  <CheckCircle2 size={10} /> 已完成步骤
                </div>
                <div className="px-2 py-1.5 text-green-500 animate-pulse">● 下一步就绪</div>
                <div className="px-2 py-1.5 opacity-30">未到达步骤</div>
                <div className="border-t border-industrial-fg/20 my-2" />
                <div className="text-[9px] font-bold uppercase tracking-widest opacity-40 mb-2">分区B</div>
                <div className="px-2 py-1.5 opacity-30">步骤...</div>
                <div className="border-t border-industrial-fg/20 my-2" />
                <div className="text-[9px] font-bold uppercase tracking-widest opacity-40 mb-2">分区C</div>
                <div className="px-2 py-1.5 opacity-30">步骤...</div>
                <div className="flex-1" />
                <div className="mt-auto pt-3 border-t border-industrial-fg/20">
                  <div className="w-full px-3 py-2 bg-industrial-fg text-industrial-bg text-center text-[11px] font-bold tracking-wider">提交</div>
                </div>
              </div>

              {/* Main area */}
              <div className="flex-1 flex flex-col">
                {/* Task instruction bar */}
                <div className="border-b border-industrial-fg/20 bg-industrial-fg/5 px-4 py-2.5 text-[12px] font-medium">
                  <span className="border-l-[3px] border-industrial-fg pl-3">任务说明：{'{ 当前步骤操作目标 }'}</span>
                </div>
                {/* Content area */}
                <div className="flex-1 flex items-center justify-center p-8">
                  <div className="border-2 border-dashed border-gray-300 w-full h-full min-h-[240px] flex items-center justify-center">
                    <span className="text-gray-400 font-mono text-sm">主内容区域 — 图片 / 热点 / 表单</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-[11px] font-mono text-gray-500 space-y-1">
            <p>完成当前步骤 → 侧栏下一步自动亮起 → 点击进入，无「下一步」按钮</p>
            <p>评分过程中不显示实时得分，不提示对错，完成后在评估报告中统一展示</p>
          </div>
        </section>

        {/* === Section 2: Modal Patterns === */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold tracking-wider uppercase">弹窗交互模式</h2>
          <p className="text-[11px] font-mono text-gray-500">[?] 灰底问号 = 待操作 → 点击弹窗 → 完成后变 [v] 绿底勾选，可再次点击修改</p>

          <div className="grid grid-cols-3 gap-4">
            <ModalCard
              title="模式 A"
              desc="信息查看"
              footer="知道了"
              color="gray"
              onClick={() => setActiveModal('A')}
            />
            <ModalCard
              title="模式 A'"
              desc="信息查看（图文变体）"
              footer="知道了"
              color="gray"
              onClick={() => setActiveModal('A_img')}
            />
            <ModalCard
              title="模式 B"
              desc="选择确认"
              footer="选择 / 取消"
              color="blue"
              onClick={() => setActiveModal('B')}
            />
            <ModalCard
              title="模式 C"
              desc="答题浮层（纯文字）"
              footer="确认"
              color="green"
              onClick={() => setActiveModal('C')}
            />
            <ModalCard
              title="模式 C'"
              desc="答题浮层（图文卡片）"
              footer="确认"
              color="green"
              onClick={() => setActiveModal('C_img')}
            />
            <ModalCard
              title="模式 D"
              desc="填写输入"
              footer="确认 / 取消"
              color="amber"
              onClick={() => setActiveModal('D')}
            />
          </div>
        </section>

        {/* === Section 3: [?]/[v] Marker === */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold tracking-wider uppercase">[?] / [v] 标记</h2>
          <div className="flex gap-6 items-start">
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-full bg-gray-200 border-2 border-gray-400 flex items-center justify-center text-gray-500 font-bold text-lg">?</span>
              <div className="text-[11px] font-mono"><div className="font-bold">待操作</div><div className="text-gray-500">灰底问号，点击弹出弹窗</div></div>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-full bg-green-500 border-2 border-green-600 flex items-center justify-center text-white font-bold text-lg">✓</span>
              <div className="text-[11px] font-mono"><div className="font-bold">已完成</div><div className="text-gray-500">绿底勾选，显示结果，可再次修改</div></div>
            </div>
          </div>
        </section>

        {/* === Section 4: Project Materials Panel === */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold tracking-wider uppercase">项目资料面板</h2>
          <div className="border-2 border-industrial-fg bg-white">
            <div className="flex items-center justify-between px-4 py-2 border-b-2 border-industrial-fg">
              <span className="font-bold text-sm">项目资料</span>
              <span className="w-6 h-6 flex items-center justify-center border border-industrial-fg/30 text-[10px]">✕</span>
            </div>
            <div className="flex border-b border-industrial-fg/20 text-[11px] font-mono">
              <span className="px-4 py-2 border-b-2 border-industrial-fg font-bold">Tab 1</span>
              <span className="px-4 py-2 opacity-40">Tab 2</span>
              <span className="px-4 py-2 opacity-40">Tab 3</span>
              <span className="px-4 py-2 opacity-40">Tab N</span>
            </div>
            <div className="p-6 text-gray-400 font-mono text-sm text-center min-h-[100px] flex items-center justify-center">
              当前 Tab 的内容区域（可滚动浏览）
            </div>
          </div>
          <p className="text-[11px] font-mono text-gray-500">全局模态框，任意步骤均可打开，不受进度限制。Tab 数量和内容由各实训实例定义。</p>
        </section>
      </div>

      {/* === Modal Previews === */}
      {activeModal && (
        <div className="fixed inset-0 z-[320] bg-black/50 flex items-center justify-center p-8" onClick={() => setActiveModal(null)}>
          <div className="max-w-lg w-full space-y-3" onClick={e => e.stopPropagation()}>
            <div className="bg-white border-2 border-industrial-fg shadow-[6px_6px_0px_0px_rgba(20,20,20,1)]">
              {activeModal === 'A' && <ModalPreviewA onClose={() => setActiveModal(null)} />}
              {activeModal === 'A_img' && <ModalPreviewAImg onClose={() => setActiveModal(null)} />}
              {activeModal === 'B' && <ModalPreviewB onClose={() => setActiveModal(null)} />}
              {activeModal === 'C' && <ModalPreviewC onClose={() => setActiveModal(null)} />}
              {activeModal === 'C_img' && <ModalPreviewCImg onClose={() => setActiveModal(null)} />}
              {activeModal === 'D' && <ModalPreviewD onClose={() => setActiveModal(null)} />}
            </div>
            <div className="text-[11px] font-mono text-industrial-bg/70 leading-relaxed">
              {activeModal === 'A' && '用户仅需阅读内容，弹窗不涉及评分。关闭后 [?] 标记出现，进入答题流程。'}
              {activeModal === 'A_img' && '左图右文复合布局，其余规则与纯文字变体一致。'}
              {activeModal === 'B' && '选择即评分行为。选择后仍可点击其他选项改选，以最终提交为准。'}
              {activeModal === 'C' && '单选题，选中后确认提交。[X] 关闭不提交，保留之前选择。'}
              {activeModal === 'C_img' && '每个选项由单选标记 + 标题 + 图片缩略图 + 参数描述组成，其余规则与纯文字变体一致。'}
              {activeModal === 'D' && '数值填写。输入为空时确认置灰。提交后 [?] → [v]，点击 [v] 可重新修改。'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ---------- Modal Card ---------- */
const colorMap: Record<string, string> = {
  gray: 'border-gray-300 hover:border-gray-500',
  blue: 'border-blue-300 hover:border-blue-500',
  green: 'border-green-300 hover:border-green-500',
  amber: 'border-amber-300 hover:border-amber-500',
};

const ModalCard: React.FC<{ title: string; desc: string; footer: string; color: string; onClick: () => void }> = ({ title, desc, footer, color, onClick }) => (
  <button onClick={onClick} className={`border-2 ${colorMap[color]} bg-white p-4 text-left transition-colors`}>
    <div className="font-bold text-sm mb-1">{title}</div>
    <div className="text-[11px] font-mono text-gray-500 mb-3">{desc}</div>
    <div className="text-[10px] font-mono font-bold uppercase tracking-wider opacity-60">按钮：{footer}</div>
    <div className="text-[9px] font-mono text-gray-400 mt-2">点击查看预览 →</div>
  </button>
);

/* ---------- Modal Preview A ---------- */
const ModalPreviewA: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <>
    <div className="flex items-center justify-between px-5 py-3 border-b border-industrial-fg/20">
      <span className="font-bold">{'{ 标题 }'}</span>
      <button onClick={onClose} className="text-gray-400 hover:text-industrial-fg"><X size={16} /></button>
    </div>
    <div className="px-5 py-6 text-sm text-gray-600 min-h-[120px]">
      <p>{'{ 客观描述文案 }'}</p>
    </div>
    <div className="px-5 py-3 border-t border-industrial-fg/20 flex justify-center">
      <button onClick={onClose} className="px-6 py-2 bg-industrial-fg text-industrial-bg text-sm font-bold">知道了</button>
    </div>
  </>
);

/* ---------- Modal Preview A' (图文变体) ---------- */
const ModalPreviewAImg: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <>
    <div className="flex items-center justify-between px-5 py-3 border-b border-industrial-fg/20">
      <span className="font-bold">{'{ 标题 }'}</span>
      <button onClick={onClose} className="text-gray-400 hover:text-industrial-fg"><X size={16} /></button>
    </div>
    <div className="px-5 py-6 flex gap-4 min-h-[120px]">
      <div className="w-28 h-24 bg-gray-200 border border-gray-300 flex items-center justify-center text-gray-400 text-[10px] font-mono flex-shrink-0">[图片/GIF/视频]</div>
      <p className="text-sm text-gray-600">{'{ 描述文案 }'}</p>
    </div>
    <div className="px-5 py-3 border-t border-industrial-fg/20 flex justify-center">
      <button onClick={onClose} className="px-6 py-2 bg-industrial-fg text-industrial-bg text-sm font-bold">知道了</button>
    </div>
  </>
);

/* ---------- Modal Preview B ---------- */
const ModalPreviewB: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <>
    <div className="flex items-center justify-between px-5 py-3 border-b border-industrial-fg/20">
      <span className="font-bold">{'{ 标题 }'}</span>
      <button onClick={onClose} className="text-gray-400 hover:text-industrial-fg"><X size={16} /></button>
    </div>
    <div className="px-5 py-6 text-sm text-gray-600 min-h-[120px]">
      <p>{'{ 客观描述文案 }'}</p>
    </div>
    <div className="px-5 py-3 border-t border-industrial-fg/20 flex justify-center gap-3">
      <button onClick={onClose} className="px-6 py-2 bg-industrial-fg text-industrial-bg text-sm font-bold">选择</button>
      <button onClick={onClose} className="px-6 py-2 border-2 border-industrial-fg text-sm font-bold">取消</button>
    </div>
  </>
);

/* ---------- Modal Preview C ---------- */
const ModalPreviewC: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <>
      <div className="flex items-center justify-between px-5 py-3 border-b border-industrial-fg/20">
        <span className="font-bold">{'{ 题目标题 }'}</span>
        <button onClick={onClose} className="text-gray-400 hover:text-industrial-fg"><X size={16} /></button>
      </div>
      <div className="px-5 py-6 space-y-3">
        <p className="text-sm text-gray-600 mb-4">{'{ 题干文案 }'}</p>
        {['A', 'B', 'C', 'D'].map(opt => (
          <button
            key={opt}
            onClick={() => setSelected(opt)}
            className={`w-full text-left px-4 py-2.5 border-2 text-sm transition-colors ${selected === opt ? 'bg-industrial-fg text-industrial-bg border-industrial-fg' : 'border-industrial-fg/20 hover:border-industrial-fg/40'}`}
          >
            {opt}. {'{ 选项文案 }'}
          </button>
        ))}
      </div>
      <div className="px-5 py-3 border-t border-industrial-fg/20 flex justify-center">
        <button onClick={onClose} className={`px-6 py-2 text-sm font-bold ${selected ? 'bg-industrial-fg text-industrial-bg' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`} disabled={!selected}>确认</button>
      </div>
    </>
  );
};

/* ---------- Modal Preview C' (图文变体) ---------- */
const ModalPreviewCImg: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <>
      <div className="flex items-center justify-between px-5 py-3 border-b border-industrial-fg/20">
        <span className="font-bold">{'{ 题目标题 }'}</span>
        <button onClick={onClose} className="text-gray-400 hover:text-industrial-fg"><X size={16} /></button>
      </div>
      <div className="px-5 py-6 space-y-3">
        <p className="text-sm text-gray-600 mb-4">{'{ 题干文案 }'}</p>
        {['A', 'B', 'C', 'D'].map(opt => (
          <button
            key={opt}
            onClick={() => setSelected(opt)}
            className={`w-full text-left px-4 py-2.5 border-2 text-sm transition-colors flex items-center justify-between gap-3 ${selected === opt ? 'bg-industrial-fg text-industrial-bg border-industrial-fg' : 'border-industrial-fg/20 hover:border-industrial-fg/40'}`}
          >
            <span>{opt}. {'{ 选项文案 }'}</span>
            <div className={`w-14 h-10 border flex items-center justify-center text-[9px] font-mono flex-shrink-0 ${selected === opt ? 'bg-industrial-bg/20 border-industrial-bg/30 text-industrial-bg/60' : 'bg-gray-200 border-gray-300 text-gray-400'}`}>[图片]</div>
          </button>
        ))}
      </div>
      <div className="px-5 py-3 border-t border-industrial-fg/20 flex justify-center">
        <button onClick={onClose} className={`px-6 py-2 text-sm font-bold ${selected ? 'bg-industrial-fg text-industrial-bg' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`} disabled={!selected}>确认</button>
      </div>
    </>
  );
};

/* ---------- Modal Preview D ---------- */
const ModalPreviewD: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <>
    <div className="flex items-center justify-between px-5 py-3 border-b border-industrial-fg/20">
      <span className="font-bold">{'{ 标题 }'}</span>
      <button onClick={onClose} className="text-gray-400 hover:text-industrial-fg"><X size={16} /></button>
    </div>
    <div className="px-5 py-6 space-y-4">
      <p className="text-sm text-gray-600">{'{ 描述/提示文案 }'}</p>
      <div className="flex items-center gap-2">
        <input type="number" placeholder="输入数值" className="flex-1 border-2 border-industrial-fg/30 px-3 py-2 text-sm font-mono focus:border-industrial-fg outline-none" />
        <span className="text-sm font-mono font-bold text-gray-500">m</span>
      </div>
    </div>
    <div className="px-5 py-3 border-t border-industrial-fg/20 flex justify-center gap-3">
      <button onClick={onClose} className="px-6 py-2 bg-industrial-fg text-industrial-bg text-sm font-bold">确认</button>
      <button onClick={onClose} className="px-6 py-2 border-2 border-industrial-fg text-sm font-bold">取消</button>
    </div>
  </>
);
