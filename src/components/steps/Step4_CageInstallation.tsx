import React, { useState, useEffect, useRef } from 'react';
import { TechnicalCard, Button, Modal } from '../Common';
import { AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { useWireframe } from '../WireframeContext';
import { WireframePlaceholder } from '../WireframeOverlay';
import { SectionDiagram } from '../diagrams/SectionDiagram';
import { ElevationDiagram } from '../diagrams/ElevationDiagram';
import { cageInstallationScoringConfig } from '../../data/scoringConfig';
import { getTrainingHotspots, getUiLabel } from '../../data/trainingContent';
import { calculateStepScore } from '../../lib/scoring';
import { loadStepDraft, saveStepDraft } from '../../lib/trainingStorage';

export const CageInstallation: React.FC<{ onNext: (data: any) => void }> = ({ onNext }) => {
  const draft = loadStepDraft<{ viewed?: Record<string, boolean>; completed?: Record<string, boolean>; answers?: Record<string, any> }>('4');
  const [viewed, setViewed] = useState<Record<string, boolean>>(() => draft?.viewed ?? {});
  const [completed, setCompleted] = useState<Record<string, boolean>>(() => draft?.completed ?? {});
  const [answers, setAnswers] = useState<Record<string, any>>(() => draft?.answers ?? {});
  const [showDescModal, setShowDescModal] = useState<string | null>(null);
  const [showQuestionModal, setShowQuestionModal] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showBindingModal, setShowBindingModal] = useState(false);
  const modalJustClosed = useRef(false);
  const { wireframeMode } = useWireframe();

  const cageHotspots = getTrainingHotspots('prep.cage');
  const getQuestion = (questionId: string) => cageInstallationScoringConfig.questions.find(question => question.questionId === questionId && question.type === 'singleChoice');
  const sectionQuestion = getQuestion('prep.cage.section');
  const heightQuestion = getQuestion('prep.cage.height');
  const spacingQuestion = getQuestion('prep.cage.spacing');
  const tightnessQuestion = getQuestion('prep.cage.tightness');
  const bindingHotspot = cageHotspots.find(hotspot => hotspot.hotspotId === 'cageBinding');
  const bindingDesc = {
    title: bindingHotspot?.label || '',
    desc: bindingHotspot?.desc || '',
  };
  const sectionHotspots = sectionQuestion?.type === 'singleChoice' ? sectionQuestion.options.map(option => ({
    id: option.value,
    title: option.label,
    desc: option.desc,
  })) : [];
  const heightHotspots = heightQuestion?.type === 'singleChoice' ? heightQuestion.options.map(option => ({
    id: option.value,
    title: option.label,
    code: option.code,
    name: option.label,
    desc: option.desc,
  })) : [];
  const spacingOptions = spacingQuestion?.type === 'singleChoice' ? spacingQuestion.options.map(option => ({
    id: option.value,
    code: option.code,
    text: option.label,
  })) : [];
  const tightnessOptions = tightnessQuestion?.type === 'singleChoice' ? tightnessQuestion.options.map(option => ({
    id: option.value,
    code: option.code,
    text: option.label,
  })) : [];
  const selectedHeightCode = heightHotspots.find(h => h.id === answers.height)?.code;

  const handleHotspotClick = (type: 'section' | 'height', id: string) => {
    setShowDescModal(`${type}:${id}`);
  };

  const confirmDesc = () => {
    if (showDescModal) {
      const [type, id] = showDescModal.split(':');
      const nextAnswers = { ...answers, [type]: id };
      const nextCompleted = { ...completed, [type]: true };
      setAnswers(nextAnswers);
      setCompleted(nextCompleted);
      saveStepDraft('4', { viewed, completed: nextCompleted, answers: nextAnswers });
      setShowDescModal(null);
    }
  };

  const openQuestion = (type: string) => {
    setSelectedOption(answers[type] || null);
    setShowQuestionModal(type);
  };

  const handleConfirmAnswer = (type: string) => {
    if (!selectedOption) return;
    const nextAnswers = { ...answers, [type]: selectedOption };
    const nextCompleted = { ...completed, [type]: true };
    setAnswers(nextAnswers);
    setCompleted(nextCompleted);
    saveStepDraft('4', { viewed, completed: nextCompleted, answers: nextAnswers });
    setShowQuestionModal(null);
    setSelectedOption(null);
    modalJustClosed.current = true;
    setTimeout(() => { modalJustClosed.current = false; }, 300);
  };

  const handleSubmit = () => {
    const result = calculateStepScore(cageInstallationScoringConfig, [
      { questionId: 'prep.cage.section', answer: answers.section },
      { questionId: 'prep.cage.height', answer: answers.height },
      { questionId: 'prep.cage.spacing', answer: answers.spacing },
      { questionId: 'prep.cage.tightness', answer: answers.tightness },
    ]);

    onNext(result);
  };

  const confirmBinding = () => {
    const nextViewed = { ...viewed, binding: true };
    const nextCompleted = { ...completed, binding: true };
    setViewed(nextViewed);
    setCompleted(nextCompleted);
    saveStepDraft('4', { viewed: nextViewed, completed: nextCompleted, answers });
    setShowBindingModal(false);
  };

  useEffect(() => {
    if (Object.keys(completed).length === 5) {
      handleSubmit();
    }
  }, [completed]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Section View */}
        <TechnicalCard title={getUiLabel('prep.cage', 'sectionCardTitle')}>
          <WireframePlaceholder
            label={getUiLabel('prep.cage', 'sectionDiagramLabel')}
            className="aspect-square"
            hotspots={sectionHotspots.map((h, i) => {
              const positions: React.CSSProperties[] = [
                { top: '10%', left: '50%', transform: 'translate(-50%, -50%)' },
                { top: '50%', right: '10%', transform: 'translate(50%, -50%)' },
                { bottom: '10%', left: '50%', transform: 'translate(-50%, 50%)' },
                { top: '50%', left: '10%', transform: 'translate(-50%, -50%)' }
              ];
              return {
                id: h.title,
                label: '',
                labelPosition: 'bottom' as const,
                className: 'min-w-28 h-10 px-3 text-[11px] whitespace-nowrap',
                position: positions[i],
                onClick: () => handleHotspotClick('section', h.id),
                selected: answers.section === h.id,
              };
            })}
          >
            <SectionDiagram
              hotspots={sectionHotspots}
              selectedId={answers.section}
              onHotspotClick={(id) => handleHotspotClick('section', id)}
            />
          </WireframePlaceholder>
        </TechnicalCard>

        {/* Right: Elevation View */}
        <TechnicalCard title={getUiLabel('prep.cage', 'elevationCardTitle')}>
          <div className="relative bg-white border border-industrial-fg/20 flex flex-col">
            {/* Main diagram area */}
            <WireframePlaceholder
              label={answers.height ? getUiLabel('prep.cage', 'elevationPlanLabel', { value: selectedHeightCode || '' }) : getUiLabel('prep.cage', 'elevationDefaultLabel')}
              className="h-[320px]"
              hotspots={[
                {
                  id: '笼体',
                  label: getUiLabel('prep.cage', 'bindingIntroAction'),
                  labelPosition: 'right' as const,
                  position: { top: '50%', left: '40%', transform: 'translate(-50%, -50%)' },
                  onClick: () => { if (!modalJustClosed.current) setShowBindingModal(true); },
                  selected: !!completed['binding'],
                },
                ...(viewed['binding'] ? [
                  {
                    id: `${completed['spacing'] ? '✓' : '?'} ${getUiLabel('prep.cage', 'spacingAction')}`,
                    label: '',
                    labelPosition: 'right' as const,
                    className: 'min-w-16 h-7 px-2 text-[10px] whitespace-nowrap',
                    position: { top: '33%', left: 'calc(40% + 32px)', transform: 'translateY(-50%)' } as React.CSSProperties,
                    onClick: () => openQuestion('spacing'),
                    selected: !!completed['spacing'],
                    zIndex: 20,
                  },
                  {
                    id: `${completed['tightness'] ? '✓' : '?'} ${getUiLabel('prep.cage', 'tightnessAction')}`,
                    label: '',
                    labelPosition: 'right' as const,
                    className: 'min-w-16 h-7 px-2 text-[10px] whitespace-nowrap',
                    position: { top: '66%', left: 'calc(40% + 32px)', transform: 'translateY(-50%)' } as React.CSSProperties,
                    onClick: () => openQuestion('tightness'),
                    selected: !!completed['tightness'],
                    zIndex: 20,
                  },
                ] : []),
              ]}
            >
              <ElevationDiagram
                viewedBinding={!!viewed['binding']}
                completedSpacing={!!completed['spacing']}
                completedTightness={!!completed['tightness']}
                selectedHeight={selectedHeightCode}
                spacingLabel={getUiLabel('prep.cage', 'spacingAction')}
                tightnessLabel={getUiLabel('prep.cage', 'tightnessAction')}
                onCageClick={() => { if (!modalJustClosed.current) setShowBindingModal(true); }}
                onQuestionClick={(type) => openQuestion(type)}
              />
            </WireframePlaceholder>

            {/* Prompt text */}
            <div className="px-4 py-2 text-center">
              <span className="text-xs font-bold text-industrial-fg">{heightQuestion?.prompt}</span>
            </div>

            {/* Bottom: 4 scheme selectors in a horizontal row */}
            <div className="border-t border-industrial-fg/10 px-4 py-3 flex items-center justify-center gap-4">
                {wireframeMode ? (
                  heightHotspots.map(h => {
                    const isSelected = answers.height === h.id;
                    return (
                      <button
                        key={h.id}
                        onClick={() => handleHotspotClick('height', h.id)}
                        className={cn(
                          "px-3 py-1.5 text-xs border transition-all",
                          isSelected
                            ? "border-green-600 text-green-700 font-bold bg-green-50"
                            : "border-gray-300 text-gray-600 bg-white hover:border-gray-400",
                          completed['height'] && !isSelected && "opacity-30"
                        )}
                      >
                        {h.title}
                      </button>
                    );
                  })
                ) : (
                  heightHotspots.map(h => {
                    const isSelected = answers.height === h.id;
                    return (
                      <button
                        key={h.id}
                        onClick={() => handleHotspotClick('height', h.id)}
                        className={cn(
                          "min-w-20 h-8 px-3 border-2 flex items-center justify-center text-xs transition-all",
                          isSelected
                            ? "border-industrial-fg bg-industrial-fg text-white font-bold"
                            : "border-industrial-fg/30 bg-white hover:border-industrial-fg",
                          completed['height'] && !isSelected && "opacity-30"
                        )}
                      >
                        {h.title}
                      </button>
                    );
                  })
                )}
              </div>
          </div>
        </TechnicalCard>
      </div>

      {/* Description Modal (section / height) */}
      <Modal 
        isOpen={!!showDescModal} 
        onClose={() => setShowDescModal(null)}
        title={(() => {
          if (!showDescModal) return '';
          const [type, id] = showDescModal.split(':');
          return type === 'section' 
            ? sectionHotspots.find(h => h.id === id)?.title || ''
            : heightHotspots.find(h => h.id === id)?.title || '';
        })()}
      >
        <div className="space-y-6">
          <p className="text-xs leading-relaxed opacity-80">
            {(() => {
              if (!showDescModal) return '';
              const [type, id] = showDescModal.split(':');
              return type === 'section' 
                ? sectionHotspots.find(h => h.id === id)?.desc
                : heightHotspots.find(h => h.id === id)?.desc;
            })()}
          </p>
          <div className="flex space-x-3">
            <Button onClick={confirmDesc} className="flex-1">{getUiLabel('prep.cage', 'selectButton')}</Button>
            <Button variant="secondary" onClick={() => setShowDescModal(null)} className="flex-1">{getUiLabel('prep.cage', 'cancelButton')}</Button>
          </div>
        </div>
      </Modal>

      {/* Binding Description Modal (Mode A) */}
      <Modal
        isOpen={showBindingModal}
        onClose={() => setShowBindingModal(false)}
        title={bindingDesc.title}
      >
        <div className="space-y-6">
          <p className="text-xs leading-relaxed opacity-80">{bindingDesc.desc}</p>
          <Button onClick={confirmBinding} className="w-full">{getUiLabel('prep.cage', 'acknowledgeButton')}</Button>
        </div>
      </Modal>

      {/* Question Modals (Mode C) */}
      <AnimatePresence>
        {showQuestionModal && (
          <Modal 
            isOpen={true} 
            onClose={() => { setShowQuestionModal(null); setSelectedOption(null); }} 
            title={showQuestionModal === 'spacing' ? spacingQuestion?.label : tightnessQuestion?.label}
          >
            <div className="space-y-4">
              <p className="text-xs font-bold">
                {showQuestionModal === 'spacing' 
                  ? spacingQuestion?.prompt 
                  : tightnessQuestion?.prompt}
              </p>
              <div className="space-y-2">
                {(showQuestionModal === 'spacing' ? spacingOptions : tightnessOptions).map(opt => (
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
                <Button onClick={() => handleConfirmAnswer(showQuestionModal)} className="px-12" disabled={!selectedOption}>{getUiLabel('prep.cage', 'confirmButton')}</Button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
};
