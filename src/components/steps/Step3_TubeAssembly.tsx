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
    label: hotspot.label,
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
  const toOptions = (question: typeof tubeQuestion) => question?.type === 'singleChoice' ? question.options.map(option => ({ id: option.value, code: option.code, text: option.label })) : [];
  const tubeOptions = toOptions(tubeQuestion);
  const connectorOptions = toOptions(connectorQuestion);
  const bottomCapOptions = toOptions(bottomCapQuestion);
  const jointOptions = toOptions(jointQuestion);
  const questionLabels = {
    tube: tubeQuestion?.label || '',
    connector: connectorQuestion?.label || '',
    bottomCap: bottomCapQuestion?.label || '',
    joint: jointQuestion?.label || '',
  };
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
              { id: hotspotMap.tube?.label || '', label: hotspotMap.tube?.label || '', labelPosition: 'bottom' as const, position: { left: hotspotMap.tube?.x || '16%', top: hotspotMap.tube?.y || '50%', transform: 'translate(-50%, -50%)' }, onClick: () => handleHotspotClick('tube'), selected: !!completed['tube'] },
              ...(viewed['tube'] ? [{ id: `${completed['tube'] ? '\u2713' : '?'} ${questionLabels.tube}`, label: '', labelPosition: 'right' as const, position: { left: `calc(${hotspotMap.tube?.x || '16%'} + 28px)`, top: hotspotMap.tube?.y || '50%', transform: 'translateY(-50%)' } as React.CSSProperties, onClick: () => openQuestion('tube'), selected: !!completed['tube'], className: 'min-w-20 h-7 px-2 text-[10px] whitespace-nowrap', zIndex: 20 }] : []),
              { id: hotspotMap.joint?.label || '', label: hotspotMap.joint?.label || '', labelPosition: 'bottom' as const, position: { left: hotspotMap.joint?.x || '37%', top: hotspotMap.joint?.y || '50%', transform: 'translate(-50%, -50%)' }, onClick: () => handleHotspotClick('joint'), selected: !!completed['joint'], className: hotspotMap.joint?.className || 'w-7 h-9' },
              ...(viewed['joint'] ? [{ id: `${completed['joint'] ? '\u2713' : '?'} ${questionLabels.joint}`, label: '', labelPosition: 'right' as const, position: { left: `calc(${hotspotMap.joint?.x || '37%'} + 22px)`, top: hotspotMap.joint?.y || '50%', transform: 'translateY(-50%)' } as React.CSSProperties, onClick: () => openQuestion('joint'), selected: !!completed['joint'], className: 'min-w-20 h-7 px-2 text-[10px] whitespace-nowrap', zIndex: 20 }] : []),
              { id: hotspotMap.connector?.label || '', label: hotspotMap.connector?.label || '', labelPosition: 'bottom' as const, position: { left: hotspotMap.connector?.x || '50%', top: hotspotMap.connector?.y || '50%', transform: 'translate(-50%, -50%)' }, onClick: () => handleHotspotClick('connector'), selected: !!completed['connector'] },
              ...(viewed['connector'] ? [{ id: `${completed['connector'] ? '\u2713' : '?'} ${questionLabels.connector}`, label: '', labelPosition: 'right' as const, position: { left: `calc(${hotspotMap.connector?.x || '50%'} + 28px)`, top: hotspotMap.connector?.y || '50%', transform: 'translateY(-50%)' } as React.CSSProperties, onClick: () => openQuestion('connector'), selected: !!completed['connector'], className: 'min-w-20 h-7 px-2 text-[10px] whitespace-nowrap', zIndex: 20 }] : []),
              { id: hotspotMap.bottomCap?.label || '', label: hotspotMap.bottomCap?.label || '', labelPosition: 'bottom' as const, position: { left: hotspotMap.bottomCap?.x || '80%', top: hotspotMap.bottomCap?.y || '50%', transform: 'translate(-50%, -50%)' }, onClick: () => handleHotspotClick('bottomCap'), selected: !!completed['bottomCap'], className: hotspotMap.bottomCap?.className || 'w-7 h-9' },
              ...(viewed['bottomCap'] ? [{ id: `${completed['bottomCap'] ? '\u2713' : '?'} ${questionLabels.bottomCap}`, label: '', labelPosition: 'right' as const, position: { left: `calc(${hotspotMap.bottomCap?.x || '80%'} + 22px)`, top: hotspotMap.bottomCap?.y || '50%', transform: 'translateY(-50%)' } as React.CSSProperties, onClick: () => openQuestion('bottomCap'), selected: !!completed['bottomCap'], className: 'min-w-20 h-7 px-2 text-[10px] whitespace-nowrap', zIndex: 20 }] : []),
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
                tube: hotspotMap.tube?.label || '',
                connector: hotspotMap.connector?.label || '',
                joint: hotspotMap.joint?.label || '',
                bottomCap: hotspotMap.bottomCap?.label || '',
                bottomCapEnd: '\u5e95\u76d6',
              }}
              questionLabels={questionLabels}
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
        title={hotspots.find(h => h.id === showDescModal)?.label || ''}
      >
        <div className="space-y-6">
          <p className="text-xs leading-relaxed opacity-80">
            {hotspots.find(h => h.id === showDescModal)?.desc}
          </p>
          <div className="flex justify-center">
            <Button onClick={confirmDesc} className="px-8">{'\u77e5\u9053\u4e86'}</Button>
          </div>
        </div>
      </Modal>

      {/* Question Modals */}
      <AnimatePresence>
        {showQuestionModal === 'tube' && (
          <Modal isOpen={true} onClose={() => { setShowQuestionModal(null); setSelectedOption(null); }} title={questionLabels.tube}>
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
                    <span className="font-bold mr-2">{opt.code}.</span>
                    {opt.text}
                  </button>
                ))}
              </div>
              <div className="flex justify-center pt-4 border-t border-industrial-fg/10">
                <Button onClick={() => handleConfirmAnswer('tube')} className="px-12" disabled={!selectedOption}>{'\u786e\u8ba4'}</Button>
              </div>
            </div>
          </Modal>
        )}

        {showQuestionModal === 'connector' && (
          <Modal isOpen={true} onClose={() => { setShowQuestionModal(null); setSelectedOption(null); }} title={questionLabels.connector}>
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
                    <span className="font-bold mr-2">{opt.code}.</span>
                    {opt.text}
                  </button>
                ))}
              </div>
              <div className="flex justify-center pt-4 border-t border-industrial-fg/10">
                <Button onClick={() => handleConfirmAnswer('connector')} className="px-12" disabled={!selectedOption}>{'\u786e\u8ba4'}</Button>
              </div>
            </div>
          </Modal>
        )}

        {showQuestionModal === 'bottomCap' && (
          <Modal isOpen={true} onClose={() => { setShowQuestionModal(null); setSelectedOption(null); }} title={questionLabels.bottomCap}>
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
                    <span className="font-bold mr-2">{opt.code}.</span>
                    {opt.text}
                  </button>
                ))}
              </div>
              <div className="flex justify-center pt-4 border-t border-industrial-fg/10">
                <Button onClick={() => handleConfirmAnswer('bottomCap')} className="px-12" disabled={!selectedOption}>{'\u786e\u8ba4'}</Button>
              </div>
            </div>
          </Modal>
        )}

        {showQuestionModal === 'joint' && (
          <Modal isOpen={true} onClose={() => { setShowQuestionModal(null); setSelectedOption(null); }} title={questionLabels.joint}>
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
                    <span className="font-bold mr-2">{opt.code}.</span>
                    {opt.text}
                  </button>
                ))}
              </div>
              <div className="flex justify-center pt-4 border-t border-industrial-fg/10">
                <Button onClick={() => handleConfirmAnswer('joint')} className="px-12" disabled={!selectedOption}>{'\u786e\u8ba4'}</Button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
};
