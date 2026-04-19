import React, { useState, useEffect } from 'react';
import { TechnicalCard, Button, TechnicalInput, Modal } from '../Common';
import { cn } from '../../lib/utils';
import { CheckCircle2 } from 'lucide-react';
import { useWireframe } from '../WireframeContext';
import { WireframePlaceholder } from '../WireframeOverlay';
import { SitePlanDiagram } from '../diagrams/SitePlanDiagram';

export const TechnicalPreparation: React.FC<{ onNext: (data: any) => void }> = ({ onNext }) => {
  const { wireframeMode } = useWireframe();
  const [selectedHotspot, setSelectedHotspot] = useState<string | null>(null);
  const [hoveredHotspot, setHoveredHotspot] = useState<string | null>(null);
  const [confirmedHotspot, setConfirmedHotspot] = useState<string | null>(null);
  const [spacing, setSpacing] = useState('');
  const [showSpacingInput, setShowSpacingInput] = useState(false);
  const [showHotspotModal, setShowHotspotModal] = useState(false);
  const [hotspotViewed, setHotspotViewed] = useState<string[]>([]);
  const [modifyCount, setModifyCount] = useState(0);

  const hotspots = [
    { 
      id: 'CX1', 
      name: '冠梁', 
      x: '20%', 
      y: '35%', 
      desc: '冠梁是连接各围护桩/墙顶部的钢筋混凝土梁，位于基坑围护结构的顶部，沿基坑周圈设置。',
      isCorrect: true
    },
    { 
      id: 'CX2', 
      name: '周边道路', 
      x: '45%', 
      y: '85%', 
      desc: '基坑外侧的市政道路区域，地下分布有污水干管DN300等市政管线，地面有施工车辆通行。',
      isCorrect: false
    },
    { 
      id: 'CX3', 
      name: '基坑开挖区', 
      x: '40%', 
      y: '55%', 
      desc: '基坑开挖区域内部，当前开挖深度12m，底部为基坑作业面。',
      isCorrect: false
    },
    { 
      id: 'CX4', 
      name: '周边建筑', 
      x: '85%', 
      y: '60%', 
      desc: '基坑东侧邻近商业楼，距基坑边缘约12m，为既有多层建筑。',
      isCorrect: false
    },
  ];

  const handleHotspotClick = (id: string) => {
    setSelectedHotspot(id);
    setShowHotspotModal(true);
    if (!hotspotViewed.includes(id)) {
      setHotspotViewed([...hotspotViewed, id]);
    }
  };

  useEffect(() => {
    if (confirmedHotspot && spacing) {
      handleSubmit();
    }
  }, [confirmedHotspot, spacing]);

  const handleConfirmHotspot = () => {
    if (confirmedHotspot && confirmedHotspot !== selectedHotspot) {
      setSpacing('');
      setShowSpacingInput(false);
    }
    setConfirmedHotspot(selectedHotspot);
    setShowHotspotModal(false);
  };

  const handleCloseHotspotModal = () => {
    setShowHotspotModal(false);
    setSelectedHotspot(confirmedHotspot);
  };

  const handleConfirmSpacing = () => {
    if (!spacing || parseInt(spacing) <= 0) return;
    
    if (spacing) {
      setModifyCount(prev => prev + 1);
    }
    setShowSpacingInput(false);
  };

  const handleSubmit = () => {
    const spacingNum = parseInt(spacing);
    const score1 = confirmedHotspot === 'CX1' ? 3 : 0;
    const score2 = (spacingNum >= 20 && spacingNum <= 60) ? 2 : 0;
    
    onNext({
      stepId: 'step1',
      stepName: '前期技术准备',
      submittedAt: new Date().toISOString(),
      answers: [
        {
          questionId: '1-1-1',
          type: 'choice',
          label: '平面图选点',
          userAnswer: confirmedHotspot,
          correctAnswer: 'CX1',
          score: score1,
          maxScore: 3
        },
        {
          questionId: '1-1-2',
          type: 'fill',
          label: '测点间距',
          userAnswer: spacing,
          correctRange: [20, 60],
          unit: 'm',
          score: score2,
          maxScore: 2,
          modifyCount: Math.max(0, modifyCount - 1)
        }
      ],
      hotspotViewed,
      totalScore: score1 + score2,
      maxScore: 5
    });
  };

  const currentHotspotData = hotspots.find(h => h.id === selectedHotspot);
  const confirmedHotspotData = hotspots.find(h => h.id === confirmedHotspot);

  return (
    <div className="space-y-6">
      <TechnicalCard title="基坑支护平面布置图">
        <WireframePlaceholder
          label="img:基坑支护平面布置图"
          className="aspect-[21/9]"
          hotspots={[
            ...hotspots.map(hp => ({
              id: hp.id,
              label: hp.name,
              labelPosition: 'bottom' as const,
              position: { left: hp.x, top: hp.y, transform: 'translate(-50%, -50%)' },
              onClick: () => handleHotspotClick(hp.id),
              selected: confirmedHotspot === hp.id,
              className: cn(
                'w-9 h-9 rounded-full',
                confirmedHotspot && confirmedHotspot !== hp.id && 'opacity-40'
              ),
            })),
            ...(confirmedHotspot ? [{
              id: spacing ? '✓' : '?',
              label: spacing ? `监测间距已配置(${spacing}m)` : '请布置监测间距',
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
        title="布置监测间距"
      >
        <div className="space-y-6">
          <p className="text-xs leading-relaxed opacity-80">请参考项目资料，填写测点间距。</p>
          <TechnicalInput 
            label="测点间距" 
            value={spacing} 
            onChange={(val) => setSpacing(val.replace(/[^\d]/g, '').slice(0, 2))} 
            unit="M"
            placeholder="请输入整数"
          />
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
        title={`${currentHotspotData?.id} — ${currentHotspotData?.name}`}
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
