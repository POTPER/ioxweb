import React, { type MouseEvent as ReactMouseEvent, type RefObject } from 'react';
import { cn } from '../lib/utils';
import { useWireframe } from './WireframeContext';

export type DevPanelMode = 'minimal' | 'full';

export interface DevFloatingPanelFullActions {
  onAssessmentReport: () => void;
  onResetToStep1: () => void;
  onToggleAllUnlocked: () => void;
  allUnlocked: boolean;
  onOpenFrameworkGuide: () => void;
  onOpenMultiPeriodChart: () => void;
  onOpenStep9SpecStudio: () => void;
  onOpenJitterPlayground: () => void;
  onExportConnectivityGifs: () => Promise<void>;
}

interface DevFloatingPanelProps {
  mode: DevPanelMode;
  showPanel: boolean;
  onTogglePanel: () => void;
  devPos: { right: number; bottom: number };
  onDragStart: (e: ReactMouseEvent) => void;
  panelRef: RefObject<HTMLDivElement | null>;
  onEnterPractice?: () => void;
  fullActions?: DevFloatingPanelFullActions;
}

function WireframeToggle() {
  const { wireframeMode, setWireframeMode } = useWireframe();
  return (
    <button
      type="button"
      onClick={() => setWireframeMode(!wireframeMode)}
      className={cn(
        'w-full text-left px-3 py-2 text-[11px] font-mono border border-industrial-fg/20 hover:bg-industrial-bg transition-colors',
        wireframeMode && 'bg-yellow-100 border-yellow-400',
      )}
    >
      {wireframeMode ? '◼ 线框模式 ON' : '线框模式'}
    </button>
  );
}

export const DevFloatingPanel: React.FC<DevFloatingPanelProps> = ({
  mode,
  showPanel,
  onTogglePanel,
  devPos,
  onDragStart,
  panelRef,
  onEnterPractice,
  fullActions,
}) => {
  return (
    <div
      ref={panelRef}
      className="fixed z-[9999] flex flex-col items-end space-y-2 pointer-events-auto"
      style={{ right: devPos.right, bottom: devPos.bottom }}
    >
      {showPanel && (
        <div className="bg-white border-2 border-industrial-fg shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] p-4 w-52 space-y-2">
          <div className="text-[9px] font-mono font-bold uppercase tracking-widest opacity-40 border-b border-industrial-fg/20 pb-2 mb-3">
            DEV TOOLS
          </div>

          {mode === 'minimal' && (
            <button
              type="button"
              onClick={onEnterPractice}
              className="w-full text-left px-3 py-2 text-[11px] font-mono border border-industrial-fg/20 hover:bg-industrial-bg transition-colors"
            >
              进入练习系统
            </button>
          )}

          {mode === 'full' && fullActions && (
            <>
              <button
                type="button"
                onClick={fullActions.onAssessmentReport}
                className="w-full text-left px-3 py-2 text-[11px] font-mono border border-green-300 bg-green-50 hover:bg-green-100 transition-colors text-green-700"
              >
                评估报告
              </button>
              <button
                type="button"
                onClick={fullActions.onResetToStep1}
                className="w-full text-left px-3 py-2 text-[11px] font-mono border border-industrial-fg/20 hover:bg-industrial-bg transition-colors"
              >
                重置到步骤1
              </button>
              <button
                type="button"
                onClick={fullActions.onToggleAllUnlocked}
                className={cn(
                  'w-full text-left px-3 py-2 text-[11px] font-mono border border-industrial-fg/20 hover:bg-industrial-bg transition-colors',
                  fullActions.allUnlocked && 'bg-green-100 border-green-400',
                )}
              >
                {fullActions.allUnlocked ? '✓ 已全部解锁' : '全部解锁'}
              </button>
              <button
                type="button"
                onClick={fullActions.onOpenFrameworkGuide}
                className="w-full text-left px-3 py-2 text-[11px] font-mono border border-industrial-fg/20 hover:bg-industrial-bg transition-colors"
              >
                界面框架
              </button>
              <button
                type="button"
                onClick={fullActions.onOpenMultiPeriodChart}
                className="w-full text-left px-3 py-2 text-[11px] font-mono border border-industrial-fg/20 hover:bg-industrial-bg transition-colors"
              >
                多期曲线
              </button>
              <button
                type="button"
                onClick={fullActions.onOpenStep9SpecStudio}
                className="w-full text-left px-3 py-2 text-[11px] font-mono border border-industrial-fg/20 hover:bg-industrial-bg transition-colors"
              >
                Step9 产品说明
              </button>
              <button
                type="button"
                onClick={fullActions.onOpenJitterPlayground}
                className="w-full text-left px-3 py-2 text-[11px] font-mono border border-industrial-fg/20 hover:bg-industrial-bg transition-colors"
              >
                抖动公式
              </button>
              <button
                type="button"
                onClick={async (e) => {
                  const btn = e.currentTarget;
                  const original = btn.textContent;
                  btn.textContent = '生成中…';
                  btn.setAttribute('disabled', 'true');
                  try {
                    await fullActions.onExportConnectivityGifs();
                  } finally {
                    btn.textContent = original;
                    btn.removeAttribute('disabled');
                  }
                }}
                className="w-full text-left px-3 py-2 text-[11px] font-mono border border-industrial-fg/20 hover:bg-industrial-bg transition-colors disabled:opacity-50"
              >
                导出通畅性 GIF
              </button>
              <WireframeToggle />
            </>
          )}
        </div>
      )}
      <button
        type="button"
        onMouseDown={onDragStart}
        onClick={onTogglePanel}
        className="w-9 h-9 bg-industrial-fg text-industrial-bg flex items-center justify-center font-mono font-bold text-[10px] hover:opacity-80 transition-all shadow-[2px_2px_0px_0px_rgba(20,20,20,0.3)] cursor-move select-none"
        title="DEV — 拖拽移动"
      >
        DEV
      </button>
    </div>
  );
};
