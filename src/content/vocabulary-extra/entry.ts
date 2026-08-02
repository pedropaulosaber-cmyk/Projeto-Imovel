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

/** `[termo, tradução, classe gramatical, exemplo, tradução do exemplo]` */
export type LatinRaw = [string, string, string, string, string];

/**
 * `[termo, romanização, tradução, classe gramatical, exemplo, romanização do
 *   exemplo, tradução do exemplo]`
 */
export type AsianRaw = [string, string, string, string, string, string, string];

export type LatinByLevel = Partial<Record<CefrLevel, LatinRaw[]>>;
export type AsianByLevel = Partial<Record<CefrLevel, AsianRaw[]>>;
