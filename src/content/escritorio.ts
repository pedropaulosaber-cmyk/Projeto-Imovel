import { site } from '@/config/site';

/** Conteúdo institucional: números, processo e equipe. */

export const numeros = [
  { valor: '+500', label: 'Famílias atendidas' },
  { valor: '18', label: 'Anos em Goiânia' },
  { valor: 'R$ 1,2 bi', label: 'VGV comercializado' },
  { valor: '11 min', label: 'Resposta média' },
];

export const processo = [
  {
    n: '01',
    titulo: 'Diagnóstico',
    texto: 'Uso, prazo de entrega desejado e faixa de investimento antes de qualquer planta.',
  },
  {
    n: '02',
    titulo: 'Curadoria',
    texto: 'Três a cinco empreendimentos que realmente atendem ao briefing.',
  },
  {
    n: '03',
    titulo: 'Visitas guiadas',
    texto: 'Roteiro de decorados e obras em um único dia, com o corretor da região.',
  },
  {
    n: '04',
    titulo: 'Fechamento',
    texto: 'Conferência de documentação, negociação de tabela e acompanhamento até a assinatura.',
  },
];

/**
 * O design trazia quatro corretores com CRECI inventado. Número de CRECI que
 * não existe é infração à Resolução COFECI 1.065/2007 mesmo em página de
 * equipe, então a lista tem só quem é real. Cresceu o time, cresce a lista.
 */
export const equipe = [
  { nome: site.responsavelTecnico, creci: site.creci, regiao: 'Todas as regiões' },
];

export const comoTrabalhamos = {
  destaque:
    'Não somos um portal de anúncios. Representamos um número limitado de empreendimentos por vez, e conhecemos cada um por dentro.',
  destaqueMobile:
    'Não somos um portal de anúncios. Representamos um número limitado de empreendimentos por vez.',
  paragrafos: [
    'Antes de entrar no catálogo, um empreendimento passa por conferência de registro de incorporação, memorial descritivo, cronograma físico-financeiro e histórico da incorporadora. Onde o número de registro ainda não foi localizado, a página do imóvel diz isso em voz alta — não some com a informação.',
    'O atendimento é feito pelo corretor da região, do primeiro contato à assinatura. Sem transferência de plantão.',
  ],
};

/** Painel do corretor — dados de exemplo até o Método CRM ser plugado. */
export const painel = {
  kpis: [
    { label: 'NOVOS', valor: '14' },
    { label: 'EM CONTATO', valor: '9' },
    { label: 'QUALIFICADOS', valor: '5' },
    { label: 'VISITAS AGENDADAS', valor: '3' },
  ],
  leads: [
    {
      nome: 'Marina Queiroz',
      imovel: 'Alto Serrinha Residence',
      tipologia: '3 suítes 112 m²',
      quando: 'há 12 min',
      status: 'Novo',
    },
    {
      nome: 'Eduardo Prado',
      imovel: 'Ícone Pedro Ludovico',
      tipologia: '4 suítes 210 m²',
      quando: 'há 40 min',
      status: 'Novo',
    },
    {
      nome: 'Cláudia Nogueira',
      imovel: 'Jardins do Cerrado',
      tipologia: '2 quartos 75 m²',
      quando: 'há 2 h',
      status: 'Em contato',
    },
    {
      nome: 'Fernando Lima',
      imovel: 'Villa Pedro Ludovico Signature',
      tipologia: '4 suítes 240 m²',
      quando: 'ontem',
      status: 'Qualificado',
    },
    {
      nome: 'Patrícia Sales',
      imovel: 'Horizonte Atlântico',
      tipologia: '1 quarto 42 m²',
      quando: 'ontem',
      status: 'Em contato',
    },
    {
      nome: 'Ricardo Teles',
      imovel: 'Reserva Bela Vista',
      tipologia: '4 suítes 320 m²',
      quando: '2 dias',
      status: 'Qualificado',
    },
  ],
  grafico: [
    { label: 'S1', altura: 42 },
    { label: 'S2', altura: 58 },
    { label: 'S3', altura: 36 },
    { label: 'S4', altura: 74 },
    { label: 'S5', altura: 88 },
    { label: 'S6', altura: 62 },
    { label: 'S7', altura: 96 },
    { label: 'S8', altura: 70 },
  ],
  resumo: [
    { rotulo: 'Taxa de resposta', valor: '92%' },
    { rotulo: 'Tempo médio 1º contato', valor: '11 min' },
    { rotulo: 'Origem principal', valor: 'Meta Ads' },
  ],
};
