import React from 'react';
import { cn } from '../lib/utils';

export type TrainingHotspotButtonProps = {
  label: React.ReactNode;
  selected?: boolean;
  active?: boolean;
  muted?: boolean;
  absolute?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  onMouseEnter?: React.MouseEventHandler<HTMLButtonElement>;
  onMouseLeave?: React.MouseEventHandler<HTMLButtonElement>;
};

export const TrainingHotspotButton: React.FC<TrainingHotspotButtonProps> = ({
  label,
  selected,
  active,
  muted,
  absolute = true,
  className,
  style,
  onClick,
  onMouseEnter,
  onMouseLeave,
}) => (
  <button
    type="button"
    onClick={onClick}
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
    className={cn(
      absolute && 'absolute',
      'min-w-16 h-8 flex items-center justify-center transition-all duration-300 z-20',
      selected ? 'scale-110' : 'hover:scale-125',
      muted && 'opacity-50',
      className
    )}
    style={style}
  >
    <div className={cn(
      'absolute inset-0 rounded-sm border-2 border-industrial-fg animate-ping opacity-20',
      (selected || active || muted) && 'hidden'
    )} />
    <div className={cn(
      'relative w-full h-full rounded-sm border-2 border-industrial-fg flex items-center justify-center px-2 whitespace-nowrap font-bold text-[10px] transition-colors shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]',
      selected ? 'bg-green-500 text-white' : active ? 'bg-industrial-fg text-white' : 'bg-white'
    )}>
      {label}
    </div>
  </button>
);

export type TrainingQuestionButtonProps = {
  label: React.ReactNode;
  completed?: boolean;
  absolute?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
};

export const TrainingQuestionButton: React.FC<TrainingQuestionButtonProps> = ({
  label,
  completed,
  absolute = true,
  className,
  style,
  onClick,
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      absolute && 'absolute',
      'z-20 flex items-center',
      className
    )}
    style={style}
  >
    <div className={cn(
      'flex items-center space-x-1 px-2 py-1 rounded-full border border-industrial-fg text-[10px] font-bold transition-all whitespace-nowrap',
      completed ? 'bg-green-100 text-green-700' : 'bg-white text-industrial-fg'
    )}>
      <span className={cn(
        'w-4 h-4 rounded-full border flex items-center justify-center text-[8px]',
        completed ? 'bg-green-600 border-green-600 text-white' : 'bg-yellow-400 border-industrial-fg text-industrial-fg'
      )}>
        {completed ? '✓' : <span className="inline-block animate-rotate-y">?</span>}
      </span>
      <span>{label}</span>
    </div>
  </button>
);
