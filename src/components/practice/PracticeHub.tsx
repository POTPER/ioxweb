import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ImageIcon } from 'lucide-react';
import { Button } from '../Common';
import { PracticePageShell } from './PracticePageShell';
import { InstrumentCarousel } from './InstrumentCarousel';
import {
  PRACTICE_INSTRUMENTS,
  type PracticeInstrumentId,
} from './practiceInstruments';

interface PracticeHubProps {
  onBack: () => void;
  onStartPractice: (instrumentId: PracticeInstrumentId) => void;
  completedIds: Set<PracticeInstrumentId>;
}

export const PracticeHub: React.FC<PracticeHubProps> = ({
  onBack,
  onStartPractice,
  completedIds,
}) => {
  const [selectedId, setSelectedId] = useState<PracticeInstrumentId>('inclinometer');
  const selected = PRACTICE_INSTRUMENTS.find(i => i.id === selectedId) ?? PRACTICE_INSTRUMENTS[0];

  return (
    <PracticePageShell onBack={onBack}>
      <main className="flex-1 flex flex-col items-center px-6 pb-10 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="w-full max-w-6xl bg-white border-2 border-industrial-fg shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] flex flex-col lg:flex-row overflow-hidden"
        >
          {/* Left: instrument preview */}
          <section className="flex-1 p-8 md:p-10 flex flex-col border-b-2 lg:border-b-0 lg:border-r-2 border-industrial-fg">
            <div className="border-l-[3px] border-industrial-fg pl-4 mb-6">
              <h2 className="text-xl font-bold tracking-[0.15em] uppercase">{selected.name}</h2>
            </div>

            <motion.div
              key={selected.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="flex-1 min-h-[280px] border-2 border-industrial-fg bg-industrial-bg/40 flex flex-col items-center justify-center relative overflow-hidden"
            >
              <div className="absolute top-2 left-2 text-[9px] font-mono uppercase tracking-widest opacity-40">
                {selected.name}
              </div>
              <ImageIcon size={64} className="opacity-20" strokeWidth={1.5} />
              <div className="text-[11px] font-mono opacity-30 mt-2 uppercase tracking-wider">
                仪器预览
              </div>
            </motion.div>
          </section>

          {/* Right: task info */}
          <aside className="w-full lg:w-[340px] shrink-0 p-8 md:p-10 flex flex-col">
            <div className="border-b border-industrial-fg pb-3 mb-6">
              <h2 className="text-xl font-bold tracking-[0.15em] uppercase">任务说明</h2>
            </div>

            <div className="flex-1 space-y-2.5 mb-8">
              {selected.taskInfo.map(item => (
                <div key={item.label} className="flex items-start gap-4 text-[13px] leading-relaxed">
                  <span className="font-bold w-20 shrink-0 tracking-wider">{item.label}：</span>
                  <span className="flex-1">{item.value}</span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-industrial-fg/10">
              {selected.available ? (
                <Button
                  onClick={() => onStartPractice(selected.id)}
                  className="w-full py-3 text-sm tracking-[0.2em]"
                >
                  开始练习
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  disabled
                  className="w-full py-3 text-sm tracking-[0.2em]"
                  title="即将上线"
                >
                  即将上线
                </Button>
              )}
            </div>
          </aside>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="w-full max-w-6xl"
        >
          <InstrumentCarousel
            selectedId={selectedId}
            onSelect={setSelectedId}
            completedIds={completedIds}
          />
        </motion.div>
      </main>
    </PracticePageShell>
  );
};
