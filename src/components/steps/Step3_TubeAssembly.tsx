import React, { useState, useEffect } from 'react';
import { TechnicalCard, Button, Modal } from '../Common';
import { AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { WireframePlaceholder } from '../WireframeOverlay';
import { tubeAssemblyScoringConfig } from '../../data/scoringConfig';
import { getTrainingHotspots, trainingStepsByStepId } from '../../data/trainingContent';
import { calculateStepScore } from '../../lib/scoring';
import { loadStepDraft, saveStepDraft } from '../../lib/trainingStorage';

export const TubeAssembly: React.FC<{ onNext: (data: any) => void }> = ({ onNext }) => {
  const draft = loadStepDraft<{ viewed?: Record<string, boolean>; completed?: Record<string, boolean>; answers?: Record<string, any> }>('3');
  const [viewed, setViewed] = useState<Record<string, boolean>>(() => draft?.viewed ?? {});
  const [completed, setCompleted] = useState<Record<string, boolean>>(() => draft?.completed ?? {});
  const [answers, setAnswers] = useState<Record<string, any>>(() => draft?.answers ?? {});
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
  const questionByHotspot = {
    tube: tubeQuestion,
    connector: connectorQuestion,
    bottomCap: bottomCapQuestion,
    joint: jointQuestion,
  };
  const optionsByHotspot = {
    tube: tubeOptions,
    connector: connectorOptions,
    bottomCap: bottomCapOptions,
    joint: jointOptions,
  };
  const hotspotMap = Object.fromEntries(hotspots.map(hotspot => [hotspot.id, hotspot]));
  const hasViewedAny = Object.values(viewed).some(Boolean);
  const assemblyHotspots = ['tube', 'connector', 'bottomCap', 'joint'].map(id => hotspotMap[id]).filter(Boolean);
  const getQuestionButtonPosition = (hotspot: typeof assemblyHotspots[number]): React.CSSProperties => ({
    left: `calc(${hotspot.x || '50%'} + 58px)`,
    top: hotspot.y || '50%',
    transform: 'translateY(-50%)',
  });

  const isUnlocked = (_id: string) => true;

  const handleHotspotClick = (id: string) => {
    if (!isUnlocked(id)) return;
    setShowDescModal(id);
  };

  const confirmDesc = () => {
    if (showDescModal) {
      const nextViewed = { ...viewed, [showDescModal]: true };
      setViewed(nextViewed);
      saveStepDraft('3', { viewed: nextViewed, completed, answers });
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
    const nextCompleted = { ...completed, [id]: true };
    setAnswers(newAnswers);
    setCompleted(nextCompleted);
    saveStepDraft('3', { viewed, completed: nextCompleted, answers: newAnswers });
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
    <div className="space-y-6">
      <TechnicalCard title={stepContent.diagramTitle}>
        <div className="w-full">
          <WireframePlaceholder
            label={stepContent.diagramLabel}
            className="aspect-[21/9]"
            hotspots={[
              ...assemblyHotspots.map(hotspot => ({
                id: hotspot.label,
                label: '',
                labelPosition: 'bottom' as const,
                position: { left: hotspot.x || '50%', top: hotspot.y || '50%', transform: 'translate(-50%, -50%)' },
                onClick: () => handleHotspotClick(hotspot.id),
                selected: !!viewed[hotspot.id],
                className: cn(
                  'min-w-24 h-8 rounded-sm px-2 whitespace-nowrap text-[10px]',
                  hasViewedAny && !viewed[hotspot.id] && 'opacity-40'
                ),
              })),
              ...assemblyHotspots.filter(hotspot => viewed[hotspot.id]).map(hotspot => ({
                id: `${completed[hotspot.id] ? '\u2713' : '?'} ${questionLabels[hotspot.id as keyof typeof questionLabels]}`,
                label: '',
                labelPosition: 'right' as const,
                position: getQuestionButtonPosition(hotspot),
                onClick: () => openQuestion(hotspot.id),
                selected: !!completed[hotspot.id],
                className: 'min-w-24 h-7 px-2 text-[10px] whitespace-nowrap',
                zIndex: 20,
              })),
            ]}
          >
            <div className="relative w-full aspect-[21/9] bg-[#f0f0f0] border-2 border-industrial-fg overflow-hidden group">
              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#141414 1px, transparent 0)', backgroundSize: '30px 30px' }} />
              <div className="absolute inset-x-[8%] top-1/2 -translate-y-1/2 h-16 border-2 border-industrial-fg/20 bg-white/50 flex items-center justify-center pointer-events-none">
                <span className="text-4xl font-black opacity-5 uppercase tracking-[0.6em]">测斜管拼装</span>
              </div>

              {assemblyHotspots.map(hotspot => (
                <button
                  key={hotspot.id}
                  type="button"
                  onClick={() => handleHotspotClick(hotspot.id)}
                  className={cn(
                    "absolute min-w-24 h-8 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center transition-all duration-300 z-20",
                    viewed[hotspot.id] ? "scale-110" : "hover:scale-125",
                    hasViewedAny && !viewed[hotspot.id] && "opacity-50"
                  )}
                  style={{ left: hotspot.x || '50%', top: hotspot.y || '50%' }}
                >
                  <div className={cn(
                    "absolute inset-0 rounded-sm border-2 border-industrial-fg animate-ping opacity-20",
                    hasViewedAny && "hidden"
                  )} />
                  <div className={cn(
                    "w-full h-full rounded-sm border-2 border-industrial-fg flex items-center justify-center px-2 whitespace-nowrap font-bold text-[10px] transition-colors shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]",
                    viewed[hotspot.id] ? "bg-green-500 text-white" : "bg-white"
                  )}>
                    {hotspot.label}
                  </div>

                </button>
              ))}

              {assemblyHotspots.filter(hotspot => viewed[hotspot.id]).map(hotspot => (
                <button
                  key={`${hotspot.id}-question`}
                  type="button"
                  onClick={() => openQuestion(hotspot.id)}
                  className={cn(
                    "absolute -translate-y-1/2 z-30 flex items-center space-x-1 px-2 py-1 rounded-full border border-industrial-fg text-[10px] font-bold whitespace-nowrap transition-all",
                    completed[hotspot.id] ? "bg-green-100 text-green-700" : "bg-white text-industrial-fg",
                    !completed[hotspot.id] && "animate-breathing"
                  )}
                  style={getQuestionButtonPosition(hotspot)}
                >
                  <span className={cn(
                    "w-4 h-4 rounded-full flex items-center justify-center text-[8px]",
                    completed[hotspot.id] ? "bg-green-600 text-white" : "bg-industrial-fg text-white"
                  )}>{completed[hotspot.id] ? '✓' : '?'}</span>
                  <span>{questionLabels[hotspot.id as keyof typeof questionLabels]}</span>
                </button>
              ))}
            </div>
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
        {showQuestionModal && (
          <Modal isOpen={true} onClose={() => { setShowQuestionModal(null); setSelectedOption(null); }} title={questionLabels[showQuestionModal as keyof typeof questionLabels]}>
            <div className="space-y-4">
              <p className="text-xs font-bold">{questionByHotspot[showQuestionModal as keyof typeof questionByHotspot]?.prompt}</p>
              <div className="space-y-2">
                {optionsByHotspot[showQuestionModal as keyof typeof optionsByHotspot].map(opt => (
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
                <Button onClick={() => handleConfirmAnswer(showQuestionModal)} className="px-12" disabled={!selectedOption}>{'\u786e\u8ba4'}</Button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
};
