import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TechnicalCard, Button, Modal } from '../Common';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';
import { AlertCircle } from 'lucide-react';
import { WireframePlaceholder } from '../WireframeOverlay';

// --- Types ---
interface Reading {
  depth: number;
  group: string;
  forward: number | null;
  reverse: number | null;
  checksum: number | null;
}

type Phase = 1 | 2 | 3 | 4 | 5 | 6;
type LcdScreen = 'off' | 'main' | 'params' | 'probe' | 'confirm-fwd' | 'confirm-rev' | 'collect' | 'remeasure' | 'auto-collect' | 'time-setting';

// --- 第6期原始读数 (from 监测数据.md § 第6期原始读数) ---
// 索引 0 = 0.5m … 39 = 20.0m，[A+(正测mm), A-(反测mm)]
// 由初测读数 + 累计位移推导：Δraw = (cumul(d)−cumul(d+0.5)) × C/L，C=20000，L=500mm
const RAW_READINGS: [number, number][] = [
  [140,-136],[127,-123],[115,-111],[97,-93],[74,-70],
  [52,-48],[30,-27],[9,-6],[-9,11],[-26,28],
  [-37,39],[-47,49],[-54,56],[-59,61],[-57,58],
  [-51,52],[-43,44],[-84,85],[-12,13],[17,-16],
  [77,-76],[40,-39],[49,-47],[56,-54],[61,-59],
  [62,-60],[37,-35],[80,-78],[49,-47],[42,-40],
  [36,-35],[30,-29],[26,-25],[22,-21],[17,-16],
  [13,-13],[9,-8],[4,-4],[5,-5],[0,0],
];

const getReading = (depth: number, type: 'forward' | 'reverse'): number => {
  const idx = Math.round(depth / 0.5) - 1;
  if (idx < 0 || idx >= RAW_READINGS.length) return 0;
  const [fwd, rev] = RAW_READINGS[idx];
  return type === 'forward' ? fwd : rev;
};

// 正弦模型常量：测量段长 0.5m = 500mm
const GAUGE_LENGTH = 500;
// 位移(mm) → 角度(°)
const mmToAngle = (mm: number): number => Math.asin(Math.min(Math.max(mm / GAUGE_LENGTH, -1), 1)) * (180 / Math.PI);

// 传感器波动模型：指数衰减 + 随机噪声
// elapsed = 已经过秒数， totalDuration = 总稳定时长， amplitude = 初始最大波动幅(mm)
const sensorJitter = (elapsed: number, totalDuration: number, amplitude: number): number => {
  const progress = Math.min(elapsed / totalDuration, 1);
  // 指数衰减：开始大幅波动，逐渐收敛
  const envelope = amplitude * Math.exp(-3.5 * progress);
  // 叠加正弦摸动 + 随机噪声
  const oscillation = Math.sin(elapsed * 2.5) * 0.6 + (Math.random() - 0.5);
  return envelope * oscillation;
};

const ANOMALY_DEPTH = 12.5;
const CHECKSUM_THRESHOLD = 5;
const TOTAL_DEPTH = 20;

export const InstrumentSetting: React.FC<{ onNext: (data: any) => void; devAutoStart?: boolean }> = ({ onNext, devAutoStart }) => {
  // --- Phase & device state ---
  const [phase, setPhase] = useState<Phase>(1);
  const [isPoweredOn, setIsPoweredOn] = useState(false);
  const [booting, setBooting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedCable, setSelectedCable] = useState<string | null>(null);
  const [showCableModal, setShowCableModal] = useState(false);
  const [pendingCable, setPendingCable] = useState<string | null>(null);
  const [startupOrder, setStartupOrder] = useState<string[]>([]);
  const [cableBeforeBoot, setCableBeforeBoot] = useState<boolean | null>(null);
  const [cleanupOrder, setCleanupOrder] = useState<string[]>([]);
  const [cleanupDone, setCleanupDone] = useState({ power: false, cable: false });

  // --- LCD state ---
  const [lcdScreen, setLcdScreen] = useState<LcdScreen>('off');
  const [cursor, setCursor] = useState(0);
  const [editingField, setEditingField] = useState<number | null>(null);

  // --- Params (defaults intentionally wrong per spec) ---
  const [params, setParams] = useState({ area: '01', hole: '01', depth: 25 });
  const [paramsSaved, setParamsSaved] = useState(false);

  // --- Probe settings (defaults wrong per spec) ---
  const [probe, setProbe] = useState({ direction: '向下' as '向上' | '向下', calibration: 0.00, stepLength: 1.0 });
  const [probeSaved, setProbeSaved] = useState(false);

  // --- Measurement state ---
  const [measureType, setMeasureType] = useState<'forward' | 'reverse' | null>(null);
  const [currentDepth, setCurrentDepth] = useState(0);
  const [manualPoint, setManualPoint] = useState(0); // 0-based index of current manual point (0-4)
  const [isStable, setIsStable] = useState(false);
  const [stabilizeTimer, setStabilizeTimer] = useState(0);
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [autoCollecting, setAutoCollecting] = useState(false);
  const [showMovePrompt, setShowMovePrompt] = useState(false);
  const [readings, setReadings] = useState<Reading[]>([]);
  const [showDataTable, setShowDataTable] = useState(false);

  // --- Field setup (unlocked during confirm phase) ---
  const [fieldUnlocked, setFieldUnlocked] = useState(false);
  const [probeRotation, setProbeRotation] = useState(0); // 0 / 90 / 180 / 270
  const [rotationConfirmed, setRotationConfirmed] = useState(false);
  const wheelDirection: 'A+' | 'A-' | null = rotationConfirmed
    ? (probeRotation === 0 ? 'A+' : probeRotation === 180 ? 'A-' : null)
    : null;
  const [cableAlignment, setCableAlignment] = useState<'N' | 'S' | 'E' | 'W' | null>(null);
  const [pendingAlignment, setPendingAlignment] = useState<'N' | 'S' | 'E' | 'W' | null>(null);
  const [monitorInterval, setMonitorInterval] = useState('');

  // --- Supplementary measurement ---
  const [remeasureParams, setRemeasureParams] = useState({ group: '05', depth: 3.0, direction: '正测' as '正测' | '反测' });
  const [remeasureCursor, setRemeasureCursor] = useState(0);
  const [remeasureEditing, setRemeasureEditing] = useState<number | null>(null);
  const [foundAnomaly, setFoundAnomaly] = useState(false);

  // --- Scoring tracking ---
  const stabilityScores = useRef<Record<string, any>>({});
  const timerRef = useRef<any>(null);

  // --- Cable options ---
  const cableOptions = [
    { id: 'A', name: '5针圆形插头线', desc: '5针圆形航空插头，适配滑动式测斜仪探头接口。' },
    { id: 'B', name: '3针圆形插头线', desc: '3针圆形航空插头，适配固定式传感器串联接口。' },
    { id: 'C', name: '7针矩形插头线', desc: '7针矩形接口，适配水位计数据传输。' },
    { id: 'D', name: '9针D-sub插头线', desc: '9针D-sub串口线，适配PC数据导出。' },
  ];

  const menuItems = ['1. 开始新的测量', '2. 测孔参数设置', '3. 探头设置', '4. 补测数据点', '5. 时间设置'];

  // --- DEV auto-start ---
  useEffect(() => {
    if (!devAutoStart) return;
    setSelectedCable('A');
    setCableBeforeBoot(true);
    setIsPoweredOn(true);
    setIsConnected(true);
    setParams({ area: '03', hole: '06', depth: 20 });
    setParamsSaved(true);
    setProbe({ direction: '向上', calibration: 0.00, stepLength: 0.5 });
    setProbeSaved(true);
    setPhase(3);
    setLcdScreen('confirm-fwd');
    setMeasureType('forward');
    setFieldUnlocked(true);
    setManualPoint(0);
    setCurrentDepth(TOTAL_DEPTH);
    setProbeRotation(0);
    setRotationConfirmed(false);
    setCableAlignment(null);
    stabilityScores.current = {};
    initReadings();
  }, [devAutoStart]);

  // --- Phase advancement ---
  useEffect(() => {
    if (isPoweredOn && isConnected && phase === 1) setPhase(2);
  }, [isPoweredOn, isConnected, phase]);

  useEffect(() => {
    if (paramsSaved && probeSaved && phase === 2) setPhase(3);
  }, [paramsSaved, probeSaved, phase]);

  // --- Stabilization timer ---
  const startStabilize = useCallback((pointIndex: number, type: 'forward' | 'reverse') => {
    setIsStable(false);
    const duration = pointIndex === 0 ? 30 : 5; // seconds
    setStabilizeTimer(duration);
    let t = duration;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      t -= 1;
      setStabilizeTimer(t);
      if (t <= 0) {
        clearInterval(timerRef.current);
        setIsStable(true);
      }
    }, 1000);
  }, []);

  // --- Initialize readings table ---
  const initReadings = useCallback(() => {
    const step = probe.stepLength;
    const pts: Reading[] = [];
    for (let d = TOTAL_DEPTH; d >= 0; d = +(d - step).toFixed(1)) {
      pts.push({ depth: d, group: '05', forward: null, reverse: null, checksum: null });
    }
    setReadings(pts);
  }, [probe.stepLength]);

  // --- Generate all remaining auto-collect data ---
  const autoCollect = useCallback((type: 'forward' | 'reverse') => {
    setAutoCollecting(true);
    setReadings(prev => {
      const updated = [...prev];
      for (let i = 0; i < updated.length; i++) {
        const r = updated[i];
        if (type === 'forward' && r.forward === null) {
          updated[i] = { ...r, forward: getReading(r.depth, 'forward') };
        } else if (type === 'reverse' && r.reverse === null) {
          let val = getReading(r.depth, 'reverse');
          if (r.depth === ANOMALY_DEPTH) {
            val = val + 8; // 故意偏差
          }
          updated[i] = { ...r, reverse: val };
        }
      }
      // Compute checksums where both exist
      for (let i = 0; i < updated.length; i++) {
        const r = updated[i];
        if (r.forward !== null && r.reverse !== null) {
          updated[i] = { ...r, checksum: +(r.forward + r.reverse).toFixed(2) };
        }
      }
      return updated;
    });

    setTimeout(() => {
      setAutoCollecting(false);
      setIsMeasuring(false);
      if (type === 'forward') {
        // Auto transition to reverse confirm
        setLcdScreen('confirm-rev');
        setCableAlignment(null); // Reset alignment for reverse
        setProbeRotation(180); // Probe flipped 180° for reverse
        setRotationConfirmed(true); // Auto-confirm: probe already at 180°
        setFieldUnlocked(true);
        setManualPoint(0);
        setMeasureType(null);
      } else {
        // Reverse done, go to main menu, unlock phase 5
        setLcdScreen('main');
        setCursor(0);
        setPhase(5);
        setFieldUnlocked(false);
      }
    }, 1500);
  }, []);

  // --- Record a manual measurement point ---
  const recordManualPoint = useCallback(() => {
    if (!measureType) return;
    const step = probe.stepLength;
    const depthVal = TOTAL_DEPTH - manualPoint * step;
    const key = `${measureType}-${manualPoint}`;
    stabilityScores.current[key] = { stable: isStable };

    setReadings(prev => {
      const updated = [...prev];
      const idx = updated.findIndex(r => r.depth === depthVal);
      if (idx !== -1) {
        let val = getReading(depthVal, measureType);
        if (measureType === 'reverse' && depthVal === ANOMALY_DEPTH) {
          val = val + 8; // 故意偏差，使校验和 |A+ + A-| 超过阈值
        }
        if (measureType === 'forward') {
          updated[idx] = { ...updated[idx], forward: val };
        } else {
          updated[idx] = { ...updated[idx], reverse: val };
          if (updated[idx].forward !== null) {
            updated[idx] = { ...updated[idx], checksum: +(updated[idx].forward! + val).toFixed(2) };
          }
        }
      }
      return updated;
    });

    if (manualPoint < 4) {
      setShowMovePrompt(true);
      // Wait for user to click 上提 button — do NOT auto-advance
    } else {
      // Auto collect remaining
      autoCollect(measureType);
    }
  }, [measureType, manualPoint, isStable, probe.stepLength, startStabilize, autoCollect]);

  // --- LCD button handler ---
  const handleNav = (dir: 'up' | 'down' | 'ok' | 'back') => {
    if (!isPoweredOn) return;

    if (lcdScreen === 'main') {
      if (dir === 'up') setCursor(p => p > 0 ? p - 1 : menuItems.length - 1);
      if (dir === 'down') setCursor(p => p < menuItems.length - 1 ? p + 1 : 0);
      if (dir === 'ok') {
        if (cursor === 0 && phase >= 3) {
          // Start new measurement - clear phases 3-5
          initReadings();
          setMeasureType('forward');
          setLcdScreen('confirm-fwd');
          setFieldUnlocked(true);
          setManualPoint(0);
          setCurrentDepth(TOTAL_DEPTH);
          setProbeRotation(0);
          setRotationConfirmed(false);
          setCableAlignment(null);
          stabilityScores.current = {};
        } else if (cursor === 1) {
          setLcdScreen('params');
          setCursor(0);
          setEditingField(null);
        } else if (cursor === 2) {
          setLcdScreen('probe');
          setCursor(0);
          setEditingField(null);
        } else if (cursor === 3) {
          setLcdScreen('remeasure');
          setRemeasureCursor(0);
          setRemeasureEditing(null);
        } else if (cursor === 4) {
          setLcdScreen('time-setting');
          setCursor(0);
          setEditingField(null);
        }
      }
    } else if (lcdScreen === 'time-setting') {
      if (dir === 'up') setCursor(p => p > 0 ? p - 1 : 5);
      if (dir === 'down') setCursor(p => p < 5 ? p + 1 : 0);
      if (dir === 'ok' && cursor === 5) { setLcdScreen('main'); setCursor(4); }
      if (dir === 'back') { setLcdScreen('main'); setCursor(4); }
    } else if (lcdScreen === 'params') {
      handleParamsNav(dir);
    } else if (lcdScreen === 'probe') {
      handleProbeNav(dir);
    } else if (lcdScreen === 'confirm-fwd' || lcdScreen === 'confirm-rev') {
      if (dir === 'ok') {
        // Check if field setup is complete
        if (!wheelDirection || !cableAlignment || !monitorInterval) return;
        const type = lcdScreen === 'confirm-fwd' ? 'forward' : 'reverse';
        // Capture setup choices for final scoring (state may be reset before submit)
        if (type === 'forward') {
          stabilityScores.current['fwd-wheel'] = wheelDirection;
          stabilityScores.current['fwd-alignment'] = cableAlignment;
        }
        setMeasureType(type);
        setLcdScreen('collect');
        setIsMeasuring(true);
        setCurrentDepth(TOTAL_DEPTH);
        setManualPoint(0);
        startStabilize(0, type);
        if (type === 'forward') setPhase(4);
      }
      if (dir === 'back') {
        setLcdScreen('main');
        setCursor(0);
        setFieldUnlocked(false);
      }
    } else if (lcdScreen === 'collect') {
      if (dir === 'ok' && !autoCollecting) {
        recordManualPoint();
      }
    } else if (lcdScreen === 'remeasure') {
      handleRemeasureNav(dir);
    }
  };

  // --- Params screen navigation ---
  const handleParamsNav = (dir: string) => {
    if (dir === 'back') { setLcdScreen('main'); setCursor(1); setEditingField(null); return; }
    if (editingField !== null) {
      if (dir === 'up' || dir === 'down') {
        const inc = dir === 'up' ? 1 : -1;
        setParams(p => {
          if (editingField === 0) {
            const v = parseInt(p.area) + inc;
            return { ...p, area: String(Math.max(1, Math.min(5, v))).padStart(2, '0') };
          }
          if (editingField === 1) {
            const v = parseInt(p.hole) + inc;
            return { ...p, hole: String(Math.max(1, Math.min(10, v))).padStart(2, '0') };
          }
          if (editingField === 2) {
            return { ...p, depth: Math.max(1, Math.min(50, p.depth + inc)) };
          }
          return p;
        });
      }
      if (dir === 'ok') setEditingField(null);
      return;
    }
    if (dir === 'up') setCursor(p => p > 0 ? p - 1 : 3);
    if (dir === 'down') setCursor(p => p < 3 ? p + 1 : 0);
    if (dir === 'ok') {
      if (cursor === 3) {
        setParamsSaved(true);
        setLcdScreen('main');
        setCursor(1);
      } else {
        setEditingField(cursor);
      }
    }
  };

  // --- Probe screen navigation ---
  const handleProbeNav = (dir: string) => {
    if (dir === 'back') { setLcdScreen('main'); setCursor(2); setEditingField(null); return; }
    if (editingField !== null) {
      if (editingField === 0 && (dir === 'up' || dir === 'down')) {
        setProbe(p => ({ ...p, direction: p.direction === '向上' ? '向下' : '向上' }));
      }
      if (editingField === 1 && (dir === 'up' || dir === 'down')) {
        const inc = dir === 'up' ? 0.01 : -0.01;
        setProbe(p => ({ ...p, calibration: +Math.max(-9.99, Math.min(9.99, p.calibration + inc)).toFixed(2) }));
      }
      if (editingField === 2 && (dir === 'up' || dir === 'down')) {
        const opts = [0.5, 1.0, 2.0];
        setProbe(p => {
          const i = opts.indexOf(p.stepLength);
          const next = dir === 'up' ? (i + 1) % 3 : (i - 1 + 3) % 3;
          return { ...p, stepLength: opts[next] };
        });
      }
      if (dir === 'ok') setEditingField(null);
      return;
    }
    if (dir === 'up') setCursor(p => p > 0 ? p - 1 : 3);
    if (dir === 'down') setCursor(p => p < 3 ? p + 1 : 0);
    if (dir === 'ok') {
      if (cursor === 3) {
        setProbeSaved(true);
        setLcdScreen('main');
        setCursor(2);
      } else {
        setEditingField(cursor);
      }
    }
  };

  // --- Remeasure screen navigation ---
  const handleRemeasureNav = (dir: string) => {
    if (dir === 'back') { setLcdScreen('main'); setCursor(3); setRemeasureEditing(null); return; }
    if (remeasureEditing !== null) {
      if (remeasureEditing === 0 && (dir === 'up' || dir === 'down')) {
        const v = parseInt(remeasureParams.group) + (dir === 'up' ? 1 : -1);
        setRemeasureParams(p => ({ ...p, group: String(Math.max(1, Math.min(99, v))).padStart(2, '0') }));
      }
      if (remeasureEditing === 1 && (dir === 'up' || dir === 'down')) {
        const inc = dir === 'up' ? 0.5 : -0.5;
        setRemeasureParams(p => ({ ...p, depth: Math.max(0, Math.min(TOTAL_DEPTH, +(p.depth + inc).toFixed(1))) }));
        if (+(remeasureParams.depth + (dir === 'up' ? 0.5 : -0.5)).toFixed(1) === ANOMALY_DEPTH) {
          setFoundAnomaly(true);
        }
      }
      if (remeasureEditing === 2 && (dir === 'up' || dir === 'down')) {
        setRemeasureParams(p => ({ ...p, direction: p.direction === '正测' ? '反测' : '正测' }));
      }
      if (dir === 'ok') setRemeasureEditing(null);
      return;
    }
    if (dir === 'up') setRemeasureCursor(p => p > 0 ? p - 1 : 3);
    if (dir === 'down') setRemeasureCursor(p => p < 3 ? p + 1 : 0);
    if (dir === 'ok') {
      if (remeasureCursor === 3) {
        // Execute remeasure
        executeRemeasure();
      } else {
        setRemeasureEditing(remeasureCursor);
      }
    }
  };

  const executeRemeasure = () => {
    if (remeasureParams.depth === ANOMALY_DEPTH) setFoundAnomaly(true);
    setLcdScreen('collect');
    setAutoCollecting(true);
    setTimeout(() => {
      setReadings(prev => {
        const updated = [...prev];
        const idx = updated.findIndex(r => r.depth === remeasureParams.depth);
        if (idx !== -1) {
          const dir = remeasureParams.direction === '反测' ? 'reverse' : 'forward';
          const newVal = getReading(remeasureParams.depth, dir);
          if (remeasureParams.direction === '反测') {
            updated[idx] = { ...updated[idx], reverse: newVal };
          } else {
            updated[idx] = { ...updated[idx], forward: newVal };
          }
          if (updated[idx].forward !== null && updated[idx].reverse !== null) {
            updated[idx] = { ...updated[idx], checksum: +(updated[idx].forward! + updated[idx].reverse!).toFixed(2) };
          }
        }
        return updated;
      });
      setAutoCollecting(false);
      setLcdScreen('main');
      setCursor(0);
    }, 5000);
  };

  // --- Power handler ---
  const handlePower = () => {
    if (phase === 6) {
      // Cleanup phase
      if (isPoweredOn) {
        setIsPoweredOn(false);
        setLcdScreen('off');
        setCleanupOrder(prev => prev.includes('关闭电源') ? prev : [...prev, '关闭电源']);
        setCleanupDone(p => ({ ...p, power: true }));
      }
      return;
    }
    if (!isPoweredOn) {
      setIsPoweredOn(true);
      setBooting(true);
      setCableBeforeBoot(isConnected);
      setStartupOrder(prev => prev.includes('开机') ? prev : [...prev, '开机']);
      setTimeout(() => {
        setBooting(false);
        setLcdScreen('main');
      }, 3000);
    } else {
      setIsPoweredOn(false);
      setLcdScreen('off');
    }
  };

  // --- Cable connect/disconnect ---
  const handleCableClick = () => {
    if (phase === 6) {
      // Cleanup: disconnect
      if (isConnected) {
        setIsConnected(false);
        setCleanupOrder(prev => prev.includes('拔除线材') ? prev : [...prev, '拔除线材']);
        setCleanupDone(p => ({ ...p, cable: true }));
      }
      return;
    }
    if (!isConnected) setShowCableModal(true);
  };

  const handleCableConfirm = () => {
    if (!pendingCable) return;
    setSelectedCable(pendingCable);
    setIsConnected(true);
    setShowCableModal(false);
    setPendingCable(null);
    setStartupOrder(prev => prev.includes('连接线材') ? prev : [...prev, '连接线材']);
    if (isPoweredOn) setLcdScreen('main');
  };

  const handleCableCancel = () => {
    setShowCableModal(false);
    setPendingCable(null);
  };

  // --- Cleanup phase check ---
  useEffect(() => {
    if (phase >= 5 && !isMeasuring && !autoCollecting && lcdScreen === 'main') {
      // Phase 6 unlocked after reverse done
    }
  }, [phase, isMeasuring, autoCollecting, lcdScreen]);

  const canSubmit = phase >= 5 && cleanupDone.power && cleanupDone.cable;

  useEffect(() => {
    if (canSubmit) {
      handleSubmit();
    }
  }, [canSubmit]);

  const enterCleanupPhase = () => setPhase(6);

  // --- Scoring calculation ---
  const calculateScores = () => {
    const s: Record<string, number> = {};
    // 2-2-1: Startup order (connect first = 1pt)
    s['2-2-1'] = cableBeforeBoot === true ? 1 : 0;
    // 2-2-2: Cable selection
    s['2-2-2'] = selectedCable === 'A' ? 1 : 0;
    // 2-2-3~5: Params
    s['2-2-3'] = params.area === '03' ? 1 : 0;
    s['2-2-4'] = params.hole === '06' ? 1 : 0;
    s['2-2-5'] = params.depth === 20 ? 1 : 0;
    // 2-2-6: Direction
    s['2-2-6'] = probe.direction === '向上' ? 2 : 0;
    // 2-2-7: Step length
    s['2-2-7'] = probe.stepLength === 0.5 ? 1 : 0;
    // 2-2-8: Wheel direction (forward)
    s['2-2-8'] = stabilityScores.current['fwd-wheel'] === 'A+' ? 1 : 0;
    // 2-2-9: Forward alignment
    s['2-2-9'] = stabilityScores.current['fwd-alignment'] === 'W' ? 1 : 0;
    // 2-2-10: Monitor interval
    s['2-2-10'] = monitorInterval === '0.5' ? 1 : 0;
    // 2-2-11: Forward point 1 stability
    const fwd0 = stabilityScores.current['forward-0'];
    s['2-2-11'] = fwd0?.stable ? 2 : (fwd0 ? 1 : 0);
    // 2-2-12: Forward points 2-5
    let fwd25 = 0;
    for (let i = 1; i <= 4; i++) {
      const k = stabilityScores.current[`forward-${i}`];
      fwd25 += k?.stable ? 1 : (k ? 0.5 : 0);
    }
    s['2-2-12'] = fwd25;
    // 2-2-13: Reverse alignment
    s['2-2-13'] = cableAlignment === 'W' ? 1 : 0;
    // 2-2-14: Reverse point 1
    const rev0 = stabilityScores.current['reverse-0'];
    s['2-2-14'] = rev0?.stable ? 1 : (rev0 ? 0.5 : 0);
    // 2-2-15: Reverse points 2-5
    let rev25 = 0;
    for (let i = 1; i <= 4; i++) {
      const k = stabilityScores.current[`reverse-${i}`];
      rev25 += k?.stable ? 0.5 : 0;
    }
    s['2-2-15'] = rev25;
    // 2-2-16: Reverse complete
    s['2-2-16'] = phase >= 5 ? 1 : 0;
    // 2-2-17: Found anomaly
    s['2-2-17'] = foundAnomaly ? 1 : 0;
    // 2-2-18: All checksums within threshold
    const allOk = readings.every(r => r.checksum === null || Math.abs(r.checksum) <= CHECKSUM_THRESHOLD);
    s['2-2-18'] = allOk ? 3 : 0;
    // 2-2-19: Cleanup order
    if (cleanupDone.power && cleanupDone.cable) {
      s['2-2-19'] = cleanupOrder[0] === '关闭电源' ? 1 : 0.5;
    } else {
      s['2-2-19'] = 0;
    }
    return s;
  };

  const handleSubmit = () => {
    const scores = calculateScores();
    const total = Object.values(scores).reduce((a, b) => a + b, 0);
    onNext({
      stepId: 'step9',
      stepName: '读数仪设置与数据采集',
      submittedAt: new Date().toISOString(),
      scores,
      totalScore: total,
      maxScore: 27,
      readings,
      params,
      probe,
    });
  };

  // --- LCD Render ---
  const renderLCD = () => {
    if (!isPoweredOn) return <div className="w-full h-full bg-industrial-bg" />;
    if (booting) return (
      <div className="w-full h-full bg-industrial-bg p-1.5 font-mono text-[10px] flex flex-col items-center justify-center text-industrial-fg">
        <div className="text-xs font-bold tracking-wider animate-pulse">欢迎使用</div>
        <div className="text-sm font-bold tracking-widest mt-1">数字式测斜仪</div>
      </div>
    );
    const bg = "w-full h-full bg-industrial-bg p-1.5 font-mono text-[10px] flex flex-col text-industrial-fg";
    const sep = "border-b border-industrial-fg/20 pb-0.5 mb-1";
    const hl = (i: number) => cn("px-1", cursor === i && "bg-industrial-fg text-white");
    const _now = new Date();
    const hdrTs = `${String(_now.getMonth() + 1).padStart(2, '0')}-${String(_now.getDate()).padStart(2, '0')} ${String(_now.getHours()).padStart(2, '0')}:${String(_now.getMinutes()).padStart(2, '0')}`;
    const Header = ({ title }: { title: string }) => (
      <div className={cn(sep, "flex justify-between items-baseline")}>
        <span>{title}</span>
        <span className="text-[7px] opacity-70">{hdrTs} 🔋</span>
      </div>
    );

    switch (lcdScreen) {
      case 'main': return (
        <div className={bg}>
          <Header title="欢迎使用" />
          <div className="flex-1 space-y-0.5">
            {menuItems.map((item, i) => {
              const locked = (i === 0 && phase < 3);
              return <div key={i} className={cn(hl(i), locked && "opacity-30", "flex")}><span className="w-3 shrink-0">{cursor === i ? '>' : ''}</span><span>{item}</span></div>;
            })}
          </div>
        </div>
      );
      case 'params': return (
        <div className={bg}>
          <Header title="测孔参数设置" />
          <div className="flex-1 space-y-1">
            {[
              { label: '测区编号', value: params.area },
              { label: '孔  号', value: params.hole },
              { label: '孔  深', value: `${params.depth} m` },
            ].map((f, i) => (
              <div key={i} className={cn("px-1 flex justify-between", cursor === i && "bg-industrial-fg text-white")}>
                <span className="flex items-center"><span className="w-3 shrink-0">{cursor === i ? '>' : ''}</span><span>{f.label}:</span></span>
                <span className={cn(editingField === i && "animate-pulse font-bold")}>{f.value}</span>
              </div>
            ))}
            <div className={cn("mt-2 px-1 flex", cursor === 3 && "bg-industrial-fg text-white")}><span className="w-3 shrink-0">{cursor === 3 ? '>' : ''}</span><span className="flex-1 text-center border border-industrial-fg/40">[保存]</span></div>
          </div>
        </div>
      );
      case 'time-setting': {
        const now = new Date();
        const timeFields = [
          { label: '年', value: now.getFullYear().toString() },
          { label: '月', value: String(now.getMonth() + 1).padStart(2, '0') },
          { label: '日', value: String(now.getDate()).padStart(2, '0') },
          { label: '时', value: String(now.getHours()).padStart(2, '0') },
          { label: '分', value: String(now.getMinutes()).padStart(2, '0') },
        ];
        return (
          <div className={bg}>
            <Header title="时间设置" />
            <div className="flex-1 space-y-1">
              {timeFields.map((f, i) => (
                <div key={i} className={cn("px-1 flex justify-between", cursor === i && "bg-industrial-fg text-white")}>
                  <span className="flex items-center"><span className="w-3 shrink-0">{cursor === i ? '>' : ''}</span><span>{f.label}:</span></span>
                  <span className={cn(editingField === i && "animate-pulse font-bold underline")}>{f.value}</span>
                </div>
              ))}
              <div className={cn("mt-2 px-1 flex", cursor === 5 && "bg-industrial-fg text-white")}><span className="w-3 shrink-0">{cursor === 5 ? '>' : ''}</span><span className="flex-1 text-center border border-industrial-fg/40">[确认]</span></div>
            </div>
          </div>
        );
      }
      case 'probe': return (
        <div className={bg}>
          <Header title="探头设置" />
          <div className="flex-1 space-y-1">
            {[
              { label: '方向', value: probe.direction },
              { label: '校正', value: probe.calibration.toFixed(2) },
              { label: '步长', value: `${probe.stepLength}m` },
            ].map((f, i) => (
              <div key={i} className={cn("px-1 flex justify-between", cursor === i && "bg-industrial-fg text-white")}>
                <span className="flex items-center"><span className="w-3 shrink-0">{cursor === i ? '>' : ''}</span><span>{f.label}:</span></span>
                <span className={cn(editingField === i && "animate-pulse font-bold")}>{f.value}</span>
              </div>
            ))}
            <div className={cn("mt-2 px-1 flex", cursor === 3 && "bg-industrial-fg text-white")}><span className="w-3 shrink-0">{cursor === 3 ? '>' : ''}</span><span className="flex-1 text-center border border-industrial-fg/40">[保存]</span></div>
          </div>
        </div>
      );
      case 'confirm-fwd': return (
        <div className={bg}>
          <Header title="即将进行" />
          <div className="flex-1 flex flex-col items-center justify-center space-y-1">
            <div className="font-bold">正向测量</div>
            <div className="text-[9px] mt-2">按OK键开始测量</div>
            {(!wheelDirection || !cableAlignment || !monitorInterval) && (
              <div className="text-[8px] text-red-800 mt-1">请先完成现场布置</div>
            )}
          </div>
        </div>
      );
      case 'confirm-rev': return (
        <div className={bg}>
          <Header title="即将进行" />
          <div className="flex-1 flex flex-col items-center justify-center space-y-1">
            <div className="font-bold">反向测量</div>
            <div className="text-[9px] mt-2">按OK键开始测量</div>
            {!cableAlignment && <div className="text-[8px] text-red-800 mt-1">请重新选择靠齐方位</div>}
          </div>
        </div>
      );
      case 'collect': {
        const baseVal = getReading(currentDepth, measureType || 'forward');
        const totalDur = manualPoint === 0 ? 30 : 5;
        const elapsed = totalDur - stabilizeTimer;
        const amp = Math.max(Math.abs(baseVal) * 0.15, 3); // 波动幅度正比于读数绝对值，最小3mm
        const jitter = isStable ? 0 : sensorJitter(elapsed, totalDur, amp);
        const displayMm = baseVal + jitter;
        const displayAngle = mmToAngle(displayMm);
        return (
          <div className={bg}>
            <Header title={measureType === 'forward' ? '正向测量' : '反向测量'} />
            <div className="flex-1 flex flex-col justify-center space-y-1">
              {autoCollecting ? (
                <div className="text-[9px] animate-pulse text-center">正在测量剩余测点…</div>
              ) : showMovePrompt ? (
                <div className="flex-1 flex flex-col items-center justify-center">
                  <div className="text-base font-bold">{probe.direction === '向上' ? '▲ 上提' : '▼ 下放'} {probe.stepLength}m</div>
                  <div className="text-[8px] mt-1 opacity-60">请操作剖面图控制条</div>
                  <div className="text-[8px] mt-0.5 opacity-60">按OK确认</div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-baseline">
                    <span className="text-lg font-bold">{currentDepth.toFixed(1)}m</span>
                    <span>孔{params.hole}</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-lg font-bold">{displayAngle >= 0 ? '+' : ''}{displayAngle.toFixed(2)}°</span>
                    <span>组{String(manualPoint + 1).padStart(2, '0')}</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span>{displayMm >= 0 ? '+' : ''}{displayMm.toFixed(2)}mm</span>
                    <span>☒{String(manualPoint + 1).padStart(2, '0')}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        );
      }
      case 'remeasure': return (
        <div className={bg}>
          <Header title="补测位点" />
          <div className="flex-1 space-y-1">
            {[
              { label: '组号', value: remeasureParams.group },
              { label: '深度', value: `${remeasureParams.depth.toFixed(1)}m` },
              { label: '方向', value: remeasureParams.direction },
            ].map((f, i) => (
              <div key={i} className={cn("px-1 flex justify-between", remeasureCursor === i && "bg-industrial-fg text-white")}>
                <span>{remeasureCursor === i ? '> ' : '  '}{f.label}:</span>
                <span className={cn(remeasureEditing === i && "animate-pulse font-bold")}>{f.value}</span>
              </div>
            ))}
            <div className={cn("mt-2 px-1 text-center border border-industrial-fg/40", remeasureCursor === 3 && "bg-industrial-fg text-white")}>[开始补测]</div>
          </div>
        </div>
      );
      default: return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Task bar */}


      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Profile */}
        <div className="lg:col-span-7 flex flex-col space-y-3">
          <WireframePlaceholder label="D1-D3: 测斜管剖面图（0~20m · 基坑侧/围护侧 · 探头随深度上移）+ 操作控制区（深度显示 · 间距输入 · ▲上提/▼下放 · 📋采集表按钮）" className="min-h-[400px]">
          <TechnicalCard title="测斜管剖面图" className="flex-1 flex flex-col">
            <div className="relative flex-1 min-h-[280px] bg-gray-100 border-2 border-dashed border-gray-400 overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center text-gray-400 font-mono text-xs text-center px-4 pointer-events-none">img:测斜管剖面图（0~20m · 基坑侧/围护侧）</div>
              {/* Depth markers */}
              <div className="absolute inset-0 flex justify-center">
                <div className="relative w-14 h-full">
                  {Array.from({ length: 5 }, (_, i) => i * 5).map(d => (
                    <div key={d} className="absolute w-full border-t border-industrial-fg/20" style={{ top: `${(d / TOTAL_DEPTH) * 100}%` }}>
                      <span className="absolute -left-7 text-[8px] font-mono">{d}m</span>
                    </div>
                  ))}
                  {/* Probe block */}
                  <motion.div animate={{ top: `${(currentDepth / TOTAL_DEPTH) * 100}%` }} transition={{ duration: 0.5 }}
                    className="absolute left-1/2 -translate-x-1/2 w-3 h-10 bg-industrial-fg z-10" />
                  <motion.div animate={{ height: `${(currentDepth / TOTAL_DEPTH) * 100}%` }}
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 bg-industrial-fg/40" />
                </div>
              </div>
            </div>
            {/* Controls */}
            <div className="mt-3 p-3 border-2 border-industrial-fg bg-white">
              <div className="flex items-center justify-between gap-2">
                <div className={cn("flex items-center space-x-3 flex-wrap gap-y-1", !fieldUnlocked && "opacity-40 pointer-events-none")}>
                  <span className="text-[10px] font-mono">深度: <strong className="text-base">{currentDepth.toFixed(1)}m</strong></span>
                  <label className="text-[10px] font-mono">间距: <input type="text" value={monitorInterval} onChange={e => setMonitorInterval(e.target.value)}
                    className="w-12 border border-industrial-fg px-1 text-center" placeholder="请输入" /> m</label>
                  <div className="flex space-x-1">
                    <Button variant="secondary" className="h-7 text-[9px] px-2" onClick={() => {
                      if (showMovePrompt && isMeasuring && measureType) {
                        // Advance to next measurement point
                        const nextPoint = manualPoint + 1;
                        const step = probe.stepLength;
                        setShowMovePrompt(false);
                        setManualPoint(nextPoint);
                        setCurrentDepth(TOTAL_DEPTH - nextPoint * step);
                        startStabilize(nextPoint, measureType);
                        return;
                      }
                      if (isMeasuring && !autoCollecting) return;
                      setShowMovePrompt(false);
                      setCurrentDepth(d => Math.max(0, +(d - (parseFloat(monitorInterval) || 0.5)).toFixed(1)));
                    }}>▲ 上提</Button>
                    <Button variant="secondary" className="h-7 text-[9px] px-2" onClick={() => {
                      setShowMovePrompt(false);
                      setCurrentDepth(d => Math.min(TOTAL_DEPTH, +(d + (parseFloat(monitorInterval) || 0.5)).toFixed(1)));
                    }}>▼ 下放</Button>
                  </div>
                </div>
                <div className="border-l border-industrial-fg/30 pl-3">
                  <Button variant="secondary" className="h-8 text-[9px] px-3" onClick={() => setShowDataTable(true)}>📋 采集表</Button>
                </div>
              </div>
            </div>
          </TechnicalCard>
          </WireframePlaceholder>
        </div>

        {/* Right: Plane + Device */}
        <div className="lg:col-span-5 space-y-4">
          {/* Plane view */}
          <WireframePlaceholder label="M1-M3: 测斜管平面图（等距轴测图 + 旋转控制 + 孔口方位热点）" className="min-h-[80px]">
          <TechnicalCard title="测斜管平面图">
            <div className={cn("relative bg-white border-2 border-industrial-fg flex flex-col", !fieldUnlocked && "opacity-40 pointer-events-none")}>
              {/* 等距轴测图占位区 — 图片放在 public/images/probe-{0|90|180|270}.png */}
              <div className="relative h-60 bg-gray-50 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center text-[9px] font-mono opacity-40 pointer-events-none">
                  [等距轴测图占位 · {probeRotation}°]
                </div>
                <img
                  key={probeRotation}
                  src={`/images/probe-${probeRotation}.png`}
                  alt={`探头旋转 ${probeRotation}°`}
                  className="relative max-h-full max-w-full object-contain transition-opacity duration-200"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'; }}
                  onLoad={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = 'visible'; }}
                />

                {/* 孔口方位热点：仅在确定旋转后显示 */}
                {rotationConfirmed && (['N', 'E', 'S', 'W'] as const).map(dir => {
                  const pos: Record<string, React.CSSProperties> = {
                    N: { top: '28%', left: '50%', transform: 'translateX(-50%)' },
                    E: { top: '50%', right: '28%', transform: 'translateY(-50%)' },
                    S: { bottom: '28%', left: '50%', transform: 'translateX(-50%)' },
                    W: { top: '50%', left: '28%', transform: 'translateY(-50%)' },
                  };
                  return (
                    <button key={dir} onClick={() => setPendingAlignment(dir)}
                      className={cn("absolute w-7 h-7 rounded-full border-2 flex items-center justify-center text-[10px] font-bold z-10 transition-all",
                        cableAlignment === dir
                          ? "bg-industrial-fg text-white border-industrial-fg scale-110"
                          : "bg-white border-industrial-fg/40 hover:border-industrial-fg animate-pulse"
                      )} style={pos[dir]}>{dir}</button>
                  );
                })}

                {/* 控制按钮组 — 浮在图片底部 */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
                  {!rotationConfirmed ? (
                    <>
                      <button onClick={() => setProbeRotation(r => (r + 90) % 360)}
                        className="px-2 py-1 border-2 border-industrial-fg bg-white/90 text-[9px] font-bold font-mono hover:bg-industrial-fg hover:text-white shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] active:shadow-none transition-all">
                        旋转 +90°
                      </button>
                      <button onClick={() => setProbeRotation(r => (r + 270) % 360)}
                        className="px-2 py-1 border-2 border-industrial-fg bg-white/90 text-[9px] font-bold font-mono hover:bg-industrial-fg hover:text-white shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] active:shadow-none transition-all">
                        旋转 −90°
                      </button>
                      <button onClick={() => setRotationConfirmed(true)}
                        className="px-3 py-1 border-2 border-industrial-fg bg-industrial-fg text-white text-[9px] font-bold font-mono shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] active:shadow-none transition-all">
                        确定
                      </button>
                    </>
                  ) : (
                    <button onClick={() => setRotationConfirmed(false)}
                      className="px-3 py-1 border-2 border-industrial-fg bg-white/90 text-[9px] font-bold font-mono hover:bg-industrial-fg hover:text-white shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] active:shadow-none transition-all">
                      重新旋转
                    </button>
                  )}
                </div>
              </div>
            </div>
          </TechnicalCard>
          </WireframePlaceholder>

          {/* Device */}
          <WireframePlaceholder label="I1-I7: 读数仪仿真设备（LCD 屏 · ↑↓←OK 四键 · DC 充电口 · 探头测量口 · USB 通讯口 · ⏻ 电源键）" className="min-h-[320px]">
          <div className="relative bg-white border-2 border-industrial-fg shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] p-4 flex flex-col space-y-3">
            <div className="flex-1 min-h-[190px] border-2 border-industrial-fg p-1 flex">
              <div className="flex-1 border border-industrial-fg/30 overflow-hidden">{renderLCD()}</div>
            </div>
            <div className="text-industrial-fg/30 text-[9px] text-center font-bold font-mono uppercase tracking-[0.3em]">测 斜 仪</div>
            {/* Controls + Ports — single row, grouped */}
            <div className="border-t-2 border-industrial-fg/20 pt-3 mt-1 flex items-end justify-between">
              {/* Group 1: Nav keys */}
              <div className="flex flex-col items-center space-y-1">
                <span className="text-[7px] font-mono opacity-40 uppercase tracking-wider">导航</span>
                <div className="flex space-x-1">
                  <button onClick={() => handleNav('back')} className="w-9 h-9 border-2 border-industrial-fg bg-industrial-bg hover:bg-industrial-fg hover:text-white active:shadow-none transition-all flex items-center justify-center text-industrial-fg text-sm font-bold shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]">←</button>
                  <button onClick={() => handleNav('ok')} className="w-9 h-9 border-2 border-industrial-fg bg-industrial-fg hover:opacity-90 active:shadow-none transition-all flex items-center justify-center text-white text-xs font-bold shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]">OK</button>
                  <button onClick={() => handleNav('up')} className="w-9 h-9 border-2 border-industrial-fg bg-industrial-bg hover:bg-industrial-fg hover:text-white active:shadow-none transition-all flex items-center justify-center text-industrial-fg text-sm font-bold shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]">↑</button>
                  <button onClick={() => handleNav('down')} className="w-9 h-9 border-2 border-industrial-fg bg-industrial-bg hover:bg-industrial-fg hover:text-white active:shadow-none transition-all flex items-center justify-center text-industrial-fg text-sm font-bold shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]">↓</button>
                </div>
              </div>
              <div className="w-px h-10 bg-industrial-fg/20" />
              {/* Group 2: Ports */}
              <div className="flex flex-col items-center space-y-1">
                <span className="text-[7px] font-mono opacity-40 uppercase tracking-wider">接口</span>
                <div className="flex space-x-1 items-end">
                  <div className="flex flex-col items-center space-y-0.5">
                    <div className="w-7 h-7 bg-industrial-bg border-2 border-industrial-fg/30 flex items-center justify-center">
                      <span className="text-[7px] font-mono text-industrial-fg/40">DC</span>
                    </div>
                    <span className="text-[6px] font-mono opacity-40">充电</span>
                  </div>
                  <button onClick={handleCableClick} className="flex flex-col items-center space-y-0.5">
                    <div className={cn(
                      "w-9 h-9 border-2 flex items-center justify-center transition-all",
                      isConnected ? "bg-blue-500 border-blue-600 text-white" : "bg-industrial-bg border-industrial-fg hover:bg-industrial-fg hover:text-white text-industrial-fg"
                    )}>
                      <span className="text-[8px] font-mono font-bold">{isConnected ? '●' : '○'}</span>
                    </div>
                    <span className={cn("text-[6px] font-mono", isConnected ? "text-blue-600 font-bold" : "opacity-40")}>探头</span>
                  </button>
                  <div className="flex flex-col items-center space-y-0.5">
                    <div className="w-7 h-7 bg-industrial-bg border-2 border-industrial-fg/30 flex items-center justify-center">
                      <span className="text-[7px] font-mono text-industrial-fg/40">USB</span>
                    </div>
                    <span className="text-[6px] font-mono opacity-40">通讯</span>
                  </div>
                </div>
              </div>
              <div className="w-px h-10 bg-industrial-fg/20" />
              {/* Group 3: Power */}
              <div className="flex flex-col items-center space-y-1">
                <span className="text-[7px] font-mono opacity-40 uppercase tracking-wider">电源</span>
                <button onClick={handlePower} className={cn(
                  "w-9 h-9 border-2 flex items-center justify-center transition-all shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] active:shadow-none",
                  isPoweredOn ? "bg-red-500 border-red-700 text-white" : "bg-industrial-bg border-industrial-fg text-industrial-fg/40 hover:bg-industrial-fg hover:text-white"
                )}><span className="text-[10px] font-bold">⏻</span></button>
              </div>
            </div>
          </div>
          </WireframePlaceholder>
        </div>
      </div>

      {/* Cleanup */}
      {phase >= 5 && phase < 6 && (
        <div className="flex justify-end">
          <Button variant="secondary" onClick={enterCleanupPhase} className="text-[10px]">进入收工阶段</Button>
        </div>
      )}

      {/* Data table modal */}
      <Modal
        isOpen={showDataTable}
        onClose={() => setShowDataTable(false)}
        title={`数据采集表 — 测区${params.area} · 孔CX-${params.hole} · 孔深${params.depth}m · 间距${probe.stepLength}m`}
        maxWidth="max-w-3xl"
      >
        <div className="overflow-auto max-h-[60vh] border border-industrial-fg/10">
          <table className="w-full text-[10px] font-mono text-center border-collapse">
            <thead className="bg-gray-100 sticky top-0 z-20">
              <tr className="border-b border-industrial-fg/20">
                <th className="p-2 border-r border-industrial-fg/10">深度(m)</th>
                <th className="p-2 border-r border-industrial-fg/10">组号</th>
                <th className="p-2 border-r border-industrial-fg/10 bg-blue-50">正测(mm)</th>
                <th className="p-2 border-r border-industrial-fg/10 bg-orange-50">反测(mm)</th>
                <th className="p-2">校验和(mm)</th>
              </tr>
            </thead>
            <tbody>
              {readings.map((r, i) => {
                const isCurrent = r.depth === currentDepth && isMeasuring;
                return (
                  <tr key={i} className={cn("border-b border-industrial-fg/5", isCurrent && "bg-blue-50")}>
                    <td className="p-1.5 border-r border-industrial-fg/10 font-bold">{r.depth.toFixed(1)}</td>
                    <td className="p-1.5 border-r border-industrial-fg/10">{r.group}</td>
                    <td className="p-1.5 border-r border-industrial-fg/10">{r.forward !== null ? r.forward.toFixed(2) : '----'}</td>
                    <td className="p-1.5 border-r border-industrial-fg/10">{r.reverse !== null ? r.reverse.toFixed(2) : '----'}</td>
                    <td className="p-1.5 font-bold">
                      {r.checksum !== null ? r.checksum.toFixed(2) : '----'}
                    </td>
                  </tr>
                );
              })}
              {readings.length === 0 && (
                <tr><td colSpan={5} className="p-8 text-center opacity-30 italic">暂无采集数据</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {readings.length > 0 && (
          <div className="pt-3 mt-3 border-t border-industrial-fg/10 text-[10px] font-mono">
            <span>共 {readings.length} 行</span>
          </div>
        )}
      </Modal>

      {/* Cable selection modal — Mode C' (图文卡片答题浮层) */}
      <Modal isOpen={showCableModal} onClose={handleCableCancel} title="线材选型" maxWidth="max-w-2xl">
        <div className="space-y-4">
          <p className="text-xs font-bold">请选择与读数仪测量接口匹配的线材。</p>
          <div className="space-y-2">
            {cableOptions.map(opt => (
              <button
                key={opt.id}
                onClick={() => setPendingCable(opt.id)}
                className={cn(
                  "w-full text-left p-4 border transition-all flex items-start space-x-4",
                  pendingCable === opt.id
                    ? "border-industrial-fg bg-industrial-fg text-white"
                    : "border-industrial-fg/10 hover:border-industrial-fg/30"
                )}
              >
                <div className="w-4 h-4 rounded-full border-2 mt-1 flex items-center justify-center flex-shrink-0" style={{ borderColor: pendingCable === opt.id ? 'white' : '' }}>
                  {pendingCable === opt.id && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
                <div className="w-16 h-12 bg-industrial-bg/40 border border-current/20 flex items-center justify-center text-2xl flex-shrink-0">🔌</div>
                <div className="flex-1">
                  <div className="text-xs font-bold mb-1">{opt.id}. {opt.name}</div>
                  <p className={cn("text-[10px] leading-relaxed", pendingCable === opt.id ? "opacity-80" : "opacity-60")}>{opt.desc}</p>
                </div>
              </button>
            ))}
          </div>
          <div className="flex justify-center pt-4 border-t border-industrial-fg/10">
            <Button onClick={handleCableConfirm} disabled={!pendingCable} className="px-12">确认</Button>
          </div>
        </div>
      </Modal>

      {/* 模式B — 线材靠齐方位选择确认 */}
      <Modal isOpen={!!pendingAlignment} onClose={() => setPendingAlignment(null)} title="线材靠齐方位">
        <div className="space-y-4">
          <p className="text-sm leading-relaxed">
            您即将将线材靠齐方位设置为 <strong className="text-base">{pendingAlignment}</strong> 方向。
            线材应沿测斜管导槽方向靠齐，确保探头导轮能顺利滑入导槽。
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Button onClick={() => { setCableAlignment(pendingAlignment); setPendingAlignment(null); }}>选择</Button>
            <Button variant="secondary" onClick={() => setPendingAlignment(null)}>取消</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
