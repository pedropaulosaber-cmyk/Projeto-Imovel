/**
 * Índice de contexto do tutor
 * ============================
 *
 * ## O problema que resolve
 *
 * O tutor offline sabia responder sobre um punhado de regras catalogadas em
 * `knowledge.ts`. Fora dessa lista, caía numa resposta genérica — o que, na
 * prática, significa não responder.
 *
 * Enquanto isso, o app já continha **todo o conteúdo necessário** espalhado em
 * outros arquivos: 144 pontos de gramática com armadilha e explicação, mais de
 * mil verbetes com exemplo em contexto, 64 expressões idiomáticas, falsos
 * cognatos e notas de pragmática. Nada disso chegava ao tutor.
 *
 * Este módulo é a ponte. Ele não duplica conteúdo: **indexa** o que já existe e
 * devolve os trechos relevantes para uma pergunta. É a diferença entre um tutor
 * que sabe vinte coisas e um que sabe tudo o que o curso ensina.
 *
 * ## Por que busca léxica e não embeddings
 *
 * Embeddings exigiriam um modelo no dispositivo (dezenas de MB), tempo de
 * inferência a cada pergunta e bateria. Para um corpus desta ordem de grandeza,
 * uma busca por termos com pontuação por campo entrega qualidade equivalente
 * em microssegundos e zero byte extra no binário. Quando houver rede, o
 * provedor remoto assume — e aí o corpus inteiro vai no prompt.
 *
 * A escolha deliberada é: **funcionar offline sempre**, melhorar online.
 */

import { grammarPoints } from '@/content/grammar-syllabus';
import { buildIdioms } from '@/content/idioms';
import { allLevelVocabulary } from '@/content/level-content';
import { CEFR_LEVELS, type CefrLevel, type LanguageCode } from '@/domain/types';
import { FALSE_FRIENDS, PRAGMATIC_NOTES } from './false-friends';
import { GRAMMAR_RULES } from './knowledge';

export type ContextEntry = {
  kind: 'gramática' | 'vocabulário' | 'expressão' | 'falso cognato' | 'cultura';
  title: string;
  body: string;
  /** Nível em que o item é ensinado, quando aplicável. */
  level: CefrLevel | null;
  /** Termos usados na busca — pré-normalizados. */
  terms: string[];
};

/**
 * Remove acentos e caixa: "está" e "esta" precisam casar na busca, porque no
 * celular quase ninguém digita acento numa pergunta rápida.
 *
 * `NFD` separa a letra do diacrítico e `\p{M}` casa qualquer marca combinante.
 * Usar a propriedade Unicode em vez de um intervalo de códigos é mais preciso
 * (cobre também diacríticos fora do bloco latino, que importam no vietnamita e
 * no grego) e evita o intervalo literal, que fica invisível no editor.
 */
function normalize(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
}

function tokenize(text: string): string[] {
  return normalize(text)
    .split(/[^\p{L}\p{N}]+/u)
    .filter((token) => token.length > 1);
}

/* ------------------------------------------------------------------ *
 * Construção do índice
 * ------------------------------------------------------------------ */

const CACHE = new Map<LanguageCode, ContextEntry[]>();

/**
 * Monta o corpus de um idioma.
 *
 * Memorizado por idioma porque é caro o suficiente para não ser refeito a cada
 * pergunta e barato o suficiente para não valer persistência: a montagem é
 * pura, determinística e roda em poucos milissegundos.
 */
export function buildContextIndex(language: LanguageCode): ContextEntry[] {
  const cached = CACHE.get(language);
  if (cached) return cached;

  const entries: ContextEntry[] = [];

  /* Gramática por nível — a fonte mais densa, com armadilha e explicação. */
  for (const level of CEFR_LEVELS) {
    for (const point of grammarPoints(language, level)) {
      entries.push({
        kind: 'gramática',
        title: point.title,
        body: `${point.rule}\n\nCorreto: ${point.correct}\nErro comum: ${point.trap}\n\nPor quê: ${point.why}`,
        level,
        terms: tokenize(
          `${point.title} ${point.rule} ${point.correct} ${point.trap} ${point.why}`,
        ),
      });
    }
  }

  /* Regras do catálogo antigo — mantidas, com seus gatilhos. */
  for (const rule of GRAMMAR_RULES[language] ?? []) {
    entries.push({
      kind: 'gramática',
      title: rule.title,
      body: `${rule.explanation}\n\n${rule.examples
        .map((example) => `Certo: ${example.correct}\nErrado: ${example.incorrect}`)
        .join('\n\n')}`,
      level: null,
      terms: tokenize(`${rule.title} ${rule.explanation} ${rule.triggers.join(' ')}`),
    });
  }

  /* Vocabulário de todos os níveis, com exemplo em contexto. */
  for (const item of allLevelVocabulary(language)) {
    entries.push({
      kind: 'vocabulário',
      title: item.term,
      body: [
        `${item.term}${item.romanization ? ` (${item.romanization})` : ''} — ${item.translation}`,
        item.partOfSpeech ? `Classe: ${item.partOfSpeech}` : '',
        item.exampleSentence
          ? `Exemplo: ${item.exampleSentence} — ${item.exampleTranslation}`
          : '',
      ]
        .filter(Boolean)
        .join('\n'),
      level: item.cefr,
      terms: tokenize(
        `${item.term} ${item.romanization ?? ''} ${item.translation} ${item.exampleSentence ?? ''}`,
      ),
    });
  }

  /* Expressões idiomáticas, com literal, sentido e equivalente. */
  for (const idiom of buildIdioms(language)) {
    entries.push({
      kind: 'expressão',
      title: idiom.expression,
      body: [
        `${idiom.expression}${idiom.romanization ? ` (${idiom.romanization})` : ''}`,
        `Ao pé da letra: ${idiom.literal}`,
        `Significa: ${idiom.meaning}`,
        idiom.equivalent ? `Equivalente em português: ${idiom.equivalent}` : '',
        idiom.origin ? `Origem: ${idiom.origin}` : '',
        `Exemplo: ${idiom.example} — ${idiom.exampleTranslation}`,
      ]
        .filter(Boolean)
        .join('\n'),
      level: idiom.cefr,
      terms: tokenize(
        `${idiom.expression} ${idiom.romanization ?? ''} ${idiom.meaning} ${idiom.equivalent ?? ''} ${idiom.literal}`,
      ),
    });
  }

  /* Falsos cognatos — a classe de erro mais cara socialmente. */
  for (const friend of FALSE_FRIENDS[language] ?? []) {
    entries.push({
      kind: 'falso cognato',
      title: friend.term,
      body: `"${friend.term}" parece "${friend.looksLike}", mas significa **${friend.actually}**.\n\nPara dizer "${friend.looksLike}", use: ${friend.insteadSay}.\n\n${friend.example}`,
      level: null,
      terms: tokenize(
        `${friend.term} ${friend.looksLike} ${friend.actually} ${friend.insteadSay}`,
      ),
    });
  }

  /* Pragmática — o que não é gramática e define como você é percebido. */
  for (const note of PRAGMATIC_NOTES[language] ?? []) {
    entries.push({
      kind: 'cultura',
      title: note.title,
      body: note.note,
      level: null,
      terms: tokenize(`${note.title} ${note.note}`),
    });
  }

  CACHE.set(language, entries);
  return entries;
}

/* ------------------------------------------------------------------ *
 * Busca
 * ------------------------------------------------------------------ */

/**
 * Trechos relevantes para uma pergunta.
 *
 * A pontuação privilegia, nesta ordem:
 *  1. **Casamento no título** — quem pergunta "o que significa X" quase sempre
 *     quer o verbete X, não um texto que menciona X de passagem.
 *  2. Quantidade de termos da pergunta encontrados na entrada.
 *  3. Proximidade do nível do aluno, quando ele é conhecido — explicar `C2` a
 *     quem está em A2 é tecnicamente correto e pedagogicamente inútil.
 */
export function searchContext(
  language: LanguageCode,
  question: string,
  options: { level?: CefrLevel; limit?: number } = {},
): ContextEntry[] {
  const queryTerms = tokenize(question);
  if (queryTerms.length === 0) return [];

  const index = buildContextIndex(language);
  const levelIndex = options.level ? CEFR_LEVELS.indexOf(options.level) : -1;

  const scored = index.map((entry) => {
    const entryTerms = new Set(entry.terms);
    let score = 0;

    for (const term of queryTerms) {
      if (entryTerms.has(term)) score += 1;
    }

    if (score === 0) return { entry, score: 0 };

    const title = normalize(entry.title);
    if (queryTerms.some((term) => title.includes(term))) score += 3;

    if (levelIndex >= 0 && entry.level) {
      // Penalidade suave por distância de nível: um item dois níveis acima
      // ainda pode ser a resposta certa, só não deve ganhar de um do nível.
      score -= Math.abs(CEFR_LEVELS.indexOf(entry.level) - levelIndex) * 0.3;
    }

    return { entry, score };
  });

  return scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, options.limit ?? 5)
    .map((item) => item.entry);
}

/** Quantos itens de contexto o tutor tem para um idioma. */
export function contextSize(language: LanguageCode): number {
  return buildContextIndex(language).length;
}

/** Soma de todos os idiomas — usado em documentação e testes. */
export function totalContextSize(languages: LanguageCode[]): number {
  return languages.reduce((sum, language) => sum + contextSize(language), 0);
}
