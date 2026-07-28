/**
 * Construção da trilha de cursos.
 *
 * ## Por que gerado em vez de escrito à mão
 *
 * O requisito é "arquitetura preparada para adicionar novos idiomas
 * facilmente". Um JSON gigante por idioma não atende isso: adicionar japonês
 * exigiria reescrever centenas de exercícios à mão e manter cinco arquivos em
 * sincronia sempre que a pedagogia mudar.
 *
 * Aqui, a **estrutura pedagógica é uma só** (módulos, progressão, tipos de
 * exercício, ordem de introdução) e cada idioma fornece apenas seus *dados*:
 * vocabulário por frequência e um conjunto de frases curadas. Adicionar um
 * idioma novo é adicionar duas listas — a trilha inteira nasce pronta e
 * consistente com as outras.
 *
 * Conteúdo curado de nível superior (diálogos gravados, textos, vídeos) chega
 * pelos pacotes de download, sobrepondo-se a esta base.
 */

import type {
  CefrLevel,
  Course,
  Exercise,
  LanguageCode,
  Lesson,
  LessonKind,
  Module,
  VocabularyItem,
} from '@/domain/types';
import { CURATED_PHRASES, type Phrase } from './phrases';
import { buildVocabulary } from './vocabulary';

/* ------------------------------------------------------------------ *
 * Estrutura pedagógica compartilhada
 * ------------------------------------------------------------------ */

type ModuleBlueprint = {
  key: string;
  title: string;
  subtitle: string;
  icon: string;
  canDo: string[];
  /** Quantos verbetes do vocabulário este módulo cobre. */
  vocabularySlice: [number, number];
  /** Tema das frases curadas usadas aqui. */
  phraseTopic: Phrase['topic'];
  lessons: { title: string; kind: LessonKind; minutes: number }[];
};

/**
 * A progressão A1.
 *
 * Cada módulo termina em um checkpoint (mini prova) e o curso termina em um
 * projeto. Esse fechamento importa: sem um marco visível, o usuário não sabe
 * que "terminou" nada — e a sensação de conclusão é o que traz de volta.
 */
const A1_BLUEPRINT: ModuleBlueprint[] = [
  {
    key: 'first-contact',
    title: 'Primeiros contatos',
    subtitle: 'Cumprimentar, se apresentar e sobreviver ao primeiro diálogo.',
    icon: 'hand-left',
    canDo: [
      'Cumprimentar e se despedir em situações formais e informais',
      'Dizer seu nome, de onde é e o que faz',
      'Pedir que repitam quando não entender',
    ],
    vocabularySlice: [0, 12],
    phraseTopic: 'greetings',
    lessons: [
      { title: 'Olá e tchau', kind: 'vocabulary', minutes: 4 },
      { title: 'Quem é você', kind: 'conversation', minutes: 5 },
      { title: 'Ouvindo apresentações', kind: 'listening', minutes: 4 },
      { title: 'Sons e ritmo', kind: 'speaking', minutes: 5 },
      { title: 'Checkpoint · Primeiros contatos', kind: 'checkpoint', minutes: 6 },
    ],
  },
  {
    key: 'daily-life',
    title: 'Dia a dia',
    subtitle: 'Falar da sua rotina, do trabalho e do que você gosta.',
    icon: 'sunny',
    canDo: [
      'Descrever sua rotina no presente',
      'Falar sobre trabalho e estudo',
      'Expressar gostos e preferências',
    ],
    vocabularySlice: [12, 24],
    phraseTopic: 'routine',
    lessons: [
      { title: 'Minha rotina', kind: 'vocabulary', minutes: 5 },
      { title: 'Presente simples', kind: 'grammar', minutes: 6 },
      { title: 'Lendo um perfil', kind: 'reading', minutes: 5 },
      { title: 'Escrevendo sobre você', kind: 'writing', minutes: 6 },
      { title: 'Revisão do módulo', kind: 'review', minutes: 4 },
      { title: 'Checkpoint · Dia a dia', kind: 'checkpoint', minutes: 6 },
    ],
  },
  {
    key: 'out-and-about',
    title: 'Saindo de casa',
    subtitle: 'Restaurante, transporte, compras e pedidos.',
    icon: 'walk',
    canDo: [
      'Pedir comida e bebida em um restaurante',
      'Perguntar direções e usar transporte',
      'Fazer compras e perguntar preços',
    ],
    vocabularySlice: [24, 40],
    phraseTopic: 'out',
    lessons: [
      { title: 'No restaurante', kind: 'vocabulary', minutes: 5 },
      { title: 'Pedindo com educação', kind: 'conversation', minutes: 6 },
      { title: 'Entendendo o garçom', kind: 'listening', minutes: 5 },
      { title: 'Shadowing: pedido completo', kind: 'shadowing', minutes: 6 },
      { title: 'Revisão do módulo', kind: 'review', minutes: 4 },
      { title: 'Projeto · Um dia na cidade', kind: 'project', minutes: 10 },
    ],
  },
];

/* ------------------------------------------------------------------ *
 * Geração
 * ------------------------------------------------------------------ */

/** Ids determinísticos — o mesmo conteúdo tem o mesmo id em qualquer aparelho. */
const courseId = (language: LanguageCode, level: CefrLevel) => `course:${language}:${level}`;
const moduleId = (language: LanguageCode, key: string) => `module:${language}:${key}`;
const lessonId = (language: LanguageCode, key: string, index: number) =>
  `lesson:${language}:${key}:${index}`;
const exerciseId = (lesson: string, index: number) => `${lesson}:ex${index}`;

export type GeneratedContent = {
  courses: Course[];
  modules: Module[];
  lessons: Lesson[];
  exercises: Exercise[];
  vocabulary: VocabularyItem[];
};

/** Gera a trilha completa de um idioma. */
export function buildCourseContent(language: LanguageCode): GeneratedContent {
  const vocabulary = buildVocabulary(language);
  const phrases = CURATED_PHRASES[language] ?? [];

  const course: Course = {
    id: courseId(language, 'A1'),
    language,
    title: 'Fundamentos',
    description:
      'Do zero ao primeiro diálogo real. Base de vocabulário e estruturas essenciais.',
    level: 'A1',
    order: 1,
    contentVersion: 1,
  };

  const modules: Module[] = [];
  const lessons: Lesson[] = [];
  const exercises: Exercise[] = [];

  A1_BLUEPRINT.forEach((blueprint, moduleIndex) => {
    const module: Module = {
      id: moduleId(language, blueprint.key),
      courseId: course.id,
      title: blueprint.title,
      subtitle: blueprint.subtitle,
      icon: blueprint.icon,
      order: moduleIndex,
      canDoStatements: blueprint.canDo,
    };
    modules.push(module);

    const moduleVocabulary = vocabulary.slice(...blueprint.vocabularySlice);
    const modulePhrases = phrases.filter((phrase) => phrase.topic === blueprint.phraseTopic);

    blueprint.lessons.forEach((lessonBlueprint, lessonIndex) => {
      const id = lessonId(language, blueprint.key, lessonIndex);

      const lesson: Lesson = {
        id,
        moduleId: module.id,
        title: lessonBlueprint.title,
        kind: lessonBlueprint.kind,
        order: lessonIndex,
        estimatedMinutes: lessonBlueprint.minutes,
        // XP proporcional ao esforço, com bônus nos marcos.
        xpReward:
          lessonBlueprint.kind === 'checkpoint'
            ? 60
            : lessonBlueprint.kind === 'project'
              ? 120
              : 25,
        prerequisites:
          lessonIndex === 0 ? [] : [lessonId(language, blueprint.key, lessonIndex - 1)],
        // Os dois primeiros módulos são gratuitos por inteiro. O terceiro é o
        // ponto onde o usuário já sentiu valor — e onde a conversão acontece.
        premium: moduleIndex >= 2 && lessonIndex >= 2,
      };
      lessons.push(lesson);

      exercises.push(
        ...buildExercises({
          lesson,
          language,
          vocabulary: moduleVocabulary,
          phrases: modulePhrases,
        }),
      );
    });
  });

  return { courses: [course], modules, lessons, exercises, vocabulary };
}

/* ------------------------------------------------------------------ *
 * Construção de exercícios por tipo de lição
 * ------------------------------------------------------------------ */

type BuildParams = {
  lesson: Lesson;
  language: LanguageCode;
  vocabulary: VocabularyItem[];
  phrases: Phrase[];
};

/**
 * Monta a sequência de exercícios de uma lição.
 *
 * A ordem dentro da lição segue a progressão de dificuldade de recuperação
 * de memória: **reconhecer → completar → produzir**. Pedir produção livre
 * antes de reconhecimento gera frustração e abandono; pedir só reconhecimento
 * gera a ilusão de saber, que quebra na primeira conversa real.
 */
function buildExercises(params: BuildParams): Exercise[] {
  const { lesson, vocabulary } = params;

  switch (lesson.kind) {
    case 'vocabulary':
      return buildVocabularyLesson(params);
    case 'grammar':
      return buildGrammarLesson(params);
    case 'listening':
      return buildListeningLesson(params);
    case 'speaking':
      return buildSpeakingLesson(params);
    case 'reading':
      return buildReadingLesson(params);
    case 'writing':
      return buildWritingLesson(params);
    case 'conversation':
      return buildConversationLesson(params);
    case 'shadowing':
      return buildShadowingLesson(params);
    case 'review':
      return buildReviewLesson(params);
    case 'checkpoint':
      return buildCheckpointLesson(params);
    case 'project':
      return buildProjectLesson(params);
    default:
      return vocabulary.length > 0 ? buildVocabularyLesson(params) : [];
  }
}

/** Distratores plausíveis: mesma classe gramatical, o que torna o exercício real. */
function pickDistractors(
  target: VocabularyItem,
  pool: VocabularyItem[],
  count: number,
): string[] {
  const sameClass = pool.filter(
    (item) => item.id !== target.id && item.partOfSpeech === target.partOfSpeech,
  );
  const fallback = pool.filter((item) => item.id !== target.id);
  const source = sameClass.length >= count ? sameClass : fallback;

  return source.slice(0, count).map((item) => item.translation);
}

function buildVocabularyLesson({ lesson, vocabulary }: BuildParams): Exercise[] {
  const exercises: Exercise[] = [];
  const items = vocabulary.slice(0, 6);

  items.forEach((item, index) => {
    // 1. Reconhecimento: escolher a tradução.
    const distractors = pickDistractors(item, vocabulary, 3);
    const choices = [item.translation, ...distractors];

    exercises.push({
      id: exerciseId(lesson.id, exercises.length),
      lessonId: lesson.id,
      order: exercises.length,
      type: 'multiple_choice',
      difficulty: 0.25,
      conceptIds: [item.id],
      prompt: `O que significa "${item.term}"?`,
      audioText: item.term,
      choices,
      correctIndex: 0,
      explanation: item.exampleSentence
        ? `${item.exampleSentence} — ${item.exampleTranslation}`
        : undefined,
      hint: item.partOfSpeech ? `É um(a) ${item.partOfSpeech}.` : undefined,
    });

    // 2. Produção: escrever o termo a partir do português (a cada dois itens,
    // para não tornar a lição cansativa).
    if (index % 2 === 1) {
      exercises.push({
        id: exerciseId(lesson.id, exercises.length),
        lessonId: lesson.id,
        order: exercises.length,
        type: 'translate',
        difficulty: 0.55,
        conceptIds: [item.id],
        prompt: item.translation,
        direction: 'to_target',
        acceptedAnswers: [item.term],
        explanation: item.exampleSentence ?? undefined,
      });
    }
  });

  return exercises;
}

function buildGrammarLesson({ lesson, phrases, vocabulary }: BuildParams): Exercise[] {
  const exercises: Exercise[] = [];

  phrases.slice(0, 4).forEach((phrase) => {
    const words = phrase.target.split(' ');
    if (words.length < 3) return;

    // Lacuna no meio da frase — onde a estrutura gramatical costuma morar.
    const blankIndex = Math.floor(words.length / 2);
    const answer = words[blankIndex]!;
    const template = words
      .map((word, index) => (index === blankIndex ? '___' : word))
      .join(' ');

    exercises.push({
      id: exerciseId(lesson.id, exercises.length),
      lessonId: lesson.id,
      order: exercises.length,
      type: 'fill_blank',
      difficulty: 0.5,
      conceptIds: [phrase.id],
      template,
      acceptedAnswers: [answer],
      choices: [answer, ...vocabulary.slice(0, 3).map((item) => item.term)].sort(),
      explanation: `Tradução: ${phrase.native}`,
    });
  });

  phrases.slice(0, 3).forEach((phrase) => {
    const tokens = phrase.target.split(' ');
    if (tokens.length < 3) return;

    exercises.push({
      id: exerciseId(lesson.id, exercises.length),
      lessonId: lesson.id,
      order: exercises.length,
      type: 'word_bank',
      difficulty: 0.6,
      conceptIds: [phrase.id],
      prompt: phrase.native,
      // Ordena alfabeticamente para embaralhar de forma determinística — dois
      // aparelhos mostram o mesmo exercício, o que importa para suporte.
      tokens: [...tokens].sort((a, b) => a.localeCompare(b)),
      solution: tokens,
      explanation: `Frase completa: ${phrase.target}`,
    });
  });

  return exercises;
}

function buildListeningLesson({ lesson, phrases }: BuildParams): Exercise[] {
  const exercises: Exercise[] = [];

  phrases.slice(0, 5).forEach((phrase, index) => {
    exercises.push({
      id: exerciseId(lesson.id, exercises.length),
      lessonId: lesson.id,
      order: exercises.length,
      type: 'listen_type',
      difficulty: 0.65,
      conceptIds: [phrase.id],
      audioText: phrase.target,
      acceptedAnswers: [phrase.target],
      // Começa devagar e acelera ao longo da lição — treina o ouvido para a
      // velocidade real sem frustrar no primeiro item.
      rate: index < 2 ? 0.75 : 0.95,
      explanation: `Tradução: ${phrase.native}`,
      hint: `Começa com "${phrase.target.split(' ')[0]}".`,
    });
  });

  return exercises;
}

function buildSpeakingLesson({ lesson, phrases, vocabulary }: BuildParams): Exercise[] {
  const exercises: Exercise[] = [];

  vocabulary.slice(0, 3).forEach((item) => {
    exercises.push({
      id: exerciseId(lesson.id, exercises.length),
      lessonId: lesson.id,
      order: exercises.length,
      type: 'speak',
      difficulty: 0.4,
      conceptIds: [item.id],
      targetText: item.term,
      phonetic: item.phonetic ?? undefined,
      // Palavra isolada tem exigência menor: o reconhecedor erra mais em
      // enunciados curtos, e reprovar aqui desmotiva sem ensinar.
      passThreshold: 0.6,
    });
  });

  phrases.slice(0, 3).forEach((phrase) => {
    exercises.push({
      id: exerciseId(lesson.id, exercises.length),
      lessonId: lesson.id,
      order: exercises.length,
      type: 'speak',
      difficulty: 0.65,
      conceptIds: [phrase.id],
      targetText: phrase.target,
      passThreshold: 0.7,
      explanation: `Tradução: ${phrase.native}`,
    });
  });

  return exercises;
}

function buildReadingLesson({ lesson, phrases }: BuildParams): Exercise[] {
  if (phrases.length < 3) return [];

  const passage = phrases
    .slice(0, 5)
    .map((phrase) => phrase.target)
    .join(' ');

  return [
    {
      id: exerciseId(lesson.id, 0),
      lessonId: lesson.id,
      order: 0,
      type: 'reading_comprehension',
      difficulty: 0.6,
      conceptIds: phrases.slice(0, 5).map((phrase) => phrase.id),
      passage,
      questions: phrases.slice(0, 3).map((phrase, index) => ({
        prompt: `O que significa "${phrase.target}"?`,
        choices: [
          phrase.native,
          phrases[(index + 1) % phrases.length]?.native ?? 'Outra coisa',
          phrases[(index + 2) % phrases.length]?.native ?? 'Nada disso',
        ],
        correctIndex: 0,
      })),
      explanation: 'Toque em qualquer palavra do texto para ver a tradução.',
    },
  ];
}

function buildWritingLesson({ lesson, vocabulary }: BuildParams): Exercise[] {
  return [
    {
      id: exerciseId(lesson.id, 0),
      lessonId: lesson.id,
      order: 0,
      type: 'describe_image',
      difficulty: 0.7,
      conceptIds: vocabulary.slice(0, 4).map((item) => item.id),
      imageUrl: '',
      expectedKeywords: vocabulary.slice(0, 4).map((item) => item.term),
      minWords: 20,
      explanation:
        'Escreva livremente. A correção detalhada chega quando você estiver online; offline verificamos estrutura e vocabulário-alvo.',
    },
  ];
}

function buildConversationLesson({ lesson, phrases }: BuildParams): Exercise[] {
  const exercises: Exercise[] = [];

  phrases.slice(0, 4).forEach((phrase, index) => {
    exercises.push({
      id: exerciseId(lesson.id, exercises.length),
      lessonId: lesson.id,
      order: exercises.length,
      type: 'listen_respond',
      difficulty: 0.55,
      conceptIds: [phrase.id],
      audioText: phrase.target,
      choices: [
        phrase.reply ?? phrases[(index + 1) % phrases.length]?.target ?? '...',
        phrases[(index + 2) % phrases.length]?.target ?? '...',
        phrases[(index + 3) % phrases.length]?.target ?? '...',
      ],
      correctIndex: 0,
      explanation: `Tradução da pergunta: ${phrase.native}`,
    });
  });

  exercises.push({
    id: exerciseId(lesson.id, exercises.length),
    lessonId: lesson.id,
    order: exercises.length,
    type: 'conversation',
    difficulty: 0.7,
    conceptIds: phrases.map((phrase) => phrase.id),
    scenario: 'smalltalk',
    tutorRole: 'Uma pessoa simpática que acabou de te conhecer',
    objectives: ['Dizer seu nome', 'Dizer de onde você é', 'Fazer uma pergunta de volta'],
    minTurns: 3,
  });

  return exercises;
}

function buildShadowingLesson({ lesson, phrases }: BuildParams): Exercise[] {
  const selected = phrases.slice(0, 4);
  if (selected.length === 0) return [];

  // Segmentos com ~2,2s cada — a janela em que a memória fonológica de
  // trabalho consegue segurar um trecho para repetir.
  let cursor = 0;
  const segments = selected.map((phrase) => {
    const durationMs = Math.max(1500, phrase.target.length * 70);
    const segment = { text: phrase.target, startMs: cursor, endMs: cursor + durationMs };
    cursor += durationMs + 300;
    return segment;
  });

  return [
    {
      id: exerciseId(lesson.id, 0),
      lessonId: lesson.id,
      order: 0,
      type: 'shadowing',
      difficulty: 0.75,
      conceptIds: selected.map((phrase) => phrase.id),
      segments,
      audioText: selected.map((phrase) => phrase.target).join(' '),
      explanation:
        'Fale junto com o áudio, sem esperar terminar. O objetivo é o ritmo, não a perfeição.',
    },
  ];
}

function buildReviewLesson({ lesson, vocabulary }: BuildParams): Exercise[] {
  return vocabulary.slice(0, 8).map((item, index) => ({
    id: exerciseId(lesson.id, index),
    lessonId: lesson.id,
    order: index,
    type: 'flashcard' as const,
    difficulty: 0.4,
    conceptIds: [item.id],
    front: item.term,
    back: item.translation,
    example: item.exampleSentence ?? undefined,
  }));
}

/** Checkpoint mistura todos os formatos — é a hora de provar que aprendeu. */
function buildCheckpointLesson(params: BuildParams): Exercise[] {
  const { lesson } = params;

  const mixed = [
    ...buildVocabularyLesson(params).slice(0, 3),
    ...buildListeningLesson(params).slice(0, 2),
    ...buildGrammarLesson(params).slice(0, 3),
    ...buildSpeakingLesson(params).slice(0, 1),
  ];

  // Reindexa para que a barra de progresso da lição fique correta.
  return mixed.map((exercise, index) => ({
    ...exercise,
    id: exerciseId(lesson.id, index),
    order: index,
    // Checkpoint é mais exigente por definição.
    difficulty: Math.min(1, exercise.difficulty + 0.15),
  }));
}

function buildProjectLesson(params: BuildParams): Exercise[] {
  const { lesson, phrases } = params;

  return [
    {
      id: exerciseId(lesson.id, 0),
      lessonId: lesson.id,
      order: 0,
      type: 'conversation',
      difficulty: 0.8,
      conceptIds: phrases.map((phrase) => phrase.id),
      scenario: 'restaurant',
      tutorRole: 'Garçom de um restaurante movimentado',
      objectives: [
        'Pedir uma mesa para duas pessoas',
        'Pedir uma bebida e um prato principal',
        'Perguntar o preço e pedir a conta',
      ],
      minTurns: 5,
      explanation:
        'Este é o projeto final do curso: uma conversa completa, do início ao fim, sem roteiro.',
    },
  ];
}

/** Gera o conteúdo de todos os idiomas suportados. */
export function buildAllContent(languages: LanguageCode[]): GeneratedContent {
  const result: GeneratedContent = {
    courses: [],
    modules: [],
    lessons: [],
    exercises: [],
    vocabulary: [],
  };

  for (const language of languages) {
    const content = buildCourseContent(language);
    result.courses.push(...content.courses);
    result.modules.push(...content.modules);
    result.lessons.push(...content.lessons);
    result.exercises.push(...content.exercises);
    result.vocabulary.push(...content.vocabulary);
  }

  return result;
}
