import React, { useState, useMemo, useEffect, useRef } from 'react';
import { cn } from '../../lib/utils';
import { motion } from 'motion/react';
import { CheckCircle2, LineChart } from 'lucide-react';
import { Button, Modal } from '../Common';
import { useWireframe } from '../WireframeContext';
import { WireframePlaceholder } from '../WireframeOverlay';
import { getPeriodRows, PERIOD_INTERVALS } from '../../data/monitoringData';

// ===== Preset data from 监测数据.md =====
const INTERVAL_DAYS = PERIOD_INTERVALS[7]; // 第8期间隔 = 7天

function getReportData() {
  return getPeriodRows(8);
}

function getPrevReportData() {
  return getPeriodRows(7);
}

// Fields student must fill: { depth, field } combos
// 2.0m -> change (本次变化量)
// 10.0m -> change + rate
// 18.0m -> rate
const FILL_FIELDS: { depth: number; field: 'change' | 'rate' }[] = [
  { depth: 2.0, field: 'change' },
  { depth: 10.0, field: 'change' },
  { depth: 10.0, field: 'rate' },
  { depth: 18.0, field: 'rate' },
];

const SHAPE_OPTIONS = [
  '开挖卸荷致中部土压力释放,墙体向坑内鼓出',
  '支撑刚度不足致顶部位移过大',
  '桩底嵌固不足致底部踢出',
  '地下水渗流致整体偏移',
];

const WARNING_OPTIONS = ['安全', '黄色预警', '橙色预警', '红色预警'];

const INSTRUMENT_OPTIONS = [
  { value: 'CX-03E', label: 'CX-03E型滑动式测斜仪' },
  { value: 'CX-01B', label: 'CX-01B型固定式测斜仪' },
  { value: 'SW-02A', label: 'SW-02A型静力水准仪' },
];

// ===== Component =====
export const ReportCompilation: React.FC<{ onNext: (data: any) => void }> = ({ onNext }) => {
  const { wireframeMode } = useWireframe();
  const [activeTab, setActiveTab] = useState<'current' | 'previous'>('current');

  // Header fields (scored)
  const [holeNo, setHoleNo] = useState('');
  const [periodNo, setPeriodNo] = useState('');
  const [instrumentModel, setInstrumentModel] = useState('');
  // Header fields (unscored, editable)
  const [instrumentSerial, setInstrumentSerial] = useState('');

  // Data table fills
  const [fills, setFills] = useState<Record<string, string>>({});
  const setFill = (key: string, val: string) => setFills(prev => ({ ...prev, [key]: val }));

  // Analysis
  const [shapeReason, setShapeReason] = useState('');
  const [warningLevel, setWarningLevel] = useState('');
  // Modal state for Mode C quizzes
  const [showShapeModal, setShowShapeModal] = useState(false);
  const [pendingShape, setPendingShape] = useState('');
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [pendingWarning, setPendingWarning] = useState('');

  const reportData = useMemo(() => getReportData(), []);
  const prevData = useMemo(() => getPrevReportData(), []);

  // Check all required fields filled
  const allFillsDone = FILL_FIELDS.every(f => {
    const key = f.depth + '-' + f.field;
    const v = fills[key];
    return v !== undefined && v.trim() !== '' && !isNaN(Number(v));
  });
  const canSubmit = holeNo.trim() !== '' && periodNo.trim() !== '' && instrumentModel !== '' && allFillsDone && shapeReason !== '' && warningLevel !== '';

  // 自动提交：当 canSubmit 变 true 后 600ms 内无进一步修改则提交（防抖）
  const [autoSubmitted, setAutoSubmitted] = useState(false);
  const submitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (submitTimerRef.current) clearTimeout(submitTimerRef.current);
    if (!canSubmit) return;
    submitTimerRef.current = setTimeout(() => {
      handleSubmit();
      setAutoSubmitted(true);
    }, 600);
    return () => { if (submitTimerRef.current) clearTimeout(submitTimerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canSubmit, holeNo, periodNo, instrumentModel, instrumentSerial, fills, shapeReason, warningLevel]);

  const handleSubmit = () => {
    // Scoring
    const s321 = (holeNo.trim() === 'CX-06' || holeNo.trim() === 'CX06' || holeNo.includes('06')) ? 1 : 0;
    const s322 = (periodNo.trim() === '8') ? 1 : 0;
    const s326 = instrumentModel === 'CX-03E' ? 1 : 0;

    // 正确答案来自真实数据：
    // 2.0m 变化量 = 2.20 - 1.85 = 0.35
    // 10.0m 变化量 = 36.00 - 27.20 = 8.80
    // 10.0m 速率 = 8.80 / 7 = 1.26
    // 18.0m 速率 = 0.15 / 7 ≈ 0.02

    // 3-2-12: 本次变化量 2.0m (correct: 0.35, tol ±0.05)
    const u_2_change = Number(fills['2-change'] || 0);
    const s3212 = Math.abs(u_2_change - 0.35) <= 0.05 ? 2 : 0;

    // 3-2-10: 本次变化量 10.0m (correct: 8.80, tol ±0.05)
    const u_10_change = Number(fills['10-change'] || 0);
    const s3210 = Math.abs(u_10_change - 8.80) <= 0.05 ? 2 : 0;

    // 3-2-13: 变化速率 10.0m - depends on 3-2-10 with error propagation
    const u_10_rate = Number(fills['10-rate'] || 0);
    const expectedRate10 = Number((u_10_change / INTERVAL_DAYS).toFixed(2));
    let s3213 = 0;
    if (Math.abs(u_10_rate - 1.26) <= 0.01) {
      s3213 = 2; // fully correct
    } else if (s3210 === 0 && Math.abs(u_10_rate - expectedRate10) <= 0.01) {
      s3213 = 1; // error propagation: process correct but starting value wrong
    }

    // 3-2-14: 变化速率 18.0m (correct: 0.02, tol ±0.01)
    const u_18_rate = Number(fills['18-rate'] || 0);
    const s3214 = Math.abs(u_18_rate - 0.02) <= 0.01 ? 2 : 0;

    // 3-2-16: 曲线形态成因
    const s3216 = shapeReason === SHAPE_OPTIONS[0] ? 3 : 0;

    // 3-2-18: 预警等级
    const s3218 = warningLevel === '黄色预警' ? 2 : 0;

    const totalScore = s321 + s322 + s326 + s3212 + s3210 + s3213 + s3214 + s3216 + s3218;

    onNext({
      stepId: 'step11',
      stepName: '监测日报表填写',
      submittedAt: new Date().toISOString(),
      totalScore,
      maxScore: 16,
      phases: {
        header: {
          answers: [
            { questionId: '3-2-1', label: '孔号', userAnswer: holeNo, correctAnswer: 'CX-06', score: s321, maxScore: 1 },
            { questionId: '3-2-2', label: '监测期数', userAnswer: periodNo, correctAnswer: '8', score: s322, maxScore: 1 },
            { questionId: '3-2-6', label: '仪器型号', userAnswer: instrumentModel, correctAnswer: 'CX-03E', score: s326, maxScore: 1 },
          ]
        },
        manualCalc: {
          answers: [
            { questionId: '3-2-12', label: '本次变化量-2.0m', userAnswer: u_2_change, correctAnswer: 0.35, tolerance: 0.05, score: s3212, maxScore: 2 },
            { questionId: '3-2-10', label: '本次变化量-10.0m', userAnswer: u_10_change, correctAnswer: 8.80, tolerance: 0.05, score: s3210, maxScore: 2 },
          ]
        },
        changeRate: {
          monitoringInterval: INTERVAL_DAYS,
          answers: [
            { questionId: '3-2-13', label: '变化速率-10.0m', userAnswer: u_10_rate, correctAnswer: 1.26, tolerance: 0.01, score: s3213, maxScore: 2 },
            { questionId: '3-2-14', label: '变化速率-18.0m', userAnswer: u_18_rate, correctAnswer: 0.02, tolerance: 0.01, score: s3214, maxScore: 2 },
          ]
        },
        analysis: {
          briefAnalysis: [{ questionId: '3-2-16', label: '曲线形态成因', userAnswer: shapeReason, correctAnswer: SHAPE_OPTIONS[0], score: s3216, maxScore: 3 }],
          conclusion: [{ questionId: '3-2-18', label: '预警等级', userAnswer: warningLevel, correctAnswer: '黄色预警', score: s3218, maxScore: 2 }],
        }
      }
    });
  };

  // ===== Render helpers =====
  const isFillField = (depth: number, field: 'change' | 'rate') => FILL_FIELDS.some(f => f.depth === depth && f.field === field);
  const fillKey = (depth: number, field: string) => depth + '-' + field;

  const renderDataTable = (data: typeof reportData, editable: boolean) => (
    <div className="max-h-[350px] overflow-y-auto border border-industrial-fg/20">
      <table className="w-full text-[10px] font-mono border-collapse">
        <thead className="sticky top-0 bg-industrial-bg/40 z-10">
          <tr className="border-b border-industrial-fg">
            <th className="p-1.5 text-left border-r border-industrial-fg/20">深度(m)</th>
            <th className="p-1.5 text-left border-r border-industrial-fg/20">累计位移(mm)</th>
            <th className="p-1.5 text-left border-r border-industrial-fg/20">本次变化量(mm)</th>
            <th className="p-1.5 text-left">变化速率(mm/d)</th>
          </tr>
        </thead>
        <tbody>
          {data.map(r => {
            const isKey = [2.0, 10.0, 18.0].includes(r.depth);
            const changeFill = editable && isFillField(r.depth, 'change');
            const rateFill = editable && isFillField(r.depth, 'rate');
            return (
              <tr key={r.depth} className={cn('border-b border-industrial-fg/5', isKey ? 'bg-blue-50/50' : '')}>
                <td className="p-1.5 border-r border-industrial-fg/10 font-bold">{r.depth.toFixed(1)}</td>
                <td className="p-1.5 border-r border-industrial-fg/10">{r.cumDisp.toFixed(2)}</td>
                <td className="p-1.5 border-r border-industrial-fg/10">
                  {changeFill ? (
                    <input type="text" placeholder="填写" className="border-2 border-amber-400 bg-amber-50 px-1 py-0.5 w-20 text-center font-bold focus:outline-none focus:border-industrial-fg" value={fills[fillKey(r.depth, 'change')] || ''} onChange={e => setFill(fillKey(r.depth, 'change'), e.target.value)} />
                  ) : r.change.toFixed(2)}
                </td>
                <td className="p-1.5">
                  {rateFill ? (
                    <input type="text" placeholder="填写" className="border-2 border-amber-400 bg-amber-50 px-1 py-0.5 w-20 text-center font-bold focus:outline-none focus:border-industrial-fg" value={fills[fillKey(r.depth, 'rate')] || ''} onChange={e => setFill(fillKey(r.depth, 'rate'), e.target.value)} />
                  ) : r.rate.toFixed(2)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const renderCurve = (data: typeof reportData) => {
    const maxDisp = Math.max(...data.map(r => Math.abs(r.cumDisp)));
    const w = 200, h = 400, pad = 30;
    const points = data.map(r => {
      const x = pad + (r.cumDisp / maxDisp) * (w - 2 * pad);
      const y = pad + (r.depth / 20) * (h - 2 * pad);
      return x + ',' + y;
    }).join(' ');
    return (
      <svg viewBox={'0 0 ' + w + ' ' + h} className="w-full h-[300px]">
        <line x1={pad} y1={pad} x2={pad} y2={h - pad} stroke="#141414" strokeWidth="1" opacity="0.3" />
        <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke="#141414" strokeWidth="1" opacity="0.3" />
        <text x={w / 2} y={h - 5} textAnchor="middle" fontSize="8" fill="#141414" opacity="0.5">累计位移(mm)</text>
        <text x="5" y={h / 2} textAnchor="middle" fontSize="8" fill="#141414" opacity="0.5" transform={'rotate(-90,5,' + (h / 2) + ')'}>深度(m)</text>
        <polyline points={points} fill="none" stroke="#141414" strokeWidth="2" />
        {[2.0, 10.0, 18.0].map(d => {
          const r = data.find(row => row.depth === d);
          if (!r) return null;
          const x = pad + (r.cumDisp / maxDisp) * (w - 2 * pad);
          const y = pad + (r.depth / 20) * (h - 2 * pad);
          return <circle key={d} cx={x} cy={y} r="3" fill="#ef4444" />;
        })}
      </svg>
    );
  };

  // ===== Main render =====
  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex border-b-2 border-industrial-fg">
        {(['current', 'previous'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={cn('px-6 py-2 text-xs font-bold uppercase tracking-widest transition-colors border-b-2 -mb-[2px]', activeTab === tab ? 'border-industrial-fg bg-white' : 'border-transparent bg-industrial-bg/20 opacity-60 hover:opacity-80')}>
            {tab === 'current' ? '本期日报表（第8期）' : '上期日报表（第7期）'}
          </button>
        ))}
      </div>

      {activeTab === 'previous' ? (
        /* ===== Previous Report (Read-only) ===== */
        <WireframePlaceholder label="上期日报表（第7期，只读参照：报表头 + 数据表 + 深度-位移曲线 + 分析小结）" className="min-h-[300px]">
        <div className="bg-white border-2 border-industrial-fg shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] p-4 space-y-4">
          <div className="text-[9px] font-mono opacity-40 uppercase text-center">第7期日报表 — 只读参照</div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-3 gap-y-1 text-[10px] font-mono border border-industrial-fg/20 px-3 py-2">
            <div><span className="opacity-50">工程名称:</span> <span className="font-bold">XX</span></div>
            <div><span className="opacity-50">报表编号:</span> <span className="font-bold">JC-2026-007</span></div>
            <div><span className="opacity-50">孔号:</span> <span className="font-bold">XXX</span></div>
            <div><span className="opacity-50">第（）次:</span> <span className="font-bold">XXX</span></div>
            <div><span className="opacity-50">天气:</span> 晴</div>
            <div><span className="opacity-50">仪器型号:</span> <span className="font-bold">XXX</span></div>
            <div><span className="opacity-50">仪器编号:</span> XXX</div>
            <div><span className="opacity-50">检定有效期:</span> 2027-01-15</div>
            <div><span className="opacity-50">本次监测:</span> 2026-03-27</div>
            <div><span className="opacity-50">上次监测:</span> 2026-03-20</div>
            <div><span className="opacity-50">观测者:</span> 张三</div>
            <div><span className="opacity-50">校核者:</span> 张三</div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-3">{renderDataTable(prevData, false)}</div>
            <div className="lg:col-span-2 border border-industrial-fg/20 p-2">{renderCurve(prevData)}</div>
          </div>
          <div className="border border-industrial-fg/20 p-3 text-[10px] font-mono space-y-2">
            <div><span className="opacity-50">工况描述:</span> 第一层土方开挖至-6m，第一道支撑已施加</div>
            <div><span className="opacity-50">曲线形态成因:</span> <span className="font-bold">开挖卸荷致中部土压力释放,墙体向坑内鼓出</span></div>
            <div><span className="opacity-50">预警等级:</span> <span className="font-bold text-green-600">安全</span></div>
          </div>
        </div>
        </WireframePlaceholder>
      ) : (
        /* ===== Current Report (Editable) ===== */
        <WireframePlaceholder label="本期日报表（第8期，可编辑：报表头填写 + 数据表填写 + 曲线图 + 形态成因单选 + 预警等级单选）" className="min-h-[300px]">
        <div className="bg-white border-2 border-industrial-fg shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] p-4 space-y-4">
          {/* Header */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 gap-y-1 text-[10px] border border-industrial-fg/20 px-3 py-2">
            <div><span className="opacity-50 block text-[9px]">工程名称</span><span className="font-bold">XX</span></div>
            <div><span className="opacity-50 block text-[9px]">报表编号</span><span className="font-bold">JC-2026-008</span></div>
            <div>
              <span className="opacity-50 block text-[9px]">孔号 *</span>
              <input type="text" placeholder="CX-??" className="border border-industrial-fg px-2 py-0.5 w-full font-bold bg-yellow-50 focus:outline-none" value={holeNo} onChange={e => setHoleNo(e.target.value)} />
            </div>
            <div>
              <span className="opacity-50 block text-[9px]">第（）次 *</span>
              <input type="text" placeholder="?" className="border border-industrial-fg px-2 py-0.5 w-full font-bold bg-yellow-50 focus:outline-none" value={periodNo} onChange={e => setPeriodNo(e.target.value)} />
            </div>
            <div><span className="opacity-50 block text-[9px]">天气</span>晴</div>
            <div><span className="opacity-50 block text-[9px]">观测者/计算者/校核者</span>张三</div>
            <div>
              <span className="opacity-50 block text-[9px]">仪器型号 *</span>
              <select className="border border-industrial-fg px-1 py-0.5 w-full text-[10px] bg-yellow-50 font-bold focus:outline-none" value={instrumentModel} onChange={e => setInstrumentModel(e.target.value)}>
                <option value="">选择...</option>
                {INSTRUMENT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <span className="opacity-50 block text-[9px]">仪器编号</span>
              <input type="text" placeholder="从说明书获取" className="border border-industrial-fg/50 px-2 py-0.5 w-full focus:outline-none" value={instrumentSerial} onChange={e => setInstrumentSerial(e.target.value)} />
            </div>
            <div><span className="opacity-50 block text-[9px]">检定有效期</span>2027-01-15</div>
            <div><span className="opacity-50 block text-[9px]">本次监测时间</span>2026-04-03</div>
            <div><span className="opacity-50 block text-[9px]">上次监测时间</span>2026-03-27</div>
          </div>

          {/* Data table + curve */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-3">
              {renderDataTable(reportData, true)}
            </div>
            <div className="lg:col-span-2 border border-industrial-fg/20 p-2">
              <div className="text-[9px] font-mono opacity-40 uppercase text-center mb-1">
                <LineChart size={10} className="inline mr-1" />第8期 深度-位移曲线
              </div>
              {renderCurve(reportData)}
            </div>
          </div>

          {/* Analysis — hotspot triggers for Mode C modals */}
          <div className="border border-industrial-fg/20 p-3 space-y-2">
            <div className="text-[10px] font-mono">
              <span className="opacity-50">工况描述:</span> 第二层土方开挖至-12m，第二道支撑已施加
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono">
              <span className="opacity-50">曲线形态成因:</span>
              {shapeReason ? (
                <button onClick={() => { setPendingShape(shapeReason); setShowShapeModal(true); }} className="flex items-center gap-1">
                  <span className="w-5 h-5 bg-green-600 text-white flex items-center justify-center text-[9px] font-bold flex-shrink-0">[v]</span>
                  <span className="font-bold text-[10px]">{shapeReason}</span>
                </button>
              ) : (
                <button onClick={() => { setPendingShape(''); setShowShapeModal(true); }} className="w-5 h-5 bg-industrial-fg text-white flex items-center justify-center text-[9px] font-bold animate-pulse flex-shrink-0">[?]</button>
              )}
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono">
              <span className="opacity-50">预警等级:</span>
              {warningLevel ? (
                <button onClick={() => { setPendingWarning(warningLevel); setShowWarningModal(true); }} className="flex items-center gap-1">
                  <span className="w-5 h-5 bg-green-600 text-white flex items-center justify-center text-[9px] font-bold flex-shrink-0">[v]</span>
                  <span className="font-bold text-[10px]">{warningLevel}</span>
                </button>
              ) : (
                <button onClick={() => { setPendingWarning(''); setShowWarningModal(true); }} className="w-5 h-5 bg-industrial-fg text-white flex items-center justify-center text-[9px] font-bold animate-pulse flex-shrink-0">[?]</button>
              )}
            </div>
          </div>

          {/* Signature (readonly) */}
          <div className="border border-industrial-fg/20 p-2 text-[10px] font-mono grid grid-cols-2 gap-4 opacity-50">
            <div>工程负责人: XXX</div>
            <div>监测单位: XXX</div>
          </div>
        </div>
        </WireframePlaceholder>
      )}

      {/* Auto-submit status indicator — 仅在填写完整后显示 */}
      {activeTab === 'current' && canSubmit && (
        <div className="flex justify-end pt-2">
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 border border-green-300 px-4 py-2 text-[10px] text-green-800 font-mono flex items-center gap-2"
          >
            <CheckCircle2 size={14} className="text-green-600" />
            {autoSubmitted
              ? '已自动保存答案，可点击侧栏「多期数据分析与预警判断」继续。'
              : '全部填写完成，正在自动保存...'}
          </motion.div>
        </div>
      )}

      {/* 模式 C — 曲线形态成因 */}
      <Modal isOpen={showShapeModal} onClose={() => setShowShapeModal(false)} title="曲线形态成因">
        <div className="space-y-4">
          <p className="text-xs font-bold">请根据位移曲线特征，判断其形态成因。</p>
          <div className="space-y-2">
            {SHAPE_OPTIONS.map((opt, i) => (
              <button
                key={opt}
                onClick={() => setPendingShape(opt)}
                className={cn(
                  "w-full text-left px-4 py-2.5 border-2 text-xs transition-colors",
                  pendingShape === opt
                    ? "bg-industrial-fg text-industrial-bg border-industrial-fg"
                    : "border-industrial-fg/20 hover:border-industrial-fg/40"
                )}
              >
                {String.fromCharCode(65 + i)}. {opt}
              </button>
            ))}
          </div>
          <div className="flex justify-center pt-4 border-t border-industrial-fg/10">
            <Button onClick={() => { setShapeReason(pendingShape); setShowShapeModal(false); }} disabled={!pendingShape} className="px-12">确认</Button>
          </div>
        </div>
      </Modal>

      {/* 模式 C — 预警等级 */}
      <Modal isOpen={showWarningModal} onClose={() => setShowWarningModal(false)} title="预警等级">
        <div className="space-y-4">
          <p className="text-xs font-bold">请根据位移变化速率与累计量，判断预警等级。</p>
          <div className="space-y-2">
            {WARNING_OPTIONS.map((opt, i) => (
              <button
                key={opt}
                onClick={() => setPendingWarning(opt)}
                className={cn(
                  "w-full text-left px-4 py-2.5 border-2 text-xs transition-colors",
                  pendingWarning === opt
                    ? "bg-industrial-fg text-industrial-bg border-industrial-fg"
                    : "border-industrial-fg/20 hover:border-industrial-fg/40"
                )}
              >
                {String.fromCharCode(65 + i)}. {opt}
              </button>
            ))}
          </div>
          <div className="flex justify-center pt-4 border-t border-industrial-fg/10">
            <Button onClick={() => { setWarningLevel(pendingWarning); setShowWarningModal(false); }} disabled={!pendingWarning} className="px-12">确认</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
