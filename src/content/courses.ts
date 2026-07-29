/**
 * Construção da trilha de cursos
 * ===============================
 *
 * ## Por que gerado em vez de escrito à mão
 *
 * A **estrutura pedagógica é uma só** (módulos, progressão, tipos de
 * exercício, ordem de introdução) e cada idioma fornece apenas seus *dados*:
 * vocabulário por nível, pontos de gramática e frases curadas. Adicionar um
 * idioma é adicionar listas — a trilha inteira nasce pronta e consistente.
 *
 * ## O que mudou nesta versão
 *
 * Antes existia **um curso de A1 por idioma**. Agora existem **seis**, um por
 * nível CEFR, cada um com vocabulário e gramática próprios (ver
 * `vocabulary-levels.ts` e `grammar-syllabus.ts`). Três consequências:
 *
 *  1. **Nada se repete.** Um verbete pertence a um nível só; a montagem em
 *     `level-content.ts` deduplica dentro e entre níveis. O aluno de C1 nunca
 *     recebe de volta a palavra que respondeu no A2.
 *  2. **A dificuldade é real.** Não é a mesma pergunta com pontuação maior: em
 *     A1 o exercício pede reconhecimento; em C2 pede produção e escolha de
 *     registro. A própria composição da lição muda por nível.
 *  3. **Todo módulo termina em prova.** Com nota, aprovação e registro de
 *     todas as tentativas.
 *
 * ## O que faz um exercício "ensinar"
 *
 * Distrator aleatório não ensina: o aluno acerta por eliminação e sai sem ter
 * pensado. Aqui os distratores vêm de duas fontes deliberadas:
 *
 *  - **Mesma classe gramatical** do alvo, para que a escolha exija saber o
 *    significado e não só reconhecer o formato.
 *  - **O erro que o lusófono realmente comete** — o campo `trap` de cada ponto
 *    de gramática. "I have 25 years" não é alternativa aleatória: é a tradução
 *    literal de "tenho 25 anos", e quem cai nela recebe a explicação na hora.
 */

import type {
  CefrLevel,
  Course,
  Exercise,
  LanguageCode,
  Lesson,
  Module,
  VocabularyItem,
} from '@/domain/types';
import { CEFR_LEVELS } from '@/domain/types';
import { LEVEL_BLUEPRINTS, LEVEL_COURSE_META, type ModuleBlueprint } from './blueprints';
import { type GrammarPoint, grammarPoints } from './grammar-syllabus';
import { levelVocabulary } from './level-content';
import { CURATED_PHRASES, type Phrase } from './phrases';

/* ------------------------------------------------------------------ *
 * Identificadores determinísticos
 * ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ *
 * Geração
 * ------------------------------------------------------------------ */

/** Gera os seis cursos (A1–C2) de um idioma. */
export function buildCourseContent(language: LanguageCode): GeneratedContent {
  const result: GeneratedContent = {
    courses: [],
    modules: [],
    lessons: [],
    exercises: [],
    vocabulary: [],
  };

  CEFR_LEVELS.forEach((level, levelIndex) => {
    const vocabulary = levelVocabulary(language, level);
    if (vocabulary.length === 0) return;

    result.vocabulary.push(...vocabulary);

    const meta = LEVEL_COURSE_META[level];
    const course: Course = {
      id: courseId(language, level),
      language,
      title: meta.title,
      description: meta.description,
      level,
      order: levelIndex + 1,
      contentVersion: 2,
    };
    result.courses.push(course);

    const blueprints = LEVEL_BLUEPRINTS[level];
    const points = grammarPoints(language, level);
    const phrases = CURATED_PHRASES[language] ?? [];

    blueprints.forEach((blueprint, moduleIndex) => {
      const module: Module = {
        id: moduleId(language, blueprint.key),
        courseId: course.id,
        title: blueprint.title,
        subtitle: blueprint.subtitle,
        icon: blueprint.icon,
        order: moduleIndex,
        canDoStatements: blueprint.canDo,
      };
      result.modules.push(module);

      // Fatia o vocabulário do nível entre os módulos, sem sobreposição. Cada
      // módulo recebe um bloco contíguo — repetir verbete entre módulos do
      // mesmo nível seria a repetição que este redesenho existe para eliminar.
      const perModule = Math.ceil(vocabulary.length / blueprints.length);
      const moduleVocabulary = vocabulary.slice(
        moduleIndex * perModule,
        (moduleIndex + 1) * perModule,
      );

      // Mesma lógica para gramática: um ponto pertence a um módulo só.
      const modulePoints = points.filter(
        (_, index) => index % blueprints.length === moduleIndex,
      );

      blueprint.lessons.forEach((lessonBlueprint, lessonIndex) => {
        const id = lessonId(language, blueprint.key, lessonIndex);

        const lesson: Lesson = {
          id,
          moduleId: module.id,
          title: lessonBlueprint.title,
          kind: lessonBlueprint.kind,
          order: lessonIndex,
          estimatedMinutes: lessonBlueprint.minutes,
          xpReward: xpFor(lessonBlueprint.kind, level),
          prerequisites:
            lessonIndex === 0 ? [] : [lessonId(language, blueprint.key, lessonIndex - 1)],
          // Com acesso aberto nada é bloqueado. O campo continua existindo
          // porque o modelo de planos segue íntegro — ver `domain/access.ts`.
          premium: false,
        };
        result.lessons.push(lesson);

        result.exercises.push(
          ...buildExercises({
            lesson,
            language,
            level,
            vocabulary: moduleVocabulary,
            allLevelVocabulary: vocabulary,
            points: modulePoints,
            phrases,
          }),
        );
      });
    });
  });

  return result;
}

/** XP cresce com o nível: uma prova de C1 vale mais que uma lição de A1. */
function xpFor(kind: Lesson['kind'], level: CefrLevel): number {
  const levelMultiplier = 1 + CEFR_LEVELS.indexOf(level) * 0.25;
  const base =
    kind === 'exam' ? 80 : kind === 'project' ? 120 : kind === 'checkpoint' ? 60 : 25;
  return Math.round(base * levelMultiplier);
}

/* ------------------------------------------------------------------ *
 * Construção de exercícios
 * ------------------------------------------------------------------ */

type BuildParams = {
  lesson: Lesson;
  language: LanguageCode;
  level: CefrLevel;
  /** Vocabulário do módulo — o alvo da lição. */
  vocabulary: VocabularyItem[];
  /** Vocabulário do nível inteiro — fonte de distratores plausíveis. */
  allLevelVocabulary: VocabularyItem[];
  points: GrammarPoint[];
  phrases: Phrase[];
};

/**
 * Dificuldade base por nível, 0–1.
 *
 * Existe para que a mesma mecânica pese diferente conforme o nível: uma
 * múltipla escolha de C1 alimenta o SRS como item difícil, não como o item
 * fácil que ela seria em A1.
 */
function levelDifficulty(level: CefrLevel): number {
  return 0.2 + CEFR_LEVELS.indexOf(level) * 0.13;
}

function buildExercises(params: BuildParams): Exercise[] {
  const { lesson } = params;

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
    case 'exam':
      return buildExamLesson(params);
    case 'project':
      return buildProjectLesson(params);
    default:
      return buildVocabularyLesson(params);
  }
}

/**
 * Distratores da mesma classe gramatical.
 *
 * Misturar classes entrega a resposta de graça: numa pergunta cuja resposta é
 * um verbo, duas alternativas substantivas eliminam a dúvida sem exigir
 * conhecimento nenhum.
 */
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

function buildVocabularyLesson(params: BuildParams): Exercise[] {
  const { lesson, level, vocabulary, allLevelVocabulary } = params;
  const exercises: Exercise[] = [];
  const base = levelDifficulty(level);
  const advanced = CEFR_LEVELS.indexOf(level) >= 3;

  vocabulary.slice(0, 6).forEach((item, index) => {
    // Em níveis avançados a múltipla escolha praticamente some: nesse ponto
    // ela não discrimina mais nada, e o que falta treinar é produção.
    if (!advanced || index % 3 === 0) {
      exercises.push({
        id: exerciseId(lesson.id, exercises.length),
        lessonId: lesson.id,
        order: exercises.length,
        type: 'multiple_choice',
        difficulty: base,
        conceptIds: [item.id],
        prompt: `O que significa "${item.term}"?`,
        audioText: item.term,
        choices: [item.translation, ...pickDistractors(item, allLevelVocabulary, 3)],
        correctIndex: 0,
        explanation: item.exampleSentence
          ? `${item.exampleSentence} — ${item.exampleTranslation}`
          : undefined,
        hint:
          item.romanization ??
          (item.partOfSpeech ? `É um(a) ${item.partOfSpeech}.` : undefined),
      });
    }

    // Produção: escrever o termo a partir do português. Em níveis avançados
    // todo item passa por aqui.
    if (advanced || index % 2 === 1) {
      exercises.push({
        id: exerciseId(lesson.id, exercises.length),
        lessonId: lesson.id,
        order: exercises.length,
        type: 'translate',
        difficulty: Math.min(1, base + 0.2),
        conceptIds: [item.id],
        prompt: item.translation,
        direction: 'to_target',
        acceptedAnswers: item.romanization ? [item.term, item.romanization] : [item.term],
        explanation: item.exampleSentence
          ? `${item.exampleSentence} — ${item.exampleTranslation}`
          : undefined,
      });
    }
  });

  return exercises;
}

/**
 * Lição de gramática — o coração do "exercício que ensina".
 *
 * Cada ponto vira dois itens: um de escolha entre a forma certa e a armadilha
 * (o erro típico do lusófono), e um de correção de frase. A explicação exibida
 * ao errar é o campo `why`, que diz **por que a intuição do português falha**
 * — sem isso o aluno decora o item e reproduz o erro na frase seguinte.
 */
function buildGrammarLesson(params: BuildParams): Exercise[] {
  const { lesson, level, points, phrases } = params;
  const exercises: Exercise[] = [];
  const base = levelDifficulty(level);

  for (const point of points) {
    exercises.push({
      id: exerciseId(lesson.id, exercises.length),
      lessonId: lesson.id,
      order: exercises.length,
      type: 'multiple_choice',
      difficulty: Math.min(1, base + 0.1),
      conceptIds: [`grammar:${point.title}`],
      prompt: `${point.rule}\n\nQual está correto?`,
      choices: [point.correct, point.trap],
      correctIndex: 0,
      explanation: point.why,
      hint: point.rule,
    });

    exercises.push({
      id: exerciseId(lesson.id, exercises.length),
      lessonId: lesson.id,
      order: exercises.length,
      type: 'correct_sentence',
      difficulty: Math.min(1, base + 0.25),
      conceptIds: [`grammar:${point.title}`],
      // A frase errada apresentada é exatamente a que o aluno produziria.
      incorrect: point.trap,
      acceptedAnswers: [point.correct],
      errorKind: point.errorKind ?? 'usage',
      explanation: `${point.rule}\n\n${point.why}`,
    });
  }

  // Montagem de frase a partir de material curado, quando houver.
  phrases.slice(0, 2).forEach((phrase) => {
    const tokens = phrase.target.split(' ');
    if (tokens.length < 3) return;

    exercises.push({
      id: exerciseId(lesson.id, exercises.length),
      lessonId: lesson.id,
      order: exercises.length,
      type: 'word_bank',
      difficulty: Math.min(1, base + 0.15),
      conceptIds: [phrase.id],
      prompt: phrase.native,
      // Ordem alfabética embaralha de forma determinística: dois aparelhos
      // mostram o mesmo exercício, o que importa para suporte.
      tokens: [...tokens].sort((a, b) => a.localeCompare(b)),
      solution: tokens,
      explanation: `Frase completa: ${phrase.target}`,
    });
  });

  return exercises;
}

function buildListeningLesson(params: BuildParams): Exercise[] {
  const { lesson, level, vocabulary, phrases } = params;
  const exercises: Exercise[] = [];
  const base = levelDifficulty(level);

  // Em nível alto o ditado usa a frase de exemplo do próprio vocabulário do
  // nível, que é mais densa que as frases curadas de sobrevivência.
  const source =
    CEFR_LEVELS.indexOf(level) >= 2
      ? vocabulary
          .filter((item) => item.exampleSentence)
          .map((item) => ({
            id: item.id,
            target: item.exampleSentence as string,
            native: item.exampleTranslation ?? '',
          }))
      : phrases.slice(0, 5).map((phrase) => ({
          id: phrase.id,
          target: phrase.target,
          native: phrase.native,
        }));

  source.slice(0, 5).forEach((item, index) => {
    exercises.push({
      id: exerciseId(lesson.id, exercises.length),
      lessonId: lesson.id,
      order: exercises.length,
      type: 'listen_type',
      difficulty: Math.min(1, base + 0.2),
      conceptIds: [item.id],
      audioText: item.target,
      acceptedAnswers: [item.target],
      // Começa devagar e acelera; nos níveis altos já entra em ritmo natural,
      // porque a dificuldade ali é justamente a velocidade real.
      rate: CEFR_LEVELS.indexOf(level) >= 3 ? 1 : index < 2 ? 0.75 : 0.95,
      explanation: `Tradução: ${item.native}`,
      hint: `Começa com "${item.target.split(' ')[0]}".`,
    });
  });

  return exercises;
}

function buildSpeakingLesson(params: BuildParams): Exercise[] {
  const { lesson, level, vocabulary, phrases } = params;
  const exercises: Exercise[] = [];
  const base = levelDifficulty(level);

  vocabulary.slice(0, 3).forEach((item) => {
    exercises.push({
      id: exerciseId(lesson.id, exercises.length),
      lessonId: lesson.id,
      order: exercises.length,
      type: 'speak',
      difficulty: base,
      conceptIds: [item.id],
      targetText: item.term,
      phonetic: item.phonetic ?? item.romanization ?? undefined,
      // Palavra isolada tem exigência menor: o reconhecedor erra mais em
      // enunciados curtos, e reprovar aqui desmotiva sem ensinar.
      passThreshold: 0.6,
    });
  });

  const sentences = vocabulary
    .filter((item) => item.exampleSentence)
    .slice(0, 3)
    .map((item) => ({
      id: item.id,
      target: item.exampleSentence as string,
      native: item.exampleTranslation ?? '',
    }));

  const fallback = phrases.slice(0, 3).map((phrase) => ({
    id: phrase.id,
    target: phrase.target,
    native: phrase.native,
  }));

  for (const item of sentences.length > 0 ? sentences : fallback) {
    exercises.push({
      id: exerciseId(lesson.id, exercises.length),
      lessonId: lesson.id,
      order: exercises.length,
      type: 'speak',
      difficulty: Math.min(1, base + 0.25),
      conceptIds: [item.id],
      targetText: item.target,
      passThreshold: 0.7,
      explanation: `Tradução: ${item.native}`,
    });
  }

  return exercises;
}

function buildReadingLesson(params: BuildParams): Exercise[] {
  const { lesson, level, vocabulary, phrases } = params;

  // O texto é montado com as frases de exemplo do vocabulário do módulo, que
  // são do nível certo por construção. Isso resolve o problema clássico do
  // "texto de C1 escrito com vocabulário de A2".
  const sentences = vocabulary
    .filter((item) => item.exampleSentence)
    .slice(0, 6)
    .map((item) => ({
      id: item.id,
      target: item.exampleSentence as string,
      native: item.exampleTranslation ?? '',
    }));

  const source =
    sentences.length >= 3
      ? sentences
      : phrases.slice(0, 5).map((phrase) => ({
          id: phrase.id,
          target: phrase.target,
          native: phrase.native,
        }));

  if (source.length < 3) return [];

  return [
    {
      id: exerciseId(lesson.id, 0),
      lessonId: lesson.id,
      order: 0,
      type: 'reading_comprehension',
      difficulty: Math.min(1, levelDifficulty(level) + 0.2),
      conceptIds: source.map((item) => item.id),
      passage: source.map((item) => item.target).join(' '),
      questions: source.slice(0, 3).map((item, index) => ({
        prompt: `O que significa "${item.target}"?`,
        choices: [
          item.native,
          source[(index + 1) % source.length]?.native ?? 'Outra coisa',
          source[(index + 2) % source.length]?.native ?? 'Nada disso',
        ],
        correctIndex: 0,
      })),
      explanation: 'Toque em qualquer palavra do texto para ver a tradução.',
    },
  ];
}

function buildWritingLesson(params: BuildParams): Exercise[] {
  const { lesson, level, vocabulary, points } = params;
  const exercises: Exercise[] = [];
  const base = levelDifficulty(level);

  // Corrigir a frase errada vem antes de escrever livremente: é mais barato
  // e ataca diretamente o erro que a pessoa comete.
  for (const point of points.slice(0, 2)) {
    exercises.push({
      id: exerciseId(lesson.id, exercises.length),
      lessonId: lesson.id,
      order: exercises.length,
      type: 'correct_sentence',
      difficulty: Math.min(1, base + 0.2),
      conceptIds: [`grammar:${point.title}`],
      incorrect: point.trap,
      acceptedAnswers: [point.correct],
      errorKind: point.errorKind ?? 'usage',
      explanation: `${point.rule}\n\n${point.why}`,
    });
  }

  const words = Math.round(20 + CEFR_LEVELS.indexOf(level) * 25);

  exercises.push({
    id: exerciseId(lesson.id, exercises.length),
    lessonId: lesson.id,
    order: exercises.length,
    type: 'describe_image',
    difficulty: Math.min(1, base + 0.3),
    conceptIds: vocabulary.slice(0, 4).map((item) => item.id),
    imageUrl: '',
    expectedKeywords: vocabulary.slice(0, 4).map((item) => item.term),
    minWords: words,
    explanation: `Escreva pelo menos ${words} palavras usando o vocabulário do módulo. Offline verificamos estrutura e vocabulário-alvo; a correção detalhada chega quando você estiver online.`,
  });

  return exercises;
}

function buildConversationLesson(params: BuildParams): Exercise[] {
  const { lesson, level, phrases, vocabulary } = params;
  const exercises: Exercise[] = [];
  const base = levelDifficulty(level);
  const levelIndex = CEFR_LEVELS.indexOf(level);

  phrases.slice(0, 3).forEach((phrase, index) => {
    exercises.push({
      id: exerciseId(lesson.id, exercises.length),
      lessonId: lesson.id,
      order: exercises.length,
      type: 'listen_respond',
      difficulty: Math.min(1, base + 0.15),
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
    difficulty: Math.min(1, base + 0.3),
    conceptIds: vocabulary.map((item) => item.id),
    scenario: levelIndex >= 3 ? 'business' : 'smalltalk',
    tutorRole:
      levelIndex >= 4
        ? 'Um interlocutor exigente que discorda de você e pede justificativas'
        : levelIndex >= 2
          ? 'Um colega de trabalho discutindo um prazo apertado'
          : 'Uma pessoa simpática que acabou de te conhecer',
    objectives:
      levelIndex >= 3
        ? [
            'Sustentar uma posição com pelo menos dois argumentos',
            'Reconhecer um ponto do outro sem abrir mão do seu',
            'Propor uma alternativa concreta',
          ]
        : ['Dizer seu nome', 'Dizer de onde você é', 'Fazer uma pergunta de volta'],
    // Conversa longa é o que separa proficiência de sobrevivência.
    minTurns: 3 + levelIndex,
  });

  return exercises;
}

function buildShadowingLesson(params: BuildParams): Exercise[] {
  const { lesson, level, vocabulary, phrases } = params;

  const sentences = vocabulary
    .filter((item) => item.exampleSentence)
    .slice(0, 4)
    .map((item) => item.exampleSentence as string);

  const selected =
    sentences.length > 0 ? sentences : phrases.slice(0, 4).map((phrase) => phrase.target);
  if (selected.length === 0) return [];

  // Segmentos de ~2,2s — a janela em que a memória fonológica de trabalho
  // consegue segurar um trecho para repetir.
  let cursor = 0;
  const segments = selected.map((text) => {
    const durationMs = Math.max(1500, text.length * 70);
    const segment = { text, startMs: cursor, endMs: cursor + durationMs };
    cursor += durationMs + 300;
    return segment;
  });

  return [
    {
      id: exerciseId(lesson.id, 0),
      lessonId: lesson.id,
      order: 0,
      type: 'shadowing',
      difficulty: Math.min(1, levelDifficulty(level) + 0.3),
      conceptIds: vocabulary.slice(0, 4).map((item) => item.id),
      segments,
      audioText: selected.join(' '),
      explanation:
        'Fale junto com o áudio, sem esperar terminar. O objetivo é o ritmo, não a perfeição.',
    },
  ];
}

function buildReviewLesson(params: BuildParams): Exercise[] {
  const { lesson, level, vocabulary } = params;

  return vocabulary.slice(0, 8).map((item, index) => ({
    id: exerciseId(lesson.id, index),
    lessonId: lesson.id,
    order: index,
    type: 'flashcard' as const,
    difficulty: levelDifficulty(level),
    conceptIds: [item.id],
    front: item.term,
    back: item.romanization ? `${item.romanization} · ${item.translation}` : item.translation,
    example: item.exampleSentence ?? undefined,
  }));
}

/**
 * Prova de nível ao fim do módulo.
 *
 * Três decisões que a diferenciam de uma lição comum:
 *
 *  1. **Sem dica e sem explicação prévia.** Numa prova, a explicação vem depois
 *     do resultado — mostrar a regra junto da pergunta mede leitura, não
 *     conhecimento.
 *  2. **Mistura obrigatória de formatos**, incluindo produção. Uma prova só de
 *     múltipla escolha superestima o aluno de forma sistemática.
 *  3. **Composição muda por nível.** Em A1 pesa reconhecimento; a partir de B1
 *     entram correção de frase e tradução ativa, que é onde o conhecimento
 *     frágil aparece.
 */
function buildExamLesson(params: BuildParams): Exercise[] {
  const { lesson, level } = params;
  const levelIndex = CEFR_LEVELS.indexOf(level);

  const pool: Exercise[] = [
    ...buildVocabularyLesson(params).slice(0, levelIndex >= 2 ? 4 : 3),
    ...buildGrammarLesson(params).slice(0, 4),
    ...buildListeningLesson(params).slice(0, 2),
  ];

  if (levelIndex >= 2) {
    pool.push(...buildWritingLesson(params).slice(0, 1));
  }

  return (
    pool
      // Reindexa para a barra de progresso ficar correta e para os ids não
      // colidirem com os das lições de origem.
      .map((exercise, index) => ({
        ...exercise,
        id: exerciseId(lesson.id, index),
        order: index,
        // Prova é mais exigente por definição — e sem dica.
        difficulty: Math.min(1, exercise.difficulty + 0.15),
        hint: undefined,
      }))
  );
}

function buildProjectLesson(params: BuildParams): Exercise[] {
  const { lesson, level, vocabulary } = params;
  const levelIndex = CEFR_LEVELS.indexOf(level);

  return [
    {
      id: exerciseId(lesson.id, 0),
      lessonId: lesson.id,
      order: 0,
      type: 'conversation',
      difficulty: Math.min(1, levelDifficulty(level) + 0.35),
      conceptIds: vocabulary.map((item) => item.id),
      scenario: levelIndex >= 3 ? 'business' : 'restaurant',
      tutorRole:
        levelIndex >= 3
          ? 'Um entrevistador que testa a consistência dos seus argumentos'
          : 'Garçom de um restaurante movimentado',
      objectives:
        levelIndex >= 3
          ? [
              'Apresentar uma posição em até três frases',
              'Responder a duas objeções sem repetir o argumento inicial',
              'Fechar com uma síntese',
            ]
          : [
              'Pedir uma mesa para duas pessoas',
              'Pedir uma bebida e um prato principal',
              'Perguntar o preço e pedir a conta',
            ],
      minTurns: 5 + levelIndex,
      explanation:
        'Projeto do curso: uma conversa completa, do início ao fim, sem roteiro e sem apoio.',
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

export type { ModuleBlueprint };
