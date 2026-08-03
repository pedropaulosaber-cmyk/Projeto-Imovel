/**
 * Expressões idiomáticas — lote por nível
 * ========================================
 *
 * Complementa o lote curado de `idioms.ts`. Um arquivo por idioma, porque o
 * conteúdo cresce por idioma: quem for revisar o alemão não deveria ter de
 * rolar por mil linhas de francês para chegar lá.
 *
 * ## Critério de seleção
 *
 * Frequência de uso real, não pitoresco. Uma expressão que um nativo diz toda
 * semana vale mais que dez curiosidades literárias — é o que separa material
 * aplicável de enciclopédia. Nenhuma expressão daqui repete o lote curado; o
 * teste de duplicidade existe justamente porque, com centenas de verbetes, a
 * repetição é invisível a olho nu (e foi assim que a primeira versão deste
 * lote entrou com dezenas de repetições em níveis diferentes).
 *
 * ## Progressão
 *
 *  - **A2** — expressões curtas e transparentes, de uso cotidiano.
 *  - **B1** — as que aparecem em conversa comum e não se deduzem das partes.
 *  - **B2** — registro coloquial denso, com carga cultural.
 *  - **C1** — expressões de contexto profissional e argumentativo.
 *  - **C2** — as que um estrangeiro fluente ainda não usa espontaneamente.
 *
 * **A1 não tem expressão idiomática, e isso é deliberado.** Quem tem cem
 * palavras não tem repertório para perceber que a soma delas significa outra
 * coisa; ensinar idiomatismo ali produz decoreba, não compreensão.
 */

import type { CefrLevel, Idiom, LanguageCode } from '@/domain/types';
import { type ByLevel, expand } from './entry';

import { DE } from './de';
import { EN } from './en';
import { ES } from './es';
import { FR } from './fr';
import { IT } from './it';

const EXTRA: Record<LanguageCode, ByLevel> = {
  en: EN,
  es: ES,
  fr: FR,
  it: IT,
  de: DE,
};

/** Verbetes adicionais de um idioma, já expandidos. */
export function extraIdioms(language: LanguageCode): Idiom[] {
  return expand(language, EXTRA[language] ?? {});
}

/** Quantas expressões adicionais existem num nível. */
export function extraCountByLevel(language: LanguageCode, level: CefrLevel): number {
  return EXTRA[language]?.[level]?.length ?? 0;
}
