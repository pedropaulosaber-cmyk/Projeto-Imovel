import type { Parque } from './tipos';

/**
 * As duas páginas de parque do design. Existem porque a requalificação é o
 * argumento de venda dos setores — e porque cada uma é uma porta de entrada
 * orgânica própria ("parque serrinha goiânia obras").
 */
export const parques: Parque[] = [
  {
    /*
      Números conferidos contra a cobertura da assinatura da ordem de serviço,
      em 2 de julho de 2026. O que estava aqui antes veio do design e era
      ficção — 96 hectares, R$ 74 milhões, entrega em 2028 e a Prefeitura como
      responsável. Nada disso é verdade: a obra é do Governo de Goiás, o morro
      tem 108 mil m² e o prazo é de 12 meses a partir de julho de 2026.
    */
    slug: 'parque-serrinha',
    nome: 'Parque da Serrinha',
    selo: 'Obra iniciada em julho de 2026',
    chamadaCurta: 'Requalificação em andamento',
    titulo: 'O Morro da Serrinha vira parque urbano.',
    resumoHome:
      'O Governo de Goiás assinou em julho de 2026 a ordem de serviço do Parque da Serrinha Jornalista Jaime Câmara: R$ 14,5 milhões e 12 meses de obra para transformar os 108 mil m² do morro em parque urbano, com mirante no ponto mais alto da cidade. Vários dos nossos empreendimentos ficam a uma caminhada dali.',
    resumoPagina:
      'O Morro da Serrinha tem 108 mil m² e 819 metros de altitude — um dos pontos mais altos de Goiânia. Em 2 de julho de 2026 o Governo de Goiás assinou a ordem de serviço da requalificação, orçada em R$ 14,5 milhões e com prazo de 12 meses, que entrega mirante, trilhas, pista de caminhada, iluminação e áreas de alimentação, além do replantio de 5 mil mudas nativas do Cerrado.',
    resumoPaginaMobile:
      '108 mil m² e 819 m de altitude viram parque urbano: R$ 14,5 milhões e 12 meses de obra, com mirante no ponto mais alto da cidade.',
    imagem: '/imagens/parque-serrinha.jpg',
    imagemAlt: 'Vista aérea do Morro da Serrinha, em Goiânia',
    numeros: [
      { valor: '108 mil m²', label: 'Área do Morro da Serrinha', labelMobile: 'Área do morro' },
      { valor: 'R$ 14,5 mi', label: 'Investimento contratado', labelMobile: 'Investimento' },
      { valor: '12 meses', label: 'Prazo de obra', labelMobile: 'Prazo de obra' },
      { valor: '819 m', label: 'Altitude do mirante', labelMobile: 'Altitude' },
    ],
    etapas: [
      {
        n: '01',
        titulo: 'Mirante no alto do morro',
        texto:
          'A 819 metros de altitude, num dos pontos mais altos de Goiânia, com vista aberta para a cidade.',
      },
      {
        n: '02',
        titulo: 'Trilhas e pista de caminhada',
        texto:
          'Percursos pelo morro com iluminação e acessibilidade, ligando os acessos do parque ao mirante.',
      },
      {
        n: '03',
        titulo: '5 mil mudas nativas do Cerrado',
        texto:
          'Replantio para recompor a vegetação do morro, com manutenção e monitoramento contratados até 2030.',
      },
      {
        n: '04',
        titulo: 'Iluminação e áreas de alimentação',
        texto:
          'Infraestrutura urbana, segurança e espaços de convivência distribuídos pelo parque.',
      },
    ],
    impacto: {
      titulo: 'O que a obra muda para quem mora ao redor',
      paragrafos: [
        'O Morro da Serrinha é hoje uma área verde fechada no meio de um setor que verticalizou. A requalificação abre 108 mil m² para uso público, com mirante, trilhas e iluminação — o tipo de equipamento que muda a rotina de quem mora a uma caminhada dali.',
        'A obra é do Governo de Goiás, com ordem de serviço assinada pelo governador Daniel Vilela em 2 de julho de 2026 e prazo contratual de 12 meses. O parque leva o nome de Jaime Câmara, fundador de um dos maiores grupos de comunicação do estado e ex-prefeito de Goiânia.',
        'Sobre valorização, o site não publica projeção: quem vende número de valorização futura está chutando. O que dá para afirmar é o que está contratado — obra assinada, valor, prazo e escopo.',
      ],
      linhas: [
        { rotulo: 'Investimento contratado', valor: 'R$ 14.486.782,30' },
        { rotulo: 'Ordem de serviço', valor: '2 de julho de 2026' },
        { rotulo: 'Prazo de obra', valor: '12 meses' },
        { rotulo: 'Responsável', valor: 'Governo de Goiás' },
      ],
    },
    eyebrowProximos: 'A CAMINHADA DO PARQUE',
    tituloProximos: 'Empreendimentos no entorno',
  },
  {
    slug: 'parque-cascavel',
    nome: 'Parque Cascavel',
    selo: 'Nova orla em execução',
    chamadaCurta: 'Nova orla em execução',
    titulo: 'Parque Cascavel: o lago ganha uma orla inteira.',
    resumoHome:
      "Deque contínuo, ciclovia de 4,5 km, dragagem do espelho d'água e anfiteatro ao ar livre. É o endereço mais disputado do Jardim Atlântico e do Pedro Ludovico — e o projeto reorganiza toda a borda do lago.",
    resumoPagina:
      "Deque contínuo, ciclovia de 4,5 km, dragagem do espelho d'água e anfiteatro ao ar livre. O parque é o endereço mais valorizado do entorno do Jardim Atlântico e do Pedro Ludovico, e o projeto reorganiza toda a borda do lago.",
    resumoPaginaMobile:
      "Deque contínuo, ciclovia de 4,5 km, dragagem do espelho d'água e anfiteatro ao ar livre até 2027.",
    imagem: '/imagens/parque-cascavel.jpg',
    imagemAlt: 'Lago do Parque Cascavel cercado por edifícios',
    numeros: [
      { valor: '4,5 km', label: 'Ciclovia contínua', labelMobile: 'Ciclovia contínua' },
      { valor: 'R$ 52 mi', label: 'Investimento previsto', labelMobile: 'Investimento' },
      { valor: '2027', label: 'Entrega da orla', labelMobile: 'Entrega da orla' },
      { valor: '300 m', label: 'Distância a pé mais curta', labelMobile: 'Distância mais curta' },
    ],
    etapas: [
      {
        n: '01',
        titulo: 'Nova orla do lago',
        texto:
          "Deque de madeira, mirantes e barreira de contenção refeita em todo o espelho d'água.",
      },
      {
        n: '02',
        titulo: 'Ciclovia de 4,5 km',
        texto:
          'Circuito conectado à malha ciclável da avenida, com bicicletário e ponto de reparo.',
      },
      {
        n: '03',
        titulo: 'Despoluição e paisagismo',
        texto: 'Dragagem do lago, novo sistema de drenagem e 1.200 mudas plantadas nas margens.',
      },
      {
        n: '04',
        titulo: 'Anfiteatro ao ar livre',
        texto: 'Espaço para 800 pessoas com programação cultural aos domingos a partir de 2027.',
      },
    ],
    impacto: {
      titulo: 'Morar de frente para o lago',
      paragrafos: [
        'As torres da borda leste já respondem pelos metros quadrados mais caros da região. Com a nova orla, o trecho oeste — hoje com terrenos e obras em andamento — passa a ter o mesmo acesso ao parque.',
        'Para quem compra na planta, é a diferença entre pagar tabela de lançamento e comprar depois da entrega do projeto.',
      ],
      linhas: [
        { rotulo: 'Distância a pé mais curta', valor: '300 m' },
        { rotulo: 'Valorização média projetada', valor: '15% a.a.' },
        { rotulo: 'Início das obras', valor: 'Agosto / 2025' },
        { rotulo: 'Responsável', valor: 'Prefeitura de Goiânia' },
      ],
    },
    eyebrowProximos: 'NO ENTORNO DO LAGO',
    tituloProximos: 'Empreendimentos próximos',
  },
];

export function parquePorSlug(slug: string): Parque | undefined {
  return parques.find((p) => p.slug === slug);
}
