import React from 'react';
import { TrainingHotspotButton, TrainingQuestionButton } from '../TrainingInteractionButtons';

/**
 * IMG-1-1 基坑支护平面布置图
 * 俯视视角的基坑支护平面图：基坑开挖区、周边建筑、管线、4个热点
 * 未来开发时替换为真实图片。
 */

interface Hotspot {
  id: string;
  name: string;
  x: string;
  y: string;
}

interface SitePlanDiagramProps {
  hotspots: Hotspot[];
  confirmedId?: string | null;
  selectedId?: string | null;
  hoveredId?: string | null;
  spacing?: string;
  onHotspotClick: (id: string) => void;
  onHotspotHover?: (id: string | null) => void;
  onSpacingClick?: () => void;
}

export const SitePlanDiagram: React.FC<SitePlanDiagramProps> = ({
  hotspots,
  confirmedId,
  selectedId,
  hoveredId,
  spacing,
  onHotspotClick,
  onHotspotHover,
  onSpacingClick,
}) => {
  return (
    <div className="relative aspect-[21/9] bg-[#f0f0f0] border-2 border-industrial-fg overflow-hidden group">
      {/* Drawing Background */}
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#141414 1px, transparent 0)', backgroundSize: '30px 30px' }}></div>
      
      {/* Site Elements */}
      <div className="absolute inset-0 p-8 font-mono text-[10px] uppercase tracking-tighter pointer-events-none">
        <div className="absolute top-4 left-10 border-b border-industrial-fg/40 pb-1">旧住宅楼 (距基坑约8m)</div>
        <div className="absolute top-16 left-10 text-industrial-fg/40">── 污水干管 DN300 ──────────────────────────</div>
        <div className="absolute top-10 right-20 text-industrial-fg/40">DN400 给水管</div>
        <div className="absolute bottom-10 right-10 border border-industrial-fg/40 p-2 bg-white/50">施工出入口</div>
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-industrial-fg/40">周边道路</div>
      </div>

      {/* Excavation Area */}
      <div className="absolute inset-x-[15%] inset-y-[25%] border-2 border-industrial-fg border-dashed bg-industrial-fg/5 flex items-center justify-center">
        <div className="text-center">
          <div className="font-bold text-xs opacity-40 uppercase tracking-widest">基坑开挖区</div>
          <div className="text-[9px] opacity-30 mt-1">(开挖深度 12m)</div>
        </div>
      </div>

      {/* Hotspots */}
      {hotspots.map((hp) => (
        <React.Fragment key={hp.id}>
          <TrainingHotspotButton
            label={hp.name}
            selected={confirmedId === hp.id}
            active={selectedId === hp.id}
            muted={!!confirmedId && confirmedId !== hp.id}
            className="-translate-x-1/2 -translate-y-1/2"
            style={{ left: hp.x, top: hp.y }}
            onClick={() => onHotspotClick(hp.id)}
            onMouseEnter={() => onHotspotHover?.(hp.id)}
            onMouseLeave={() => onHotspotHover?.(null)}
          />
          {confirmedId === hp.id && (
            <TrainingQuestionButton
              label={spacing ? `监测间距已配置 (${spacing}m)` : '请布置监测间距'}
              completed={!!spacing}
              style={{ left: `calc(${hp.x} + 32px)`, top: hp.y, transform: 'translateY(-50%)' }}
              onClick={() => onSpacingClick?.()}
            />
          )}
          {hoveredId === hp.id && !confirmedId && (
            <div
              className="absolute bg-industrial-fg text-white px-2 py-1 text-[9px] whitespace-nowrap rounded shadow-lg z-30"
              style={{ left: hp.x, top: hp.y, transform: 'translate(-50%, -180%)' }}
            >
              {hp.name}
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
