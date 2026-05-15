import { buildScoringConfig } from './trainingContent';

export type ChoiceQuestionConfig = {
  questionId: string;
  label: string;
  prompt?: string;
  type: 'singleChoice' | 'multiChoice';
  maxScore: number;
  correctAnswer: string;
  analysis: string;
  options: {
    value: string;
    code: string;
    label: string;
    desc: string;
    imageResourceId?: string;
    image?: string;
    x?: string;
    y?: string;
  }[];
};

export type FillRangeQuestionConfig = {
  questionId: string;
  label: string;
  prompt?: string;
  type: 'fillRange';
  maxScore: number;
  correctRange: [number, number];
  unit?: string;
  analysis: string;
};

export type FillValueQuestionConfig = {
  questionId: string;
  label: string;
  prompt?: string;
  type: 'fillValue';
  maxScore: number;
  correctAnswer: string;
  unit?: string;
  analysis: string;
};

export type QuestionConfig = ChoiceQuestionConfig | FillRangeQuestionConfig | FillValueQuestionConfig;

export type StepScoringSourceConfig = {
  stepId: string;
  appStepId: string;
  stepName: string;
  questions: QuestionConfig[];
};

export type StepScoringConfig = StepScoringSourceConfig & {
  reportStepId: string;
};

export const technicalPreparationScoringConfig = buildScoringConfig('prep.tech');
export const materialPickupScoringConfig = buildScoringConfig('prep.material');
export const tubeAssemblyScoringConfig = buildScoringConfig('prep.assembly');
export const cageInstallationScoringConfig = buildScoringConfig('prep.cage');
export const inspectionScoringConfig = buildScoringConfig('prep.inspection');
export const connectivityScoringConfig = buildScoringConfig('prep.connectivity');
export const initialMeasurementScoringConfig = buildScoringConfig('prep.initialMeasurement');
export const acqSafetyScoringConfig = buildScoringConfig('acq.safety');
export const acqInstrumentScoringConfig = buildScoringConfig('acq.instrument');
export const dataProcessingScoringConfig = buildScoringConfig('data.processing');
export const dataReportScoringConfig = buildScoringConfig('data.report');

export const scoringConfigs = {
  prepTech: technicalPreparationScoringConfig,
  prepMaterial: materialPickupScoringConfig,
  prepAssembly: tubeAssemblyScoringConfig,
  prepCage: cageInstallationScoringConfig,
  prepInspection: inspectionScoringConfig,
  prepConnectivity: connectivityScoringConfig,
  prepInitialMeasurement: initialMeasurementScoringConfig,
  acqSafety: acqSafetyScoringConfig,
  acqInstrument: acqInstrumentScoringConfig,
  dataProcessing: dataProcessingScoringConfig,
  dataReport: dataReportScoringConfig,
};
