/**
 * Testes do catálogo de verbos.
 *
 * ## O defeito que originou este arquivo
 *
 * Um relato: "na apostila do italiano C2 não aparecem os verbos". A auditoria
 * mostrou que apareciam — dados, leitor e PDF conferidos um a um, todos
 * corretos. O que não existia era **volume**: oito verbos por nível, numa
 * apostila onde a seção seguinte trazia 25 expressões idiomáticas. A seção
 * existia e não tinha presença.
 *
 * O relato estava certo mesmo com o diagnóstico técnico negativo. É a classe de
 * erro que nenhum teste de integridade pega — tudo funciona, e o material
 * ensina menos do que deveria. Por isso o piso de 20 vive aqui, num teste, e
 * não num comentário: cobertura de conteúdo é a primeira coisa que se perde no
 * refactor seguinte.
 */

import type { CefrLevel, LanguageCode } from '@/domain/types';
import { levelVerbs } from '../verbs';

const LANGUAGES: LanguageCode[] = ['en', 'es', 'fr', 'it', 'de', 'ja', 'ko', 'zh'];
const LEVELS: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const NON_LATIN: LanguageCode[] = ['ja', 'ko', 'zh'];

describe('volume', () => {
  it('todo nível de todo idioma tem ao menos 20 verbos', () => {
    for (const language of LANGUAGES) {
      for (const level of LEVELS) {
        expect({ language, level, count: levelVerbs(language, level).length }).toEqual({
          language,
          level,
          count: expect.any(Number),
        });
        expect(levelVerbs(language, level).length).toBeGreaterThanOrEqual(20);
      }
    }
  });
});

describe('progressão', () => {
  it('nenhum verbo se repete entre níveis do mesmo idioma', () => {
    // O aluno precisa sentir que o conteúdo muda. Um verbo repetido em dois
    // níveis é uma promessa quebrada — e some numa lista de 120 entradas.
    for (const language of LANGUAGES) {
      const seen = new Map<string, CefrLevel>();
      const repeated: string[] = [];

      for (const level of LEVELS) {
        for (const verb of levelVerbs(language, level)) {
          const previous = seen.get(verb.infinitive);
          if (previous) repeated.push(`${verb.infinitive} (${previous} e ${level})`);
          else seen.set(verb.infinitive, level);
        }
      }

      expect({ language, repeated }).toEqual({ language, repeated: [] });
    }
  });
});

describe('integridade de cada verbete', () => {
  it('todo verbo tem sentido em português, formas e exemplo traduzido', () => {
    for (const language of LANGUAGES) {
      for (const level of LEVELS) {
        for (const verb of levelVerbs(language, level)) {
          // "ir" tem duas letras e é uma tradução legítima — o piso existe
          // para pegar campo vazio, não para exigir prolixidade.
          expect(verb.meaning.length).toBeGreaterThanOrEqual(2);
          expect(verb.forms.length).toBeGreaterThanOrEqual(2);
          // Frases em chinês são curtas de verdade: 「我懂了。」 tem quatro
          // caracteres e é uma frase completa.
          expect(verb.example.length).toBeGreaterThanOrEqual(4);
          expect(verb.exampleTranslation.length).toBeGreaterThan(4);
        }
      }
    }
  });

  it('toda forma tem rótulo de pessoa e conteúdo', () => {
    for (const language of LANGUAGES) {
      for (const level of LEVELS) {
        for (const verb of levelVerbs(language, level)) {
          for (const form of verb.forms) {
            expect(form.person.length).toBeGreaterThan(0);
            expect(form.form.length).toBeGreaterThan(0);
          }
        }
      }
    }
  });

  it('idiomas de escrita não latina trazem romanização em todo verbo', () => {
    // Sem romanização o aluno vê um bloco de kanji e não consegue nem repetir
    // o verbo em voz alta — a seção vira decoração.
    for (const language of NON_LATIN) {
      for (const level of LEVELS) {
        for (const verb of levelVerbs(language, level)) {
          expect({
            id: `${language}:${verb.infinitive}`,
            roman: Boolean(verb.romanization),
          }).toEqual({ id: `${language}:${verb.infinitive}`, roman: true });
        }
      }
    }
  });

  // Não existe aqui um teste de "o exemplo contém o verbo". A heurística foi
  // escrita, rodou nos 960 verbetes e reprovou 24 — dos quais 23 eram falsos
  // positivos: radical que muda no espanhol ("impedir" vira "impiden"), prefixo
  // que se separa no alemão ("vorschlagen" vira "schlug ... vor"), irregular no
  // italiano ("potere" vira "puoi"). Cobrir isso exigiria um motor de conjugação
  // por idioma; sem ele, manter o teste obrigaria a reescrever bons exemplos
  // para caber na heurística — degradar o material para agradar o teste.
  //
  // A rodada valeu assim mesmo: o vigésimo quarto caso era real. O verbete
  // japonês やってみます trazia o exemplo 「早く来てみます。」, que ensina outro
  // verbo. Corrigido no dado.
});
