import React, { useState } from 'react';
import { cn } from '../lib/utils';
import { X } from 'lucide-react';
import { DEPTHS, CUM_DISP, PERIODS, MONITORING, PERIOD_DATES, EXCAVATION_DEPTHS, PERIOD_CONDITIONS } from '../data/monitoringData';

// Chart uses depths 0.5m~20.0m (skip the extrapolated 0.0m)
const CHART_DEPTHS = DEPTHS.slice(1);
const PERIOD_DATA: Record<number, number[]> = Object.fromEntries(
  Array.from({ length: PERIODS }, (_, i) => [i + 1, CUM_DISP[i].slice(1)])
);

const PERIOD_COLORS: Record<number, string> = {
  1: '#94a3b8', // slate-400
  2: '#a1a1aa', // zinc-400
  3: '#78716c', // stone-500
  4: '#7c3aed', // violet-600
  5: '#2563eb', // blue-600
  6: '#059669', // emerald-600
  7: '#d97706', // amber-600
  8: '#dc2626', // red-600
};

const WARNING_THRESHOLD = MONITORING.controlValue * MONITORING.warningRatio; // 35mm
const CONTROL_VALUE = MONITORING.controlValue; // 50mm

interface Props {
  onClose: () => void;
}

export const MultiPeriodChart: React.FC<Props> = ({ onClose }) => {
  const [hoveredPeriod, setHoveredPeriod] = useState<number | null>(null);
  const [enabledPeriods, setEnabledPeriods] = useState<Set<number>>(new Set([1,2,3,4,5,6,7,8]));

  const togglePeriod = (p: number) => {
    setEnabledPeriods(prev => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      return next;
    });
  };

  // Chart dimensions
  const W = 700, H = 600, padL = 60, padR = 30, padT = 30, padB = 40;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  const maxDisp = 50; // fixed to control value for context
  const maxDepth = 20;

  const xScale = (disp: number) => padL + (disp / maxDisp) * chartW;
  const yScale = (depth: number) => padT + (depth / maxDepth) * chartH;

  // Generate SVG path for a period
  const periodPath = (period: number) => {
    const data = PERIOD_DATA[period];
    return data.map((d, i) => {
      const x = xScale(d);
      const y = yScale(CHART_DEPTHS[i]);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  };

  // X-axis ticks
  const xTicks = [0, 10, 20, 30, 35, 40, 50];
  // Y-axis ticks
  const yTicks = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20];

  return (
    <div className="fixed inset-0 z-[300] bg-industrial-bg/95 flex flex-col overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-industrial-fg bg-white">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-widest">多期累计位移曲线</h2>
          <p className="text-[10px] font-mono opacity-50 mt-0.5">CX-06（03区06孔）| CX-03E | 孔深20.0m | 间隔0.5m | 8期数据</p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-industrial-bg transition-colors">
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 flex items-start justify-center p-6 gap-6">
        {/* Chart */}
        <div className="bg-white border-2 border-industrial-fg shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] p-4">
          <svg width={W} height={H} className="font-mono">
            {/* Grid lines */}
            {xTicks.map(t => (
              <line key={`xg-${t}`} x1={xScale(t)} y1={padT} x2={xScale(t)} y2={padT + chartH}
                stroke={t === WARNING_THRESHOLD ? '#d97706' : t === CONTROL_VALUE ? '#dc2626' : '#e5e7eb'}
                strokeWidth={t === WARNING_THRESHOLD || t === CONTROL_VALUE ? 1.5 : 0.5}
                strokeDasharray={t === WARNING_THRESHOLD || t === CONTROL_VALUE ? '6,3' : 'none'}
              />
            ))}
            {yTicks.map(t => (
              <line key={`yg-${t}`} x1={padL} y1={yScale(t)} x2={padL + chartW} y2={yScale(t)}
                stroke="#e5e7eb" strokeWidth={0.5}
              />
            ))}

            {/* Warning zone label */}
            <text x={xScale(WARNING_THRESHOLD) + 3} y={padT + 12} fontSize={9} fill="#d97706" fontWeight="bold">黄色预警 35mm</text>
            <text x={xScale(CONTROL_VALUE) - 2} y={padT + 12} fontSize={9} fill="#dc2626" fontWeight="bold" textAnchor="end">控制值 50mm</text>

            {/* Axes */}
            <line x1={padL} y1={padT} x2={padL} y2={padT + chartH} stroke="#141414" strokeWidth={1.5} />
            <line x1={padL} y1={padT + chartH} x2={padL + chartW} y2={padT + chartH} stroke="#141414" strokeWidth={1.5} />

            {/* X-axis labels */}
            {xTicks.map(t => (
              <text key={`xl-${t}`} x={xScale(t)} y={padT + chartH + 16} fontSize={9} textAnchor="middle" fill="#141414" opacity={0.6}>
                {t}
              </text>
            ))}
            <text x={padL + chartW / 2} y={padT + chartH + 34} fontSize={10} textAnchor="middle" fill="#141414" fontWeight="bold">
              累计位移 (mm)
            </text>

            {/* Y-axis labels */}
            {yTicks.map(t => (
              <text key={`yl-${t}`} x={padL - 8} y={yScale(t) + 3} fontSize={9} textAnchor="end" fill="#141414" opacity={0.6}>
                {t.toFixed(1)}
              </text>
            ))}
            <text x={14} y={padT + chartH / 2} fontSize={10} textAnchor="middle" fill="#141414" fontWeight="bold"
              transform={`rotate(-90,14,${padT + chartH / 2})`}>
              深度 (m)
            </text>

            {/* Period curves */}
            {[1,2,3,4,5,6,7,8].map(p => {
              if (!enabledPeriods.has(p)) return null;
              const isHovered = hoveredPeriod === p;
              const dimmed = hoveredPeriod !== null && !isHovered;
              return (
                <path
                  key={p}
                  d={periodPath(p)}
                  fill="none"
                  stroke={PERIOD_COLORS[p]}
                  strokeWidth={isHovered ? 3 : p === 8 ? 2.5 : 1.5}
                  opacity={dimmed ? 0.15 : 1}
                  className="transition-all duration-200"
                />
              );
            })}

            {/* Max displacement marker for period 8 */}
            {enabledPeriods.has(8) && (
              <>
                <circle cx={xScale(36.00)} cy={yScale(10.0)} r={4} fill="#dc2626" stroke="white" strokeWidth={1.5} />
                <text x={xScale(36.00) + 8} y={yScale(10.0) + 4} fontSize={9} fill="#dc2626" fontWeight="bold">
                  36.00mm @10.0m
                </text>
              </>
            )}
          </svg>
        </div>

        {/* Legend + Info panel */}
        <div className="w-56 space-y-4">
          {/* Period toggles */}
          <div className="bg-white border-2 border-industrial-fg shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] p-3 space-y-1">
            <div className="text-[9px] font-mono font-bold uppercase tracking-widest opacity-40 mb-2">期次图例</div>
            {[1,2,3,4,5,6,7,8].map(p => (
              <button
                key={p}
                onClick={() => togglePeriod(p)}
                onMouseEnter={() => setHoveredPeriod(p)}
                onMouseLeave={() => setHoveredPeriod(null)}
                className={cn(
                  "w-full flex items-center gap-2 px-2 py-1.5 text-[10px] font-mono transition-all border",
                  enabledPeriods.has(p)
                    ? "border-industrial-fg/20 hover:bg-industrial-bg/10"
                    : "border-transparent opacity-30"
                )}
              >
                <span className="w-4 h-[3px] flex-shrink-0" style={{ backgroundColor: PERIOD_COLORS[p] }} />
                <span className="font-bold">第{p}期</span>
                <span className="opacity-50 ml-auto">{Math.max(...PERIOD_DATA[p]).toFixed(1)}</span>
              </button>
            ))}
          </div>

          {/* Key info */}
          <div className="bg-white border-2 border-industrial-fg shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] p-3 space-y-2 text-[10px] font-mono">
            <div className="text-[9px] font-bold uppercase tracking-widest opacity-40 mb-2">关键指标</div>
            <div className="flex justify-between"><span className="opacity-50">最大位移深度</span><span className="font-bold">10.0m</span></div>
            <div className="flex justify-between"><span className="opacity-50">第8期峰值</span><span className="font-bold text-red-600">36.00mm</span></div>
            <div className="flex justify-between"><span className="opacity-50">控制值</span><span className="font-bold">50mm</span></div>
            <div className="flex justify-between"><span className="opacity-50">达控制值比</span><span className="font-bold text-amber-600">72%</span></div>
            <div className="flex justify-between"><span className="opacity-50">预警等级</span><span className="font-bold text-amber-600">黄色预警</span></div>
            <hr className="border-industrial-fg/10" />
            <div className="flex justify-between"><span className="opacity-50">第7→8期变化量</span><span className="font-bold">8.80mm</span></div>
            <div className="flex justify-between"><span className="opacity-50">第8期速率</span><span className="font-bold">1.26mm/d</span></div>
            <div className="flex justify-between"><span className="opacity-50">间隔天数</span><span>7天</span></div>
          </div>

          {/* Period info */}
          <div className="bg-white border-2 border-industrial-fg shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] p-3 space-y-1 text-[10px] font-mono">
            <div className="text-[9px] font-bold uppercase tracking-widest opacity-40 mb-2">工况</div>
            {Array.from({ length: PERIODS }, (_, i) => [
              (i + 1) + '期',
              EXCAVATION_DEPTHS[i].toFixed(1) + 'm',
              PERIOD_CONDITIONS[i].slice(0, 6),
            ]).map(([p, d, desc]) => (
              <div key={p} className="flex gap-1">
                <span className="font-bold w-7 flex-shrink-0">{p}</span>
                <span className="opacity-50 w-10 flex-shrink-0">{d}</span>
                <span className="opacity-70 truncate">{desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
