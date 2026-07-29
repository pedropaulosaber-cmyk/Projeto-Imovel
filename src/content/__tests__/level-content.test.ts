/**
 * Testes do conteúdo por nível.
 *
 * Estes testes existem por um pedido explícito e verificável: **nada pode se
 * repetir**. Palavra, pergunta ou expressão que reaparece no mesmo nível é o
 * defeito mais visível que um curso pode ter, e é exatamente o tipo de coisa
 * que volta silenciosamente na próxima edição de conteúdo.
 *
 * Se você adicionar uma palavra que já existe em outro nível, a suíte quebra.
 * Isso é o comportamento desejado.
 */

import { CEFR_LEVELS, type CefrLevel, SUPPORTED_LANGUAGES } from '@/domain/types';
import { buildCourseContent } from '../courses';
import { grammarPointCount, grammarPoints } from '../grammar-syllabus';
import { allLevelVocabulary, levelVocabulary } from '../level-content';

describe('vocabulário por nível', () => {
  it('todo idioma tem vocabulário em todos os seis níveis', () => {
    for (const language of SUPPORTED_LANGUAGES) {
      for (const level of CEFR_LEVELS) {
        expect({
          language,
          level,
          count: levelVocabulary(language, level).length,
        }).toEqual({ language, level, count: expect.any(Number) });

        expect(levelVocabulary(language, level).length).toBeGreaterThan(0);
      }
    }
  });

  it('não repete termo dentro de um mesmo nível', () => {
    for (const language of SUPPORTED_LANGUAGES) {
      for (const level of CEFR_LEVELS) {
        const items = levelVocabulary(language, level);
        const terms = items.map((item) => item.term);

        expect(`${language}/${level}: ${terms.length} termos`).toBe(
          `${language}/${level}: ${new Set(terms).size} termos`,
        );
      }
    }
  });

  it('não repete termo entre níveis diferentes', () => {
    for (const language of SUPPORTED_LANGUAGES) {
      const seen = new Map<string, CefrLevel>();

      for (const level of CEFR_LEVELS) {
        for (const item of levelVocabulary(language, level)) {
          const previous = seen.get(item.id);
          if (previous) {
            throw new Error(
              `${language}: "${item.term}" aparece em ${previous} e de novo em ${level}`,
            );
          }
          seen.set(item.id, level);
        }
      }
    }
  });

  it('marca cada verbete com o nível a que pertence', () => {
    for (const language of SUPPORTED_LANGUAGES) {
      for (const level of CEFR_LEVELS) {
        for (const item of levelVocabulary(language, level)) {
          expect(item.cefr).toBe(level);
        }
      }
    }
  });

  it('idiomas de escrita não latina trazem romanização em todo verbete', () => {
    for (const language of ['ja', 'ko', 'zh'] as const) {
      for (const level of CEFR_LEVELS) {
        for (const item of levelVocabulary(language, level)) {
          expect(`${language}/${level}/${item.term}`).toBe(
            item.romanization ? `${language}/${level}/${item.term}` : 'sem romanização',
          );
        }
      }
    }
  });

  it('allLevelVocabulary devolve a união sem duplicatas', () => {
    for (const language of SUPPORTED_LANGUAGES) {
      const all = allLevelVocabulary(language);
      const ids = all.map((item) => item.id);
      expect(ids.length).toBe(new Set(ids).size);
    }
  });
});

describe('gramática por nível', () => {
  it('todo idioma tem pontos de gramática em todos os níveis', () => {
    for (const language of SUPPORTED_LANGUAGES) {
      for (const level of CEFR_LEVELS) {
        expect(grammarPoints(language, level).length).toBeGreaterThan(0);
      }
    }
  });

  it('todo ponto traz a armadilha do lusófono e a explicação', () => {
    for (const language of SUPPORTED_LANGUAGES) {
      for (const level of CEFR_LEVELS) {
        for (const point of grammarPoints(language, level)) {
          // Sem `trap` o exercício vira múltipla escolha decorativa; sem `why`
          // o aluno decora o item e reproduz o erro na frase seguinte.
          expect(point.trap.length).toBeGreaterThan(0);
          expect(point.why.length).toBeGreaterThan(20);
          expect(point.correct).not.toBe(point.trap);
        }
      }
    }
  });

  it('não repete título de regra dentro do mesmo idioma', () => {
    for (const language of SUPPORTED_LANGUAGES) {
      const titles = CEFR_LEVELS.flatMap((level) =>
        grammarPoints(language, level).map((point) => point.title),
      );
      expect(titles.length).toBe(new Set(titles).size);
    }
  });

  it('catalogou o programa inteiro', () => {
    // 8 idiomas × 6 níveis × 3 pontos.
    expect(grammarPointCount()).toBe(144);
  });
});

describe('geração da trilha', () => {
  it('gera seis cursos por idioma, um por nível', () => {
    for (const language of SUPPORTED_LANGUAGES) {
      const content = buildCourseContent(language);
      expect(content.courses.map((course) => course.level)).toEqual([...CEFR_LEVELS]);
    }
  });

  it('todo módulo termina numa prova de nível', () => {
    for (const language of SUPPORTED_LANGUAGES) {
      const content = buildCourseContent(language);

      for (const module of content.modules) {
        const lessons = content.lessons
          .filter((lesson) => lesson.moduleId === module.id)
          .sort((a, b) => a.order - b.order);

        expect(lessons.length).toBeGreaterThan(0);
        expect(lessons[lessons.length - 1]?.kind).toBe('exam');
      }
    }
  });

  it('não repete id de exercício', () => {
    for (const language of SUPPORTED_LANGUAGES) {
      const ids = buildCourseContent(language).exercises.map((exercise) => exercise.id);
      expect(ids.length).toBe(new Set(ids).size);
    }
  });

  it('toda lição tem pelo menos um exercício', () => {
    for (const language of SUPPORTED_LANGUAGES) {
      const content = buildCourseContent(language);

      for (const lesson of content.lessons) {
        const count = content.exercises.filter(
          (exercise) => exercise.lessonId === lesson.id,
        ).length;

        if (count === 0) {
          throw new Error(
            `${language}: lição "${lesson.title}" (${lesson.kind}) sem exercícios`,
          );
        }
      }
    }
  });

  it('a dificuldade média cresce do A1 ao C2', () => {
    for (const language of SUPPORTED_LANGUAGES) {
      const content = buildCourseContent(language);

      const averageByLevel = CEFR_LEVELS.map((level) => {
        const courseIds = content.courses
          .filter((course) => course.level === level)
          .map((course) => course.id);
        const moduleIds = content.modules
          .filter((module) => courseIds.includes(module.courseId))
          .map((module) => module.id);
        const lessonIds = content.lessons
          .filter((lesson) => moduleIds.includes(lesson.moduleId))
          .map((lesson) => lesson.id);
        const exercises = content.exercises.filter((exercise) =>
          lessonIds.includes(exercise.lessonId),
        );

        return exercises.reduce((sum, e) => sum + e.difficulty, 0) / exercises.length;
      });

      // O ponto do redesenho: C2 não é "A1 com mais pontos". Comparar as
      // pontas é o teste mais honesto — comparar níveis vizinhos seria frágil
      // porque a composição das lições varia entre eles.
      const easiest = averageByLevel[0] ?? 0;
      const hardest = averageByLevel[5] ?? 0;
      expect(hardest).toBeGreaterThan(easiest);
    }
  });

  it('a prova não entrega dica', () => {
    for (const language of SUPPORTED_LANGUAGES) {
      const content = buildCourseContent(language);
      const examLessonIds = content.lessons
        .filter((lesson) => lesson.kind === 'exam')
        .map((lesson) => lesson.id);

      for (const exercise of content.exercises) {
        if (!examLessonIds.includes(exercise.lessonId)) continue;
        // Numa prova, a explicação vem depois do resultado. Mostrar a regra
        // junto da pergunta mede leitura, não conhecimento.
        expect(exercise.hint).toBeUndefined();
      }
    }
  });
});
