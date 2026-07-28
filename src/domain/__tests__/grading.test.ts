/**
 * Testes de correção.
 *
 * O ponto sensível é a **tolerância**. Rígido demais desmotiva; frouxo demais
 * ensina errado. Os testes abaixo travam explicitamente onde fica essa
 * fronteira, para que ela não escorregue sem alguém perceber.
 */

import {
  diffWords,
  gradeExercise,
  levenshtein,
  matchAnswer,
  normalizeAnswer,
  scorePronunciation,
  similarity,
} from '../grading';
import type { Exercise } from '../types';

const base = {
  id: 'ex-1',
  lessonId: 'lesson-1',
  order: 0,
  difficulty: 0.5,
  conceptIds: ['c1'],
};

describe('normalizeAnswer', () => {
  it('remove acentos, caixa e pontuação', () => {
    expect(normalizeAnswer('  Café, POR favor!  ')).toBe('cafe por favor');
  });

  it('colapsa espaços múltiplos', () => {
    expect(normalizeAnswer('a    b')).toBe('a b');
  });

  it('preserva apóstrofos internos, que fazem parte da palavra', () => {
    expect(normalizeAnswer("L'école")).toBe("l'ecole");
    expect(normalizeAnswer("Don't")).toBe("don't");
  });

  it('normaliza o apóstrofo tipográfico para o reto', () => {
    expect(normalizeAnswer('l’eau')).toBe(normalizeAnswer("l'eau"));
  });

  it('remove pontuação de abertura do espanhol', () => {
    expect(normalizeAnswer('¿Cómo estás?')).toBe('como estas');
  });
});

describe('levenshtein / similarity', () => {
  it('distância zero para strings iguais', () => {
    expect(levenshtein('casa', 'casa')).toBe(0);
    expect(similarity('casa', 'casa')).toBe(1);
  });

  it('conta substituição, inserção e remoção', () => {
    expect(levenshtein('casa', 'cosa')).toBe(1);
    expect(levenshtein('casa', 'casas')).toBe(1);
    expect(levenshtein('casas', 'casa')).toBe(1);
  });

  it('lida com string vazia', () => {
    expect(levenshtein('', 'abc')).toBe(3);
    expect(levenshtein('abc', '')).toBe(3);
    expect(similarity('', '')).toBe(1);
  });

  it('é simétrica', () => {
    expect(levenshtein('kitten', 'sitting')).toBe(levenshtein('sitting', 'kitten'));
  });
});

describe('matchAnswer', () => {
  it('aceita a resposta exata', () => {
    expect(matchAnswer('the book', ['the book']).verdict).toBe('exact');
  });

  it('ignora diferença de acento e caixa', () => {
    expect(matchAnswer('CAFE', ['café']).verdict).toBe('exact');
  });

  it('tolera um erro de digitação em palavra curta', () => {
    expect(matchAnswer('casq', ['casa']).verdict).toBe('typo');
  });

  it('não tolera dois erros em palavra curta', () => {
    expect(matchAnswer('cqsq', ['casa']).verdict).toBe('wrong');
  });

  it('tolera erro proporcional em frases longas', () => {
    const target = 'i would like a coffee without sugar';
    expect(matchAnswer('i would like a cofee without sugar', [target]).verdict).toBe('typo');
  });

  it('rejeita resposta com sentido diferente', () => {
    expect(matchAnswer('i want tea', ['i want coffee']).verdict).toBe('wrong');
  });

  it('rejeita resposta vazia', () => {
    const result = matchAnswer('   ', ['algo']);
    expect(result.verdict).toBe('wrong');
    expect(result.score).toBe(0);
  });

  it('escolhe a melhor entre várias respostas aceitas', () => {
    const result = matchAnswer('hola', ['hello', 'hola', 'ciao']);
    expect(result.verdict).toBe('exact');
    expect(result.best).toBe('hola');
  });
});

describe('scorePronunciation', () => {
  it('dá nota máxima para fala idêntica', () => {
    expect(scorePronunciation('good morning', 'good morning').score).toBe(1);
  });

  it('penaliza palavras faltando', () => {
    const { score, wordScores } = scorePronunciation('good', 'good morning');
    expect(score).toBeCloseTo(0.5, 1);
    expect(wordScores.find((word) => word.word === 'morning')?.correct).toBe(false);
  });

  it('tolera pequenas variações do reconhecedor', () => {
    // Perda da consoante final é o erro mais comum de reconhecimento e não
    // deve custar a palavra inteira.
    expect(scorePronunciation('good mornin', 'good morning').score).toBe(1);
  });

  it('não aceita uma palavra diferente no lugar da esperada', () => {
    // O limiar de 0.75 existe justamente para separar "quase igual" de
    // "outra palavra": afrouxá-lo faria "hat" passar por "cat".
    const { wordScores } = scorePronunciation('bad morning', 'good morning');
    expect(wordScores.find((word) => word.word === 'good')?.correct).toBe(false);
  });

  it('penaliza fala muito mais longa que o alvo', () => {
    const clean = scorePronunciation('hello', 'hello').score;
    const noisy = scorePronunciation('hello uh what was it hmm ok', 'hello').score;
    expect(noisy).toBeLessThan(clean);
  });

  it('devolve 0 para alvo vazio, sem quebrar', () => {
    expect(scorePronunciation('qualquer coisa', '').score).toBe(0);
  });

  it('mantém a nota no intervalo 0–1', () => {
    for (const [said, target] of [
      ['', 'hello world'],
      ['hello world hello world hello world', 'hello world'],
      ['completamente diferente', 'good morning'],
    ]) {
      const { score } = scorePronunciation(said!, target!);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    }
  });
});

describe('gradeExercise', () => {
  it('corrige escolha múltipla', () => {
    const exercise: Exercise = {
      ...base,
      type: 'multiple_choice',
      prompt: 'What does "water" mean?',
      choices: ['água', 'fogo', 'terra'],
      correctIndex: 0,
    };

    expect(gradeExercise(exercise, { kind: 'choice', index: 0 }).correct).toBe(true);

    const wrong = gradeExercise(exercise, { kind: 'choice', index: 1 });
    expect(wrong.correct).toBe(false);
    expect(wrong.correctAnswer).toBe('água');
  });

  it('aceita tradução com erro de digitação, mas mostra a forma correta', () => {
    const exercise: Exercise = {
      ...base,
      type: 'translate',
      prompt: 'água',
      direction: 'to_target',
      acceptedAnswers: ['water'],
    };

    const result = gradeExercise(exercise, { kind: 'text', value: 'watter' });
    expect(result.correct).toBe(true);
    expect(result.score).toBeLessThan(1);
    expect(result.correctAnswer).toBe('water');
  });

  it('corrige banco de palavras pela ordem exata', () => {
    const exercise: Exercise = {
      ...base,
      type: 'word_bank',
      prompt: 'Eu quero água',
      tokens: ['I', 'want', 'water'],
      solution: ['I', 'want', 'water'],
    };

    expect(
      gradeExercise(exercise, { kind: 'tokens', values: ['I', 'want', 'water'] }).correct,
    ).toBe(true);

    const wrong = gradeExercise(exercise, { kind: 'tokens', values: ['water', 'want', 'I'] });
    expect(wrong.correct).toBe(false);
    expect(wrong.score).toBeGreaterThan(0);
  });

  it('dá nota parcial em ligar pares', () => {
    const exercise: Exercise = {
      ...base,
      type: 'match_pairs',
      pairs: [
        { left: 'water', right: 'água' },
        { left: 'fire', right: 'fogo' },
      ],
    };

    const half = gradeExercise(exercise, {
      kind: 'pairs',
      matches: [
        { left: 'water', right: 'água' },
        { left: 'fire', right: 'água' },
      ],
    });

    expect(half.correct).toBe(false);
    expect(half.score).toBe(0.5);
  });

  it('aprova a fala acima do limiar do exercício', () => {
    const exercise: Exercise = {
      ...base,
      type: 'speak',
      targetText: 'good morning',
      passThreshold: 0.7,
    };

    expect(
      gradeExercise(exercise, { kind: 'speech', transcript: 'good morning' }).correct,
    ).toBe(true);
    expect(gradeExercise(exercise, { kind: 'speech', transcript: '' }).correct).toBe(false);
  });

  it('exige a maioria das respostas na interpretação de texto', () => {
    const exercise: Exercise = {
      ...base,
      type: 'reading_comprehension',
      passage: 'texto',
      questions: [
        { prompt: 'p1', choices: ['a', 'b'], correctIndex: 0 },
        { prompt: 'p2', choices: ['a', 'b'], correctIndex: 1 },
        { prompt: 'p3', choices: ['a', 'b'], correctIndex: 0 },
      ],
    };

    expect(gradeExercise(exercise, { kind: 'choices', indices: [0, 1, 0] }).correct).toBe(true);
    expect(gradeExercise(exercise, { kind: 'choices', indices: [1, 0, 1] }).correct).toBe(
      false,
    );
  });

  it('exige o mínimo de palavras ao descrever imagem', () => {
    const exercise: Exercise = {
      ...base,
      type: 'describe_image',
      imageUrl: '',
      expectedKeywords: ['water', 'table'],
      minWords: 5,
    };

    const short = gradeExercise(exercise, { kind: 'text', value: 'water table' });
    expect(short.correct).toBe(false);
    expect(short.feedback).toContain('5');

    const good = gradeExercise(exercise, {
      kind: 'text',
      value: 'there is water on the table here',
    });
    expect(good.correct).toBe(true);
  });

  it('tratar "pular" como erro, sem lançar', () => {
    const exercise: Exercise = {
      ...base,
      type: 'translate',
      prompt: 'água',
      direction: 'to_target',
      acceptedAnswers: ['water'],
    };

    const result = gradeExercise(exercise, { kind: 'skip' });
    expect(result.correct).toBe(false);
    expect(result.score).toBe(0);
  });

  it('não quebra quando o formato da resposta não bate com o exercício', () => {
    const exercise: Exercise = {
      ...base,
      type: 'multiple_choice',
      prompt: 'p',
      choices: ['a', 'b'],
      correctIndex: 0,
    };

    const result = gradeExercise(exercise, { kind: 'text', value: 'a' });
    expect(result.correct).toBe(false);
    expect(result.feedback).toBeTruthy();
  });
});

describe('diffWords', () => {
  it('marca palavras corretas e erradas', () => {
    const diff = diffWords('i want water', 'i want coffee');

    expect(diff[0]).toEqual({ word: 'i', status: 'ok' });
    expect(diff[1]).toEqual({ word: 'want', status: 'ok' });
    expect(diff[2]?.status).toBe('wrong');
  });

  it('marca palavras faltando', () => {
    const diff = diffWords('i want', 'i want water');
    expect(diff[2]).toEqual({ word: 'water', status: 'missing' });
  });

  it('marca palavras sobrando', () => {
    const diff = diffWords('i want water now', 'i want water');
    expect(diff[3]).toEqual({ word: 'now', status: 'extra' });
  });
});
