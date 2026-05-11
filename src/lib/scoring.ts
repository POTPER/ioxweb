import type { StepScoringConfig } from '../data/scoringConfig';

export type UserAnswerValue = string | number | null | undefined;

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
