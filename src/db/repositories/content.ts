/**
 * Repositório de conteúdo (cursos, módulos, lições, exercícios, vocabulário).
 *
 * Conteúdo é **somente leitura** para o app: chega pelo download de pacotes ou
 * pela semente embutida, e nunca é editado pelo usuário. Por isso este
 * repositório não escreve na fila de sincronização.
 */

import { sortModulesForGoals } from '@/content/goal-tracks';
import type {
  Course,
  Exercise,
  ID,
  LanguageCode,
  LearningGoal,
  Lesson,
  Module,
  VocabularyItem,
} from '@/domain/types';
import { COLLECTION } from '../collections';
import { getDatabase } from '../index';

export const contentRepository = {
  /* ---------------------------------------------------------------- *
   * Cursos
   * ---------------------------------------------------------------- */

  async listCourses(language: LanguageCode): Promise<Course[]> {
    return getDatabase().query<Course>(COLLECTION.courses, {
      where: [{ field: 'language', op: '=', value: language }],
      orderBy: [{ field: 'order', direction: 'asc' }],
    });
  },

  async getCourse(id: ID): Promise<Course | null> {
    return getDatabase().get<Course>(COLLECTION.courses, id);
  },

  /* ---------------------------------------------------------------- *
   * Módulos e lições
   * ---------------------------------------------------------------- */

  /** Um módulo pelo id — usado ao registrar a prova, que precisa do curso. */
  async getModule(id: ID): Promise<Module | null> {
    return getDatabase().get<Module>(COLLECTION.modules, id);
  },

  async listModules(courseId: ID): Promise<Module[]> {
    return getDatabase().query<Module>(COLLECTION.modules, {
      where: [{ field: 'courseId', op: '=', value: courseId }],
      orderBy: [{ field: 'order', direction: 'asc' }],
    });
  },

  async listLessons(moduleId: ID): Promise<Lesson[]> {
    return getDatabase().query<Lesson>(COLLECTION.lessons, {
      where: [{ field: 'moduleId', op: '=', value: moduleId }],
      orderBy: [{ field: 'order', direction: 'asc' }],
    });
  },

  /**
   * Todas as lições de um curso, já ordenadas pela trilha.
   *
   * Faz duas consultas (módulos, depois lições com `IN`) em vez de N+1 — a
   * diferença aparece imediatamente num curso com 20 módulos.
   */
  async listLessonsForCourse(courseId: ID, goals: LearningGoal[] = []): Promise<Lesson[]> {
    const modules = await this.listModules(courseId);
    if (modules.length === 0) return [];

    // A ordem dos módulos passa a depender do **objetivo do aluno**. O
    // conteúdo continua o mesmo para todo mundo (é semeado uma vez e
    // compartilhado); o que muda é a sequência em que ele chega.
    //
    // Ordenar na leitura, e não na geração, é o que torna isso possível: o
    // aluno pode mudar de objetivo e a trilha se reorganiza na próxima
    // abertura, sem tocar em nada gravado.
    const ordered = sortModulesForGoals(
      modules.map((module) => ({ ...module, key: module.id })),
      goals,
    );

    const lessons = await getDatabase().query<Lesson>(COLLECTION.lessons, {
      where: [{ field: 'moduleId', op: 'in', value: ordered.map((m) => m.id) }],
    });

    const moduleOrder = new Map(ordered.map((module, index) => [module.id, index]));
    return lessons.sort((a, b) => {
      const moduleDiff =
        (moduleOrder.get(a.moduleId) ?? 0) - (moduleOrder.get(b.moduleId) ?? 0);
      return moduleDiff !== 0 ? moduleDiff : a.order - b.order;
    });
  },

  async getLesson(id: ID): Promise<Lesson | null> {
    return getDatabase().get<Lesson>(COLLECTION.lessons, id);
  },

  /* ---------------------------------------------------------------- *
   * Exercícios
   * ---------------------------------------------------------------- */

  async listExercises(lessonId: ID): Promise<Exercise[]> {
    return getDatabase().query<Exercise>(COLLECTION.exercises, {
      where: [{ field: 'lessonId', op: '=', value: lessonId }],
      orderBy: [{ field: 'order', direction: 'asc' }],
    });
  },

  async getExercise(id: ID): Promise<Exercise | null> {
    return getDatabase().get<Exercise>(COLLECTION.exercises, id);
  },

  /* ---------------------------------------------------------------- *
   * Vocabulário
   * ---------------------------------------------------------------- */

  async getVocabularyItem(id: ID): Promise<VocabularyItem | null> {
    return getDatabase().get<VocabularyItem>(COLLECTION.vocabulary, id);
  },

  async getVocabularyItems(ids: ID[]): Promise<VocabularyItem[]> {
    if (ids.length === 0) return [];
    return getDatabase().query<VocabularyItem>(COLLECTION.vocabulary, {
      where: [{ field: 'id', op: 'in', value: ids }],
    });
  },

  /** Busca por prefixo/substring do termo, para o campo de busca do vocabulário. */
  async searchVocabulary(
    language: LanguageCode,
    term: string,
    limit = 30,
  ): Promise<VocabularyItem[]> {
    return getDatabase().query<VocabularyItem>(COLLECTION.vocabulary, {
      where: [
        { field: 'language', op: '=', value: language },
        { field: 'term', op: 'like', value: term.toLowerCase() },
      ],
      orderBy: [{ field: 'frequencyRank', direction: 'asc' }],
      limit,
    });
  },

  /** As N palavras mais frequentes ainda não estudadas — fonte de itens novos. */
  async listByFrequency(
    language: LanguageCode,
    limit: number,
    excludeIds: ID[] = [],
  ): Promise<VocabularyItem[]> {
    const items = await getDatabase().query<VocabularyItem>(COLLECTION.vocabulary, {
      where: [{ field: 'language', op: '=', value: language }],
      orderBy: [{ field: 'frequencyRank', direction: 'asc' }],
      limit: limit + excludeIds.length,
    });

    const excluded = new Set(excludeIds);
    return items.filter((item) => !excluded.has(item.id)).slice(0, limit);
  },

  /* ---------------------------------------------------------------- *
   * Escrita (usada pela semente e pelo download de pacotes)
   * ---------------------------------------------------------------- */

  async saveCourses(courses: Course[]): Promise<void> {
    await getDatabase().putMany(COLLECTION.courses, courses);
  },

  async saveModules(modules: Module[]): Promise<void> {
    await getDatabase().putMany(COLLECTION.modules, modules);
  },

  async saveLessons(lessons: Lesson[]): Promise<void> {
    await getDatabase().putMany(COLLECTION.lessons, lessons);
  },

  async saveExercises(exercises: Exercise[]): Promise<void> {
    await getDatabase().putMany(COLLECTION.exercises, exercises);
  },

  async saveVocabulary(items: VocabularyItem[]): Promise<void> {
    await getDatabase().putMany(COLLECTION.vocabulary, items);
  },

  /** Remove todo o conteúdo de um idioma — usado ao excluir um download. */
  async removeLanguageContent(language: LanguageCode): Promise<void> {
    const db = getDatabase();

    await db.transaction(async () => {
      const courses = await db.query<Course>(COLLECTION.courses, {
        where: [{ field: 'language', op: '=', value: language }],
      });

      for (const course of courses) {
        const modules = await db.query<Module>(COLLECTION.modules, {
          where: [{ field: 'courseId', op: '=', value: course.id }],
        });

        for (const module of modules) {
          const lessons = await db.query<Lesson>(COLLECTION.lessons, {
            where: [{ field: 'moduleId', op: '=', value: module.id }],
          });

          for (const lesson of lessons) {
            await db.deleteWhere(COLLECTION.exercises, {
              where: [{ field: 'lessonId', op: '=', value: lesson.id }],
            });
          }

          await db.deleteWhere(COLLECTION.lessons, {
            where: [{ field: 'moduleId', op: '=', value: module.id }],
          });
        }

        await db.deleteWhere(COLLECTION.modules, {
          where: [{ field: 'courseId', op: '=', value: course.id }],
        });
      }

      await db.deleteWhere(COLLECTION.courses, {
        where: [{ field: 'language', op: '=', value: language }],
      });
      await db.deleteWhere(COLLECTION.vocabulary, {
        where: [{ field: 'language', op: '=', value: language }],
      });
    });
  },

  /** Quantidade de itens por tipo — usado na tela de armazenamento. */
  async contentCounts(): Promise<{
    courses: number;
    lessons: number;
    exercises: number;
    vocabulary: number;
  }> {
    const db = getDatabase();
    const [courses, lessons, exercises, vocabulary] = await Promise.all([
      db.count(COLLECTION.courses),
      db.count(COLLECTION.lessons),
      db.count(COLLECTION.exercises),
      db.count(COLLECTION.vocabulary),
    ]);
    return { courses, lessons, exercises, vocabulary };
  },
};
