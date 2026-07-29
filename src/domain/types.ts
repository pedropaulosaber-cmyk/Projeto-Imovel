/**
 * Lumo — Modelo de domínio
 *
 * Tipos compartilhados por app, banco local e API. Este arquivo é o contrato:
 * se algo muda aqui, muda em todas as camadas de uma vez, e o TypeScript
 * aponta cada ponto de quebra.
 *
 * Convenções:
 *  - IDs são strings (ULID) geradas no cliente. Isso é obrigatório num
 *    sistema offline-first: o dispositivo precisa criar registros sem servidor.
 *  - Timestamps são epoch em milissegundos (number), nunca Date, para
 *    serializar limpo em JSON e SQLite.
 *  - Datas de calendário (ofensiva, metas diárias) são strings 'YYYY-MM-DD'
 *    no fuso local do usuário — "hoje" é um conceito humano, não UTC.
 */

/* ------------------------------------------------------------------ *
 * Primitivos
 * ------------------------------------------------------------------ */

export type ID = string;
export type Timestamp = number;
/** Data de calendário local, 'YYYY-MM-DD'. */
export type LocalDate = string;

/** Códigos ISO 639-1 dos idiomas suportados. */
export const SUPPORTED_LANGUAGES = ['en', 'es', 'fr', 'it', 'de', 'ja', 'ko', 'zh'] as const;
export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number];

/**
 * Idiomas cuja escrita não usa alfabeto latino.
 *
 * Para eles, todo termo carrega **romanização obrigatória** e a interface
 * mostra os dois. O motivo é prático: um iniciante brasileiro não consegue ler
 * kanji nem hanzi na primeira semana, e não tem teclado para digitá-los. A
 * romanização é a ponte que torna esses idiomas estudáveis desde o dia 1 sem
 * exigir IME nem tipografia especial.
 */
export const NON_LATIN_LANGUAGES: LanguageCode[] = ['ja', 'ko', 'zh'];

export function usesNonLatinScript(language: LanguageCode): boolean {
  return NON_LATIN_LANGUAGES.includes(language);
}

/** Idiomas em que a interface e as explicações podem ser apresentadas. */
export type UILanguage = 'pt' | 'en' | 'es';

export const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;
export type CefrLevel = (typeof CEFR_LEVELS)[number];

/* ------------------------------------------------------------------ *
 * Usuário e onboarding
 * ------------------------------------------------------------------ */

/** Motivação declarada no onboarding. Direciona o conteúdo, não só a copy. */
export type LearningGoal =
  | 'travel'
  | 'work'
  | 'exchange'
  | 'conversation'
  | 'exam'
  | 'business'
  | 'culture';

/** Minutos por dia que o usuário se compromete a estudar. */
export type DailyCommitment = 5 | 10 | 15 | 20 | 30 | 60;

export type OnboardingAnswers = {
  targetLanguage: LanguageCode;
  uiLanguage: UILanguage;
  goals: LearningGoal[];
  /** Nível declarado; refinado depois pelo teste de nivelamento. */
  selfAssessedLevel: CefrLevel | 'zero';
  dailyMinutes: DailyCommitment;
  /** Dias da semana comprometidos, 0 = domingo. */
  studyDays: number[];
  /** Hora do lembrete diário, minutos desde a meia-noite local. */
  reminderMinute: number | null;
  /** Resultado do teste de nivelamento rápido, se aplicado. */
  placementScore?: number;
};

export type SubscriptionPlan = 'free' | 'premium' | 'family' | 'student';

export type UserProfile = {
  id: ID;
  displayName: string;
  email: string | null;
  avatarUrl: string | null;
  bio: string | null;
  uiLanguage: UILanguage;
  /** Idioma nativo — usado para escolher as traduções e explicações. */
  nativeLanguage: string;
  plan: SubscriptionPlan;
  /** Fim do período pago, se houver. */
  planExpiresAt: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  /** Falso enquanto o usuário não terminou o onboarding. */
  onboardingCompleted: boolean;
  timezone: string;
};

/**
 * Matrícula em um idioma. Um usuário pode estudar vários ao mesmo tempo,
 * cada um com progresso, ofensiva e plano independentes.
 */
export type Enrollment = {
  id: ID;
  userId: ID;
  language: LanguageCode;
  goals: LearningGoal[];
  currentLevel: CefrLevel;
  dailyGoalXp: number;
  dailyMinutes: DailyCommitment;
  studyDays: number[];
  reminderMinute: number | null;
  startedAt: Timestamp;
  /** Idioma ativo na interface. Apenas uma matrícula fica ativa por vez. */
  isActive: boolean;
  /** Ritmo e formato da trilha. Trocável a qualquer momento. */
  learningMode: LearningMode;
  updatedAt: Timestamp;
};

/**
 * Modos de aprendizado.
 *
 * - **`complete`** — a trilha inteira: 16 tipos de exercício, vidas, produção
 *   escrita e falada. Para quem quer profundidade.
 * - **`essential`** — o caminho curto. Só os quatro formatos mais diretos,
 *   sessões de 3 a 5 exercícios, sem vidas e sem punição. Existe porque a
 *   maior causa de abandono não é dificuldade do idioma: é a sessão parecer
 *   longa demais num dia ruim. Quem usa o Essencial mantém a ofensiva; quem
 *   abandona, não aprende nada.
 */
export const LEARNING_MODES = ['complete', 'essential'] as const;
export type LearningMode = (typeof LEARNING_MODES)[number];

/* ------------------------------------------------------------------ *
 * Estrutura de conteúdo
 * ------------------------------------------------------------------ */

export type Course = {
  id: ID;
  language: LanguageCode;
  title: string;
  description: string;
  level: CefrLevel;
  /** Ordem do curso dentro da trilha do idioma. */
  order: number;
  /** Versão do conteúdo — usada para invalidar downloads offline. */
  contentVersion: number;
};

export type Module = {
  id: ID;
  courseId: ID;
  title: string;
  /** Tema em uma frase, mostrado no card da trilha. */
  subtitle: string;
  icon: string;
  order: number;
  /** Objetivos "consigo fazer" no padrão CEFR. */
  canDoStatements: string[];
};

export type LessonKind =
  | 'vocabulary'
  | 'grammar'
  | 'listening'
  | 'speaking'
  | 'reading'
  | 'writing'
  | 'conversation'
  | 'shadowing'
  | 'review'
  | 'checkpoint'
  | 'project';

export type Lesson = {
  id: ID;
  moduleId: ID;
  title: string;
  kind: LessonKind;
  order: number;
  /** Duração estimada em minutos — alimenta o planejamento diário. */
  estimatedMinutes: number;
  xpReward: number;
  /** IDs de lições que precisam estar concluídas antes desta. */
  prerequisites: ID[];
  /** True quando exige assinatura. */
  premium: boolean;
};

/* ------------------------------------------------------------------ *
 * Exercícios
 * ------------------------------------------------------------------ */

export type ExerciseType =
  | 'multiple_choice' // Escolha a alternativa correta
  | 'translate' // Traduza a frase
  | 'listen_type' // Ouça e escreva
  | 'fill_blank' // Complete a frase
  | 'word_bank' // Monte a frase com as palavras dadas
  | 'match_pairs' // Ligue os pares
  | 'speak' // Pronuncie a frase
  | 'shadowing' // Repita acompanhando o áudio
  | 'dictation' // Ditado de trecho longo
  | 'describe_image' // Descreva a imagem
  | 'correct_sentence' // Corrija a frase errada
  | 'order_dialogue' // Organize o diálogo
  | 'listen_respond' // Escute e responda
  | 'reading_comprehension' // Interpretação de texto
  | 'conversation' // Conversa livre com o tutor
  | 'flashcard'; // Revisão SRS

/** Base comum a todo exercício. */
type ExerciseBase = {
  id: ID;
  lessonId: ID;
  order: number;
  /** Dificuldade intrínseca 0–1, usada pelo motor adaptativo. */
  difficulty: number;
  /** Vocabulário e gramática exercitados — alimenta o SRS. */
  conceptIds: ID[];
  /** Explicação exibida após o erro. */
  explanation?: string;
  /** Dica opcional, custa XP para revelar. */
  hint?: string;
};

export type MultipleChoiceExercise = ExerciseBase & {
  type: 'multiple_choice';
  prompt: string;
  /** Texto no idioma-alvo lido em voz alta ao abrir, se houver. */
  audioText?: string;
  choices: string[];
  correctIndex: number;
};

export type TranslateExercise = ExerciseBase & {
  type: 'translate';
  prompt: string;
  /** 'to_target' traduz do nativo para o idioma estudado. */
  direction: 'to_target' | 'to_native';
  /** Respostas aceitas; a comparação é tolerante a acento e pontuação. */
  acceptedAnswers: string[];
};

export type ListenTypeExercise = ExerciseBase & {
  type: 'listen_type';
  audioText: string;
  acceptedAnswers: string[];
  /** Velocidade inicial da locução. */
  rate: number;
};

export type FillBlankExercise = ExerciseBase & {
  type: 'fill_blank';
  /** Frase com '___' marcando a lacuna. */
  template: string;
  acceptedAnswers: string[];
  /** Alternativas; ausente = digitação livre. */
  choices?: string[];
};

export type WordBankExercise = ExerciseBase & {
  type: 'word_bank';
  prompt: string;
  /** Palavras embaralhadas, incluindo distratores. */
  tokens: string[];
  /** Ordem correta dos tokens. */
  solution: string[];
};

export type MatchPairsExercise = ExerciseBase & {
  type: 'match_pairs';
  pairs: { left: string; right: string }[];
};

export type SpeakExercise = ExerciseBase & {
  type: 'speak';
  targetText: string;
  /** Transcrição fonética exibida como apoio. */
  phonetic?: string;
  /** Nota mínima de pronúncia (0–1) para considerar correto. */
  passThreshold: number;
};

export type ShadowingExercise = ExerciseBase & {
  type: 'shadowing';
  segments: { text: string; startMs: number; endMs: number }[];
  audioText: string;
};

export type DictationExercise = ExerciseBase & {
  type: 'dictation';
  audioText: string;
  acceptedAnswers: string[];
};

export type DescribeImageExercise = ExerciseBase & {
  type: 'describe_image';
  imageUrl: string;
  /** Palavras esperadas; a avaliação fina é feita pela IA quando online. */
  expectedKeywords: string[];
  minWords: number;
};

export type CorrectSentenceExercise = ExerciseBase & {
  type: 'correct_sentence';
  incorrect: string;
  acceptedAnswers: string[];
  /** Tipo de erro plantado — usado no feedback. */
  errorKind: 'agreement' | 'tense' | 'order' | 'preposition' | 'spelling' | 'article';
};

export type OrderDialogueExercise = ExerciseBase & {
  type: 'order_dialogue';
  lines: { speaker: string; text: string }[];
  /** Ordem correta por índice de `lines`. */
  solution: number[];
};

export type ListenRespondExercise = ExerciseBase & {
  type: 'listen_respond';
  audioText: string;
  choices: string[];
  correctIndex: number;
};

export type ReadingComprehensionExercise = ExerciseBase & {
  type: 'reading_comprehension';
  passage: string;
  questions: { prompt: string; choices: string[]; correctIndex: number }[];
};

export type ConversationExercise = ExerciseBase & {
  type: 'conversation';
  scenario: string;
  /** Persona que o tutor assume. */
  tutorRole: string;
  /** Objetivos que o usuário precisa cumprir na conversa. */
  objectives: string[];
  minTurns: number;
};

export type FlashcardExercise = ExerciseBase & {
  type: 'flashcard';
  front: string;
  back: string;
  example?: string;
};

export type Exercise =
  | MultipleChoiceExercise
  | TranslateExercise
  | ListenTypeExercise
  | FillBlankExercise
  | WordBankExercise
  | MatchPairsExercise
  | SpeakExercise
  | ShadowingExercise
  | DictationExercise
  | DescribeImageExercise
  | CorrectSentenceExercise
  | OrderDialogueExercise
  | ListenRespondExercise
  | ReadingComprehensionExercise
  | ConversationExercise
  | FlashcardExercise;

/** Resultado da correção de uma tentativa. */
export type ExerciseResult = {
  correct: boolean;
  /** Qualidade da resposta 0–1. Binário para escolha múltipla, contínuo para fala. */
  score: number;
  /** Mensagem curta mostrada imediatamente. */
  feedback: string;
  /** Explicação longa, opcional. */
  explanation?: string;
  /** Resposta correta em texto, para exibir após o erro. */
  correctAnswer?: string;
};

/* ------------------------------------------------------------------ *
 * Vocabulário e SRS
 * ------------------------------------------------------------------ */

export type VocabularyItem = {
  id: ID;
  language: LanguageCode;
  /** Forma canônica (lema). */
  term: string;
  translation: string;
  partOfSpeech: string | null;
  phonetic: string | null;
  /**
   * Transliteração para o alfabeto latino (romaji, pinyin, romanização
   * revisada). Obrigatória nos idiomas de escrita não latina; nula nos demais.
   */
  romanization: string | null;
  exampleSentence: string | null;
  exampleTranslation: string | null;
  /** Romanização da frase de exemplo, quando aplicável. */
  exampleRomanization: string | null;
  /** Rank de frequência no idioma; menor = mais comum. */
  frequencyRank: number | null;
  cefr: CefrLevel | null;
  tags: string[];
};

/** Estado de memória de um item para um usuário. Coração do SRS. */
export type ReviewState = {
  id: ID;
  userId: ID;
  /** Aponta para VocabularyItem ou para um conceito gramatical. */
  conceptId: ID;
  language: LanguageCode;
  /** Fator de facilidade do SM-2, mínimo 1.3. */
  easeFactor: number;
  /** Intervalo atual em dias. */
  intervalDays: number;
  /** Acertos consecutivos. Zera ao errar. */
  repetitions: number;
  /** Momento em que o item volta para revisão. */
  dueAt: Timestamp;
  lastReviewedAt: Timestamp | null;
  /** Estabilidade estimada da memória, em dias. Usada no cálculo de retenção. */
  stability: number;
  /** Dificuldade percebida 0–1, aprendida com o histórico de erros. */
  difficulty: number;
  lapses: number;
  totalReviews: number;
  state: 'new' | 'learning' | 'review' | 'relearning' | 'mastered';
  /** Marcado como favorito pelo usuário. */
  starred: boolean;
};

/** Qualidade auto-reportada ou inferida de uma revisão. */
export type ReviewGrade = 'again' | 'hard' | 'good' | 'easy';

/* ------------------------------------------------------------------ *
 * Progresso e gamificação
 * ------------------------------------------------------------------ */

export type LessonProgress = {
  id: ID;
  userId: ID;
  lessonId: ID;
  status: 'locked' | 'available' | 'in_progress' | 'completed';
  /** Melhor precisão obtida, 0–1. */
  bestAccuracy: number;
  attempts: number;
  completedAt: Timestamp | null;
  updatedAt: Timestamp;
};

/** Agregado por dia. É a granularidade do dashboard e da ofensiva. */
export type DailyStat = {
  id: ID;
  userId: ID;
  date: LocalDate;
  xpEarned: number;
  minutesStudied: number;
  lessonsCompleted: number;
  reviewsCompleted: number;
  exercisesAttempted: number;
  exercisesCorrect: number;
  /** Média das notas de pronúncia do dia, ou null se não praticou fala. */
  pronunciationScore: number | null;
  newWordsLearned: number;
  /** Verdadeiro quando a meta diária foi batida. */
  goalMet: boolean;
};

export type StreakState = {
  userId: ID;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: LocalDate | null;
  /** "Congelamentos" disponíveis para não perder a ofensiva. */
  freezesAvailable: number;
  /** Datas em que um congelamento foi consumido. */
  freezesUsed: LocalDate[];
};

export type Wallet = {
  userId: ID;
  /** Moeda mole, ganha jogando. */
  coins: number;
  /** XP acumulado de todos os tempos. */
  totalXp: number;
  /** Nível derivado do XP total. */
  level: number;
};

export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export type Achievement = {
  id: ID;
  code: string;
  title: string;
  description: string;
  icon: string;
  tier: AchievementTier;
  /** Meta numérica para desbloquear. */
  target: number;
  /** Métrica observada. */
  metric:
    | 'streak_days'
    | 'total_xp'
    | 'lessons_completed'
    | 'words_mastered'
    | 'perfect_lessons'
    | 'speaking_minutes'
    | 'reviews_completed'
    | 'early_sessions'
    | 'night_sessions';
  coinReward: number;
};

export type AchievementProgress = {
  id: ID;
  userId: ID;
  achievementId: ID;
  progress: number;
  unlockedAt: Timestamp | null;
  /** Falso até o usuário ver a animação de desbloqueio. */
  seen: boolean;
};

export type QuestPeriod = 'daily' | 'weekly';

export type Quest = {
  id: ID;
  userId: ID;
  period: QuestPeriod;
  code: string;
  title: string;
  description: string;
  icon: string;
  target: number;
  progress: number;
  xpReward: number;
  coinReward: number;
  /** Momento em que a missão deixa de valer. */
  expiresAt: Timestamp;
  completedAt: Timestamp | null;
};

export type LeagueTier =
  | 'bronze'
  | 'silver'
  | 'gold'
  | 'sapphire'
  | 'ruby'
  | 'emerald'
  | 'diamond';

export type LeagueStanding = {
  userId: ID;
  displayName: string;
  avatarUrl: string | null;
  weeklyXp: number;
  rank: number;
  /** Marca o usuário atual na lista, para destacar a linha. */
  isCurrentUser: boolean;
};

/* ------------------------------------------------------------------ *
 * Sessões de estudo
 * ------------------------------------------------------------------ */

export type SessionKind = 'lesson' | 'review' | 'conversation' | 'reading' | 'listening';

export type StudySession = {
  id: ID;
  userId: ID;
  kind: SessionKind;
  /** Nulo em sessões de revisão avulsa. */
  lessonId: ID | null;
  language: LanguageCode;
  startedAt: Timestamp;
  endedAt: Timestamp | null;
  xpEarned: number;
  exercisesAttempted: number;
  exercisesCorrect: number;
  /** Registro por exercício, para análise de dificuldade. */
  attempts: ExerciseAttempt[];
};

export type ExerciseAttempt = {
  exerciseId: ID;
  type: ExerciseType;
  correct: boolean;
  score: number;
  /** Tempo até responder, em ms. Sinal forte de fluência automática. */
  responseMs: number;
  usedHint: boolean;
  answeredAt: Timestamp;
};

/* ------------------------------------------------------------------ *
 * Plano de estudos
 * ------------------------------------------------------------------ */

/** Um bloco de atividade sugerido para o dia. */
export type PlanBlock = {
  kind: 'lesson' | 'review' | 'speaking' | 'listening' | 'reading' | 'writing';
  title: string;
  description: string;
  icon: string;
  estimatedMinutes: number;
  xpReward: number;
  /** Rota interna para onde o bloco leva. */
  route: string;
  /** Prioridade 0–1; blocos vencidos de SRS têm prioridade máxima. */
  priority: number;
};

export type StudyPlan = {
  userId: ID;
  language: LanguageCode;
  date: LocalDate;
  dailyGoalXp: number;
  targetMinutes: number;
  blocks: PlanBlock[];
  /** Estimativa de semanas até o próximo nível CEFR, no ritmo atual. */
  weeksToNextLevel: number;
};

/* ------------------------------------------------------------------ *
 * Conteúdo offline
 * ------------------------------------------------------------------ */

export type DownloadQuality = 'standard' | 'high';

export type DownloadStatus = 'idle' | 'queued' | 'downloading' | 'complete' | 'failed';

/** Um pacote de conteúdo baixável (idioma inteiro, módulo ou só áudio). */
export type ContentBundle = {
  id: ID;
  language: LanguageCode;
  scope: 'language' | 'course' | 'module' | 'audio';
  /** ID do curso/módulo quando o escopo é parcial. */
  scopeId: ID | null;
  title: string;
  /** Tamanho estimado em bytes, por qualidade. */
  sizeBytes: Record<DownloadQuality, number>;
  contentVersion: number;
};

export type DownloadRecord = {
  id: ID;
  bundleId: ID;
  status: DownloadStatus;
  quality: DownloadQuality;
  /** 0–1. */
  progress: number;
  bytesDownloaded: number;
  downloadedAt: Timestamp | null;
  contentVersion: number;
  error: string | null;
};

/* ------------------------------------------------------------------ *
 * Tutor de IA
 * ------------------------------------------------------------------ */

export type TutorRole = 'user' | 'tutor' | 'system';

export type TutorMessage = {
  id: ID;
  conversationId: ID;
  role: TutorRole;
  content: string;
  /** Tradução para o idioma nativo, gerada sob demanda. */
  translation?: string;
  /** Correções aplicadas à mensagem do usuário. */
  corrections?: Correction[];
  createdAt: Timestamp;
  /** Verdadeiro quando a resposta veio do motor offline, não da IA remota. */
  offline: boolean;
};

export type Correction = {
  original: string;
  corrected: string;
  explanation: string;
  kind: 'grammar' | 'vocabulary' | 'spelling' | 'style' | 'punctuation';
};

export type TutorConversation = {
  id: ID;
  userId: ID;
  language: LanguageCode;
  title: string;
  /** Cenário quando a conversa nasce de um exercício. */
  scenario: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

/* ------------------------------------------------------------------ *
 * Sincronização
 * ------------------------------------------------------------------ */

/**
 * Operação pendente de envio ao servidor.
 *
 * O app escreve sempre no banco local e enfileira aqui. A fila é drenada em
 * background quando há rede. É isto que torna o app offline-first de verdade,
 * e não apenas "com modo offline".
 */
export type SyncOperation = {
  id: ID;
  /** Coleção lógica afetada. */
  entity: string;
  entityId: ID;
  op: 'upsert' | 'delete';
  /** Corpo serializado da mutação. */
  payload: string;
  /** Relógio lógico do dispositivo para ordenar operações. */
  clock: number;
  createdAt: Timestamp;
  attempts: number;
  lastError: string | null;
};

export type SyncStatus = {
  lastSyncAt: Timestamp | null;
  pendingOperations: number;
  syncing: boolean;
  online: boolean;
  lastError: string | null;
};

/* ------------------------------------------------------------------ *
 * Apostilas
 * ------------------------------------------------------------------ */

/**
 * Apostila de um nível.
 *
 * Uma por (idioma, nível CEFR), acompanhando exatamente a trilha daquele
 * nível. É material de **consulta e revisão** — não substitui os exercícios,
 * mas resolve algo que app nenhum resolve bem: rever a regra depois, sem
 * precisar refazer a lição.
 *
 * Fica disponível offline e pode ser exportada como arquivo.
 */
export type Workbook = {
  id: ID;
  language: LanguageCode;
  level: CefrLevel;
  title: string;
  subtitle: string;
  /** Curso que a apostila acompanha. */
  courseId: ID;
  sections: WorkbookSection[];
  /** Estimativa de páginas na exportação. */
  estimatedPages: number;
  contentVersion: number;
};

export type WorkbookSection = {
  id: ID;
  title: string;
  /** Ordena a apostila na mesma sequência dos módulos da trilha. */
  order: number;
  kind: 'intro' | 'vocabulary' | 'grammar' | 'phrases' | 'idioms' | 'practice' | 'summary';
  /** Blocos de conteúdo, renderizados na ordem. */
  blocks: WorkbookBlock[];
};

/**
 * Bloco de conteúdo da apostila.
 *
 * União discriminada em vez de HTML/markdown livre: o app renderiza cada tipo
 * com o design system (tabelas legíveis no celular, áudio tocável nos exemplos)
 * e a exportação para texto continua trivial.
 */
export type WorkbookBlock =
  | { kind: 'heading'; text: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'callout'; tone: 'tip' | 'warning' | 'rule'; title: string; text: string }
  | { kind: 'list'; items: string[] }
  | {
      kind: 'vocabTable';
      rows: { term: string; romanization?: string; translation: string; note?: string }[];
    }
  | {
      kind: 'examples';
      items: { target: string; romanization?: string; native: string }[];
    }
  | { kind: 'conjugation'; verb: string; forms: { person: string; form: string }[] };

/** Estado de download de uma apostila no dispositivo. */
export type WorkbookDownload = {
  id: ID;
  workbookId: ID;
  downloadedAt: Timestamp;
  sizeBytes: number;
};

/* ------------------------------------------------------------------ *
 * Expressões idiomáticas
 * ------------------------------------------------------------------ */

/**
 * Expressão idiomática com explicação em português.
 *
 * É a lacuna que nenhum app do segmento cobre bem: o aprendiz chega ao B1
 * entendendo todas as palavras de "it's raining cats and dogs" e mesmo assim
 * não entende a frase. Tradução palavra a palavra atrapalha — por isso cada
 * verbete separa **o que está escrito** do **o que significa**, e dá o
 * equivalente brasileiro quando existe.
 */
export type Idiom = {
  id: ID;
  language: LanguageCode;
  /** A expressão no idioma-alvo. */
  expression: string;
  romanization: string | null;
  /** Tradução literal — deliberadamente estranha, para o contraste didático. */
  literal: string;
  /** O que a expressão realmente quer dizer, em português. */
  meaning: string;
  /** Expressão brasileira equivalente, quando existe. */
  equivalent: string | null;
  /** De onde vem — a origem é o que fixa a expressão na memória. */
  origin: string | null;
  example: string;
  exampleTranslation: string;
  register: 'formal' | 'neutral' | 'informal' | 'slang';
  cefr: CefrLevel;
  /** Frequência de uso real, 1 (rara) a 5 (todo dia). */
  frequency: number;
  tags: string[];
};

/** Progresso do usuário numa expressão. */
export type IdiomProgress = {
  id: ID;
  userId: ID;
  idiomId: ID;
  /** Vezes que a expressão foi vista. */
  seen: number;
  /** Acertos em exercícios com ela. */
  correct: number;
  starred: boolean;
  updatedAt: Timestamp;
};
