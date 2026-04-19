import React from 'react';
import { cn } from '../../lib/utils';

/**
 * IMG-4-1 截面图-基坑与钢筋笼
 * 基坑横截面示意图：基坑边 → 钢筋笼截面 → ABCD 热点
 * 未来开发时替换为真实图片。
 */

interface SectionHotspot {
  id: string;
  title: string;
}

interface SectionDiagramProps {
  hotspots: SectionHotspot[];
  selectedId?: string;
  onHotspotClick: (id: string) => void;
}

export const SectionDiagram: React.FC<SectionDiagramProps> = ({ hotspots, selectedId, onHotspotClick }) => {
  const positions: React.CSSProperties[] = [
    { top: '0', left: '50%', transform: 'translate(-50%, -50%)' },
    { top: '50%', right: '0', transform: 'translate(50%, -50%)' },
    { bottom: '0', left: '50%', transform: 'translate(-50%, 50%)' },
    { top: '50%', left: '0', transform: 'translate(-50%, -50%)' }
  ];

  return (
    <div className="relative aspect-square bg-white border border-industrial-fg/20 flex items-center justify-center p-8">
      {/* Excavation Edge */}
      <div className="absolute top-4 left-4 right-4 h-1 bg-industrial-fg/40 flex items-center justify-center">
        <span className="text-[8px] bg-white px-2 uppercase tracking-widest opacity-40">════ 基坑边 ════</span>
      </div>

      {/* Rebar Cage Section */}
      <div className="w-48 h-48 border-4 border-industrial-fg/20 relative flex items-center justify-center">
        <div className="absolute inset-4 border-2 border-industrial-fg/10 border-dashed"></div>
        <span className="text-[10px] font-bold opacity-20 uppercase">钢筋笼截面</span>

        {/* Hotspots */}
        {hotspots.map((h, i) => {
          const isSelected = selectedId === h.id;
          return (
            <div key={h.id} className="absolute z-10 flex flex-col items-center" style={positions[i]}>
              <button
                onClick={() => onHotspotClick(h.id)}
                className={cn(
                  "w-8 h-8 border-2 flex items-center justify-center transition-all",
                  isSelected
                    ? "bg-industrial-fg border-industrial-fg text-white"
                    : "bg-white border-industrial-fg/30 hover:border-industrial-fg animate-breathing"
                )}
              >
                <span className="text-xs font-bold">{h.id}</span>
              </button>
              {isSelected && (
                <span className="text-[9px] font-bold text-green-600 mt-0.5 whitespace-nowrap">已安装</span>
              )}
            </div>
          );
        })}

        {/* Labels */}
        <span className="absolute -right-12 top-1/2 -translate-y-1/2 text-[8px] opacity-40 rotate-90">← 基坑侧</span>
      </div>
    </div>
  );
};
