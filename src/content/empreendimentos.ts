import type { CategoriaEmpreendimento, Empreendimento } from './tipos';

/**
 * Catálogo de empreendimentos.
 *
 * Hoje é um módulo tipado; a intenção é que vire consulta ao Supabase sem
 * mexer nas páginas — por isso todo acesso passa pelas funções no fim do
 * arquivo, e nenhuma página importa `catalogo` direto.
 *
 * Os dados abaixo vieram do design (Site_Modelo_4) e são de demonstração:
 * `site.conteudoDemonstracao` avisa isso no rodapé. Ao trocar por imóveis
 * reais, a invariante de registro de incorporação no fim do arquivo passa a
 * proteger de verdade.
 */

const CORRETORES = {
  rodrigo: {
    nome: 'Rodrigo Alves',
    creci: 'CRECI-GO 12.345-F',
    regiao: 'Setor Serrinha',
    crmId: null,
  },
  helena: {
    nome: 'Helena Braga',
    creci: 'CRECI-GO 12.902-F',
    regiao: 'Jardim Atlântico',
    crmId: null,
  },
  marcos: {
    nome: 'Marcos Vinícius',
    creci: 'CRECI-GO 13.114-F',
    regiao: 'Setor Pedro Ludovico',
    crmId: null,
  },
} as const;

const catalogo: Empreendimento[] = [
  {
    slug: 'alto-serrinha-residence',
    nome: 'Alto Serrinha Residence',
    categoria: 'lancamento',
    regiaoSlug: 'setor-serrinha',
    incorporadora: 'Construtora Cerrado Alto',
    statusParceria: 'ativa',
    corretorResponsavel: CORRETORES.rodrigo,
    numeroRegistroIncorporacao:
      'R-4 nº 148.392 — 1º Ofício de Registro de Imóveis de Goiânia',
    statusPublicacao: 'publicado',
    precoAPartirDe: 890_000,
    precoExibicao: 'R$ 890.000',
    quartos: '2–3 quartos',
    banheiros: '2 banheiros',
    metragem: '68–112 m²',
    metragemMin: 68,
    metragemMax: 112,
    entrega: 'Entrega 2029',
    previsaoEntrega: '2029-12-01',
    resumo:
      'Torre única de 28 pavimentos a 450 m do Parque Serrinha, com duas unidades por andar e varanda gourmet integrada.',
    descricao: [
      'Torre única de 28 pavimentos na quadra mais alta do Setor Serrinha, a três minutos do parque. Fachada em concreto aparente e caixilhos de piso a teto, com luz de tarde nos ambientes sociais.',
      'Duas unidades por andar, hall privativo e elevador social independente. Nas plantas de 112 m², integração total entre cozinha, living e varanda gourmet, com previsão para churrasqueira a carvão.',
      'Dois pavimentos de área comum entregues mobiliados e decorados, gerador para 100% das áreas comuns e sistema de reuso de água.',
    ],
    amenidades: [
      'Piscina aquecida 25 m',
      'Academia equipada',
      'Coworking',
      'Pet place',
      'Salão gourmet',
      'Espaço delivery',
      'Bicicletário',
      'Lounge na cobertura',
      'Gerador full',
    ],
    plantas: [
      { area: '68 m²', tipo: '2 quartos', vagas: '1 vaga' },
      { area: '94 m²', tipo: '3 quartos', vagas: '2 vagas' },
      { area: '112 m²', tipo: '3 suítes', vagas: '2 vagas + depósito' },
    ],
    ficha: [
      { label: 'A PARTIR DE', valor: 'R$ 890.000' },
      { label: 'METRAGENS', valor: '68–112 m²' },
      { label: 'TIPOLOGIAS', valor: '2–3 quartos' },
      { label: 'ENTREGA', valor: 'Dez / 2029' },
    ],
    midias: [
      { tipo: 'foto', url: '/imagens/escritorio-goiania.jpg', legenda: 'Fachada' },
      { tipo: 'foto', url: null, legenda: '[ living decorado ]' },
      { tipo: 'foto', url: null, legenda: '[ piscina ]' },
      { tipo: 'foto', url: null, legenda: '[ hall social ]' },
      { tipo: 'foto', url: null, legenda: '[ vista do 22º ]' },
    ],
    book: null,
    obra: { etapa: 'Fundação', percentual: 12 },
    localizacao: {
      endereco: 'Rua T-27, entre a Avenida T-9 e a Rua T-55',
      referencias:
        'A pé: parque (900 m), shopping (1,1 km), colégio (700 m). Avenida 85 em quatro minutos de carro.',
    },
    parquesProximos: ['parque-serrinha'],
    destaqueHome: true,
  },
  {
    slug: 'icone-pedro-ludovico',
    nome: 'Ícone Pedro Ludovico',
    categoria: 'lancamento',
    regiaoSlug: 'setor-pedro-ludovico',
    incorporadora: 'Incorporadora Vertical GO',
    statusParceria: 'ativa',
    corretorResponsavel: CORRETORES.marcos,
    numeroRegistroIncorporacao:
      'R-2 nº 151.877 — 2º Ofício de Registro de Imóveis de Goiânia',
    statusPublicacao: 'publicado',
    precoAPartirDe: 1_480_000,
    precoExibicao: 'R$ 1.480.000',
    quartos: '3–4 suítes',
    banheiros: '4 banheiros',
    metragem: '145–210 m²',
    metragemMin: 145,
    metragemMax: 210,
    entrega: 'Entrega 2030',
    previsaoEntrega: '2030-06-01',
    resumo:
      'Alto padrão com uma unidade por andar, hall privativo e rooftop com vista para o lago do Parque Cascavel.',
    descricao: [
      'Uma unidade por andar em toda a torre, com hall privativo e acesso por elevador de chamada exclusiva. A planta de 210 m² sai de fábrica com quatro suítes e living em três ambientes.',
      'O rooftop ocupa o último pavimento inteiro: piscina com borda infinita voltada para o lago do Parque Cascavel, deque coberto e cozinha de apoio.',
      'Infraestrutura completa para automação, medição individualizada de água e gás e vaga com ponto de carga elétrica em todas as unidades.',
    ],
    amenidades: [
      'Rooftop com piscina',
      'Spa e sauna',
      'Academia com personal',
      'Cinema',
      'Adega climatizada',
      'Salão de festas',
      'Brinquedoteca',
      'Vaga com carga elétrica',
      'Gerador full',
    ],
    plantas: [
      { area: '145 m²', tipo: '3 suítes', vagas: '2 vagas' },
      { area: '178 m²', tipo: '4 suítes', vagas: '3 vagas' },
      { area: '210 m²', tipo: '4 suítes + living ampliado', vagas: '3 vagas + depósito' },
    ],
    ficha: [
      { label: 'A PARTIR DE', valor: 'R$ 1.480.000' },
      { label: 'METRAGENS', valor: '145–210 m²' },
      { label: 'TIPOLOGIAS', valor: '3–4 suítes' },
      { label: 'ENTREGA', valor: 'Jun / 2030' },
    ],
    midias: [
      { tipo: 'foto', url: null, legenda: '[ fachada ]' },
      { tipo: 'foto', url: null, legenda: '[ rooftop ]' },
      { tipo: 'foto', url: null, legenda: '[ living decorado ]' },
      { tipo: 'foto', url: null, legenda: '[ hall privativo ]' },
    ],
    book: null,
    obra: { etapa: 'Terraplenagem', percentual: 5 },
    localizacao: {
      endereco: 'Avenida T-63, esquina com a Rua 1.130',
      referencias:
        'A pé: Parque Cascavel (1,4 km) e Praça do Sol (600 m). Acesso à Avenida 85 em três minutos.',
    },
    parquesProximos: ['parque-cascavel'],
    destaqueHome: true,
  },
  {
    slug: 'jardins-do-cerrado',
    nome: 'Jardins do Cerrado',
    categoria: 'na_planta',
    regiaoSlug: 'jardim-atlantico',
    incorporadora: 'Cerrado Urbanismo',
    statusParceria: 'ativa',
    corretorResponsavel: CORRETORES.helena,
    numeroRegistroIncorporacao:
      'R-6 nº 139.204 — 3º Ofício de Registro de Imóveis de Goiânia',
    statusPublicacao: 'publicado',
    precoAPartirDe: 650_000,
    precoExibicao: 'R$ 650.000',
    quartos: '2–4 quartos',
    banheiros: '2 banheiros',
    metragem: '75–140 m²',
    metragemMin: 75,
    metragemMax: 140,
    entrega: 'Entrega 2027',
    previsaoEntrega: '2027-09-01',
    resumo:
      'Obra em ritmo adiantado a três quadras da nova ciclovia, com parcelamento direto com a incorporadora.',
    descricao: [
      'Duas torres de 18 pavimentos com obra em ritmo adiantado — estrutura concluída até o 12º andar no último boletim. A três quadras do traçado da nova ciclovia do Parque Cascavel.',
      'As plantas de 140 m² aceitam a quarta suíte sem sacrificar a varanda; as de 75 m² saem com living integrado e cozinha americana de série.',
      'Parcelamento direto com a incorporadora até as chaves, sem intermediação bancária durante a obra.',
    ],
    amenidades: [
      'Piscina adulto e infantil',
      'Quadra poliesportiva',
      'Academia',
      'Salão de festas',
      'Espaço gourmet',
      'Playground',
      'Bicicletário',
      'Pet place',
    ],
    plantas: [
      { area: '75 m²', tipo: '2 quartos', vagas: '1 vaga' },
      { area: '104 m²', tipo: '3 quartos', vagas: '2 vagas' },
      { area: '140 m²', tipo: '4 quartos', vagas: '2 vagas' },
    ],
    ficha: [
      { label: 'A PARTIR DE', valor: 'R$ 650.000' },
      { label: 'METRAGENS', valor: '75–140 m²' },
      { label: 'TIPOLOGIAS', valor: '2–4 quartos' },
      { label: 'ENTREGA', valor: 'Set / 2027' },
    ],
    midias: [
      { tipo: 'foto', url: null, legenda: '[ fachada ]' },
      { tipo: 'foto', url: null, legenda: '[ obra — 12º andar ]' },
      { tipo: 'foto', url: null, legenda: '[ decorado 104 m² ]' },
    ],
    book: null,
    obra: { etapa: 'Estrutura', percentual: 58 },
    localizacao: {
      endereco: 'Rua JA-11, Jardim Atlântico',
      referencias: 'A pé: nova ciclovia (400 m), escola municipal (550 m), feira coberta (900 m).',
    },
    parquesProximos: ['parque-cascavel'],
    destaqueHome: true,
  },
  {
    slug: 'horizonte-atlantico',
    nome: 'Horizonte Atlântico',
    categoria: 'na_planta',
    regiaoSlug: 'jardim-atlantico',
    incorporadora: 'Atlântico Empreendimentos',
    statusParceria: 'negociando',
    corretorResponsavel: null,
    numeroRegistroIncorporacao:
      'R-3 nº 142.660 — 3º Ofício de Registro de Imóveis de Goiânia',
    statusPublicacao: 'publicado',
    precoAPartirDe: 720_000,
    precoExibicao: 'R$ 720.000',
    quartos: '1–2 quartos',
    banheiros: '1 banheiro',
    metragem: '42–78 m²',
    metragemMin: 42,
    metragemMax: 78,
    entrega: 'Entrega 2028',
    previsaoEntrega: '2028-03-01',
    resumo:
      'Compactos bem resolvidos para investimento, a 300 m da futura orla do Parque Cascavel.',
    descricao: [
      'Compactos de 42 a 78 m² a 300 m do traçado da futura orla do Parque Cascavel — a menor distância a pé entre os empreendimentos que representamos.',
      'As plantas de 42 m² foram desenhadas para locação: cozinha em linha, área de serviço embutida e infraestrutura de ar-condicionado já entregue.',
      'Área comum enxuta e barata de manter: lavanderia compartilhada, coworking e um único elevador social por torre mantêm o condomínio baixo.',
    ],
    amenidades: [
      'Coworking',
      'Lavanderia compartilhada',
      'Academia',
      'Rooftop',
      'Bicicletário',
      'Portaria remota',
      'Delivery box',
    ],
    plantas: [
      { area: '42 m²', tipo: '1 quarto', vagas: '1 vaga' },
      { area: '58 m²', tipo: '2 quartos', vagas: '1 vaga' },
      { area: '78 m²', tipo: '2 quartos + varanda', vagas: '1 vaga' },
    ],
    ficha: [
      { label: 'A PARTIR DE', valor: 'R$ 720.000' },
      { label: 'METRAGENS', valor: '42–78 m²' },
      { label: 'TIPOLOGIAS', valor: '1–2 quartos' },
      { label: 'ENTREGA', valor: 'Mar / 2028' },
    ],
    midias: [
      { tipo: 'foto', url: null, legenda: '[ fachada ]' },
      { tipo: 'foto', url: null, legenda: '[ studio 42 m² ]' },
      { tipo: 'foto', url: null, legenda: '[ rooftop ]' },
    ],
    book: null,
    obra: { etapa: 'Fundação', percentual: 22 },
    localizacao: {
      endereco: 'Avenida Atlântica, quadra 14',
      referencias: 'A pé: futura orla do Parque Cascavel (300 m), terminal de ônibus (700 m).',
    },
    parquesProximos: ['parque-cascavel'],
    destaqueHome: true,
  },
  {
    slug: 'villa-pedro-ludovico-signature',
    nome: 'Villa Pedro Ludovico Signature',
    categoria: 'remanescente',
    regiaoSlug: 'setor-pedro-ludovico',
    incorporadora: 'Signature Construtora',
    statusParceria: 'ativa',
    corretorResponsavel: CORRETORES.marcos,
    numeroRegistroIncorporacao:
      'R-9 nº 121.045 — 2º Ofício de Registro de Imóveis de Goiânia',
    statusPublicacao: 'publicado',
    precoAPartirDe: 1_250_000,
    precoExibicao: 'R$ 1.250.000',
    quartos: '3–4 suítes',
    banheiros: '4 banheiros',
    metragem: '180–240 m²',
    metragemMin: 180,
    metragemMax: 240,
    entrega: 'Pronto para morar',
    previsaoEntrega: null,
    resumo:
      'Últimas unidades prontas para morar, com escritura imediata e área comum entregue decorada.',
    descricao: [
      'Últimas unidades de um prédio já habitado, com área comum entregue e decorada e condomínio rodando há dois anos — dá para conversar com quem já mora antes de decidir.',
      'As plantas remanescentes são as de 180 e 240 m², ambas com quatro suítes, living em dois ambientes e varanda com churrasqueira a carvão.',
      'Escritura imediata: financiamento bancário direto na assinatura, sem período de obra.',
    ],
    amenidades: [
      'Piscina aquecida',
      'Academia',
      'Salão de festas decorado',
      'Espaço gourmet',
      'Quadra de areia',
      'Sauna',
      'Playground',
      'Gerador full',
    ],
    plantas: [
      { area: '180 m²', tipo: '4 suítes', vagas: '3 vagas' },
      { area: '240 m²', tipo: '4 suítes + living ampliado', vagas: '4 vagas' },
    ],
    ficha: [
      { label: 'A PARTIR DE', valor: 'R$ 1.250.000' },
      { label: 'METRAGENS', valor: '180–240 m²' },
      { label: 'TIPOLOGIAS', valor: '3–4 suítes' },
      { label: 'ENTREGA', valor: 'Pronto' },
    ],
    midias: [
      { tipo: 'foto', url: null, legenda: '[ fachada ]' },
      { tipo: 'foto', url: null, legenda: '[ área comum decorada ]' },
      { tipo: 'foto', url: null, legenda: '[ unidade 240 m² ]' },
    ],
    book: null,
    obra: null,
    localizacao: {
      endereco: 'Rua 1.128, Setor Pedro Ludovico',
      referencias: 'A pé: praça (350 m), padaria e mercado (400 m). Avenida 85 em dois minutos.',
    },
    parquesProximos: ['parque-cascavel'],
    destaqueHome: false,
  },
  {
    slug: 'reserva-bela-vista',
    nome: 'Reserva Bela Vista',
    categoria: 'remanescente',
    regiaoSlug: 'setor-serrinha',
    incorporadora: 'Bela Vista Incorporações',
    statusParceria: 'ativa',
    corretorResponsavel: CORRETORES.rodrigo,
    numeroRegistroIncorporacao:
      'R-7 nº 118.930 — 1º Ofício de Registro de Imóveis de Goiânia',
    statusPublicacao: 'publicado',
    precoAPartirDe: 2_100_000,
    precoExibicao: 'R$ 2.100.000',
    quartos: '4 suítes',
    banheiros: '5 banheiros',
    metragem: '280–320 m²',
    metragemMin: 280,
    metragemMax: 320,
    entrega: 'Pronto para morar',
    previsaoEntrega: null,
    resumo:
      'Duas coberturas remanescentes de frente para a área verde do Parque Serrinha, prontas para morar.',
    descricao: [
      'Restam duas coberturas duplex, ambas com a face principal voltada para a área verde do Parque Serrinha — a vista não fecha, porque o lote da frente é do parque.',
      'Piscina privativa no pavimento superior, quatro suítes no inferior e escada interna em concreto aparente. Pé-direito duplo no living.',
      'Prontas para morar, com escritura imediata e área comum já em operação.',
    ],
    amenidades: [
      'Piscina privativa na cobertura',
      'Piscina coletiva aquecida',
      'Academia',
      'Sauna',
      'Salão gourmet',
      'Quadra de tênis',
      'Pet place',
      'Gerador full',
    ],
    plantas: [
      { area: '280 m²', tipo: 'Cobertura duplex — 4 suítes', vagas: '4 vagas' },
      { area: '320 m²', tipo: 'Cobertura duplex — 4 suítes + home', vagas: '4 vagas + depósito' },
    ],
    ficha: [
      { label: 'A PARTIR DE', valor: 'R$ 2.100.000' },
      { label: 'METRAGENS', valor: '280–320 m²' },
      { label: 'TIPOLOGIAS', valor: '4 suítes' },
      { label: 'ENTREGA', valor: 'Pronto' },
    ],
    midias: [
      { tipo: 'foto', url: null, legenda: '[ fachada ]' },
      { tipo: 'foto', url: null, legenda: '[ cobertura 320 m² ]' },
      { tipo: 'foto', url: null, legenda: '[ vista para o parque ]' },
    ],
    book: null,
    obra: null,
    localizacao: {
      endereco: 'Rua T-55, de frente para a área verde',
      referencias: 'A pé: Parque Serrinha (150 m), colégio (800 m), Avenida T-9 (600 m).',
    },
    parquesProximos: ['parque-serrinha'],
    destaqueHome: false,
  },

  /**
   * Rascunho proposital: a parceria com a incorporadora ainda não fechou e o
   * registro de incorporação não foi conferido. Serve de prova viva de que o
   * filtro de publicação funciona — este imóvel não pode aparecer em nenhuma
   * listagem, sitemap ou página.
   */
  {
    slug: 'residencial-bosque-t9',
    nome: 'Residencial Bosque T-9',
    categoria: 'lancamento',
    regiaoSlug: 'setor-pedro-ludovico',
    incorporadora: 'A definir',
    statusParceria: 'pendente',
    corretorResponsavel: null,
    numeroRegistroIncorporacao: null,
    statusPublicacao: 'rascunho',
    precoAPartirDe: 0,
    precoExibicao: 'Sob consulta',
    quartos: '—',
    banheiros: '—',
    metragem: '—',
    metragemMin: 0,
    metragemMax: 0,
    entrega: 'A definir',
    previsaoEntrega: null,
    resumo: 'Aguardando conferência do registro de incorporação.',
    descricao: [],
    amenidades: [],
    plantas: [],
    ficha: [],
    midias: [],
    book: null,
    obra: null,
    localizacao: { endereco: '—', referencias: '—' },
    parquesProximos: [],
    destaqueHome: false,
  },
];

/**
 * Lei 4.591/64, art. 32. A checagem roda na carga do módulo: em SSG isso
 * significa que o build quebra, e não que um imóvel sem registro vai ao ar.
 */
for (const e of catalogo) {
  if (e.statusPublicacao === 'publicado' && !e.numeroRegistroIncorporacao) {
    throw new Error(
      `Empreendimento "${e.slug}" está publicado sem número de registro de incorporação. ` +
        'Lei 4.591/64, art. 32: sem registro, não se anuncia.',
    );
  }
}

/** A única porta de saída dos dados. Rascunho e despublicado nunca passam. */
export function empreendimentosPublicados(): Empreendimento[] {
  return catalogo.filter((e) => e.statusPublicacao === 'publicado');
}

export function empreendimentoPorSlug(slug: string): Empreendimento | undefined {
  return empreendimentosPublicados().find((e) => e.slug === slug);
}

export function empreendimentosPorRegiaoECategoria(
  regiaoSlug: string,
  categoria: CategoriaEmpreendimento,
): Empreendimento[] {
  return empreendimentosPublicados().filter(
    (e) => e.regiaoSlug === regiaoSlug && e.categoria === categoria,
  );
}

export function empreendimentosPorParque(parqueSlug: string): Empreendimento[] {
  return empreendimentosPublicados().filter((e) => e.parquesProximos.includes(parqueSlug));
}

/** Os quatro cards de "Oportunidades da semana" na home. */
export function oportunidadesDaSemana(): Empreendimento[] {
  return empreendimentosPublicados()
    .filter((e) => e.destaqueHome)
    .slice(0, 4);
}

/** Mesma região primeiro; completa com a mesma categoria. */
export function empreendimentosSimilares(slug: string, limite = 4): Empreendimento[] {
  const alvo = empreendimentoPorSlug(slug);
  if (!alvo) return [];

  const outros = empreendimentosPublicados().filter((e) => e.slug !== slug);
  const mesmaRegiao = outros.filter((e) => e.regiaoSlug === alvo.regiaoSlug);
  const mesmaCategoria = outros.filter(
    (e) => e.regiaoSlug !== alvo.regiaoSlug && e.categoria === alvo.categoria,
  );
  const resto = outros.filter(
    (e) => e.regiaoSlug !== alvo.regiaoSlug && e.categoria !== alvo.categoria,
  );

  return [...mesmaRegiao, ...mesmaCategoria, ...resto].slice(0, limite);
}

/** Quantos imóveis publicados existem por categoria — usado nos contadores. */
export function contagemPorCategoria(categoria: CategoriaEmpreendimento): number {
  return empreendimentosPublicados().filter((e) => e.categoria === categoria).length;
}

export function totalPublicado(): number {
  return empreendimentosPublicados().length;
}
