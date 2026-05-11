export type ReportStepMeta = {
  stepId: string;
  reportStepId: string;
  outlineCode?: string;
  name: string;
  maxScore: number;
};

export const reportStepMap: Record<string, ReportStepMeta> = {
  'prep.tech': {
    stepId: 'prep.tech',
    reportStepId: 'prep.tech',
    outlineCode: 'Q01',
    name: '前期技术准备',
    maxScore: 3,
  },
  'prep.material': {
    stepId: 'prep.material',
    reportStepId: 'prep.material',
    outlineCode: 'Q02',
    name: '取料区域',
    maxScore: 2,
  },
  'prep.assembly': {
    stepId: 'prep.assembly',
    reportStepId: 'prep.assembly',
    outlineCode: 'Q03',
    name: '管材拼装',
    maxScore: 4,
  },
  'prep.cage': {
    stepId: 'prep.cage',
    reportStepId: 'prep.cage',
    outlineCode: 'Q04',
    name: '导管安装到钢筋笼',
    maxScore: 4,
  },
  'prep.inspection': {
    stepId: 'prep.inspection',
    reportStepId: 'prep.inspection',
    outlineCode: 'Q05',
    name: '管口验收',
    maxScore: 4,
  },
  'prep.connectivity': {
    stepId: 'prep.connectivity',
    reportStepId: '4.2.1-3-2',
    outlineCode: 'Q06',
    name: '通畅性测试',
    maxScore: 4,
  },
  'prep.initialMeasurement': {
    stepId: 'prep.initialMeasurement',
    reportStepId: '4.2.1-4',
    outlineCode: 'Q07',
    name: '初测(基准测量)',
    maxScore: 4,
  },
  'acq.safety': {
    stepId: 'acq.safety',
    reportStepId: 'acq.safety',
    outlineCode: 'Q08',
    name: '测前准备与安全防护',
    maxScore: 6,
  },
  'acq.instrument': {
    stepId: 'acq.instrument',
    reportStepId: '4.2.2-2',
    outlineCode: 'Q09',
    name: '读数仪设置与数据采集',
    maxScore: 26,
  },
};
