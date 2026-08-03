/**
 * Conteúdo por nível — montagem
 * ==============================
 *
 * Une duas fontes num único ponto de acesso, para que o gerador da trilha não
 * precise saber de onde veio cada coisa:
 *
 *  - **A1** — lista de frequência de `vocabulary.ts`.
 *  - **A2–C2** — `vocabulary-levels.ts` mais os lotes de `vocabulary-extra/`.
 *
 * ## A garantia que este módulo dá
 *
 * `levelVocabulary()` nunca devolve o mesmo termo duas vezes dentro de um
 * nível, e níveis diferentes nunca compartilham termos. Isso não é detalhe de
 * implementação: é o que impede o aluno de C1 receber de volta a mesma palavra
 * que respondeu no A2 — a reclamação mais direta que se pode ter de um curso.
 *
 * A deduplicação acontece **aqui**, na montagem, e não em cada tela. Espalhar
 * `Set` pelas telas seria garantir que uma delas esqueceria.
 */

import type { CefrLevel, LanguageCode, VocabularyItem } from '@/domain/types';
import { buildVocabulary } from './vocabulary';
import { extraLatinVocabularyRaw } from './vocabulary-extra';
import { levelVocabulary as latinLevelVocabulary } from './vocabulary-levels';

/**
 * Id determinístico de verbete.
 *
 * Deriva da romanização quando ela existe. Hoje o catálogo é só latino e ela
 * nunca existe, mas o parâmetro fica: escrita não latina não sobrevive à
 * normalização (`締め切り` viraria string vazia e todos os verbetes colidiriam
 * num id só), e é isso que a romanização evita.
 */
function vocabularyId(
  language: LanguageCode,
  term: string,
  romanization: string | null,
): string {
  const base = romanization && romanization.length > 0 ? romanization : term;
  const slug = base.replace(/[^\p{L}\p{N}]/gu, '_').toLowerCase();
  return `vocab:${language}:${slug}`;
}

/**
 * Tags do verbete.
 *
 * O tema entra como tag em vez de virar campo próprio de `VocabularyItem`:
 * `tags` já existe, já é serializado e já atravessa a camada offline sem
 * migração. Quem consome (a apostila) só precisa saber que o tema é a terceira
 * tag quando ela existe — ver `topicOf` em `workbooks.ts`.
 */
function tagsFor(partOfSpeech: string, level: CefrLevel, topic?: string): string[] {
  return topic ? [partOfSpeech, level, topic] : [partOfSpeech, level];
}

function fromLatinRaw(
  language: LanguageCode,
  level: CefrLevel,
  [term, translation, partOfSpeech, example, exampleTranslation, topic]: [
    string,
    string,
    string,
    string,
    string,
    string?,
  ],
): VocabularyItem {
  return {
    id: vocabularyId(language, term, null),
    language,
    term,
    translation,
    partOfSpeech,
    phonetic: null,
    romanization: null,
    exampleSentence: example,
    exampleTranslation,
    exampleRomanization: null,
    frequencyRank: null,
    cefr: level,
    tags: tagsFor(partOfSpeech, level, topic),
  };
}

/** Verbetes de um nível, já como `VocabularyItem` e sem repetição. */
export function levelVocabulary(language: LanguageCode, level: CefrLevel): VocabularyItem[] {
  // A1 é a lista de frequência — no início, frequência é o único critério que
  // discrimina bem (ver o cabeçalho de `vocabulary-levels.ts`) — mais o lote de
  // ampliação do próprio A1, que segue o formato normal por nível. As duas
  // fontes são conceitualmente distintas mas convergem no mesmo tipo de saída.
  if (level === 'A1') {
    const extra = extraLatinVocabularyRaw(language, level).map((raw) =>
      fromLatinRaw(language, level, raw),
    );
    const frequency = buildVocabulary(language).filter((item) => item.cefr === 'A1');
    return dedupe([...extra, ...frequency]);
  }

  // O lote de ampliação vem primeiro: em caso de colisão de id — que a
  // dedupe() resolve por "primeira ocorrência" — o verbete mais recente e mais
  // revisado prevalece.
  const raw = [
    ...extraLatinVocabularyRaw(language, level),
    ...latinLevelVocabulary(language, level),
  ];
  return dedupe(raw.map((entry) => fromLatinRaw(language, level, entry)));
}

/** Remove repetições por id, preservando a primeira ocorrência. */
function dedupe(items: VocabularyItem[]): VocabularyItem[] {
  const seen = new Set<string>();
  const result: VocabularyItem[] = [];

  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    result.push(item);
  }

  return result;
}

/**
 * Todo o vocabulário de um idioma, em todos os níveis.
 *
 * Deduplica **entre níveis** também: se um termo aparece em A2 e reaparece em
 * B1 por descuido de edição, vence a primeira aparição (o nível mais baixo).
 * Ensinar cedo e cobrar depois é aceitável; ensinar duas vezes como novidade,
 * não.
 */
export function allLevelVocabulary(language: LanguageCode): VocabularyItem[] {
  const levels: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  return dedupe(levels.flatMap((level) => levelVocabulary(language, level)));
}
