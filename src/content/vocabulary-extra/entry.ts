/**
 * Vocabulário — lote de ampliação
 * =================================
 *
 * ## Por que este módulo existe
 *
 * O catálogo original tinha ~12 palavras novas por nível de A2 a C2 (mais uma
 * lista de frequência maior só no A1). Suficiente para a primeira versão do
 * app, curto demais para o pedido de "milhares de palavras, divididas entre os
 * níveis, sem erro nem repetição". Este é o primeiro lote de um esforço em
 * várias etapas rumo a isso — ver a nota de progresso em `index.ts`.
 *
 * ## Formato
 *
 * Dois formatos, como no resto do catálogo: latino compacto e asiático com
 * romanização obrigatória. Uma linha por palavra — com centenas de entradas
 * por idioma, é a diferença entre um arquivo navegável e um arquivo que
 * ninguém revisa.
 *
 * `partOfSpeech` usa os valores já aceitos por `VocabularyItem.partOfSpeech`
 * em `vocabulary-levels.ts`: substantivo, verbo, adjetivo, advérbio, etc.
 */

import type { CefrLevel } from '@/domain/types';

/**
 * ## O tema, no fim da tupla
 *
 * O último campo é opcional de propósito. Os lotes antigos não têm tema e
 * continuam válidos; os novos trazem o campo semântico ("Cores", "Viagem",
 * "Retórica") que a apostila usa para agrupar a tabela de vocabulário.
 *
 * Agrupar por campo semântico não é enfeite: palavra aprendida em bloco
 * temático gruda mais do que palavra aprendida em lista alfabética — é o
 * princípio mais antigo e mais bem medido do ensino de léxico. Sem tema, a
 * seção cai no agrupamento por classe gramatical, que ainda é melhor que nada.
 */

/** `[termo, tradução, classe gramatical, exemplo, tradução do exemplo, tema?]` */
export type LatinRaw = [string, string, string, string, string, string?];

/**
 * `[termo, romanização, tradução, classe gramatical, exemplo, romanização do
 *   exemplo, tradução do exemplo, tema?]`
 */
export type AsianRaw = [string, string, string, string, string, string, string, string?];

export type LatinByLevel = Partial<Record<CefrLevel, LatinRaw[]>>;
export type AsianByLevel = Partial<Record<CefrLevel, AsianRaw[]>>;
