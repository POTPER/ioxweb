import React, { useState, useEffect } from 'react';
import { TechnicalCard, Button, Modal } from '../Common';
import { AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { useWireframe } from '../WireframeContext';
import { initialMeasurementScoringConfig } from '../../data/scoringConfig';
import { getTrainingHotspots, initialMeasurementDataRows } from '../../data/trainingContent';
import { calculateStepScore } from '../../lib/scoring';
import { loadStepDraft, saveStepDraft } from '../../lib/trainingStorage';

export const InitialMeasurement: React.FC<{ onNext: (data: any) => void }> = ({ onNext }) => {
  const { wireframeMode } = useWireframe();
  const draft = loadStepDraft<{ completed?: string[]; answers?: Record<string, string> }>('7');
  const [completed, setCompleted] = useState<string[]>(() => draft?.completed ?? []);
  const [answers, setAnswers] = useState<Record<string, string>>(() => draft?.answers ?? {});
  const [activeQuestion, setActiveQuestion] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const hotspots = getTrainingHotspots('prep.initialMeasurement').map(hotspot => {
    const question = initialMeasurementScoringConfig.questions.find(item => item.questionId === hotspot.questionId && item.type === 'singleChoice');
    const paragraphs = hotspot.hotspotId === 'condition'
      ? hotspot.desc.split('||').map(item => {
          const [title, content] = item.split('|');
          return { title, content };
        })
      : undefined;

    return {
      id: hotspot.hotspotId,
      title: hotspot.label,
      desc: hotspot.desc,
      paragraphs,
      table: hotspot.hotspotId === 'data' ? initialMeasurementDataRows : undefined,
      questionId: hotspot.questionId || '',
      question,
      options: question?.type === 'singleChoice' ? question.options : [],
    };
  });

  const openQuestion = (id: string) => {
    setSelectedOption(answers[id] || null);
    setActiveQuestion(id);
  };

  const handleConfirmAnswer = (hotspotId: string) => {
    if (!selectedOption) return;
    const nextAnswers = { ...answers, [hotspotId]: selectedOption };
    const nextCompleted = completed.includes(hotspotId) ? completed : [...completed, hotspotId];
    setAnswers(nextAnswers);
    setCompleted(nextCompleted);
    saveStepDraft('7', { answers: nextAnswers, completed: nextCompleted });
    setActiveQuestion(null);
    setSelectedOption(null);
  };

  const allCompleted = completed.length === hotspots.length;

  const handleSubmit = () => {
    const result = calculateStepScore(initialMeasurementScoringConfig, hotspots.map(hotspot => ({
      questionId: hotspot.questionId,
      answer: answers[hotspot.id],
    })));

    onNext(result);
  };

  useEffect(() => {
    if (allCompleted) {
      handleSubmit();
    }
  }, [completed]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {hotspots.map((h) => (
          <div key={h.id}>
            <TechnicalCard 
              title={h.title}
              className={cn(
                "transition-all duration-300",
                completed.includes(h.id) ? "border-green-500/50" : "border-industrial-fg/20"
              )}
              headerAction={
                <button 
                  onClick={() => openQuestion(h.id)}
                  className={cn(
                    "px-2 py-0.5 text-[10px] font-bold border transition-colors",
                    completed.includes(h.id) 
                      ? "bg-green-500 text-white border-green-600" 
                      : "bg-industrial-info text-white border-industrial-info/80 animate-pulse"
                  )}
                >
                  {`${completed.includes(h.id) ? '[v]' : '[?]'} ${h.question?.label || ''}`}
                </button>
              }
            >
              {/* Condition card: text paragraphs */}
              {'paragraphs' in h && h.paragraphs && (
                <div className="space-y-3">
                  {h.paragraphs.map((s: { title?: string; content?: string }, i: number) => (
                    <div key={i}>
                      <h4 className={cn("text-[10px] font-bold uppercase tracking-wider mb-1", wireframeMode ? "text-gray-400 font-mono" : "opacity-60")}>{s.title}</h4>
                      <p className={cn("text-[11px] leading-relaxed", wireframeMode ? "text-gray-500 font-mono" : "opacity-80")}>{s.content}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Data card: table */}
              {'table' in h && h.table && (
                <div>
                  {wireframeMode ? (
                    <div className="p-4 bg-gray-100 border-2 border-dashed border-gray-400 text-gray-400 font-mono text-xs text-center">
                      tbl:初测数据表（深度/A+/B+）40行
                    </div>
                  ) : (
                    <>
                      <div className="max-h-[300px] overflow-y-auto">
                        <table className="w-full text-[10px] font-mono border border-industrial-fg/10">
                          <thead className="sticky top-0">
                            <tr className="bg-industrial-bg/10 border-b border-industrial-fg/10">
                              <th className="p-1 text-left">深度(m)</th>
                              <th className="p-1 text-right">A+(mm)</th>
                              <th className="p-1 text-right">B+(mm)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {h.table.map((row: { depth: string; a: string; b: string }, i: number) => (
                              <tr key={i} className="border-b border-industrial-fg/5">
                                <td className="p-1">{row.depth}</td>
                                <td className="p-1 text-right">{row.a}</td>
                                <td className="p-1 text-right">{row.b}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              )}
            </TechnicalCard>
          </div>
        ))}
      </div>

      {/* Question Modal (Mode C: select then confirm) */}
      <AnimatePresence>
        {activeQuestion && (
          <Modal
            isOpen={true}
            onClose={() => { setActiveQuestion(null); setSelectedOption(null); }}
            title={hotspots.find(h => h.id === activeQuestion)?.question?.label}
          >
            <div className="space-y-4">
              <p className="text-xs font-bold">
                {hotspots.find(h => h.id === activeQuestion)?.question?.prompt}
              </p>
              <div className="space-y-2">
                {hotspots.find(h => h.id === activeQuestion)?.options.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setSelectedOption(opt.value)}
                    className={cn(
                      "w-full text-left p-3 text-[11px] border transition-all flex items-start space-x-3",
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
                <Button onClick={() => handleConfirmAnswer(activeQuestion)} className="px-12" disabled={!selectedOption}>确认</Button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
};
