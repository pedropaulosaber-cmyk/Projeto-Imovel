/**
 * Estrutura pedagógica por nível
 * ===============================
 *
 * Cada nível CEFR tem **três módulos**, e cada módulo termina numa **prova de
 * nível**. A estrutura é a mesma para os oito idiomas — o que muda é o dado
 * que a preenche (vocabulário, gramática, frases do idioma).
 *
 * ## Por que os módulos mudam de natureza conforme o nível
 *
 * Um erro comum em cursos gerados é repetir a mesma sequência ("vocabulário →
 * gramática → leitura → prova") em todos os níveis, trocando só as palavras.
 * O resultado é um C1 que parece um A1 com palavras difíceis.
 *
 * Aqui a **própria composição da lição muda**:
 *
 *  - **A1/A2** — peso em reconhecimento, escuta e repetição. O aluno ainda
 *    está construindo a forma sonora das palavras.
 *  - **B1/B2** — peso em produção e transformação: escrever, corrigir frase
 *    errada, ordenar diálogo, argumentar.
 *  - **C1/C2** — peso em análise, registro e nuance: leitura densa, redação,
 *    conversa livre longa. Múltipla escolha praticamente desaparece, porque
 *    nesse nível ela não discrimina mais nada.
 *
 * A prova de módulo acompanha: em A1 ela cobra reconhecimento; em C2 ela cobra
 * produção livre e escolha de registro.
 */

import type { CefrLevel, LessonKind } from '@/domain/types';

export type LessonBlueprint = {
  title: string;
  kind: LessonKind;
  minutes: number;
};

export type ModuleBlueprint = {
  key: string;
  title: string;
  subtitle: string;
  icon: string;
  canDo: string[];
  lessons: LessonBlueprint[];
};

/** Lição de prova, idêntica em estrutura e crescente em exigência. */
function exam(title: string, minutes: number): LessonBlueprint {
  return { title, kind: 'exam', minutes };
}

/* ================================================================== *
 * A1 — Fundamentos
 * ================================================================== */

const A1: ModuleBlueprint[] = [
  {
    key: 'a1-first-contact',
    title: 'Primeiros contatos',
    subtitle: 'Cumprimentar, se apresentar e sobreviver ao primeiro diálogo.',
    icon: 'hand-left',
    canDo: [
      'Cumprimentar e se despedir em situações formais e informais',
      'Dizer seu nome, de onde é e o que faz',
      'Pedir que repitam quando não entender',
    ],
    lessons: [
      { title: 'Olá e tchau', kind: 'vocabulary', minutes: 4 },
      { title: 'Quem é você', kind: 'conversation', minutes: 5 },
      { title: 'Ouvindo apresentações', kind: 'listening', minutes: 4 },
      { title: 'Sons e ritmo', kind: 'speaking', minutes: 5 },
      exam('Prova · Primeiros contatos', 7),
    ],
  },
  {
    key: 'a1-daily-life',
    title: 'Dia a dia',
    subtitle: 'Falar da sua rotina, do trabalho e do que você gosta.',
    icon: 'sunny',
    canDo: [
      'Descrever sua rotina no presente',
      'Falar sobre trabalho e estudo',
      'Expressar gostos e preferências',
    ],
    lessons: [
      { title: 'Minha rotina', kind: 'vocabulary', minutes: 5 },
      { title: 'As primeiras regras', kind: 'grammar', minutes: 6 },
      { title: 'Lendo um perfil', kind: 'reading', minutes: 5 },
      { title: 'Revisão do módulo', kind: 'review', minutes: 4 },
      exam('Prova · Dia a dia', 7),
    ],
  },
  {
    key: 'a1-out-and-about',
    title: 'Saindo de casa',
    subtitle: 'Restaurante, transporte, compras e pedidos.',
    icon: 'walk',
    canDo: [
      'Pedir comida e bebida em um restaurante',
      'Perguntar direções e usar transporte',
      'Fazer compras e perguntar preços',
    ],
    lessons: [
      { title: 'No restaurante', kind: 'vocabulary', minutes: 5 },
      { title: 'Pedindo com educação', kind: 'conversation', minutes: 6 },
      { title: 'Entendendo o garçom', kind: 'listening', minutes: 5 },
      { title: 'Shadowing: pedido completo', kind: 'shadowing', minutes: 6 },
      exam('Prova · Saindo de casa', 8),
    ],
  },
];

/* ================================================================== *
 * A2 — Sobrevivência
 * ================================================================== */

const A2: ModuleBlueprint[] = [
  {
    key: 'a2-neighbourhood',
    title: 'Meu bairro, minha vida',
    subtitle: 'Onde você mora, o que tem por perto, como resolver o dia.',
    icon: 'home',
    canDo: [
      'Descrever onde mora e o que há na região',
      'Marcar e desmarcar compromissos',
      'Explicar um problema simples e pedir ajuda',
    ],
    lessons: [
      { title: 'Vizinhança e serviços', kind: 'vocabulary', minutes: 5 },
      { title: 'Passado: o que aconteceu', kind: 'grammar', minutes: 7 },
      { title: 'Marcando um horário', kind: 'conversation', minutes: 6 },
      { title: 'Escutando instruções', kind: 'listening', minutes: 5 },
      exam('Prova · Meu bairro', 8),
    ],
  },
  {
    key: 'a2-money',
    title: 'Dinheiro e decisões',
    subtitle: 'Comprar, devolver, comparar e reclamar quando precisa.',
    icon: 'card',
    canDo: [
      'Comparar preços e produtos',
      'Devolver algo e explicar o motivo',
      'Falar sobre o que pode ou não pagar',
    ],
    lessons: [
      { title: 'Compras e trocas', kind: 'vocabulary', minutes: 5 },
      { title: 'Comparando coisas', kind: 'grammar', minutes: 7 },
      { title: 'Uma reclamação educada', kind: 'writing', minutes: 7 },
      { title: 'Revisão do módulo', kind: 'review', minutes: 4 },
      exam('Prova · Dinheiro e decisões', 8),
    ],
  },
  {
    key: 'a2-health',
    title: 'Corpo, saúde e imprevistos',
    subtitle: 'Explicar o que sente e entender o que dizem para fazer.',
    icon: 'medkit',
    canDo: [
      'Descrever sintomas e pedir ajuda médica',
      'Entender instruções de tratamento',
      'Falar de hábitos e mudanças de rotina',
    ],
    lessons: [
      { title: 'Sintomas e cuidados', kind: 'vocabulary', minutes: 5 },
      { title: 'Na farmácia', kind: 'conversation', minutes: 6 },
      { title: 'Pronúncia sob pressão', kind: 'speaking', minutes: 6 },
      exam('Prova · Saúde e imprevistos', 9),
    ],
  },
];

/* ================================================================== *
 * B1 — Autonomia
 * ================================================================== */

const B1: ModuleBlueprint[] = [
  {
    key: 'b1-opinion',
    title: 'Ter e defender opinião',
    subtitle: 'Concordar, discordar e justificar sem travar.',
    icon: 'chatbubbles',
    canDo: [
      'Dar opinião e sustentá-la com um motivo',
      'Discordar sem ser rude',
      'Reformular quando não for entendido',
    ],
    lessons: [
      { title: 'Vocabulário de opinião', kind: 'vocabulary', minutes: 6 },
      { title: 'Estruturas de argumento', kind: 'grammar', minutes: 8 },
      { title: 'Corrigindo o que está errado', kind: 'writing', minutes: 7 },
      { title: 'Debate curto com o tutor', kind: 'conversation', minutes: 8 },
      exam('Prova · Opinião', 10),
    ],
  },
  {
    key: 'b1-story',
    title: 'Contar o que aconteceu',
    subtitle: 'Narrar em sequência, com tempo e causa claros.',
    icon: 'book',
    canDo: [
      'Narrar um acontecimento do começo ao fim',
      'Situar no tempo e explicar a causa',
      'Relatar o que outra pessoa disse',
    ],
    lessons: [
      { title: 'Palavras de narrativa', kind: 'vocabulary', minutes: 6 },
      { title: 'Tempos do passado', kind: 'grammar', minutes: 8 },
      { title: 'Ordenando um diálogo', kind: 'reading', minutes: 7 },
      { title: 'Escutando um relato', kind: 'listening', minutes: 6 },
      exam('Prova · Narrativa', 10),
    ],
  },
  {
    key: 'b1-work',
    title: 'Trabalho e estudo',
    subtitle: 'E-mail, reunião, prazo e o vocabulário do escritório.',
    icon: 'briefcase',
    canDo: [
      'Escrever um e-mail profissional simples',
      'Participar de uma reunião curta',
      'Negociar prazo e pedir esclarecimento',
    ],
    lessons: [
      { title: 'Vocabulário profissional', kind: 'vocabulary', minutes: 6 },
      { title: 'Escrevendo um e-mail', kind: 'writing', minutes: 8 },
      { title: 'Reunião simulada', kind: 'conversation', minutes: 8 },
      exam('Prova · Trabalho', 11),
    ],
  },
];

/* ================================================================== *
 * B2 — Nuance
 * ================================================================== */

const B2: ModuleBlueprint[] = [
  {
    key: 'b2-abstract',
    title: 'Ideias abstratas',
    subtitle: 'Causa, consequência, hipótese e condição.',
    icon: 'bulb',
    canDo: [
      'Formular hipóteses e falar do irreal',
      'Encadear causa e consequência',
      'Reconhecer o grau de certeza de quem fala',
    ],
    lessons: [
      { title: 'Léxico da abstração', kind: 'vocabulary', minutes: 6 },
      { title: 'Condicional e hipótese', kind: 'grammar', minutes: 9 },
      { title: 'Texto argumentativo', kind: 'reading', minutes: 8 },
      { title: 'Reescrevendo com precisão', kind: 'writing', minutes: 9 },
      exam('Prova · Abstração', 12),
    ],
  },
  {
    key: 'b2-critique',
    title: 'Analisar e criticar',
    subtitle: 'Apontar falha, reconhecer mérito, propor alternativa.',
    icon: 'analytics',
    canDo: [
      'Avaliar um argumento e apontar sua fragilidade',
      'Reconhecer um ponto sem abrir mão do seu',
      'Propor alternativa de forma construtiva',
    ],
    lessons: [
      { title: 'Vocabulário de crítica', kind: 'vocabulary', minutes: 6 },
      { title: 'Voz passiva e impessoalidade', kind: 'grammar', minutes: 9 },
      { title: 'Escuta de entrevista', kind: 'listening', minutes: 8 },
      { title: 'Discussão aberta', kind: 'conversation', minutes: 9 },
      exam('Prova · Análise crítica', 12),
    ],
  },
  {
    key: 'b2-media',
    title: 'Mídia e cultura',
    subtitle: 'Notícia, série, música e o que fica implícito.',
    icon: 'film',
    canDo: [
      'Entender notícia sem legenda',
      'Captar ironia e implícito',
      'Comentar um conteúdo com vocabulário próprio',
    ],
    lessons: [
      { title: 'Léxico de mídia', kind: 'vocabulary', minutes: 6 },
      { title: 'Shadowing de fala rápida', kind: 'shadowing', minutes: 8 },
      { title: 'Revisão do módulo', kind: 'review', minutes: 5 },
      exam('Prova · Mídia', 13),
    ],
  },
];

/* ================================================================== *
 * C1 — Proficiência
 * ================================================================== */

const C1: ModuleBlueprint[] = [
  {
    key: 'c1-academic',
    title: 'Registro acadêmico',
    subtitle: 'Escrever e ler como se escreve num artigo.',
    icon: 'school',
    canDo: [
      'Ler texto acadêmico sem apoio de tradução',
      'Estruturar um argumento escrito',
      'Calibrar a certeza de uma afirmação',
    ],
    lessons: [
      { title: 'Léxico acadêmico', kind: 'vocabulary', minutes: 7 },
      { title: 'Estruturas formais', kind: 'grammar', minutes: 10 },
      { title: 'Leitura densa', kind: 'reading', minutes: 10 },
      { title: 'Ensaio curto', kind: 'writing', minutes: 12 },
      exam('Prova · Registro acadêmico', 14),
    ],
  },
  {
    key: 'c1-professional',
    title: 'Alto desempenho profissional',
    subtitle: 'Negociar, apresentar, discordar de superior.',
    icon: 'trending-up',
    canDo: [
      'Conduzir uma negociação',
      'Apresentar e responder a objeções',
      'Ajustar o registro conforme a hierarquia',
    ],
    lessons: [
      { title: 'Léxico de negociação', kind: 'vocabulary', minutes: 7 },
      { title: 'Atenuação e cortesia', kind: 'grammar', minutes: 10 },
      { title: 'Negociação simulada', kind: 'conversation', minutes: 12 },
      exam('Prova · Profissional', 14),
    ],
  },
  {
    key: 'c1-nuance',
    title: 'Precisão e implícito',
    subtitle: 'Dizer exatamente o que se quer dizer — e o que não se quer.',
    icon: 'color-filter',
    canDo: [
      'Escolher entre sinônimos pela conotação',
      'Perceber o que foi deixado de fora',
      'Reconhecer ironia e atenuação',
    ],
    lessons: [
      { title: 'Sinônimos e conotação', kind: 'vocabulary', minutes: 7 },
      { title: 'Escuta de debate', kind: 'listening', minutes: 10 },
      { title: 'Revisão do módulo', kind: 'review', minutes: 6 },
      exam('Prova · Precisão', 15),
    ],
  },
];

/* ================================================================== *
 * C2 — Domínio
 * ================================================================== */

const C2: ModuleBlueprint[] = [
  {
    key: 'c2-idiomatic',
    title: 'Domínio idiomático',
    subtitle: 'O que um nativo culto diz e um estrangeiro fluente não.',
    icon: 'sparkles',
    canDo: [
      'Usar expressão idiomática culta no contexto certo',
      'Reconhecer eufemismo e atenuação irônica',
      'Escolher colocações naturais sem hesitar',
    ],
    lessons: [
      { title: 'Léxico de precisão', kind: 'vocabulary', minutes: 8 },
      { title: 'Colocação e naturalidade', kind: 'grammar', minutes: 10 },
      { title: 'Leitura literária', kind: 'reading', minutes: 12 },
      exam('Prova · Domínio idiomático', 16),
    ],
  },
  {
    key: 'c2-rhetoric',
    title: 'Retórica e persuasão',
    subtitle: 'Construir um texto que convence, não apenas que informa.',
    icon: 'megaphone',
    canDo: [
      'Estruturar um texto persuasivo',
      'Antecipar e desarmar objeções',
      'Modular o tom conforme o público',
    ],
    lessons: [
      { title: 'Léxico retórico', kind: 'vocabulary', minutes: 8 },
      { title: 'Redação persuasiva', kind: 'writing', minutes: 14 },
      { title: 'Defesa oral de uma posição', kind: 'conversation', minutes: 12 },
      exam('Prova · Retórica', 16),
    ],
  },
  {
    key: 'c2-mastery',
    title: 'Prova final de domínio',
    subtitle: 'Tudo junto, sem apoio, como na vida real.',
    icon: 'trophy',
    canDo: [
      'Sustentar conversa longa sobre tema não familiar',
      'Escrever com registro adequado sem revisão',
      'Compreender fala rápida com sotaque variado',
    ],
    lessons: [
      { title: 'Escuta sem apoio', kind: 'listening', minutes: 12 },
      { title: 'Projeto final', kind: 'project', minutes: 18 },
      exam('Prova final · Domínio', 20),
    ],
  },
];

/* ================================================================== *
 * Registro
 * ================================================================== */

export const LEVEL_BLUEPRINTS: Record<CefrLevel, ModuleBlueprint[]> = {
  A1,
  A2,
  B1,
  B2,
  C1,
  C2,
};

/** Título e descrição do curso de cada nível. */
export const LEVEL_COURSE_META: Record<CefrLevel, { title: string; description: string }> = {
  A1: {
    title: 'Fundamentos',
    description:
      'Do zero ao primeiro diálogo real. Base de vocabulário e estruturas essenciais.',
  },
  A2: {
    title: 'Sobrevivência',
    description: 'Resolver o dia a dia sozinho: bairro, compras, saúde e imprevistos.',
  },
  B1: {
    title: 'Autonomia',
    description: 'Opinar, narrar e trabalhar no idioma sem depender de tradução.',
  },
  B2: {
    title: 'Nuance',
    description: 'Hipótese, crítica e implícito. Onde a língua deixa de ser literal.',
  },
  C1: {
    title: 'Proficiência',
    description: 'Registro acadêmico e profissional, com controle fino de certeza e cortesia.',
  },
  C2: {
    title: 'Domínio',
    description: 'Precisão idiomática, retórica e naturalidade indistinguível.',
  },
};
