import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle2, ImageIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import { PRACTICE_INSTRUMENTS, type PracticeInstrumentId } from './practiceInstruments';

interface InstrumentCarouselProps {
  selectedId: PracticeInstrumentId;
  onSelect: (id: PracticeInstrumentId) => void;
  completedIds: Set<PracticeInstrumentId>;
}

export const InstrumentCarousel: React.FC<InstrumentCarouselProps> = ({
  selectedId,
  onSelect,
  completedIds,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = direction === 'left' ? -220 : 220;
    el.scrollBy({ left: amount, behavior: 'smooth' });
  };

  return (
    <div className="relative border-2 border-industrial-fg bg-white px-12 py-4 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
      <button
        type="button"
        onClick={() => scroll('left')}
        className="absolute left-3 top-1/2 -translate-y-1/2 z-10 border border-industrial-fg bg-white hover:bg-industrial-bg opacity-70 hover:opacity-100 transition-all p-1"
        aria-label="向左滚动"
      >
        <ChevronLeft size={18} />
      </button>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto px-2 py-2"
        style={{ scrollbarWidth: 'none' }}
      >
        {PRACTICE_INSTRUMENTS.map(instrument => {
          const isSelected = instrument.id === selectedId;
          const isCompleted = completedIds.has(instrument.id);

          return (
            <button
              key={instrument.id}
              type="button"
              onClick={() => onSelect(instrument.id)}
              className={cn(
                'relative flex-shrink-0 w-[180px] h-[120px] transition-all duration-200 border-2',
                isSelected
                  ? 'bg-industrial-fg text-industrial-bg border-industrial-fg shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]'
                  : 'bg-white border-industrial-fg hover:bg-industrial-bg/30',
              )}
            >
              {isCompleted && (
                <span className="absolute top-2 right-2 z-10">
                  <CheckCircle2 size={16} className="text-green-600" />
                </span>
              )}

              <div className="absolute inset-0 flex flex-col items-center justify-center p-3">
                <div
                  className={cn(
                    'w-14 h-14 mb-2 flex items-center justify-center border',
                    isSelected
                      ? 'border-industrial-bg/30 bg-industrial-bg/10'
                      : 'border-industrial-fg/30 bg-industrial-bg/40',
                  )}
                >
                  <ImageIcon
                    size={24}
                    className={cn('opacity-30', isSelected && 'opacity-50')}
                    strokeWidth={1.5}
                  />
                </div>
                <span className="text-xs font-bold tracking-wider">{instrument.name}</span>
              </div>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => scroll('right')}
        className="absolute right-3 top-1/2 -translate-y-1/2 z-10 border border-industrial-fg bg-white hover:bg-industrial-bg opacity-70 hover:opacity-100 transition-all p-1"
        aria-label="向右滚动"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
};
