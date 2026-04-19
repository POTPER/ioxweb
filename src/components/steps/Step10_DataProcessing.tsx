import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button, Modal } from '../Common';
import { cn } from '../../lib/utils';
import { motion } from 'motion/react';
import { Link, Unlink, Battery, Zap, CheckCircle2, AlertTriangle, Loader2, Monitor } from 'lucide-react';
import { useWireframe } from '../WireframeContext';
import { WireframePlaceholder } from '../WireframeOverlay';
import { CUM_DISP, PERIOD_DATES as REAL_DATES, DEPTHS } from '../../data/monitoringData';

// --- Data Generation ---
const AREA_HOLES: Record<string, number> = { '01': 5, '02': 6, '03': 8 };
const PERIODS = 8;
const DEPTH_POINTS = 41;
const PERIOD_DATES = REAL_DATES;

interface DepthRow {
  depth: number;
  forward: number;
  reverse: number;
  checksum: number;
}

const MISSING_DEPTHS = [10.0, 14.0];

function generatePeriodData(period: number): DepthRow[] {
  const rows: DepthRow[] = [];
  for (let i = 0; i <= 40; i++) {
    const d = Number((i * 0.5).toFixed(1));
    const base = Math.sin((d / 20) * Math.PI) * (30 + period * 4);
    const noise = ((d * 7 + period * 13) % 5 - 2) * 0.3;
    const fwd = Number((base + noise).toFixed(2));
    const rev = Number((-base + noise * 0.5 + ((d * 3 + period * 7) % 3 - 1) * 0.08).toFixed(2));
    const chk = Number((fwd + rev).toFixed(2));
    rows.push({ depth: d, forward: fwd, reverse: rev, checksum: chk });
  }
  return rows;
}

function buildAllData() {
  const periods: { period: number; date: string; rows: DepthRow[] }[] = [];
  for (let p = 1; p <= PERIODS; p++) {
    periods.push({ period: p, date: PERIOD_DATES[p - 1], rows: generatePeriodData(p) });
  }
  return periods;
}

export const DataProcessing: React.FC<{ onNext: (data: any) => void }> = ({ onNext }) => {
  const { wireframeMode } = useWireframe();
  const [isConnected, setIsConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [selectedArea, setSelectedArea] = useState('');
  const [selectedHole, setSelectedHole] = useState('');

  const allData = useRef(buildAllData());
  const [exported, setExported] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  const [analyzed, setAnalyzed] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [cumulativeDisp, setCumulativeDisp] = useState<Record<number, number | null>>({});
  const [userFills, setUserFills] = useState<Record<number, string>>({});


  const opLog = useRef<{ action: string; value?: string; timestamp: string }[]>([]);
  const logOp = useCallback((action: string, value?: string) => {
    opLog.current.push({ action, value, timestamp: new Date().toISOString() });
  }, []);

  const firstActions = useRef<string[]>([]);
  const trackFirst = useCallback((action: string) => {
    if (!firstActions.current.includes(action)) firstActions.current.push(action);
  }, []);

  const handleConnect = () => {
    if (connecting) return;
    setConnecting(true);
    logOp('connect');
    trackFirst('connect');
    setTimeout(() => { setConnecting(false); setIsConnected(true); }, 1500);
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    logOp('disconnect');
  };

  const handleAreaChange = (val: string) => {
    setSelectedArea(val);
    setSelectedHole('');
    setExported(false);
    setAnalyzed(false);
    setCumulativeDisp({});
    setUserFills({});
    if (val) { logOp('selectArea', val); trackFirst('selectArea'); }
  };

  const handleHoleChange = (val: string) => {
    setSelectedHole(val);
    setExported(false);
    setAnalyzed(false);
    setCumulativeDisp({});
    setUserFills({});
    if (val) { logOp('selectHole', val); trackFirst('selectHole'); }
  };

  const handleExport = () => {
    if (exporting) return;
    // 允许重复导出：重置提交状态以便后续 useEffect 重新触发 handleSubmit
    hasSubmittedRef.current = false;
    setExported(false);
    setExporting(true);
    logOp('export');
    setTimeout(() => { setExporting(false); setExported(true); setShowExportModal(true); }, 1500);
  };

  const handleAnalyze = () => {
    if (analyzing) return;
    // 允许重复点击：清空填写内容 + 重置导出/提交状态
    setUserFills({});
    setExported(false);
    hasSubmittedRef.current = false;
    setAnalyzing(true);
    logOp('analyze');
    setTimeout(() => {
      const realP8 = CUM_DISP[PERIODS - 1];
      const disp: Record<number, number | null> = {};
      DEPTHS.forEach((d, i) => {
        if (MISSING_DEPTHS.includes(d)) {
          disp[d] = null;
        } else {
          disp[d] = realP8[i];
        }
      });
      setCumulativeDisp(disp);
      setAnalyzing(false);
      setAnalyzed(true);
    }, 2000);
  };

  const dataLoaded = selectedArea !== '' && selectedHole !== '';
  const latestRows = dataLoaded ? allData.current[PERIODS - 1].rows : [];
  const holeCount = selectedArea ? (AREA_HOLES[selectedArea] || 0) : 0;
  const holeOptions = Array.from({ length: holeCount }, (_, i) => i + 1);
  const totalRecords = selectedHole ? DEPTH_POINTS : 0;
  const missingFilled = MISSING_DEPTHS.every(d => userFills[d] !== undefined && userFills[d].trim() !== '' && !isNaN(Number(userFills[d])));
  const canExport = analyzed && missingFilled;

  // Auto-submit once exported (可重复触发)
  const hasSubmittedRef = useRef(false);
  useEffect(() => {
    if (exported && !hasSubmittedRef.current) {
      hasSubmittedRef.current = true;
      handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exported]);

  const handleSubmit = () => {
    const fa = firstActions.current;
    const connectIdx = fa.indexOf('connect');
    const areaIdx = fa.indexOf('selectArea');
    const holeIdx = fa.indexOf('selectHole');

    const connectFirst = connectIdx !== -1 && (areaIdx === -1 || connectIdx < areaIdx) && (holeIdx === -1 || connectIdx < holeIdx);
    const score311 = connectFirst ? 1 : 0;

    const areaBeforeHole = areaIdx !== -1 && (holeIdx === -1 || areaIdx < holeIdx);
    const score312 = areaBeforeHole ? 1 : 0;

    let correctCount = 0;
    const realP8 = CUM_DISP[PERIODS - 1];
    MISSING_DEPTHS.forEach(d => {
      const idx = DEPTHS.indexOf(d);
      if (idx !== -1) {
        const correct = realP8[idx];
        const userVal = Number(Number(userFills[d]).toFixed(2));
        if (Math.abs(userVal - correct) <= 0.05) correctCount++;
      }
    });
    const score313 = correctCount;
    const totalScore = score311 + score312 + score313;

    onNext({
      stepId: 'step10',
      stepName: '数据导入与预处理',
      submittedAt: new Date().toISOString(),
      operationLog: opLog.current,
      scoring: {
        '3-1-1': { label: '操作顺序：连接优先', connectBeforeSelect: connectFirst, score: score311, maxScore: 1 },
        '3-1-2': { label: '操作顺序：先选区再选孔', areaBeforeHole, score: score312, maxScore: 1 },
        '3-1-3': {
          label: '累计位移验算',
          items: MISSING_DEPTHS.map(d => {
            const idx = DEPTHS.indexOf(d);
            const correct = realP8[idx];
            return { depth: d + 'm', userAnswer: Number(userFills[d]), correctAnswer: correct, tolerance: 0.05, correct: Math.abs(Number(userFills[d]) - correct) <= 0.05 };
          }),
          score: score313, maxScore: 2
        }
      },
      totalScore,
      maxScore: 4,
      exportedData: {
        period: PERIODS,
        records: DEPTH_POINTS,
        displacementFilled: Object.fromEntries(MISSING_DEPTHS.map(d => [d + 'm', Number(userFills[d])]))
      },
      supplementedData: {
        note: '系统后台自动补全其余期次数据，供步骤3使用',
        allPeriods: Array.from({ length: PERIODS }, (_, i) => i + 1),
        totalRecords: PERIODS * DEPTH_POINTS,
      },
      allPeriodsData: allData.current,
    });
  };

  return (
    <div className="space-y-4">
      <WireframePlaceholder label="测斜数据处理软件（PC 端模拟）— 统一卡片内完成：设备连接 → 数据选型 → 分析 → 导出" className="min-h-[400px]">
      <div className="bg-white border-2 border-industrial-fg shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] overflow-hidden">
        {/* App title bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-industrial-fg text-industrial-bg border-b-2 border-industrial-fg">
          <div className="flex items-center gap-2">
            <Monitor size={14} />
            <span className="text-[11px] font-mono font-bold uppercase tracking-widest">CX-Reader Studio v3.2</span>
          </div>
        </div>

        {/* Panel body */}
        <div className="p-4 space-y-4">
          {/* Toolbar row: 设备信息 + 测区 + 孔号 一行排列 */}
          <div className="border border-industrial-fg/20 p-2 flex flex-wrap items-end gap-x-4 gap-y-2 bg-industrial-bg/5">
            {/* 设备信息 */}
            <div className="flex items-center gap-3 text-[10px] font-mono pr-4 border-r border-industrial-fg/10">
              <div><span className="opacity-50">设备ID:</span> <span className="font-bold">YQ02125072</span></div>
              <div className="flex items-center gap-1"><Zap size={10} className="opacity-50" /><span>12.6V</span></div>
              <div className="flex items-center gap-1"><Battery size={10} className="opacity-50" /><span>82%</span></div>
              <Button
                variant={isConnected ? 'secondary' : 'primary'}
                className="text-[10px] h-7 px-3"
                onClick={isConnected ? handleDisconnect : handleConnect}
                disabled={connecting}
              >
                {connecting ? (
                  <span className="flex items-center"><Loader2 size={12} className="animate-spin mr-1" />连接中...</span>
                ) : isConnected ? (
                  <span className="flex items-center"><Unlink size={12} className="mr-1" />断开</span>
                ) : (
                  <span className="flex items-center"><Link size={12} className="mr-1" />连接</span>
                )}
              </Button>
            </div>

            {/* 测区 */}
            <div className="flex flex-col">
              <label className="text-[9px] font-bold uppercase opacity-50 mb-0.5">测区</label>
              <select className="border border-industrial-fg p-1 text-xs bg-white h-7" value={selectedArea} onChange={e => handleAreaChange(e.target.value)}>
                <option value="">选择...</option>
                <option value="01">01区</option>
                <option value="02">02区</option>
                <option value="03">03区</option>
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-[9px] font-bold uppercase opacity-50 mb-0.5">区内孔个数</label>
              <div className="border border-industrial-fg/30 px-2 text-xs bg-industrial-bg/10 font-mono h-7 flex items-center min-w-[48px]">{holeCount || '--'}</div>
            </div>
            {/* 孔号 */}
            <div className="flex flex-col">
              <label className="text-[9px] font-bold uppercase opacity-50 mb-0.5">孔号</label>
              <select className="border border-industrial-fg p-1 text-xs bg-white h-7" value={selectedHole} onChange={e => handleHoleChange(e.target.value)}>
                <option value="">选择...</option>
                {holeOptions.map(h => <option key={h} value={String(h)}>{'孔' + h}</option>)}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-[9px] font-bold uppercase opacity-50 mb-0.5">记录总条数</label>
              <div className="border border-industrial-fg/30 px-2 text-xs bg-industrial-bg/10 font-mono h-7 flex items-center min-w-[48px]">{totalRecords || '--'}</div>
            </div>
          </div>

          {/* Data table area — 始终显示，无数据时呈现空表 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-mono uppercase tracking-widest opacity-40">
                {dataLoaded ? ('第' + PERIODS + '期数据 · ' + PERIOD_DATES[PERIODS - 1] + ' · 共 ' + DEPTH_POINTS + ' 行') : '请先选择测区 + 孔号'}
              </div>
              {analyzed && (
                <div className="flex items-center gap-2 text-[10px]">
                  <AlertTriangle size={12} className="text-amber-500" />
                  <span className="text-amber-700 font-bold">{'有' + MISSING_DEPTHS.length + '处深度点累计位移计算遗漏，请手动补充'}</span>
                </div>
              )}
            </div>
            <div className="max-h-[400px] overflow-y-auto border border-industrial-fg/20">
            <table className="w-full text-[10px] font-mono border-collapse">
              <thead className="sticky top-0 bg-industrial-bg/30"><tr className="border-b border-industrial-fg">
                <th className="p-1.5 text-left">深度(m)</th>
                <th className="p-1.5 text-left">正测(mm)</th>
                <th className="p-1.5 text-left">反测(mm)</th>
                <th className="p-1.5 text-left">校验和(mm)</th>
                {analyzed && <th className="p-1.5 text-left">累计位移(mm)</th>}
              </tr></thead>
              <tbody>
                {dataLoaded ? latestRows.map(r => {
                  const isMissing = MISSING_DEPTHS.includes(r.depth);
                  return (
                    <tr key={r.depth} className={cn('border-b border-industrial-fg/5', analyzed && isMissing ? 'bg-amber-50' : '')}>
                      <td className="p-1.5">{r.depth.toFixed(1)}</td>
                      <td className={cn('p-1.5', analyzed && isMissing ? 'font-bold text-blue-700' : '')}>{r.forward.toFixed(2)}</td>
                      <td className={cn('p-1.5', analyzed && isMissing ? 'font-bold text-blue-700' : '')}>{r.reverse.toFixed(2)}</td>
                      <td className="p-1.5">{r.checksum.toFixed(2)}</td>
                      {analyzed && (
                        <td className="p-1.5">
                          {isMissing ? (
                            <input
                              type="text"
                              placeholder="请填写"
                              className="border-2 border-amber-400 bg-amber-50 px-2 py-0.5 w-24 text-center font-bold focus:outline-none focus:border-industrial-fg"
                              value={userFills[r.depth] || ''}
                              onChange={e => setUserFills(prev => ({ ...prev, [r.depth]: e.target.value }))}
                            />
                          ) : (
                            <span>{cumulativeDisp[r.depth]?.toFixed(2) ?? '--'}</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                }) : (
                  <tr><td colSpan={analyzed ? 5 : 4} className="p-4 text-center opacity-50">请先选择测区和孔号加载数据</td></tr>
                )}
              </tbody>
            </table>
          </div>
            <div className="flex items-center justify-center gap-3 pt-2 border-t border-industrial-fg/10">
              <Button onClick={handleAnalyze} disabled={!dataLoaded || analyzing} className="text-[10px] px-6">
                {analyzing ? (
                  <span className="flex items-center"><Loader2 size={12} className="animate-spin mr-1" />计算中...</span>
                ) : analyzed ? (
                  <span className="flex items-center"><CheckCircle2 size={12} className="mr-1" />重新分析</span>
                ) : '分析'}
              </Button>
              <Button variant="secondary" onClick={handleExport} disabled={!canExport || exporting} className="text-[10px] px-6">
                {exporting ? (
                  <span className="flex items-center"><Loader2 size={12} className="animate-spin mr-1" />导出中...</span>
                ) : exported ? (
                  <span className="flex items-center"><CheckCircle2 size={12} className="mr-1" />重新导出</span>
                ) : '导出'}
              </Button>
            </div>
          </div>
        </div>
      </div>
      </WireframePlaceholder>

      {/* 导出成功模态框（模式 A） */}
      <Modal isOpen={showExportModal} onClose={() => setShowExportModal(false)} title="导出成功">
        <div className="space-y-4">
          <p className="text-xs leading-relaxed">
            {'数据导出成功，共 ' + DEPTH_POINTS + ' 条记录（第' + PERIODS + '期）。系统后台将自动补全其余期次数据，供后续分析使用。已自动提交评分—点击侧栏「监测日报表填写」进入下一步。'}
          </p>
          <div className="flex justify-center pt-2">
            <Button onClick={() => setShowExportModal(false)} className="px-8">知道了</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
