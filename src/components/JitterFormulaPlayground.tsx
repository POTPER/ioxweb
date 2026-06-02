import { useState, useEffect, useRef } from 'react';
import { Button } from './Common';

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

  // 监测数据表第5期数据
  const rawTable: Record<string, { aPlus: number; aMinus: number }> = {
    "0.0": { aPlus: 5.80, aMinus: -5.47 },
    "0.5": { aPlus: 5.37, aMinus: -4.98 },
    "2.0": { aPlus: 6.97, aMinus: -6.53 },
    "3.0": { aPlus: 13.68, aMinus: -13.30 },
    "4.5": { aPlus: 21.83, aMinus: -21.26 },
  };

  // 抖动参数
  const k = 1.5;
  const ratio = 0.1;
  const minAmp = 1;
  const sinFactor = 0.6;
  const sinFreq = 2.5;
  const noise = 0.1;

  // 计算深度列表
  const calculateDepths = () => {
    const depths: number[] = [];
    if (probeDirection === 'down') {
      for (let i = 0; i < 5; i++) {
        depths.push(i * stepLength);
      }
    } else {
      const maxDepth = 4.5;
      for (let i = 0; i < 5; i++) {
        depths.push(maxDepth - i * stepLength);
      }
    }
    return depths;
  };

  // 计算目标值
  const calculateTarget = () => {
    const depths = calculateDepths();
    const depth = depths[pointIndex - 1];
    const depthStr = depth.toFixed(1);
    const data = rawTable[depthStr];
    if (!data) return 0;
    return measureType === 'aPlus' ? data.aPlus : data.aMinus;
  };

  // 计算displayValue
  const calculateDisplayValue = () => {
    const target = calculateTarget();
    const T = pointIndex === 1 ? 30 : 5;
    const progress = Math.min(Math.max(elapsedSec / T, 0), 1);
    const A = Math.max(Math.abs(target) * ratio, minAmp);
    const oscillation = Math.sin(elapsedSec * sinFreq) * sinFactor + noise;
    const jitter = A * Math.exp(-k * progress) * oscillation;
    const value = progress >= 1 ? target : target + jitter;
    return value;
  };

  // 开始模拟
  const startPlay = () => {
    if (isPlaying) return;
    setIsPlaying(true);
    const T = pointIndex === 1 ? 30 : 5;
    setElapsedSec(0);

    playTimerRef.current = setInterval(() => {
      setElapsedSec(prev => {
        const next = prev + 0.1;
        const maxNext = Math.min(next, T);
        if (next >= T) {
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
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 border" style={{ background: '#e8e8e8', border: '1px solid #141414' }}>
                  <div className="text-xs font-bold uppercase mb-2" style={{ color: '#666' }}>displayValue（实时显示值）</div>
                  <div className="text-3xl font-bold" style={{ color: '#141414' }}>
                    {displayValue !== null ? displayValue.toFixed(3) : '--'} <span className="text-base ml-1" style={{ color: '#666' }}>mm</span>
                  </div>
                </div>
                <div className="p-4 border text-xs leading-relaxed" style={{ background: '#f5f5f5', border: '1px solid #141414' }}>
                  <div className="mb-1"><span className="font-bold">target 来源：</span>监测数据表第5期 {measureType === 'aPlus' ? 'A+' : 'A-'}</div>
                  <div className="mb-1"><span className="font-bold">探头方向：</span>{probeDirection === 'up' ? '向上（孔深上限起，深度递减）' : '向下（0m起，深度递增）'}，步长：{stepLength}m</div>
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
                    <option value="up">向上（从孔深上限开始，深度递减）</option>
                    <option value="down">向下（从0m开始，深度递增）</option>
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
                  <li><strong>方向定义：</strong>向下表示从浅层向深层测量；向上表示从深层向浅层测量</li>
                  <li><strong>深度取值：</strong>根据设定的步长计算5个测量深度，按点位序号选择对应深度的数值</li>
                  <li><strong>稳定条件：</strong>当稳定时间到达时，抖动停止，显示值等于目标值</li>
                  <li><strong>自动结果：</strong>第6个点位开始进入自动稳定模式，直接显示稳定值，无需等待</li>
                </ol>
              </div>
            </div>
          </div>

          {/* 右侧面板 */}
          <div className="space-y-4">
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
                    从监测数据表（第5期）中读取目标值。根据探头方向和步长计算出5个测量深度，然后按点位序号取出对应深度的数值。正测读A+，反测读A-。
                  </div>
                </div>
                <div>
                  <div className="font-bold uppercase mb-2" style={{ color: '#666' }}>Step 3: 计算初始抖动幅度</div>
                  <div className="p-3 leading-relaxed" style={{ background: '#f5f5f5' }}>
                    根据目标值大小计算初始抖动范围，目标值越大抖动越大。同时设置最小抖动幅度，确保即使目标值很小也会有基础抖动效果。
                  </div>
                </div>
                <div>
                  <div className="font-bold uppercase mb-2" style={{ color: '#666' }}>Step 4: 模拟读数波动</div>
                  <div className="p-3 leading-relaxed" style={{ background: '#f5f5f5' }}>
                    结合正弦波动和随机噪声模拟真实测量时的读数抖动。正弦波动模拟周期性变化，噪声模拟随机干扰。
                  </div>
                </div>
                <div>
                  <div className="font-bold uppercase mb-2" style={{ color: '#666' }}>Step 5: 抖动衰减</div>
                  <div className="p-3 leading-relaxed" style={{ background: '#f5f5f5' }}>
                    随着时间推移，抖动幅度逐渐减小。衰减系数控制抖动消失的快慢，时间越长抖动越小，最终趋于稳定。
                  </div>
                </div>
                <div>
                  <div className="font-bold uppercase mb-2" style={{ color: '#666' }}>Step 6: 输出实时显示值</div>
                  <div className="p-3 leading-relaxed" style={{ background: '#f5f5f5' }}>
                    在稳定时间内，显示值 = 目标值 + 抖动值；稳定时间结束后，抖动归零，显示值直接等于目标值。第6个值开始进入自动稳定模式。正测反测同理。
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
