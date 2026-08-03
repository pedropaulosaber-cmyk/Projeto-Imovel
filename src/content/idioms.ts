/**
 * Expressões idiomáticas, explicadas em português.
 *
 * ## Por que este módulo existe
 *
 * É a lacuna mais visível do aprendizado de idioma por app. O aluno chega ao
 * B1 conhecendo todas as palavras de *"it's raining cats and dogs"* e mesmo
 * assim não entende a frase. Expressão idiomática é justamente onde a soma das
 * palavras **não** dá o significado — e é o que separa quem "estudou o idioma"
 * de quem entende um nativo falando solto.
 *
 * ## Como cada verbete é montado
 *
 * A estrutura é deliberada e sempre a mesma:
 *
 *  1. **`literal`** — a tradução palavra por palavra, propositalmente estranha.
 *     Ver "está chovendo gatos e cachorros" cria o contraste que fixa a
 *     memória. Esconder o literal desperdiça o melhor gancho mnemônico.
 *  2. **`meaning`** — o que a expressão de fato quer dizer, em português claro.
 *  3. **`equivalent`** — a expressão brasileira correspondente, quando existe.
 *     É `null` quando não há: inventar equivalência é pior que admitir a
 *     lacuna, porque o aluno passa a usar uma tradução que ninguém reconhece.
 *  4. **`origin`** — de onde veio. História curta ancora a expressão muito
 *     melhor do que repetição.
 *  5. **`register`** — dizer a expressão certa no contexto errado é pior que
 *     não dizer nada. Gíria em entrevista de emprego queima o falante.
 *  6. **`frequency`** — de 1 (rara, literária) a 5 (todo dia). Ordena o estudo
 *     por utilidade real, não por curiosidade.
 */

import type { CefrLevel, Idiom, LanguageCode } from '@/domain/types';
import { extraCountByLevel, extraIdioms } from './idioms-extra';

/**
 * [expressão, romanização|'', literal, significado, equivalente|'', origem|'',
 *  exemplo, tradução do exemplo, registro, nível, frequência]
 */
type IdiomEntry = [
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  Idiom['register'],
  CefrLevel,
  number,
];

const EN: IdiomEntry[] = [
  [
    'to be under the weather',
    '',
    'estar sob o tempo',
    'Estar se sentindo mal, adoentado.',
    'Estar caindo aos pedaços',
    'Vem da marinha: o marinheiro enjoado era mandado para baixo do convés, abrigado do tempo.',
    "I'm feeling a bit under the weather today.",
    'Estou meio adoentado hoje.',
    'neutral',
    'B1',
    5,
  ],
  [
    'to break the ice',
    '',
    'quebrar o gelo',
    'Iniciar uma conversa e desfazer o clima de constrangimento.',
    'Quebrar o gelo',
    'Navios quebra-gelo abriam caminho para o comércio; a expressão passou a significar abrir caminho social.',
    'He told a joke to break the ice.',
    'Ele contou uma piada para quebrar o gelo.',
    'neutral',
    'B1',
    5,
  ],
  [
    'to cost an arm and a leg',
    '',
    'custar um braço e uma perna',
    'Ser muito caro.',
    'Custar os olhos da cara',
    'Popularizada no pós-guerra nos EUA, associada ao preço altíssimo de retratos de corpo inteiro.',
    'That car cost an arm and a leg.',
    'Aquele carro custou os olhos da cara.',
    'informal',
    'B1',
    4,
  ],
  [
    'to hit the nail on the head',
    '',
    'acertar o prego na cabeça',
    'Dizer exatamente a coisa certa; acertar em cheio.',
    'Acertar na mosca',
    'Da carpintaria: acertar a cabeça do prego no primeiro golpe.',
    'You hit the nail on the head with that comment.',
    'Você acertou na mosca com esse comentário.',
    'neutral',
    'B2',
    4,
  ],
  [
    'to let the cat out of the bag',
    '',
    'deixar o gato sair do saco',
    'Revelar um segredo sem querer.',
    'Dar com a língua nos dentes',
    'De feiras medievais, onde vendiam gato no saco no lugar de leitão; abrir o saco revelava a fraude.',
    "Don't let the cat out of the bag about the party.",
    'Não conte da festa para ninguém.',
    'informal',
    'B2',
    4,
  ],
  [
    'to be a piece of cake',
    '',
    'ser um pedaço de bolo',
    'Ser muito fácil.',
    'Ser moleza / mamão com açúcar',
    'De competições de dança nos EUA do século XIX, em que o prêmio era um bolo.',
    'The exam was a piece of cake.',
    'A prova foi moleza.',
    'informal',
    'A2',
    5,
  ],
  [
    'to bite off more than you can chew',
    '',
    'morder mais do que consegue mastigar',
    'Assumir mais compromissos do que se dá conta.',
    'Dar um passo maior que a perna',
    'Imagem direta de encher a boca além da conta.',
    'I bit off more than I could chew with three projects.',
    'Dei um passo maior que a perna com três projetos.',
    'neutral',
    'B2',
    3,
  ],
  [
    'to call it a day',
    '',
    'chamar isso de um dia',
    'Encerrar o trabalho por hoje.',
    'Dar o dia por encerrado',
    'Do vocabulário operário do século XIX, ao fim do turno.',
    "It's late, let's call it a day.",
    'Está tarde, vamos parar por hoje.',
    'informal',
    'B1',
    4,
  ],
];

const ES: IdiomEntry[] = [
  [
    'estar en las nubes',
    '',
    'estar nas nuvens',
    'Estar distraído, no mundo da lua.',
    'Estar no mundo da lua',
    'Imagem de quem tem a cabeça longe do chão.',
    'Siempre está en las nubes durante la clase.',
    'Ele vive no mundo da lua durante a aula.',
    'neutral',
    'A2',
    5,
  ],
  [
    'ser pan comido',
    '',
    'ser pão comido',
    'Ser facílimo.',
    'Ser moleza',
    'Comer pão é o ato mais simples que existe.',
    'El examen fue pan comido.',
    'A prova foi moleza.',
    'informal',
    'A2',
    5,
  ],
  [
    'tomar el pelo',
    '',
    'pegar o cabelo',
    'Enganar alguém de brincadeira; zoar.',
    'Tirar sarro / pegar no pé',
    'Possivelmente de barbeiros que cobravam por um corte que não davam.',
    '¿Me estás tomando el pelo?',
    'Você está tirando sarro de mim?',
    'informal',
    'B1',
    5,
  ],
  [
    'costar un ojo de la cara',
    '',
    'custar um olho da cara',
    'Ser caríssimo.',
    'Custar os olhos da cara',
    'Atribuída ao conquistador Diego de Almagro, que perdeu um olho em batalha.',
    'Ese coche cuesta un ojo de la cara.',
    'Aquele carro custa os olhos da cara.',
    'informal',
    'B1',
    4,
  ],
  [
    'no tener pelos en la lengua',
    '',
    'não ter pelos na língua',
    'Falar sem rodeios, dizer o que pensa.',
    'Não ter papas na língua',
    'Pelo na língua atrapalharia a fala — quem não tem, fala solto.',
    'Ella no tiene pelos en la lengua.',
    'Ela não tem papas na língua.',
    'informal',
    'B2',
    4,
  ],
  [
    'echar una mano',
    '',
    'jogar uma mão',
    'Ajudar alguém.',
    'Dar uma mão',
    'Gesto físico de estender a mão.',
    '¿Me echas una mano con esto?',
    'Você me dá uma mão com isso?',
    'informal',
    'A2',
    5,
  ],
  [
    'estar como una cabra',
    '',
    'estar como uma cabra',
    'Estar meio maluco (de forma carinhosa).',
    'Ser doido de pedra',
    'Cabras têm fama de comportamento errático.',
    'Mi hermano está como una cabra.',
    'Meu irmão é doido de pedra.',
    'informal',
    'B2',
    3,
  ],
  [
    'dar en el clavo',
    '',
    'dar no prego',
    'Acertar exatamente.',
    'Acertar na mosca',
    'Mesma imagem de carpintaria do inglês.',
    'Diste en el clavo con esa idea.',
    'Você acertou na mosca com essa ideia.',
    'neutral',
    'B2',
    4,
  ],
];

const FR: IdiomEntry[] = [
  [
    'avoir le cafard',
    '',
    'ter a barata',
    'Estar deprimido, para baixo.',
    'Estar na fossa',
    'Cunhada por Baudelaire, associando a barata à melancolia escura.',
    "J'ai le cafard aujourd'hui.",
    'Estou na fossa hoje.',
    'informal',
    'B1',
    4,
  ],
  [
    'coûter les yeux de la tête',
    '',
    'custar os olhos da cabeça',
    'Ser caríssimo.',
    'Custar os olhos da cara',
    'Praticamente idêntica à expressão portuguesa.',
    'Cette montre coûte les yeux de la tête.',
    'Esse relógio custa os olhos da cara.',
    'informal',
    'B1',
    4,
  ],
  [
    'poser un lapin',
    '',
    'colocar um coelho',
    'Dar o bolo, não aparecer a um encontro.',
    'Dar o bolo',
    'Do século XIX: "lapin" era o pagamento que não vinha.',
    "Il m'a posé un lapin hier soir.",
    'Ele me deu o bolo ontem à noite.',
    'informal',
    'B2',
    4,
  ],
  [
    'avoir un chat dans la gorge',
    '',
    'ter um gato na garganta',
    'Estar rouco, com a voz embargada.',
    'Estar com um sapo na garganta',
    'Provável corruptela de "maton", grumo de leite que travava a garganta.',
    "Excusez-moi, j'ai un chat dans la gorge.",
    'Desculpe, estou com um sapo na garganta.',
    'informal',
    'B1',
    3,
  ],
  [
    'tomber dans les pommes',
    '',
    'cair nas maçãs',
    'Desmaiar.',
    'Apagar',
    'Provável deformação de "pâmes" (desfalecimento), de pâmoison.',
    'Elle est tombée dans les pommes.',
    'Ela desmaiou.',
    'informal',
    'B2',
    3,
  ],
  [
    "ce n'est pas la mer à boire",
    '',
    'não é o mar para beber',
    'Não é tão difícil assim.',
    'Não é nenhum bicho de sete cabeças',
    'Beber o mar seria impossível; a tarefa em questão não é.',
    "Allez, ce n'est pas la mer à boire !",
    'Vai, não é nenhum bicho de sete cabeças!',
    'informal',
    'B2',
    3,
  ],
  [
    'revenons à nos moutons',
    '',
    'voltemos às nossas ovelhas',
    'Voltemos ao assunto principal.',
    'Voltando ao que interessa',
    'De uma farsa medieval em que o juiz repetia isso para conter as digressões.',
    'Bref, revenons à nos moutons.',
    'Enfim, voltando ao que interessa.',
    'neutral',
    'B2',
    3,
  ],
  [
    'avoir la pêche',
    '',
    'ter o pêssego',
    'Estar cheio de energia e disposição.',
    'Estar a mil',
    'Fruta associada a vigor e saúde.',
    "Ce matin, j'ai la pêche !",
    'Hoje de manhã estou a mil!',
    'informal',
    'B1',
    4,
  ],
];

const IT: IdiomEntry[] = [
  [
    'in bocca al lupo',
    '',
    'na boca do lobo',
    'Boa sorte! (a resposta certa é "crepi il lupo").',
    'Quebre a perna / boa sorte',
    'Do jargão de caçadores; desejar sorte direto dava azar.',
    'Domani hai l’esame? In bocca al lupo!',
    'Amanhã você tem prova? Boa sorte!',
    'informal',
    'A2',
    5,
  ],
  [
    'non vedo l’ora',
    '',
    'não vejo a hora',
    'Estar ansioso por algo; mal poder esperar.',
    'Não vejo a hora',
    'Idêntica à expressão portuguesa.',
    'Non vedo l’ora di vederti.',
    'Não vejo a hora de te ver.',
    'neutral',
    'A2',
    5,
  ],
  [
    'essere al verde',
    '',
    'estar no verde',
    'Estar sem dinheiro nenhum.',
    'Estar duro / liso',
    'Velas de leilão tinham a base verde: quando a chama chegava ali, acabava o dinheiro.',
    'Non posso uscire, sono al verde.',
    'Não posso sair, estou duro.',
    'informal',
    'B1',
    4,
  ],
  [
    'costare un occhio della testa',
    '',
    'custar um olho da cabeça',
    'Ser caríssimo.',
    'Custar os olhos da cara',
    'Mesma família da expressão espanhola e francesa.',
    'Quella borsa costa un occhio della testa.',
    'Aquela bolsa custa os olhos da cara.',
    'informal',
    'B1',
    4,
  ],
  [
    'prendere due piccioni con una fava',
    '',
    'pegar dois pombos com uma fava',
    'Resolver duas coisas de uma vez.',
    'Matar dois coelhos com uma cajadada',
    'Da caça com isca: uma fava atraía dois pombos.',
    'Così prendiamo due piccioni con una fava.',
    'Assim matamos dois coelhos com uma cajadada.',
    'neutral',
    'B2',
    3,
  ],
  [
    'avere le mani in pasta',
    '',
    'ter as mãos na massa',
    'Estar envolvido diretamente em algo.',
    'Estar com a mão na massa',
    'Imagem direta de quem cozinha.',
    'Lui ha le mani in pasta in quel progetto.',
    'Ele está com a mão na massa naquele projeto.',
    'neutral',
    'B2',
    3,
  ],
  [
    'piove sul bagnato',
    '',
    'chove no molhado',
    'Desgraça pouca é bobagem (ou: quem tem, recebe mais).',
    'Chover no molhado',
    'Serve tanto para azar acumulado quanto para sorte acumulada.',
    'Ha vinto di nuovo? Piove sul bagnato.',
    'Ganhou de novo? Chove no molhado.',
    'neutral',
    'B2',
    3,
  ],
  [
    'tirare il pacco',
    '',
    'puxar o pacote',
    'Dar o bolo em alguém.',
    'Dar o bolo',
    'Gíria moderna, muito comum entre jovens.',
    'Mi ha tirato il pacco ieri sera.',
    'Ele me deu o bolo ontem à noite.',
    'slang',
    'B2',
    3,
  ],
];

const DE: IdiomEntry[] = [
  [
    'Daumen drücken',
    '',
    'apertar os polegares',
    'Torcer por alguém, desejar sorte.',
    'Fazer figa / torcer',
    'Onde o inglês cruza os dedos, o alemão aperta o polegar dentro da mão.',
    'Ich drücke dir die Daumen!',
    'Estou torcendo por você!',
    'informal',
    'A2',
    5,
  ],
  [
    'die Nase voll haben',
    '',
    'ter o nariz cheio',
    'Estar de saco cheio de algo.',
    'Estar de saco cheio',
    'Provável origem no jargão prisional.',
    'Ich habe die Nase voll von dieser Arbeit.',
    'Estou de saco cheio deste trabalho.',
    'informal',
    'B1',
    5,
  ],
  [
    'Tomaten auf den Augen haben',
    '',
    'ter tomates nos olhos',
    'Não enxergar o óbvio.',
    'Estar de olhos fechados para algo',
    'Tomates vermelhos cobrindo os olhos: não se vê nada.',
    'Hast du Tomaten auf den Augen?',
    'Você está cego, é?',
    'informal',
    'B1',
    4,
  ],
  [
    'das ist nicht mein Bier',
    '',
    'isso não é a minha cerveja',
    'Isso não é problema meu.',
    'Não é da minha conta',
    'Cada um cuida da própria caneca.',
    'Das ist nicht mein Bier.',
    'Isso não é da minha conta.',
    'informal',
    'B2',
    4,
  ],
  [
    'ins Gras beißen',
    '',
    'morder a grama',
    'Morrer — em registro cru, quase brutal.',
    'Bater as botas',
    'Do campo de batalha: o soldado caído mordia o chão.',
    'Er hat ins Gras gebissen.',
    'Ele bateu as botas.',
    'slang',
    'B2',
    2,
  ],
  [
    'jemandem die Daumen halten',
    '',
    'segurar os polegares para alguém',
    'Torcer por alguém.',
    'Torcer',
    'Variante de "Daumen drücken".',
    'Ich halte dir die Daumen für morgen.',
    'Estou torcendo por você para amanhã.',
    'neutral',
    'B1',
    4,
  ],
  [
    'um den heißen Brei herumreden',
    '',
    'falar em volta do mingau quente',
    'Enrolar, não ir direto ao ponto.',
    'Fazer rodeios',
    'Ninguém quer tocar o mingau fervendo — então fica dando voltas.',
    'Red nicht um den heißen Brei herum!',
    'Pare de fazer rodeios!',
    'informal',
    'B2',
    3,
  ],
  [
    'Schwein haben',
    '',
    'ter porco',
    'Ter muita sorte.',
    'Ter sorte de principiante',
    'Em torneios medievais, o último colocado ganhava um porco de consolação — e saía com carne de graça.',
    'Da hast du wirklich Schwein gehabt!',
    'Aí você teve muita sorte mesmo!',
    'informal',
    'B1',
    4,
  ],
];

const RAW: Record<LanguageCode, IdiomEntry[]> = {
  en: EN,
  es: ES,
  fr: FR,
  it: IT,
  de: DE,
};

/**
 * Constrói os verbetes de expressões de um idioma.
 *
 * Junta os dois lotes — o desta arquivo e o de `idioms-extra.ts`, escrito num
 * formato compacto e organizado por nível. A junção acontece **aqui**, num
 * único ponto, para que apostila, tutor, catálogo e contagem enxerguem sempre
 * o mesmo conjunto: se cada consumidor tivesse de lembrar de somar os dois
 * lotes, um deles esqueceria.
 */
export function buildIdioms(language: LanguageCode): Idiom[] {
  return [...buildCuratedIdioms(language), ...extraIdioms(language)];
}

function buildCuratedIdioms(language: LanguageCode): Idiom[] {
  return (RAW[language] ?? []).map((entry, index) => {
    const [
      expression,
      romanization,
      literal,
      meaning,
      equivalent,
      origin,
      example,
      exampleTranslation,
      register,
      cefr,
      frequency,
    ] = entry;

    return {
      // Romanização quando existe, senão a própria expressão: garante id
      // estável mesmo em escrita não latina.
      id: `idiom:${language}:${(romanization || expression)
        .replace(/[^a-z0-9]/gi, '_')
        .toLowerCase()
        .slice(0, 40)}:${index}`,
      language,
      expression,
      romanization: romanization || null,
      literal,
      meaning,
      equivalent: equivalent || null,
      origin: origin || null,
      example,
      exampleTranslation,
      register,
      cefr,
      frequency,
      tags: [register],
    };
  });
}

export function buildAllIdioms(languages: LanguageCode[]): Idiom[] {
  return languages.flatMap(buildIdioms);
}

/** Quantas expressões existem por idioma — usado nos cards de conteúdo. */
export function idiomCount(language: LanguageCode): number {
  return (RAW[language]?.length ?? 0) + extraIdioms(language).length;
}

/**
 * Quantas expressões existem num nível.
 *
 * Contar é o que revela a lacuna: a meta é 25 por nível, e sem uma contagem
 * exposta ninguém sabe de quanto está o débito.
 */
export function idiomCountByLevel(language: LanguageCode, level: CefrLevel): number {
  const curated = (RAW[language] ?? []).filter((entry) => entry[9] === level).length;
  return curated + extraCountByLevel(language, level);
}
