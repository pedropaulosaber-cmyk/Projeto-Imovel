/**
 * Vocabulário de ampliação — registro.
 *
 * Ver `entry.ts` para o motivo do módulo e o formato. Idiomas latinos e
 * asiáticos ficam em mapas separados porque os formatos das tuplas divergem
 * (o asiático carrega romanização); `extraVocabularyRaw` esconde essa
 * diferença do resto do app, devolvendo sempre o formato que `level-content.ts`
 * já sabe expandir.
 */

import type { CefrLevel, LanguageCode } from '@/domain/types';
import { usesNonLatinScript } from '@/domain/types';
import type { AsianByLevel, AsianRaw, LatinByLevel, LatinRaw } from './entry';

import { DE } from './de';
import { EN } from './en';
import { ES } from './es';
import { FR } from './fr';
import { IT } from './it';
import { JA } from './ja';
import { KO } from './ko';
import { ZH } from './zh';

import { DE_THEMATIC } from './thematic/de';
import { EN_THEMATIC } from './thematic/en';
import { ES_THEMATIC } from './thematic/es';
import { FR_THEMATIC } from './thematic/fr';
import { IT_THEMATIC } from './thematic/it';
import { JA_THEMATIC } from './thematic/ja';
import { KO_THEMATIC } from './thematic/ko';
import { ZH_THEMATIC } from './thematic/zh';

const LATIN: Partial<Record<LanguageCode, LatinByLevel>> = {
  en: EN,
  es: ES,
  fr: FR,
  it: IT,
  de: DE,
};
const ASIAN: Partial<Record<LanguageCode, AsianByLevel>> = { ja: JA, ko: KO, zh: ZH };

/**
 * Lote temático — o segundo bloco, agora organizado por campo semântico.
 *
 * Fica num mapa separado do primeiro em vez de ser mesclado à mão nos arquivos
 * originais: cada bloco continua revisável de forma independente, e a ordem de
 * concatenação (temático primeiro) é o que decide qual verbete sobrevive numa
 * colisão de id.
 */
const LATIN_THEMATIC: Partial<Record<LanguageCode, LatinByLevel>> = {
  en: EN_THEMATIC,
  es: ES_THEMATIC,
  fr: FR_THEMATIC,
  it: IT_THEMATIC,
  de: DE_THEMATIC,
};
const ASIAN_THEMATIC: Partial<Record<LanguageCode, AsianByLevel>> = {
  ja: JA_THEMATIC,
  ko: KO_THEMATIC,
  zh: ZH_THEMATIC,
};

/** Entradas cruas latinas dos lotes de ampliação. Vazio para idiomas asiáticos. */
export function extraLatinVocabularyRaw(language: LanguageCode, level: CefrLevel): LatinRaw[] {
  if (usesNonLatinScript(language)) return [];
  return [...(LATIN_THEMATIC[language]?.[level] ?? []), ...(LATIN[language]?.[level] ?? [])];
}

/** Entradas cruas asiáticas dos lotes de ampliação. Vazio para idiomas latinos. */
export function extraAsianVocabularyRaw(language: LanguageCode, level: CefrLevel): AsianRaw[] {
  if (!usesNonLatinScript(language)) return [];
  return [...(ASIAN_THEMATIC[language]?.[level] ?? []), ...(ASIAN[language]?.[level] ?? [])];
}
