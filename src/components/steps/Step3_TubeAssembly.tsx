import React, { useState, useEffect } from 'react';
import { TechnicalCard, Button, Modal } from '../Common';
import { AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { useWireframe } from '../WireframeContext';
import { WireframePlaceholder } from '../WireframeOverlay';
import { AssemblyDiagram } from '../diagrams/AssemblyDiagram';
import { tubeAssemblyScoringConfig } from '../../data/scoringConfig';
import { getTrainingHotspots, trainingStepsByStepId } from '../../data/trainingContent';
import { calculateStepScore } from '../../lib/scoring';

export const TubeAssembly: React.FC<{ onNext: (data: any) => void }> = ({ onNext }) => {
  const { wireframeMode } = useWireframe();
  const [viewed, setViewed] = useState<Record<string, boolean>>({});
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [showDescModal, setShowDescModal] = useState<string | null>(null);
  const [showQuestionModal, setShowQuestionModal] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const stepContent = trainingStepsByStepId['prep.assembly'];

  const hotspots = getTrainingHotspots('prep.assembly').map(hotspot => ({
    id: hotspot.hotspotId,
    name: hotspot.name,
    label: hotspot.label,
    title: hotspot.title,
    desc: hotspot.desc,
    x: hotspot.x,
    y: hotspot.y,
    className: [hotspot.width, hotspot.height].filter(Boolean).join(' '),
  }));

  const getQuestion = (questionId: string) => tubeAssemblyScoringConfig.questions.find(question => question.questionId === questionId && question.type === 'singleChoice');
  const tubeQuestion = getQuestion('prep.assembly.tube');
  const connectorQuestion = getQuestion('prep.assembly.connector');
  const bottomCapQuestion = getQuestion('prep.assembly.bottomCap');
  const jointQuestion = getQuestion('prep.assembly.joint');
  const toOptions = (question: typeof tubeQuestion) => question?.type === 'singleChoice' ? question.options.map(option => ({ id: option.value, text: option.label })) : [];
  const tubeOptions = toOptions(tubeQuestion);
  const connectorOptions = toOptions(connectorQuestion);
  const bottomCapOptions = toOptions(bottomCapQuestion);
  const jointOptions = toOptions(jointQuestion);
  const hotspotMap = Object.fromEntries(hotspots.map(hotspot => [hotspot.id, hotspot]));

  const isUnlocked = (_id: string) => true;

  const handleHotspotClick = (id: string) => {
    if (!isUnlocked(id)) return;
    setShowDescModal(id);
  };

  const confirmDesc = () => {
    if (showDescModal) {
      setViewed({ ...viewed, [showDescModal]: true });
      setShowDescModal(null);
    }
  };

  const openQuestion = (id: string) => {
    setSelectedOption(answers[id] || null);
    setShowQuestionModal(id);
  };

  const handleConfirmAnswer = (id: string) => {
    if (!selectedOption) return;
    const newAnswers = { ...answers, [id]: selectedOption };
    setAnswers(newAnswers);
    setCompleted({ ...completed, [id]: true });
    setShowQuestionModal(null);
    setSelectedOption(null);
  };

  const handleSubmit = () => {
    const result = calculateStepScore(tubeAssemblyScoringConfig, [
      { questionId: 'prep.assembly.tube', answer: answers.tube },
      { questionId: 'prep.assembly.connector', answer: answers.connector },
      { questionId: 'prep.assembly.bottomCap', answer: answers.bottomCap },
      { questionId: 'prep.assembly.joint', answer: answers.joint },
    ]);

    onNext({
      ...result,
    });
  };

  useEffect(() => {
    if (Object.keys(completed).length === 4) {
      handleSubmit();
    }
  }, [completed]);

  return (
    <div className="flex flex-col min-h-[calc(100vh-13rem)]">
      <TechnicalCard title={stepContent.diagramTitle} className="flex-1 flex flex-col">
        <div className="w-full px-6 flex-1 flex flex-col justify-center">
          <WireframePlaceholder
            label={stepContent.diagramLabel}
            className="py-4"
            hotspots={[
              { id: hotspotMap.tube?.name || '测斜管管体', label: hotspotMap.tube?.label || '管材选型', labelPosition: 'bottom' as const, position: { left: hotspotMap.tube?.x || '16%', top: hotspotMap.tube?.y || '50%', transform: 'translate(-50%, -50%)' }, onClick: () => handleHotspotClick('tube'), selected: !!completed['tube'] },
              ...(viewed['tube'] ? [{ id: completed['tube'] ? '✓' : '?', label: hotspotMap.tube?.label || '管材选型', labelPosition: 'right' as const, position: { left: `calc(${hotspotMap.tube?.x || '16%'} + 28px)`, top: hotspotMap.tube?.y || '50%', transform: 'translateY(-50%)' } as React.CSSProperties, onClick: () => openQuestion('tube'), selected: !!completed['tube'], className: 'w-5 h-5 rounded-full text-[9px]', zIndex: 20 }] : []),
              { id: hotspotMap.joint?.name || '管节连接', label: hotspotMap.joint?.label || '管节连接', labelPosition: 'bottom' as const, position: { left: hotspotMap.joint?.x || '37%', top: hotspotMap.joint?.y || '50%', transform: 'translate(-50%, -50%)' }, onClick: () => handleHotspotClick('joint'), selected: !!completed['joint'], className: hotspotMap.joint?.className || 'w-7 h-9' },
              ...(viewed['joint'] ? [{ id: completed['joint'] ? '✓' : '?', label: hotspotMap.joint?.label || '管节连接', labelPosition: 'right' as const, position: { left: `calc(${hotspotMap.joint?.x || '37%'} + 22px)`, top: hotspotMap.joint?.y || '50%', transform: 'translateY(-50%)' } as React.CSSProperties, onClick: () => openQuestion('joint'), selected: !!completed['joint'], className: 'w-5 h-5 rounded-full text-[9px]', zIndex: 20 }] : []),
              { id: hotspotMap.connector?.name || '连接头', label: hotspotMap.connector?.label || '连接头选型', labelPosition: 'bottom' as const, position: { left: hotspotMap.connector?.x || '50%', top: hotspotMap.connector?.y || '50%', transform: 'translate(-50%, -50%)' }, onClick: () => handleHotspotClick('connector'), selected: !!completed['connector'] },
              ...(viewed['connector'] ? [{ id: completed['connector'] ? '✓' : '?', label: hotspotMap.connector?.label || '连接头选型', labelPosition: 'right' as const, position: { left: `calc(${hotspotMap.connector?.x || '50%'} + 28px)`, top: hotspotMap.connector?.y || '50%', transform: 'translateY(-50%)' } as React.CSSProperties, onClick: () => openQuestion('connector'), selected: !!completed['connector'], className: 'w-5 h-5 rounded-full text-[9px]', zIndex: 20 }] : []),
              { id: hotspotMap.bottomCap?.name || '底盖连接', label: hotspotMap.bottomCap?.label || '底盖操作', labelPosition: 'bottom' as const, position: { left: hotspotMap.bottomCap?.x || '80%', top: hotspotMap.bottomCap?.y || '50%', transform: 'translate(-50%, -50%)' }, onClick: () => handleHotspotClick('bottomCap'), selected: !!completed['bottomCap'], className: hotspotMap.bottomCap?.className || 'w-7 h-9' },
              ...(viewed['bottomCap'] ? [{ id: completed['bottomCap'] ? '✓' : '?', label: hotspotMap.bottomCap?.label || '底盖操作', labelPosition: 'right' as const, position: { left: `calc(${hotspotMap.bottomCap?.x || '80%'} + 22px)`, top: hotspotMap.bottomCap?.y || '50%', transform: 'translateY(-50%)' } as React.CSSProperties, onClick: () => openQuestion('bottomCap'), selected: !!completed['bottomCap'], className: 'w-5 h-5 rounded-full text-[9px]', zIndex: 20 }] : []),
            ]}
          >
            <AssemblyDiagram
              viewed={viewed}
              completed={completed}
              answers={answers}
              tubeOptions={tubeOptions}
              connectorOptions={connectorOptions}
              bottomCapOptions={bottomCapOptions}
              jointOptions={jointOptions}
              labels={{
                tube: hotspotMap.tube?.name || '',
                connector: hotspotMap.connector?.name || '',
                joint: hotspotMap.joint?.name || '',
                bottomCap: hotspotMap.bottomCap?.name || '',
                bottomCapEnd: '底盖',
              }}
              onHotspotClick={handleHotspotClick}
              onQuestionClick={openQuestion}
            />
          </WireframePlaceholder>
        </div>
      </TechnicalCard>

      {/* Description Modal */}
      <Modal 
        isOpen={!!showDescModal} 
        onClose={() => setShowDescModal(null)}
        title={hotspots.find(h => h.id === showDescModal)?.title || ''}
      >
        <div className="space-y-6">
          <p className="text-xs leading-relaxed opacity-80">
            {hotspots.find(h => h.id === showDescModal)?.desc}
          </p>
          <div className="flex justify-center">
            <Button onClick={confirmDesc} className="px-8">知道了</Button>
          </div>
        </div>
      </Modal>

      {/* Question Modals */}
      <AnimatePresence>
        {showQuestionModal === 'tube' && (
          <Modal isOpen={true} onClose={() => { setShowQuestionModal(null); setSelectedOption(null); }} title="管材选型">
            <div className="space-y-4">
              <p className="text-xs font-bold">{tubeQuestion?.prompt}</p>
              <div className="space-y-2">
                {tubeOptions.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setSelectedOption(opt.id)}
                    className={cn(
                      "w-full text-left p-3 text-xs border transition-all",
                      selectedOption === opt.id
                        ? "border-industrial-fg bg-industrial-fg text-white"
                        : "border-industrial-fg/20 hover:border-industrial-fg"
                    )}
                  >
                    <span className="font-bold mr-2">{opt.id}.</span>
                    {opt.text}
                  </button>
                ))}
              </div>
              <div className="flex justify-center pt-4 border-t border-industrial-fg/10">
                <Button onClick={() => handleConfirmAnswer('tube')} className="px-12" disabled={!selectedOption}>确认</Button>
              </div>
            </div>
          </Modal>
        )}

        {showQuestionModal === 'connector' && (
          <Modal isOpen={true} onClose={() => { setShowQuestionModal(null); setSelectedOption(null); }} title="连接头选型">
            <div className="space-y-4">
              <p className="text-xs font-bold">{connectorQuestion?.prompt}</p>
              <div className="space-y-2">
                {connectorOptions.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setSelectedOption(opt.id)}
                    className={cn(
                      "w-full text-left p-3 text-xs border transition-all",
                      selectedOption === opt.id
                        ? "border-industrial-fg bg-industrial-fg text-white"
                        : "border-industrial-fg/20 hover:border-industrial-fg"
                    )}
                  >
                    <span className="font-bold mr-2">{opt.id}.</span>
                    {opt.text}
                  </button>
                ))}
              </div>
              <div className="flex justify-center pt-4 border-t border-industrial-fg/10">
                <Button onClick={() => handleConfirmAnswer('connector')} className="px-12" disabled={!selectedOption}>确认</Button>
              </div>
            </div>
          </Modal>
        )}

        {showQuestionModal === 'bottomCap' && (
          <Modal isOpen={true} onClose={() => { setShowQuestionModal(null); setSelectedOption(null); }} title="底盖操作方式">
            <div className="space-y-4">
              <p className="text-xs font-bold">{bottomCapQuestion?.prompt}</p>
              <div className="space-y-2">
                {bottomCapOptions.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setSelectedOption(opt.id)}
                    className={cn(
                      "w-full text-left p-3 text-xs border transition-all",
                      selectedOption === opt.id
                        ? "border-industrial-fg bg-industrial-fg text-white"
                        : "border-industrial-fg/20 hover:border-industrial-fg"
                    )}
                  >
                    <span className="font-bold mr-2">{opt.id}.</span>
                    {opt.text}
                  </button>
                ))}
              </div>
              <div className="flex justify-center pt-4 border-t border-industrial-fg/10">
                <Button onClick={() => handleConfirmAnswer('bottomCap')} className="px-12" disabled={!selectedOption}>确认</Button>
              </div>
            </div>
          </Modal>
        )}

        {showQuestionModal === 'joint' && (
          <Modal isOpen={true} onClose={() => { setShowQuestionModal(null); setSelectedOption(null); }} title="管节连接操作流程">
            <div className="space-y-4">
              <p className="text-xs font-bold">{jointQuestion?.prompt}</p>
              <div className="space-y-2">
                {jointOptions.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setSelectedOption(opt.id)}
                    className={cn(
                      "w-full text-left p-3 text-xs border transition-all",
                      selectedOption === opt.id
                        ? "border-industrial-fg bg-industrial-fg text-white"
                        : "border-industrial-fg/20 hover:border-industrial-fg"
                    )}
                  >
                    <span className="font-bold mr-2">{opt.id}.</span>
                    {opt.text}
                  </button>
                ))}
              </div>
              <div className="flex justify-center pt-4 border-t border-industrial-fg/10">
                <Button onClick={() => handleConfirmAnswer('joint')} className="px-12" disabled={!selectedOption}>确认</Button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
};
