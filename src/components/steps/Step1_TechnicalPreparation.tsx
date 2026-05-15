import React, { useState, useEffect } from 'react';
import { TechnicalCard, Button, Modal } from '../Common';
import { cn } from '../../lib/utils';
import { CheckCircle2 } from 'lucide-react';
import { useWireframe } from '../WireframeContext';
import { WireframePlaceholder } from '../WireframeOverlay';
import { SitePlanDiagram } from '../diagrams/SitePlanDiagram';
import { technicalPreparationScoringConfig } from '../../data/scoringConfig';
import { getUiLabel, trainingStepsByStepId } from '../../data/trainingContent';
import { calculateStepScore } from '../../lib/scoring';
import { loadStepDraft, saveStepDraft } from '../../lib/trainingStorage';

export const TechnicalPreparation: React.FC<{ onNext: (data: any) => void }> = ({ onNext }) => {
  const { wireframeMode } = useWireframe();
  const draft = loadStepDraft<{
    selectedHotspot?: string | null;
    confirmedHotspot?: string | null;
    spacing?: string;
    hotspotViewed?: string[];
    modifyCount?: number;
  }>('1');
  const [selectedHotspot, setSelectedHotspot] = useState<string | null>(() => draft?.selectedHotspot ?? draft?.confirmedHotspot ?? null);
  const [hoveredHotspot, setHoveredHotspot] = useState<string | null>(null);
  const [confirmedHotspot, setConfirmedHotspot] = useState<string | null>(() => draft?.confirmedHotspot ?? null);
  const [spacing, setSpacing] = useState(() => draft?.spacing ?? '');
  const [showSpacingInput, setShowSpacingInput] = useState(false);
  const [showHotspotModal, setShowHotspotModal] = useState(false);
  const [hotspotViewed, setHotspotViewed] = useState<string[]>(() => draft?.hotspotViewed ?? []);
  const [modifyCount, setModifyCount] = useState(() => draft?.modifyCount ?? 0);
  const stepContent = trainingStepsByStepId['prep.tech'];

  const pointQuestion = technicalPreparationScoringConfig.questions.find(q => q.questionId === 'prep.tech.location' && q.type === 'singleChoice');
  const spacingQuestion = technicalPreparationScoringConfig.questions.find(q => q.questionId === 'prep.tech.spacing' && q.type === 'fillRange');
  const hotspots = pointQuestion?.type === 'singleChoice' ? pointQuestion.options.map(option => ({
    id: option.value,
    name: option.label,
    x: option.x ?? '50%',
    y: option.y ?? '50%',
    desc: option.desc,
    isCorrect: option.value === pointQuestion.correctAnswer,
  })) : [];

  const handleHotspotClick = (id: string) => {
    setSelectedHotspot(id);
    setShowHotspotModal(true);
    if (!hotspotViewed.includes(id)) {
      const nextHotspotViewed = [...hotspotViewed, id];
      setHotspotViewed(nextHotspotViewed);
      saveStepDraft('1', { selectedHotspot: id, confirmedHotspot, spacing, hotspotViewed: nextHotspotViewed, modifyCount });
    } else {
      saveStepDraft('1', { selectedHotspot: id, confirmedHotspot, spacing, hotspotViewed, modifyCount });
    }
  };

  useEffect(() => {
    if (confirmedHotspot && spacing) {
      handleSubmit();
    }
  }, [confirmedHotspot, spacing]);

  const handleConfirmHotspot = () => {
    const nextConfirmedHotspot = selectedHotspot;
    let nextSpacing = spacing;
    let nextShowSpacingInput = showSpacingInput;
    if (confirmedHotspot && confirmedHotspot !== selectedHotspot) {
      nextSpacing = '';
      nextShowSpacingInput = false;
      setSpacing(nextSpacing);
      setShowSpacingInput(nextShowSpacingInput);
    }
    setConfirmedHotspot(nextConfirmedHotspot);
    saveStepDraft('1', { selectedHotspot, confirmedHotspot: nextConfirmedHotspot, spacing: nextSpacing, hotspotViewed, modifyCount });
    setShowHotspotModal(false);
  };

  const handleCloseHotspotModal = () => {
    setShowHotspotModal(false);
    setSelectedHotspot(confirmedHotspot);
  };

  const handleConfirmSpacing = () => {
    if (!spacing || parseInt(spacing) <= 0) return;
    
    let nextModifyCount = modifyCount;
    if (spacing) {
      nextModifyCount = modifyCount + 1;
      setModifyCount(nextModifyCount);
    }
    saveStepDraft('1', { selectedHotspot, confirmedHotspot, spacing, hotspotViewed, modifyCount: nextModifyCount });
    setShowSpacingInput(false);
  };

  const handleSubmit = () => {
    const result = calculateStepScore(technicalPreparationScoringConfig, [
      { questionId: 'prep.tech.location', answer: confirmedHotspot },
      { questionId: 'prep.tech.spacing', answer: spacing },
    ]);
    
    onNext({
      ...result,
      answers: result.answers.map(answer => answer.questionId === 'prep.tech.spacing' ? {
        ...answer,
        modifyCount: Math.max(0, modifyCount - 1),
      } : answer),
      hotspotViewed,
    });
  };

  const currentHotspotData = hotspots.find(h => h.id === selectedHotspot);
  const confirmedHotspotData = hotspots.find(h => h.id === confirmedHotspot);

  return (
    <div className="space-y-6">
      <TechnicalCard title={stepContent.diagramTitle}>
        <WireframePlaceholder
          label={stepContent.diagramLabel}
          className="aspect-[21/9]"
          hotspots={[
            ...hotspots.map(hp => ({
              id: hp.name,
              label: '',
              position: { left: hp.x, top: hp.y, transform: 'translate(-50%, -50%)' },
              onClick: () => handleHotspotClick(hp.id),
              selected: confirmedHotspot === hp.id,
              className: cn(
                'min-w-16 h-8 rounded-sm px-2 whitespace-nowrap text-[10px]',
                confirmedHotspot && confirmedHotspot !== hp.id && 'opacity-40'
              ),
            })),
            ...(confirmedHotspot ? [{
              id: spacing ? '✓' : '?',
              label: spacing ? getUiLabel('prep.tech', 'spacingActionDone', { value: spacing }) : getUiLabel('prep.tech', 'spacingActionEmpty'),
              labelPosition: 'right' as const,
              position: (() => {
                const hp = hotspots.find(h => h.id === confirmedHotspot)!;
                return { left: `calc(${hp.x} + 24px)`, top: hp.y, transform: 'translateY(-50%)' };
              })(),
              onClick: () => setShowSpacingInput(true),
              selected: !!spacing,
              className: 'w-5 h-5 rounded-full text-[9px]',
              zIndex: 20,
            }] : []),
          ]}
        >
          <SitePlanDiagram
            hotspots={hotspots}
            confirmedId={confirmedHotspot}
            selectedId={selectedHotspot}
            hoveredId={hoveredHotspot}
            spacing={spacing}
            onHotspotClick={handleHotspotClick}
            onHotspotHover={(id) => !confirmedHotspot && setHoveredHotspot(id)}
            onSpacingClick={() => setShowSpacingInput(true)}
          />
        </WireframePlaceholder>
      </TechnicalCard>

      {/* Spacing Input Modal */}
      <Modal
        isOpen={showSpacingInput}
        onClose={() => setShowSpacingInput(false)}
        title={getUiLabel('prep.tech', 'spacingModalTitle')}
      >
        <div className="space-y-6">
          <p className="text-xs leading-relaxed opacity-80">{spacingQuestion?.prompt}</p>
          <div className="relative">
            <input
              type="text"
              value={spacing}
              onChange={(event) => setSpacing(event.target.value.replace(/[^\d]/g, '').slice(0, 2))}
              placeholder={getUiLabel('prep.tech', 'spacingInputPlaceholder')}
              className="w-full border border-industrial-fg bg-white p-2 pr-12 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-industrial-info"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[10px] opacity-50 uppercase">
              M
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button onClick={handleConfirmSpacing} className="w-full">确认</Button>
            <Button variant="secondary" onClick={() => setShowSpacingInput(false)} className="w-full">取消</Button>
          </div>
        </div>
      </Modal>

      {/* Hotspot Detail Modal */}
      <Modal 
        isOpen={showHotspotModal} 
        onClose={handleCloseHotspotModal} 
        title={currentHotspotData?.name}
      >
        <div className="space-y-6">
          <div className="border-b border-industrial-fg pb-4">
            <p className="text-xs leading-relaxed opacity-80">
              {currentHotspotData?.desc}
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <Button onClick={handleConfirmHotspot} className="w-full">选择</Button>
            <Button variant="secondary" onClick={handleCloseHotspotModal} className="w-full">取消</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
