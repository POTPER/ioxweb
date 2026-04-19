import React, { useState, useEffect } from 'react';
import { TechnicalCard, Button, Modal } from '../Common';
import { AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { useWireframe } from '../WireframeContext';
import { WireframePlaceholder } from '../WireframeOverlay';

export const InitialMeasurement: React.FC<{ onNext: (data: any) => void }> = ({ onNext }) => {
  const { wireframeMode } = useWireframe();
  const [completed, setCompleted] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [activeQuestion, setActiveQuestion] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const hotspots = [
    {
      id: 'condition',
      title: '测量条件',
      paragraphs: [
        {
          title: '■ 工程进度',
          content: '基坑围护结构（地下连续墙）已浇筑完成，混凝土养护已满14天。冠梁施工完成，测斜管已预埋并通过通槽检测。第一道混凝土支撑尚未施工。'
        },
        {
          title: '■ 开挖状态',
          content: '基坑尚未开始土方开挖。项目部计划3天后正式开挖。周边建筑物沉降监测点已布设完成。'
        },
        {
          title: '■ 现场条件',
          content: '近一周无大面积降雨，地下水位稳定。场地周边无打桩、爆破等大型振动源施工。测量当日天气晴朗，气温18°C。'
        }
      ],
      question: {
        id: '1-4-1',
        title: '初测时机判断',
        text: '根据当前测量条件，以下说法正确的是？',
        options: [
          { id: 'A', text: '应立即测量，这是开挖前最后的窗口期，测完即可开挖' },
          { id: 'B', text: '应在开挖前完成初测，且至少连续测量2~3次确认数据稳定后方可作为基准' },
          { id: 'C', text: '应等第一层土方开挖后再测，开挖前围护结构无变形，测了也是零值无意义' },
          { id: 'D', text: '混凝土养护仅14天未达28天设计强度，此时测量数据不可靠，应等强度达标后再测' }
        ],
        correct: 'B'
      }
    },
    {
      id: 'data',
      title: '📊 测量数据',
      table: [
        { depth: '0.5', a: '+152', b: '-35' },
        { depth: '1.0', a: '+138', b: '-28' },
        { depth: '1.5', a: '+125', b: '-22' },
        { depth: '2.0', a: '+112', b: '-18' },
        { depth: '2.5', a: '+96', b: '-12' },
        { depth: '3.0', a: '+82', b: '-8' },
        { depth: '3.5', a: '+68', b: '-5' },
        { depth: '4.0', a: '+55', b: '-2' },
        { depth: '4.5', a: '+42', b: '+1' },
        { depth: '5.0', a: '+32', b: '+3' },
        { depth: '5.5', a: '+25', b: '+5' },
        { depth: '6.0', a: '+18', b: '+6' },
        { depth: '6.5', a: '+12', b: '+8' },
        { depth: '7.0', a: '+8', b: '+9' },
        { depth: '7.5', a: '+5', b: '+10' },
        { depth: '8.0', a: '+3', b: '+11' },
        { depth: '8.5', a: '+2', b: '+12' },
        { depth: '9.0', a: '+1', b: '+12' },
        { depth: '9.5', a: '0', b: '+11' },
        { depth: '10.0', a: '-1', b: '+10' },
        { depth: '10.5', a: '-3', b: '+9' },
        { depth: '11.0', a: '-5', b: '+8' },
        { depth: '11.5', a: '-6', b: '+6' },
        { depth: '12.0', a: '-8', b: '+5' },
        { depth: '12.5', a: '-10', b: '+4' },
        { depth: '13.0', a: '-11', b: '+3' },
        { depth: '13.5', a: '-12', b: '+2' },
        { depth: '14.0', a: '-12', b: '+1' },
        { depth: '14.5', a: '-11', b: '+1' },
        { depth: '15.0', a: '-9', b: '0' },
        { depth: '15.5', a: '-7', b: '0' },
        { depth: '16.0', a: '-5', b: '0' },
        { depth: '16.5', a: '-4', b: '0' },
        { depth: '17.0', a: '-2', b: '0' },
        { depth: '17.5', a: '-1', b: '0' },
        { depth: '18.0', a: '-1', b: '0' },
        { depth: '18.5', a: '0', b: '0' },
        { depth: '19.0', a: '0', b: '0' },
        { depth: '19.5', a: '0', b: '0' },
        { depth: '20.0', a: '0', b: '0' }
      ],
      question: {
        id: '1-4-2',
        title: '基准数据有效性判断',
        text: '根据测量数据概况，该数据能否作为后续监测的基准？',
        options: [
          { id: 'A', text: '可以，数据平稳无突变，满足基准要求' },
          { id: 'B', text: '不可以，仅测量1次且未做正反测，无法验证数据重复性和探头标定，应补做正反测并至少再测1~2次' },
          { id: 'C', text: '不可以，A向和B向读数符号相反说明探头方向装反，数据全部作废需重新测量' },
          { id: 'D', text: '可以，正反测只是精度加分项并非必须，1次测量数据平稳即可作为基准' }
        ],
        correct: 'B'
      }
    }
  ];

  const openQuestion = (id: string) => {
    setSelectedOption(answers[id] || null);
    setActiveQuestion(id);
  };

  const handleConfirmAnswer = (hotspotId: string) => {
    if (!selectedOption) return;
    setAnswers(prev => ({ ...prev, [hotspotId]: selectedOption }));
    if (!completed.includes(hotspotId)) {
      setCompleted(prev => [...prev, hotspotId]);
    }
    setActiveQuestion(null);
    setSelectedOption(null);
  };

  const allCompleted = completed.length === hotspots.length;

  const handleSubmit = () => {
    const finalAnswers = hotspots.map(h => {
      const userAnswer = answers[h.id];
      const isCorrect = userAnswer === h.question.correct;
      return {
        questionId: h.question.id,
        type: 'choice',
        label: h.question.title,
        userAnswer,
        correctAnswer: h.question.correct,
        score: isCorrect ? 2 : 0,
        maxScore: 2
      };
    });

    onNext({
      stepId: 'step7',
      stepName: '初测(基准测量)',
      submittedAt: new Date().toISOString(),
      answers: finalAnswers,
      totalScore: finalAnswers.reduce((acc, curr) => acc + curr.score, 0),
      maxScore: 4
    });
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
                  {completed.includes(h.id) ? '[v] 已判定' : '[?] 待判定'}
                </button>
              }
            >
              {/* Condition card: text paragraphs */}
              {'paragraphs' in h && h.paragraphs && (
                <div className="space-y-3">
                  {h.paragraphs.map((s: {title: string; content: string}, i: number) => (
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
                            {h.table.map((row: {depth: string; a: string; b: string}, i: number) => (
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
            title={hotspots.find(h => h.id === activeQuestion)?.question.title}
          >
            <div className="space-y-4">
              <p className="text-xs font-bold">
                {hotspots.find(h => h.id === activeQuestion)?.question.text}
              </p>
              <div className="space-y-2">
                {hotspots.find(h => h.id === activeQuestion)?.question.options.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setSelectedOption(opt.id)}
                    className={cn(
                      "w-full text-left p-3 text-[11px] border transition-all flex items-start space-x-3",
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
                <Button onClick={() => handleConfirmAnswer(activeQuestion)} className="px-12" disabled={!selectedOption}>确认</Button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
};
