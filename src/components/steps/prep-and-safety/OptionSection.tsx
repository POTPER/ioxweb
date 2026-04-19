import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Weather, Equipment } from './types';
import { useWireframe } from '../../WireframeContext';

interface OptionSectionProps {
  title: string;
  options: (Weather | Equipment)[];
  selectedIds: string | string[] | null;
  onCardClick: (id: string) => void;
  typeLabel: string;
  statusLabel?: string;
}

export const OptionSection: React.FC<OptionSectionProps> = ({
  title,
  options,
  selectedIds,
  onCardClick,
  typeLabel,
  statusLabel
}) => {
  const { wireframeMode } = useWireframe();

  const isSelected = (id: string) => {
    if (Array.isArray(selectedIds)) {
      return selectedIds.includes(id);
    }
    return selectedIds === id;
  };

  return (
    <section className="space-y-1.5">
      <div className="flex items-center justify-between border-b border-industrial-fg pb-0.5">
        <h3 className="text-[10px] font-bold uppercase tracking-widest flex items-center">
          {title}
        </h3>
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {options.map(opt => (
          <button
            key={opt.id}
            onClick={() => onCardClick(opt.id)}
            className={cn(
              "group relative p-1.5 border-2 transition-all text-left",
              isSelected(opt.id)
                ? "border-green-500 bg-green-50 shadow-[2px_2px_0px_0px_rgba(34,197,94,1)]" 
                : wireframeMode
                  ? "border-dashed border-gray-400 bg-gray-100 hover:bg-gray-200"
                  : "border-industrial-fg/20 hover:border-industrial-fg bg-white"
            )}
          >
            {wireframeMode ? (
              <>
                <div className="aspect-square bg-gray-200 border border-dashed border-gray-400 flex items-center justify-center mb-1">
                  <span className="font-mono text-[9px] text-gray-400 font-bold">img</span>
                </div>
                <div className="text-[9px] font-bold uppercase leading-tight truncate w-full text-gray-500">{opt.name}</div>
              </>
            ) : (
              <>
                <div className="aspect-square bg-gray-100 mb-1 overflow-hidden">
                  <img 
                    src={opt.image} 
                    alt={opt.name} 
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" 
                    referrerPolicy="no-referrer" 
                  />
                </div>
                <div className="text-[9px] font-bold uppercase leading-tight truncate w-full">{opt.name}</div>
              </>
            )}
            {isSelected(opt.id) && (
              <div className="absolute top-1 right-1 bg-green-500 text-white rounded-full p-0.5">
                <CheckCircle2 size={10} />
              </div>
            )}
          </button>
        ))}
      </div>
    </section>
  );
};
