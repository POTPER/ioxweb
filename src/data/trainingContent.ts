import stepsCsv from './training/steps.csv?raw';
import hotspotsCsv from './training/hotspots.csv?raw';
import questionsCsv from './training/questions.csv?raw';
import optionsCsv from './training/options.csv?raw';
import scoringOptionsCsv from './training/scoringOptions.csv?raw';
import uiLabelsCsv from './training/uiLabels.csv?raw';
import initialMeasurementDataCsv from './training/initialMeasurementData.csv?raw';
import monitoringPeriodDataCsv from './training/monitoringPeriodData.csv?raw';
import dataProcessingDataCsv from './training/dataProcessingData.csv?raw';
import reportCompilationDataCsv from './training/reportCompilationData.csv?raw';
import resourcesCsv from './training/resources.csv?raw';
import { reportStepMap } from './reportStructure';
import type { ChoiceQuestionConfig, FillRangeQuestionConfig, FillValueQuestionConfig, QuestionConfig, StepScoringConfig } from './scoringConfig';

export type TrainingStepContent = {
  stepId: string;
  appStepId: string;
  outlineCode: string;
  stepName: string;
  section: string;
  taskDescription: string;
  diagramTitle: string;
  diagramLabel: string;
};

export type TrainingHotspotContent = {
  stepId: string;
  hotspotId: string;
  label: string;
  desc: string;
  x: string;
  y: string;
  width?: string;
  height?: string;
  questionId?: string;
};

export type TrainingQuestionContent = {
  stepId: string;
  questionId: string;
  label: string;
  prompt: string;
  type: string;
  maxScore: string;
  correctAnswer: string;
  correctRangeMin: string;
  correctRangeMax: string;
  unit: string;
  analysis: string;
};

type RawTrainingQuestionContent = Partial<TrainingQuestionContent> & {
  questionLabel?: string;
  questionDesc?: string;
  questionType?: string;
};

export type TrainingOptionContent = {
  questionId: string;
  value: string;
  code: string;
  label: string;
  desc: string;
  hotspotId?: string;
  imageResourceId?: string;
  x?: string;
  y?: string;
};

type RawTrainingOptionContent = {
  questionId: string;
  optionId: string;
};

type ScoringOptionContent = {
  questionId: string;
  任务名称: string;
  选项ID: string;
  选项名称: string;
  选项内容: string;
  选项描述: string;
  选项坐标X: string;
  选项坐标Y: string;
  选项图片: string;
};

export type InitialMeasurementDataRow = {
  depth: string;
  a: string;
  b: string;
};

export type MonitoringPeriodDataRow = {
  period: string;
  date: string;
  previousPeriod: string;
  previousDate: string;
  intervalDays: string;
  depth: string;
  cumDisp: string;
  prevCumDisp: string;
  change: string;
  rate: string;
};

export type DataProcessingDataRow = {
  period: string;
  date: string;
  depth: string;
  forward: string;
  reverse: string;
  checksum: string;
  displacement: string;
  isMissing: string;
};

export type ReportCompilationDataRow = {
  period: string;
  date: string;
  previousPeriod: string;
  previousDate: string;
  intervalDays: string;
  depth: string;
  cumDisp: string;
  prevCumDisp: string;
  change: string;
  rate: string;
  isChangeMissing: string;
  isRateMissing: string;
};

export type TrainingResourceContent = {
  resourceId: string;
  stepId: string;
  sourceKey: string;
  type: string;
  title: string;
  displayLabel: string;
  usage: string;
  adminUploadHint: string;
  visualDescription: string;
  promptZh: string;
  promptEn: string;
  aspectRatio: string;
  status: string;
};

const parseCsvLine = (line: string) => {
  const values: string[] = [];
  let current = '';
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === ',' && !quoted) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
};

const parseCsv = <T extends Record<string, string | undefined>>(csv: string): T[] => {
  const lines = csv.trim().split(/\r?\n/).filter(Boolean);
  const headers = parseCsvLine(lines[0]).map(header => header.replace(/^\uFEFF/, ''));

  return lines.slice(1).map(line => {
    const values = parseCsvLine(line);
    return headers.reduce((row, header, index) => ({
      ...row,
      [header]: values[index] ?? '',
    }), {} as T);
  });
};

export const trainingSteps = parseCsv<TrainingStepContent>(stepsCsv);
export const trainingHotspots = parseCsv<TrainingHotspotContent>(hotspotsCsv);
const rawTrainingQuestions = parseCsv<RawTrainingQuestionContent>(questionsCsv);
const rawTrainingOptions = parseCsv<RawTrainingOptionContent>(optionsCsv);
const scoringOptionRows = parseCsv<ScoringOptionContent>(scoringOptionsCsv).filter(row => row.questionId);
export const initialMeasurementDataRows = parseCsv<InitialMeasurementDataRow>(initialMeasurementDataCsv);
export const monitoringPeriodRows = parseCsv<MonitoringPeriodDataRow>(monitoringPeriodDataCsv);
export const dataProcessingRows = parseCsv<DataProcessingDataRow>(dataProcessingDataCsv);
export const reportCompilationRows = parseCsv<ReportCompilationDataRow>(reportCompilationDataCsv);
export const trainingResources = parseCsv<TrainingResourceContent>(resourcesCsv);

const uiLabelRows = parseCsv<{ stepId: string; key: string; text: string }>(uiLabelsCsv);

const stepIdAliases: Record<string, string> = {
  STEP01: 'prep.tech',
  STEP02: 'prep.material',
  STEP03: 'prep.assembly',
  STEP04: 'prep.cage',
  STEP05: 'prep.inspection',
  STEP06: 'prep.connectivity',
  STEP07: 'prep.initialMeasurement',
  STEP08: 'acq.safety',
  STEP09: 'acq.instrument',
  STEP10: 'data.processing',
  STEP11: 'data.report',
  STEP12: 'data.analysis',
};

const questionIdAliases: Record<string, string> = {
  Q001: 'prep.tech.location',
  Q002: 'prep.tech.spacing',
  Q003: 'prep.material.area',
  Q004: 'prep.material.inspection',
  Q005: 'prep.assembly.tube',
  Q006: 'prep.assembly.connector',
  Q007: 'prep.assembly.bottomCap',
  Q008: 'prep.assembly.joint',
  Q009: 'prep.cage.section',
  Q010: 'prep.cage.height',
  Q011: 'prep.cage.spacing',
  Q012: 'prep.cage.tightness',
  Q013: 'prep.inspection.cx01',
  Q014: 'prep.inspection.cx02',
  Q015: 'prep.inspection.cx03',
  Q016: 'prep.inspection.cx04',
  Q017: 'prep.connectivity.cx01',
  Q018: 'prep.connectivity.cx02',
  Q019: 'prep.connectivity.cx03',
  Q020: 'prep.connectivity.cx04',
  Q021: 'prep.initialMeasurement.condition',
  Q022: 'prep.initialMeasurement.data',
  Q023: 'acq.safety.weather',
  Q024: 'acq.safety.equipment',
  Q025: 'acq.safety.instrument',
  Q026: 'acq.instrument.powerOrder',
  Q027: 'acq.instrument.interval',
  Q028: 'acq.instrument.cable',
  Q029: 'acq.instrument.area',
  Q030: 'acq.instrument.hole',
  Q031: 'acq.instrument.depth',
  Q032: 'acq.instrument.probeDirection',
  Q033: 'acq.instrument.stepLength',
  Q034: 'acq.instrument.remeasureGroup',
  Q035: 'acq.instrument.remeasureDepth',
  Q036: 'acq.instrument.remeasureDirection',
  Q037: 'acq.instrument.forwardOrientation',
  Q038: 'acq.instrument.forwardAlignment',
  Q039: 'acq.instrument.forward20',
  Q040: 'acq.instrument.forward19_5',
  Q041: 'acq.instrument.forward19',
  Q042: 'acq.instrument.forward18_5',
  Q043: 'acq.instrument.forward18',
  Q044: 'acq.instrument.reverse20',
  Q045: 'acq.instrument.reverse19_5',
  Q046: 'acq.instrument.reverse19',
  Q047: 'acq.instrument.reverse18_5',
  Q048: 'acq.instrument.reverse18',
  Q049: 'acq.instrument.forward12_5',
  Q050: 'acq.instrument.reverse12_5',
  Q051: 'acq.instrument.cleanupOrder',
  Q052: 'data.processing.connection',
  Q053: 'data.processing.area',
  Q054: 'data.processing.hole',
  Q055: 'data.processing.cumDisp10',
  Q056: 'data.processing.cumDisp14',
  Q057: 'data.report.hole',
  Q058: 'data.report.period',
  Q059: 'data.report.instrument',
  Q060: 'data.report.change2',
  Q061: 'data.report.change10',
  Q062: 'data.report.rate10',
  Q063: 'data.report.rate18',
  Q064: 'data.report.shapeReason',
  Q065: 'data.report.warningLevel',
  Q066: 'data.analysis.maxDepth',
  Q067: 'data.analysis.accelStart',
  Q068: 'data.analysis.maxRecentZone',
  Q069: 'data.analysis.warningDepths',
  Q070: 'data.analysis.trend10',
  Q071: 'data.analysis.action',
  Q072: 'data.analysis.nextInterval',
};

const questionUnitById: Record<string, string> = {
  'prep.tech.spacing': 'm',
  'acq.instrument.depth': 'm',
  'acq.instrument.forward20': 'mm',
  'acq.instrument.forward19_5': 'mm',
  'acq.instrument.forward19': 'mm',
  'acq.instrument.forward18_5': 'mm',
  'acq.instrument.forward18': 'mm',
  'acq.instrument.reverse20': 'mm',
  'acq.instrument.reverse19_5': 'mm',
  'acq.instrument.reverse19': 'mm',
  'acq.instrument.reverse18_5': 'mm',
  'acq.instrument.reverse18': 'mm',
  'acq.instrument.forward12_5': 'mm',
  'acq.instrument.reverse12_5': 'mm',
  'data.processing.cumDisp10': 'mm',
  'data.processing.cumDisp14': 'mm',
  'data.report.change2': 'mm',
  'data.report.change10': 'mm',
  'data.report.rate10': 'mm/d',
  'data.report.rate18': 'mm/d',
};

const groupBy = <T extends Record<string, string>>(rows: T[], key: keyof T) => rows.reduce((groups, row) => {
  const groupKey = row[key];
  if (!groupKey) {
    return groups;
  }

  return {
    ...groups,
    [groupKey]: [...(groups[groupKey] || []), row],
  };
}, {} as Record<string, T[]>);

const rawOptionsByQuestionId = groupBy(rawTrainingOptions, 'questionId');
const scoringOptionsByQuestionId = groupBy(scoringOptionRows, 'questionId');

const mapChoiceAnswer = (rawQuestionId: string, questionId: string, answer: string) => {
  const rawOptions = rawOptionsByQuestionId[rawQuestionId] || [];
  const scoringOptions = scoringOptionsByQuestionId[questionId] || [];

  return answer.split(';').map(value => {
    const optionIndex = rawOptions.findIndex(option => option.optionId === value);
    return scoringOptions[optionIndex]?.选项ID || value;
  }).join(';');
};

const parseRangeAnswer = (question: RawTrainingQuestionContent) => {
  if (question.correctRangeMin || question.correctRangeMax) {
    return [question.correctRangeMin || '', question.correctRangeMax || ''];
  }

  const match = question.correctAnswer?.match(/\[\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\]/);
  return [match?.[1] || '', match?.[2] || ''];
};

export const trainingOptions: TrainingOptionContent[] = scoringOptionRows.map(option => ({
  questionId: option.questionId,
  value: option.选项ID,
  code: option.选项名称,
  label: option.选项内容,
  desc: option.选项描述,
  imageResourceId: option.选项图片 || undefined,
  x: option.选项坐标X || undefined,
  y: option.选项坐标Y || undefined,
}));

export const trainingQuestions: TrainingQuestionContent[] = rawTrainingQuestions.map(question => {
  const questionId = questionIdAliases[question.questionId || ''] || question.questionId || '';
  const stepId = stepIdAliases[question.stepId || ''] || question.stepId || '';
  const type = question.type || question.questionType || '';
  const scoringOptions = scoringOptionsByQuestionId[questionId] || [];
  const [correctRangeMin, correctRangeMax] = parseRangeAnswer(question);

  return {
    stepId,
    questionId,
    label: question.label || question.questionLabel || scoringOptions[0]?.任务名称 || questionId,
    prompt: question.prompt || question.questionDesc || '',
    type,
    maxScore: question.maxScore || '0',
    correctAnswer: type.includes('Choice')
      ? mapChoiceAnswer(question.questionId || '', questionId, question.correctAnswer || '')
      : question.correctAnswer || '',
    correctRangeMin,
    correctRangeMax,
    unit: question.unit || questionUnitById[questionId] || '',
    analysis: question.analysis || '',
  };
});

export const trainingStepsByAppId = Object.fromEntries(
  trainingSteps.map(step => [step.appStepId, step])
);

export const trainingStepsByStepId = Object.fromEntries(
  trainingSteps.map(step => [step.stepId, step])
);

export const getTrainingHotspots = (stepId: string) => trainingHotspots.filter(hotspot => hotspot.stepId === stepId);

export const getTrainingQuestion = (questionId: string) => trainingQuestions.find(question => question.questionId === questionId);

export const getTrainingOptions = (questionId: string) => trainingOptions.filter(option => option.questionId === questionId);

export const getTrainingResource = (resourceId: string) => trainingResources.find(resource => resource.resourceId === resourceId);

export const getTrainingResourcesByStep = (stepId: string) => trainingResources.filter(resource => resource.stepId === stepId);

export const getTrainingResourceByDisplayLabel = (displayLabel: string) => trainingResources.find(resource => resource.displayLabel === displayLabel);

const getResourceImageSource = (resourceId?: string) => {
  if (!resourceId) {
    return undefined;
  }

  const resource = getTrainingResource(resourceId);
  return resource?.status && resource.status !== 'placeholder' ? resource.status : undefined;
};

export const getUiLabel = (stepId: string, key: string, values?: Record<string, string | number>) => {
  const template = uiLabelRows.find(row => row.stepId === stepId && row.key === key)?.text || '';

  if (!values) {
    return template;
  }

  return Object.entries(values).reduce((text, [name, value]) => text.replaceAll(`{${name}}`, String(value)), template);
};

const toChoiceQuestion = (question: TrainingQuestionContent): ChoiceQuestionConfig => {
  const options = getTrainingOptions(question.questionId).map(option => {
    const hotspot = trainingHotspots.find(item => item.hotspotId === (option.hotspotId || option.value) && item.questionId === question.questionId);

    return {
      value: option.value,
      code: option.code,
      label: option.label,
      desc: option.desc,
      imageResourceId: option.imageResourceId || undefined,
      image: getResourceImageSource(option.imageResourceId),
      x: option.x || hotspot?.x,
      y: option.y || hotspot?.y,
    };
  });

  return {
    questionId: question.questionId,
    label: question.label,
    prompt: question.prompt,
    type: question.type === 'multiChoice' ? 'multiChoice' : 'singleChoice',
    maxScore: Number(question.maxScore),
    correctAnswer: question.correctAnswer,
    analysis: question.analysis,
    options,
  };
};

const toFillRangeQuestion = (question: TrainingQuestionContent): FillRangeQuestionConfig => ({
  questionId: question.questionId,
  label: question.label,
  prompt: question.prompt,
  type: 'fillRange',
  maxScore: Number(question.maxScore),
  correctRange: [Number(question.correctRangeMin), Number(question.correctRangeMax)],
  unit: question.unit || undefined,
  analysis: question.analysis,
});

const toFillValueQuestion = (question: TrainingQuestionContent): FillValueQuestionConfig => ({
  questionId: question.questionId,
  label: question.label,
  prompt: question.prompt,
  type: 'fillValue',
  maxScore: Number(question.maxScore),
  correctAnswer: question.correctAnswer,
  unit: question.unit || undefined,
  analysis: question.analysis,
});

export const buildScoringConfig = (stepId: string): StepScoringConfig => {
  const step = trainingStepsByStepId[stepId];
  const reportMeta = reportStepMap[stepId];

  if (!step) {
    throw new Error(`未找到步骤 ${stepId} 的 CSV 内容配置`);
  }

  if (!reportMeta) {
    throw new Error(`未找到步骤 ${stepId} 对应的报告结构映射`);
  }

  const questions = trainingQuestions
    .filter(question => question.stepId === stepId)
    .map<QuestionConfig>(question => {
      if (question.type === 'fillRange') return toFillRangeQuestion(question);
      if (question.type === 'fillValue') return toFillValueQuestion(question);
      return toChoiceQuestion(question);
    });

  return {
    stepId: step.stepId,
    appStepId: step.appStepId,
    reportStepId: reportMeta.reportStepId,
    stepName: step.stepName,
    questions,
  };
};
