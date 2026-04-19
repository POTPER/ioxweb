import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ReactECharts from 'echarts-for-react';
import { cn } from '../../lib/utils';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useWireframe } from '../WireframeContext';
import { WireframePlaceholder } from '../WireframeOverlay';
import { Modal, Button } from '../Common';
import { CUM_DISP, DEPTHS, PERIOD_DATES as REAL_DATES, PERIOD_INTERVALS, MONITORING } from '../../data/monitoringData';

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

// ===== Questions definition =====
const Q1_OPTIONS = ['8m', '10m', '12m', '14m'];
const Q2_OPTIONS = ['第5期', '第6期', '第7期', '第8期'];
const Q3_OPTIONS = ['0~5m', '5~10m', '10~15m', '15~20m'];
const Q4_OPTIONS = ['9.0m\u30019.5m\u300110.0m\u300110.5m', '9.0m\u30019.5m\u300110.0m', '9.5m\u300110.0m\u300110.5m', '10.0m\u300110.5m\u300111.0m'];
const Q5_OPTIONS = ['加速增大', '匀速增大', '趋于收敛', '波动变化'];
const Q6_OPTIONS = ['加密监测频次并通知设计单位复核', '维持现有频次，继续观察', '暂停施工，启动应急预案', '降低监测频次，节约成本'];
const Q7_OPTIONS = ['缩短至3天', '维持7天', '延长至14天', '延长至30天'];

const CORRECT_Q6 = '加密监测频次并通知设计单位复核';

// 模式C 问题元数据：编号 + 标题 + 题干 + 选项 + 单/多选
const QUESTIONS = [
  { id: 'q1', num: 1, title: '累计位移增长最大的深度', prompt: '观察多期曲线，判断累计位移增长幅度最大的深度。', options: Q1_OPTIONS, multi: false },
  { id: 'q2', num: 2, title: '位移加速起始期次', prompt: '哪一期开始出现明显位移加速（曲线斜率明显增大）？', options: Q2_OPTIONS, multi: false },
  { id: 'q3', num: 3, title: '近 3 期增量最大深度区段', prompt: '对比第 6/7/8 期，位移增量最大的深度区段是？', options: Q3_OPTIONS, multi: false },
  { id: 'q4', num: 4, title: '超过预警值的深度', prompt: '第 8 期中，哪些深度的累计位移超过黄色预警值 (35mm)？', options: Q4_OPTIONS, multi: false },
  { id: 'q5', num: 5, title: '10.0m 近 3 期发展趋势', prompt: '10.0m 深度处近 3 期累计位移趋势判定：', options: Q5_OPTIONS, multi: false },
  { id: 'q6', num: 6, title: '应采取的处理措施', prompt: '结合预警等级和趋势，判断应采取的措施：', options: Q6_OPTIONS, multi: false },
  { id: 'q7', num: 7, title: '下期监测间隔建议', prompt: '参照 GB50497，下一期监测间隔应：', options: Q7_OPTIONS, multi: false },
] as const;

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

  const renderAnswerSummary = (id: string): string => getAnswer(id);

  // 自动提交：全部填写完成后 600ms 内无修改则提交（防抖）
  const [autoSubmitted, setAutoSubmitted] = useState(false);
  const submitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (submitTimerRef.current) clearTimeout(submitTimerRef.current);
    if (!allAnswered) return;
    submitTimerRef.current = setTimeout(() => {
      handleSubmit();
      setAutoSubmitted(true);
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
    const s1 = q1 === '10m' ? 2 : 0;
    const s2 = q2 === '第7期' ? 3 : 0;
    const s3 = q3 === '5~10m' ? 2 : 0;

    // Q4: exact match on warning depths
    const correctQ4 = correctWarning.map(d => d.toFixed(1) + 'm').join('、');
    const s4 = q4 === correctQ4 ? 3 : 0;

    const s5 = q5 === '加速增大' ? 2 : 0;

    // Q6: single-choice exact match
    const s6 = q6 === CORRECT_Q6 ? 3 : 0;

    const s7 = q7 === '缩短至3天' ? 2 : 0;

    const totalScore = s1 + s2 + s3 + s4 + s5 + s6 + s7;

    onNext({
      stepId: 'step12',
      stepName: '多期数据分析与预警判断',
      submittedAt: new Date().toISOString(),
      totalScore,
      maxScore: 17,
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
      <WireframePlaceholder label="曲线判读与预警交互区（6 题弹窗答题：最大深度/加速期次/区段/趋势/处理措施多选/间隔建议）" className="min-h-[200px]">
      <div className="bg-white border-2 border-industrial-fg shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] p-4 space-y-3">
        <div className="text-[10px] font-mono uppercase tracking-widest opacity-40">曲线判读与预警判断</div>

        <div className="space-y-1.5">
          {QUESTIONS.map(q => {
            const answered = isAnswered(q.id);
            const summary = renderAnswerSummary(q.id);
            return (
              <div key={q.id} className="flex items-center gap-2 text-[10px] font-mono">
                <span className="opacity-40 font-bold w-6 flex-shrink-0">{'Q' + q.num}</span>
                <span className="opacity-50 min-w-0 truncate">{q.title}</span>
                {answered ? (
                  <button onClick={() => openQuestion(q.id)} className="flex items-center gap-1 ml-auto flex-shrink-0">
                    <span className="w-5 h-5 bg-green-600 text-white flex items-center justify-center text-[9px] font-bold flex-shrink-0">[✓]</span>
                    <span className="font-bold text-[10px] truncate max-w-[180px]">{summary}</span>
                  </button>
                ) : (
                  <button onClick={() => openQuestion(q.id)} className="ml-auto w-5 h-5 bg-industrial-fg text-white flex items-center justify-center text-[9px] font-bold animate-pulse flex-shrink-0">[?]</button>
                )}
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
              title={'Q' + q.num + '·' + q.title}
            >
              <div className="space-y-4">
                <p className="text-xs font-bold leading-relaxed">{q.prompt}</p>
                <div className="space-y-2">
                  {q.options.map((opt, idx) => {
                    const letter = String.fromCharCode(65 + idx);
                    const selected = pendingSingle === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setPendingSingle(opt)}
                        className={cn(
                          'w-full text-left p-3 text-[11px] border transition-all flex items-start gap-3',
                          selected
                            ? 'border-industrial-fg bg-industrial-fg text-white'
                            : 'border-industrial-fg/20 hover:border-industrial-fg'
                        )}
                      >
                        <span className="font-bold mt-0.5">{letter}.</span>
                        <span className="flex-1 leading-relaxed">{opt}</span>
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

      {/* Auto-save status indicator — 仅在全部答完后显示 */}
      {allAnswered && (
        <div className="flex justify-end pt-2">
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 border border-green-300 px-4 py-2 text-[10px] text-green-800 font-mono flex items-center gap-2"
          >
            <CheckCircle2 size={14} className="text-green-600" />
            {autoSubmitted
              ? '已自动保存答案，点击左侧「提交」按钮完成本次实操。'
              : '全部填写完成，正在自动保存...'}
          </motion.div>
        </div>
      )}
    </div>
  );
};
