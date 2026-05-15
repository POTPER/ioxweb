import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button, Modal, TechnicalInput } from '../Common';
import { TrainingQuestionButton } from '../TrainingInteractionButtons';
import { cn } from '../../lib/utils';
import { Link, Unlink, Battery, Zap, AlertTriangle, Loader2, Monitor } from 'lucide-react';
import { useWireframe } from '../WireframeContext';
import { WireframePlaceholder } from '../WireframeOverlay';
import { dataProcessingRows } from '../../data/trainingContent';
import { dataProcessingScoringConfig } from '../../data/scoringConfig';
import { calculateStepScore } from '../../lib/scoring';

const AREA_HOLES: Record<string, number> = { '01': 5, '02': 6, '03': 8 };

interface DepthRow {
  period: number;
  date: string;
  depth: number;
  forward: number;
  reverse: number;
  checksum: number;
  displacement: number;
  isMissing: boolean;
}

type ImportSnapshot = {
  connected: boolean;
  area: string;
  hole: string;
};

const processingRows: DepthRow[] = dataProcessingRows.map(row => ({
  period: Number(row.period),
  date: row.date,
  depth: Number(row.depth),
  forward: Number(row.forward),
  reverse: Number(row.reverse),
  checksum: Number(row.checksum),
  displacement: Number(row.displacement),
  isMissing: row.isMissing === 'true',
}));

const DATA_PERIOD = processingRows[0]?.period ?? 6;
const DATA_DATE = processingRows[0]?.date ?? '2026-03-24';
const DEPTH_POINTS = processingRows.length;
const MISSING_ROWS = processingRows.filter(row => row.isMissing);
const MISSING_DEPTHS = MISSING_ROWS.map(row => row.depth);

export const DataProcessing: React.FC<{ onNext: (data: any) => void }> = ({ onNext }) => {
  const { wireframeMode } = useWireframe();
  const [isConnected, setIsConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [selectedArea, setSelectedArea] = useState('');
  const [selectedHole, setSelectedHole] = useState('');
  const [dataImported, setDataImported] = useState(false);
  const [importing, setImporting] = useState(false);

  const [exported, setExported] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showImportConfirmModal, setShowImportConfirmModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  const [analyzed, setAnalyzed] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [showAnalyzeConfirmModal, setShowAnalyzeConfirmModal] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [cumulativeDisp, setCumulativeDisp] = useState<Record<number, number | null>>({});
  const [userFills, setUserFills] = useState<Record<number, string>>({});
  const [activeFillDepth, setActiveFillDepth] = useState<number | null>(null);
  const [pendingFillValue, setPendingFillValue] = useState('');
  const [importSnapshot, setImportSnapshot] = useState<ImportSnapshot | null>(null);


  const opLog = useRef<{ action: string; value?: string; timestamp: string }[]>([]);
  const logOp = useCallback((action: string, value?: string) => {
    opLog.current.push({ action, value, timestamp: new Date().toISOString() });
  }, []);

  const handleConnect = () => {
    if (connecting) return;
    setConnecting(true);
    logOp('connect');
    setTimeout(() => { setConnecting(false); setIsConnected(true); }, 1500);
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    logOp('disconnect');
  };

  const handleAreaChange = (val: string) => {
    setSelectedArea(val);
    setSelectedHole('');
    if (val) { logOp('selectArea', val); }
  };

  const handleHoleChange = (val: string) => {
    setSelectedHole(val);
    if (val) { logOp('selectHole', val); }
  };

  const runImport = () => {
    setDataImported(false);
    setExported(false);
    setAnalyzed(false);
    setCumulativeDisp({});
    setUserFills({});
    hasSubmittedRef.current = false;
    setImporting(true);
    const snapshot: ImportSnapshot = {
      connected: isConnected,
      area: selectedArea,
      hole: selectedHole.padStart(2, '0'),
    };
    setImportSnapshot(snapshot);
    logOp('import', JSON.stringify(snapshot));
    setTimeout(() => {
      setImporting(false);
      setDataImported(true);
    }, 800);
  };

  const handleImport = () => {
    if (!selectedArea || !selectedHole || importing) return;
    if (dataImported) {
      setShowImportConfirmModal(true);
      return;
    }
    runImport();
  };

  const handleExport = () => {
    if (!canExport || exporting) return;
    // 允许重复导出：重置提交状态以便后续 useEffect 重新触发 handleSubmit
    hasSubmittedRef.current = false;
    setExported(false);
    setExporting(true);
    logOp('export');
    setTimeout(() => { setExporting(false); setExported(true); setShowExportModal(true); }, 1500);
  };

  const runAnalyze = () => {
    // 允许重复点击：清空填写内容 + 重置导出/提交状态
    setUserFills({});
    setExported(false);
    hasSubmittedRef.current = false;
    setAnalyzing(true);
    logOp('analyze');
    setTimeout(() => {
      const disp: Record<number, number | null> = {};
      processingRows.forEach(row => {
        disp[row.depth] = row.isMissing ? null : row.displacement;
      });
      setCumulativeDisp(disp);
      setAnalyzing(false);
      setAnalyzed(true);
      setShowAnalysisModal(true);
    }, 2000);
  };

  const handleAnalyze = () => {
    if (!dataImported || analyzing) return;
    if (Object.keys(userFills).some(depth => userFills[Number(depth)]?.trim() !== '')) {
      setShowAnalyzeConfirmModal(true);
      return;
    }
    runAnalyze();
  };

  const openFillModal = (depth: number) => {
    setActiveFillDepth(depth);
    setPendingFillValue(userFills[depth] || '');
  };

  const closeFillModal = () => {
    setActiveFillDepth(null);
    setPendingFillValue('');
  };

  const handlePendingFillChange = (value: string) => {
    const normalized = value
      .replace(/[^\d.]/g, '')
      .replace(/(\..*)\./g, '$1');
    setPendingFillValue(normalized);
  };

  const confirmFillValue = () => {
    if (activeFillDepth === null) return;
    const trimmed = pendingFillValue.trim();
    if (trimmed === '' || Number.isNaN(Number(trimmed))) return;
    setUserFills(prev => ({ ...prev, [activeFillDepth]: Number(trimmed).toFixed(2) }));
    closeFillModal();
  };

  const canImport = selectedArea !== '' && selectedHole !== '';
  const dataLoaded = dataImported;
  const latestRows = dataLoaded ? processingRows : [];
  const holeCount = selectedArea ? (AREA_HOLES[selectedArea] || 0) : 0;
  const holeOptions = Array.from({ length: holeCount }, (_, i) => i + 1);
  const totalRecords = dataLoaded ? DEPTH_POINTS : 0;
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
    const snapshot = importSnapshot ?? {
      connected: isConnected,
      area: selectedArea,
      hole: selectedHole.padStart(2, '0'),
    };

    let correctCount = 0;
    MISSING_ROWS.forEach(row => {
      const userVal = Number(Number(userFills[row.depth]).toFixed(2));
      if (Math.abs(userVal - row.displacement) <= 0.05) correctCount++;
    });
    const score313 = correctCount;
    const scoreResult = calculateStepScore(dataProcessingScoringConfig, [
      {
        questionId: 'data.processing.connection',
        answer: snapshot.connected ? 'connected' : 'notConnected',
      },
      {
        questionId: 'data.processing.area',
        answer: snapshot.area,
      },
      {
        questionId: 'data.processing.hole',
        answer: snapshot.hole,
      },
      {
        questionId: 'data.processing.cumDisp10',
        answer: userFills[10.0],
      },
      {
        questionId: 'data.processing.cumDisp14',
        answer: userFills[14.0],
      },
    ]);

    onNext({
      ...scoreResult,
      legacyStepId: 'step10',
      operationLog: opLog.current,
      importSnapshot: snapshot,
      scoring: {
        connection: { label: '导入前连接状态', connectedAtImport: snapshot.connected, score: snapshot.connected ? 1 : 0, maxScore: 1 },
        area: { label: '测区值', userAnswer: snapshot.area, correctAnswer: '03', score: snapshot.area === '03' ? 1 : 0, maxScore: 1 },
        hole: { label: '孔号值', userAnswer: snapshot.hole, correctAnswer: '06', score: snapshot.hole === '06' ? 1 : 0, maxScore: 1 },
        '3-1-3': {
          label: '本次位移量补全',
          items: MISSING_ROWS.map(row => {
            return { depth: row.depth + 'm', userAnswer: Number(userFills[row.depth]), correctAnswer: row.displacement, tolerance: 0.05, correct: Math.abs(Number(userFills[row.depth]) - row.displacement) <= 0.05 };
          }),
          score: score313, maxScore: 2
        }
      },
      exportedData: {
        period: DATA_PERIOD,
        records: DEPTH_POINTS,
        displacementFilled: Object.fromEntries(MISSING_ROWS.map(row => [row.depth + 'm', Number(userFills[row.depth])]))
      },
      supplementedData: {
        note: '系统后台自动补全其余期次数据，供步骤3使用',
        allPeriods: [DATA_PERIOD],
        totalRecords: DEPTH_POINTS,
      },
      allPeriodsData: [{ period: DATA_PERIOD, date: DATA_DATE, rows: processingRows }],
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
            <Button
              onClick={handleImport}
              disabled={!canImport || importing}
              className="text-[10px] h-7 px-3"
            >
              {importing ? (
                <span className="flex items-center"><Loader2 size={12} className="animate-spin mr-1" />导入中...</span>
              ) : '导入'}
            </Button>
          </div>

          {/* Data table area — 始终显示，无数据时呈现空表 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-mono uppercase tracking-widest opacity-40">
                {dataLoaded && importSnapshot ? (
                  '已导入：第' + DATA_PERIOD + '期数据 · ' + DATA_DATE + ' · ' + importSnapshot.area + '区' + importSnapshot.hole + '孔 · 共 ' + DEPTH_POINTS + ' 行'
                ) : '待导入数据'}
              </div>
            </div>
            <div className="max-h-[400px] overflow-y-auto border border-industrial-fg/20">
            <table className="w-full text-[10px] font-mono border-collapse">
              <thead className="sticky top-0 bg-industrial-bg/30"><tr className="border-b border-industrial-fg">
                <th className="p-1.5 text-left">深度(m)</th>
                <th className="p-1.5 text-left">正测(mm)</th>
                <th className="p-1.5 text-left">反测(mm)</th>
                <th className="p-1.5 text-left">校验和(mm)</th>
                <th className="p-1.5 text-left">本次位移量(mm)</th>
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
                      <td className="p-1.5">
                        {analyzed ? (
                          isMissing ? (
                            <TrainingQuestionButton
                              absolute={false}
                              completed={Boolean(userFills[r.depth]?.trim())}
                              label={userFills[r.depth]?.trim() || '请填写'}
                              className="inline-flex"
                              onClick={() => openFillModal(r.depth)}
                            />
                          ) : (
                            <span>{cumulativeDisp[r.depth]?.toFixed(2) ?? '--'}</span>
                          )
                        ) : (
                          <span className="opacity-40">--</span>
                        )}
                      </td>
                    </tr>
                  );
                }) : (
                  <tr><td colSpan={5} className="p-4 text-center opacity-50">暂无数据</td></tr>
                )}
              </tbody>
            </table>
          </div>
            <div className="flex items-center justify-center gap-3 pt-2 border-t border-industrial-fg/10">
              <Button onClick={handleAnalyze} disabled={!dataLoaded || analyzing} className="text-[10px] px-6">
                {analyzing ? (
                  <span className="flex items-center"><Loader2 size={12} className="animate-spin mr-1" />计算中...</span>
                ) : '分析'}
              </Button>
              <Button
                onClick={handleExport}
                disabled={!canExport || exporting}
                title={!canExport ? '当前不可导出' : undefined}
                className="text-[10px] px-6"
              >
                导出
              </Button>
            </div>
          </div>
        </div>
      </div>
      </WireframePlaceholder>

      <Modal isOpen={activeFillDepth !== null} onClose={closeFillModal} title="填写本次位移量">
        <div className="space-y-6">
          <p className="text-xs leading-relaxed opacity-80">
            {activeFillDepth !== null
              ? `请输入第${DATA_PERIOD}期 ${activeFillDepth.toFixed(1)}m 深度的本次位移量。`
              : '请输入本次位移量。'}
          </p>
          <TechnicalInput
            label="本次位移量"
            value={pendingFillValue}
            onChange={handlePendingFillChange}
            unit="MM"
            placeholder="请输入数值"
          />
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={confirmFillValue}
              disabled={pendingFillValue.trim() === '' || Number.isNaN(Number(pendingFillValue))}
              className="w-full"
            >
              确认
            </Button>
            <Button variant="secondary" onClick={closeFillModal} className="w-full">
              取消
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showImportConfirmModal} onClose={() => setShowImportConfirmModal(false)} title="确认导入">
        <div className="space-y-4">
          <p className="text-xs leading-relaxed">
            已有数据导入，是否重新导入并覆盖已导入数据？
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Button
              onClick={() => {
                setShowImportConfirmModal(false);
                runImport();
              }}
              className="px-8"
            >
              确认导入
            </Button>
            <Button variant="secondary" onClick={() => setShowImportConfirmModal(false)} className="px-8">
              取消
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showAnalyzeConfirmModal} onClose={() => setShowAnalyzeConfirmModal(false)} title="确认分析">
        <div className="space-y-4">
          <p className="text-xs leading-relaxed">
            重新分析将清空已补充的数据，是否继续？
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Button
              onClick={() => {
                setShowAnalyzeConfirmModal(false);
                runAnalyze();
              }}
              className="px-8"
            >
              确认分析
            </Button>
            <Button variant="secondary" onClick={() => setShowAnalyzeConfirmModal(false)} className="px-8">
              取消
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showAnalysisModal} onClose={() => setShowAnalysisModal(false)} title="分析完成">
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-300">
            <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs leading-relaxed">
              {'分析完成，检测到 ' + MISSING_DEPTHS.length + ' 处本次位移量数据缺失。'}
            </p>
          </div>
          <div className="flex justify-center pt-2">
            <Button onClick={() => setShowAnalysisModal(false)} className="px-8">知道了</Button>
          </div>
        </div>
      </Modal>

      {/* 导出成功模态框（模式 A） */}
      <Modal isOpen={showExportModal} onClose={() => setShowExportModal(false)} title="导出成功">
        <div className="space-y-4">
          <p className="text-xs leading-relaxed">
            {'数据导出成功，共 ' + DEPTH_POINTS + ' 条记录（第' + DATA_PERIOD + '期）。系统后台将自动补全其余期次数据，供后续分析使用。已自动提交评分—点击侧栏「监测日报表填写」进入下一步。'}
          </p>
          <div className="flex justify-center pt-2">
            <Button onClick={() => setShowExportModal(false)} className="px-8">知道了</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
