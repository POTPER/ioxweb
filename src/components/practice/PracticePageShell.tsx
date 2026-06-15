import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../Common';
import { PRACTICE_PLATFORM_TITLE } from './practiceInstruments';

interface PracticePageShellProps {
  onBack: () => void;
  backLabel?: string;
  confirmOnBack?: boolean;
  confirmMessage?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export const PracticePageShell: React.FC<PracticePageShellProps> = ({
  onBack,
  backLabel = '返回',
  confirmOnBack = false,
  confirmMessage,
  footer,
  children,
}) => {
  const handleBack = () => {
    if (confirmOnBack) {
      const message = confirmMessage ?? '确认返回？';
      if (!window.confirm(message)) return;
    }
    onBack();
  };

  return (
    <div className="min-h-screen bg-industrial-bg text-industrial-fg flex flex-col">
      <header className="relative z-10 pt-10 pb-6 flex justify-center shrink-0">
        <div className="absolute left-6 top-10">
          <Button
            variant="secondary"
            onClick={handleBack}
            className="flex items-center gap-2 px-4 py-2 text-sm tracking-wider"
          >
            <ArrowLeft size={16} />
            {backLabel}
          </Button>
        </div>
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-3xl md:text-4xl font-bold tracking-[0.2em] uppercase text-center px-24"
        >
          {PRACTICE_PLATFORM_TITLE}
        </motion.h1>
      </header>

      <div className="relative z-10 flex-1 flex flex-col min-h-0">{children}</div>

      {footer && (
        <footer className="relative z-10 shrink-0 border-t border-industrial-fg/20 bg-industrial-bg/5 py-2">
          {footer}
        </footer>
      )}
    </div>
  );
};
