import { calculateStepScore, type UserAnswerValue } from '../lib/scoring';
import { scoringConfigs, type QuestionConfig, type StepScoringConfig } from './scoringConfig';

const devAnswerOverrides: Record<string, UserAnswerValue> = {
  'prep.tech.spacing': '18',
  'prep.material.inspection': 'checkCertificate',
  'prep.cage.tightness': 'overTight',
  'prep.connectivity.cx03': 'passIfProbeReachesBottom',
  'acq.safety.equipment': 'helmet',
  'acq.instrument.interval': '1',
  'acq.instrument.reverse18': '-75',
  'data.processing.connection': 'notConnected',
  'data.report.rate10': '1.10',
  'data.analysis.nextInterval': '维持7天',
};

const getDefaultAnswer = (question: QuestionConfig): UserAnswerValue => {
  if (question.type === 'fillRange') {
    const [min, max] = question.correctRange;
    return ((min + max) / 2).toFixed(2);
  }

  return question.correctAnswer;
};

const buildStepResult = (config: StepScoringConfig) => {
  const answers = config.questions.map(question => ({
    questionId: question.questionId,
    answer: devAnswerOverrides[question.questionId] ?? getDefaultAnswer(question),
  }));

  return calculateStepScore(config, answers);
};

export const createDevSampleStepResults = () => Object.fromEntries(
  Object.values(scoringConfigs).map(config => [config.appStepId, buildStepResult(config)])
);

