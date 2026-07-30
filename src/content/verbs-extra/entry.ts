/**
 * Verbos — lote de ampliação
 * ===========================
 *
 * ## Por que este módulo existe
 *
 * O catálogo original trazia **oito verbos por nível**. Lido isoladamente,
 * parecia suficiente; lido dentro da apostila, não era — e o defeito só ficou
 * visível quando a seção de expressões idiomáticas cresceu para 25 verbetes por
 * nível. Aí a apostila passou a ter uma seção de expressões cinco vezes maior
 * que a de verbos, e a de verbos passou a parecer que não existia.
 *
 * Quem usa o app relatou exatamente isso: "na apostila do italiano C2 não
 * aparecem os verbos". Os verbos apareciam — dados, leitor e PDF conferidos,
 * todos corretos. O que não aparecia era **volume suficiente para a seção ter
 * presença**. O relato estava certo mesmo com o diagnóstico técnico negativo,
 * e é o tipo de erro que nenhum teste de integridade pega: tudo funciona, e o
 * material ensina menos do que deveria.
 *
 * ## O alvo
 *
 * Vinte verbos por nível, em cada idioma. Não é número redondo por estética:
 * é o que equilibra a apostila contra as 25 expressões e o que sustenta a
 * promessa de "diversos verbos por nível, que vão mudando ao passar do tempo".
 *
 * Formato idêntico ao de `verbs.ts`, para que os dois lotes se somem sem
 * conversão. Uma linha por verbo, pelo mesmo motivo das expressões: com
 * centenas de entradas, a diferença entre um arquivo navegável e um arquivo
 * que ninguém abre é o formato.
 */

import type { CefrLevel } from '@/domain/types';

/**
 * `[infinitivo, romanização, sentido, formas, exemplo, tradução, nota]`
 *
 * `formas` usa o mesmo formato de `verbs.ts`: `"eu:parlo|ele:parla"`.
 * Romanização e nota aceitam string vazia — viram `null` na expansão.
 */
export type Raw = [string, string, string, string, string, string, string];

export type ByLevel = Partial<Record<CefrLevel, Raw[]>>;
