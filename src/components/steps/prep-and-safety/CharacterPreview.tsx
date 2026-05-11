import React from 'react';
import { motion } from 'motion/react';
import { User } from 'lucide-react';

interface CharacterPreviewProps {
  selectedWeatherLabel?: string;
  selectedSafetyLabels: string[];
  selectedInstrumentLabel?: string;
}

export const CharacterPreview: React.FC<CharacterPreviewProps> = ({
  selectedWeatherLabel,
  selectedSafetyLabels,
  selectedInstrumentLabel
}) => {
  return (
    <div className="relative border-2 border-industrial-fg bg-white overflow-hidden shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
      {/* Background Layer */}
      <div 
        className="absolute inset-0 transition-all duration-700 bg-cover bg-center opacity-40"
        style={{ 
          backgroundImage: selectedWeatherLabel ? `linear-gradient(135deg, rgba(251,191,36,0.25), rgba(34,197,94,0.18))` : 'none',
          backgroundColor: !selectedWeatherLabel ? '#f3f4f6' : 'transparent'
        }}
      />
      
      {/* Character Container */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="relative w-full h-full max-w-[300px] flex items-center justify-center">
          {/* Base Character */}
          <div className="relative z-10 w-full h-full flex items-center justify-center">
            <User size={240} className="text-industrial-fg/20" strokeWidth={0.5} />
            <div className="absolute inset-0 flex items-center justify-center font-mono text-[10px] opacity-20 uppercase tracking-widest">
              [ 监测人员立绘底图 ]
            </div>
          </div>

          <div className="absolute left-2 top-2 z-20 space-y-1">
            {selectedWeatherLabel && (
              <motion.div
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                className="border border-industrial-fg bg-white px-2 py-1 font-mono text-[9px] font-bold"
              >
                环境: {selectedWeatherLabel}
              </motion.div>
            )}
            {selectedSafetyLabels.map(label => (
              <motion.div
                key={label}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                className="border border-green-600 bg-green-50 px-2 py-1 font-mono text-[9px] font-bold text-green-700"
              >
                防护: {label}
              </motion.div>
            ))}
          </div>

          {selectedInstrumentLabel && (
            <motion.div
              key={selectedInstrumentLabel}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="absolute right-2 bottom-2 z-30 border-2 border-industrial-fg bg-yellow-100 px-3 py-2 font-mono text-[10px] font-black shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]"
            >
              仪器: {selectedInstrumentLabel}
            </motion.div>
          )}
        </div>
      </div>

    </div>
  );
};
