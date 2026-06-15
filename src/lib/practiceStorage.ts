import type { PracticeInstrumentId } from '../components/practice/practiceInstruments';

const PRACTICE_SESSION_KEY = 'ioxweb.practice.session.v1';

export type PracticeSession = {
  version: number;
  updatedAt: string;
  results: Partial<Record<PracticeInstrumentId, any>>;
  progress: Partial<Record<PracticeInstrumentId, any>>;
  completed: PracticeInstrumentId[];
};

const createEmptySession = (): PracticeSession => ({
  version: 1,
  updatedAt: new Date().toISOString(),
  results: {},
  progress: {},
  completed: [],
});

export const loadPracticeSession = (): PracticeSession => {
  if (typeof window === 'undefined') return createEmptySession();

  try {
    const raw = window.localStorage.getItem(PRACTICE_SESSION_KEY);
    if (!raw) return createEmptySession();

    const parsed = JSON.parse(raw) as Partial<PracticeSession>;

    return {
      version: parsed.version ?? 1,
      updatedAt: parsed.updatedAt ?? new Date().toISOString(),
      results: parsed.results ?? {},
      progress: parsed.progress ?? {},
      completed: parsed.completed ?? [],
    };
  } catch {
    return createEmptySession();
  }
};

export const savePracticeSession = (session: PracticeSession) => {
  if (typeof window === 'undefined') return;

  window.localStorage.setItem(
    PRACTICE_SESSION_KEY,
    JSON.stringify({
      ...session,
      updatedAt: new Date().toISOString(),
    }),
  );
};

export const savePracticeProgress = (instrumentId: PracticeInstrumentId, data: any) => {
  const session = loadPracticeSession();

  savePracticeSession({
    ...session,
    progress: {
      ...session.progress,
      [instrumentId]: data,
    },
  });
};

export const savePracticeResult = (instrumentId: PracticeInstrumentId, data: any) => {
  const session = loadPracticeSession();
  const nextCompleted = new Set(session.completed);
  nextCompleted.add(instrumentId);

  savePracticeSession({
    ...session,
    results: {
      ...session.results,
      [instrumentId]: data,
    },
    progress: {
      ...session.progress,
      [instrumentId]: data,
    },
    completed: Array.from(nextCompleted),
  });
};

export const isPracticeCompleted = (instrumentId: PracticeInstrumentId): boolean => {
  return loadPracticeSession().completed.includes(instrumentId);
};

export const clearPracticeSession = () => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(PRACTICE_SESSION_KEY);
};
