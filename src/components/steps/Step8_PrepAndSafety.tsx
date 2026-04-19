import React, { useState, useEffect } from 'react';
import { Button, Modal } from '../Common';
import { cn } from '../../lib/utils';
import { useWireframe } from '../WireframeContext';
import { WireframePlaceholder } from '../WireframeOverlay';
import { weatherOptions, safetyOptions, instrumentOptions, Weather, Equipment } from './prep-and-safety/types';
import { CharacterPreview } from './prep-and-safety/CharacterPreview';
import { OptionSection } from './prep-and-safety/OptionSection';

export const PrepAndSafety: React.FC<{ onNext: (data: any) => void }> = ({ onNext }) => {
  const [selectedWeather, setSelectedWeather] = useState<string | null>(null);
  const [selectedSafety, setSelectedSafety] = useState<string[]>([]);
  const [selectedInstrument, setSelectedInstrument] = useState<string | null>(null);
  
  const { wireframeMode } = useWireframe();
  const [activeModal, setActiveModal] = useState<{ type: 'weather' | 'safety' | 'instrument'; id: string } | null>(null);
  const [browseHistory, setBrowseHistory] = useState<{ weather: string[]; safety: string[]; instrument: string[] }>({
    weather: [],
    safety: [],
    instrument: []
  });

  const handleCardClick = (type: 'weather' | 'safety' | 'instrument', id: string) => {
    setActiveModal({ type, id });
    setBrowseHistory(prev => ({
      ...prev,
      [type]: [...prev[type], id]
    }));
  };

  const handleEquip = () => {
    if (!activeModal) return;
    const { type, id } = activeModal;
    if (type === 'weather') {
      setSelectedWeather(id);
    } else if (type === 'safety') {
      setSelectedSafety(prev => 
        prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
      );
    } else if (type === 'instrument') {
      setSelectedInstrument(id);
    }
    setActiveModal(null);
  };

  const handleSubmit = () => {
    const scoreInstrument = selectedInstrument === 'A' ? 2 : 0;
    const isSafetyCorrect = selectedSafety.length === 2 && 
                           selectedSafety.includes('1') && 
                           selectedSafety.includes('2');
    const scoreSafety = isSafetyCorrect ? 2 : 0;
    const scoreWeather = selectedWeather === 'A' ? 2 : 0;

    const weatherData = weatherOptions.find(w => w.id === selectedWeather);

    onNext({
      stepId: 'step8',
      stepName: '测前准备与安全防护',
      submittedAt: new Date().toISOString(),
      totalScore: scoreInstrument + scoreSafety + scoreWeather,
      maxScore: 6,
      answers: [
        {
          questionId: '2-1-1',
          type: 'equipment',
          label: '测量仪器',
          userAnswer: instrumentOptions.find(i => i.id === selectedInstrument)?.name || '未选',
          correctAnswer: '滑动式测斜仪',
          score: scoreInstrument,
          maxScore: 2
        },
        {
          questionId: '2-1-2',
          type: 'equipment-multi',
          label: '安全防护',
          userAnswer: selectedSafety.map(id => safetyOptions.find(s => s.id === id)?.name),
          correctAnswer: ['安全帽', '反光背心'],
          score: scoreSafety,
          maxScore: 2
        },
        {
          questionId: '2-1-3',
          type: 'environment',
          label: '环境确认',
          userAnswer: weatherData?.name || '未选',
          correctAnswer: '多云微风',
          score: scoreWeather,
          maxScore: 2
        }
      ],
      browseHistory,
    });
  };

  const canDepart = selectedWeather !== null && selectedSafety.length > 0 && selectedInstrument !== null;

  useEffect(() => {
    if (canDepart) {
      handleSubmit();
    }
  }, [canDepart]);

  const activeOption = activeModal ? (
    activeModal.type === 'weather' ? weatherOptions.find(o => o.id === activeModal.id) :
    activeModal.type === 'safety' ? safetyOptions.find(o => o.id === activeModal.id) :
    instrumentOptions.find(o => o.id === activeModal.id)
  ) : null;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <WireframePlaceholder label="L1-L4: 人物预览区（背景+角色+装备图层叠加）" className="min-h-0">
          <CharacterPreview 
            selectedWeather={selectedWeather}
            selectedSafety={selectedSafety}
            selectedInstrument={selectedInstrument}
          />
        </WireframePlaceholder>

        <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar">
          <OptionSection 
            title="环境确认"
            options={weatherOptions}
            selectedIds={selectedWeather}
            onCardClick={(id) => handleCardClick('weather', id)}
            typeLabel="单选"
            statusLabel={selectedWeather ? `已确认: ${weatherOptions.find(w => w.id === selectedWeather)?.name}` : undefined}
          />

          <OptionSection 
            title="安全防护"
            options={safetyOptions}
            selectedIds={selectedSafety}
            onCardClick={(id) => handleCardClick('safety', id)}
            typeLabel="多选"
            statusLabel={selectedSafety.length > 0 ? `已选: ${selectedSafety.length} 项` : undefined}
          />

          <OptionSection 
            title="测量仪器"
            options={instrumentOptions}
            selectedIds={selectedInstrument}
            onCardClick={(id) => handleCardClick('instrument', id)}
            typeLabel="单选"
            statusLabel={selectedInstrument ? `已装备: ${instrumentOptions.find(i => i.id === selectedInstrument)?.name}` : undefined}
          />
        </div>
      </div>

      <Modal
        isOpen={activeModal !== null}
        onClose={() => setActiveModal(null)}
        title={activeOption?.name || ''}
      >
        {activeOption && (
          <div className="space-y-6">
            <p className="text-xs leading-relaxed opacity-80">
              {activeOption.desc}
            </p>

            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-industrial-fg/10">
              <Button 
                onClick={handleEquip}
                className="w-full"
              >
                选择
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => setActiveModal(null)}
                className="w-full"
              >
                取消
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
