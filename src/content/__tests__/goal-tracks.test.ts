/**
 * Testes da trilha por objetivo.
 *
 * A garantia central não é "reordena" — é **"reordena sem perder nada"**. Podar
 * conteúdo com base numa resposta de trinta segundos no onboarding cria buracos
 * que o aluno só descobre meses depois, quando já é caro voltar. Estes testes
 * existem para que ninguém troque reordenação por filtragem num refactor.
 */

import type { LearningGoal } from '@/domain/types';
import { GOAL_TRACKS, emphasisFor, sortModulesForGoals, trackIntro } from '../goal-tracks';

const MODULES = [
  { key: 'a1-first-contact' },
  { key: 'a1-daily-life' },
  { key: 'a1-out-and-about' },
];

const ALL_GOALS: LearningGoal[] = [
  'travel',
  'work',
  'exchange',
  'conversation',
  'exam',
  'business',
  'culture',
];

describe('sortModulesForGoals', () => {
  it('nunca remove um módulo', () => {
    for (const goal of ALL_GOALS) {
      const sorted = sortModulesForGoals(MODULES, [goal]);

      expect(sorted).toHaveLength(MODULES.length);
      expect(sorted.map((module) => module.key).sort()).toEqual(
        MODULES.map((module) => module.key).sort(),
      );
    }
  });

  it('nunca duplica um módulo', () => {
    const keys = sortModulesForGoals(MODULES, ['travel', 'work']).map((module) => module.key);
    expect(keys.length).toBe(new Set(keys).size);
  });

  it('quem quer viajar começa pela rua, não pela rotina', () => {
    const sorted = sortModulesForGoals(MODULES, ['travel']);
    expect(sorted[0]?.key).toBe('a1-out-and-about');
  });

  it('quem quer conversar começa pelo primeiro contato', () => {
    const sorted = sortModulesForGoals(MODULES, ['conversation']);
    expect(sorted[0]?.key).toBe('a1-first-contact');
  });

  it('objetivos diferentes produzem ordens diferentes', () => {
    const travel = sortModulesForGoals(MODULES, ['travel']).map((module) => module.key);
    const conversation = sortModulesForGoals(MODULES, ['conversation']).map(
      (module) => module.key,
    );

    expect(travel).not.toEqual(conversation);
  });

  it('sem objetivo, mantém a ordem original do curso', () => {
    expect(sortModulesForGoals(MODULES, [])).toEqual(MODULES);
  });

  it('módulo relevante para dois objetivos sobe mais que o relevante para um', () => {
    // "out-and-about" é prioridade de viagem; "first-contact" é de viagem e de
    // conversação. Com os dois objetivos, o segundo deve vencer.
    const sorted = sortModulesForGoals(MODULES, ['travel', 'conversation']);
    expect(sorted[0]?.key).toBe('a1-first-contact');
  });

  it('módulo sem relação com o objetivo vai para o fim, não some', () => {
    const sorted = sortModulesForGoals(MODULES, ['exam']).map((module) => module.key);
    expect(sorted).toContain('a1-daily-life');
    expect(sorted).toHaveLength(3);
  });
});

describe('metadados dos objetivos', () => {
  it('todo objetivo tem prioridade, ênfase e explicação', () => {
    for (const goal of ALL_GOALS) {
      const track = GOAL_TRACKS[goal];

      expect(track.priority.length).toBeGreaterThan(0);
      expect(track.emphasis.length).toBeGreaterThan(0);
      // A explicação é o que mostra ao aluno que ele foi ouvido. Sem ela, a
      // personalização acontece e ninguém percebe.
      expect(track.intro.length).toBeGreaterThan(60);
    }
  });

  it('cada objetivo tem uma explicação própria', () => {
    const intros = ALL_GOALS.map((goal) => GOAL_TRACKS[goal].intro);
    expect(intros.length).toBe(new Set(intros).size);
  });

  it('trackIntro devolve a frase do primeiro objetivo', () => {
    expect(trackIntro(['work'])).toBe(GOAL_TRACKS.work.intro);
  });

  it('trackIntro não quebra quando não há objetivo', () => {
    expect(trackIntro([]).length).toBeGreaterThan(0);
  });

  it('emphasisFor acumula os tipos de lição de vários objetivos', () => {
    const kinds = emphasisFor(['exam', 'conversation']);

    expect(kinds.has('reading')).toBe(true);
    expect(kinds.has('conversation')).toBe(true);
  });
});
