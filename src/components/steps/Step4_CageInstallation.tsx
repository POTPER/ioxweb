import React, { useState, useEffect, useRef } from 'react';
import { TechnicalCard, Button, Modal } from '../Common';
import { AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { useWireframe } from '../WireframeContext';
import { WireframePlaceholder } from '../WireframeOverlay';
import { SectionDiagram } from '../diagrams/SectionDiagram';
import { ElevationDiagram } from '../diagrams/ElevationDiagram';

export const CageInstallation: React.FC<{ onNext: (data: any) => void }> = ({ onNext }) => {
  const [viewed, setViewed] = useState<Record<string, boolean>>({});
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [showDescModal, setShowDescModal] = useState<string | null>(null);
  const [showQuestionModal, setShowQuestionModal] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showBindingModal, setShowBindingModal] = useState(false);
  const modalJustClosed = useRef(false);
  const { wireframeMode } = useWireframe();

  const bindingDesc = {
    title: '钢筋笼',
    desc: '钢筋笼是地下连续墙的主要承力构件，由纵筋、箮筋和拉筋组成。测斜管通过钢丝绑扎固定在钢筋笼的主筋上，随钢筋笼一同下放入槽段。绑扎质量直接影响测斜管在混凝土浇筑过程中的稳定性和导槽的连续性。'
  };

  const sectionHotspots = [
    { id: 'A', title: '笼体内侧主筋处', desc: '钢筋笼迎向基坑内侧的纵筋位置。该处位于笼体内侧，下孔过程中不直接接触孔壁。测斜管固定在此处后随钢筋笼整体下放。', correct: true },
    { id: 'B', title: '笼体基坑侧面', desc: '钢筋笼朝向基坑开挖面的一侧。该侧是围护结构承受侧向土压力的受力面，距开挖面最近。', correct: false },
    { id: 'C', title: '笼体外侧主筋处', desc: '钢筋笼背向基坑的外侧纵筋位置。该处在下孔时靠近孔壁或导墙，空间相对紧凑。', correct: false },
    { id: 'D', title: '笼体土侧面', desc: '钢筋笼朝向保留土体的一侧。该侧远离基坑开挖面，土压力方向与位移监测主方向存在夹角。', correct: false }
  ];

  const heightHotspots = [
    { id: '1', title: '方案①', name: '底至笼底、顶超出地面0.5m', desc: '测斜管从钢筋笼底部延伸至地面以上约0.5m。管体覆盖钢筋笼全长，顶口高出地面便于后续测量入孔。', correct: true },
    { id: '2', title: '方案②', name: '底至笼底、顶与地面齐平', desc: '测斜管从钢筋笼底部延伸至地面标高。管体覆盖钢筋笼全长，但顶口与地面齐平，无预留。', correct: false },
    { id: '3', title: '方案③', name: '底高于笼底2m、顶超出地面0.5m', desc: '测斜管底部距笼底约2m，顶部超出地面0.5m。管体未覆盖笼底段。', correct: false },
    { id: '4', title: '方案④', name: '底至笼底、顶低于地面1m', desc: '测斜管从笼底延伸至地面以下约1m处。管体覆盖笼底但顶口在地面以下。', correct: false }
  ];

  const spacingOptions = [
    { id: 'A', text: '每隔1.0~1.5m设一道绑扎点', correct: true },
    { id: 'B', text: '仅在管顶和管底各绑一道', correct: false },
    { id: 'C', text: '每隔3~4m设一道绑扎点', correct: false },
    { id: 'D', text: '每隔0.3m密集绑扎', correct: false }
  ];

  const tightnessOptions = [
    { id: 'A', text: '适度绑扎，固定但不压迫管壁', correct: true },
    { id: 'B', text: '尽量扎紧，防止任何松动', correct: false },
    { id: 'C', text: '松散绑扎，允许管体自由滑动', correct: false },
    { id: 'D', text: '用钢丝直接焊接在钢筋上', correct: false }
  ];

  const handleHotspotClick = (type: 'section' | 'height', id: string) => {
    setShowDescModal(`${type}:${id}`);
  };

  const confirmDesc = () => {
    if (showDescModal) {
      const [type, id] = showDescModal.split(':');
      setAnswers({ ...answers, [type]: id });
      setCompleted({ ...completed, [type]: true });
      setShowDescModal(null);
    }
  };

  const openQuestion = (type: string) => {
    setSelectedOption(answers[type] || null);
    setShowQuestionModal(type);
  };

  const handleConfirmAnswer = (type: string) => {
    if (!selectedOption) return;
    setAnswers({ ...answers, [type]: selectedOption });
    setCompleted({ ...completed, [type]: true });
    setShowQuestionModal(null);
    setSelectedOption(null);
    modalJustClosed.current = true;
    setTimeout(() => { modalJustClosed.current = false; }, 300);
  };

  const handleSubmit = () => {
    const scoreMap = {
      section: sectionHotspots.find(h => h.id === answers.section)?.correct ? 1 : 0,
      height: heightHotspots.find(h => h.id === answers.height)?.correct ? 1 : 0,
      spacing: spacingOptions.find(o => o.id === answers.spacing)?.correct ? 1 : 0,
      tightness: tightnessOptions.find(o => o.id === answers.tightness)?.correct ? 1 : 0
    };

    onNext({
      stepId: 'step4',
      stepName: '导管安装到钢筋笼',
      score: scoreMap.section + scoreMap.height + scoreMap.spacing + scoreMap.tightness,
      maxScore: 4,
      answers: [
        { id: '2-3-1', label: '截面安装位置', score: scoreMap.section, maxScore: 1, correct: scoreMap.section === 1, userAnswer: answers.section, correctAnswer: 'A' },
        { id: '2-3-2', label: '高度布置方案', score: scoreMap.height, maxScore: 1, correct: scoreMap.height === 1, userAnswer: answers.height, correctAnswer: '1' },
        { id: '2-3-3', label: '绑扎间距', score: scoreMap.spacing, maxScore: 1, correct: scoreMap.spacing === 1, userAnswer: answers.spacing, correctAnswer: 'A' },
        { id: '2-3-4', label: '绑扎松紧度', score: scoreMap.tightness, maxScore: 1, correct: scoreMap.tightness === 1, userAnswer: answers.tightness, correctAnswer: 'A' }
      ]
    });
  };

  const confirmBinding = () => {
    setViewed({ ...viewed, binding: true });
    setCompleted({ ...completed, binding: true });
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
        <TechnicalCard title="截面图（基坑与钢筋笼）">
          <WireframePlaceholder
            label="img:截面图-基坑与钢筋笼"
            className="aspect-square"
            hotspots={sectionHotspots.map((h, i) => {
              const positions: React.CSSProperties[] = [
                { top: '10%', left: '50%', transform: 'translate(-50%, -50%)' },
                { top: '50%', right: '10%', transform: 'translate(50%, -50%)' },
                { bottom: '10%', left: '50%', transform: 'translate(-50%, 50%)' },
                { top: '50%', left: '10%', transform: 'translate(-50%, -50%)' }
              ];
              return {
                id: h.id,
                label: h.title,
                labelPosition: 'bottom' as const,
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
        <TechnicalCard title="立面图（钢筋笼立面）">
          <div className="relative bg-white border border-industrial-fg/20 flex flex-col">
            {/* Main diagram area */}
            <WireframePlaceholder
              label={answers.height ? `img:立面图-方案${answers.height}` : 'img:立面图-默认'}
              className="h-[320px]"
              hotspots={[
                {
                  id: '笼体',
                  label: '钢筋笼介绍',
                  labelPosition: 'right' as const,
                  position: { top: '50%', left: '40%', transform: 'translate(-50%, -50%)' },
                  onClick: () => { if (!modalJustClosed.current) setShowBindingModal(true); },
                  selected: !!completed['binding'],
                },
                ...(viewed['binding'] ? [
                  {
                    id: completed['spacing'] ? '✓' : '?',
                    label: '绑扎间距',
                    labelPosition: 'right' as const,
                    className: 'w-5 h-5 rounded-full text-[9px]',
                    position: { top: '33%', left: 'calc(40% + 32px)', transform: 'translateY(-50%)' } as React.CSSProperties,
                    onClick: () => openQuestion('spacing'),
                    selected: !!completed['spacing'],
                    zIndex: 20,
                  },
                  {
                    id: completed['tightness'] ? '✓' : '?',
                    label: '绑扎松紧',
                    labelPosition: 'right' as const,
                    className: 'w-5 h-5 rounded-full text-[9px]',
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
                selectedHeight={answers.height}
                onCageClick={() => { if (!modalJustClosed.current) setShowBindingModal(true); }}
                onQuestionClick={(type) => openQuestion(type)}
              />
            </WireframePlaceholder>

            {/* Prompt text */}
            <div className="px-4 py-2 text-center">
              <span className="text-xs font-bold text-industrial-fg">请选择合理的布置方案。</span>
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
                        {h.id}{h.title}
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
                          "flex flex-col items-center gap-1 px-3 py-2 rounded transition-all",
                          isSelected
                            ? "bg-industrial-fg/5 ring-1 ring-industrial-fg"
                            : "hover:bg-industrial-bg",
                          completed['height'] && !isSelected && "opacity-30"
                        )}
                      >
                        <div className={cn(
                          "w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all",
                          isSelected
                            ? "bg-industrial-fg border-industrial-fg text-white"
                            : "bg-white border-industrial-fg/30"
                        )}>
                          {h.id}
                        </div>
                        <span className={cn("text-[9px] whitespace-nowrap", isSelected ? "font-bold" : "opacity-60")}>{h.title}</span>
                        {isSelected && (
                          <span className="text-[9px] font-bold text-green-600">已选择</span>
                        )}
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
            <Button onClick={confirmDesc} className="flex-1">选择</Button>
            <Button variant="secondary" onClick={() => setShowDescModal(null)} className="flex-1">取消</Button>
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
          <Button onClick={confirmBinding} className="w-full">知道了</Button>
        </div>
      </Modal>

      {/* Question Modals (Mode C) */}
      <AnimatePresence>
        {showQuestionModal && (
          <Modal 
            isOpen={true} 
            onClose={() => { setShowQuestionModal(null); setSelectedOption(null); }} 
            title={showQuestionModal === 'spacing' ? "绑扎间距" : "绑扎松紧度"}
          >
            <div className="space-y-4">
              <p className="text-xs font-bold">
                {showQuestionModal === 'spacing' 
                  ? "测斜管绑扎点的间距应如何设置？" 
                  : "测斜管与钢筋笼的绑扎松紧度应如何控制？"}
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
                    <span className="font-bold mr-2">{opt.id}.</span>
                    {opt.text}
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
