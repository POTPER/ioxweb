import { monitoringPeriodRows } from './trainingContent';

// ===== Real monitoring data from CSV =====
// CX-06 (03 area / 06 hole) | CX-03E | 20.0m hole depth | 0.5m interval | 8 periods

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

type MonitoringPeriodRow = {
  period: number;
  date: string;
  depth: number;
  aPlus: number | null;
  aMinus: number | null;
  checksum: number | null;
  bPlus: number | null;
  bMinus: number | null;
  cumDisp: number;
  change: number;
  rate: number;
};

export type MonitoringRawReading = {
  depth: number;
  aPlus: number | null;
  aMinus: number | null;
  checksum: number | null;
  bPlus: number | null;
  bMinus: number | null;
};

const parseOptionalNumber = (value?: string) => {
  const trimmed = value?.trim();
  return trimmed ? Number(trimmed) : null;
};

const periodRows: MonitoringPeriodRow[] = monitoringPeriodRows.map(row => ({
  period: Number(row.period),
  date: row.date,
  depth: Number(row.depth),
  aPlus: parseOptionalNumber(row.aPlus),
  aMinus: parseOptionalNumber(row.aMinus),
  checksum: parseOptionalNumber(row.checksum),
  bPlus: parseOptionalNumber(row.bPlus),
  bMinus: parseOptionalNumber(row.bMinus),
  cumDisp: Number(row.cumDisp),
  change: Number(row.change),
  rate: Number(row.rate),
}));

const periodNumbers = Array.from(new Set(periodRows.map(row => row.period))).sort((a, b) => a - b);
const rowsByPeriod = new Map(
  periodNumbers.map(period => [
    period,
    periodRows
      .filter(row => row.period === period)
      .sort((left, right) => left.depth - right.depth),
  ])
);

export const PERIODS = periodNumbers.length;
export const DEPTHS: number[] = rowsByPeriod.get(periodNumbers[0])?.map(row => row.depth) ?? [];
export const DEPTH_POINTS = DEPTHS.length;
export const PERIOD_DATES = periodNumbers.map(period => rowsByPeriod.get(period)?.[0]?.date ?? '');
export const PERIOD_INTERVALS = PERIOD_DATES.map((date, index) => {
  if (index === 0 || !date || !PERIOD_DATES[index - 1]) {
    return 0;
  }

  const currentTime = new Date(`${date}T00:00:00`).getTime();
  const previousTime = new Date(`${PERIOD_DATES[index - 1]}T00:00:00`).getTime();
  return Math.round((currentTime - previousTime) / 86400000);
});

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

// Cumulative displacement (mm) per period. Index 0 = 0.0m, index 40 = 20.0m.
export const CUM_DISP: number[][] = periodNumbers.map(period => (
  rowsByPeriod.get(period)?.map(row => row.cumDisp) ?? []
));

/** Get cumulative displacement at a specific depth for a given period (1-indexed). */
export function getCumDisp(period: number, depthIndex: number): number {
  return CUM_DISP[period - 1]?.[depthIndex] ?? 0;
}

/** Get the full row data for a specific period with change and rate vs previous period. */
export function getPeriodRows(period: number): { depth: number; cumDisp: number; change: number; rate: number }[] {
  return (rowsByPeriod.get(period) ?? []).map(row => ({
    depth: row.depth,
    cumDisp: row.cumDisp,
    change: row.change,
    rate: row.rate,
  }));
}

/** Get raw inclinometer readings for a period/depth pair, when present in the CSV. */
export function getMonitoringRawReading(period: number, depth: number): MonitoringRawReading | undefined {
  const row = rowsByPeriod.get(period)?.find(item => Math.abs(item.depth - depth) < 0.001);

  if (!row) {
    return undefined;
  }

  return {
    depth: row.depth,
    aPlus: row.aPlus,
    aMinus: row.aMinus,
    checksum: row.checksum,
    bPlus: row.bPlus,
    bMinus: row.bMinus,
  };
}

/** Get depths in the latest period that exceed the warning threshold. */
export function getWarningDepths(): number[] {
  const threshold = MONITORING.controlValue * MONITORING.warningRatio;
  const latestRows = rowsByPeriod.get(PERIODS) ?? [];
  return latestRows.filter(row => row.cumDisp >= threshold).map(row => row.depth);
}
