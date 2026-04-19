import React, { useState, useEffect } from 'react';
import { TechnicalCard, Button, Modal } from '../Common';
import { cn } from '../../lib/utils';
import { CheckCircle2 } from 'lucide-react';
import { useWireframe } from '../WireframeContext';
import { WireframePlaceholder } from '../WireframeOverlay';

export const MaterialPickup: React.FC<{ onNext: (data: any) => void }> = ({ onNext }) => {
  const { wireframeMode } = useWireframe();
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [confirmedArea, setConfirmedArea] = useState<string | null>(null);
  const [showAreaModal, setShowAreaModal] = useState(false);
  const [showInspectionModal, setShowInspectionModal] = useState(false);
  const [inspectionAnswer, setInspectionAnswer] = useState<string | null>(null);
  const [tempInspectionAnswer, setTempInspectionAnswer] = useState<string | null>(null);

  const areas = [
    { 
      id: 'A', 
      name: '基坑坡顶平台', 
      x: '20%', 
      y: '30%', 
      desc: '基坑开挖边线外侧的硬化平台，紧邻基坑边缘，设有安全围挡和警示标识，地面可见测量控制桩和施工放线标记。' 
    },
    { 
      id: 'B', 
      name: '现场材料库房内', 
      x: '60%', 
      y: '25%', 
      desc: '施工现场的封闭式临时库房，室内配有通风窗和温湿度计，各类材料分架存放，设有材料台账和领料登记簿。' 
    },
    { 
      id: 'C', 
      name: '钢筋笼绑扎区', 
      x: '25%', 
      y: '75%', 
      desc: '施工现场的钢筋笼预制加工区域，地面摆放有已成型和待绑扎的钢筋笼，旁边有绑扎工具和铁丝等辅材。' 
    },
    { 
      id: 'D', 
      name: '材料暂存区顶棚下方', 
      x: '75%', 
      y: '65%', 
      desc: '施工现场的露天材料暂存区域，上方有简易顶棚遮蔽，地面铺设枕木隔潮，各类建材按品种分区码放，设有材料标识牌。' 
    },
  ];

  const inspectionOptions = [
    { id: 'A', text: '核对产品合格证与装箱清单' },
    { id: 'B', text: '检查管体有无扭曲变形' },
    { id: 'C', text: '测量管体实际长度' },
    { id: 'D', text: '清洗管体内外表面' },
  ];

  useEffect(() => {
    if (confirmedArea && inspectionAnswer) {
      handleSubmit();
    }
  }, [confirmedArea, inspectionAnswer]);

  const handleAreaClick = (id: string) => {
    setSelectedArea(id);
    setShowAreaModal(true);
  };

  const handleConfirmArea = () => {
    if (confirmedArea && confirmedArea !== selectedArea) {
      setInspectionAnswer(null);
    }
    setConfirmedArea(selectedArea);
    setShowAreaModal(false);
  };

  const handleCloseAreaModal = () => {
    setShowAreaModal(false);
    setSelectedArea(confirmedArea);
  };

  const handleSubmit = () => {
    const score1 = confirmedArea === 'B' ? 1 : 0;
    const score2 = inspectionAnswer === 'B' ? 1 : 0;
    
    onNext({
      stepId: 'step2',
      stepName: '取料区域',
      answers: [
        {
          questionId: '1-2-1',
          type: 'choice',
          label: '取料区域热点选取',
          userAnswer: confirmedArea,
          correctAnswer: 'B',
          score: score1,
          maxScore: 1
        },
        {
          questionId: '1-2-1b',
          type: 'choice',
          label: '领料检查',
          userAnswer: inspectionAnswer,
          correctAnswer: 'B',
          score: score2,
          maxScore: 1
        }
      ]
    });
  };

  const currentAreaData = areas.find(a => a.id === selectedArea);
  const confirmedAreaData = areas.find(a => a.id === confirmedArea);

  return (
    <div className="space-y-6">
      <div>
          <TechnicalCard title="施工现场场景图">
            <WireframePlaceholder
              label="img:施工现场鸟瞰场景图"
              className="aspect-[21/9]"
              forceWireframe
              hotspots={[
                ...areas.map(area => ({
                  id: area.id,
                  label: area.name,
                  labelPosition: 'bottom' as const,
                  position: { left: area.x, top: area.y, transform: 'translate(-50%, -50%)' },
                  onClick: () => handleAreaClick(area.id),
                  selected: confirmedArea === area.id,
                })),
                ...(confirmedArea ? [{
                  id: inspectionAnswer ? '✓' : '?',
                  label: inspectionAnswer ? `领料检查(${inspectionAnswer})` : '领料检查',
                  labelPosition: 'right' as const,
                  className: 'w-5 h-5 rounded-full text-[9px]',
                  position: {
                    left: `calc(${areas.find(a => a.id === confirmedArea)?.x} + 32px)`,
                    top: areas.find(a => a.id === confirmedArea)?.y || '30%',
                    transform: 'translateY(-50%)',
                  } as React.CSSProperties,
                  onClick: () => {
                    setTempInspectionAnswer(inspectionAnswer);
                    setShowInspectionModal(true);
                  },
                  selected: !!inspectionAnswer,
                  zIndex: 20,
                }] : []),
              ]}
            >
              <div className="relative w-full h-full bg-[#f0f0f0] border-2 border-industrial-fg overflow-hidden group">
                {/* Scene Background Mock */}
                <div className="absolute inset-0 bg-neutral-200">
                  <div className="absolute inset-x-[20%] inset-y-[40%] border-4 border-industrial-fg/10 flex items-center justify-center">
                    <span className="text-4xl font-black opacity-5 uppercase tracking-[1em]">基坑区域</span>
                  </div>
                </div>
                
                {/* Hotspots */}
                {areas.map((area) => (
                  <button
                    key={area.id}
                    onClick={() => handleAreaClick(area.id)}
                    className={cn(
                      "absolute w-10 h-10 -ml-5 -mt-5 flex items-center justify-center transition-all duration-300 z-20",
                      confirmedArea === area.id ? "scale-110" : "hover:scale-125",
                      confirmedArea && confirmedArea !== area.id && "opacity-50"
                    )}
                    style={{ left: area.x, top: area.y }}
                  >
                    <div className={cn(
                      "w-full h-full border-2 border-industrial-fg flex items-center justify-center font-bold text-xs transition-colors shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]",
                      confirmedArea === area.id ? "bg-green-500 text-white" : 
                      selectedArea === area.id ? "bg-industrial-fg text-white" : "bg-white"
                    )}>
                      {area.id}
                    </div>

                    {/* [?]/[v] Marker */}
                    {confirmedArea === area.id && (
                      <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 flex items-center space-x-2 whitespace-nowrap z-30">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setTempInspectionAnswer(inspectionAnswer);
                            setShowInspectionModal(true);
                          }}
                          className={cn(
                            "flex items-center space-x-1 px-2 py-1 rounded-full border border-industrial-fg text-[10px] font-bold transition-all",
                            inspectionAnswer ? "bg-green-100 text-green-700" : "bg-white text-industrial-fg animate-breathing"
                          )}
                        >
                          {inspectionAnswer ? (
                            <>
                              <CheckCircle2 size={12} />
                              <span>领料检查已完成 ({inspectionAnswer})</span>
                            </>
                          ) : (
                            <>
                              <span className="w-4 h-4 rounded-full bg-industrial-fg text-white flex items-center justify-center text-[8px]">?</span>
                              <span>请完成领料检查</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </WireframePlaceholder>
          </TechnicalCard>
      </div>

      {/* Area Detail Modal */}
      <Modal 
        isOpen={showAreaModal} 
        onClose={handleCloseAreaModal} 
        title={`${currentAreaData?.id} — ${currentAreaData?.name}`}
      >
        <div className="space-y-6">
          <div className="border-b border-industrial-fg pb-4">
            <p className="text-xs leading-relaxed opacity-80">
              {currentAreaData?.desc}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button onClick={handleConfirmArea} className="w-full">选择</Button>
            <Button variant="secondary" onClick={handleCloseAreaModal} className="w-full">取消</Button>
          </div>
        </div>
      </Modal>

      {/* Inspection Modal */}
      <Modal 
        isOpen={showInspectionModal} 
        onClose={() => {
          setTempInspectionAnswer(null);
          setShowInspectionModal(false);
        }} 
        title="领料检查"
      >
        <div className="space-y-6">
          <p className="text-xs font-bold">到达存放区域后，领取测斜管前应首先进行什么操作？</p>
          <div className="space-y-2">
            {inspectionOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setTempInspectionAnswer(opt.id)}
                className={cn(
                  "w-full text-left p-3 text-xs border transition-all",
                  tempInspectionAnswer === opt.id 
                    ? "border-industrial-fg bg-industrial-fg text-white" 
                    : "border-industrial-fg/20 hover:border-industrial-fg"
                )}
              >
                <span className="font-bold mr-2">{opt.id}.</span>
                {opt.text}
              </button>
            ))}
          </div>
          <Button 
            onClick={() => {
              setInspectionAnswer(tempInspectionAnswer);
              setTempInspectionAnswer(null);
              setShowInspectionModal(false);
            }} 
            className="w-full"
            disabled={!tempInspectionAnswer}
          >
            确认
          </Button>
        </div>
      </Modal>
    </div>
  );
};
