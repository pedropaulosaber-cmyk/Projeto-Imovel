/**
 * Vocabulário de ampliação — registro.
 *
 * Ver `entry.ts` para o motivo do módulo e o formato.
 *
 * Cada lote vive num mapa próprio em vez de ser mesclado à mão no anterior: um
 * lote revisado continua revisado, e a ordem de concatenação em
 * `extraLatinVocabularyRaw` é o que decide qual verbete sobrevive numa colisão
 * de id — o mais recente, que é o mais revisado.
 */

import type { CefrLevel, LanguageCode } from '@/domain/types';
import type { LatinByLevel, LatinRaw } from './entry';

import { DE } from './de';
import { EN } from './en';
import { ES } from './es';
import { FR } from './fr';
import { IT } from './it';

import { DE_THEMATIC } from './thematic/de';
import { EN_THEMATIC } from './thematic/en';
import { ES_THEMATIC } from './thematic/es';
import { FR_THEMATIC } from './thematic/fr';
import { IT_THEMATIC } from './thematic/it';

import { DE_THEMATIC2 } from './thematic2/de';
import { EN_THEMATIC2 } from './thematic2/en';
import { ES_THEMATIC2 } from './thematic2/es';
import { FR_THEMATIC2 } from './thematic2/fr';
import { IT_THEMATIC2 } from './thematic2/it';

import { DE_THEMATIC3 } from './thematic3/de';
import { EN_THEMATIC3 } from './thematic3/en';
import { ES_THEMATIC3 } from './thematic3/es';
import { FR_THEMATIC3 } from './thematic3/fr';
import { IT_THEMATIC3 } from './thematic3/it';

const LATIN: Partial<Record<LanguageCode, LatinByLevel>> = {
  en: EN,
  es: ES,
  fr: FR,
  it: IT,
  de: DE,
};

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

/** Terceiro bloco — mesma lógica do anterior, campos semânticos novos. */
const LATIN_THEMATIC2: Partial<Record<LanguageCode, LatinByLevel>> = {
  en: EN_THEMATIC2,
  es: ES_THEMATIC2,
  fr: FR_THEMATIC2,
  it: IT_THEMATIC2,
  de: DE_THEMATIC2,
};

/** Quarto bloco — mesma lógica, mais campos semânticos. */
const LATIN_THEMATIC3: Partial<Record<LanguageCode, LatinByLevel>> = {
  en: EN_THEMATIC3,
  es: ES_THEMATIC3,
  fr: FR_THEMATIC3,
  it: IT_THEMATIC3,
  de: DE_THEMATIC3,
};

/** Entradas cruas dos lotes de ampliação, na ordem em que devem ser lidas. */
export function extraLatinVocabularyRaw(language: LanguageCode, level: CefrLevel): LatinRaw[] {
  return [
    ...(LATIN_THEMATIC[language]?.[level] ?? []),
    ...(LATIN_THEMATIC2[language]?.[level] ?? []),
    ...(LATIN_THEMATIC3[language]?.[level] ?? []),
    ...(LATIN[language]?.[level] ?? []),
  ];
}
