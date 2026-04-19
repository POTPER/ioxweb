import React from 'react';
import { useWireframe } from './WireframeContext';
import { cn } from '../lib/utils';

/**
 * Hotspot definition for embedding interactive points inside a placeholder.
 */
export interface PlaceholderHotspot {
  id: string;
  label: string;
  position: React.CSSProperties;
  onClick?: () => void;
  selected?: boolean;
  className?: string;
  zIndex?: number;
  labelPosition?: 'right' | 'bottom';
}

/**
 * WireframePlaceholder — wraps a content area.
 * Normal mode: renders children as-is.
 * Wireframe mode: renders a gray placeholder box with a label,
 * optionally with interactive hotspots positioned inside.
 */
export const WireframePlaceholder: React.FC<{
  label: string;
  children: React.ReactNode;
  className?: string;
  hotspots?: PlaceholderHotspot[];
  forceWireframe?: boolean;
}> = ({ label, children, className, hotspots, forceWireframe }) => {
  const { wireframeMode } = useWireframe();

  if (!wireframeMode && !forceWireframe) return <>{children}</>;

  return (
    <div className={cn("relative bg-gray-100 border-2 border-dashed border-gray-400 min-h-[120px]", className)}>
      <span className="absolute top-2 left-2 text-gray-400 font-mono text-[10px] font-bold select-none z-0">{label}</span>
      {hotspots && hotspots.length > 0 && (
        <>
          {hotspots.map(h => (
            <button
              key={h.id}
              onClick={h.onClick}
              className={cn(
                "absolute border-2 flex items-center justify-center transition-all",
                !h.className && "w-9 h-9",
                h.selected
                  ? "bg-green-600 border-green-600 text-white"
                  : "bg-white/80 border-green-500 hover:bg-green-50 text-green-700",
                h.className
              )}
              style={{ ...h.position, zIndex: h.zIndex ?? 10 }}
            >
              <span className="text-xs font-bold">{h.id}</span>
              {h.label && h.labelPosition === 'bottom' ? (
                <span className="absolute top-full mt-1 left-1/2 -translate-x-1/2 text-[9px] font-bold text-gray-600 whitespace-nowrap">{h.label}</span>
              ) : h.label ? (
                <span className="absolute left-full ml-1.5 text-[10px] font-bold text-gray-600 whitespace-nowrap">{h.label}</span>
              ) : null}
            </button>
          ))}
        </>
      )}
    </div>
  );
};

/**
 * WireframeHotspot — wraps an interactive element.
 * Normal mode: renders children with no visual change.
 * Wireframe mode: adds a green border overlay and a corner label.
 */
export const WireframeHotspot: React.FC<{
  label: string;
  children: React.ReactNode;
  className?: string;
  shape?: 'rect' | 'circle';
}> = ({ label, children, className, shape = 'rect' }) => {
  const { wireframeMode } = useWireframe();

  if (!wireframeMode) return <>{children}</>;

  return (
    <div className={cn("relative", className)}>
      {/* Green overlay frame */}
      <div
        className={cn(
          "absolute inset-0 z-50 pointer-events-none",
          shape === 'circle'
            ? "border-2 border-green-500 rounded-full bg-green-500/10"
            : "border-2 border-green-500 bg-green-500/5"
        )}
      >
        <span className="absolute -top-4 left-0 text-[8px] font-mono font-bold text-green-600 bg-white px-1 whitespace-nowrap leading-tight">
          {label}
        </span>
      </div>
      {children}
    </div>
  );
};
