import React, { useState, useEffect } from 'react';
import { TechnicalCard, Button, Modal } from '../Common';
import { cn } from '../../lib/utils';
import { CheckCircle2 } from 'lucide-react';
import { useWireframe } from '../WireframeContext';
import { WireframePlaceholder } from '../WireframeOverlay';
import { materialPickupScoringConfig } from '../../data/scoringConfig';
import { getUiLabel, trainingStepsByStepId } from '../../data/trainingContent';
import { calculateStepScore } from '../../lib/scoring';

export const MaterialPickup: React.FC<{ onNext: (data: any) => void }> = ({ onNext }) => {
  const { wireframeMode } = useWireframe();
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [confirmedArea, setConfirmedArea] = useState<string | null>(null);
  const [showAreaModal, setShowAreaModal] = useState(false);
  const [showInspectionModal, setShowInspectionModal] = useState(false);
  const [inspectionAnswer, setInspectionAnswer] = useState<string | null>(null);
  const [tempInspectionAnswer, setTempInspectionAnswer] = useState<string | null>(null);
  const stepContent = trainingStepsByStepId['prep.material'];

  const areaQuestion = materialPickupScoringConfig.questions.find(q => q.questionId === 'prep.material.area' && q.type === 'singleChoice');
  const inspectionQuestion = materialPickupScoringConfig.questions.find(q => q.questionId === 'prep.material.inspection' && q.type === 'singleChoice');
  const areas = areaQuestion?.type === 'singleChoice' ? areaQuestion.options.map(option => ({
    id: option.value,
    name: option.label,
    x: option.x ?? '50%',
    y: option.y ?? '50%',
    desc: option.desc,
  })) : [];
  const inspectionOptions = inspectionQuestion?.type === 'singleChoice' ? inspectionQuestion.options.map(option => ({
    id: option.value,
    text: option.label,
  })) : [];

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
    const result = calculateStepScore(materialPickupScoringConfig, [
      { questionId: 'prep.material.area', answer: confirmedArea },
      { questionId: 'prep.material.inspection', answer: inspectionAnswer },
    ]);
    
    onNext({
      ...result,
    });
  };

  const currentAreaData = areas.find(a => a.id === selectedArea);
  const confirmedAreaData = areas.find(a => a.id === confirmedArea);
  const inspectionAnswerLabel = inspectionOptions.find(option => option.id === inspectionAnswer)?.id || '';

  return (
    <div className="space-y-6">
      <div>
          <TechnicalCard title={stepContent.diagramTitle}>
            <WireframePlaceholder
              label={stepContent.diagramLabel}
              className="aspect-[21/9]"
              forceWireframe
              hotspots={[
                ...areas.map(area => ({
                  id: area.name,
                  label: '',
                  position: { left: area.x, top: area.y, transform: 'translate(-50%, -50%)' },
                  onClick: () => handleAreaClick(area.id),
                  selected: confirmedArea === area.id,
                  className: cn(
                    'min-w-20 h-8 rounded-sm px-2 whitespace-nowrap text-[10px]',
                    confirmedArea && confirmedArea !== area.id && 'opacity-40'
                  ),
                })),
                ...(confirmedArea ? [{
                  id: inspectionAnswer ? '✓' : '?',
                  label: inspectionAnswer ? getUiLabel('prep.material', 'inspectionActionDone', { value: inspectionAnswerLabel }) : getUiLabel('prep.material', 'inspectionActionEmpty'),
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
                      "absolute min-w-20 h-8 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center transition-all duration-300 z-20",
                      confirmedArea === area.id ? "scale-110" : "hover:scale-110",
                      confirmedArea && confirmedArea !== area.id && "opacity-50"
                    )}
                    style={{ left: area.x, top: area.y }}
                  >
                    <div className={cn(
                      "w-full h-full rounded-sm border-2 border-industrial-fg flex items-center justify-center px-2 whitespace-nowrap font-bold text-[10px] transition-colors shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]",
                      confirmedArea === area.id ? "bg-green-500 text-white" : 
                      selectedArea === area.id ? "bg-industrial-fg text-white" : "bg-white"
                    )}>
                      {area.name}
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
                              <span>{getUiLabel('prep.material', 'inspectionDoneLabel', { value: inspectionAnswerLabel })}</span>
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
        title={currentAreaData?.name}
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
          <p className="text-xs font-bold">{inspectionQuestion?.prompt}</p>
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
