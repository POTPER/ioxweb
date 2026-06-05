import { useState, useEffect, useRef } from 'react';
import { Button } from './Common';
import { getMonitoringRawReading } from '../data/monitoringData';

const DATA_PERIOD = 5;

/**
 * 测量角度（与 Step9 仪器读数屏一致）
 *
 * 几何模型：探头两轮间距（测段轮距）L = 500 mm，读数 d 为对边位移（mm）
 *
 *   sin(θ) = clamp(d / L, -1, 1)
 *   θ(°)   = arcsin(sin(θ)) × 180 / π
 *
 * 输入 d 取实时 displayValue（mm）；稳定后即为 target。
 */
const GAUGE_LENGTH_MM = 500;
const mmToAngle = (mm: number) =>
  Math.asin(Math.min(Math.max(mm / GAUGE_LENGTH_MM, -1), 1)) * (180 / Math.PI);

/**
 * 模拟读数波动（仪器稳定过程中的 displayValue）
 *
 * 稳定时长 T：点位 1 → 30 s；点位 2–5 → 5 s
 * 进度：progress = clamp(t / T, 0, 1)，t 为已稳定秒数 elapsedSec
 *
 * 抖动量：
 *   envelope    = A_max × e^(-k × progress)     （A_max = 0.5 mm，k = 1.5）
 *   oscillation = sin(ω × t)                      （ω = 2.5 rad/s）
 *   jitter      = envelope × oscillation          （|jitter| ≤ 0.5 mm）
 *
 * 显示值：
 *   progress < 1  → displayValue = target + jitter
 *   progress ≥ 1  → displayValue = target（稳定，抖动归零）
 */
const JITTER_K = 1.5;
const JITTER_A_MAX = 0.5;
const JITTER_OMEGA = 2.5;

function getStabilizeDuration(pointIndex: number) {
  return pointIndex === 1 ? 30 : 5;
}

function computeReadingSimulation(target: number, elapsedSec: number, pointIndex: number) {
  const T = getStabilizeDuration(pointIndex);
  const progress = Math.min(Math.max(elapsedSec / T, 0), 1);
  const envelope = JITTER_A_MAX * Math.exp(-JITTER_K * progress);
  const oscillation = Math.sin(elapsedSec * JITTER_OMEGA);
  const jitter = progress >= 1 ? 0 : envelope * oscillation;
  const displayValue = progress >= 1 ? target : target + jitter;
  return { T, progress, envelope, oscillation, jitter, displayValue };
}

interface JitterFormulaPlaygroundProps {
  onClose: () => void;
}

export function JitterFormulaPlayground({ onClose }: JitterFormulaPlaygroundProps) {
  const [probeDirection, setProbeDirection] = useState<'up' | 'down'>('up');
  const [measureType, setMeasureType] = useState<'aPlus' | 'aMinus'>('aPlus');
  const [stepLength, setStepLength] = useState(0.5);
  const [pointIndex, setPointIndex] = useState(2);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [displayValue, setDisplayValue] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [submittedValue, setSubmittedValue] = useState<number | null>(null);

  const playTimerRef = useRef<NodeJS.Timeout | null>(null);

  const MAX_DEPTH = 20;

  // 计算深度列表：向下从 0m 递增，向上从 20m 递减，共 5 个测点
  const calculateDepths = () => {
    const depths: number[] = [];
    for (let i = 0; i < 5; i++) {
      const depth =
        probeDirection === 'down'
          ? i * stepLength
          : MAX_DEPTH - i * stepLength;
      depths.push(+depth.toFixed(1));
    }
    return depths;
  };

  // 计算目标值（监测数据表第5期）
  const calculateTarget = () => {
    const depths = calculateDepths();
    const depth = depths[pointIndex - 1];
    const reading = getMonitoringRawReading(DATA_PERIOD, depth);
    if (!reading) return 0;
    const value = measureType === 'aPlus' ? reading.aPlus : reading.aMinus;
    return value ?? 0;
  };

  const calculateDisplayValue = () =>
    computeReadingSimulation(calculateTarget(), elapsedSec, pointIndex).displayValue;

  // 开始模拟
  const startPlay = () => {
    if (isPlaying) return;
    setIsPlaying(true);
    setElapsedSec(0);

    playTimerRef.current = setInterval(() => {
      setElapsedSec(prev => {
        const next = prev + 0.1;
        const maxNext = Math.min(next, getStabilizeDuration(pointIndex));
        if (next >= getStabilizeDuration(pointIndex)) {
          setIsPlaying(false);
          clearInterval(playTimerRef.current!);
        }
        return maxNext;
      });
    }, 100);
  };

  // OK提交
  const handleOk = () => {
    setIsPlaying(false);
    if (playTimerRef.current) {
      clearInterval(playTimerRef.current);
    }
    const value = calculateDisplayValue();
    setSubmittedValue(value);
    console.log("提交的值：" + value.toFixed(3) + " mm");
  };

  // 重置
  const handleReset = () => {
    setIsPlaying(false);
    if (playTimerRef.current) {
      clearInterval(playTimerRef.current);
    }
    setElapsedSec(0);
    setSubmittedValue(null);
  };

  // 实时更新displayValue
  useEffect(() => {
    setDisplayValue(calculateDisplayValue());
  }, [elapsedSec, probeDirection, measureType, stepLength, pointIndex]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (playTimerRef.current) {
        clearInterval(playTimerRef.current);
      }
    };
  }, []);

  const depths = calculateDepths();
  const target = calculateTarget();
  const currentDepth = depths[pointIndex - 1];
  const sim = computeReadingSimulation(target, elapsedSec, pointIndex);

  const currentValue = displayValue !== null ? displayValue : target;
  const angle = mmToAngle(currentValue);

  return (
    <div className="fixed inset-0 z-[10000] flex flex-col" style={{ background: '#E4E3E0' }}>
      {/* Header */}
      <div className="h-12 border-b bg-white flex items-center px-4 justify-between flex-shrink-0" style={{ borderBottom: '1px solid #141414' }}>
        <h2 className="text-sm font-bold uppercase tracking-widest">读数抖动公式调参</h2>
        <Button variant="secondary" onClick={onClose} className="text-xs h-8 px-4">
          关闭
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 gap-6">
          {/* 左侧面板 */}
          <div className="space-y-4">
            {/* 实时结果 */}
            <div className="bg-white border p-4" style={{ border: '1px solid #141414' }}>
              <div className="text-xs font-bold uppercase tracking-widest mb-3">实时结果</div>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 border" style={{ background: '#e8e8e8', border: '1px solid #141414' }}>
                  <div className="text-xs font-bold uppercase mb-2" style={{ color: '#666' }}>displayValue（实时显示值）</div>
                  <div className="text-3xl font-bold" style={{ color: '#141414' }}>
                    {displayValue !== null ? displayValue.toFixed(3) : '--'} <span className="text-base ml-1" style={{ color: '#666' }}>mm</span>
                  </div>
                  <div className="mt-2 text-[10px] leading-relaxed font-mono" style={{ color: '#666' }}>
                    {sim.progress >= 1 ? (
                      <>稳定：displayValue = target</>
                    ) : (
                      <>
                        target + jitter<br />
                        jitter = {JITTER_A_MAX}×e^(-{JITTER_K}×{sim.progress.toFixed(2)})×sin({JITTER_OMEGA}×t)<br />
                        = {sim.jitter.toFixed(3)} mm（t={elapsedSec.toFixed(1)}s，T={sim.T}s）
                      </>
                    )}
                  </div>
                </div>
                <div className="p-4 border" style={{ background: '#e8e8e8', border: '1px solid #141414' }}>
                  <div className="text-xs font-bold uppercase mb-2" style={{ color: '#666' }}>测量角度</div>
                  <div className="text-3xl font-bold" style={{ color: '#141414' }}>
                    {angle.toFixed(2)}°
                  </div>
                  <div className="mt-2 text-[10px] leading-relaxed font-mono" style={{ color: '#666' }}>
                    θ = arcsin(d / {GAUGE_LENGTH_MM}) × 180/π<br />
                    d = {currentValue.toFixed(3)} mm → sin(θ) = {(currentValue / GAUGE_LENGTH_MM).toFixed(4)}
                  </div>
                </div>
                <div className="p-4 border text-xs leading-relaxed" style={{ background: '#f5f5f5', border: '1px solid #141414' }}>
                  <div className="mb-1"><span className="font-bold">target 来源：</span>监测数据表第5期 {measureType === 'aPlus' ? 'A+' : 'A-'}</div>
                  <div className="mb-1"><span className="font-bold">探头方向：</span>{probeDirection === 'up' ? `向上（${MAX_DEPTH}m 起，按步长递减）` : '向下（0m 起，按步长递增）'}，步长：{stepLength}m</div>
                  <div className="mb-1"><span className="font-bold">5个深度：</span>{depths.map(d => d.toFixed(1) + 'm').join(' / ')}</div>
                  <div><span className="font-bold">当前点位：</span>{pointIndex}，深度：{currentDepth.toFixed(1)}m，target = {target.toFixed(2)} mm</div>
                </div>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-3">
              <button
                onClick={startPlay}
                className="flex-1 py-3 text-xs font-bold uppercase border transition-all hover:opacity-90"
                style={{ background: '#141414', color: '#E4E3E0', border: '1px solid #141414' }}
              >
                开始模拟
              </button>
              <button
                onClick={handleOk}
                className="flex-1 py-3 text-xs font-bold uppercase border transition-all hover:bg-gray-50"
                style={{ border: '1px solid #141414' }}
              >
                OK 提交
              </button>
              <button
                onClick={handleReset}
                className="flex-1 py-3 text-xs font-bold uppercase border transition-all hover:bg-gray-50"
                style={{ border: '1px solid #141414' }}
              >
                重置
              </button>
            </div>

            {/* 参数设置 */}
            <div className="bg-white border p-4" style={{ border: '1px solid #141414' }}>
              <div className="text-xs font-bold uppercase tracking-widest mb-3">参数设置</div>
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase mb-2" style={{ color: '#666' }}>探头方向</label>
                  <select
                    value={probeDirection}
                    onChange={(e) => setProbeDirection(e.target.value as 'up' | 'down')}
                    className="w-full border p-2 text-xs focus:outline-none focus:border-gray-400"
                    style={{ border: '1px solid #141414', padding: '6px 8px', fontSize: '13px' }}
                  >
                    <option value="up">向上（从 20m 起，按步长递减）</option>
                    <option value="down">向下（从 0m 起，按步长递增）</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase mb-2" style={{ color: '#666' }}>测量类型</label>
                  <select
                    value={measureType}
                    onChange={(e) => setMeasureType(e.target.value as 'aPlus' | 'aMinus')}
                    className="w-full border p-2 text-xs focus:outline-none focus:border-gray-400"
                    style={{ border: '1px solid #141414', padding: '6px 8px', fontSize: '13px' }}
                  >
                    <option value="aPlus">A+ 正测</option>
                    <option value="aMinus">A- 反测</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase mb-2" style={{ color: '#666' }}>步长 (m)</label>
                  <select
                    value={stepLength}
                    onChange={(e) => setStepLength(Number(e.target.value))}
                    className="w-full border p-2 text-xs focus:outline-none focus:border-gray-400"
                    style={{ border: '1px solid #141414', padding: '6px 8px', fontSize: '13px' }}
                  >
                    <option value={0.5}>0.5</option>
                    <option value={1}>1.0</option>
                    <option value={1.5}>1.5</option>
                    <option value={2}>2.0</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase mb-2" style={{ color: '#666' }}>点位序号</label>
                  <select
                    value={pointIndex}
                    onChange={(e) => setPointIndex(Number(e.target.value))}
                    className="w-full border p-2 text-xs focus:outline-none focus:border-gray-400"
                    style={{ border: '1px solid #141414', padding: '6px 8px', fontSize: '13px' }}
                  >
                    <option value={1}>1（30秒）</option>
                    <option value={2}>2（5秒）</option>
                    <option value={3}>3（5秒）</option>
                    <option value={4}>4（5秒）</option>
                    <option value={5}>5（5秒）</option>
                  </select>
                  <div className="text-[9px] mt-1.5" style={{ color: '#666' }}>表示当前取 5 个深度中的第几个点</div>
                  <div className="text-[9px]" style={{ color: '#999' }}>点位1 = 第1个深度值（起始点），点位5 = 第5个深度值（终点）</div>
                </div>
              </div>
            </div>

            {/* 业务规则 */}
            <div className="bg-white border p-4" style={{ border: '1px solid #141414' }}>
              <div className="text-xs font-bold uppercase tracking-widest mb-3">业务规则</div>
              <div className="p-4 text-xs leading-relaxed" style={{ background: '#f5f5f5' }}>
                <ol className="list-decimal list-inside space-y-2">
                  <li><strong>抖动时长：</strong>第1个点位需要30秒稳定时间；第2-5个点位各需要5秒稳定时间</li>
                  <li><strong>数据来源：</strong>目标值取自监测数据表第5期，按正测或反测读取</li>
                  <li><strong>方向定义：</strong>向下从 0m 起按步长递增；向上从 20m 起按步长递减，各取 5 个深度</li>
                  <li><strong>深度取值：</strong>按点位序号取上述 5 个深度之一，再查表得到目标值</li>
                  <li><strong>稳定条件：</strong>当稳定时间到达时，抖动停止，显示值等于目标值</li>
                  <li><strong>自动结果：</strong>第6个点位开始进入自动稳定模式，直接显示稳定值，无需等待</li>
                </ol>
              </div>
            </div>
          </div>

          {/* 右侧面板 */}
          <div className="space-y-4">
            {/* 模拟读数波动公式 */}
            <div className="bg-white border p-4" style={{ border: '1px solid #141414' }}>
              <div className="text-xs font-bold uppercase tracking-widest mb-3">模拟读数波动公式</div>
              <div className="p-3 text-xs leading-relaxed space-y-2" style={{ background: '#f5f5f5' }}>
                <p>
                  <strong>目标值 target：</strong>监测数据表第 5 期，当前深度、正/反测（A+ / A−）。
                </p>
                <p>
                  <strong>稳定时长 T：</strong>点位 1 → 30 s；点位 2–5 → 5 s。已用时 <strong>t</strong> = elapsedSec（模拟每 0.1 s 递增）。
                </p>
                <p className="font-mono text-[11px]">
                  progress = clamp(t / T, 0, 1)<br />
                  envelope = {JITTER_A_MAX} × e^(-{JITTER_K} × progress)<br />
                  oscillation = sin({JITTER_OMEGA} × t)<br />
                  jitter = envelope × oscillation<br />
                  displayValue = target + jitter （progress &lt; 1）<br />
                  displayValue = target （progress ≥ 1，稳定）
                </p>
                <p>
                  <strong>幅度：</strong>|jitter| ≤ {JITTER_A_MAX} mm（与 target 大小无关）；progress 越大，包络越小，读数越快收敛到 target。
                </p>
                <p style={{ color: '#666' }}>
                  当前：progress={sim.progress.toFixed(2)}，jitter={sim.jitter.toFixed(3)} mm，target={target.toFixed(2)} mm → displayValue={currentValue.toFixed(3)} mm
                </p>
              </div>
            </div>

            {/* 角度计算公式 */}
            <div className="bg-white border p-4" style={{ border: '1px solid #141414' }}>
              <div className="text-xs font-bold uppercase tracking-widest mb-3">角度计算公式</div>
              <div className="p-3 text-xs leading-relaxed space-y-2" style={{ background: '#f5f5f5' }}>
                <p>
                  <strong>模型：</strong>测斜仪两轮间距（测段轮距）<strong>L = 500 mm</strong>（对应 0.5 m 量测间距），读数 <strong>d</strong>（mm）为对边位移。
                </p>
                <p className="font-mono text-[11px]">
                  sin(θ) = clamp(d / L, −1, 1)<br />
                  θ(°) = arcsin(d / L) × 180 / π
                </p>
                <p>
                  <strong>代入：</strong>d 取实时 <strong>displayValue</strong>（含抖动）；稳定后 d = target。与 Step9 读数仪界面算法一致。
                </p>
                <p style={{ color: '#666' }}>
                  例：d = 0.380 mm → sin(θ) = 0.00076 → θ ≈ 0.04°（非 d/2，斜边不是 2 mm）。
                </p>
              </div>
            </div>

            {/* 业务流程说明 */}
            <div className="bg-white border p-4" style={{ border: '1px solid #141414' }}>
              <div className="text-xs font-bold uppercase tracking-widest mb-3">业务流程说明</div>
              <div className="space-y-3 text-xs">
                <div>
                  <div className="font-bold uppercase mb-2" style={{ color: '#666' }}>Step 1: 确定测量时长</div>
                  <div className="p-3 leading-relaxed" style={{ background: '#f5f5f5' }}>
                    根据点位序号决定抖动持续时间：第1个点位需要30秒稳定时间，第2-5个点位各需要5秒稳定时间。
                  </div>
                </div>
                <div>
                  <div className="font-bold uppercase mb-2" style={{ color: '#666' }}>Step 2: 获取目标值</div>
                  <div className="p-3 leading-relaxed" style={{ background: '#f5f5f5' }}>
                    从监测数据表（第5期）读取目标值。向下：0、步长、2×步长…共 5 点；向上：20、20−步长、20−2×步长…共 5 点。正测读 A+，反测读 A−。
                  </div>
                </div>
                <div>
                  <div className="font-bold uppercase mb-2" style={{ color: '#666' }}>Step 3–6: 读数波动与显示值</div>
                  <div className="p-3 leading-relaxed font-mono text-[11px]" style={{ background: '#f5f5f5' }}>
                    progress = t / T<br />
                    jitter = {JITTER_A_MAX}×e^(-{JITTER_K}×progress)×sin({JITTER_OMEGA}×t)<br />
                    displayValue = target + jitter（t &lt; T）<br />
                    displayValue = target（t ≥ T）
                  </div>
                  <div className="p-3 mt-2 leading-relaxed text-[11px]" style={{ background: '#f5f5f5' }}>
                    详见左侧「模拟读数波动公式」；第 6 个点位起为自动稳定，本页仅模拟前 5 个点位。
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 提交结果提示 */}
      {submittedValue !== null && (
        <div className="fixed bottom-6 right-6 bg-white border-2 p-6 shadow-lg" style={{ border: '1px solid #141414' }}>
          <div className="text-xs font-bold uppercase mb-2">已提交</div>
          <div className="text-2xl font-bold" style={{ color: '#141414' }}>
            {submittedValue.toFixed(3)} mm
          </div>
        </div>
      )}
    </div>
  );
}
