import React, { useState, useEffect } from 'react';
import { TechnicalCard, Button, Modal } from '../Common';
import { AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { useWireframe } from '../WireframeContext';
import { WireframePlaceholder } from '../WireframeOverlay';
import { AssemblyDiagram } from '../diagrams/AssemblyDiagram';

export const TubeAssembly: React.FC<{ onNext: (data: any) => void }> = ({ onNext }) => {
  const { wireframeMode } = useWireframe();
  const [viewed, setViewed] = useState<Record<string, boolean>>({});
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [showDescModal, setShowDescModal] = useState<string | null>(null);
  const [showQuestionModal, setShowQuestionModal] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const hotspots = [
    { id: 'tube', name: '测斜管管体', title: '测斜管管体', desc: '测斜管的主体管节部分，是测斜探头上下滑行的通道。管节内壁设有导槽结构，用于引导探头定向运动。不同工程对管材材质、口径和壁厚有不同要求。' },
    { id: 'connector', name: '连接头', title: '接头管', desc: '用于连接相邻两节管材的短管件，套在两根管节的对接处。接头管内壁结构须与管节导槽配合，确保探头通过时连续顺畅。' },
    { id: 'bottomCap', name: '底盖连接', title: '底盖与第一管连接处', desc: '底盖封堵管串最下端管口，是混凝土浇筑时承受液压最大的部位。底盖与第一根管节之间的连接需要完成密封、操作和机械固定三项设置。' },
    { id: 'joint', name: '管节连接', title: '管节与接头管连接处', desc: '相邻管节通过接头管对接，是管串中数量最多的连接部位。每个连接处需要完成密封、操作和机械固定三项设置，并保证导槽方向连续。' }
  ];

  const tubeOptions = [
    { id: 'A', text: 'PVC-U测斜管 Φ70mm', sub: '外径70mm，内径58mm，壁厚6mm；内壁设有十字形导槽，管节长度2m/根；材质：硬聚氯乙烯，抗压强度高，耐腐蚀', correct: true },
    { id: 'B', text: 'PVC给水管 Φ75mm', sub: '外径75mm，内径71mm，壁厚2mm；内壁光滑无导槽，管节长度4m/根；材质：普通PVC，用于建筑给水工程，壁薄', correct: false },
    { id: 'C', text: 'PE双壁波纹管 Φ110mm', sub: '外径110mm，内径95mm，波纹结构；内壁光滑无导槽，外壁环形波纹加强，管节长度6m/根；材质：高密度聚乙烯，用于市政排水工程', correct: false },
    { id: 'D', text: 'ABS测斜管 Φ58mm', sub: '外径58mm，内径50mm，壁厚4mm；内壁设有十字形导槽，管节长度1.5m/根；材质：ABS工程塑料，韧性好，耐低温', correct: false }
  ];

  const connectorOptions = [
    { id: 'A', text: 'PVC-U测斜管专用接头 Φ70mm', sub: '内径与Φ70mm管体外径匹配，承插式结构；内壁设有十字形导槽延续段，长度120mm；材质：PVC-U，与管体同材质，胶水粘接使用', correct: true },
    { id: 'B', text: 'PVC给水管直通接头 Φ75mm', sub: '内径匹配Φ75mm给水管，承插式光滑内壁；无导槽结构，长度100mm；材质：普通PVC，用于给水管道对接', correct: false },
    { id: 'C', text: '橡胶软接头 Φ70mm', sub: '内径70mm，柔性橡胶材质，可弯曲；无导槽结构，管箍式卡紧，长度150mm；材质：三元乙丙橡胶，用于管道柔性连接及减震', correct: false },
    { id: 'D', text: 'ABS测斜管专用接头 Φ58mm', sub: '内径与Φ58mm管体外径匹配，承插式结构；内壁设有十字形导槽延续段，长度100mm；材质：ABS工程塑料，与ABS管体配套使用', correct: false }
  ];

  const bottomCapOptions = [
    { id: 'A', text: '旋转15°~30°再旋回（旋转润胶），然后静置初凝', correct: true },
    { id: 'B', text: '旋转至导槽对齐位置后静置', correct: false },
    { id: 'C', text: '插入后直接静置，不做任何旋转', correct: false },
    { id: 'D', text: '反复旋转直至胶水从接口溢出', correct: false }
  ];

  const jointOptions = [
    { id: 'A', text: '涂胶→插入→旋转润胶→对齐导槽→静置→上下段各打螺丝固定', correct: true },
    { id: 'B', text: '涂胶→插入→直接对齐导槽→静置→中部打一圈螺丝', correct: false },
    { id: 'C', text: '插入→涂胶→旋转润胶→静置→缠防水胶带', correct: false },
    { id: 'D', text: '涂胶→插入→对齐导槽→旋转润胶→铁丝绑扎', correct: false }
  ];

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
    const score = (key: string, opts: { id: string; correct: boolean }[]) =>
      opts.find(o => o.id === answers[key])?.correct ? 1 : 0;

    const tubeScore = score('tube', tubeOptions);
    const connectorScore = score('connector', connectorOptions);
    const bottomCapScore = score('bottomCap', bottomCapOptions);
    const jointScore = score('joint', jointOptions);
    const totalScore = tubeScore + connectorScore + bottomCapScore + jointScore;

    onNext({
      stepId: 'step3',
      stepName: '管材拼装',
      score: totalScore,
      maxScore: 4,
      answers: [
        { id: '1-3-1', label: '管材型号', score: tubeScore, maxScore: 1, correct: tubeScore === 1, userAnswer: answers.tube, correctAnswer: 'A' },
        { id: '1-3-2', label: '连接头型号', score: connectorScore, maxScore: 1, correct: connectorScore === 1, userAnswer: answers.connector, correctAnswer: 'A' },
        { id: '1-3-3', label: '底盖操作方式', score: bottomCapScore, maxScore: 1, correct: bottomCapScore === 1, userAnswer: answers.bottomCap, correctAnswer: 'A' },
        { id: '1-3-4', label: '管节连接流程', score: jointScore, maxScore: 1, correct: jointScore === 1, userAnswer: answers.joint, correctAnswer: 'A' }
      ]
    });
  };

  useEffect(() => {
    if (Object.keys(completed).length === 4) {
      handleSubmit();
    }
  }, [completed]);

  return (
    <div className="flex flex-col min-h-[calc(100vh-13rem)]">
      <TechnicalCard title="测斜管拼装示意图" className="flex-1 flex flex-col">
        <div className="w-full px-6 flex-1 flex flex-col justify-center">
          <WireframePlaceholder
            label="img:测斜管拼装示意图"
            className="py-4"
            hotspots={[
              { id: '侧斜管', label: '管材选型', labelPosition: 'bottom' as const, position: { left: '16%', top: '50%', transform: 'translate(-50%, -50%)' }, onClick: () => handleHotspotClick('tube'), selected: !!completed['tube'] },
              ...(viewed['tube'] ? [{ id: completed['tube'] ? '✓' : '?', label: '管材选型', labelPosition: 'right' as const, position: { left: 'calc(16% + 28px)', top: '50%', transform: 'translateY(-50%)' } as React.CSSProperties, onClick: () => openQuestion('tube'), selected: !!completed['tube'], className: 'w-5 h-5 rounded-full text-[9px]', zIndex: 20 }] : []),
              { id: '连接处', label: '管节连接', labelPosition: 'bottom' as const, position: { left: '37%', top: '50%', transform: 'translate(-50%, -50%)' }, onClick: () => handleHotspotClick('joint'), selected: !!completed['joint'], className: 'w-7 h-9' },
              ...(viewed['joint'] ? [{ id: completed['joint'] ? '✓' : '?', label: '管节连接', labelPosition: 'right' as const, position: { left: 'calc(37% + 22px)', top: '50%', transform: 'translateY(-50%)' } as React.CSSProperties, onClick: () => openQuestion('joint'), selected: !!completed['joint'], className: 'w-5 h-5 rounded-full text-[9px]', zIndex: 20 }] : []),
              { id: '连接头', label: '连接头选型', labelPosition: 'bottom' as const, position: { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }, onClick: () => handleHotspotClick('connector'), selected: !!completed['connector'] },
              ...(viewed['connector'] ? [{ id: completed['connector'] ? '✓' : '?', label: '连接头选型', labelPosition: 'right' as const, position: { left: 'calc(50% + 28px)', top: '50%', transform: 'translateY(-50%)' } as React.CSSProperties, onClick: () => openQuestion('connector'), selected: !!completed['connector'], className: 'w-5 h-5 rounded-full text-[9px]', zIndex: 20 }] : []),
              { id: '底盖连接', label: '底盖操作', labelPosition: 'bottom' as const, position: { left: '80%', top: '50%', transform: 'translate(-50%, -50%)' }, onClick: () => handleHotspotClick('bottomCap'), selected: !!completed['bottomCap'], className: 'w-7 h-9' },
              ...(viewed['bottomCap'] ? [{ id: completed['bottomCap'] ? '✓' : '?', label: '底盖操作', labelPosition: 'right' as const, position: { left: 'calc(80% + 22px)', top: '50%', transform: 'translateY(-50%)' } as React.CSSProperties, onClick: () => openQuestion('bottomCap'), selected: !!completed['bottomCap'], className: 'w-5 h-5 rounded-full text-[9px]', zIndex: 20 }] : []),
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
              <p className="text-xs font-bold">本工程应使用哪种型号的测斜管？</p>
              <div className="space-y-2">
                {tubeOptions.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setSelectedOption(opt.id)}
                    className={cn(
                      "w-full text-left p-4 border transition-all flex items-start space-x-4",
                      selectedOption === opt.id
                        ? "border-industrial-fg bg-industrial-fg text-white"
                        : "border-industrial-fg/10 hover:border-industrial-fg/30"
                    )}
                  >
                    <div className="w-4 h-4 rounded-full border-2 mt-1 flex items-center justify-center" style={{ borderColor: selectedOption === opt.id ? 'white' : '' }}>
                      {selectedOption === opt.id && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold">{opt.id}. {opt.text}</span>
                      </div>
                      <p className={cn("text-[10px] leading-relaxed", selectedOption === opt.id ? "opacity-80" : "opacity-60")}>{opt.sub}</p>
                    </div>
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
              <p className="text-xs font-bold">本工程测斜管应使用哪种型号的连接头？</p>
              <div className="space-y-2">
                {connectorOptions.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setSelectedOption(opt.id)}
                    className={cn(
                      "w-full text-left p-4 border transition-all flex items-start space-x-4",
                      selectedOption === opt.id
                        ? "border-industrial-fg bg-industrial-fg text-white"
                        : "border-industrial-fg/10 hover:border-industrial-fg/30"
                    )}
                  >
                    <div className="w-4 h-4 rounded-full border-2 mt-1 flex items-center justify-center" style={{ borderColor: selectedOption === opt.id ? 'white' : '' }}>
                      {selectedOption === opt.id && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold">{opt.id}. {opt.text}</span>
                      </div>
                      <p className={cn("text-[10px] leading-relaxed", selectedOption === opt.id ? "opacity-80" : "opacity-60")}>{opt.sub}</p>
                    </div>
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
              <p className="text-xs font-bold">底盖插入管体后应如何操作？</p>
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
              <p className="text-xs font-bold">管节插入接头管后的正确操作流程是？</p>
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
