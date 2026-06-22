export type PracticeInstrumentId = 'reboundHammer' | 'carbonation' | 'inclinometer';

export const PRACTICE_PLATFORM_TITLE = '城市更新检测监测实训平台';

export const PRACTICE_BACK_CONFIRM_MESSAGE =
  '确认返回练习系统？当前练习进度已自动保存。';

export interface PracticeInstrument {
  id: PracticeInstrumentId;
  name: string;
  available: boolean;
  taskInfo: { label: string; value: string }[];
  appStepId?: '9';
  taskDescription?: string;
}

export const PRACTICE_INSTRUMENTS: PracticeInstrument[] = [
  {
    id: 'reboundHammer',
    name: '回弹仪',
    available: false,
    taskInfo: [
      { label: '检测对象', value: '剪力墙' },
      { label: '检测目的', value: '检测混凝土抗压强度' },
      { label: '检测方法', value: '回弹法' },
      { label: '检测要求', value: '按提示完成回弹检测练习' },
    ],
  },
  {
    id: 'carbonation',
    name: '碳化深度测量仪',
    available: false,
    taskInfo: [
      { label: '检测对象', value: '混凝土构件' },
      { label: '检测目的', value: '测定混凝土碳化深度' },
      { label: '检测方法', value: '酚酞指示剂法' },
      { label: '检测要求', value: '按提示完成碳化深度测量练习' },
    ],
  },
  {
    id: 'inclinometer',
    name: '测斜仪',
    available: true,
    appStepId: '9',
    taskDescription:
      '本项目为一座开挖深度约 20 m 的基坑，需对围护结构开展深层水平位移测斜监测。本期观测对象为 03 区 06 号测斜孔（孔号 06，标准编号 CX-06），测量编号 03。查阅上期观测记录，该孔正测时测斜仪线材靠齐西侧。请使用读数仪，按规范完成设备设置、线材连接、正反测采集及数据记录的全部操作流程。',
    taskInfo: [
      { label: '监测对象', value: '深基坑/边坡' },
      { label: '监测目的', value: '监测内部水平位移' },
      { label: '监测方法', value: '滑动式测斜法' },
      { label: '监测要求', value: '按提示完成测斜练习' },
    ],
  },
];

export const getPracticeInstrument = (id: PracticeInstrumentId): PracticeInstrument | undefined =>
  PRACTICE_INSTRUMENTS.find(item => item.id === id);
