/**
 * Formato compacto das expressões idiomáticas
 * ============================================
 *
 * O lote curado de `idioms.ts` usa treze linhas por verbete. Isso é ótimo para
 * oito expressões e insuportável para mil: o arquivo deixa de ser navegável e,
 * pior, ninguém consegue mais **ver a distribuição** — quantas expressões cada
 * nível tem, e onde falta.
 *
 * Aqui o verbete é uma linha e o nível é a chave do bloco. Duas consequências
 * práticas: dá para contar a olho quantas expressões um nível tem, e é
 * impossível um verbete ficar com o nível errado, porque o nível não é
 * digitado por verbete.
 *
 * Por isso o `biome.json` desliga o formatador **apenas** nos arquivos de dados
 * por idioma: o formatador quebraria cada tupla em dez linhas e transformaria
 * mil verbetes em dez mil linhas, desfazendo exatamente a propriedade que
 * justifica este formato. Este arquivo e o `index.ts` continuam formatados
 * normalmente — a exceção vale para os dados, não para o código.
 */

import type { CefrLevel, Idiom, LanguageCode } from '@/domain/types';

/**
 * `[expressão, romanização, literal, significado, equivalente, origem,
 *   exemplo, tradução do exemplo, registro, frequência]`
 *
 * Romanização, equivalente e origem aceitam string vazia — vira `null` na
 * expansão. Vazio é a resposta honesta quando não existe equivalente
 * brasileiro: inventar um faz o aluno usar uma tradução que ninguém reconhece.
 */
export type Entry = [
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  Idiom['register'],
  number,
];

export type ByLevel = Partial<Record<CefrLevel, Entry[]>>;

/** Expande os blocos de um idioma para os verbetes completos. */
export function expand(language: LanguageCode, byLevel: ByLevel): Idiom[] {
  const result: Idiom[] = [];

  for (const [level, entries] of Object.entries(byLevel) as [CefrLevel, Entry[]][]) {
    entries.forEach((entry, index) => {
      const [
        expression,
        romanization,
        literal,
        meaning,
        equivalent,
        origin,
        example,
        exampleTranslation,
        register,
        frequency,
      ] = entry;

      result.push({
        // O prefixo `x` separa este lote do curado, e o nível entra no id
        // porque a mesma raiz romanizada pode aparecer em níveis diferentes.
        id: `idiom:${language}:x${level}:${(romanization || expression)
          .replace(/[^a-z0-9]/gi, '_')
          .toLowerCase()
          .slice(0, 30)}:${index}`,
        language,
        expression,
        romanization: romanization || null,
        literal,
        meaning,
        equivalent: equivalent || null,
        origin: origin || null,
        example,
        exampleTranslation,
        register,
        cefr: level,
        frequency,
        // Mesma convenção de `idioms.ts`: a etiqueta é o registro. O nível já
        // está em `cefr`, e duplicá-lo aqui criaria duas fontes da verdade.
        tags: [register],
      });
    });
  }

  return result;
}
