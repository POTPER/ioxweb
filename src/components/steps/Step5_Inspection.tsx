import React, { useState, useEffect } from 'react';
import { TechnicalCard, Button, Modal } from '../Common';
import { AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { ChevronRight } from 'lucide-react';
import { useWireframe } from '../WireframeContext';
import { WireframePlaceholder } from '../WireframeOverlay';
import { TrainingHotspotButton, TrainingQuestionButton } from '../TrainingInteractionButtons';

import { inspectionScoringConfig } from '../../data/scoringConfig';
import { getTrainingHotspots, getUiLabel } from '../../data/trainingContent';
import { calculateStepScore } from '../../lib/scoring';
import { loadStepDraft, saveStepDraft } from '../../lib/trainingStorage';

export const Inspection: React.FC<{ onNext: (data: any) => void }> = ({ onNext }) => {
  const draft = loadStepDraft<{ viewed?: Record<string, boolean>; completed?: Record<string, boolean>; answers?: Record<string, string> }>('5');
  const [viewed, setViewed] = useState<Record<string, boolean>>(() => draft?.viewed ?? {});
  const [completed, setCompleted] = useState<Record<string, boolean>>(() => draft?.completed ?? {});
  const [answers, setAnswers] = useState<Record<string, string>>(() => draft?.answers ?? {});
  const [showDescModal, setShowDescModal] = useState<string | null>(null);
  const [showQuestionModal, setShowQuestionModal] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const { wireframeMode } = useWireframe();

  const inspectionHotspots = getTrainingHotspots('prep.inspection');
  const holes = inspectionHotspots.map(hotspot => {
    const question = inspectionScoringConfig.questions.find(item => item.questionId === hotspot.questionId && item.type === 'singleChoice');
    return {
      id: hotspot.hotspotId,
      title: hotspot.label,
      desc: hotspot.desc.replaceAll('；', '\n').replaceAll('。', '。\n\n').trim(),
      questionId: hotspot.questionId,
      question,
      options: question?.type === 'singleChoice' ? question.options : [],
      judgeLabel: getUiLabel('prep.inspection', `${hotspot.hotspotId}JudgeLabel`),
    };
  });

  const handleHotspotClick = (id: string) => {
    setShowDescModal(id);
  };

  const confirmDesc = () => {
    if (showDescModal) {
      const nextViewed = { ...viewed, [showDescModal]: true };
      setViewed(nextViewed);
      saveStepDraft('5', { viewed: nextViewed, completed, answers });
      setShowDescModal(null);
    }
  };

  const openQuestion = (id: string) => {
    setSelectedOption(answers[id] || null);
    setShowQuestionModal(id);
  };

  const handleConfirmAnswer = (id: string) => {
    if (!selectedOption) return;
    const nextAnswers = { ...answers, [id]: selectedOption };
    const nextCompleted = { ...completed, [id]: true };
    setAnswers(nextAnswers);
    setCompleted(nextCompleted);
    saveStepDraft('5', { viewed, completed: nextCompleted, answers: nextAnswers });
    setShowQuestionModal(null);
    setSelectedOption(null);
  };

  const handleSubmit = () => {
    const result = calculateStepScore(inspectionScoringConfig, holes.map(hole => ({
      questionId: hole.questionId,
      answer: answers[hole.id],
    })));

    onNext(result);
  };

  useEffect(() => {
    if (Object.keys(completed).length === 4) {
      handleSubmit();
    }
  }, [completed]);

  return (
    <div className="space-y-6">
      <TechnicalCard title={getUiLabel('prep.inspection', 'cardTitle')}>
        <WireframePlaceholder
          label={getUiLabel('prep.inspection', 'diagramLabel')}
          className="w-full h-[400px]"
          hotspots={[
            ...holes.map((h, i) => ({
              id: h.title,
              label: '',
              labelPosition: 'bottom' as const,
              position: {
                top: '35%',
                left: `${15 + i * 23}%`,
                transform: 'translate(-50%, -50%)',
              },
              className: 'min-w-30 h-36 px-8 text-2xl whitespace-nowrap',
              onClick: () => handleHotspotClick(h.id),
              selected: !!viewed[h.id],
            })),
            ...holes.filter(h => viewed[h.id]).map((h) => {
              const i = holes.findIndex(x => x.id === h.id);
              return {
                id: `${completed[h.id] ? '✓' : '?'} ${h.judgeLabel}`,
                label: '',
                labelPosition: 'right' as const,
                position: {
                  top: '35%',
                  left: `calc(${15 + i * 23}% + 60px)`,
                  transform: 'translate(-50%, -50%)',
                },
                className: 'min-w-20 h-8 px-3 text-[11px] whitespace-nowrap',
                onClick: () => openQuestion(h.id),
                selected: !!completed[h.id],
                zIndex: 20,
              };
            }),
          ]}
        >
          <div className="relative w-full h-[400px] bg-white border border-industrial-fg/20 flex flex-col items-center justify-center p-8 overflow-hidden">
            {/* Excavation Edge */}
            <div className="absolute top-12 left-0 right-0 h-2 bg-industrial-fg/40 flex items-center justify-center">
              <span className="text-[10px] bg-white px-4 uppercase tracking-[0.2em] font-bold opacity-60">{getUiLabel('prep.inspection', 'excavationEdgeLabel')}</span>
            </div>

            {/* Holes Layout */}
            <div className="grid grid-cols-4 gap-12 w-full max-w-4xl relative z-10 mt-12">
              {holes.map(h => (
                <div key={h.id} className="flex flex-col items-center space-y-2">
                  <div className="relative w-20 h-20">
                    <TrainingHotspotButton
                      label={(
                        <>
                          {h.id === 'CX-01' && (
                        <div className="relative w-12 h-12 border border-industrial-fg/20 rounded-full flex items-center justify-center">
                          <div className="absolute top-0 w-px h-4 bg-industrial-fg/20"></div>
                          <div className="absolute rotate-45 flex flex-col items-center">
                            <div className="w-px h-8 bg-industrial-fg"></div>
                            <ChevronRight size={10} className="-rotate-90 -mt-1 text-industrial-fg" />
                            <span className="text-[8px] font-bold mt-1">A+</span>
                          </div>
                          <div className="w-2 h-2 rounded-full border border-industrial-fg"></div>
                        </div>
                      )}
                      {h.id === 'CX-02' && (
                        <div className="relative w-12 h-12 border border-industrial-fg/20 rounded-full flex items-center justify-center">
                          <div className="absolute inset-0 flex items-center justify-center opacity-40">
                            <div className="w-full h-px bg-industrial-fg"></div>
                            <div className="h-full w-px bg-industrial-fg"></div>
                          </div>
                          <div className="absolute -bottom-2 flex space-x-1">
                            <div className="w-1 h-1 bg-industrial-fg/40 rounded-full"></div>
                            <div className="w-0.5 h-0.5 bg-industrial-fg/40 rounded-full"></div>
                          </div>
                        </div>
                      )}
                          {h.id === 'CX-03' && (
                        <div className="relative w-12 h-12 border border-industrial-fg/20 rounded-full bg-industrial-fg/10 overflow-hidden flex items-center justify-center">
                          <div className="absolute inset-0 bg-industrial-fg/20 flex flex-wrap gap-1 p-1">
                            {[...Array(16)].map((_, i) => <div key={i} className="w-2 h-2 bg-industrial-fg/30 rounded-sm" />)}
                          </div>
                          <span className="text-[8px] font-bold relative z-10 bg-white/80 px-1">CONCRETE</span>
                        </div>
                      )}
                          {h.id === 'CX-04' && (
                        <div className="relative w-12 h-12 border border-industrial-fg/20 rounded-full flex items-center justify-center">
                          <div className="flex flex-col items-center">
                            <ChevronRight size={10} className="-rotate-90 text-industrial-fg" />
                            <div className="w-px h-6 bg-industrial-fg"></div>
                            <span className="text-[8px] font-bold mt-1">A+</span>
                          </div>
                        </div>
                      )}
                          <span className="absolute inset-x-0 bottom-1 text-center text-[10px] font-bold bg-white/80 mx-1 text-industrial-fg">{h.title}</span>
                        </>
                      )}
                      selected={!!viewed[h.id]}
                      absolute={false}
                      className="w-20 h-20 min-w-20"
                      onClick={() => handleHotspotClick(h.id)}
                    />

                    {viewed[h.id] && (
                      <TrainingQuestionButton
                        label={h.judgeLabel}
                        completed={!!completed[h.id]}
                        className="-right-16 top-1/2 -translate-y-1/2"
                        onClick={(e) => { e.stopPropagation(); openQuestion(h.id); }}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>

          </div>
        </WireframePlaceholder>
      </TechnicalCard>

      {/* Description Modal */}
      <Modal 
        isOpen={!!showDescModal} 
        onClose={() => setShowDescModal(null)}
        title={getUiLabel('prep.inspection', 'detailModalTitle', { value: holes.find(h => h.id === showDescModal)?.title || '' })}
      >
        <div className="flex flex-col md:flex-row gap-8">
          {/* Left: Diagram */}
          <div className={cn("w-full md:w-1/2 aspect-square border flex flex-col items-center justify-center p-6 relative", wireframeMode ? "bg-gray-100 border-2 border-dashed border-gray-400" : "bg-industrial-bg/5 border-industrial-fg/10")}>
            <span className={cn("absolute top-4 left-4 text-[10px] font-bold uppercase tracking-widest", wireframeMode ? "text-gray-400 font-mono" : "opacity-40")}>{getUiLabel('prep.inspection', 'detailDiagramTitle')}</span>
            
            {/* Dynamic Diagram based on showDescModal */}
            {wireframeMode ? (
              <div className="text-gray-400 font-mono text-xs text-center">{getUiLabel('prep.inspection', 'detailDiagramLabel', { value: showDescModal || '' })}</div>
            ) : (
              <div className="w-48 h-48 border-2 border-industrial-fg/20 rounded-full flex items-center justify-center relative">
                {showDescModal === 'CX-01' && (
                  <>
                    <div className="absolute top-4 flex flex-col items-center opacity-40">
                      <span className="text-[8px] mb-1">设计方向</span>
                      <ChevronRight size={12} className="-rotate-90" />
                      <div className="w-px h-8 bg-industrial-fg"></div>
                    </div>
                    <div className="absolute rotate-45 flex flex-col items-center">
                      <div className="w-px h-24 bg-industrial-fg"></div>
                      <ChevronRight size={16} className="-rotate-90 -mt-2 text-industrial-fg" />
                      <span className="text-[10px] font-bold mt-2">实测 A+</span>
                    </div>
                  </>
                )}
                {showDescModal === 'CX-02' && (
                  <>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-full h-px bg-industrial-fg/40"></div>
                      <div className="h-full w-px bg-industrial-fg/40 absolute"></div>
                    </div>
                    <span className="text-[10px] font-bold bg-white px-2 relative z-10">导槽可见 (敞开)</span>
                    <div className="absolute bottom-8 flex space-x-2">
                      <div className="w-2 h-2 bg-industrial-fg/20 rounded-full"></div>
                      <div className="w-1 h-1 bg-industrial-fg/20 rounded-full"></div>
                    </div>
                  </>
                )}
                {showDescModal === 'CX-03' && (
                  <div className="absolute inset-0 bg-industrial-fg/20 flex items-center justify-center">
                    <span className="text-xs font-bold uppercase tracking-widest bg-white/80 px-4 py-2 border border-industrial-fg/20">混凝土覆盖</span>
                  </div>
                )}
                {showDescModal === 'CX-04' && (
                  <div className="flex flex-col items-center">
                    <span className="text-[8px] mb-1 opacity-40">设计与实测一致</span>
                    <ChevronRight size={16} className="-rotate-90 text-industrial-fg" />
                    <div className="w-px h-24 bg-industrial-fg"></div>
                    <span className="text-[10px] font-bold mt-2">A+</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Description */}
          <div className="flex-1 flex flex-col justify-between">
            <p className="text-xs leading-relaxed opacity-80 whitespace-pre-line">
              {holes.find(h => h.id === showDescModal)?.desc}
            </p>
            <div className="pt-6">
              <Button onClick={confirmDesc} className="w-full">{getUiLabel('prep.inspection', 'acknowledgeButton')}</Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Question Modal (Mode C) */}
      <AnimatePresence>
        {showQuestionModal && (
          <Modal 
            isOpen={true} 
            onClose={() => { setShowQuestionModal(null); setSelectedOption(null); }} 
            title={getUiLabel('prep.inspection', 'questionModalTitle', { value: holes.find(h => h.id === showQuestionModal)?.title || '' })}
          >
            <div className="space-y-4">
              <p className="text-xs font-bold">{holes.find(h => h.id === showQuestionModal)?.question?.prompt}</p>
              <div className="space-y-2">
                {holes.find(h => h.id === showQuestionModal)?.options.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setSelectedOption(opt.value)}
                    className={cn(
                      "w-full text-left p-3 text-xs border transition-all flex items-start space-x-3",
                      selectedOption === opt.value 
                        ? "border-industrial-fg bg-industrial-fg text-white" 
                        : "border-industrial-fg/20 hover:border-industrial-fg"
                    )}
                  >
                    <span className="font-bold mt-0.5">{opt.code}.</span>
                    <span className="flex-1 leading-relaxed">{opt.label}</span>
                  </button>
                ))}
              </div>
              <div className="flex justify-center pt-4 border-t border-industrial-fg/10">
                <Button onClick={() => handleConfirmAnswer(showQuestionModal)} className="px-12" disabled={!selectedOption}>{getUiLabel('prep.inspection', 'confirmButton')}</Button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
};
