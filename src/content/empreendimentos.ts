import type { CategoriaEmpreendimento, Empreendimento } from './tipos';

/**
 * Catálogo de empreendimentos.
 *
 * Hoje é um módulo tipado; a intenção é que vire consulta ao Supabase sem
 * mexer nas páginas — por isso todo acesso passa pelas funções no fim do
 * arquivo, e nenhuma página importa `catalogo` direto.
 *
 * Os empreendimentos aqui são reais, extraídos dos books das incorporadoras.
 * Cada número de registro de incorporação foi conferido contra o documento
 * original antes de entrar — e a invariante no fim do arquivo recusa publicar
 * qualquer um que não tenha.
 *
 * Preço entra como `null` até a tabela chegar da incorporadora: a tela mostra
 * "Sob consulta", que é o que o corretor responderia de qualquer forma.
 */

const catalogo: Empreendimento[] = [
  {
    slug: 'opus-ybate',
    nome: 'Opus Ybaté',
    categoria: 'na_planta',
    regiaoSlug: 'setor-serrinha',
    incorporadora: 'Opus Incorporadora (Incorporação Opus 60 SPE Ltda)',
    statusParceria: 'pendente',
    corretorResponsavel: null,
    numeroRegistroIncorporacao:
      'R-4 na matrícula nº 350.780 do Cartório de Registro de Imóveis da 1ª Circunscrição de Goiânia — GO',
    statusPublicacao: 'publicado',
    precoAPartirDe: null,
    quartos: '3–4 suítes',
    banheiros: null,
    metragem: '171–420 m²',
    metragemMin: 170.96,
    metragemMax: 419.52,
    entrega: 'Entrega a confirmar',
    previsaoEntrega: null,
    resumo:
      'Torre única de 35 pavimentos ao lado do futuro Parque Serrinha, com plantas de 3 e 4 suítes e sete pavimentos de penthouses com piscina e sauna privativas.',
    descricao: [
      'O Opus Ybaté é uma torre residencial de alto padrão da Opus Incorporadora, erguida na esquina das ruas Samuel Morse e Tomaz Edson, quadra 171, lote 05, no Setor Serrinha, em Goiânia. São 110 unidades distribuídas em 35 pavimentos — dois subsolos, térreo, um pavimento inteiro dedicado ao lazer, 24 pavimentos tipo e sete pavimentos de penthouses — sobre um terreno de 2.706 m², com 317 vagas de garagem. O prédio integra o masterplan da Reserva Ybiti, o conjunto de torres que a incorporadora vem verticalizando na região, e a assinatura técnica reúne Bretones e Carvalho na arquitetura, Benedito Abbud no paisagismo e Leo Romano nos interiores.',
      'As plantas dos pavimentos tipo, do 2º ao 25º andar, se dividem em quatro finais: dois apartamentos de 3 suítes com 171,43 m² e 170,96 m² e dois de 4 suítes com 207,63 m² e 207,84 m², todos com suíte master com closet, lavabo, cozinha integrada, varanda gourmet e área de serviço — as plantas maiores acrescentam um estar íntimo. Do 26º ao 32º pavimento ficam as penthouses, com 4 suítes e áreas privativas de 297,95 m² a 419,52 m², todas com piscina e sauna privativas; as do 26º andar ainda ganham terraço frontal ampliado com área descoberta. Cada unidade tem acesso por elevador privativo, esquadrias amplas, pontos de ar-condicionado em todas as suítes e na sala e ponto de gás na varanda gourmet.',
      'O lazer ocupa por inteiro o 1º pavimento, com guarda-corpo de vidro voltado para a Reserva Ybiti. A área conta com piscina adulto de raia de 25 m, deck molhado, piscina infantil, solário com bangalôs e cortina d\'água, salão de festas com terraço e churrasqueira, varanda de jogos, academia com terraço, spa com sauna, quadra recreativa, playground com piso emborrachado, brinquedoteca e mercadinho. A operação do prédio é apoiada por aplicativo de gerenciamento e segurança, controle de acesso nos elevadores e infraestrutura seca para recarga de veículo elétrico em uma vaga por unidade, contratável na personalização.',
      'A localização é uma das mais consolidadas de Goiânia: 150 m da Av. 85, de frente para a Av. T-4 e para a Jaime Câmara, entre o Parque Vaca Brava, o Parque Areião e o futuro Parque da Serrinha. Num raio de 2 km estão o Buena Vista Shopping, o Goiânia Shopping, o Buriti Shopping e o Flamboyant, além de Hospital Premium, Hospital Amparo, supermercados Oba e Pão de Açúcar, academias Smart Fit e Blue Fit e escolas como Colégio Visão, Colégio Ávila e a UniRV. É um endereço em que boa parte do dia a dia se resolve a pé.',
    ],
    /*
      O book do Ybaté se contradiz: a página de lazer anuncia salão de festas de
      135 m² e academia de 160 m², e a ficha técnica da p. 93 diz 120 m² e
      150 m². Como não dá para saber qual prevalece, nenhuma das duas vai ao ar
      — número errado em peça publicitária de imóvel é problema do corretor que
      assina, não da incorporadora que imprimiu.
    */
    amenidades: [
      'Piscina adulto com raia de 25 m',
      'Deck molhado e piscina infantil',
      'Deck da piscina / solário com dois bangalôs e cortina d\'água',
      'Salão de festas com área fechada e terraço externo com jardim (60 lugares sentados)',
      'Área de churrasqueira',
      'Varanda de jogos com mesa de ping-pong e pebolim',
      'Academia com ergometria, musculação e terraço',
      'Spa com sauna',
      'Quadra recreativa',
      'Playground com piso emborrachado',
      'Brinquedoteca integrada ao playground',
      'Mercadinho',
      'Estar externo',
      'Hall de entrada com mobiliário assinado por Leo Romano',
      'Portaria com hall externo e administração',
      'Bicicletário',
      'Vagas para visitantes',
      'WC masculino, feminino e PCD no pavimento de lazer',
      'Elevadores privativos de alta velocidade com controle de acesso e elevador de serviço',
      'Aplicativo de gerenciamento e segurança (liberações, câmeras, botão de pânico, agenda, documentos)',
      '317 vagas de garagem em dois subsolos',
    ],
    plantas: [
      { area: '171,43 m²', tipo: '3 suítes', vagas: 'consultar' },
      { area: '170,96 m²', tipo: '3 suítes', vagas: 'consultar' },
      { area: '207,63 m²', tipo: '4 suítes', vagas: 'consultar' },
      { area: '207,84 m²', tipo: '4 suítes', vagas: 'consultar' },
      { area: '346,82 m²', tipo: 'Penthouse — 4 suítes', vagas: 'consultar' },
      { area: '419,52 m²', tipo: 'Penthouse — 4 suítes', vagas: 'consultar' },
      { area: '297,95 m²', tipo: 'Penthouse — 4 suítes', vagas: 'consultar' },
      { area: '323,60 m²', tipo: 'Penthouse — 4 suítes', vagas: 'consultar' },
    ],
    ficha: [
      { label: 'METRAGENS', valor: '171–420 m²' },
      { label: 'TIPOLOGIAS', valor: '3–4 suítes' },
      { label: 'ENTREGA', valor: 'A confirmar' },
    ],
    midias: [
      { tipo: 'foto', url: '/imagens/opus-ybate/01-fachada.jpg', legenda: 'Fachada', alt: 'Perspectiva da fachada vista da rua ao entardecer, com embasamento envidraçado, brises verticais de madeira e paisagismo de palmeiras na calçada' },
      { tipo: 'foto', url: '/imagens/opus-ybate/02-piscina.jpg', legenda: 'Piscina', alt: 'Piscina de borda curva vista de cima, com espreguiçadeiras, ombrelones e palmeiras, e as varandas dos primeiros pavimentos ao fundo' },
      { tipo: 'foto', url: '/imagens/opus-ybate/03-piscina-de-raia.jpg', legenda: 'Piscina de raia', alt: 'Piscina alongada em deck elevado, com guarda-corpo de vidro, espreguiçadeiras e o horizonte da cidade ao fim da tarde' },
      { tipo: 'foto', url: '/imagens/opus-ybate/04-hall-de-entrada.jpg', legenda: 'Hall de entrada', alt: 'Hall de entrada com sofás claros de madeira, mesa de centro baixa, piso de mármore e jardim vertical na parede lateral' },
      { tipo: 'foto', url: '/imagens/opus-ybate/05-salao-de-festas.jpg', legenda: 'Salão de festas', alt: 'Salão de festas com mesas redondas postas, copa de apoio com bancada alta e banquetas, e portas de vidro abrindo para um jardim de palmeiras' },
      { tipo: 'foto', url: '/imagens/opus-ybate/06-espaco-gourmet.jpg', legenda: 'Espaço gourmet', alt: 'Espaço gourmet coberto com mesa comprida de madeira para doze lugares, bancada com churrasqueira, televisão e cadeira suspensa de fibra' },
      { tipo: 'foto', url: '/imagens/opus-ybate/07-living-decorado.jpg', legenda: 'Living decorado', alt: 'Living integrado à cozinha em apartamento decorado, com mesa de jantar, luminárias pendentes e varanda envidraçada voltada para a cidade' },
      { tipo: 'foto', url: '/imagens/opus-ybate/08-varanda-com-piscina.jpg', legenda: 'Varanda com piscina', alt: 'Varanda gourmet do apartamento decorado, com mesa oval de madeira, piscina privativa revestida em pastilha verde e vista aberta para o horizonte' },
    ],
    obra: null,
    book: { arquivo: 'opus-ybate.pdf', paginas: 94 },
    localizacao: {
      endereco: 'Rua Samuel Morse e Tomaz Edson, Quadra 171, Lote 05',
      referencias: 'A 150 m da Avenida 85 e de frente para a Avenida T-4, ao lado do futuro Parque Serrinha. Buena Vista, Goiânia Shopping e Buriti a poucos minutos.',
    },
    parquesProximos: ['parque-serrinha'],
    destaqueHome: true,
  },
  {
    slug: 'opus-nido',
    nome: 'Opus Nido',
    categoria: 'na_planta',
    regiaoSlug: 'setor-serrinha',
    incorporadora: 'Opus Incorporadora',
    statusParceria: 'pendente',
    corretorResponsavel: null,
    numeroRegistroIncorporacao:
      'R-4 na matrícula nº 350.781 do Cartório de Registro de Imóveis da 1ª Circunscrição de Goiânia — GO',
    statusPublicacao: 'publicado',
    precoAPartirDe: null,
    quartos: '2–3 suítes',
    banheiros: null,
    metragem: '100–199 m²',
    metragemMin: 100,
    metragemMax: 199,
    entrega: 'Entrega a confirmar',
    previsaoEntrega: null,
    resumo:
      '178 unidades de 100 a 199 m² a 150 m da Avenida 85, com 2.100 m² de área de lazer e quatro penthouses de piscina privativa no último pavimento.',
    descricao: [
      'O Opus Nido é um edifício residencial da Opus Incorporadora erguido dentro da Reserva Ybiti, na Quadra 171, Lote 06, no encontro das ruas Samuel Morse e Tomaz Edson, no Setor Serrinha, em Goiânia. O terreno tem 2.706 m² e comporta uma torre única de 178 unidades, distribuídas entre o 2º e o 30º pavimento tipo, com seis apartamentos por andar, mais quatro penthouses no 31º. São 300 vagas de garagem em dois subsolos e cinco elevadores atendendo a torre.',
      'As plantas vão de 100 m² a 199 m². Os finais 3 e 4 entregam 100 m² com três suítes; o final 5 tem 127 m², o final 6 tem 130 m², o final 2 tem 135 m² e o final 1 chega a 139 m², todos também em três suítes. Os finais 1 e 4 têm ainda versão de duas suítes com living ampliado, para quem prefere trocar um dormitório por área social. No 31º pavimento ficam as quatro penthouses, de 187 m² e 199 m², com terraço descoberto e piscina privativa. Todas as unidades têm pé-direito de 2,70 m sem rebaixamento de teto e esquadrias amplas, o que muda bastante a sensação de espaço nas plantas menores.',
      'O lazer ocupa mais de 2.100 m² no primeiro pavimento, com guarda-corpo de vidro voltado para a Reserva Ybiti. Estão ali a piscina adulto de 25 metros com deck molhado, a piscina infantil com brinquedo aquático, solário com gazebo, academia de 162 m² com área de spinning, SPA e sauna, poolhouse com cozinha gourmet e piscina própria, salão de festas de 156 m² com tratamento acústico e capacidade para 70 pessoas sentadas, terraço gourmet, playground, brinquedoteca, quadra recreativa e varanda de jogos. A arquitetura é de Frederico Bretones, o paisagismo de Benedito Abbud e os interiores e decorados são de Leo Romano.',
      'A localização é um dos pontos fortes: o empreendimento fica a 150 metros da Avenida 85, de frente para a Avenida T-4, ao lado do futuro Parque Serrinha e a poucos minutos do Parque Vaca Brava. Num raio curto estão Buena Vista, Goiânia Shopping, Buriti e Flamboyant, além de hospitais, laboratórios, colégios, supermercados e rede bancária completa. O prédio conta ainda com infraestrutura de Wi-Fi na área de lazer e aplicativo de gerenciamento de portaria e segurança.',
    ],
    amenidades: [
      'Área de lazer com mais de 2.100 m², no 1º pavimento',
      'Piscina adulto de 25 metros com deck molhado',
      'Piscina infantil com brinquedo aquático',
      'Solário com gazebo',
      'Academia de 162 m² com ergometria, musculação e espaço de spinning',
      'SPA e sauna',
      'Poolhouse com churrasqueira, cozinha gourmet e piscina privativa',
      'Salão de festas de 156 m² para 70 pessoas sentadas, com tratamento acústico, lounge externo e espelho d\'água',
      'Terraço gourmet com churrasqueira',
      'Churrasqueira gourmet com ambiente de estar e balanço',
      'Playground',
      'Brinquedoteca integrada ao playground',
      'Quadra recreativa',
      'Varanda de jogos com ping-pong e pebolim',
      'Estar externo em varandas cobertas',
      'Hall social com mobiliário assinado por Leo Romano',
      'Portaria com hall externo e administração',
      'Vagas para visitantes',
      '300 vagas de garagem em dois subsolos',
      '5 elevadores de alto desempenho',
      'Infraestrutura de Wi-Fi de alta velocidade no pavimento de lazer',
      'Aplicativo de gerenciamento e segurança (liberações, câmeras, agenda, botão de pânico)',
    ],
    plantas: [
      { area: '139 m²', tipo: 'Final 1 — 3 suítes', vagas: 'consultar' },
      { area: '139 m²', tipo: '2 suítes', vagas: 'consultar' },
      { area: '135 m²', tipo: 'Final 2 — 3 suítes', vagas: 'consultar' },
      { area: '100 m²', tipo: 'Final 3 — 3 suítes', vagas: 'consultar' },
      { area: '100 m²', tipo: 'Final 4 — 3 suítes', vagas: 'consultar' },
      { area: '100 m²', tipo: '2 suítes', vagas: 'consultar' },
      { area: '127 m²', tipo: 'Final 5 — 3 suítes', vagas: 'consultar' },
      { area: '130 m²', tipo: 'Final 6 — 3 suítes', vagas: 'consultar' },
      { area: '199 m²', tipo: 'Penthouse — consultar', vagas: 'consultar' },
      { area: '199 m²', tipo: 'Penthouse — consultar', vagas: 'consultar' },
      { area: '187 m²', tipo: 'Penthouse — consultar', vagas: 'consultar' },
      { area: '187 m²', tipo: 'Penthouse — consultar', vagas: 'consultar' },
    ],
    ficha: [
      { label: 'METRAGENS', valor: '100–199 m²' },
      { label: 'TIPOLOGIAS', valor: '2–3 suítes' },
      { label: 'ENTREGA', valor: 'A confirmar' },
    ],
    midias: [
      { tipo: 'foto', url: '/imagens/opus-nido/01-fachada-e-acesso.jpg', legenda: 'Fachada e acesso', alt: 'Acesso de veículos e portaria ao entardecer, com fachada de varandas curvas em branco e cinza, palmeiras e árvores floridas ao longo da calçada.' },
      { tipo: 'foto', url: '/imagens/opus-nido/02-piscina.jpg', legenda: 'Piscina', alt: 'Piscina de raia com água esverdeada, duas espreguiçadeiras dentro da lâmina d\'água, canteiros de folhagem e palmeiras junto à base da torre.' },
      { tipo: 'foto', url: '/imagens/opus-nido/03-hall-de-entrada.jpg', legenda: 'Hall de entrada', alt: 'Hall de entrada com paredes de pedra cinza, forro ripado de madeira, sofás baixos de couro, nichos com plantas e bancada de recepção em madeira.' },
      { tipo: 'foto', url: '/imagens/opus-nido/04-academia.jpg', legenda: 'Academia', alt: 'Academia com estação de musculação, esteiras, bicicleta ergométrica, forro preto vazado e janelas em fita voltadas para o jardim.' },
      { tipo: 'foto', url: '/imagens/opus-nido/05-spa.jpg', legenda: 'Spa', alt: 'Sala de relaxamento com duas macas de madeira e estofado claro, painel geométrico em preto e madeira e divisórias de vidro com esquadria preta.' },
      { tipo: 'foto', url: '/imagens/opus-nido/06-salao-de-festas.jpg', legenda: 'Salão de festas', alt: 'Salão de festas com mesas de madeira para grupos, cadeiras estofadas claras, bancada de apoio em pedra escura e forro acústico perfurado.' },
      { tipo: 'foto', url: '/imagens/opus-nido/07-espaco-gourmet.jpg', legenda: 'Espaço gourmet', alt: 'Espaço gourmet coberto com churrasqueira, bancada com banquetas, mesa para dez lugares, sofá e cadeira suspensa voltada para o jardim.' },
      { tipo: 'foto', url: '/imagens/opus-nido/08-living-decorado.jpg', legenda: 'Living decorado', alt: 'Living do apartamento decorado integrado à sala de jantar e à varanda com churrasqueira, com vista aberta para a cidade ao fundo.' },
    ],
    obra: null,
    book: { arquivo: 'opus-nido.pdf', paginas: 99 },
    localizacao: {
      endereco: 'Rua Samuel Morse e Tomaz Edson, Quadra 171, Lote 06',
      referencias: 'A 150 m da Avenida 85, de frente para a Avenida T-4 e ao lado do futuro Parque Serrinha. Parque Vaca Brava e Jardim Botânico a poucos minutos.',
    },
    parquesProximos: ['parque-serrinha'],
    destaqueHome: true,
  },
  {
    slug: 'opus-tellure',
    nome: 'Opus Tellure',
    categoria: 'lancamento',
    regiaoSlug: 'setor-serrinha',
    incorporadora: 'Opus Incorporadora',
    statusParceria: 'pendente',
    corretorResponsavel: null,
    numeroRegistroIncorporacao:
      'Matrícula nº 350.782 do Cartório de Registro de Imóveis da 1ª Circunscrição de Goiânia — GO',
    statusPublicacao: 'publicado',
    precoAPartirDe: null,
    quartos: '2–4 suítes',
    banheiros: null,
    metragem: '150–281 m²',
    metragemMin: 150,
    metragemMax: 281,
    entrega: 'Entrega a confirmar',
    previsaoEntrega: null,
    resumo:
      'Residências de 150 a 200 m² e coberturas de até 281 m² com piscina privativa, a 100 m do futuro Parque Serrinha.',
    descricao: [
      'O Opus Tellure é um condomínio residencial de alto padrão erguido dentro da Reserva Ybiti, o masterplan da Opus que verticaliza duas quadras inteiras na região do Alto do Bueno, em Goiânia. O terreno faz frente para a Rua Samuel Morse e se apoia na Rua Tomaz Edson e na Rua T-38, a cerca de 150 metros das avenidas 85 e T-4 — duas das vias que mais estruturam a mobilidade da cidade. Este book trata especificamente do lançamento da segunda torre do empreendimento; a primeira já estava com 80% das unidades vendidas quando a segunda foi colocada à venda.',
      'As residências vão de 150 a 200 m² nos pavimentos-tipo, com três opções de planta: 150 m² com três suítes e duas vagas, uma variação de 150 m² que troca uma suíte por living ampliado, e 200 m² com quatro suítes e três vagas. No topo, duas coberturas de 225 m² e 281 m² trazem piscina privativa, terraço descoberto e quatro vagas cada. Todas as plantas nascem com sala integrada à varanda e à cozinha, esquadrias amplas, infraestrutura de ar-condicionado nas suítes e na sala, ponto para churrasqueira a gás na varanda e suíte master com espaço para closet.',
      'A área de lazer ocupa o térreo e o pavimento intermediário e é generosa mesmo para o padrão da região: piscina adulto com raia de 25 metros e piscina infantil, ambas climatizadas com trocador de calor, pool house, academia de 168 m² com varanda fitness, espaço wellness com spa, sauna e sala de massoterapia, salão de festas de 115 m² climatizado com varanda integrada, espaço gourmet com praça, dois espaços barbecue, quadra recreativa, brinquedoteca ligada ao playground, coworking e uma varanda de jogos com sinuca, ping-pong, pebolim e teqball. O paisagismo é de Benedito Abbud, a arquitetura de Frederico Bretones e os interiores de Leo Romano.',
      'Na operação do condomínio, o projeto prevê quatro elevadores de alta velocidade (três privativos e um de serviço) com controle de acesso, monitoramento 24 horas por câmeras, guarita com vidro de segurança, pulmão de segurança na entrada de serviço, aplicativo de portaria, grupo gerador para áreas comuns e elevadores, vaga de uso comum para recarga de veículos elétricos e dois acessos de veículos independentes para diminuir o cruzamento de fluxo na garagem.',
    ],
    amenidades: [
      'Piscina adulto com raia de 25 m e deck molhado',
      'Piscina infantil com deck molhado',
      'Piscinas climatizadas com trocador de calor',
      'Pool house',
      'Academia com 168 m² integrada a varanda fitness',
      'Espaço Wellness com spa e sauna',
      'Wellness center com área de descanso e espaço para massoterapia',
      'Salão de festas com 115 m² de área fechada climatizada',
      'Varanda integrada ao salão de festas',
      'Espaço gourmet',
      'Praça integrada ao espaço gourmet',
      'Espaço barbecue com churrasqueira (dois ambientes)',
      'Varanda de jogos e convivência com sinuca, ping-pong, pebolim e teqball',
      'Coworking',
      'Brinquedoteca integrada ao playground externo',
      'Playground',
      'Quadra recreativa',
      'Ilhas de contemplação com espelho d\'água',
      'Hall de entrada com pé-direito duplo',
      'Hall de acesso ao lazer',
      'Parque linear externo Reserva Ybiti',
      'Praça de acesso com totens em LED',
      'Vagas para visitantes e PNE',
    ],
    plantas: [
      { area: '150 m²', tipo: '3 suítes', vagas: '2 vagas' },
      { area: '150 m²', tipo: '2 suítes', vagas: '2 vagas' },
      { area: '200 m²', tipo: '4 suítes', vagas: '3 vagas' },
      { area: '281 m²', tipo: 'Penthouse — 4 suítes', vagas: '4 vagas' },
      { area: '225 m²', tipo: 'Penthouse — 4 suítes', vagas: '4 vagas' },
    ],
    ficha: [
      { label: 'METRAGENS', valor: '150–281 m²' },
      { label: 'TIPOLOGIAS', valor: '2–4 suítes' },
      { label: 'ENTREGA', valor: 'A confirmar' },
    ],
    midias: [
      { tipo: 'foto', url: '/imagens/opus-tellure/01-fachada.jpg', legenda: 'Fachada', alt: 'Vista aérea em diagonal da torre residencial, com plantas nas varandas de todos os pavimentos e a piscina alongada e o bosque do térreo ao fundo' },
      { tipo: 'foto', url: '/imagens/opus-tellure/02-as-duas-torres.jpg', legenda: 'As duas torres', alt: 'Perspectiva das duas torres residenciais vistas da avenida, com vegetação nas varandas e arborização ao longo da calçada' },
      { tipo: 'foto', url: '/imagens/opus-tellure/03-varandas-de-esquina.jpg', legenda: 'Varandas de esquina', alt: 'Detalhe da fachada na esquina do prédio, com varandas envidraçadas de canto, brises verticais brancos e bairro arborizado ao fundo' },
      { tipo: 'foto', url: '/imagens/opus-tellure/04-piscina.jpg', legenda: 'Piscina', alt: 'Piscina externa com raia de 25 metros, espreguiçadeiras na borda e palmeiras, com a torre residencial ao fundo' },
      { tipo: 'foto', url: '/imagens/opus-tellure/05-acesso-social.jpg', legenda: 'Acesso social', alt: 'Entrada social do condomínio ao entardecer, entre palmeiras altas e canteiros de folhagens coloridas, com calçada ligando ao parque vizinho' },
      { tipo: 'foto', url: '/imagens/opus-tellure/06-hall-social.jpg', legenda: 'Hall social', alt: 'Hall social de pé-direito duplo, com escada revestida em pedra, painel de madeira com nichos iluminados e poltronas de couro claro' },
      { tipo: 'foto', url: '/imagens/opus-tellure/07-living-decorado.jpg', legenda: 'Living decorado', alt: 'Living do apartamento decorado integrado à varanda por portas de vidro, com mobiliário de madeira e palha e vista para a cidade' },
    ],
    obra: null,
    book: { arquivo: 'opus-tellure.pdf', paginas: 79 },
    localizacao: {
      endereco: 'Quadra delimitada pelas ruas Samuel Morse, Tomaz Edson e T-38',
      referencias: 'A cerca de 150 m das avenidas 85 e T-4 e a 100 m do futuro Parque Serrinha.',
    },
    parquesProximos: ['parque-serrinha'],
    destaqueHome: true,
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

/**
 * Como o preço aparece na tela. Sem tabela, "Sob consulta" — que é o que o
 * corretor responderia de qualquer forma.
 */
export function precoExibicao(e: Empreendimento): string {
  if (e.precoAPartirDe === null) return 'Sob consulta';
  return e.precoAPartirDe.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  });
}

export function totalPublicado(): number {
  return empreendimentosPublicados().length;
}
