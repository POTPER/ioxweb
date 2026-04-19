import React from 'react';
import { cn } from '../lib/utils';

interface TechnicalCardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  headerAction?: React.ReactNode;
}

export const TechnicalCard: React.FC<TechnicalCardProps> = ({ title, children, className, headerAction }) => {
  return (
    <div className={cn("brutalist-card", className)}>
      {title && (
        <div className="flex justify-between items-center mb-4 border-b border-industrial-fg pb-2">
          <h3 className="technical-heading mb-0 border-none">{title}</h3>
          {headerAction}
        </div>
      )}
      {children}
    </div>
  );
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
}

export const Button: React.FC<ButtonProps> = ({ variant = 'primary', className, ...props }) => {
  return (
    <button 
      className={cn(
        variant === 'primary' ? 'brutalist-button-primary' : 'brutalist-button-secondary',
        className
      )}
      {...props}
    />
  );
};

export const TechnicalInput: React.FC<{
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  unit?: string;
}> = ({ label, value, onChange, placeholder, unit }) => {
  return (
    <div className="mb-4">
      <label className="technical-label">{label}</label>
      <div className="relative">
        <input 
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full border border-industrial-fg bg-white p-2 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-industrial-info"
        />
        {unit && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[10px] opacity-50 uppercase">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
};

export const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}> = ({ isOpen, onClose, title, children, maxWidth }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-industrial-fg/40 backdrop-blur-sm" onClick={onClose} />
      <div className={cn("relative w-full bg-white border-2 border-industrial-fg shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] overflow-hidden", maxWidth || "max-w-md")}>
        <div className="flex items-center justify-between p-4 border-b-2 border-industrial-fg bg-industrial-bg/10">
          <h3 className="font-bold uppercase tracking-widest text-sm">{title}</h3>
          <button onClick={onClose} className="hover:bg-industrial-fg hover:text-white p-1 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

import { X } from 'lucide-react';
