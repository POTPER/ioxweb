import React, { useState, useEffect } from 'react';
import { TechnicalCard, Button, Modal } from '../Common';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { ChevronRight } from 'lucide-react';
import { useWireframe } from '../WireframeContext';
import { WireframePlaceholder } from '../WireframeOverlay';
import { connectivityScoringConfig } from '../../data/scoringConfig';
import { getTrainingHotspots, getUiLabel } from '../../data/trainingContent';
import { calculateStepScore } from '../../lib/scoring';
import { loadStepDraft, saveStepDraft } from '../../lib/trainingStorage';

export const ConnectivityTest: React.FC<{ onNext: (data: any) => void }> = ({ onNext }) => {
  const { wireframeMode } = useWireframe();
  const draft = loadStepDraft<{ viewed?: Record<string, boolean>; completed?: Record<string, boolean>; answers?: Record<string, string> }>('6');
  const [viewed, setViewed] = useState<Record<string, boolean>>(() => draft?.viewed ?? {});
  const [completed, setCompleted] = useState<Record<string, boolean>>(() => draft?.completed ?? {});
  const [answers, setAnswers] = useState<Record<string, string>>(() => draft?.answers ?? {});
  const [showDescModal, setShowDescModal] = useState<string | null>(null);
  const [showQuestionModal, setShowQuestionModal] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const diagramByHole: Record<string, { maxDepth: number; stopDepth: number; status: 'success' | 'error' | 'warning' }> = {
    'CX-01': { maxDepth: 20, stopDepth: 20, status: 'success' },
    'CX-02': { maxDepth: 20, stopDepth: 8, status: 'error' },
    'CX-03': { maxDepth: 20, stopDepth: 20, status: 'warning' },
    'CX-04': { maxDepth: 20, stopDepth: 16, status: 'error' },
  };

  const holes = getTrainingHotspots('prep.connectivity').map(hotspot => {
    const question = connectivityScoringConfig.questions.find(item => item.questionId === hotspot.questionId && item.type === 'singleChoice');

    return {
      id: hotspot.hotspotId,
      displayName: hotspot.label,
      desc: hotspot.desc.replaceAll('。', '。\n').trim(),
      x: hotspot.x,
      y: hotspot.y,
      questionId: hotspot.questionId || '',
      question,
      options: question?.type === 'singleChoice' ? question.options : [],
      diagram: diagramByHole[hotspot.hotspotId],
    };
  });

  const handleHotspotClick = (id: string) => {
    setShowDescModal(id);
  };

  const confirmDesc = () => {
    if (showDescModal) {
      const nextViewed = { ...viewed, [showDescModal]: true };
      setViewed(nextViewed);
      saveStepDraft('6', { viewed: nextViewed, completed, answers });
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
    saveStepDraft('6', { viewed, completed: nextCompleted, answers: nextAnswers });
    setShowQuestionModal(null);
    setSelectedOption(null);
  };

  const handleSubmit = () => {
    const result = calculateStepScore(connectivityScoringConfig, holes.map(hole => ({
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
      <TechnicalCard title={getUiLabel('prep.connectivity', 'cardTitle')}>
        <WireframePlaceholder
          label={getUiLabel('prep.connectivity', 'diagramLabel')}
          className="w-full h-[400px]"
          hotspots={[
            ...holes.map((h, i) => ({
              id: h.displayName,
              label: '',
              labelPosition: 'bottom' as const,
              position: {
                top: h.y || '35%',
                left: h.x || `${15 + i * 23}%`,
                transform: 'translate(-50%, -50%)',
              },
              className: 'min-w-30 h-36 px-8 text-2xl whitespace-nowrap',
              onClick: () => handleHotspotClick(h.id),
              selected: !!viewed[h.id],
            })),
            ...holes.filter(h => viewed[h.id]).map((h) => {
              const i = holes.findIndex(x => x.id === h.id);
              return {
                id: `${completed[h.id] ? '✓' : '?'} ${h.question?.label || ''}`,
                label: '',
                labelPosition: 'right' as const,
                position: {
                  top: h.y || '35%',
                  left: `calc(${h.x || `${15 + i * 23}%`} + 80px)`,
                  transform: 'translate(-50%, -50%)',
                },
                className: 'min-w-28 h-9 px-3 text-[11px] whitespace-nowrap',
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
            <span className="text-[10px] bg-white px-4 uppercase tracking-[0.2em] font-bold opacity-60">{getUiLabel('prep.connectivity', 'excavationEdgeLabel')}</span>
          </div>

          {/* Holes Layout */}
          <div className="grid grid-cols-4 gap-12 w-full max-w-4xl relative z-10 mt-12">
            {holes.map(h => (
              <div key={h.id} className="flex flex-col items-center space-y-2">
                {/* Hole Visual - All look OK in 3b */}
                <div 
                  onClick={() => handleHotspotClick(h.id)}
                  className={cn(
                    "w-20 h-20 border-2 flex items-center justify-center transition-all cursor-pointer relative group",
                    viewed[h.id] ? "border-industrial-fg bg-industrial-fg/5" : "border-industrial-fg/30 hover:border-industrial-fg/60 animate-breathing"
                  )}
                >
                  <div className="relative w-12 h-12 border border-industrial-fg/20 rounded-full flex items-center justify-center">
                    <div className="flex flex-col items-center">
                      <ChevronRight size={10} className="-rotate-90 text-industrial-fg" />
                      <div className="w-px h-6 bg-industrial-fg"></div>
                      <span className="text-[8px] font-bold mt-1">A+</span>
                    </div>
                  </div>

                  {/* Marker: overlapping right border */}
                  {viewed[h.id] && !completed[h.id] ? (
                    <button 
                      onClick={(e) => { e.stopPropagation(); openQuestion(h.id); }}
                      className="absolute -right-32 -top-4 min-w-32 h-9 px-3 bg-emerald-500/90 border-2 border-white shadow-[2px_2px_0px_0px_rgba(20,20,20,0.25)] flex items-center justify-center gap-2 text-white text-[13px] font-bold animate-breathing z-20 whitespace-nowrap"
                      title={getUiLabel('prep.connectivity', 'judgeAction')}
                    >
                      <span className="w-6 h-6 rounded-full bg-red-600 border-2 border-white flex items-center justify-center text-white text-base leading-none">?</span>
                      <span>{h.question?.label}</span>
                      <ChevronRight size={16} strokeWidth={3} />
                    </button>
                  ) : completed[h.id] ? (
                    <button 
                      onClick={(e) => { e.stopPropagation(); openQuestion(h.id); }}
                      className="absolute -right-32 -top-4 min-w-32 h-9 px-3 bg-green-600 border-2 border-white shadow-[2px_2px_0px_0px_rgba(20,20,20,0.25)] flex items-center justify-center gap-2 text-white text-[13px] font-bold hover:opacity-80 transition-opacity z-20 whitespace-nowrap"
                      title="判定完成"
                    >
                      <span className="w-6 h-6 rounded-full bg-white text-green-600 border-2 border-white flex items-center justify-center text-sm leading-none">✓</span>
                      <span>{h.question?.label}</span>
                      <ChevronRight size={16} strokeWidth={3} />
                    </button>
                  ) : null}
                  <span className="absolute inset-x-0 bottom-1 text-center text-[10px] font-bold bg-white/80 mx-1">{h.displayName}</span>
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
        title={getUiLabel('prep.connectivity', 'detailModalTitle', { value: holes.find(h => h.id === showDescModal)?.displayName || '' })}
      >
        <div className="flex flex-col md:flex-row gap-8">
          {/* Left: Probe Diagram */}
          <div className={cn("w-full md:w-1/2 aspect-[3/4] border flex flex-col items-center p-6 relative", wireframeMode ? "bg-gray-100 border-2 border-dashed border-gray-400" : "bg-industrial-bg/5 border-industrial-fg/10")}>
            <span className={cn("absolute top-4 left-4 text-[10px] font-bold uppercase tracking-widest", wireframeMode ? "text-gray-400 font-mono" : "opacity-40")}>{getUiLabel('prep.connectivity', 'detailDiagramTitle')}</span>
            
            <div className="flex-1 w-full flex items-start justify-center pt-8">
              {wireframeMode ? (
                <div className="text-gray-400 font-mono text-xs text-center">{getUiLabel('prep.connectivity', 'detailDiagramLabel', { value: holes.find(h => h.id === showDescModal)?.displayName || '' })}</div>
              ) : (
              <div className="relative h-full w-12 border-x-2 border-industrial-fg/20 bg-white flex flex-col">
                {/* Depth Markers */}
                {[0, 5, 10, 15, 20].map(d => (
                  <div key={d} className="absolute w-full border-t border-industrial-fg/10 flex items-center" style={{ top: `${(d / 20) * 100}%` }}>
                    <span className="absolute -right-8 text-[10px] font-mono">{d}m</span>
                  </div>
                ))}

                {/* Probe Path */}
                {showDescModal && (
                  <motion.div 
                    initial={{ y: 0 }}
                    animate={{ y: `${(holes.find(h => h.id === showDescModal)!.diagram.stopDepth / 20) * 100}%` }}
                    transition={{ duration: 2, ease: "linear" }}
                    className="absolute left-1/2 -translate-x-1/2 -translate-y-full w-8 flex flex-col items-center"
                  >
                    <div className="w-px h-24 border-l border-dashed border-industrial-fg/40"></div>
                    <div className="w-6 h-10 bg-industrial-fg rounded-b-full flex items-center justify-center shadow-lg">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    </div>
                    
                    {/* Status Marker at stop point */}
                    <div className="absolute top-full mt-2 whitespace-nowrap">
                      {holes.find(h => h.id === showDescModal)!.diagram.status === 'success' && (
                        <span className="text-[10px] font-bold text-green-600">✓ 到底</span>
                      )}
                      {holes.find(h => h.id === showDescModal)!.diagram.status === 'error' && (
                        <span className="text-[10px] font-bold text-red-600">✖ 受阻</span>
                      )}
                      {holes.find(h => h.id === showDescModal)!.diagram.status === 'warning' && (
                        <span className="text-[10px] font-bold text-industrial-warning">↓↓ 阻力偏大</span>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>
              )}
            </div>
          </div>

          {/* Right: Info */}
          <div className="flex-1 space-y-4">
            <p className="text-xs leading-relaxed opacity-80 whitespace-pre-line">
              {holes.find(h => h.id === showDescModal)?.desc}
            </p>
            <div className="flex justify-center pt-4">
              <Button onClick={confirmDesc} className="px-8">{getUiLabel('prep.connectivity', 'acknowledgeButton')}</Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Question Modal (Mode C') */}
      <AnimatePresence>
        {showQuestionModal && (
          <Modal 
            isOpen={true} 
            onClose={() => { setShowQuestionModal(null); setSelectedOption(null); }} 
            title={getUiLabel('prep.connectivity', 'questionModalTitle', { value: holes.find(h => h.id === showQuestionModal)?.displayName || '' })}
          >
            <div className="space-y-4">
              <p className="text-xs font-bold">{holes.find(h => h.id === showQuestionModal)?.question?.prompt}</p>
              <div className="space-y-2">
                {holes.find(h => h.id === showQuestionModal)?.options.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setSelectedOption(opt.value)}
                    className={cn(
                      "w-full text-left px-4 py-2.5 border-2 text-xs transition-colors flex items-center justify-between gap-3",
                      selectedOption === opt.value 
                        ? "bg-industrial-fg text-industrial-bg border-industrial-fg" 
                        : "border-industrial-fg/20 hover:border-industrial-fg/40"
                    )}
                  >
                    <span>{opt.code}. {opt.label}</span>
                    <div className={cn(
                      "w-14 h-10 border flex items-center justify-center text-[9px] font-mono flex-shrink-0",
                      selectedOption === opt.value
                        ? "bg-industrial-bg/20 border-industrial-bg/30 text-industrial-bg/60"
                        : "bg-gray-200 border-gray-300 text-gray-400"
                    )}>[图片]</div>
                  </button>
                ))}
              </div>
              <div className="flex justify-center pt-4 border-t border-industrial-fg/10">
                <Button onClick={() => handleConfirmAnswer(showQuestionModal)} className="px-12" disabled={!selectedOption}>{getUiLabel('prep.connectivity', 'confirmButton')}</Button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
};
