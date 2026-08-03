/**
 * Base de conhecimento offline do tutor.
 *
 * Três tabelas, todas embutidas no app (sem rede):
 *  1. `COMMON_ERRORS` — erros típicos de falantes de português, por idioma.
 *  2. `GRAMMAR_RULES` — regras explicadas em português, com exemplos.
 *  3. `SCENARIO_SCRIPTS` — roteiros de conversa guiada.
 *
 * O foco em erros de **lusófonos** é deliberado e é um diferencial real: a
 * maioria dos apps corrige contra um falante genérico. Saber que um brasileiro
 * vai escrever "I have 25 years" ou "j'ai 25 ans" corretamente mas errar
 * "ich bin 25 Jahre" permite um feedback muito mais preciso, e de graça.
 */

import type { Correction, LanguageCode } from '@/domain/types';
import { EXTRA_SCENARIOS } from './conversation';

/* ------------------------------------------------------------------ *
 * Erros comuns
 * ------------------------------------------------------------------ */

export type CommonError = {
  /** Padrão global (flag `g` obrigatória — `detectCommonErrors` reseta o índice). */
  pattern: RegExp;
  /** Substituição aplicada sobre o trecho casado. */
  replacement: string;
  explanation: string;
  kind: Correction['kind'];
};

export const COMMON_ERRORS: Record<LanguageCode, CommonError[]> = {
  en: [
    {
      pattern: /\bi have (\d+) years?\b/gi,
      replacement: 'I am $1 years old',
      explanation:
        'Em inglês a idade usa o verbo *to be*, não *to have*: "I am 25 years old". O calque do português ("tenho 25 anos") é o erro mais comum de brasileiros.',
      kind: 'grammar',
    },
    {
      pattern: /\bi have \d+ years old\b/gi,
      replacement: 'I am $& years old',
      explanation: 'Use "I am X years old" — nunca "I have X years old".',
      kind: 'grammar',
    },
    {
      pattern: /\bpeoples\b/gi,
      replacement: 'people',
      explanation: '"People" já é plural. O plural "peoples" só existe no sentido de "povos".',
      kind: 'grammar',
    },
    {
      pattern: /\binformations\b/gi,
      replacement: 'information',
      explanation: '"Information" é incontável em inglês e não tem plural.',
      kind: 'grammar',
    },
    {
      pattern: /\bi am agree\b/gi,
      replacement: 'I agree',
      explanation: '"Agree" já é verbo: diga "I agree", não "I am agree".',
      kind: 'grammar',
    },
    {
      pattern: /\bmake a question\b/gi,
      replacement: 'ask a question',
      explanation: 'Em inglês se "pergunta" com *ask*: "ask a question".',
      kind: 'vocabulary',
    },
    {
      pattern: /\bactually\b/gi,
      replacement: 'currently',
      explanation:
        'Falso cognato: "actually" significa "na verdade". Para "atualmente" use *currently* ou *nowadays*.',
      kind: 'vocabulary',
    },
    {
      pattern: /\bpretend to\b/gi,
      replacement: 'intend to',
      explanation:
        'Falso cognato: "pretend" é "fingir". Para "pretender" use *intend* ou *plan*.',
      kind: 'vocabulary',
    },
    {
      pattern: /\bexplain me\b/gi,
      replacement: 'explain to me',
      explanation: '"Explain" pede a preposição: "explain to me".',
      kind: 'grammar',
    },
  ],

  es: [
    {
      pattern: /\bmuy mucho\b/gi,
      replacement: 'muchísimo',
      explanation: '"Muy" não modifica "mucho". Use "muchísimo".',
      kind: 'grammar',
    },
    {
      pattern: /\bembarazada\b/gi,
      replacement: 'avergonzada',
      explanation:
        'Falso amigo clássico: "embarazada" significa grávida. Para "embaraçada" use *avergonzada*.',
      kind: 'vocabulary',
    },
    {
      pattern: /\bexquisito\b/gi,
      replacement: 'exquisito',
      explanation:
        'Atenção ao sentido: em espanhol "exquisito" é elogio (delicioso, refinado), não "esquisito".',
      kind: 'vocabulary',
    },
    {
      pattern: /\bhay que tener \d+ años\b/gi,
      replacement: 'tener $& años',
      explanation: 'A idade em espanhol usa *tener*, igual ao português: "tengo 25 años".',
      kind: 'grammar',
    },
  ],

  fr: [
    {
      pattern: /\bje suis (\d+) ans\b/gi,
      replacement: "j'ai $1 ans",
      explanation: 'A idade em francês usa *avoir*: "j\'ai 25 ans", não "je suis 25 ans".',
      kind: 'grammar',
    },
    {
      pattern: /\bje suis d'accord avec toi\b/gi,
      replacement: "je suis d'accord avec toi",
      explanation: 'Correto. "Être d\'accord" é a forma certa de concordar em francês.',
      kind: 'grammar',
    },
    {
      pattern: /\bvisiter (mon|ma|mes) (ami|amie|amis)\b/gi,
      replacement: 'rendre visite à $1 $2',
      explanation:
        '"Visiter" é para lugares. Para pessoas use *rendre visite à*: "rendre visite à mon ami".',
      kind: 'vocabulary',
    },
  ],

  it: [
    {
      pattern: /\bio sono (\d+) anni\b/gi,
      replacement: 'ho $1 anni',
      explanation: 'A idade em italiano usa *avere*: "ho 25 anni".',
      kind: 'grammar',
    },
    {
      pattern: /\bburro\b/gi,
      replacement: 'burro',
      explanation: 'Atenção: "burro" em italiano é manteiga. O animal é *asino*.',
      kind: 'vocabulary',
    },
  ],

  de: [
    {
      pattern: /\bich habe (\d+) jahre\b/gi,
      replacement: 'ich bin $1 Jahre alt',
      explanation:
        'A idade em alemão usa *sein*: "ich bin 25 Jahre alt". Aqui o alemão segue o inglês, não o português.',
      kind: 'grammar',
    },
    {
      pattern: /\bich bin einverstanden mit\b/gi,
      replacement: 'ich bin einverstanden mit',
      explanation: 'Correto. Repare que o alemão exige o dativo depois de *mit*.',
      kind: 'grammar',
    },
    {
      pattern: /\bbekommen\b/gi,
      replacement: 'bekommen',
      explanation:
        'Falso amigo: "bekommen" é *receber*, não "tornar-se". Para "tornar-se" use *werden*.',
      kind: 'vocabulary',
    },
  ],
};

/* ------------------------------------------------------------------ *
 * Regras gramaticais
 * ------------------------------------------------------------------ */

export type GrammarRule = {
  title: string;
  /** Palavras que sinalizam que esta regra está em jogo. */
  triggers: string[];
  explanation: string;
  examples: { correct: string; incorrect: string }[];
};

export const GRAMMAR_RULES: Record<LanguageCode, GrammarRule[]> = {
  en: [
    {
      title: 'Presente simples — terceira pessoa',
      triggers: ['he ', 'she ', 'it '],
      explanation:
        'No presente simples, a terceira pessoa do singular (he/she/it) leva -s no verbo. É a marca que some primeiro quando falamos rápido — vale conferir sempre.',
      examples: [
        { correct: 'She works in a bank.', incorrect: 'She work in a bank.' },
        { correct: 'He goes to school.', incorrect: 'He go to school.' },
      ],
    },
    {
      title: 'Present perfect vs. passado simples',
      triggers: ['have been', 'has been', 'have gone', 'since', 'for '],
      explanation:
        'Use o present perfect (have/has + particípio) quando o momento exato não importa ou a ação continua. Use o passado simples quando há um tempo definido no passado.',
      examples: [
        {
          correct: 'I have lived here for five years.',
          incorrect: 'I live here for five years.',
        },
        { correct: 'I went to Paris in 2019.', incorrect: 'I have gone to Paris in 2019.' },
      ],
    },
    {
      title: 'Artigo definido com generalizações',
      triggers: ['the '],
      explanation:
        'Em inglês, generalizações no plural não levam artigo. "Os brasileiros gostam de futebol" vira "Brazilians like football", sem "the".',
      examples: [{ correct: 'Cats are independent.', incorrect: 'The cats are independent.' }],
    },
  ],

  es: [
    {
      title: 'Ser vs. estar',
      triggers: ['ser', 'estar', 'soy', 'estoy', 'es ', 'está'],
      explanation:
        '*Ser* para características permanentes e identidade; *estar* para estados temporários e localização. A regra é a mesma do português, e por isso o erro costuma ser de descuido, não de conceito.',
      examples: [
        { correct: 'Estoy cansado.', incorrect: 'Soy cansado.' },
        { correct: 'Soy brasileño.', incorrect: 'Estoy brasileño.' },
      ],
    },
    {
      title: 'Pretérito indefinido vs. imperfecto',
      triggers: ['hablé', 'hablaba', 'fui', 'era'],
      explanation:
        'O indefinido marca ação concluída e pontual; o imperfecto descreve cenário, hábito ou ação em curso no passado.',
      examples: [
        { correct: 'Ayer comí paella.', incorrect: 'Ayer comía paella.' },
        {
          correct: 'Cuando era niño, jugaba mucho.',
          incorrect: 'Cuando fui niño, jugué mucho.',
        },
      ],
    },
  ],

  fr: [
    {
      title: 'Concordância do particípio com "être"',
      triggers: ['je suis allé', 'elle est', 'nous sommes'],
      explanation:
        'Com o auxiliar *être*, o particípio concorda em gênero e número com o sujeito: "elle est allée", "ils sont allés".',
      examples: [
        { correct: 'Elle est allée au marché.', incorrect: 'Elle est allé au marché.' },
      ],
    },
    {
      title: 'Partitivo (du, de la, des)',
      triggers: ['du ', 'de la ', 'des '],
      explanation:
        'Para quantidades indefinidas, o francês exige o artigo partitivo. "Je mange du pain" — nunca "je mange pain".',
      examples: [{ correct: "Je bois de l'eau.", incorrect: 'Je bois eau.' }],
    },
  ],

  it: [
    {
      title: 'Auxiliar essere vs. avere',
      triggers: ['sono andato', 'ho mangiato', 'è arrivato'],
      explanation:
        'Verbos de movimento e mudança de estado usam *essere* (com concordância); os demais usam *avere*.',
      examples: [
        { correct: 'Sono andato a Roma.', incorrect: 'Ho andato a Roma.' },
        { correct: 'Ho mangiato la pizza.', incorrect: 'Sono mangiato la pizza.' },
      ],
    },
  ],

  de: [
    {
      title: 'Verbo na segunda posição',
      triggers: ['heute', 'morgen', 'gestern', 'weil', 'dass'],
      explanation:
        'Na oração principal alemã o verbo conjugado ocupa sempre a segunda posição, mesmo quando a frase começa por advérbio: "Heute gehe ich ins Kino".',
      examples: [
        { correct: 'Heute gehe ich ins Kino.', incorrect: 'Heute ich gehe ins Kino.' },
      ],
    },
    {
      title: 'Verbo no fim em oração subordinada',
      triggers: ['weil', 'dass', 'wenn', 'obwohl'],
      explanation:
        'Depois de conjunções subordinativas (weil, dass, wenn, obwohl), o verbo conjugado vai para o **fim** da oração.',
      examples: [
        {
          correct: 'Ich bleibe zu Hause, weil es regnet.',
          incorrect: 'Ich bleibe zu Hause, weil es regnet nicht draußen gehen.',
        },
      ],
    },
    {
      title: 'Acusativo vs. dativo',
      triggers: ['den ', 'dem ', 'der ', 'die '],
      explanation:
        'O acusativo marca o objeto direto (quem sofre a ação) e o dativo o objeto indireto (a quem se destina). É o que substitui a ordem fixa de palavras do português.',
      examples: [
        { correct: 'Ich gebe dem Mann das Buch.', incorrect: 'Ich gebe den Mann das Buch.' },
      ],
    },
  ],
};

/* ------------------------------------------------------------------ *
 * Roteiros de conversa
 * ------------------------------------------------------------------ */

export type ScenarioScript = {
  title: string;
  description: string;
  icon: string;
  /** Nível mínimo recomendado. */
  minLevel: string;
  /** Falas do tutor por turno, em cada idioma. */
  turns: Partial<Record<LanguageCode, string>>[];
  fallback: string;
};

export const SCENARIO_SCRIPTS: Record<string, ScenarioScript> = {
  restaurant: {
    title: 'No restaurante',
    description: 'Pedir mesa, escolher pratos, pedir a conta.',
    icon: 'restaurant',
    minLevel: 'A1',
    fallback: 'Welcome! How can I help you today?',
    turns: [
      {
        en: 'Good evening! Welcome. Do you have a reservation?',
        es: '¡Buenas noches! Bienvenido. ¿Tiene una reserva?',
        fr: 'Bonsoir ! Bienvenue. Vous avez une réservation ?',
        it: 'Buonasera! Benvenuto. Ha una prenotazione?',
        de: 'Guten Abend! Willkommen. Haben Sie eine Reservierung?',
      },
      {
        en: 'Perfect. Here is the menu. Would you like something to drink first?',
        es: 'Perfecto. Aquí tiene la carta. ¿Desea algo de beber primero?',
        fr: "Parfait. Voici la carte. Vous voulez boire quelque chose d'abord ?",
        it: 'Perfetto. Ecco il menù. Desidera qualcosa da bere?',
        de: 'Perfekt. Hier ist die Speisekarte. Möchten Sie zuerst etwas trinken?',
      },
      {
        en: 'Excellent choice. And what would you like as a main course?',
        es: 'Excelente elección. ¿Y de plato principal?',
        fr: 'Excellent choix. Et comme plat principal ?',
        it: 'Ottima scelta. E come secondo?',
        de: 'Ausgezeichnete Wahl. Und als Hauptgericht?',
      },
      {
        en: 'Of course. Anything else? Dessert, coffee?',
        es: 'Por supuesto. ¿Algo más? ¿Postre, café?',
        fr: 'Bien sûr. Autre chose ? Dessert, café ?',
        it: 'Certo. Altro? Dolce, caffè?',
        de: 'Natürlich. Sonst noch etwas? Nachtisch, Kaffee?',
      },
      {
        en: 'Here is the bill. Will you pay by card or cash?',
        es: 'Aquí tiene la cuenta. ¿Paga con tarjeta o en efectivo?',
        fr: "Voici l'addition. Vous payez par carte ou en espèces ?",
        it: 'Ecco il conto. Paga con carta o in contanti?',
        de: 'Hier ist die Rechnung. Zahlen Sie mit Karte oder bar?',
      },
    ],
  },

  hotel: {
    title: 'No hotel',
    description: 'Check-in, pedidos e problemas no quarto.',
    icon: 'bed',
    minLevel: 'A1',
    fallback: 'Good afternoon! How can I help you?',
    turns: [
      {
        en: 'Good afternoon! Welcome. Are you checking in?',
        es: '¡Buenas tardes! Bienvenido. ¿Va a registrarse?',
        fr: 'Bonjour ! Bienvenue. Vous arrivez ?',
        it: 'Buon pomeriggio! Benvenuto. Deve fare il check-in?',
        de: 'Guten Tag! Willkommen. Möchten Sie einchecken?',
      },
      {
        en: 'May I see your passport, please? And how many nights?',
        es: '¿Me permite su pasaporte? ¿Y cuántas noches?',
        fr: 'Votre passeport, s’il vous plaît ? Et combien de nuits ?',
        it: 'Posso vedere il passaporto? E quante notti?',
        de: 'Darf ich Ihren Pass sehen? Und wie viele Nächte?',
      },
      {
        en: 'Your room is on the fourth floor. Breakfast is from 7 to 10.',
        es: 'Su habitación está en el cuarto piso. El desayuno es de 7 a 10.',
        fr: 'Votre chambre est au quatrième étage. Le petit-déjeuner est de 7h à 10h.',
        it: 'La sua camera è al quarto piano. La colazione è dalle 7 alle 10.',
        de: 'Ihr Zimmer ist im vierten Stock. Frühstück gibt es von 7 bis 10 Uhr.',
      },
      {
        en: 'I am sorry to hear that. I will send someone right away.',
        es: 'Lamento escuchar eso. Enviaré a alguien de inmediato.',
        fr: 'Je suis désolé. J’envoie quelqu’un tout de suite.',
        it: 'Mi dispiace. Mando subito qualcuno.',
        de: 'Das tut mir leid. Ich schicke sofort jemanden.',
      },
    ],
  },

  interview: {
    title: 'Entrevista de emprego',
    description: 'Apresentar-se, falar da experiência, fazer perguntas.',
    icon: 'briefcase',
    minLevel: 'B1',
    fallback: 'Thanks for coming. Tell me a bit about yourself.',
    turns: [
      {
        en: 'Thanks for coming in. Could you tell me a bit about yourself?',
        es: 'Gracias por venir. ¿Podría hablarme un poco de usted?',
        fr: 'Merci d’être venu. Pouvez-vous vous présenter ?',
        it: 'Grazie di essere venuto. Può parlarmi un po’ di lei?',
        de: 'Danke, dass Sie gekommen sind. Erzählen Sie mir etwas über sich.',
      },
      {
        en: 'Interesting. What would you say is your greatest strength?',
        es: 'Interesante. ¿Cuál diría que es su mayor fortaleza?',
        fr: 'Intéressant. Quelle est votre plus grande qualité ?',
        it: 'Interessante. Qual è il suo punto di forza?',
        de: 'Interessant. Was ist Ihre größte Stärke?',
      },
      {
        en: 'And why do you want to work with us specifically?',
        es: '¿Y por qué quiere trabajar con nosotros en particular?',
        fr: 'Et pourquoi voulez-vous travailler chez nous ?',
        it: 'E perché vuole lavorare proprio con noi?',
        de: 'Und warum möchten Sie gerade bei uns arbeiten?',
      },
      {
        en: 'Great. Do you have any questions for me?',
        es: 'Muy bien. ¿Tiene alguna pregunta para mí?',
        fr: 'Très bien. Avez-vous des questions ?',
        it: 'Bene. Ha domande per me?',
        de: 'Sehr gut. Haben Sie Fragen an mich?',
      },
    ],
  },

  smalltalk: {
    title: 'Conversa do dia a dia',
    description: 'Falar sobre você, rotina, planos e opiniões.',
    icon: 'chatbubbles',
    minLevel: 'A2',
    fallback: 'Hi! How was your day?',
    turns: [
      {
        en: 'Hey! How was your day today?',
        es: '¡Hola! ¿Qué tal tu día?',
        fr: 'Salut ! Ta journée s’est bien passée ?',
        it: 'Ciao! Com’è andata la giornata?',
        de: 'Hallo! Wie war dein Tag?',
      },
      {
        en: 'Nice. Do you usually do that on weekdays?',
        es: 'Qué bien. ¿Sueles hacer eso entre semana?',
        fr: 'Sympa. Tu fais ça souvent en semaine ?',
        it: 'Bello. Lo fai di solito durante la settimana?',
        de: 'Schön. Machst du das oft unter der Woche?',
      },
      {
        en: 'And what are your plans for the weekend?',
        es: '¿Y qué planes tienes para el fin de semana?',
        fr: 'Et tu fais quoi ce week-end ?',
        it: 'E che programmi hai per il weekend?',
        de: 'Und was hast du am Wochenende vor?',
      },
    ],
  },
};

/**
 * Catálogo completo — os cenários originais mais os de `conversation.ts`.
 *
 * A divisão em dois arquivos não é organizacional: os cenários de
 * `conversation.ts` cobrem **todo** idioma suportado, enquanto estes originais
 * nasceram com falas parciais. Mantê-los separados deixa essa diferença de
 * cobertura visível em vez de escondida no meio de uma lista.
 */
export const ALL_SCENARIOS: Record<string, ScenarioScript> = {
  ...SCENARIO_SCRIPTS,
  ...EXTRA_SCENARIOS,
};

export const SCENARIO_LIST = Object.entries(ALL_SCENARIOS).map(([id, script]) => ({
  id,
  ...script,
}));
