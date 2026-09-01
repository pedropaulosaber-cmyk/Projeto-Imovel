import type { Parque } from './tipos';

/**
 * As duas páginas de parque do design. Existem porque a requalificação é o
 * argumento de venda dos setores — e porque cada uma é uma porta de entrada
 * orgânica própria ("parque serrinha goiânia obras").
 */
export const parques: Parque[] = [
  {
    slug: 'parque-serrinha',
    nome: 'Parque Serrinha',
    selo: 'Obras iniciadas em 2026',
    chamadaCurta: 'Revitalização em andamento',
    titulo: 'O Parque Serrinha vai mudar de escala.',
    resumoHome:
      'São 96 hectares em requalificação no coração do setor: pista de caminhada de 3,2 km, pólo esportivo, recuperação da nascente e nova praça de alimentação até 2028. Dois dos nossos empreendimentos ficam a uma caminhada dali.',
    resumoPagina:
      'São 96 hectares de área verde em requalificação no coração do Setor Serrinha, entre a torre de transmissão e a saída para a Avenida 85. O projeto entrega pista de caminhada, pólo esportivo, recuperação de nascente e nova praça de alimentação até 2028.',
    resumoPaginaMobile:
      '96 hectares de área verde em requalificação no coração do Setor Serrinha, com entrega da última etapa em 2028.',
    imagem: '/imagens/parque-serrinha.jpg',
    imagemAlt: 'Vista aérea do Parque Serrinha',
    numeros: [
      { valor: '96 ha', label: 'Área total do parque', labelMobile: 'Área total' },
      { valor: 'R$ 74 mi', label: 'Investimento previsto', labelMobile: 'Investimento' },
      { valor: '2028', label: 'Entrega da última etapa', labelMobile: 'Última etapa' },
      { valor: '450 m', label: 'Distância a pé mais curta', labelMobile: 'Distância mais curta' },
    ],
    etapas: [
      {
        n: '01',
        titulo: 'Pista de caminhada de 3,2 km',
        texto:
          'Piso drenante, iluminação em LED e marcos de quilômetro ao longo de todo o perímetro.',
      },
      {
        n: '02',
        titulo: 'Novo pólo esportivo',
        texto: 'Quadras de areia, skate park e academia ao ar livre na entrada da Rua T-27.',
      },
      {
        n: '03',
        titulo: 'Recuperação da nascente',
        texto: 'Replantio de espécies do cerrado e contenção de encostas na área de preservação.',
      },
      {
        n: '04',
        titulo: 'Praça de alimentação e banheiros',
        texto: 'Seis quiosques, fraldário e posto de apoio com atendimento nos fins de semana.',
      },
    ],
    impacto: {
      titulo: 'O que a obra muda para quem mora ao redor',
      paragrafos: [
        'Parques requalificados costumam puxar o valor do metro quadrado do entorno nos dois anos seguintes à entrega. No Setor Serrinha, os lançamentos já saem com a obra anunciada — quem compra agora entra antes dessa curva.',
        'Também muda o dia a dia: nova iluminação no perímetro, acesso pela Rua T-27 e transporte reforçado nos fins de semana.',
      ],
      linhas: [
        { rotulo: 'Distância a pé mais curta', valor: '450 m' },
        { rotulo: 'Valorização média projetada', valor: '12% a.a.' },
        { rotulo: 'Início das obras', valor: 'Março / 2026' },
        { rotulo: 'Responsável', valor: 'Prefeitura de Goiânia' },
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
