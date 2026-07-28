/**
 * Estado do onboarding.
 *
 * Vive fora da store global porque é efêmero: existe entre a primeira tela e a
 * criação do perfil, e some depois. Mantê-lo separado evita que campos
 * "rascunho" poluam o estado do app pelo resto da sessão.
 */

import { create } from 'zustand';

import type {
  CefrLevel,
  DailyCommitment,
  LanguageCode,
  LearningGoal,
  OnboardingAnswers,
} from '@/domain/types';

export const ONBOARDING_STEPS = [
  'language',
  'goals',
  'level',
  'commitment',
  'days',
  'name',
] as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

type OnboardingState = {
  step: number;
  displayName: string;
  language: LanguageCode | null;
  goals: LearningGoal[];
  level: CefrLevel | 'zero' | null;
  dailyMinutes: DailyCommitment | null;
  studyDays: number[];
  reminderMinute: number | null;

  setName: (name: string) => void;
  setLanguage: (language: LanguageCode) => void;
  toggleGoal: (goal: LearningGoal) => void;
  setLevel: (level: CefrLevel | 'zero') => void;
  setDailyMinutes: (minutes: DailyCommitment) => void;
  toggleDay: (day: number) => void;
  setReminder: (minute: number | null) => void;

  next: () => void;
  back: () => void;
  /** A etapa atual tem resposta suficiente para avançar? */
  canAdvance: () => boolean;
  toAnswers: () => OnboardingAnswers | null;
  reset: () => void;
};

const INITIAL = {
  step: 0,
  displayName: '',
  language: null,
  goals: [] as LearningGoal[],
  level: null,
  dailyMinutes: null,
  // Segunda a sexta é o padrão que mais gente mantém — começar com algo
  // marcado reduz o abandono nesta etapa.
  studyDays: [1, 2, 3, 4, 5],
  reminderMinute: 19 * 60,
};

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  ...INITIAL,
  language: null,
  level: null,
  dailyMinutes: null,

  setName: (displayName) => set({ displayName }),
  setLanguage: (language) => set({ language }),

  toggleGoal: (goal) => {
    const { goals } = get();
    // Limite de 3: escolher tudo é o mesmo que não escolher nada, e o plano
    // ficaria sem foco.
    if (goals.includes(goal)) {
      set({ goals: goals.filter((item) => item !== goal) });
    } else if (goals.length < 3) {
      set({ goals: [...goals, goal] });
    }
  },

  setLevel: (level) => set({ level }),
  setDailyMinutes: (dailyMinutes) => set({ dailyMinutes }),

  toggleDay: (day) => {
    const { studyDays } = get();
    set({
      studyDays: studyDays.includes(day)
        ? studyDays.filter((item) => item !== day)
        : [...studyDays, day].sort(),
    });
  },

  setReminder: (reminderMinute) => set({ reminderMinute }),

  next: () => set({ step: Math.min(get().step + 1, ONBOARDING_STEPS.length - 1) }),
  back: () => set({ step: Math.max(get().step - 1, 0) }),

  canAdvance: () => {
    const state = get();
    switch (ONBOARDING_STEPS[state.step]) {
      case 'language':
        return state.language !== null;
      case 'goals':
        return state.goals.length > 0;
      case 'level':
        return state.level !== null;
      case 'commitment':
        return state.dailyMinutes !== null;
      case 'days':
        return state.studyDays.length > 0;
      case 'name':
        // O nome é opcional — bloquear aqui perderia usuário na última tela.
        return true;
      default:
        return false;
    }
  },

  toAnswers: () => {
    const state = get();
    if (!state.language || !state.level || !state.dailyMinutes) return null;

    return {
      targetLanguage: state.language,
      uiLanguage: 'pt',
      goals: state.goals,
      selfAssessedLevel: state.level,
      dailyMinutes: state.dailyMinutes,
      studyDays: state.studyDays,
      reminderMinute: state.reminderMinute,
    };
  },

  reset: () => set({ ...INITIAL, language: null, level: null, dailyMinutes: null }),
}));
