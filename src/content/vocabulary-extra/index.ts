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

const LATIN: Partial<Record<LanguageCode, LatinByLevel>> = {
  en: EN,
  es: ES,
  fr: FR,
  it: IT,
  de: DE,
};
const ASIAN: Partial<Record<LanguageCode, AsianByLevel>> = { ja: JA, ko: KO, zh: ZH };

/** Entradas cruas latinas do lote de ampliação. Vazio para idiomas asiáticos. */
export function extraLatinVocabularyRaw(language: LanguageCode, level: CefrLevel): LatinRaw[] {
  if (usesNonLatinScript(language)) return [];
  return LATIN[language]?.[level] ?? [];
}

/** Entradas cruas asiáticas do lote de ampliação. Vazio para idiomas latinos. */
export function extraAsianVocabularyRaw(language: LanguageCode, level: CefrLevel): AsianRaw[] {
  if (!usesNonLatinScript(language)) return [];
  return ASIAN[language]?.[level] ?? [];
}
