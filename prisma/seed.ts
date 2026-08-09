import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';
import { hash } from '@node-rs/argon2';

import { PrismaClient } from '../src/generated/prisma/client';

/**
 * Seed de desenvolvimento
 * =======================
 *
 * Popula o banco com um marketplace **plausível**: categorias reais, produtos
 * com preço de mercado brasileiro, profissionais com portfólio, demandas
 * abertas com propostas e um histórico de compras que sustenta as avaliações.
 *
 * ## Por que o realismo importa num seed
 *
 * Dado de mentira ("Produto 1", "R$ 10") esconde exatamente os defeitos que o
 * seed deveria expor: nome longo que estoura o card, preço de cinco dígitos
 * que quebra o alinhamento, categoria sem produto que deixa um buraco na home.
 * Um seed realista faz o desenvolvedor ver a interface que o usuário verá.
 *
 * ## Idempotente
 *
 * Roda quantas vezes for preciso. Usa `upsert` por chave natural (slug,
 * e-mail), então não duplica e não exige limpar o banco antes.
 */

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const CATEGORIES = [
  {
    slug: 'atendimento',
    name: 'Atendimento e suporte',
    description: 'Agentes de resposta, triagem de tickets e roteamento multicanal.',
    position: 0,
  },
  {
    slug: 'vendas',
    name: 'Vendas e CRM',
    description: 'Qualificação de leads, follow-up automático e enriquecimento de base.',
    position: 1,
  },
  {
    slug: 'financeiro',
    name: 'Financeiro e cobrança',
    description: 'Conciliação, régua de cobrança e emissão de documentos fiscais.',
    position: 2,
  },
  {
    slug: 'marketing',
    name: 'Marketing e conteúdo',
    description: 'Geração de campanhas, SEO programático e produção em escala.',
    position: 3,
  },
  {
    slug: 'operacoes',
    name: 'Operações e back-office',
    description: 'Extração de documentos, entrada de dados e integração entre sistemas.',
    position: 4,
  },
  {
    slug: 'dados',
    name: 'Dados e análise',
    description: 'Pipelines, previsão de churn e relatórios que se escrevem sozinhos.',
    position: 5,
  },
] as const;

type SeedProduct = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  kind: 'AI_AGENT' | 'AUTOMATION' | 'WORKFLOW' | 'TEMPLATE' | 'PROMPT_PACK' | 'DATASET' | 'INTEGRATION';
  category: string;
  priceCents: number;
  tools: string[];
  integrations: string[];
  tags: string[];
  author: string;
};

const PRODUCTS: SeedProduct[] = [
  {
    slug: 'agente-qualificacao-de-leads-whatsapp',
    name: 'Agente de qualificação de leads no WhatsApp',
    tagline: 'Conversa com o lead, aplica seu roteiro de qualificação e entrega no CRM já pontuado.',
    description:
      'Um agente que atende o lead no WhatsApp em até cinco segundos, conduz a conversa pelo roteiro de qualificação que você definir (BANT, GPCT ou o seu próprio) e grava a resposta de cada critério como campo estruturado no CRM.\n\nO que ele resolve: a maior parte dos leads inbound esfria porque ninguém responde na primeira hora. O agente responde sempre, a qualquer hora, e passa para um humano no momento em que o lead demonstra intenção de compra — com o histórico inteiro da conversa já anexado ao card.\n\nInclui o fluxo pronto no n8n, os prompts de qualificação em português, o mapeamento de campos para HubSpot e RD Station, e um painel de acompanhamento das conversas.',
    kind: 'AI_AGENT',
    category: 'vendas',
    priceCents: 189_000,
    tools: ['n8n', 'OpenAI', 'WhatsApp Business API'],
    integrations: ['HubSpot', 'RD Station', 'Pipedrive'],
    tags: ['whatsapp', 'leads', 'crm', 'vendas'],
    author: 'mariana',
  },
  {
    slug: 'triagem-automatica-de-tickets',
    name: 'Triagem automática de tickets de suporte',
    tagline: 'Classifica, prioriza e roteia cada ticket novo antes de alguém abrir a fila.',
    description:
      'Lê o ticket que acabou de entrar, identifica assunto, urgência e produto envolvido, e encaminha para a fila certa com a prioridade certa.\n\nA diferença para uma regra de palavra-chave: o modelo entende "não consigo emitir a nota desde ontem" como urgência fiscal mesmo sem a palavra "urgente" aparecer. Em operações de suporte com mais de 200 tickets por dia, isso corta o tempo de primeira resposta pela metade.\n\nVem com o conjunto de categorias já treinado para SaaS B2B brasileiro, o conector para Zendesk e Freshdesk, e um relatório semanal de acurácia da classificação para você ajustar.',
    kind: 'AUTOMATION',
    category: 'atendimento',
    priceCents: 129_000,
    tools: ['Make', 'OpenAI'],
    integrations: ['Zendesk', 'Freshdesk', 'Slack'],
    tags: ['suporte', 'tickets', 'classificacao'],
    author: 'rafael',
  },
  {
    slug: 'regua-de-cobranca-escalonada',
    name: 'Régua de cobrança escalonada',
    tagline: 'Sete toques, do lembrete gentil ao aviso de protesto, com tom ajustado por perfil.',
    description:
      'Automação completa de cobrança de inadimplência, com sete pontos de contato em canais diferentes e mensagens que mudam de tom conforme os dias de atraso e o histórico do cliente.\n\nO ponto sensível da cobrança é o tom: o mesmo texto duro que funciona no atraso de 90 dias queima um cliente bom que esqueceu do boleto. A régua separa os dois casos usando o histórico de pagamento, e nunca envia a mensagem dura para quem nunca atrasou antes.\n\nInclui os textos revisados por advogado (dentro do que o CDC art. 42 permite), integração com Asaas e Cora, e a baixa automática quando o pagamento entra.',
    kind: 'WORKFLOW',
    category: 'financeiro',
    priceCents: 84_000,
    tools: ['n8n'],
    integrations: ['Asaas', 'Cora', 'WhatsApp Business API'],
    tags: ['cobranca', 'inadimplencia', 'financeiro'],
    author: 'mariana',
  },
  {
    slug: 'extrator-de-notas-fiscais',
    name: 'Extrator de notas fiscais em PDF',
    tagline: 'Lê o PDF da nota, extrai os 24 campos e devolve JSON pronto para o ERP.',
    description:
      'Recebe a nota fiscal em PDF — inclusive as escaneadas — e devolve emitente, destinatário, itens, impostos e totais como JSON estruturado.\n\nFoi treinado nos layouts de NF-e, NFS-e e NFC-e usados no Brasil, incluindo as variações municipais de nota de serviço, que são a parte que quebra qualquer extrator genérico.\n\nInclui a validação de chave de acesso, a conferência de soma dos itens contra o total (que pega erro de OCR antes de ele entrar no ERP) e conectores para Omie e Bling.',
    kind: 'INTEGRATION',
    category: 'operacoes',
    priceCents: 156_000,
    tools: ['Python', 'OpenAI'],
    integrations: ['Omie', 'Bling', 'Google Drive'],
    tags: ['nfe', 'ocr', 'fiscal', 'erp'],
    author: 'carlos',
  },
  {
    slug: 'previsao-de-churn-assinatura',
    name: 'Modelo de previsão de churn para assinatura',
    tagline: 'Aponta quem vai cancelar nos próximos 30 dias e por quê, com 30 dias de antecedência.',
    description:
      'Pipeline completo de previsão de cancelamento para negócios de assinatura: ingestão dos eventos de uso, engenharia de atributos, treino e um endpoint que devolve o risco por cliente.\n\nO que faz diferença aqui não é o modelo, é a explicação: junto do escore vem o motivo dominante (queda de uso, chamado de suporte não resolvido, falha de pagamento), porque "cliente X tem 73% de risco" sem motivo não gera ação nenhuma no time de CS.\n\nInclui notebook de treino comentado, o esquema de dados esperado, o serviço em FastAPI e um painel no Metabase.',
    kind: 'DATASET',
    category: 'dados',
    priceCents: 240_000,
    tools: ['Python', 'scikit-learn', 'FastAPI'],
    integrations: ['Metabase', 'PostgreSQL', 'Stripe'],
    tags: ['churn', 'previsao', 'saas', 'retencao'],
    author: 'carlos',
  },
  {
    slug: 'pack-prompts-conteudo-seo',
    name: 'Pack de prompts para conteúdo com SEO',
    tagline: '48 prompts encadeados que vão da pesquisa de pauta ao texto revisado.',
    description:
      'Quarenta e oito prompts organizados em seis cadeias: pesquisa de intenção de busca, seleção de pauta, estrutura, redação, revisão e adaptação para redes.\n\nCada prompt traz a instrução, o formato de saída esperado e um exemplo real de entrada e saída — que é o que separa um pack útil de uma lista de frases genéricas.\n\nEscritos em português e calibrados para o português do Brasil: os prompts incluem instruções explícitas contra os vícios de tradução que fazem texto gerado soar estrangeiro.',
    kind: 'PROMPT_PACK',
    category: 'marketing',
    priceCents: 29_000,
    tools: ['ChatGPT', 'Claude'],
    integrations: [],
    tags: ['prompts', 'seo', 'conteudo', 'copywriting'],
    author: 'juliana',
  },
  {
    slug: 'agente-de-follow-up-comercial',
    name: 'Agente de follow-up comercial',
    tagline: 'Retoma a conversa parada no momento certo, com o contexto do que já foi dito.',
    description:
      'Monitora as oportunidades do CRM, identifica as que pararam de avançar e retoma o contato com uma mensagem que faz referência ao que já foi conversado.\n\nO detalhe que evita o efeito robô: o agente lê o histórico da negociação antes de escrever, então o follow-up cita a objeção real do cliente em vez de mandar "passando para saber se você viu minha mensagem".\n\nInclui a lógica de cadência (quando insistir, quando esperar, quando desistir), os limites de frequência por canal e o registro de cada toque no CRM.',
    kind: 'AI_AGENT',
    category: 'vendas',
    priceCents: 167_000,
    tools: ['n8n', 'Claude'],
    integrations: ['Pipedrive', 'HubSpot', 'Gmail'],
    tags: ['follow-up', 'vendas', 'cadencia'],
    author: 'rafael',
  },
  {
    slug: 'template-dashboard-operacao-ia',
    name: 'Template de painel de operação de IA',
    tagline: 'Custo por chamada, latência, taxa de erro e consumo por time num painel só.',
    description:
      'Painel pronto para acompanhar o custo e a saúde das suas integrações de IA: gasto por modelo, por time e por funcionalidade, latência percentil 95, taxa de erro e alerta de estouro de orçamento.\n\nExiste porque a conta da API de IA cresce sem ninguém perceber: o custo aparece agregado no fim do mês, e a essa altura já não dá para saber qual funcionalidade consumiu.\n\nInclui o esquema de eventos, o coletor, as consultas SQL e o painel importável no Grafana e no Metabase.',
    kind: 'TEMPLATE',
    category: 'dados',
    priceCents: 68_000,
    tools: ['Grafana', 'PostgreSQL'],
    integrations: ['Metabase', 'OpenAI', 'Anthropic'],
    tags: ['observabilidade', 'custo', 'llmops'],
    author: 'juliana',
  },
];

type SeedUser = {
  key: string;
  name: string;
  email: string;
  roles: ('BUYER' | 'CREATOR' | 'PROFESSIONAL' | 'ADMIN')[];
  professional?: {
    headline: string;
    bio: string;
    specialties: string[];
    tools: string[];
    startingAtCents: number;
    availability: 'AVAILABLE' | 'LIMITED' | 'UNAVAILABLE';
    location: string;
    portfolio: { title: string; summary: string; outcome: string }[];
  };
};

const USERS: SeedUser[] = [
  {
    key: 'admin',
    name: 'Equipe AUTOMATIZE',
    email: 'admin@automatize.com.br',
    roles: ['ADMIN', 'BUYER'],
  },
  {
    key: 'mariana',
    name: 'Mariana Duarte',
    email: 'mariana@exemplo.com.br',
    roles: ['BUYER', 'CREATOR', 'PROFESSIONAL'],
    professional: {
      headline: 'Automação comercial para operações de vendas B2B',
      bio: 'Trabalho há oito anos com operações de vendas e há quatro construo automação para times comerciais. Meu foco é o que acontece entre o lead entrar e o vendedor ligar — a faixa onde a maior parte das oportunidades se perde por demora ou por falta de contexto.\n\nJá implantei qualificação automática em operações de 5 a 120 vendedores, sempre com a mesma preocupação: a automação não pode fazer o lead sentir que falou com um robô, e o vendedor não pode receber um card sem contexto.',
      specialties: ['Automação de vendas', 'WhatsApp Business API', 'CRM', 'Qualificação de leads'],
      tools: ['n8n', 'Make', 'HubSpot', 'RD Station', 'OpenAI'],
      startingAtCents: 480_000,
      availability: 'AVAILABLE',
      location: 'São Paulo, SP',
      portfolio: [
        {
          title: 'Qualificação automática para rede de franquias',
          summary:
            'Implantei o atendimento e a qualificação de leads das 62 unidades num fluxo único, com roteamento por região e repasse ao franqueado com o histórico anexado.',
          outcome: 'Tempo de primeira resposta caiu de 4h12 para 40 segundos.',
        },
        {
          title: 'Enriquecimento de base para SaaS de RH',
          summary:
            'Pipeline que cruza a base de leads com dados públicos de porte e setor, e reordena a fila do SDR por probabilidade de fechamento.',
          outcome: 'Taxa de conexão do SDR subiu de 18% para 31%.',
        },
      ],
    },
  },
  {
    key: 'rafael',
    name: 'Rafael Nogueira',
    email: 'rafael@exemplo.com.br',
    roles: ['BUYER', 'CREATOR', 'PROFESSIONAL'],
    professional: {
      headline: 'Agentes de IA para atendimento e suporte em escala',
      bio: 'Construo agentes de atendimento para operações que passam de mil tickets por dia. Comecei em suporte técnico, o que me deixou com uma opinião firme: agente que não sabe transferir para humano no momento certo piora o atendimento em vez de melhorar.\n\nMeu trabalho começa sempre pela análise dos tickets reais do cliente — sem isso, o agente é treinado no que a empresa acha que os clientes perguntam, e não no que eles perguntam de fato.',
      specialties: ['Agentes de atendimento', 'Classificação de tickets', 'RAG', 'Base de conhecimento'],
      tools: ['Make', 'n8n', 'OpenAI', 'Zendesk', 'Pinecone'],
      startingAtCents: 620_000,
      availability: 'LIMITED',
      location: 'Florianópolis, SC',
      portfolio: [
        {
          title: 'Agente de primeiro nível para fintech',
          summary:
            'Agente que resolve dúvida de saldo, extrato e limite consultando a API do cliente, e transfere para humano em qualquer assunto de contestação.',
          outcome: '61% dos tickets resolvidos sem intervenção humana.',
        },
      ],
    },
  },
  {
    key: 'carlos',
    name: 'Carlos Menezes',
    email: 'carlos@exemplo.com.br',
    roles: ['BUYER', 'CREATOR', 'PROFESSIONAL'],
    professional: {
      headline: 'Engenharia de dados e modelos preditivos aplicados',
      bio: 'Construo pipelines e modelos que entram em produção e continuam funcionando seis meses depois — que é a parte difícil, e a que a maioria dos projetos de ciência de dados não alcança.\n\nTrabalho com previsão de churn, precificação e detecção de anomalia. Entrego sempre com monitoramento de deriva do modelo: um preditor que não é acompanhado envelhece em silêncio e passa a errar sem avisar ninguém.',
      specialties: ['Previsão de churn', 'Engenharia de dados', 'MLOps', 'Detecção de anomalias'],
      tools: ['Python', 'dbt', 'FastAPI', 'PostgreSQL', 'Metabase'],
      startingAtCents: 850_000,
      availability: 'AVAILABLE',
      location: 'Belo Horizonte, MG',
      portfolio: [
        {
          title: 'Previsão de cancelamento para academia',
          summary:
            'Modelo de churn com 30 dias de antecedência, alimentado por frequência de check-in, histórico de pagamento e uso do app.',
          outcome: 'Campanha de retenção baseada no escore recuperou 22% dos alunos em risco.',
        },
        {
          title: 'Observabilidade de custo de IA para scale-up',
          summary:
            'Instrumentação de todas as chamadas de LLM da empresa, com rateio por time e alerta de estouro de orçamento.',
          outcome: 'Custo mensal de API caiu 38% no primeiro trimestre.',
        },
      ],
    },
  },
  {
    key: 'juliana',
    name: 'Juliana Prado',
    email: 'juliana@exemplo.com.br',
    roles: ['BUYER', 'CREATOR'],
  },
  {
    key: 'empresa',
    name: 'Bruno Camargo',
    email: 'bruno@empresaexemplo.com.br',
    roles: ['BUYER'],
  },
];

const DEMANDS = [
  {
    title: 'Automatizar a conciliação bancária de 4 contas PJ',
    problem:
      'Hoje o time financeiro exporta o OFX de quatro bancos e concilia manualmente contra o contas a receber no Omie. São cerca de 900 lançamentos por mês e duas pessoas gastam três dias nisso.\n\nO problema não é só o tempo: a conciliação manual erra, e o erro só aparece no fechamento, quando já custou caro rastrear.',
    goal: 'Conciliação automática diária, com fila de exceções só para o que não casar sozinho.',
    tools: ['Omie', 'n8n'],
    budgetMinCents: 800_000,
    budgetMaxCents: 1_500_000,
    deadlineDays: 45,
    buyer: 'empresa',
  },
  {
    title: 'Agente para responder edital de licitação',
    problem:
      'Participamos de 15 a 20 licitações por mês. Cada edital tem entre 40 e 200 páginas e alguém precisa ler para decidir se vale a pena participar e quais documentos preparar.\n\nQueremos um agente que leia o edital, extraia objeto, prazo, exigências de habilitação e critérios de julgamento, e diga se atendemos aos requisitos com base no nosso cadastro.',
    goal: 'Reduzir a triagem de edital de 3 horas para 15 minutos de conferência.',
    tools: ['OpenAI', 'Python'],
    budgetMinCents: 1_200_000,
    budgetMaxCents: 2_500_000,
    deadlineDays: 60,
    buyer: 'empresa',
  },
  {
    title: 'Resumo automático de reuniões comerciais no CRM',
    problem:
      'As reuniões são gravadas no Google Meet, mas ninguém preenche o CRM depois. O resultado é que a próxima pessoa que fala com o cliente não sabe o que foi combinado.',
    goal: 'Transcrição, resumo com próximos passos e gravação automática no card do Pipedrive.',
    tools: ['Google Meet', 'Pipedrive'],
    budgetMinCents: 400_000,
    budgetMaxCents: 900_000,
    deadlineDays: 30,
    buyer: 'juliana',
  },
];

async function main() {
  console.log('Semeando o banco…');

  // --- Categorias ---------------------------------------------------------
  for (const category of CATEGORIES) {
    await prisma.productCategory.upsert({
      where: { slug: category.slug },
      create: category,
      update: { name: category.name, description: category.description, position: category.position },
    });
  }

  // --- Usuários -----------------------------------------------------------
  // Senha única de desenvolvimento. O hash é calculado uma vez: argon2 custa
  // ~50ms de propósito, e seis chamadas seriam meio segundo à toa.
  const devPasswordHash = await hash('automatize-dev-2026', {
    memoryCost: 19_456,
    timeCost: 2,
    parallelism: 1,
  });

  const userIds = new Map<string, string>();

  for (const seedUser of USERS) {
    const user = await prisma.user.upsert({
      where: { email: seedUser.email },
      create: {
        email: seedUser.email,
        name: seedUser.name,
        passwordHash: devPasswordHash,
        emailVerified: new Date(),
        roles: { create: seedUser.roles.map((role) => ({ role })) },
        profile: { create: {} },
      },
      update: { name: seedUser.name },
      select: { id: true },
    });

    userIds.set(seedUser.key, user.id);

    if (seedUser.professional) {
      const professional = seedUser.professional;
      const profile = await prisma.professionalProfile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          slug: seedUser.key,
          headline: professional.headline,
          bio: professional.bio,
          specialties: professional.specialties,
          tools: professional.tools,
          startingAtCents: professional.startingAtCents,
          availability: professional.availability,
          location: professional.location,
          verifiedAt: new Date(),
        },
        update: {
          headline: professional.headline,
          bio: professional.bio,
          specialties: professional.specialties,
          tools: professional.tools,
          startingAtCents: professional.startingAtCents,
          availability: professional.availability,
        },
        select: { id: true },
      });

      await prisma.portfolioItem.deleteMany({ where: { profileId: profile.id } });
      await prisma.portfolioItem.createMany({
        data: professional.portfolio.map((item, index) => ({
          profileId: profile.id,
          title: item.title,
          summary: item.summary,
          outcome: item.outcome,
          position: index,
        })),
      });
    }
  }

  // --- Produtos -----------------------------------------------------------
  const categoryIds = new Map(
    (await prisma.productCategory.findMany({ select: { id: true, slug: true } })).map((category) => [
      category.slug,
      category.id,
    ]),
  );

  const productIds = new Map<string, string>();

  for (const seedProduct of PRODUCTS) {
    const categoryId = categoryIds.get(seedProduct.category);
    const authorId = userIds.get(seedProduct.author);
    if (!categoryId || !authorId) continue;

    const product = await prisma.product.upsert({
      where: { slug: seedProduct.slug },
      create: {
        slug: seedProduct.slug,
        name: seedProduct.name,
        tagline: seedProduct.tagline,
        description: seedProduct.description,
        kind: seedProduct.kind,
        categoryId,
        authorId,
        priceCents: seedProduct.priceCents,
        requiredTools: seedProduct.tools,
        integrations: seedProduct.integrations,
        requirements:
          'Conta ativa nas ferramentas listadas e permissão de administrador para criar as integrações.',
        status: 'PUBLISHED',
        publishedAt: new Date(),
        tags: { create: seedProduct.tags.map((tag) => ({ tag })) },
      },
      update: {
        name: seedProduct.name,
        tagline: seedProduct.tagline,
        description: seedProduct.description,
        priceCents: seedProduct.priceCents,
        status: 'PUBLISHED',
      },
      select: { id: true },
    });

    productIds.set(seedProduct.slug, product.id);

    // Um entregável por produto, para que a biblioteca e o download tenham o
    // que mostrar. A chave aponta para o bucket privado (que só existe quando
    // as credenciais de storage estão configuradas).
    const storageKey = `products/${product.id}/seed/entregavel.zip`;
    await prisma.productFile.upsert({
      where: { storageKey },
      create: {
        productId: product.id,
        storageKey,
        filename: `${seedProduct.slug}.zip`,
        contentType: 'application/zip',
        sizeBytes: 2_400_000,
        version: '1.0.0',
      },
      update: {},
    });
  }

  // --- Compras e avaliações ----------------------------------------------
  // As avaliações precisam de compra: a regra de negócio exige, e um seed que
  // a contorne esconderia justamente o comportamento que se quer verificar.
  const REVIEWS = [
    { product: 'agente-qualificacao-de-leads-whatsapp', buyer: 'empresa', rating: 5, comment: 'Subimos em dois dias. O roteiro de qualificação já vinha bem pensado e só precisamos ajustar dois campos para o nosso CRM. O que mais surpreendeu foi a transferência para o vendedor: chega com o resumo pronto.' },
    { product: 'agente-qualificacao-de-leads-whatsapp', buyer: 'juliana', rating: 4, comment: 'Funciona muito bem. Tirei uma estrela porque a documentação do conector do Pipedrive assume que você já conhece a API deles — travei umas duas horas ali.' },
    { product: 'triagem-automatica-de-tickets', buyer: 'empresa', rating: 5, comment: 'A classificação acerta mais que a triagem manual que a gente fazia. O relatório semanal de acurácia é o que faz diferença: dá para ver onde está errando e corrigir.' },
    { product: 'extrator-de-notas-fiscais', buyer: 'juliana', rating: 5, comment: 'Testei com 300 notas de municípios diferentes e ele acertou todas menos duas, ambas escaneadas tortas. A conferência de soma pegou o erro antes de entrar no ERP.' },
    { product: 'pack-prompts-conteudo-seo', buyer: 'empresa', rating: 4, comment: 'Os prompts de pesquisa de pauta são os melhores do pacote. Os de revisão eu acabei adaptando bastante para o nosso tom.' },
  ];

  let orderCounter = 0;
  for (const review of REVIEWS) {
    const productId = productIds.get(review.product);
    const buyerId = userIds.get(review.buyer);
    if (!productId || !buyerId) continue;

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { name: true, priceCents: true },
    });
    if (!product) continue;

    const feeCents = Math.floor(product.priceCents * 0.15);
    const number = `AUT-SEED${String(++orderCounter).padStart(2, '0')}`;

    const existingOrder = await prisma.order.findUnique({ where: { number }, select: { id: true } });

    if (!existingOrder) {
      await prisma.order.create({
        data: {
          number,
          buyerId,
          status: 'PAID',
          subtotalCents: product.priceCents,
          feeCents,
          totalCents: product.priceCents,
          paidAt: new Date(),
          items: {
            create: {
              productId,
              productName: product.name,
              unitPriceCents: product.priceCents,
              feeCents,
            },
          },
        },
      });
    }

    await prisma.review.upsert({
      where: { productId_authorId: { productId, authorId: buyerId } },
      create: { productId, authorId: buyerId, rating: review.rating, comment: review.comment },
      update: { rating: review.rating, comment: review.comment },
    });
  }

  // Recalcula os agregados a partir do que ficou gravado, em vez de somar à
  // mão — assim o seed exercita o mesmo caminho que a aplicação usa.
  for (const productId of productIds.values()) {
    const aggregate = await prisma.review.aggregate({
      where: { productId },
      _sum: { rating: true },
      _count: { _all: true },
    });
    const sales = await prisma.orderItem.count({
      where: { productId, order: { status: 'PAID' } },
    });

    await prisma.product.update({
      where: { id: productId },
      data: {
        ratingSum: aggregate._sum.rating ?? 0,
        ratingCount: aggregate._count._all,
        salesCount: sales,
      },
    });
  }

  // --- Demandas e propostas ----------------------------------------------
  for (const seedDemand of DEMANDS) {
    const buyerId = userIds.get(seedDemand.buyer);
    if (!buyerId) continue;

    const existing = await prisma.demand.findFirst({
      where: { title: seedDemand.title, buyerId },
      select: { id: true },
    });

    const demandId =
      existing?.id ??
      (
        await prisma.demand.create({
          data: {
            buyerId,
            title: seedDemand.title,
            problem: seedDemand.problem,
            goal: seedDemand.goal,
            tools: seedDemand.tools,
            budgetMinCents: seedDemand.budgetMinCents,
            budgetMaxCents: seedDemand.budgetMaxCents,
            deadlineDays: seedDemand.deadlineDays,
          },
          select: { id: true },
        })
      ).id;

    // Duas propostas na primeira demanda, para a tela ter o que mostrar.
    if (seedDemand.title.startsWith('Automatizar a conciliação')) {
      for (const [key, amount, days, pitch] of [
        [
          'carlos',
          1_180_000,
          40,
          'Já fiz conciliação bancária em duas operações com volume parecido. Começo mapeando as regras de casamento que vocês usam hoje na mão — é ali que mora a complexidade real, não no OFX.',
        ],
        [
          'mariana',
          950_000,
          35,
          'Proponho começar por duas contas em vez das quatro, validar a taxa de casamento automático por três semanas e só então expandir. Reduz o risco de descobrir tarde que uma regra estava errada.',
        ],
      ] as const) {
        const authorId = userIds.get(key);
        if (!authorId) continue;

        const profile = await prisma.professionalProfile.findUnique({
          where: { userId: authorId },
          select: { id: true },
        });
        if (!profile) continue;

        await prisma.proposal.upsert({
          where: { demandId_authorId: { demandId, authorId } },
          create: {
            demandId,
            authorId,
            profileId: profile.id,
            amountCents: amount,
            deliveryDays: days,
            pitch,
            scope:
              'Levantamento das regras atuais, desenvolvimento do fluxo, homologação com dados reais de um mês, treinamento do time e duas semanas de acompanhamento pós-entrega.',
          },
          update: {},
        });
      }

      await prisma.demand.update({
        where: { id: demandId },
        data: { proposalCount: await prisma.proposal.count({ where: { demandId } }) },
      });
    }
  }

  const counts = {
    categorias: await prisma.productCategory.count(),
    usuários: await prisma.user.count(),
    produtos: await prisma.product.count(),
    profissionais: await prisma.professionalProfile.count(),
    demandas: await prisma.demand.count(),
    propostas: await prisma.proposal.count(),
    avaliações: await prisma.review.count(),
    pedidos: await prisma.order.count(),
  };

  console.log('Pronto:', counts);
  console.log('\nContas de desenvolvimento (senha: automatize-dev-2026)');
  for (const user of USERS) {
    console.log(`  · ${user.email.padEnd(32)} ${user.roles.join(', ')}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
