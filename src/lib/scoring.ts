import type { StepScoringConfig } from '../data/scoringConfig';

export type UserAnswerValue = string | string[] | number | null | undefined;

export type UserAnswerInput = {
  questionId: string;
  answer: UserAnswerValue;
};

export type QuestionScoreResult = {
  questionId: string;
  id: string;
  type: 'choice' | 'input';
  label: string;
  userAnswer: string;
  userAnswerLabel?: string;
  correctAnswer?: string;
  correctAnswerLabel?: string;
  correctRange?: [number, number];
  unit?: string;
  analysis?: string;
  score: number;
  maxScore: number;
  correct: boolean;
};

export type StepScoreResult = {
  stepId: string;
  appStepId: string;
  reportStepId: string;
  stepName: string;
  submittedAt: string;
  submission: {
    stepId: string;
    answers: UserAnswerInput[];
  };
  answers: QuestionScoreResult[];
  totalScore: number;
  maxScore: number;
};

const stringifyAnswer = (answer: UserAnswerValue) => answer === null || answer === undefined ? '' : String(answer);

const normalizeMultiAnswer = (answer: UserAnswerValue) => {
  if (Array.isArray(answer)) {
    return answer;
  }

  return stringifyAnswer(answer).split(';').filter(Boolean);
};

const isSameAnswerSet = (left: string[], right: string[]) => (
  left.length === right.length && left.every(value => right.includes(value))
);

const isSameFillValue = (left: UserAnswerValue, right: string) => {
  const leftNumber = typeof left === 'number' ? left : Number(left);
  const rightNumber = Number(right);

  if (Number.isFinite(leftNumber) && Number.isFinite(rightNumber)) {
    return Math.abs(leftNumber - rightNumber) <= 0.01;
  }

  return stringifyAnswer(left) === right;
};

export const calculateStepScore = (config: StepScoringConfig, userAnswers: UserAnswerInput[]): StepScoreResult => {
  const answerMap = new Map(userAnswers.map(answer => [answer.questionId, answer.answer]));

  const answers = config.questions.map(question => {
    const userAnswer = answerMap.get(question.questionId);

    if (question.type === 'singleChoice') {
      const selectedOption = question.options.find(option => option.value === userAnswer);
      const correctOption = question.options.find(option => option.value === question.correctAnswer);
      const correct = userAnswer === question.correctAnswer;

      return {
        questionId: question.questionId,
        id: question.questionId,
        type: 'choice' as const,
        label: question.label,
        userAnswer: stringifyAnswer(userAnswer),
        userAnswerLabel: selectedOption ? `${selectedOption.code}. ${selectedOption.label}` : '',
        correctAnswer: question.correctAnswer,
        correctAnswerLabel: correctOption ? `${correctOption.code}. ${correctOption.label}` : question.correctAnswer,
        analysis: question.analysis,
        score: correct ? question.maxScore : 0,
        maxScore: question.maxScore,
        correct,
      };
    }

    if (question.type === 'multiChoice') {
      const selectedValues = normalizeMultiAnswer(userAnswer);
      const correctValues = normalizeMultiAnswer(question.correctAnswer);
      const selectedOptions = question.options.filter(option => selectedValues.includes(option.value));
      const correctOptions = question.options.filter(option => correctValues.includes(option.value));
      const correct = isSameAnswerSet(selectedValues, correctValues);

      return {
        questionId: question.questionId,
        id: question.questionId,
        type: 'choice' as const,
        label: question.label,
        userAnswer: selectedValues.join(';'),
        userAnswerLabel: selectedOptions.map(option => `${option.code}. ${option.label}`).join('；'),
        correctAnswer: correctValues.join(';'),
        correctAnswerLabel: correctOptions.map(option => `${option.code}. ${option.label}`).join('；'),
        analysis: question.analysis,
        score: correct ? question.maxScore : 0,
        maxScore: question.maxScore,
        correct,
      };
    }

    if (question.type === 'fillRange') {
      const numericAnswer = typeof userAnswer === 'number' ? userAnswer : Number(userAnswer);
      const [min, max] = question.correctRange;
      const correct = Number.isFinite(numericAnswer) && numericAnswer >= min && numericAnswer <= max;

      return {
        questionId: question.questionId,
        id: question.questionId,
        type: 'input' as const,
        label: question.label,
        userAnswer: stringifyAnswer(userAnswer),
        correctRange: question.correctRange,
        unit: question.unit,
        analysis: question.analysis,
        score: correct ? question.maxScore : 0,
        maxScore: question.maxScore,
        correct,
      };
    }

    if (question.type === 'fillValue') {
      const correct = isSameFillValue(userAnswer, question.correctAnswer);

      return {
        questionId: question.questionId,
        id: question.questionId,
        type: 'input' as const,
        label: question.label,
        userAnswer: stringifyAnswer(userAnswer),
        correctAnswer: question.correctAnswer,
        unit: question.unit,
        analysis: question.analysis,
        score: correct ? question.maxScore : 0,
        maxScore: question.maxScore,
        correct,
      };
    }

    throw new Error(`Unsupported question type: ${question.type}`);
  });

  return {
    stepId: config.stepId,
    appStepId: config.appStepId,
    reportStepId: config.reportStepId,
    stepName: config.stepName,
    submittedAt: new Date().toISOString(),
    submission: {
      stepId: config.stepId,
      answers: userAnswers,
    },
    answers,
    totalScore: answers.reduce((sum, answer) => sum + answer.score, 0),
    maxScore: answers.reduce((sum, answer) => sum + answer.maxScore, 0),
  };
};
