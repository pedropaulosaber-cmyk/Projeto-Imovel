/**
 * Testes da apostila em PDF e do catálogo de verbos.
 *
 * O PDF é gerado a partir de HTML, e HTML gerado por concatenação de string tem
 * duas falhas clássicas: injeção (um apóstrofo em `l'approche` quebrando o
 * documento) e conteúdo faltando silenciosamente. Os dois são testáveis sem
 * navegador, e é o que se faz aqui.
 */

import { CEFR_LEVELS, SUPPORTED_LANGUAGES } from '@/domain/types';
import { levelVerbs, verbCount } from '../verbs';
import { estimatePages, workbookFileName, workbookToPrintableHtml } from '../workbook-pdf';
import { buildWorkbook } from '../workbooks';

describe('catálogo de verbos', () => {
  it('todo idioma tem verbos em todos os seis níveis', () => {
    for (const language of SUPPORTED_LANGUAGES) {
      for (const level of CEFR_LEVELS) {
        expect(`${language}/${level}`).toBe(
          levelVerbs(language, level).length > 0 ? `${language}/${level}` : 'sem verbos',
        );
      }
    }
  });

  it('catalogou o programa inteiro', () => {
    // 8 idiomas × 6 níveis × 8 verbos.
    expect(verbCount()).toBe(384);
  });

  it('nenhum verbo se repete dentro de um idioma', () => {
    for (const language of SUPPORTED_LANGUAGES) {
      const all = CEFR_LEVELS.flatMap((level) =>
        levelVerbs(language, level).map((verb) => verb.infinitive),
      );
      expect(all.length).toBe(new Set(all).size);
    }
  });

  it('todo verbo traz formas de uso, exemplo e tradução', () => {
    for (const language of SUPPORTED_LANGUAGES) {
      for (const level of CEFR_LEVELS) {
        for (const verb of levelVerbs(language, level)) {
          // Sem formas, é só uma palavra numa lista; sem exemplo, não se fixa.
          expect(verb.forms.length).toBeGreaterThan(1);
          expect(verb.example.length).toBeGreaterThan(3);
          expect(verb.exampleTranslation.length).toBeGreaterThan(3);
          // \ir\ é um significado legítimo de duas letras — o limite é 2,
          // não 3, senão o teste rejeitaria dado correto.
          expect(verb.meaning.length).toBeGreaterThanOrEqual(2);
        }
      }
    }
  });

  it('idiomas de escrita não latina trazem romanização em todo verbo', () => {
    for (const language of ['ja', 'ko', 'zh'] as const) {
      for (const level of CEFR_LEVELS) {
        for (const verb of levelVerbs(language, level)) {
          expect(verb.romanization).not.toBeNull();
        }
      }
    }
  });
});

describe('apostila em PDF', () => {
  it('gera documento completo para todas as 48 apostilas', () => {
    for (const language of SUPPORTED_LANGUAGES) {
      for (const level of CEFR_LEVELS) {
        const workbook = buildWorkbook(language, level);
        const document = workbookToPrintableHtml(workbook);

        expect(document.startsWith('<!doctype html>')).toBe(true);
        expect(document).toContain('<title>');
        // Capa, sumário e corpo.
        expect(document).toContain('class="cover"');
        expect(document).toContain('class="toc"');
        expect(document).toContain('class="section"');
      }
    }
  });

  it('escapa o conteúdo em vez de injetá-lo cru', () => {
    // `l'approche`, `<` em comparações e `&` em textos existem no conteúdo real.
    // Um `<` cru viraria tag e comeria o resto do documento.
    const workbook = buildWorkbook('fr', 'B2');
    const document = workbookToPrintableHtml(workbook);

    // Nenhuma tag inesperada: só as que o gerador emite.
    const tags = [...document.matchAll(/<([a-zA-Z!/][^\s>]*)/g)].map((match) => match[1] ?? '');
    const allowed = new Set([
      '!doctype',
      'html',
      '/html',
      'head',
      '/head',
      'meta',
      'title',
      '/title',
      'style',
      '/style',
      'body',
      '/body',
      'section',
      '/section',
      'div',
      '/div',
      'span',
      '/span',
      'h2',
      '/h2',
      'h3',
      '/h3',
      'p',
      '/p',
      'ul',
      '/ul',
      'li',
      '/li',
      'table',
      '/table',
      'thead',
      '/thead',
      'tbody',
      '/tbody',
      'tr',
      '/tr',
      'th',
      '/th',
      'td',
      '/td',
      'strong',
      '/strong',
    ]);

    const unexpected = [...new Set(tags)].filter((tag) => !allowed.has(tag.toLowerCase()));
    expect(unexpected).toEqual([]);
  });

  it('inclui o vocabulário e os verbos do nível no documento', () => {
    const workbook = buildWorkbook('en', 'B1');
    const document = workbookToPrintableHtml(workbook);

    // Um verbete e um verbo específicos do B1 de inglês.
    expect(document).toContain('deadline');
    expect(document).toContain('to manage');
  });

  it('estima um número de páginas honesto', () => {
    for (const language of SUPPORTED_LANGUAGES) {
      for (const level of CEFR_LEVELS) {
        const workbook = buildWorkbook(language, level);
        // A estimativa foi calibrada contra PDFs renderizados de verdade no
        // Chromium: inglês B1 = 25 páginas, japonês A1 = 25, alemão C2 = 22,
        // com erro máximo de uma página. Abaixo de 20 a apostila deixaria de
        // entregar o tamanho prometido no card.
        expect(`${language}/${level}: ${workbook.estimatedPages}`).toBe(
          workbook.estimatedPages >= 20
            ? `${language}/${level}: ${workbook.estimatedPages}`
            : `${language}/${level}: curta demais`,
        );
        expect(estimatePages(workbook)).toBe(workbook.estimatedPages);
      }
    }
  });

  it('dá nome de arquivo previsível e sem acento', () => {
    const workbook = buildWorkbook('ja', 'C1');
    const name = workbookFileName(workbook, 'ja');

    expect(name).toBe('lumo-japones-c1.pdf');
    expect(name).toMatch(/^[a-z0-9-]+\.pdf$/);
  });

  it('toda apostila tem seção de verbos e de armadilhas', () => {
    for (const language of SUPPORTED_LANGUAGES) {
      for (const level of CEFR_LEVELS) {
        const titles = buildWorkbook(language, level).sections.map((section) => section.title);
        expect(titles).toContain('Verbos');
        expect(titles).toContain('Gramática e armadilhas');
        expect(titles).toContain('Plano de estudo');
      }
    }
  });

  it('nenhuma apostila é igual a outra', () => {
    // O pedido é explícito: cada PDF precisa ser diferente dos outros. Um
    // gerador que compartilha seções entre níveis produziria 48 arquivos
    // quase idênticos — e o aluno perceberia na segunda apostila.
    const documents = new Map<string, string>();

    for (const language of SUPPORTED_LANGUAGES) {
      for (const level of CEFR_LEVELS) {
        const document = workbookToPrintableHtml(buildWorkbook(language, level));
        const previous = [...documents.entries()].find(([, body]) => body === document);

        if (previous) {
          throw new Error(`${language}/${level} é idêntica a ${previous[0]}`);
        }
        documents.set(`${language}/${level}`, document);
      }
    }

    expect(documents.size).toBe(48);
  });

  it('apostilas do mesmo idioma não repetem o corpo das seções', () => {
    // Mais exigente que o teste acima: aqui não basta a capa diferir. Compara
    // o conteúdo de cada seção entre níveis do mesmo idioma, que é onde a
    // repetição realmente incomodaria.
    for (const language of SUPPORTED_LANGUAGES) {
      const seen = new Map<string, string>();

      for (const level of CEFR_LEVELS) {
        for (const section of buildWorkbook(language, level).sections) {
          const body = JSON.stringify(section.blocks);
          const previous = seen.get(body);

          if (previous) {
            throw new Error(
              `${language}: seção "${section.title}" de ${level} é idêntica à de ${previous}`,
            );
          }
          seen.set(body, level);
        }
      }
    }
  });

  it('traz as seções novas de pronúncia, cultura e simulado', () => {
    for (const language of SUPPORTED_LANGUAGES) {
      for (const level of CEFR_LEVELS) {
        const titles = buildWorkbook(language, level).sections.map((section) => section.title);

        expect(titles).toContain('Pronúncia');
        expect(titles).toContain('Palavras que enganam');
        expect(titles).toContain('Como soar natural');
        expect(titles).toContain('Simulado');
      }
    }
  });

  it('o simulado traz gabarito e não entrega a resposta na questão', () => {
    const workbook = buildWorkbook('en', 'B1');
    const exam = workbook.sections.find((section) => section.title === 'Simulado');

    expect(exam).toBeDefined();

    const headings = exam?.blocks.filter((block) => block.kind === 'heading') ?? [];
    expect(
      headings.some((block) => block.kind === 'heading' && block.text === 'Gabarito'),
    ).toBe(true);

    // O gabarito é o último bloco de lista, depois de todas as questões.
    const lastQuestion = (exam?.blocks ?? []).findLastIndex(
      (block) => block.kind === 'callout' && block.title.startsWith('Questão'),
    );
    const answerKey = (exam?.blocks ?? []).findIndex((block) => block.kind === 'list');

    expect(answerKey).toBeGreaterThan(lastQuestion);
  });

  it('a numeração das seções não pula depois do filtro', () => {
    // Seções nulas (idiomas em A1) são removidas; se a ordem não fosse
    // recalculada, o sumário mostraria "03, 05, 06".
    for (const language of SUPPORTED_LANGUAGES) {
      for (const level of CEFR_LEVELS) {
        const orders = buildWorkbook(language, level).sections.map((section) => section.order);
        expect(orders).toEqual(orders.map((_, index) => index));
      }
    }
  });
});
