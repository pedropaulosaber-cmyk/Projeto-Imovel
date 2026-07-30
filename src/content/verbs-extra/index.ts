/**
 * Verbos de ampliação — registro.
 *
 * Ver `entry.ts` para o motivo de o módulo existir. Em resumo: o catálogo
 * original tinha oito verbos por nível, e a seção ficou pequena demais para
 * ser percebida na apostila depois que as expressões idiomáticas cresceram
 * para 25 por nível.
 */

import type { CefrLevel, LanguageCode } from '@/domain/types';
import type { ByLevel, Raw } from './entry';

import { DE } from './de';
import { EN } from './en';
import { ES } from './es';
import { FR } from './fr';
import { IT } from './it';
import { JA } from './ja';
import { KO } from './ko';
import { ZH } from './zh';

const EXTRA: Record<LanguageCode, ByLevel> = {
  en: EN,
  es: ES,
  fr: FR,
  it: IT,
  de: DE,
  ja: JA,
  ko: KO,
  zh: ZH,
};

/**
 * Entradas cruas do lote de ampliação, no mesmo formato de `verbs.ts`.
 *
 * Devolve a lista crua, e não verbetes expandidos, para que `verbs.ts` faça a
 * expansão num único lugar — dois expansores acabariam divergindo no dia em
 * que o formato mudar.
 */
export function extraVerbsRaw(language: LanguageCode, level: CefrLevel): Raw[] {
  return EXTRA[language]?.[level] ?? [];
}
