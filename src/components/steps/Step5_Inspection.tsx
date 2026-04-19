import React, { useState, useEffect } from 'react';
import { TechnicalCard, Button, Modal } from '../Common';
import { AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { ChevronRight } from 'lucide-react';
import { useWireframe } from '../WireframeContext';
import { WireframePlaceholder } from '../WireframeOverlay';

export const Inspection: React.FC<{ onNext: (data: any) => void }> = ({ onNext }) => {
  const [viewed, setViewed] = useState<Record<string, boolean>>({});
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showDescModal, setShowDescModal] = useState<string | null>(null);
  const [showQuestionModal, setShowQuestionModal] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const { wireframeMode } = useWireframe();

  const holes = [
    {
      id: 'CX-01',
      title: '方向偏转',
      desc: '孔号：CX-01\n位置：基坑北侧冠梁\n外露高度：约0.5m\n保护盖：在位\n\nA+方向标识可见，标识箭头指向与设计监测方向（垂直基坑边）存在约45°夹角，偏向东北方向。\n\n管口完好无破损，管口周边整洁。',
      options: [
        { id: 'A', text: '方向有偏差但在允许范围内，可通过软件校正补偿，不必现场处理，直接进入测量', correct: false },
        { id: 'B', text: '方向偏转超限，应记录实际偏差角度并上报，由技术负责人确认后重新标定A+方向再进行后续工作', correct: true },
        { id: 'C', text: '方向偏转，应在管口处旋转管体将导槽对准设计方向后固定', correct: false },
        { id: 'D', text: '方向偏转，该孔不可修复，应判废并在旁边重新钻孔埋管', correct: false }
      ]
    },
    {
      id: 'CX-02',
      title: '盖帽缺失',
      desc: '孔号：CX-02\n位置：基坑北侧冠梁\n外露高度：约0.5m\n保护盖：无\n\n管口处无保护盖，管口敞开，可见管内十字形导槽，顶口完好无破损。\n\n管口周边有少量施工碎屑散落。',
      options: [
        { id: 'A', text: '管口敞开但导槽可见且完好，说明管体未受损，可直接进入通槽复测', correct: false },
        { id: 'B', text: '管口敞开，应先用高压气枪吹净管内杂物，再加装保护盖', correct: false },
        { id: 'C', text: '管口敞开且有碎屑，应先清理管口碎屑防止落入管内，再加装专用保护盖封堵', correct: true },
        { id: 'D', text: '管口敞开，应用塑料薄膜和胶带临时封口即可，正式保护盖可后续补装', correct: false }
      ]
    },
    {
      id: 'CX-03',
      title: '混凝土堵塞',
      desc: '孔号：CX-03\n位置：基坑北侧冠梁\n外露高度：可辨认但被覆盖\n保护盖：被混凝土包裹\n\n管口被一层混凝土浆覆盖，无法看到导槽和A+标识。管口周围有浇筑溢出痕迹。',
      options: [
        { id: 'A', text: '管口被混凝土覆盖，应使用电钻在管口位置钻透混凝土层，快速恢复管口通道', correct: false },
        { id: 'B', text: '管口被混凝土覆盖，应使用高压水枪冲洗溶解混凝土浆，避免机械损伤', correct: false },
        { id: 'C', text: '管口被混凝土完全覆盖，管体大概率已被压损，应判废该孔', correct: false },
        { id: 'D', text: '管口被混凝土覆盖，应人工小心凿除管口周围混凝土，清理后检查管口和导槽完整性再恢复保护', correct: true }
      ]
    },
    {
      id: 'CX-04',
      title: '状态合格',
      desc: '孔号：CX-04\n位置：基坑北侧冠梁\n外露高度：约0.5m\n保护盖：完好\n\n管口保护盖完好。A+方向标识清晰，指向与设计监测方向一致。\n\n管口周边整洁无杂物。',
      options: [
        { id: 'A', text: '外观合格，但应加做一次方向复核以确保万无一失', correct: false },
        { id: 'B', text: '外观合格，但保护盖应更换为金属盖帽以提高防护等级', correct: false },
        { id: 'C', text: '外观合格，状态满足验收要求，可进入通槽复测', correct: true },
        { id: 'D', text: '外观合格，但外露高度0.5m偏高，应截短至与地面齐平以防碰撞', correct: false }
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
    const holeResults = holes.map((h, idx) => {
      const isCorrect = h.options.find(o => o.id === answers[h.id])?.correct || false;
      return {
        id: `1-3-${idx + 1}`,
        label: `${h.id} 管口验收处理`,
        score: isCorrect ? 1 : 0,
        maxScore: 1,
        correct: isCorrect,
        userAnswer: answers[h.id],
        correctAnswer: h.options.find(o => o.correct)?.id || ''
      };
    });

    const totalScore = holeResults.reduce((acc, r) => acc + r.score, 0);

    onNext({
      stepId: 'step5',
      stepName: '管口验收',
      score: totalScore,
      maxScore: 4,
      answers: holeResults
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
          label="img:基坑边俯视场景图"
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
                label: completed[h.id] ? '已处理' : '验收判定',
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
                <div key={h.id} className="flex flex-col items-center space-y-2">
                  <span className="text-[10px] font-bold opacity-60">{h.id}</span>
                  
                  {/* Hole Visual + Right Marker */}
                  <div 
                    onClick={() => handleHotspotClick(h.id)}
                    className={cn(
                      "w-20 h-20 border-2 flex items-center justify-center transition-all cursor-pointer relative group",
                      viewed[h.id] ? "border-industrial-fg bg-industrial-fg/5" : "border-industrial-fg/30 hover:border-industrial-fg/60 animate-breathing"
                    )}
                  >
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

                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-industrial-fg text-white text-[8px] px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                        点击查看详情
                      </div>

                      {/* Marker: overlapping right border */}
                      {viewed[h.id] && !completed[h.id] ? (
                        <button 
                          onClick={(e) => { e.stopPropagation(); openQuestion(h.id); }}
                          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border-2 border-industrial-fg flex items-center justify-center text-industrial-fg animate-breathing z-20"
                          title="验收判定"
                        >
                          <span className="text-xs font-bold">?</span>
                        </button>
                      ) : completed[h.id] ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); openQuestion(h.id); }}
                          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-green-600 border-2 border-green-600 flex items-center justify-center text-white hover:opacity-70 transition-opacity z-20"
                          title="已处理"
                        >
                          <span className="text-xs font-bold">✓</span>
                        </button>
                      ) : null}
                  </div>

                  <span className="text-[10px] font-medium opacity-80 text-center h-8 flex items-center">{h.title}</span>
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
        title={`${showDescModal} 管口现场状态`}
      >
        <div className="flex flex-col md:flex-row gap-8">
          {/* Left: Diagram */}
          <div className={cn("w-full md:w-1/2 aspect-square border flex flex-col items-center justify-center p-6 relative", wireframeMode ? "bg-gray-100 border-2 border-dashed border-gray-400" : "bg-industrial-bg/5 border-industrial-fg/10")}>
            <span className={cn("absolute top-4 left-4 text-[10px] font-bold uppercase tracking-widest", wireframeMode ? "text-gray-400 font-mono" : "opacity-40")}>管口俯视图</span>
            
            {/* Dynamic Diagram based on showDescModal */}
            {wireframeMode ? (
              <div className="text-gray-400 font-mono text-xs text-center">img:管口俯视图-{showDescModal}</div>
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
              <Button onClick={confirmDesc} className="w-full">知道了</Button>
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
            title={`${showQuestionModal} 问题识别与处理`}
          >
            <div className="space-y-4">
              <p className="text-xs font-bold">该孔位存在什么问题？应如何处理？</p>
              <div className="space-y-2">
                {holes.find(h => h.id === showQuestionModal)?.options.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setSelectedOption(opt.id)}
                    className={cn(
                      "w-full text-left p-3 text-xs border transition-all flex items-start space-x-3",
                      selectedOption === opt.id 
                        ? "border-industrial-fg bg-industrial-fg text-white" 
                        : "border-industrial-fg/20 hover:border-industrial-fg"
                    )}
                  >
                    <span className="font-bold mt-0.5">{opt.id}.</span>
                    <span className="flex-1 leading-relaxed">{opt.text}</span>
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
