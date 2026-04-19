// ===== Real monitoring data from 监测数据.md =====
// CX-06（03区06孔）| CX-03E | 孔深 20.0m | 间隔 0.5m | 8期数据

export const MONITORING = {
  projectName: 'XX市轨道交通X号线XX站深基坑工程',
  holeId: 'CX-06',
  instrument: 'CX-03E',
  serialNo: 'CX-03E-2024-0087',
  calibrationExpiry: '2026-06-30',
  controlValue: 50,
  warningRatio: 0.70,
  rateThreshold: 3,
} as const;

export const PERIODS = 8;
export const DEPTH_POINTS = 41; // 0.0m ~ 20.0m, step 0.5m

export const PERIOD_DATES = [
  '2026-03-01', '2026-03-05', '2026-03-10', '2026-03-15',
  '2026-03-20', '2026-03-24', '2026-03-27', '2026-04-03',
];

export const PERIOD_INTERVALS = [0, 4, 5, 5, 5, 4, 3, 7];

export const PERIOD_CONDITIONS = [
  '第一层土方开挖完成，安装第一道钢支撑',
  '第二层土方开挖中',
  '第二层土方开挖完成，安装第二道钢支撑',
  '第三层土方开挖中',
  '第三层土方开挖完成',
  '第四层土方开挖中，安装第三道钢支撑',
  '第四层土方开挖至设计标高附近',
  '第四层土方开挖基本完成，基底垫层施工准备',
];

export const EXCAVATION_DEPTHS = [5.0, 7.0, 8.5, 10.0, 11.5, 13.0, 14.5, 16.0];

// Depths: 0.0m, 0.5m, 1.0m, ..., 20.0m (41 points)
// 0.0m is linearly extrapolated from 0.5m & 1.0m
// 20.0m is fixed at 0.00 (anchor point)
export const DEPTHS: number[] = Array.from({ length: 41 }, (_, i) => Number((i * 0.5).toFixed(1)));

// Cumulative displacement (mm) per period. Index 0 = 0.0m … 40 = 20.0m
export const CUM_DISP: number[][] = [
  // Period 1
  [0.06, 0.12,0.18,0.22,0.25,0.30,0.38,0.48,0.60,0.75,0.90,1.08,1.28,1.48,1.68,1.88,2.05,2.20,2.32,2.55,2.60,2.52,2.32,2.18,2.02,1.82,1.60,1.38,1.23,0.95,0.78,0.62,0.48,0.38,0.28,0.20,0.12,0.08,0.04,0.02,0.00],
  // Period 2
  [0.13, 0.25,0.37,0.45,0.52,0.62,0.78,0.98,1.25,1.55,1.88,2.25,2.65,3.05,3.45,3.85,4.20,4.50,4.75,5.30,5.40,5.25,4.75,4.48,4.15,3.75,3.30,2.85,2.54,1.95,1.58,1.25,0.98,0.75,0.55,0.38,0.25,0.15,0.08,0.04,0.00],
  // Period 3
  [0.21, 0.38,0.55,0.68,0.80,0.95,1.20,1.52,1.95,2.42,2.95,3.55,4.18,4.82,5.48,6.12,6.70,7.18,7.58,8.45,8.60,8.35,7.55,7.12,6.60,5.98,5.28,4.55,4.08,3.12,2.52,1.98,1.55,1.18,0.85,0.58,0.40,0.22,0.12,0.05,0.00],
  // Period 4
  [0.28, 0.50,0.72,0.90,1.05,1.28,1.62,2.08,2.68,3.35,4.10,4.95,5.85,6.78,7.72,8.65,9.50,10.22,10.82,12.00,12.20,11.90,10.80,10.18,9.42,8.52,7.50,6.45,5.76,4.40,3.52,2.78,2.15,1.62,1.18,0.80,0.52,0.30,0.15,0.08,0.00],
  // Period 5
  [0.35, 0.61,0.87,1.10,1.30,1.60,2.05,2.65,3.42,4.32,5.32,6.45,7.65,8.90,10.18,11.45,12.62,13.62,14.45,16.00,16.20,15.85,14.42,13.58,12.55,11.32,9.95,8.55,7.63,5.82,4.65,3.65,2.82,2.12,1.52,1.02,0.65,0.38,0.20,0.10,0.00],
  // Period 6
  [0.41, 0.72,1.03,1.30,1.55,1.92,2.48,3.22,4.18,5.32,6.60,8.05,9.60,11.22,12.88,14.55,16.10,17.45,18.58,20.70,21.00,20.55,18.55,17.42,16.05,14.45,12.68,10.85,9.62,7.32,5.82,4.55,3.48,2.60,1.85,1.25,0.80,0.45,0.22,0.12,0.00],
  // Period 7
  [0.48, 0.84,1.20,1.52,1.85,2.28,2.98,3.90,5.10,6.55,8.20,10.10,12.12,14.25,16.42,18.62,20.72,22.55,24.08,26.85,27.20,26.65,23.95,22.42,20.58,18.45,16.12,13.72,12.11,9.15,7.22,5.62,4.28,3.18,2.25,1.50,0.95,0.52,0.28,0.14,0.00],
  // Period 8
  [0.54, 0.97,1.40,1.78,2.20,2.72,3.58,4.72,6.22,8.05,10.15,12.62,15.25,18.05,20.95,23.88,26.72,29.22,31.32,35.50,36.00,35.20,31.00,28.88,26.35,23.52,20.45,17.32,15.20,11.42,8.95,6.92,5.22,3.85,2.72,1.80,1.10,0.62,0.32,0.16,0.00],
];

// ===== Helper functions =====

/** Get cumulative displacement at a specific depth for a given period (1-indexed) */
export function getCumDisp(period: number, depthIndex: number): number {
  return CUM_DISP[period - 1][depthIndex];
}

/** Get the full row data for a specific period with change and rate vs previous period */
export function getPeriodRows(period: number): { depth: number; cumDisp: number; prevCumDisp: number; change: number; rate: number }[] {
  const curr = CUM_DISP[period - 1];
  const prev = period > 1 ? CUM_DISP[period - 2] : curr.map(() => 0);
  const interval = PERIOD_INTERVALS[period - 1] || 7;
  return DEPTHS.map((d, i) => {
    const cumDisp = curr[i];
    const prevCumDisp = prev[i];
    const change = Number((cumDisp - prevCumDisp).toFixed(2));
    const rate = interval > 0 ? Number((change / interval).toFixed(2)) : 0;
    return { depth: d, cumDisp, prevCumDisp, change, rate };
  });
}

/** Get depths in period 8 that exceed the warning threshold (35mm) */
export function getWarningDepths(): number[] {
  const threshold = MONITORING.controlValue * MONITORING.warningRatio;
  return DEPTHS.filter((_, i) => CUM_DISP[PERIODS - 1][i] >= threshold);
}
