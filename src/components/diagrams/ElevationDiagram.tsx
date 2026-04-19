import React from 'react';
import { cn } from '../../lib/utils';

/**
 * IMG-4-2 立面图-钢筋笼立面
 * 单张图切换模式：默认立面图 / 方案1~4 立面图
 * 笼体热点 + 绑扎间距/松紧热点
 * 未来开发时替换为真实图片。
 */

interface ElevationDiagramProps {
  viewedBinding: boolean;
  completedSpacing: boolean;
  completedTightness: boolean;
  selectedHeight?: string;
  onCageClick: () => void;
  onQuestionClick: (type: 'spacing' | 'tightness') => void;
}

export const ElevationDiagram: React.FC<ElevationDiagramProps> = ({
  viewedBinding,
  completedSpacing,
  completedTightness,
  selectedHeight,
  onCageClick,
  onQuestionClick,
}) => {
  const tubeStyles: Record<string, { top: string; bottom: string }> = {
    '1': { top: '-20px', bottom: '0%' },
    '2': { top: '0px', bottom: '0%' },
    '3': { top: '-20px', bottom: '12%' },
    '4': { top: '12%', bottom: '0%' },
  };

  return (
    <div className="relative h-[320px]">
      {/* Ground Line */}
      <div className="absolute top-8 left-0 right-0 h-px bg-industrial-fg/40">
        <span className="absolute -top-4 left-4 text-[8px] opacity-40">── 地面 ──</span>
      </div>
      {/* Cage Bottom Line */}
      <div className="absolute bottom-8 left-0 right-0 h-px bg-industrial-fg/40">
        <span className="absolute -bottom-4 left-4 text-[8px] opacity-40">── 笼底 ──</span>
      </div>

      {/* Current image label */}
      <div className="absolute top-2 right-2 text-[8px] font-mono opacity-30">
        {selectedHeight ? `img:立面图-方案${selectedHeight}` : 'img:立面图-默认'}
      </div>

      {/* Cage body — always visible, clickable for intro */}
      <div
        className={cn(
          "absolute left-1/2 -translate-x-1/2 w-24 border-2 transition-all",
          !viewedBinding
            ? "border-industrial-fg bg-industrial-fg/3 cursor-pointer hover:bg-industrial-fg/5"
            : "border-industrial-fg/20"
        )}
        style={{ top: '32px', bottom: '32px' }}
        onClick={!viewedBinding ? onCageClick : undefined}
      >
        <div className="absolute -bottom-1 left-full ml-1">
          <span className="text-[10px] font-bold opacity-40 whitespace-nowrap">钢筋笼</span>
        </div>
        {!viewedBinding && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold opacity-40">点击了解</span>
          </div>
        )}

        {/* Tube inside cage — shown when a scheme is selected */}
        {selectedHeight && tubeStyles[selectedHeight] && (
          <div
            className="absolute left-1/2 -translate-x-1/2 w-4 border-x-2 border-industrial-fg bg-industrial-fg/15 transition-all"
            style={tubeStyles[selectedHeight]}
          >
            <div className="absolute inset-0 flex flex-col justify-around opacity-20">
              {[...Array(10)].map((_, i) => <div key={i} className="h-px bg-industrial-fg w-full" />)}
            </div>
          </div>
        )}
      </div>

      {/* Hotspot: 绑扎间距 at ~1/3 */}
      {viewedBinding && (
        <button
          onClick={() => onQuestionClick('spacing')}
          className="absolute z-20 flex items-center"
          style={{ top: '33%', left: 'calc(50% + 48px)', transform: 'translateY(-50%)' }}
        >
          <div className="flex flex-col items-center">
            <div className={cn(
              "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
              !completedSpacing
                ? "border-yellow-500 bg-yellow-500 animate-breathing"
                : "border-green-600 bg-green-600"
            )}>
              {!completedSpacing ? <span className="text-white text-[9px] font-bold">?</span> : <span className="text-white text-[8px] font-bold">✓</span>}
            </div>
            <span className="text-[8px] mt-0.5 whitespace-nowrap opacity-60">绑扎间距</span>
          </div>
        </button>
      )}

      {/* Hotspot: 绑扎松紧 at ~2/3 */}
      {viewedBinding && (
        <button
          onClick={() => onQuestionClick('tightness')}
          className="absolute z-20 flex items-center"
          style={{ top: '66%', left: 'calc(50% + 48px)', transform: 'translateY(-50%)' }}
        >
          <div className="flex flex-col items-center">
            <div className={cn(
              "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
              !completedTightness
                ? "border-yellow-500 bg-yellow-500 animate-breathing"
                : "border-green-600 bg-green-600"
            )}>
              {!completedTightness ? <span className="text-white text-[9px] font-bold">?</span> : <span className="text-white text-[8px] font-bold">✓</span>}
            </div>
            <span className="text-[8px] mt-0.5 whitespace-nowrap opacity-60">绑扎松紧</span>
          </div>
        </button>
      )}
    </div>
  );
};
