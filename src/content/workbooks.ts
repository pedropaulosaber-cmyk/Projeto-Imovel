/**
 * Geração das apostilas.
 *
 * ## O problema que a apostila resolve
 *
 * Exercício é ótimo para *aprender* e péssimo para *reconsultar*. Quando o
 * aluno esquece como se forma o passado, ele não quer refazer uma lição de seis
 * minutos — quer abrir uma página, achar a regra e voltar ao que estava
 * fazendo. Nenhum app grande do segmento oferece isso, e é o motivo pelo qual
 * quase todo aluno sério mantém um caderno paralelo.
 *
 * A apostila é esse caderno, gerado automaticamente e sempre em sincronia com a
 * trilha: **uma por nível CEFR, em cada idioma**.
 *
 * ## Por que gerada, e não escrita à mão
 *
 * São 8 idiomas × 6 níveis = 48 apostilas. Escritas à mão, divergiriam da
 * trilha na primeira mudança de conteúdo e ninguém perceberia. Geradas a partir
 * das **mesmas fontes** que alimentam as lições (vocabulário, frases, regras
 * gramaticais, expressões), elas não podem sair de sincronia — e adicionar um
 * idioma continua sendo adicionar duas listas.
 *
 * O conteúdo é estruturado em blocos tipados (`WorkbookBlock`) em vez de
 * markdown livre: o app renderiza cada bloco com o design system — tabela
 * legível no celular, exemplo com áudio tocável — e a exportação para texto
 * continua trivial.
 */

import { GRAMMAR_RULES } from '@/ai/knowledge';
import type {
  CefrLevel,
  LanguageCode,
  Workbook,
  WorkbookBlock,
  WorkbookSection,
} from '@/domain/types';
import { usesNonLatinScript } from '@/domain/types';
import { grammarPoints } from './grammar-syllabus';
import { buildIdioms } from './idioms';
import { levelVocabulary } from './level-content';
import { CURATED_PHRASES } from './phrases';
import { levelVerbs } from './verbs';
import { LANGUAGE_META } from './vocabulary';
import { estimatePages } from './workbook-pdf';

const LEVEL_TITLE: Record<CefrLevel, { title: string; subtitle: string }> = {
  A1: {
    title: 'Fundamentos',
    subtitle: 'Do zero ao primeiro diálogo real: sons, saudações e o essencial.',
  },
  A2: {
    title: 'Sobrevivência',
    subtitle: 'Rotina, passado, pedidos e as situações do dia a dia.',
  },
  B1: {
    title: 'Autonomia',
    subtitle: 'Opinar, narrar, argumentar e se virar sozinho em qualquer situação.',
  },
  B2: {
    title: 'Fluência funcional',
    subtitle: 'Nuance, registro, expressões idiomáticas e discurso conectado.',
  },
  C1: {
    title: 'Domínio',
    subtitle: 'Precisão, ironia, textos densos e a língua em contextos profissionais.',
  },
  C2: {
    title: 'Refinamento',
    subtitle: 'Sutileza, variação regional e produção indistinguível de nativo.',
  },
};

const workbookId = (language: LanguageCode, level: CefrLevel) =>
  `workbook:${language}:${level}`;

/* ------------------------------------------------------------------ *
 * Seções
 * ------------------------------------------------------------------ */

function introSection(language: LanguageCode, level: CefrLevel): WorkbookSection {
  const meta = LANGUAGE_META[language];
  const info = LEVEL_TITLE[level];

  const blocks: WorkbookBlock[] = [
    { kind: 'heading', text: `${meta.name} · Nível ${level}` },
    {
      kind: 'paragraph',
      text: `Esta apostila acompanha a trilha do nível ${level}. Ela não substitui os exercícios — serve para consultar a regra depois, sem refazer a lição.`,
    },
    {
      kind: 'callout',
      tone: 'tip',
      title: 'Como usar',
      text: 'Estude pela trilha e volte aqui quando esquecer alguma estrutura. Marque as páginas que mais consultar: elas indicam o que ainda não está automático.',
    },
    {
      kind: 'list',
      items: [
        `Foco do nível: ${info.subtitle}`,
        'Vocabulário organizado por frequência real de uso',
        'Regras explicadas em português, com o erro típico de brasileiro',
        'Frases prontas para usar já na próxima conversa',
      ],
    },
  ];

  if (usesNonLatinScript(language)) {
    blocks.push({
      kind: 'callout',
      tone: 'rule',
      title: 'Sobre a escrita',
      text: `O ${meta.name.toLowerCase()} não usa alfabeto latino. Todos os termos aparecem na escrita original com a romanização abaixo. Leia os dois: a romanização te faz falar hoje, a escrita original te faz ler amanhã.`,
    });
  }

  return {
    id: `${workbookId(language, level)}:intro`,
    title: 'Antes de começar',
    order: 0,
    kind: 'intro',
    blocks,
  };
}

function vocabularySection(language: LanguageCode, level: CefrLevel): WorkbookSection {
  // Vocabulário **do nível**, não uma fatia arbitrária da lista de frequência.
  // É o que garante que a apostila de C1 fale de C1 — e que nada se repita
  // entre apostilas, já que `levelVocabulary` deduplica dentro e entre níveis.
  const vocabulary = levelVocabulary(language, level);

  const blocks: WorkbookBlock[] = [
    { kind: 'heading', text: 'Vocabulário do nível' },
    {
      kind: 'paragraph',
      text:
        level === 'A1'
          ? 'As palavras estão em ordem de frequência real: as primeiras aparecem mais na língua falada. No início, aprender nessa ordem rende muito mais que aprender por tema.'
          : 'A partir daqui a frequência para de discriminar — as palavras deste nível têm frequências parecidas entre si, e o que muda é o domínio de uso. Por isso elas vêm agrupadas por situação, não por ranking.',
    },
    {
      kind: 'vocabTable',
      rows: vocabulary.map((item) => ({
        term: item.term,
        romanization: item.romanization ?? undefined,
        translation: item.translation,
        note: item.partOfSpeech ?? undefined,
      })),
    },
  ];

  const withExamples = vocabulary.filter((item) => item.exampleSentence).slice(0, 14);
  if (withExamples.length > 0) {
    blocks.push(
      { kind: 'heading', text: 'Em contexto' },
      {
        kind: 'examples',
        items: withExamples.map((item) => ({
          target: item.exampleSentence ?? '',
          romanization: item.exampleRomanization ?? undefined,
          native: item.exampleTranslation ?? '',
        })),
      },
    );
  }

  return {
    id: `${workbookId(language, level)}:vocab`,
    title: 'Vocabulário',
    order: 1,
    kind: 'vocabulary',
    blocks,
  };
}

function grammarSection(language: LanguageCode, level: CefrLevel): WorkbookSection {
  const rules = GRAMMAR_RULES[language] ?? [];

  const blocks: WorkbookBlock[] = [
    { kind: 'heading', text: 'Gramática essencial' },
    {
      kind: 'paragraph',
      text: 'Cada regra vem com o erro que brasileiros cometem nela. Ler o erro junto da regra fixa muito melhor que ler a regra sozinha.',
    },
  ];

  for (const rule of rules) {
    blocks.push(
      { kind: 'callout', tone: 'rule', title: rule.title, text: rule.explanation },
      {
        kind: 'examples',
        items: rule.examples.map((example) => ({
          target: `✓ ${example.correct}`,
          native: `✗ ${example.incorrect}`,
        })),
      },
    );
  }

  if (rules.length === 0) {
    blocks.push({
      kind: 'paragraph',
      text: 'As regras deste nível chegam com a próxima atualização de conteúdo.',
    });
  }

  return {
    id: `${workbookId(language, level)}:grammar`,
    title: 'Gramática',
    order: 2,
    kind: 'grammar',
    blocks,
  };
}

function phrasesSection(language: LanguageCode, level: CefrLevel): WorkbookSection {
  const phrases = CURATED_PHRASES[language] ?? [];

  const byTopic = {
    greetings: 'Cumprimentar e se apresentar',
    routine: 'Falar da sua rotina',
    out: 'Na rua, no restaurante, nas compras',
  } as const;

  const blocks: WorkbookBlock[] = [
    { kind: 'heading', text: 'Frases para usar hoje' },
    {
      kind: 'paragraph',
      text: 'Frases inteiras, prontas para usar. Decorar bloco fechado é mais rápido que montar a frase peça por peça — e é assim que nativos aprendem também.',
    },
  ];

  for (const [topic, label] of Object.entries(byTopic)) {
    const group = phrases.filter((phrase) => phrase.topic === topic);
    if (group.length === 0) continue;

    blocks.push(
      { kind: 'heading', text: label },
      {
        kind: 'examples',
        items: group.map((phrase) => ({ target: phrase.target, native: phrase.native })),
      },
    );
  }

  return {
    id: `${workbookId(language, level)}:phrases`,
    title: 'Frases prontas',
    order: 3,
    kind: 'phrases',
    blocks,
  };
}

function idiomsSection(language: LanguageCode, level: CefrLevel): WorkbookSection | null {
  // Expressão idiomática só faz sentido depois que a base existe. Antes de A2,
  // ela vira decoreba de frase solta que o aluno não sabe onde encaixar.
  const minimum: Record<CefrLevel, number> = { A1: 9, A2: 3, B1: 3, B2: 4, C1: 5, C2: 5 };
  const idioms = buildIdioms(language).filter((idiom) => idiom.frequency >= minimum[level]);

  if (level === 'A1' || idioms.length === 0) return null;

  const blocks: WorkbookBlock[] = [
    { kind: 'heading', text: 'Expressões idiomáticas' },
    {
      kind: 'paragraph',
      text: 'Aqui a soma das palavras não dá o significado. Leia a tradução literal primeiro — o estranhamento é o que fixa a expressão na memória.',
    },
  ];

  for (const idiom of idioms.slice(0, 25)) {
    blocks.push({
      kind: 'callout',
      tone: 'tip',
      title: idiom.romanization
        ? `${idiom.expression} (${idiom.romanization})`
        : idiom.expression,
      text: [
        `Literal: ${idiom.literal}`,
        `Significa: ${idiom.meaning}`,
        idiom.equivalent ? `Em português: ${idiom.equivalent}` : null,
        `Exemplo: ${idiom.example} — ${idiom.exampleTranslation}`,
      ]
        .filter(Boolean)
        .join('\n'),
    });
  }

  return {
    id: `${workbookId(language, level)}:idioms`,
    title: 'Expressões idiomáticas',
    order: 4,
    kind: 'idioms',
    blocks,
  };
}

/**
 * Seção de verbos.
 *
 * Verbo tem seção própria porque é a peça que carrega tempo, pessoa e modo —
 * um aluno com 500 substantivos e 20 verbos não fala; com 100 substantivos e
 * 80 verbos, conversa. A tabela de conjugação traz só as formas de uso real:
 * uma grade de 6 pessoas × 8 tempos é material de consulta, não de
 * aprendizado, e afoga quem está começando.
 */
function verbsSection(language: LanguageCode, level: CefrLevel): WorkbookSection | null {
  const verbs = levelVerbs(language, level);
  if (verbs.length === 0) return null;

  const blocks: WorkbookBlock[] = [
    { kind: 'heading', text: 'Os verbos deste nível' },
    {
      kind: 'paragraph',
      text: 'Para cada verbo: como se fala, o que significa em português, as formas que você vai usar hoje e uma frase pronta. Decore a frase, não a tabela — é a frase que a memória guarda.',
    },
    {
      kind: 'vocabTable',
      rows: verbs.map((verb) => ({
        term: verb.infinitive,
        romanization: verb.romanization ?? undefined,
        translation: verb.meaning,
      })),
    },
  ];

  for (const verb of verbs) {
    blocks.push({
      kind: 'conjugation',
      verb: verb.romanization ? `${verb.infinitive} · ${verb.romanization}` : verb.infinitive,
      forms: verb.forms,
    });

    blocks.push({
      kind: 'examples',
      items: [{ target: verb.example, native: verb.exampleTranslation }],
    });

    if (verb.note) {
      blocks.push({
        kind: 'callout',
        tone: 'warning',
        title: `Atenção com "${verb.infinitive}"`,
        text: verb.note,
      });
    }
  }

  return {
    id: `${workbookId(language, level)}:verbs`,
    title: 'Verbos',
    order: 2,
    kind: 'vocabulary',
    blocks,
  };
}

/**
 * Seção de armadilhas.
 *
 * Vem do programa de gramática por nível, onde cada ponto carrega o erro que o
 * lusófono **de fato** produz. Numa apostila, ver a forma errada ao lado da
 * certa vale mais que a regra sozinha: o aluno reconhece o próprio erro na
 * página e é esse reconhecimento que corrige.
 */
function trapsSection(language: LanguageCode, level: CefrLevel): WorkbookSection | null {
  const points = grammarPoints(language, level);
  if (points.length === 0) return null;

  const blocks: WorkbookBlock[] = [
    { kind: 'heading', text: 'Onde o português atrapalha' },
    {
      kind: 'paragraph',
      text: 'Nenhum destes erros é distração. Todos vêm da mesma origem: traduzir a estrutura do português direto para a outra língua. Reconhecer o mecanismo resolve dezenas de casos de uma vez.',
    },
  ];

  for (const point of points) {
    blocks.push(
      { kind: 'callout', tone: 'rule', title: point.title, text: point.rule },
      {
        kind: 'examples',
        items: [{ target: `✓ ${point.correct}`, native: `✗ ${point.trap}` }],
      },
      {
        kind: 'callout',
        tone: 'warning',
        title: 'Por que a intuição falha aqui',
        text: point.why,
      },
    );
  }

  return {
    id: `${workbookId(language, level)}:traps`,
    title: 'Armadilhas do português',
    order: 4,
    kind: 'grammar',
    blocks,
  };
}

/**
 * Plano de estudo do nível.
 *
 * Uma apostila sem plano é um dicionário: o aluno lê, acha bonito e não sabe o
 * que fazer amanhã de manhã. Esta seção transforma o conteúdo em rotina, com
 * quatro semanas concretas e um critério de "pronto para o próximo nível".
 */
function studySection(language: LanguageCode, level: CefrLevel): WorkbookSection {
  const meta = LANGUAGE_META[language];
  const verbs = levelVerbs(language, level).length;
  const words = levelVocabulary(language, level).length;

  const weeks: string[] = [
    `Semana 1 — vocabulário: leia a tabela inteira em voz alta uma vez por dia. Marque as ${Math.max(5, Math.round(words / 4))} palavras que não vieram de primeira.`,
    `Semana 2 — verbos: escreva uma frase própria com cada um dos ${verbs} verbos. Frase sua, não a do exemplo.`,
    'Semana 3 — armadilhas: releia a seção de erros e procure cada um deles no que você já escreveu.',
    'Semana 4 — produção: converse com o tutor usando só o conteúdo deste nível, sem consultar a apostila.',
  ];

  return {
    id: `${workbookId(language, level)}:study`,
    title: 'Plano de estudo',
    order: 7,
    kind: 'practice',
    blocks: [
      { kind: 'heading', text: 'Como estudar este nível em quatro semanas' },
      {
        kind: 'paragraph',
        text: `Um plano concreto vale mais que boa vontade. Este cabe em 15 minutos por dia e cobre todo o conteúdo do ${level} de ${meta.name.toLowerCase()}.`,
      },
      { kind: 'list', items: weeks },
      {
        kind: 'callout',
        tone: 'tip',
        title: 'Quando avançar de nível',
        text: 'Quando você conseguir escrever cinco frases próprias, sem consultar nada, usando o vocabulário e os verbos deste nível — e sem cair nas armadilhas listadas. Não espere sentir 100%: 80% é o ponto certo de avançar.',
      },
      {
        kind: 'callout',
        tone: 'warning',
        title: 'O erro mais caro',
        text: 'Reler é confortável e quase inútil. O que fixa é tentar lembrar antes de olhar. Cubra a coluna da direita da tabela e tente traduzir de cabeça — errar e conferir ensina mais que ler dez vezes.',
      },
    ],
  };
}

function summarySection(language: LanguageCode, level: CefrLevel): WorkbookSection {
  const meta = LANGUAGE_META[language];

  return {
    id: `${workbookId(language, level)}:summary`,
    title: 'Checklist do nível',
    order: 5,
    kind: 'summary',
    blocks: [
      { kind: 'heading', text: `O que você consegue fazer no ${level}` },
      {
        kind: 'paragraph',
        text: 'Marque mentalmente cada item. O que você não conseguir fazer sem pensar ainda não está pronto — volte à seção correspondente.',
      },
      { kind: 'list', items: canDoStatements(level) },
      {
        kind: 'callout',
        tone: 'tip',
        title: 'Próximo passo',
        text:
          level === 'C2'
            ? `Você chegou ao topo da escala em ${meta.name.toLowerCase()}. Daqui em diante, o que mantém a fluência é uso real: leitura, conversa e conteúdo nativo.`
            : 'Quando a maior parte do checklist estiver automática, avance para o próximo nível no seu perfil. Não espere sentir 100% — 80% é o ponto certo de avançar.',
      },
    ],
  };
}

function canDoStatements(level: CefrLevel): string[] {
  const statements: Record<CefrLevel, string[]> = {
    A1: [
      'Cumprimentar e me apresentar',
      'Dizer de onde sou e o que faço',
      'Pedir comida e bebida',
      'Perguntar preços e direções',
      'Pedir que repitam quando não entendo',
    ],
    A2: [
      'Descrever minha rotina e minha família',
      'Falar de algo que aconteceu no passado',
      'Fazer planos simples com alguém',
      'Resolver situações comuns de viagem',
      'Escrever mensagens curtas',
    ],
    B1: [
      'Dar minha opinião e justificá-la',
      'Narrar uma história com início, meio e fim',
      'Lidar com imprevistos numa viagem',
      'Entender a ideia principal de um noticiário',
      'Escrever um texto simples sobre temas conhecidos',
    ],
    B2: [
      'Argumentar e defender um ponto de vista',
      'Entender filmes e séries sem legenda na maior parte do tempo',
      'Usar expressões idiomáticas de forma natural',
      'Participar de uma reunião de trabalho',
      'Escrever textos claros e bem estruturados',
    ],
    C1: [
      'Me expressar com fluidez, sem procurar palavras',
      'Entender textos longos e densos, inclusive implícitos',
      'Adaptar meu registro ao contexto social',
      'Usar a língua com eficácia no trabalho e no estudo',
      'Perceber ironia e humor',
    ],
    C2: [
      'Entender praticamente tudo o que leio e ouço',
      'Resumir informação de várias fontes de forma coerente',
      'Me expressar com precisão e nuance mesmo em temas complexos',
      'Reconhecer variações regionais e de registro',
      'Produzir textos indistinguíveis dos de um nativo',
    ],
  };

  return statements[level];
}

/* ------------------------------------------------------------------ *
 * Montagem
 * ------------------------------------------------------------------ */

/** Constrói a apostila de um nível em um idioma. */
export function buildWorkbook(language: LanguageCode, level: CefrLevel): Workbook {
  const info = LEVEL_TITLE[level];
  const meta = LANGUAGE_META[language];

  const sections = [
    introSection(language, level),
    vocabularySection(language, level),
    verbsSection(language, level),
    grammarSection(language, level),
    trapsSection(language, level),
    phrasesSection(language, level),
    idiomsSection(language, level),
    studySection(language, level),
    summarySection(language, level),
  ]
    .filter((section): section is WorkbookSection => section !== null)
    // Reordena depois do filtro para que a numeração do sumário nunca pule.
    .map((section, index) => ({ ...section, order: index }));

  const workbook: Workbook = {
    id: workbookId(language, level),
    language,
    level,
    title: `${meta.name} ${level} · ${info.title}`,
    subtitle: info.subtitle,
    courseId: `course:${language}:${level}`,
    sections,
    // Preenchido logo abaixo: a estimativa depende dos blocos já montados.
    estimatedPages: 0,
    contentVersion: 2,
  };

  // Calculada a partir do conteúdo real e do CSS de impressão, não chutada.
  // Prometer 20 páginas e entregar 6 é o tipo de detalhe que corrói confiança.
  return { ...workbook, estimatedPages: estimatePages(workbook) };
}

/** Todas as apostilas de um idioma, um por nível CEFR. */
export function buildWorkbooksForLanguage(language: LanguageCode): Workbook[] {
  return (['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as CefrLevel[]).map((level) =>
    buildWorkbook(language, level),
  );
}

export function buildAllWorkbooks(languages: LanguageCode[]): Workbook[] {
  return languages.flatMap(buildWorkbooksForLanguage);
}

/* ------------------------------------------------------------------ *
 * Exportação para texto
 * ------------------------------------------------------------------ */

/**
 * Converte a apostila em texto puro, para compartilhar ou salvar como arquivo.
 *
 * Texto em vez de PDF por uma razão prática: gerar PDF no dispositivo exige uma
 * biblioteca pesada (~500 KB) e renderização própria de fontes CJK, o que
 * quebraria justamente nos três idiomas novos. Texto abre em qualquer lugar,
 * é pesquisável e o usuário imprime ou converte se quiser.
 */
export function workbookToText(workbook: Workbook): string {
  const lines: string[] = [
    workbook.title,
    '='.repeat(workbook.title.length),
    workbook.subtitle,
    '',
  ];

  for (const section of [...workbook.sections].sort((a, b) => a.order - b.order)) {
    lines.push('', `## ${section.title}`, '');

    for (const block of section.blocks) {
      switch (block.kind) {
        case 'heading':
          lines.push(`### ${block.text}`, '');
          break;
        case 'paragraph':
          lines.push(block.text, '');
          break;
        case 'callout':
          lines.push(`[${block.title}]`, block.text, '');
          break;
        case 'list':
          for (const item of block.items) lines.push(`  • ${item}`);
          lines.push('');
          break;
        case 'vocabTable':
          for (const row of block.rows) {
            const term = row.romanization ? `${row.term} (${row.romanization})` : row.term;
            lines.push(`  ${term} — ${row.translation}${row.note ? ` [${row.note}]` : ''}`);
          }
          lines.push('');
          break;
        case 'examples':
          for (const item of block.items) {
            lines.push(`  ${item.target}`);
            if (item.romanization) lines.push(`  ${item.romanization}`);
            lines.push(`  ${item.native}`, '');
          }
          break;
        case 'conjugation':
          lines.push(`${block.verb}:`);
          for (const form of block.forms) lines.push(`  ${form.person}: ${form.form}`);
          lines.push('');
          break;
      }
    }
  }

  lines.push('', '—', 'Lumo · Fluência, um dia de cada vez.');
  return lines.join('\n');
}
