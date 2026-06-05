/**
 * Step9 状态快照 — 用于产品说明 Studio 与 dev 预览
 * 快照 = 可序列化的 React 状态，非截图
 */

export type Step9Phase = 1 | 2 | 3 | 4 | 5 | 6;

export type Step9LcdScreen =
  | 'off'
  | 'main'
  | 'params'
  | 'probe'
  | 'confirm-fwd'
  | 'confirm-rev'
  | 'collect'
  | 'remeasure'
  | 'auto-collect'
  | 'time-setting';

export type Step9Reading = {
  depth: number;
  group: string;
  forward: number | null;
  reverse: number | null;
  checksum: number | null;
};

export type Step9Snapshot = {
  id: string;
  title: string;
  subtitle?: string;
  tags?: string[];

  phase: Step9Phase;
  isPoweredOn: boolean;
  isConnected: boolean;
  booting?: boolean;
  lcdScreen: Step9LcdScreen;

  showCableModal?: boolean;
  selectedCable?: string | null;

  params: { area: string; hole: string; depth: number };
  paramsSaved: boolean;
  probe: { direction: '向上' | '向下'; calibration: number; stepLength: number };
  probeSaved: boolean;

  fieldUnlocked?: boolean;
  probeRotation?: number;
  rotationConfirmed?: boolean;
  cableAlignment?: 'N' | 'S' | 'E' | 'W' | null;
  monitorInterval?: string;

  measureType?: 'forward' | 'reverse' | null;
  manualPoint?: number;
  currentDepth?: number;
  isMeasuring?: boolean;
  isStable?: boolean;
  stabilizeTimer?: number;
  showMovePrompt?: boolean;
  autoCollecting?: boolean;

  remeasureParams?: { group: string; depth: number; direction: '正测' | '反测' };
  foundAnomaly?: boolean;

  cleanupDone?: { power: boolean; cable: boolean };

  /** 若提供则直接使用；否则按 probe.stepLength 生成空表 */
  readings?: Step9Reading[];
};

export const TOTAL_DEPTH = 20;
export const ANOMALY_DEPTH = 12.5;

export function buildEmptyReadings(stepLength: number, group = '05'): Step9Reading[] {
  const pts: Step9Reading[] = [];
  for (let d = TOTAL_DEPTH; d >= 0; d = +(d - stepLength).toFixed(1)) {
    pts.push({ depth: d, group, forward: null, reverse: null, checksum: null });
  }
  return pts;
}

const wrongParams = { area: '01', hole: '01', depth: 25 };
const correctParams = { area: '03', hole: '06', depth: 20 };
const wrongProbe = { direction: '向下' as const, calibration: 0, stepLength: 1.0 };
const correctProbe = { direction: '向上' as const, calibration: 0, stepLength: 0.5 };

export const STEP9_SNAPSHOTS: Step9Snapshot[] = [
  {
    id: 'S09-01',
    title: '初始状态',
    subtitle: '未接线、LCD 关闭',
    tags: ['setup'],
    phase: 1,
    isPoweredOn: false,
    isConnected: false,
    lcdScreen: 'off',
    params: wrongParams,
    paramsSaved: false,
    probe: wrongProbe,
    probeSaved: false,
  },
  {
    id: 'S09-02',
    title: '线材选择',
    subtitle: '探头接口线材弹窗',
    tags: ['setup'],
    phase: 1,
    isPoweredOn: false,
    isConnected: false,
    lcdScreen: 'off',
    showCableModal: true,
    params: wrongParams,
    paramsSaved: false,
    probe: wrongProbe,
    probeSaved: false,
  },
  {
    id: 'S09-03',
    title: '测孔参数（错误默认）',
    subtitle: '01 区 / 01 孔 / 25 m',
    tags: ['setup'],
    phase: 2,
    isPoweredOn: true,
    isConnected: true,
    lcdScreen: 'params',
    selectedCable: 'A',
    params: wrongParams,
    paramsSaved: false,
    probe: wrongProbe,
    probeSaved: false,
  },
  {
    id: 'S09-04',
    title: '探头设置（错误默认）',
    subtitle: '向下 / 步长 1.0 m',
    tags: ['setup'],
    phase: 2,
    isPoweredOn: true,
    isConnected: true,
    lcdScreen: 'probe',
    selectedCable: 'A',
    params: wrongParams,
    paramsSaved: false,
    probe: wrongProbe,
    probeSaved: false,
  },
  {
    id: 'S09-05',
    title: '主菜单',
    subtitle: '测孔与探头参数已保存',
    tags: ['setup'],
    phase: 3,
    isPoweredOn: true,
    isConnected: true,
    lcdScreen: 'main',
    selectedCable: 'A',
    params: correctParams,
    paramsSaved: true,
    probe: correctProbe,
    probeSaved: true,
    readings: buildEmptyReadings(0.5),
  },
  {
    id: 'S09-06',
    title: '正测确认 · 未布置',
    subtitle: '待完成朝向与线材靠齐',
    tags: ['forward', 'field'],
    phase: 3,
    isPoweredOn: true,
    isConnected: true,
    lcdScreen: 'confirm-fwd',
    selectedCable: 'A',
    params: correctParams,
    paramsSaved: true,
    probe: correctProbe,
    probeSaved: true,
    fieldUnlocked: true,
    probeRotation: 0,
    rotationConfirmed: false,
    cableAlignment: null,
    monitorInterval: '',
    readings: buildEmptyReadings(0.5),
  },
  {
    id: 'S09-07',
    title: '正测确认 · 布置完成',
    subtitle: 'A 向 + W 靠齐 + 0.5 m 间距',
    tags: ['forward', 'field'],
    phase: 3,
    isPoweredOn: true,
    isConnected: true,
    lcdScreen: 'confirm-fwd',
    selectedCable: 'A',
    params: correctParams,
    paramsSaved: true,
    probe: correctProbe,
    probeSaved: true,
    fieldUnlocked: true,
    probeRotation: 0,
    rotationConfirmed: true,
    cableAlignment: 'W',
    monitorInterval: '0.5',
    readings: buildEmptyReadings(0.5),
  },
  {
    id: 'S09-08',
    title: '正测采集 · 20 m',
    subtitle: '首点稳定 30 s 倒计时中',
    tags: ['forward', 'collect'],
    phase: 4,
    isPoweredOn: true,
    isConnected: true,
    lcdScreen: 'collect',
    selectedCable: 'A',
    params: correctParams,
    paramsSaved: true,
    probe: correctProbe,
    probeSaved: true,
    fieldUnlocked: true,
    probeRotation: 0,
    rotationConfirmed: true,
    cableAlignment: 'W',
    monitorInterval: '0.5',
    measureType: 'forward',
    manualPoint: 0,
    currentDepth: 20,
    isMeasuring: true,
    isStable: false,
    stabilizeTimer: 18,
    showMovePrompt: false,
    autoCollecting: false,
    readings: buildEmptyReadings(0.5),
  },
  {
    id: 'S09-09',
    title: '正测 · 上提提示',
    subtitle: '20 m 已读，待上提 0.5 m',
    tags: ['forward', 'collect'],
    phase: 4,
    isPoweredOn: true,
    isConnected: true,
    lcdScreen: 'collect',
    selectedCable: 'A',
    params: correctParams,
    paramsSaved: true,
    probe: correctProbe,
    probeSaved: true,
    fieldUnlocked: true,
    probeRotation: 0,
    rotationConfirmed: true,
    cableAlignment: 'W',
    monitorInterval: '0.5',
    measureType: 'forward',
    manualPoint: 0,
    currentDepth: 20,
    isMeasuring: true,
    isStable: true,
    stabilizeTimer: 0,
    showMovePrompt: true,
    autoCollecting: false,
    readings: (() => {
      const r = buildEmptyReadings(0.5);
      const idx = r.findIndex(row => row.depth === 20);
      if (idx >= 0) r[idx] = { ...r[idx], forward: 0.38 };
      return r;
    })(),
  },
  {
    id: 'S09-10',
    title: '反测确认',
    subtitle: '探头 180°，待选靠齐方位',
    tags: ['reverse', 'field'],
    phase: 3,
    isPoweredOn: true,
    isConnected: true,
    lcdScreen: 'confirm-rev',
    selectedCable: 'A',
    params: correctParams,
    paramsSaved: true,
    probe: correctProbe,
    probeSaved: true,
    fieldUnlocked: true,
    probeRotation: 180,
    rotationConfirmed: true,
    cableAlignment: null,
    monitorInterval: '0.5',
    readings: buildEmptyReadings(0.5),
  },
  {
    id: 'S09-11',
    title: '补测 12.5 m',
    subtitle: '组 05 · 反测',
    tags: ['anomaly', 'remeasure'],
    phase: 5,
    isPoweredOn: true,
    isConnected: true,
    lcdScreen: 'remeasure',
    selectedCable: 'A',
    params: correctParams,
    paramsSaved: true,
    probe: correctProbe,
    probeSaved: true,
    remeasureParams: { group: '05', depth: 12.5, direction: '反测' },
    foundAnomaly: true,
    readings: buildEmptyReadings(0.5),
  },
  {
    id: 'S09-12',
    title: '收工',
    subtitle: '先关电源，再拔线材',
    tags: ['cleanup'],
    phase: 6,
    isPoweredOn: true,
    isConnected: true,
    lcdScreen: 'main',
    selectedCable: 'A',
    params: correctParams,
    paramsSaved: true,
    probe: correctProbe,
    probeSaved: true,
    cleanupDone: { power: false, cable: false },
    readings: buildEmptyReadings(0.5),
  },
];

export const STEP9_SNAPSHOT_BY_ID = Object.fromEntries(
  STEP9_SNAPSHOTS.map(s => [s.id, s])
) as Record<string, Step9Snapshot>;

/** devAutoStart 等效快照 */
export const STEP9_DEV_AUTOSTART_SNAPSHOT: Step9Snapshot = STEP9_SNAPSHOT_BY_ID['S09-06'];
