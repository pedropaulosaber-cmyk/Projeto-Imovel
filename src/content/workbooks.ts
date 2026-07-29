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

import { FALSE_FRIENDS, PRAGMATIC_NOTES } from '@/ai/false-friends';
import type {
  CefrLevel,
  LanguageCode,
  Workbook,
  WorkbookBlock,
  WorkbookSection,
} from '@/domain/types';
import { usesNonLatinScript } from '@/domain/types';
import { buildCourseContent } from './courses';
import { grammarPoints } from './grammar-syllabus';
import { buildIdioms } from './idioms';
import { levelVocabulary } from './level-content';
import { CURATED_PHRASES } from './phrases';
import { pronunciationFocus, pronunciationNotes } from './pronunciation';
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

  // Todos os exemplos, não uma amostra. O corte em 14 existia quando a
  // apostila era curta; agora ele só tirava material útil de graça.
  const withExamples = vocabulary.filter((item) => item.exampleSentence);
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

/**
 * Frases prontas do nível.
 *
 * A fonte muda conforme o nível, e isso corrigiu um defeito real: as frases
 * curadas em `phrases.ts` são de sobrevivência (cumprimentar, pedir comida) e
 * existem **por idioma**, não por nível — a seção saía idêntica nas seis
 * apostilas. Um teste comparando o corpo das seções entre níveis pegou.
 *
 *  - **A1 e A2** usam as frases curadas, divididas entre os dois: é
 *    exatamente o material de sobrevivência que esses níveis precisam.
 *  - **B1 em diante** usam as frases de exemplo do vocabulário do próprio
 *    nível, que são mais densas por construção e nunca se repetem entre níveis.
 */
function phrasesSection(language: LanguageCode, level: CefrLevel): WorkbookSection | null {
  const blocks: WorkbookBlock[] = [{ kind: 'heading', text: 'Frases para usar hoje' }];

  if (level === 'A1' || level === 'A2') {
    const phrases = CURATED_PHRASES[language] ?? [];
    if (phrases.length === 0) return null;

    const byTopic = {
      greetings: 'Cumprimentar e se apresentar',
      routine: 'Falar da sua rotina',
      out: 'Na rua, no restaurante, nas compras',
    } as const;

    blocks.push({
      kind: 'paragraph',
      text: 'Frases inteiras, prontas para usar. Decorar bloco fechado é mais rápido que montar a frase peça por peça — e é assim que nativos aprendem também.',
    });

    for (const [topic, label] of Object.entries(byTopic)) {
      const group = phrases.filter((phrase) => phrase.topic === topic);
      if (group.length === 0) continue;

      // Metade para A1, metade para A2: sem isso as duas apostilas trariam a
      // mesma lista, que é o defeito que esta função existe para evitar.
      const half = Math.ceil(group.length / 2);
      const slice = level === 'A1' ? group.slice(0, half) : group.slice(half);
      if (slice.length === 0) continue;

      blocks.push(
        { kind: 'heading', text: label },
        {
          kind: 'examples',
          items: slice.map((phrase) => ({ target: phrase.target, native: phrase.native })),
        },
      );
    }
  } else {
    const vocabulary = levelVocabulary(language, level).filter((item) => item.exampleSentence);
    if (vocabulary.length === 0) return null;

    blocks.push({
      kind: 'paragraph',
      text: `Estas frases usam o vocabulário do próprio ${level}. Leia em voz alta e substitua uma palavra de cada vez por outra da tabela — é o exercício mais barato que existe para transformar frase decorada em estrutura produtiva.`,
    });

    const chunk = Math.ceil(vocabulary.length / 3);
    const groups: [string, typeof vocabulary][] = [
      ['Primeiro bloco', vocabulary.slice(0, chunk)],
      ['Segundo bloco', vocabulary.slice(chunk, chunk * 2)],
      ['Terceiro bloco', vocabulary.slice(chunk * 2)],
    ];

    for (const [label, group] of groups) {
      if (group.length === 0) continue;
      blocks.push(
        { kind: 'heading', text: label },
        {
          kind: 'examples',
          items: group.map((item) => ({
            target: item.exampleSentence ?? '',
            romanization: item.exampleRomanization ?? undefined,
            native: item.exampleTranslation ?? '',
          })),
        },
      );
    }
  }

  return {
    id: `${workbookId(language, level)}:phrases`,
    title: 'Frases prontas',
    order: 3,
    kind: 'phrases',
    blocks,
  };
}

/**
 * Expressões idiomáticas do nível.
 *
 * Só a partir de A2: antes disso a expressão vira decoreba de frase solta que
 * o aluno não sabe onde encaixar. A seleção é por nível CEFR da própria
 * expressão, então cada apostila traz um conjunto distinto.
 */
function idiomsSection(language: LanguageCode, level: CefrLevel): WorkbookSection | null {
  if (level === 'A1') return null;

  const idioms = buildIdioms(language).filter((idiom) => idiom.cefr === level);
  if (idioms.length === 0) return null;

  const blocks: WorkbookBlock[] = [
    { kind: 'heading', text: 'Expressões idiomáticas' },
    {
      kind: 'paragraph',
      text: 'Aqui a soma das palavras não dá o significado. Leia a tradução literal primeiro — o estranhamento é justamente o que fixa a expressão na memória.',
    },
  ];

  for (const idiom of idioms) {
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
        idiom.origin ? `Origem: ${idiom.origin}` : null,
      ]
        .filter(Boolean)
        .join('\n'),
    });
    blocks.push({
      kind: 'examples',
      items: [{ target: idiom.example, native: idiom.exampleTranslation }],
    });
  }

  return {
    id: `${workbookId(language, level)}:idioms`,
    title: 'Expressões idiomáticas',
    order: 7,
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
 * Gramática do nível.
 *
 * Substituiu duas seções que existiam antes — uma com regras gerais do idioma
 * e outra com as armadilhas. A separação era artificial e tinha um defeito
 * concreto: a seção de regras vinha de uma lista **por idioma**, não por
 * nível, e saía idêntica nas seis apostilas. Um teste automatizado pegou isso
 * comparando o corpo das seções entre níveis do mesmo idioma.
 *
 * Agora cada regra vem com três partes, na ordem em que ensinam:
 *
 *  1. **A regra**, em uma frase, sem jargão.
 *  2. **O contraste** — a forma certa ao lado da que o lusófono produz. Ver o
 *     próprio erro na página é o que dispara o reconhecimento.
 *  3. **O porquê** — onde a intuição do português falha. Sem isso o aluno
 *     decora o item e reproduz o erro na frase seguinte.
 */
function grammarSection(language: LanguageCode, level: CefrLevel): WorkbookSection | null {
  const points = grammarPoints(language, level);
  if (points.length === 0) return null;

  const blocks: WorkbookBlock[] = [
    { kind: 'heading', text: `Gramática do nível ${level}` },
    {
      kind: 'paragraph',
      text: 'Nenhum destes erros é distração. Todos vêm da mesma origem: traduzir a estrutura do português direto para a outra língua. Entender o mecanismo resolve dezenas de casos de uma vez, e é por isso que cada regra vem acompanhada do motivo.',
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
        title: 'Por que a intuição do português falha aqui',
        text: point.why,
      },
    );
  }

  blocks.push({
    kind: 'callout',
    tone: 'tip',
    title: 'Como usar esta seção',
    text: 'Releia só as caixas laranja depois de escrever qualquer texto. Elas listam exatamente os erros que você tende a cometer — conferir contra a lista custa dois minutos e corta a maior parte deles.',
  });

  return {
    id: `${workbookId(language, level)}:grammar`,
    title: 'Gramática e armadilhas',
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

/**
 * Guia de pronúncia.
 *
 * Sempre parte do som que o português **não tem** — é ali que a comunicação
 * falha. E a correção é sempre física ("a língua encosta aqui"), nunca
 * descritiva: ninguém corrigiu a própria pronúncia lendo "vogal anterior
 * fechada não arredondada".
 */
function pronunciationSection(
  language: LanguageCode,
  level: CefrLevel,
): WorkbookSection | null {
  const notes = pronunciationNotes(language, level);
  if (notes.length === 0) return null;

  const blocks: WorkbookBlock[] = [
    { kind: 'heading', text: 'Os sons que travam brasileiros' },
    {
      kind: 'paragraph',
      text: 'Nenhum destes é capricho de sotaque: são os pontos em que o interlocutor deixa de entender ou entende outra coisa.',
    },
    {
      kind: 'callout',
      tone: 'rule',
      title: `Foco no ${level}`,
      text: pronunciationFocus(level),
    },
  ];

  for (const note of notes) {
    blocks.push(
      { kind: 'callout', tone: 'rule', title: note.sound, text: note.problem },
      { kind: 'callout', tone: 'tip', title: 'Como corrigir', text: note.fix },
    );
  }

  return {
    id: `${workbookId(language, level)}:pronunciation`,
    title: 'Pronúncia',
    order: 3,
    kind: 'practice',
    blocks,
  };
}

/**
 * Falsos cognatos.
 *
 * A classe de erro com maior custo social por unidade de frequência: quem erra
 * não sabe que errou, porque a palavra parece conhecida e a frase sai fluente.
 * A fatia muda por nível para que cada apostila traga verbetes diferentes.
 */
function falseFriendsSection(language: LanguageCode, level: CefrLevel): WorkbookSection | null {
  const all = FALSE_FRIENDS[language] ?? [];
  if (all.length === 0) return null;

  // Janela deslizante, como na pronúncia. A tentativa anterior fatiava por
  // posição (`index * 2`) e estourava a lista nos níveis altos: C1 e C2 caíam
  // no mesmo `slice(-3)` e saíam idênticos. Dar a volta na lista resolve e
  // ainda garante que o aluno revisite os falsos cognatos ao longo do curso —
  // desejável, porque é a classe de erro que mais reincide.
  const index = (['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as CefrLevel[]).indexOf(level);
  const size = Math.min(3, all.length);
  //
  // O passo é **um** por nível, não dois. Com passo dois a janela dava mais de
  // uma volta em listas de 8 itens (C1 caía no mesmo ponto de A1). Passo um
  // garante seis janelas distintas desde que a lista tenha ao menos 6 itens —
  // condição que `FALSE_FRIENDS` cumpre em todos os idiomas, e que o teste de
  // seções repetidas protege caso alguém encurte uma lista no futuro.
  const friends = Array.from(
    { length: size },
    (_, offset) => all[(index + offset) % all.length],
  ).filter((friend): friend is NonNullable<typeof friend> => friend !== undefined);

  const blocks: WorkbookBlock[] = [
    { kind: 'heading', text: 'Palavras que enganam' },
    {
      kind: 'paragraph',
      text: 'Estas parecem português e significam outra coisa. São perigosas justamente porque não geram dúvida: a frase sai fluente e errada, e ninguém corrige na hora.',
    },
  ];

  for (const friend of friends) {
    blocks.push({
      kind: 'callout',
      tone: 'warning',
      title: friend.term,
      text: `Parece "${friend.looksLike}", mas significa ${friend.actually}.\nPara dizer "${friend.looksLike}", use: ${friend.insteadSay}.`,
    });
    blocks.push({ kind: 'examples', items: [{ target: friend.example, native: '' }] });
  }

  return {
    id: `${workbookId(language, level)}:friends`,
    title: 'Palavras que enganam',
    order: 6,
    kind: 'vocabulary',
    blocks,
  };
}

/**
 * Cultura e pragmática.
 *
 * O que não é gramática nem vocabulário e define como a pessoa é percebida. Um
 * brasileiro que traduz literalmente sua cordialidade para o alemão soa
 * artificial; quem traduz sua objetividade para o japonês soa agressivo.
 *
 * ## Por que o mesmo tema reaparece em níveis diferentes
 *
 * As regras culturais são poucas e valem sempre — mas **pesam diferente** a
 * cada nível. Em A1 o aluno só precisa saber que a regra existe; em C1 ele
 * precisa produzi-la sob pressão. Por isso cada apostila traz um recorte
 * distinto das notas e um enquadramento próprio do que fazer com elas naquele
 * momento do curso.
 *
 * A primeira versão apenas rotacionava a lista, e com três notas para seis
 * níveis A1 e B2 saíam idênticas. Um teste que compara o corpo das seções
 * entre níveis do mesmo idioma pegou isso.
 */
const CULTURE_FRAMING: Record<CefrLevel, { title: string; text: string }> = {
  A1: {
    title: 'No seu nível, basta saber que existe',
    text: 'Você ainda não precisa produzir isso. Precisa reconhecer quando acontecer, para não interpretar como grosseria ou desinteresse o que é apenas outra convenção.',
  },
  A2: {
    title: 'Comece a imitar as fórmulas',
    text: 'Copie as expressões fixas de cortesia sem tentar traduzir do português. Nesta fase, decorar a fórmula inteira funciona melhor que entender a lógica dela.',
  },
  B1: {
    title: 'Agora o registro começa a te denunciar',
    text: 'Sua gramática já permite escolher entre duas formas de dizer a mesma coisa — e é aí que a escolha errada aparece. Preste atenção em quem você está falando antes de escolher.',
  },
  B2: {
    title: 'Reconheça o implícito',
    text: 'Boa parte do que importa não é dito. Um "talvez" pode ser um "não", e responder ao literal em vez do implícito gera mal-entendidos que a gramática não explica.',
  },
  C1: {
    title: 'Produza sob pressão',
    text: 'Em contexto profissional, o ajuste de registro precisa sair automático. Se você tem que pensar antes de escolher a forma, a pausa já comunica insegurança.',
  },
  C2: {
    title: 'Use a quebra de propósito',
    text: 'Quem domina a convenção pode rompê-la para gerar efeito — ironia, ênfase, informalidade calculada. Antes desse nível, romper é só erro.',
  },
};

function cultureSection(language: LanguageCode, level: CefrLevel): WorkbookSection | null {
  const notes = PRAGMATIC_NOTES[language] ?? [];
  if (notes.length === 0) return null;

  const meta = LANGUAGE_META[language];
  const index = (['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as CefrLevel[]).indexOf(level);
  const framing = CULTURE_FRAMING[level];

  // Recorte distinto por nível: os primeiros níveis veem uma nota por vez, os
  // avançados veem o conjunto — que é quando a interação entre elas importa.
  const selected = index < 3 ? [notes[index % notes.length]] : notes;

  return {
    id: `${workbookId(language, level)}:culture`,
    title: 'Como soar natural',
    order: 8,
    kind: 'practice',
    blocks: [
      { kind: 'heading', text: `O que ninguém ensina sobre falar ${meta.name.toLowerCase()}` },
      {
        kind: 'paragraph',
        text: 'Gramática correta com registro errado é o erro mais caro que existe: a pessoa entende você e forma uma impressão que você não pretendia causar.',
      },
      { kind: 'callout', tone: 'rule', title: framing.title, text: framing.text },
      ...selected
        .filter((note): note is NonNullable<typeof note> => note !== undefined)
        .map(
          (note): WorkbookBlock => ({
            kind: 'callout',
            tone: 'tip',
            title: note.title,
            text: note.note,
          }),
        ),
      {
        kind: 'callout',
        tone: 'warning',
        title: 'Como treinar isso',
        text: 'No tutor, diga a mesma frase nos modos "Formal" e "Bate-papo". A diferença que você precisa aprender a produzir fica evidente na comparação — e é impossível de perceber lendo sobre ela.',
      },
    ],
  };
}

/**
 * Exercícios de fixação.
 *
 * Vem das lições **comuns** do nível, não das provas — as provas alimentam o
 * simulado, que é outra seção com outro propósito. Aqui o objetivo é praticar
 * com a resposta à mão; lá é medir sem apoio.
 *
 * Como os exercícios são gerados por nível e idioma, cada apostila traz um
 * conjunto diferente sem que ninguém precise escrevê-los à mão.
 */
function practiceSection(language: LanguageCode, level: CefrLevel): WorkbookSection | null {
  const content = buildCourseContent(language);

  const courseIds = content.courses
    .filter((course) => course.level === level)
    .map((course) => course.id);
  const moduleIds = content.modules
    .filter((module) => courseIds.includes(module.courseId))
    .map((module) => module.id);
  const lessonIds = content.lessons
    .filter(
      (lesson) =>
        moduleIds.includes(lesson.moduleId) &&
        lesson.kind !== 'exam' &&
        lesson.kind !== 'checkpoint',
    )
    .map((lesson) => lesson.id);

  const items = content.exercises
    .filter((exercise) => lessonIds.includes(exercise.lessonId))
    .filter(
      (exercise): exercise is typeof exercise & { type: 'translate' } =>
        exercise.type === 'translate',
    )
    .slice(0, 18);

  if (items.length === 0) return null;

  return {
    id: `${workbookId(language, level)}:practice`,
    title: 'Exercícios',
    order: 10,
    kind: 'practice',
    blocks: [
      { kind: 'heading', text: 'Traduza sem consultar' },
      {
        kind: 'paragraph',
        text: 'Cubra a coluna da direita e traduza. Tentar lembrar antes de olhar é o que fixa — reler a tabela é confortável e quase inútil.',
      },
      {
        kind: 'vocabTable',
        rows: items.map((item) => ({
          term: item.prompt,
          translation: item.acceptedAnswers[0] ?? '',
        })),
      },
      {
        kind: 'callout',
        tone: 'tip',
        title: 'Como usar duas vezes',
        text: 'Na primeira passada, do português para o idioma. Na segunda, ao contrário. A direção português → idioma é muito mais difícil e é a que realmente prepara para falar.',
      },
    ],
  };
}

/**
 * Checklist do que o nível entrega.
 *
 * Sai dos `canDoStatements` dos módulos da trilha daquele nível, então é
 * literalmente a promessa do curso escrita em forma de conferência. O aluno
 * marca o que já faz e vê o que falta — que é a informação que ninguém tem
 * durante um curso de idioma.
 */
function moduleGoalsSection(language: LanguageCode, level: CefrLevel): WorkbookSection | null {
  const content = buildCourseContent(language);

  const courseIds = content.courses
    .filter((course) => course.level === level)
    .map((course) => course.id);
  const modules = content.modules.filter((module) => courseIds.includes(module.courseId));

  if (modules.length === 0) return null;

  const blocks: WorkbookBlock[] = [
    { kind: 'heading', text: `O que o ${level} entrega, módulo a módulo` },
    {
      kind: 'paragraph',
      text: 'Marque o que você já faz sem pensar. O que sobrar desmarcado é exatamente o seu plano de estudo — não é preciso adivinhar o que revisar.',
    },
  ];

  for (const module of modules) {
    blocks.push(
      { kind: 'heading', text: module.title },
      { kind: 'paragraph', text: module.subtitle },
      { kind: 'list', items: module.canDoStatements },
    );
  }

  return {
    id: `${workbookId(language, level)}:goals`,
    title: 'Checklist por módulo',
    order: 11,
    kind: 'summary',
    blocks,
  };
}

/**
 * Simulado da prova do nível.
 *
 * Montado a partir dos **exercícios reais** das provas daquele nível e idioma —
 * não de questões escritas à parte. Isso garante duas coisas: o simulado nunca
 * diverge da prova, e as 48 apostilas trazem simulados genuinamente diferentes,
 * porque os exercícios são diferentes.
 *
 * O gabarito vem no fim da seção, não ao lado da pergunta. Resposta visível
 * junto do enunciado transforma simulado em leitura.
 */
function examPrepSection(language: LanguageCode, level: CefrLevel): WorkbookSection | null {
  const content = buildCourseContent(language);

  const courseIds = content.courses
    .filter((course) => course.level === level)
    .map((course) => course.id);
  const moduleIds = content.modules
    .filter((module) => courseIds.includes(module.courseId))
    .map((module) => module.id);
  const examLessonIds = content.lessons
    .filter((lesson) => moduleIds.includes(lesson.moduleId) && lesson.kind === 'exam')
    .map((lesson) => lesson.id);

  const questions = content.exercises
    .filter((exercise) => examLessonIds.includes(exercise.lessonId))
    .filter(
      (exercise): exercise is typeof exercise & { type: 'multiple_choice' } =>
        exercise.type === 'multiple_choice',
    )
    .slice(0, 12);

  if (questions.length === 0) return null;

  const blocks: WorkbookBlock[] = [
    { kind: 'heading', text: `Simulado do nível ${level}` },
    {
      kind: 'paragraph',
      text: 'Estas questões vêm das provas reais deste nível. Responda cobrindo o gabarito, que está no fim da seção — conferir a resposta enquanto lê a pergunta mede leitura, não conhecimento.',
    },
  ];

  questions.forEach((question, index) => {
    blocks.push({
      kind: 'callout',
      tone: 'rule',
      title: `Questão ${index + 1}`,
      text: `${question.prompt}\n\n${question.choices
        .map((choice, position) => `${String.fromCharCode(97 + position)}) ${choice}`)
        .join('\n')}`,
    });
  });

  blocks.push(
    { kind: 'heading', text: 'Gabarito' },
    {
      kind: 'list',
      items: questions.map(
        (question, index) =>
          `${index + 1}. ${String.fromCharCode(97 + question.correctIndex)}) ${question.choices[question.correctIndex]}`,
      ),
    },
    {
      kind: 'callout',
      tone: 'tip',
      title: 'O que fazer com os erros',
      text: 'Cada questão errada aponta uma seção desta apostila. Volte a ela em vez de refazer o simulado: repetir a prova mede o mesmo de novo, reler a regra muda o resultado.',
    },
  );

  return {
    id: `${workbookId(language, level)}:exam`,
    title: 'Simulado',
    order: 9,
    kind: 'practice',
    blocks,
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
    pronunciationSection(language, level),
    grammarSection(language, level),
    phrasesSection(language, level),
    falseFriendsSection(language, level),
    idiomsSection(language, level),
    cultureSection(language, level),
    practiceSection(language, level),
    moduleGoalsSection(language, level),
    examPrepSection(language, level),
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
