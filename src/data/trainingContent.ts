import stepsCsv from './training/steps.csv?raw';
import hotspotsCsv from './training/hotspots.csv?raw';
import questionsCsv from './training/questions.csv?raw';
import optionsCsv from './training/options.csv?raw';
import uiLabelsCsv from './training/uiLabels.csv?raw';
import initialMeasurementDataCsv from './training/initialMeasurementData.csv?raw';
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

export type TrainingOptionContent = {
  questionId: string;
  value: string;
  code: string;
  label: string;
  desc: string;
  hotspotId?: string;
  imageResourceId?: string;
};

export type InitialMeasurementDataRow = {
  depth: string;
  a: string;
  b: string;
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

const parseCsv = <T extends Record<string, string>>(csv: string): T[] => {
  const lines = csv.trim().split(/\r?\n/).filter(Boolean);
  const headers = parseCsvLine(lines[0]);

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
export const trainingQuestions = parseCsv<TrainingQuestionContent>(questionsCsv);
export const trainingOptions = parseCsv<TrainingOptionContent>(optionsCsv);
export const initialMeasurementDataRows = parseCsv<InitialMeasurementDataRow>(initialMeasurementDataCsv);
export const trainingResources = parseCsv<TrainingResourceContent>(resourcesCsv);

const uiLabelRows = parseCsv<{ stepId: string; key: string; text: string }>(uiLabelsCsv);

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
    const hotspot = option.hotspotId ? trainingHotspots.find(item => item.hotspotId === option.hotspotId && item.questionId === question.questionId) : undefined;

    return {
      value: option.value,
      code: option.code,
      label: option.label,
      desc: option.desc,
      imageResourceId: option.imageResourceId || undefined,
      image: getResourceImageSource(option.imageResourceId),
      x: hotspot?.x,
      y: hotspot?.y,
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
