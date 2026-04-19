import React from 'react';
import { cn } from '../../lib/utils';
import { CheckCircle2 } from 'lucide-react';

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
        <button
          key={hp.id}
          onClick={() => onHotspotClick(hp.id)}
          onMouseEnter={() => onHotspotHover?.(hp.id)}
          onMouseLeave={() => onHotspotHover?.(null)}
          className={cn(
            "absolute w-8 h-8 -ml-4 -mt-4 flex items-center justify-center transition-all duration-300 z-20",
            confirmedId === hp.id ? "scale-110" : "hover:scale-125",
            confirmedId && confirmedId !== hp.id && "opacity-50"
          )}
          style={{ left: hp.x, top: hp.y }}
        >
          <div className={cn(
            "absolute inset-0 rounded-full border-2 border-industrial-fg animate-ping opacity-20",
            confirmedId === hp.id && "hidden"
          )} />
          <div className={cn(
            "w-full h-full rounded-full border-2 border-industrial-fg flex items-center justify-center font-bold text-[10px] transition-colors shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]",
            confirmedId === hp.id ? "bg-green-500 text-white" : 
            selectedId === hp.id ? "bg-industrial-fg text-white" : "bg-white"
          )}>
            {hp.id}
          </div>
          
          {/* [?]/[v] Marker */}
          {confirmedId === hp.id && (
            <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 flex items-center space-x-2 whitespace-nowrap z-30">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onSpacingClick?.();
                }}
                className={cn(
                  "flex items-center space-x-1 px-2 py-1 rounded-full border border-industrial-fg text-[10px] font-bold transition-all",
                  spacing ? "bg-green-100 text-green-700" : "bg-white text-industrial-fg animate-breathing"
                )}
              >
                {spacing ? (
                  <>
                    <CheckCircle2 size={12} />
                    <span>监测间距已配置 ({spacing}m)</span>
                  </>
                ) : (
                  <>
                    <span className="w-4 h-4 rounded-full bg-industrial-fg text-white flex items-center justify-center text-[8px]">?</span>
                    <span>请布置监测间距</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Tooltip on hover */}
          {hoveredId === hp.id && !confirmedId && (
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-industrial-fg text-white px-2 py-1 text-[9px] whitespace-nowrap rounded shadow-lg z-30">
              {hp.name}
            </div>
          )}
        </button>
      ))}
    </div>
  );
};
