import React, { useState, useEffect } from 'react';
import { TechnicalCard, Button, Modal } from '../Common';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { ChevronRight } from 'lucide-react';
import { useWireframe } from '../WireframeContext';
import { WireframePlaceholder } from '../WireframeOverlay';

export const ConnectivityTest: React.FC<{ onNext: (data: any) => void }> = ({ onNext }) => {
  const { wireframeMode } = useWireframe();
  const [viewed, setViewed] = useState<Record<string, boolean>>({});
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showDescModal, setShowDescModal] = useState<string | null>(null);
  const [showQuestionModal, setShowQuestionModal] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const holes = [
    {
      id: 'CX-01',
      title: '全程顺畅到底',
      depth: '20m',
      prevStatus: '已处理',
      desc: '探头从管口放入，靠自重缓慢下降。\n全程下降顺畅，无明显阻力。\n探头顺利到达孔底20m。\n上提过程同样顺畅，升降自如。',
      diagram: { maxDepth: 20, stopDepth: 20, status: 'success' as const },
      options: [
        { id: 'A', text: '通槽合格，可进行初始值测量', correct: true },
        { id: 'B', text: '虽然顺畅，但因管口验收时有方向偏转问题，通槽结果不可信，需重新检测', correct: false },
        { id: 'C', text: '顺畅到底只能说明无堵塞，还需加做水密性测试才能判定合格', correct: false },
        { id: 'D', text: '顺畅到底但应在8m和16m处各停留观察5分钟，确认无缓慢卡滞后再判定', correct: false }
      ]
    },
    {
      id: 'CX-02',
      title: '8m处受阻',
      depth: '20m',
      prevStatus: '已处理',
      desc: '探头从管口放入，初始下降正常。\n下降至约8m处，探头突然受阻，无法继续下降。\n反复尝试提升后重新下放，仍在同一位置受阻。',
      diagram: { maxDepth: 20, stopDepth: 8, status: 'error' as const },
      options: [
        { id: 'A', text: '通槽不合格，8m处可能为管体断裂，该孔应判废', correct: false },
        { id: 'B', text: '通槽不合格，可加大下压力强行推过受阻点', correct: false },
        { id: 'C', text: '通槽不合格，8m处受阻可能为落入碎屑或接头错位，应记录受阻深度并上报，安排疏通后复测', correct: true },
        { id: 'D', text: '通槽不合格，应立即拔出管体更换新管重新埋设', correct: false }
      ]
    },
    {
      id: 'CX-03',
      title: '全程阻力偏大',
      depth: '20m',
      prevStatus: '已处理',
      desc: '探头从管口放入，下降过程中全程均感到明显的摩擦阻力，下降速度比正常情况慢。\n探头最终可到达孔底20m，但上提时同样阻力偏大。',
      diagram: { maxDepth: 20, stopDepth: 20, status: 'warning' as const },
      options: [
        { id: 'A', text: '能到底即为合格，阻力偏大不影响后续测量', correct: false },
        { id: 'B', text: '通槽不合格，全程阻力偏大说明管体已严重变形，该孔应判废', correct: false },
        { id: 'C', text: '通槽有条件合格，但应记录阻力异常情况，评估是否影响测斜探头正常读数，必要时复测确认', correct: true },
        { id: 'D', text: '通槽不合格，应向管内注水冲洗以降低摩擦阻力', correct: false }
      ]
    },
    {
      id: 'CX-04',
      title: '16m处受阻',
      depth: '20m',
      prevStatus: '合格',
      desc: '探头从管口放入，初始下降正常。\n下降至约16m处，探头突然受阻，无法继续下降。\n反复尝试提升后重新下放，仍在同一位置受阻。\n管口验收时该孔外观完全正常。',
      diagram: { maxDepth: 20, stopDepth: 16, status: 'error' as const },
      options: [
        { id: 'A', text: '管口验收合格则管体应无问题，可能是探头故障，更换探头后重新检测即可', correct: false },
        { id: 'B', text: '通槽不合格，16m处受阻可能为深部接头错位或变形，应记录受阻深度并上报，安排检查处理', correct: true },
        { id: 'C', text: '通槽不合格，但16m已超过基坑开挖深度，不影响监测范围，可判定合格', correct: false },
        { id: 'D', text: '通槽不合格，16m以下数据不可用，将该孔有效深度改为16m继续使用即可', correct: false }
      ]
    }
  ];

  const handleHotspotClick = (id: string) => {
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
    setAnswers({ ...answers, [id]: selectedOption });
    setCompleted({ ...completed, [id]: true });
    setShowQuestionModal(null);
    setSelectedOption(null);
  };

  const handleSubmit = () => {
    const testResults = holes.map((h, idx) => {
      const isCorrect = h.options.find(o => o.id === answers[h.id])?.correct || false;
      return {
        id: `1-3-${idx + 5}`,
        label: `${h.id} 通槽判定`,
        score: isCorrect ? 1 : 0,
        maxScore: 1,
        correct: isCorrect,
        userAnswer: answers[h.id],
        correctAnswer: h.options.find(o => o.correct)?.id || ''
      };
    });

    const totalScore = testResults.reduce((acc, r) => acc + r.score, 0);

    onNext({
      stepId: 'step6',
      stepName: '通畅性测试',
      score: totalScore,
      maxScore: 4,
      answers: testResults
    });
  };

  useEffect(() => {
    if (Object.keys(completed).length === 4) {
      handleSubmit();
    }
  }, [completed]);

  return (
    <div className="space-y-6">
      <TechnicalCard title="基坑边俯视场景图">
        <WireframePlaceholder
          label="img:基坑边俯视场景图（通槽复测）"
          className="w-full h-[400px]"
          hotspots={[
            ...holes.map((h, i) => ({
              id: h.id,
              label: h.title,
              labelPosition: 'bottom' as const,
              position: {
                top: '35%',
                left: `${15 + i * 23}%`,
                transform: 'translate(-50%, -50%)',
              },
              className: 'w-16 h-16',
              onClick: () => handleHotspotClick(h.id),
              selected: !!viewed[h.id],
            })),
            ...holes.filter(h => viewed[h.id]).map((h) => {
              const i = holes.findIndex(x => x.id === h.id);
              return {
                id: completed[h.id] ? '✓' : '?',
                label: completed[h.id] ? '判定完成' : '通槽判定',
                labelPosition: 'right' as const,
                position: {
                  top: '35%',
                  left: `calc(${15 + i * 23}% + 28px)`,
                  transform: 'translate(-50%, -50%)',
                },
                className: 'w-6 h-6 !rounded-full text-[10px]',
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
            <span className="text-[10px] bg-white px-4 uppercase tracking-[0.2em] font-bold opacity-60">══════ 基坑边 ══════</span>
          </div>

          {/* Holes Layout */}
          <div className="grid grid-cols-4 gap-12 w-full max-w-4xl relative z-10 mt-12">
            {holes.map(h => (
              <div key={h.id} className="flex flex-col items-center space-y-4">
                <span className="text-[10px] font-bold opacity-60">{h.id}</span>
                
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

                  {/* Hover Label */}
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-industrial-fg text-white text-[8px] px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                    点击查看检测结果
                  </div>
                </div>

                <span className="text-[10px] font-medium opacity-80 text-center h-8 flex items-center">
                  {completed[h.id] ? "已完成" : viewed[h.id] ? "待判定" : "待检测"}
                </span>

                {/* Markers */}
                <div className="flex items-center space-x-2">
                  {viewed[h.id] && !completed[h.id] ? (
                    <button 
                      onClick={() => openQuestion(h.id)}
                      className="flex items-center space-x-1 text-industrial-fg animate-breathing"
                    >
                      <span className="text-lg font-bold">[?]</span>
                      <span className="text-[10px] uppercase tracking-wider">通槽判定</span>
                    </button>
                  ) : completed[h.id] ? (
                    <button 
                      onClick={() => openQuestion(h.id)}
                      className="flex items-center space-x-1 text-green-600"
                    >
                      <span className="text-lg font-bold">[v]</span>
                      <span className="text-[10px] uppercase tracking-wider">判定完成</span>
                    </button>
                  ) : null}
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
        title={`${showDescModal} 通槽检测结果`}
      >
        <div className="flex flex-col md:flex-row gap-8">
          {/* Left: Probe Diagram */}
          <div className={cn("w-full md:w-1/2 aspect-[3/4] border flex flex-col items-center p-6 relative", wireframeMode ? "bg-gray-100 border-2 border-dashed border-gray-400" : "bg-industrial-bg/5 border-industrial-fg/10")}>
            <span className={cn("absolute top-4 left-4 text-[10px] font-bold uppercase tracking-widest", wireframeMode ? "text-gray-400 font-mono" : "opacity-40")}>探头下放示意</span>
            
            <div className="flex-1 w-full flex items-start justify-center pt-8">
              {wireframeMode ? (
                <div className="text-gray-400 font-mono text-xs text-center">img:探头下放示意图-{showDescModal}</div>
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
              <Button onClick={confirmDesc} className="px-8">知道了</Button>
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
            title={`${showQuestionModal} 通槽复测判定`}
          >
            <div className="space-y-4">
              <p className="text-xs font-bold">该孔通槽复测结论如何？应如何处理？</p>
              <div className="space-y-2">
                {holes.find(h => h.id === showQuestionModal)?.options.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setSelectedOption(opt.id)}
                    className={cn(
                      "w-full text-left px-4 py-2.5 border-2 text-xs transition-colors flex items-center justify-between gap-3",
                      selectedOption === opt.id 
                        ? "bg-industrial-fg text-industrial-bg border-industrial-fg" 
                        : "border-industrial-fg/20 hover:border-industrial-fg/40"
                    )}
                  >
                    <span>{opt.id}. {opt.text}</span>
                    <div className={cn(
                      "w-14 h-10 border flex items-center justify-center text-[9px] font-mono flex-shrink-0",
                      selectedOption === opt.id
                        ? "bg-industrial-bg/20 border-industrial-bg/30 text-industrial-bg/60"
                        : "bg-gray-200 border-gray-300 text-gray-400"
                    )}>[图片]</div>
                  </button>
                ))}
              </div>
              <div className="flex justify-center pt-4 border-t border-industrial-fg/10">
                <Button onClick={() => handleConfirmAnswer(showQuestionModal)} className="px-12" disabled={!selectedOption}>确认</Button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
};
