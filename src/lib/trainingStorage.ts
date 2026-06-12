const TRAINING_SESSION_KEY = 'ioxweb.training.session.v1';

export type TrainingSession = {
  version: number;
  updatedAt: string;
  submissions: Record<string, any>;
  drafts: Record<string, any>;
  results: Record<string, any>;
  completedSteps: string[];
};

const createEmptySession = (): TrainingSession => ({
  version: 1,
  updatedAt: new Date().toISOString(),
  submissions: {},
  drafts: {},
  results: {},
  completedSteps: [],
});

export const loadTrainingSession = (): TrainingSession => {
  if (typeof window === 'undefined') return createEmptySession();

  try {
    const raw = window.localStorage.getItem(TRAINING_SESSION_KEY);
    if (!raw) return createEmptySession();

    const parsed = JSON.parse(raw) as Partial<TrainingSession>;

    return {
      version: parsed.version ?? 1,
      updatedAt: parsed.updatedAt ?? new Date().toISOString(),
      submissions: parsed.submissions ?? {},
      drafts: parsed.drafts ?? {},
      results: parsed.results ?? {},
      completedSteps: parsed.completedSteps ?? [],
    };
  } catch {
    return createEmptySession();
  }
};

export const saveTrainingSession = (session: TrainingSession) => {
  if (typeof window === 'undefined') return;

  window.localStorage.setItem(TRAINING_SESSION_KEY, JSON.stringify({
    ...session,
    updatedAt: new Date().toISOString(),
  }));
};

export const saveStepResult = (stepId: string, result: any) => {
  const session = loadTrainingSession();
  const nextCompletedSteps = new Set(session.completedSteps);
  nextCompletedSteps.add(stepId);

  saveTrainingSession({
    ...session,
    submissions: {
      ...session.submissions,
      [stepId]: result?.submission ?? result,
    },
    results: {
      ...session.results,
      [stepId]: result,
    },
    completedSteps: Array.from(nextCompletedSteps),
  });
};

export const saveStepProgress = (stepId: string, result: any) => {
  const session = loadTrainingSession();

  saveTrainingSession({
    ...session,
    submissions: {
      ...session.submissions,
      [stepId]: result?.submission ?? result,
    },
    results: {
      ...session.results,
      [stepId]: result,
    },
  });
};

export const loadStepDraft = <T = any>(stepId: string): T | undefined => {
  return loadTrainingSession().drafts[stepId] as T | undefined;
};

export const saveStepDraft = (stepId: string, draft: any) => {
  const session = loadTrainingSession();

  saveTrainingSession({
    ...session,
    drafts: {
      ...session.drafts,
      [stepId]: draft,
    },
  });
};

export const clearStepProgress = (stepId: string) => {
  const session = loadTrainingSession();
  const { [stepId]: _removedResult, ...results } = session.results;
  const { [stepId]: _removedSubmission, ...submissions } = session.submissions;

  saveTrainingSession({
    ...session,
    results,
    submissions,
  });
};

export const clearTrainingSession = () => {
  if (typeof window === 'undefined') return;

  window.localStorage.removeItem(TRAINING_SESSION_KEY);
};
