import React from 'react';
import { motion } from 'motion/react';
import { User, Cloud } from 'lucide-react';
import { Weather, Equipment, weatherOptions, safetyOptions, instrumentOptions } from './types';

interface CharacterPreviewProps {
  selectedWeather: string | null;
  selectedSafety: string[];
  selectedInstrument: string | null;
}

export const CharacterPreview: React.FC<CharacterPreviewProps> = ({
  selectedWeather,
  selectedSafety,
  selectedInstrument
}) => {
  const weatherData = weatherOptions.find(w => w.id === selectedWeather);
  const instrumentData = instrumentOptions.find(i => i.id === selectedInstrument);

  return (
    <div className="relative border-2 border-industrial-fg bg-white overflow-hidden shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
      {/* Background Layer */}
      <div 
        className="absolute inset-0 transition-all duration-700 bg-cover bg-center opacity-40"
        style={{ 
          backgroundImage: weatherData ? `url(${weatherData.bgImage})` : 'none',
          backgroundColor: !selectedWeather ? '#f3f4f6' : 'transparent'
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

          {/* Safety Layers */}
          {selectedSafety.map(id => {
            const opt = safetyOptions.find(s => s.id === id);
            return (
              <motion.img
                key={id}
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                src={opt?.layerImage}
                alt={opt?.name}
                className="absolute inset-0 z-20 w-full h-full object-contain pointer-events-none"
                referrerPolicy="no-referrer"
              />
            );
          })}

          {/* Instrument Layer */}
          {selectedInstrument && (
            <motion.img
              key={selectedInstrument}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              src={instrumentData?.layerImage}
              className="absolute inset-0 z-30 w-full h-full object-contain pointer-events-none"
              referrerPolicy="no-referrer"
            />
          )}
        </div>
      </div>

    </div>
  );
};
