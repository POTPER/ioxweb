import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { AnimatePresence } from 'motion/react';
import ReactECharts from 'echarts-for-react';
import { cn } from '../../lib/utils';
import { AlertTriangle } from 'lucide-react';
import { useWireframe } from '../WireframeContext';
import { WireframePlaceholder } from '../WireframeOverlay';
import { Modal, Button } from '../Common';
import { TrainingQuestionButton } from '../TrainingInteractionButtons';
import { CUM_DISP, DEPTHS, PERIOD_DATES as REAL_DATES, PERIOD_INTERVALS, MONITORING } from '../../data/monitoringData';
import { dataAnalysisScoringConfig } from '../../data/scoringConfig';
import { calculateStepScore } from '../../lib/scoring';

// ===== Data from 监测数据.md =====
const PERIODS = 8;
const CONTROL_VALUE = MONITORING.controlValue; // 50mm
const WARNING_RATIO = MONITORING.warningRatio; // 0.70
const WARNING_THRESHOLD = CONTROL_VALUE * WARNING_RATIO; // 35mm
const PERIOD_DATES = REAL_DATES;

interface DepthRow {
  depth: number;
  cumDisp: number;
  change: number;
  rate: number;
}

function generatePeriodRows(period: number): DepthRow[] {
  const curr = CUM_DISP[period - 1];
  const prev = period > 1 ? CUM_DISP[period - 2] : curr.map(() => 0);
  const interval = PERIOD_INTERVALS[period - 1] || 7;
  return DEPTHS.map((d, i) => {
    const cumDisp = curr[i];
    const chg = Number((curr[i] - prev[i]).toFixed(2));
    const rate = interval > 0 ? Number((chg / interval).toFixed(2)) : 0;
    return { depth: d, cumDisp, change: chg, rate };
  });
}

function buildAllPeriodData() {
  return Array.from({ length: PERIODS }, (_, i) => ({
    period: i + 1,
    date: PERIOD_DATES[i],
    rows: generatePeriodRows(i + 1),
  }));
}

// Correct warning depths (cumDisp > WARNING_THRESHOLD in period 8)
function getCorrectWarningDepths(rows: DepthRow[]): number[] {
  return rows.filter(r => r.cumDisp >= WARNING_THRESHOLD).map(r => r.depth);
}

const CORRECT_Q6 = '加密监测频次并通知设计单位复核';

const DATA_ANALYSIS_QUESTION_IDS = [
  { id: 'q1', questionId: 'data.analysis.maxDepth' },
  { id: 'q2', questionId: 'data.analysis.accelStart' },
  { id: 'q3', questionId: 'data.analysis.maxRecentZone' },
  { id: 'q4', questionId: 'data.analysis.warningDepths' },
  { id: 'q5', questionId: 'data.analysis.trend10' },
  { id: 'q6', questionId: 'data.analysis.action' },
  { id: 'q7', questionId: 'data.analysis.nextInterval' },
] as const;

// 模式C 问题元数据来自 CSV 题库。
const QUESTIONS = DATA_ANALYSIS_QUESTION_IDS.map((item, index) => {
  const question = dataAnalysisScoringConfig.questions.find(config => config.questionId === item.questionId);
  if (!question || question.type !== 'singleChoice') {
    throw new Error(`未找到第12步题目配置：${item.questionId}`);
  }

  return {
    id: item.id,
    questionId: item.questionId,
    num: index + 1,
    title: question.label,
    prompt: question.prompt ?? '',
    options: question.options,
    multi: false,
  };
});

// ===== Component =====
export const MultiPeriodAnalysis: React.FC<{ onNext: (data: any) => void }> = ({ onNext }) => {
  const { wireframeMode } = useWireframe();
  const allData = useMemo(() => buildAllPeriodData(), []);
  const [selectedPeriod, setSelectedPeriod] = useState(PERIODS);

  // Answers
  const [q1, setQ1] = useState('');
  const [q2, setQ2] = useState('');
  const [q3, setQ3] = useState('');
  const [q4, setQ4] = useState('');
  const [q5, setQ5] = useState('');
  const [q6, setQ6] = useState('');
  const [q7, setQ7] = useState('');

  const currentRows = allData[selectedPeriod - 1].rows;
  const correctWarning = useMemo(() => getCorrectWarningDepths(allData[PERIODS - 1].rows), [allData]);

  const allAnswered = q1 !== '' && q2 !== '' && q3 !== '' && q4 !== '' && q5 !== '' && q6 !== '' && q7 !== '';

  // 模式C 弹窗状态
  const [activeQuestion, setActiveQuestion] = useState<string | null>(null);
  const [pendingSingle, setPendingSingle] = useState<string>('');

  const getAnswer = (id: string): string => {
    if (id === 'q1') return q1;
    if (id === 'q2') return q2;
    if (id === 'q3') return q3;
    if (id === 'q4') return q4;
    if (id === 'q5') return q5;
    if (id === 'q6') return q6;
    if (id === 'q7') return q7;
    return '';
  };

  const isAnswered = (id: string): boolean => getAnswer(id) !== '';

  const openQuestion = (id: string) => {
    setPendingSingle(getAnswer(id));
    setActiveQuestion(id);
  };

  const confirmQuestion = () => {
    if (!activeQuestion || !pendingSingle) return;
    if (activeQuestion === 'q1') setQ1(pendingSingle);
    if (activeQuestion === 'q2') setQ2(pendingSingle);
    if (activeQuestion === 'q3') setQ3(pendingSingle);
    if (activeQuestion === 'q4') setQ4(pendingSingle);
    if (activeQuestion === 'q5') setQ5(pendingSingle);
    if (activeQuestion === 'q6') setQ6(pendingSingle);
    if (activeQuestion === 'q7') setQ7(pendingSingle);
    setActiveQuestion(null);
  };

  // 自动提交：全部填写完成后 600ms 内无修改则提交（防抖）
  const submitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (submitTimerRef.current) clearTimeout(submitTimerRef.current);
    if (!allAnswered) return;
    submitTimerRef.current = setTimeout(() => {
      handleSubmit();
    }, 600);
    return () => { if (submitTimerRef.current) clearTimeout(submitTimerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allAnswered, q1, q2, q3, q4, q5, q6, q7]);

  // ===== ECharts Option =====
  const COLORS = ['#d4d4d4', '#b0b0b0', '#8c8c8c', '#6b6b6b', '#505050', '#383838', '#222222', '#141414'];
  const chartOption = useMemo(() => ({
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(20,20,20,0.9)',
      borderColor: '#141414',
      textStyle: { color: '#fff', fontSize: 9, fontFamily: 'monospace' },
    },
    legend: {
      bottom: 0,
      data: allData.map(d => '第' + d.period + '期 (' + d.date.slice(5) + ')'),
      textStyle: { fontSize: 8, fontFamily: 'monospace' },
      itemWidth: 16, itemHeight: 8,
      selected: Object.fromEntries(allData.map(d => ['第' + d.period + '期 (' + d.date.slice(5) + ')', true])),
    },
    grid: { top: 30, bottom: 70, left: 55, right: 20 },
    xAxis: {
      type: 'value',
      name: '累积位移(mm)',
      nameLocation: 'middle',
      nameGap: 22,
      nameTextStyle: { fontSize: 9, fontFamily: 'monospace' },
      splitLine: { lineStyle: { type: 'dashed', opacity: 0.15 } },
    },
    yAxis: {
      type: 'value',
      name: '深度(m)',
      inverse: true,
      min: 0, max: 20,
      nameTextStyle: { fontSize: 9, fontFamily: 'monospace' },
      splitLine: { lineStyle: { type: 'dashed', opacity: 0.15 } },
    },
    series: allData.map((pd, idx) => ({
      name: '第' + pd.period + '期 (' + pd.date.slice(5) + ')',
      type: 'line',
      smooth: true,
      symbol: 'none',
      lineStyle: {
        color: COLORS[idx],
        width: pd.period === PERIODS ? 3 : 1.2,
        opacity: pd.period === PERIODS ? 1 : 0.5,
      },
      emphasis: { lineStyle: { width: 3, opacity: 1 } },
      data: pd.rows.map(r => [r.cumDisp, r.depth]),
    })),
  }), [allData]);

  const onChartClick = useCallback((params: any) => {
    if (params.seriesIndex !== undefined) {
      setSelectedPeriod(params.seriesIndex + 1);
    }
  }, []);

  // ===== Scoring =====
  const handleSubmit = () => {
    const correctQ4 = correctWarning.map(d => d.toFixed(1) + 'm').join('、');
    const scoreResult = calculateStepScore(dataAnalysisScoringConfig, [
      { questionId: 'data.analysis.maxDepth', answer: q1 },
      { questionId: 'data.analysis.accelStart', answer: q2 },
      { questionId: 'data.analysis.maxRecentZone', answer: q3 },
      { questionId: 'data.analysis.warningDepths', answer: q4 },
      { questionId: 'data.analysis.trend10', answer: q5 },
      { questionId: 'data.analysis.action', answer: q6 },
      { questionId: 'data.analysis.nextInterval', answer: q7 },
    ]);

    const getScore = (questionId: string) => scoreResult.answers.find(answer => answer.questionId === questionId)?.score ?? 0;
    const s1 = getScore('data.analysis.maxDepth');
    const s2 = getScore('data.analysis.accelStart');
    const s3 = getScore('data.analysis.maxRecentZone');
    const s4 = getScore('data.analysis.warningDepths');
    const s5 = getScore('data.analysis.trend10');
    const s6 = getScore('data.analysis.action');
    const s7 = getScore('data.analysis.nextInterval');

    onNext({
      ...scoreResult,
      legacyStepId: 'step12',
      stepName: '多期数据分析与预警判断',
      phases: {
        curveAnalysis: {
          answers: [
            { questionId: '3-3-1', label: '累计位移增长最大深度', userAnswer: q1, correctAnswer: '10m', score: s1, maxScore: 2 },
            { questionId: '3-3-2', label: '位移加速起始期次', userAnswer: q2, correctAnswer: '第7期', score: s2, maxScore: 3 },
            { questionId: '3-3-3', label: '近3期增量最大深度区段', userAnswer: q3, correctAnswer: '5~10m', score: s3, maxScore: 2 },
          ],
        },
        warningAssessment: {
          answers: [
            { questionId: '3-3-4', label: '超过预警值的深度', userAnswer: q4, correctAnswer: correctWarning.map(d => d.toFixed(1) + 'm').join('、'), score: s4, maxScore: 3 },
            { questionId: '3-3-5', label: '10.0m深度近3期趋势', userAnswer: q5, correctAnswer: '加速增大', score: s5, maxScore: 2 },
          ],
        },
        actionDecision: {
          answers: [
            { questionId: '3-3-6', label: '处理措施', userAnswer: q6, correctAnswer: CORRECT_Q6, score: s6, maxScore: 3 },
            { questionId: '3-3-7', label: '下期监测间隔建议', userAnswer: q7, correctAnswer: '缩短至3天', score: s7, maxScore: 2 },
          ],
        },
      },
    });
  };

  // ===== Render =====
  return (
    <div className="space-y-4">
      {/* Top: Chart + Data Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Left: ECharts */}
        <WireframePlaceholder label="多期深度-累积位移曲线图（8期叠加，ECharts 交互图表）" className="lg:col-span-3 min-h-[400px]">
        <div className="lg:col-span-3 bg-white border-2 border-industrial-fg shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] p-3">
          <div className="text-[10px] font-mono uppercase tracking-widest opacity-40 mb-1">多期深度-累积位移曲线</div>
          <ReactECharts option={chartOption} style={{ height: '420px' }} onEvents={{ click: onChartClick }} />
        </div>
        </WireframePlaceholder>

        {/* Right: Data panel */}
        <WireframePlaceholder label="孔数据分析面板（期次切换 + 41行数据表 + 点选标注预警行 + GB50497参考）" className="lg:col-span-2 min-h-[400px]">
        <div className="lg:col-span-2 bg-white border-2 border-industrial-fg shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-[10px] font-mono uppercase tracking-widest opacity-40">孔数据分析</div>
            <select className="border border-industrial-fg p-1 text-[10px] font-mono bg-white" value={selectedPeriod} onChange={e => setSelectedPeriod(Number(e.target.value))}>
              {allData.map(d => <option key={d.period} value={d.period}>{'第' + d.period + '期 (' + d.date + ')'}</option>)}
            </select>
          </div>
          <div className="text-[9px] font-mono opacity-50">{'控制值: ' + CONTROL_VALUE + 'mm | 70%预警阈值: ' + WARNING_THRESHOLD + 'mm'}</div>
          <div className="max-h-[360px] overflow-y-auto border border-industrial-fg/20">
            <table className="w-full text-[9px] font-mono border-collapse">
              <thead className="sticky top-0 bg-industrial-bg/40 z-10">
                <tr className="border-b border-industrial-fg">
                  <th className="p-1 text-left">深度</th>
                  <th className="p-1 text-left">累计位移</th>
                  <th className="p-1 text-left">本次变化</th>
                  <th className="p-1 text-left">速率</th>
                </tr>
              </thead>
              <tbody>
                {currentRows.map(r => (
                  <tr key={r.depth} className="border-b border-industrial-fg/5 hover:bg-industrial-bg/5">
                    <td className="p-1 font-bold">{r.depth.toFixed(1)}</td>
                    <td className="p-1">{r.cumDisp.toFixed(2)}</td>
                    <td className="p-1">{r.change.toFixed(2)}</td>
                    <td className="p-1">{r.rate.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        </WireframePlaceholder>
      </div>

      {/* Bottom: Questions (模式C 弹窗答题) */}
      <WireframePlaceholder label="曲线判读与预警交互区（7 题弹窗答题：最大深度/加速期次/区段/趋势/处理措施/间隔建议）" className="min-h-[200px]">
      <div className="bg-white border-2 border-industrial-fg shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] p-4 space-y-3">
        <div className="text-[10px] font-mono uppercase tracking-widest opacity-40">曲线判读与预警判断</div>

        <div className="space-y-1.5">
          {QUESTIONS.map(q => {
            const answered = isAnswered(q.id);
            return (
              <div key={q.id} className="flex items-center gap-2 text-[10px] font-mono min-w-0">
                <span className="opacity-40 font-bold w-6 flex-shrink-0">{String(q.num).padStart(2, '0')}</span>
                <TrainingQuestionButton
                  absolute={false}
                  completed={answered}
                  label={q.title}
                  className="min-w-0"
                  onClick={() => openQuestion(q.id)}
                />
              </div>
            );
          })}
        </div>
      </div>
      </WireframePlaceholder>

      {/* 模式C 答题浮层 */}
      <AnimatePresence>
        {activeQuestion && (() => {
          const q = QUESTIONS.find(x => x.id === activeQuestion);
          if (!q) return null;
          return (
            <Modal
              isOpen={true}
              onClose={() => setActiveQuestion(null)}
              title={q.title}
            >
              <div className="space-y-4">
                <p className="text-xs font-bold leading-relaxed">{q.prompt}</p>
                <div className="space-y-2">
                  {q.options.map((opt, idx) => {
                    const letter = String.fromCharCode(65 + idx);
                    const selected = pendingSingle === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setPendingSingle(opt.value)}
                        className={cn(
                          'w-full text-left p-3 text-[11px] border transition-all flex items-start gap-3',
                          selected
                            ? 'border-industrial-fg bg-industrial-fg text-white'
                            : 'border-industrial-fg/20 hover:border-industrial-fg'
                        )}
                      >
                        <span className="font-bold mt-0.5">{letter}.</span>
                        <span className="flex-1 leading-relaxed">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="flex justify-center pt-4 border-t border-industrial-fg/10">
                  <Button onClick={confirmQuestion} disabled={pendingSingle === ''} className="px-12">确认</Button>
                </div>
              </div>
            </Modal>
          );
        })()}
      </AnimatePresence>

    </div>
  );
};
