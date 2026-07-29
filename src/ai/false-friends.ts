/**
 * Falsos cognatos e pragmática por idioma
 * ========================================
 *
 * ## Por que falso cognato merece arquivo próprio
 *
 * Para um falante de português, o falso cognato é a classe de erro com **maior
 * custo social por unidade de frequência**. Errar uma conjugação faz o
 * interlocutor corrigir; dizer "estoy embarazada" quando se quis dizer "estou
 * com vergonha" faz o interlocutor mudar de assunto.
 *
 * Pior: são erros que o aluno **não sabe que está cometendo**. A palavra parece
 * conhecida, a frase sai fluente, e nada no feedback interno sinaliza problema.
 * Por isso não basta estarem no vocabulário — precisam estar num índice que o
 * tutor consulta ativamente quando a palavra aparece.
 *
 * ## Pragmática: o que ninguém ensina e todo mundo erra
 *
 * A segunda metade deste arquivo é `PRAGMATIC_NOTES`: regras de uso que não são
 * gramática nem vocabulário, e sim **o que soa apropriado**. Um brasileiro que
 * traduz literalmente sua cordialidade para o alemão soa artificial; um que
 * traduz sua objetividade para o japonês soa agressivo. Nenhum livro de
 * gramática cobre isso, e é o que mais afeta como a pessoa é percebida.
 */

import type { LanguageCode } from '@/domain/types';

export type FalseFriend = {
  /** A palavra na língua estudada. */
  term: string;
  /** O que o lusófono acha que significa. */
  looksLike: string;
  /** O que realmente significa. */
  actually: string;
  /** Como dizer o que a pessoa queria dizer. */
  insteadSay: string;
  example: string;
};

export type PragmaticNote = {
  title: string;
  note: string;
};

/* ================================================================== *
 * Falsos cognatos
 * ================================================================== */

export const FALSE_FRIENDS: Record<LanguageCode, FalseFriend[]> = {
  en: [
    {
      term: 'actually',
      looksLike: 'atualmente',
      actually: 'na verdade',
      insteadSay: 'currently / nowadays',
      example: 'Actually, I disagree. — Na verdade, eu discordo.',
    },
    {
      term: 'pretend',
      looksLike: 'pretender',
      actually: 'fingir',
      insteadSay: 'intend / plan to',
      example: 'He pretended to be asleep. — Ele fingiu estar dormindo.',
    },
    {
      term: 'push',
      looksLike: 'puxar',
      actually: 'empurrar',
      insteadSay: 'pull',
      example: 'Push the door. — Empurre a porta.',
    },
    {
      term: 'eventually',
      looksLike: 'eventualmente',
      actually: 'por fim / no final',
      insteadSay: 'occasionally',
      example: 'Eventually, they agreed. — No final, eles concordaram.',
    },
    {
      term: 'college',
      looksLike: 'colégio',
      actually: 'faculdade',
      insteadSay: 'high school',
      example: 'She is in college. — Ela está na faculdade.',
    },
    {
      term: 'parents',
      looksLike: 'parentes',
      actually: 'pais',
      insteadSay: 'relatives',
      example: 'My parents live abroad. — Meus pais moram fora.',
    },
    {
      term: 'costume',
      looksLike: 'costume',
      actually: 'fantasia (roupa)',
      insteadSay: 'habit / custom',
      example: 'A Halloween costume. — Uma fantasia de Halloween.',
    },
    {
      term: 'exquisite',
      looksLike: 'esquisito',
      actually: 'primoroso / refinado',
      insteadSay: 'weird / strange',
      example: 'An exquisite meal. — Uma refeição primorosa.',
    },
  ],
  es: [
    {
      term: 'embarazada',
      looksLike: 'envergonhada',
      actually: 'grávida',
      insteadSay: 'avergonzada',
      example: 'Está embarazada de tres meses. — Está grávida de três meses.',
    },
    {
      term: 'exquisito',
      looksLike: 'esquisito',
      actually: 'delicioso',
      insteadSay: 'raro / extraño',
      example: 'La cena estuvo exquisita. — O jantar estava delicioso.',
    },
    {
      term: 'oficina',
      looksLike: 'oficina mecânica',
      actually: 'escritório',
      insteadSay: 'taller',
      example: 'Trabajo en una oficina. — Trabalho num escritório.',
    },
    {
      term: 'rato',
      looksLike: 'rato (animal)',
      actually: 'momento / instante',
      insteadSay: 'ratón',
      example: 'Espera un rato. — Espera um momento.',
    },
    {
      term: 'salsa',
      looksLike: 'salsa (erva)',
      actually: 'molho',
      insteadSay: 'perejil',
      example: 'Salsa de tomate. — Molho de tomate.',
    },
    {
      term: 'largo',
      looksLike: 'largo',
      actually: 'comprido',
      insteadSay: 'ancho',
      example: 'Un camino largo. — Um caminho comprido.',
    },
    {
      term: 'apellido',
      looksLike: 'apelido',
      actually: 'sobrenome',
      insteadSay: 'apodo',
      example: '¿Cuál es tu apellido? — Qual é o seu sobrenome?',
    },
    {
      term: 'borrar',
      looksLike: 'borrar',
      actually: 'apagar',
      insteadSay: 'manchar',
      example: 'Borra esa palabra. — Apague essa palavra.',
    },
  ],
  fr: [
    {
      term: 'attendre',
      looksLike: 'atender',
      actually: 'esperar',
      insteadSay: 'répondre / servir',
      example: "J'attends le bus. — Espero o ônibus.",
    },
    {
      term: 'rester',
      looksLike: 'restar',
      actually: 'ficar / permanecer',
      insteadSay: 'rester (no sentido de sobrar) = il reste',
      example: 'Je reste à la maison. — Fico em casa.',
    },
    {
      term: 'quitter',
      looksLike: 'quitar (pagar)',
      actually: 'deixar / sair de',
      insteadSay: 'payer / régler',
      example: 'Il a quitté son travail. — Ele deixou o emprego.',
    },
    {
      term: 'la journée',
      looksLike: 'jornada de trabalho',
      actually: 'o dia inteiro',
      insteadSay: 'la journée de travail',
      example: 'Bonne journée ! — Tenha um bom dia!',
    },
    {
      term: 'la pièce',
      looksLike: 'peça de roupa',
      actually: 'cômodo / peça de teatro',
      insteadSay: 'vêtement',
      example: 'Un appartement de trois pièces. — Um apartamento de três cômodos.',
    },
    {
      term: 'blessé',
      looksLike: 'abençoado',
      actually: 'ferido',
      insteadSay: 'béni',
      example: 'Il a été blessé. — Ele ficou ferido.',
    },
    {
      term: 'la salade',
      looksLike: 'salada só',
      actually: 'também alface',
      insteadSay: 'contexto decide',
      example: 'Acheter une salade. — Comprar um pé de alface.',
    },
    {
      term: 'entendre',
      looksLike: 'entender',
      actually: 'ouvir',
      insteadSay: 'comprendre',
      example: "Je n'entends rien. — Não ouço nada.",
    },
  ],
  it: [
    {
      term: 'burro',
      looksLike: 'burro (animal)',
      actually: 'manteiga',
      insteadSay: 'asino',
      example: 'Pane e burro. — Pão com manteiga.',
    },
    {
      term: 'salire',
      looksLike: 'sair',
      actually: 'subir',
      insteadSay: 'uscire',
      example: 'Salgo le scale. — Subo as escadas.',
    },
    {
      term: 'guardare',
      looksLike: 'guardar',
      actually: 'olhar',
      insteadSay: 'conservare / tenere',
      example: 'Guarda questo! — Olha isso!',
    },
    {
      term: 'squisito',
      looksLike: 'esquisito',
      actually: 'delicioso',
      insteadSay: 'strano',
      example: 'Un dolce squisito. — Um doce delicioso.',
    },
    {
      term: 'lungo',
      looksLike: 'longe',
      actually: 'comprido / longo',
      insteadSay: 'lontano',
      example: 'Un viaggio lungo. — Uma viagem longa.',
    },
    {
      term: 'accostare',
      looksLike: 'acostar / deitar',
      actually: 'aproximar / encostar',
      insteadSay: 'coricarsi',
      example: "Accosta l'auto. — Encoste o carro.",
    },
    {
      term: 'stanza',
      looksLike: 'estância',
      actually: 'quarto / cômodo',
      insteadSay: 'tenuta',
      example: 'La mia stanza è piccola. — Meu quarto é pequeno.',
    },
    {
      term: 'esposto',
      looksLike: 'esposto (casado)',
      actually: 'exposto',
      insteadSay: 'sposato',
      example: 'Esposto al sole. — Exposto ao sol.',
    },
  ],
  de: [
    {
      term: 'bekommen',
      looksLike: 'tornar-se',
      actually: 'receber / ganhar',
      insteadSay: 'werden',
      example: 'Ich bekomme ein Geschenk. — Eu ganho um presente.',
    },
    {
      term: 'Gift',
      looksLike: 'presente (inglês)',
      actually: 'veneno',
      insteadSay: 'Geschenk',
      example: 'Vorsicht, Gift! — Cuidado, veneno!',
    },
    {
      term: 'Rock',
      looksLike: 'rock (música)',
      actually: 'saia',
      insteadSay: 'Rockmusik',
      example: 'Sie trägt einen Rock. — Ela usa uma saia.',
    },
    {
      term: 'Gymnasium',
      looksLike: 'academia',
      actually: 'escola secundária',
      insteadSay: 'Fitnessstudio',
      example: 'Er geht aufs Gymnasium. — Ele estuda no ensino médio.',
    },
    {
      term: 'Chef',
      looksLike: 'chef de cozinha',
      actually: 'chefe / patrão',
      insteadSay: 'Koch',
      example: 'Mein Chef ist streng. — Meu chefe é rígido.',
    },
    {
      term: 'aktuell',
      looksLike: 'atual e também "de verdade"',
      actually: 'atual (só isso)',
      insteadSay: 'tatsächlich',
      example: 'Die aktuelle Lage. — A situação atual.',
    },
    {
      term: 'sensibel',
      looksLike: 'sensível no sentido de sensato',
      actually: 'sensível emocionalmente',
      insteadSay: 'vernünftig',
      example: 'Er ist sehr sensibel. — Ele é muito sensível.',
    },
    {
      term: 'Fabrik',
      looksLike: 'fábrica de tecido',
      actually: 'fábrica em geral',
      insteadSay: 'Stoff (tecido)',
      example: 'Er arbeitet in einer Fabrik. — Ele trabalha numa fábrica.',
    },
  ],
  ja: [
    {
      term: 'マンション (manshon)',
      looksLike: 'mansão',
      actually: 'apartamento em prédio',
      insteadSay: '大邸宅 (teitaku)',
      example: 'マンションに住んでいます。— Moro num apartamento.',
    },
    {
      term: 'サービス (sābisu)',
      looksLike: 'serviço',
      actually: 'cortesia / grátis',
      insteadSay: '業務 (gyōmu)',
      example: 'これはサービスです。— Isto é cortesia da casa.',
    },
    {
      term: 'スマート (sumāto)',
      looksLike: 'inteligente',
      actually: 'esbelto / elegante',
      insteadSay: '賢い (kashikoi)',
      example: 'スマートな体型。— Um corpo esbelto.',
    },
    {
      term: 'クレーム (kurēmu)',
      looksLike: 'reivindicação',
      actually: 'reclamação',
      insteadSay: '請求 (seikyū)',
      example: 'クレームを受けた。— Recebemos uma reclamação.',
    },
    {
      term: 'ナイーブ (naību)',
      looksLike: 'ingênuo (pejorativo)',
      actually: 'sensível / delicado',
      insteadSay: '世間知らず',
      example: 'ナイーブな問題。— Uma questão delicada.',
    },
    {
      term: 'テンション (tenshon)',
      looksLike: 'tensão',
      actually: 'ânimo / empolgação',
      insteadSay: '緊張 (kinchō)',
      example: 'テンションが高い。— Está muito animado.',
    },
  ],
  ko: [
    {
      term: '핸드폰 (haendeupon)',
      looksLike: 'hand phone',
      actually: 'celular',
      insteadSay: '휴대폰 também serve',
      example: '핸드폰 좀 빌려주세요. — Me empresta o celular.',
    },
    {
      term: '서비스 (seobiseu)',
      looksLike: 'serviço',
      actually: 'brinde / cortesia',
      insteadSay: '업무',
      example: '이건 서비스예요. — Isto é cortesia.',
    },
    {
      term: '아파트 (apateu)',
      looksLike: 'apartamento simples',
      actually: 'prédio residencial (status)',
      insteadSay: '빌라 para prédio menor',
      example: '아파트에 살아요. — Moro num prédio.',
    },
    {
      term: '미팅 (miting)',
      looksLike: 'reunião',
      actually: 'encontro para paquera',
      insteadSay: '회의 (hoeui)',
      example: '오늘 미팅 있어요. — Tenho um encontro hoje.',
    },
    {
      term: '컨닝 (keonning)',
      looksLike: 'cunning / astúcia',
      actually: 'colar na prova',
      insteadSay: '교활함',
      example: '컨닝하지 마세요. — Não cole na prova.',
    },
    {
      term: '화이팅 (hwaiting)',
      looksLike: 'fighting / briga',
      actually: 'força! / vai lá!',
      insteadSay: '싸움 (ssaum)',
      example: '화이팅! — Força!',
    },
  ],
  zh: [
    {
      term: '爱人 (àirén)',
      looksLike: 'amante',
      actually: 'cônjuge (na China continental)',
      insteadSay: '情人 (qíngrén)',
      example: '这是我爱人。— Este é meu marido / minha esposa.',
    },
    {
      term: '老板 (lǎobǎn)',
      looksLike: 'velho',
      actually: 'chefe / dono',
      insteadSay: '老人 (lǎorén)',
      example: '我们老板很好。— Nosso chefe é gente boa.',
    },
    {
      term: '小心 (xiǎoxīn)',
      looksLike: 'coração pequeno / mesquinho',
      actually: 'cuidado!',
      insteadSay: '小气 (xiǎoqì)',
      example: '小心台阶。— Cuidado com o degrau.',
    },
    {
      term: '大家 (dàjiā)',
      looksLike: 'casa grande',
      actually: 'todo mundo',
      insteadSay: '大房子',
      example: '大家好！— Olá a todos!',
    },
    {
      term: '方便 (fāngbiàn)',
      looksLike: 'conveniente só',
      actually: 'também eufemismo para ir ao banheiro',
      insteadSay: 'contexto decide',
      example: '不太方便。— Não é muito conveniente.',
    },
    {
      term: '意思 (yìsi)',
      looksLike: 'ideia',
      actually: 'significado / intenção / graça',
      insteadSay: '主意 (zhǔyi) para ideia',
      example: '什么意思？— O que quer dizer?',
    },
  ],
};

/* ================================================================== *
 * Pragmática
 * ================================================================== */

export const PRAGMATIC_NOTES: Record<LanguageCode, PragmaticNote[]> = {
  en: [
    {
      title: 'Pedido direto soa rude',
      note: 'Em inglês, "I want a coffee" é aceitável em português e agressivo em inglês. Use "Could I have…" ou "I\'d like…". A distância entre pedido e ordem é marcada gramaticalmente, não pela entonação.',
    },
    {
      title: 'Sorry e excuse me não são intercambiáveis',
      note: '"Excuse me" abre interação e pede passagem; "sorry" pede desculpa por algo já feito. Trocar os dois é um dos deslizes mais audíveis de brasileiros.',
    },
    {
      title: 'Small talk é obrigatório, não enrolação',
      note: 'Reunião e conversa de elevador começam com clima ou fim de semana. Ir direto ao assunto, natural no Brasil, é lido como frieza em contexto anglófono.',
    },
  ],
  es: [
    {
      title: 'Tú e usted variam por país',
      note: 'Na Espanha "tú" é o padrão até em contexto profissional; na Colômbia e no México "usted" é muito mais frequente. Usar a forma errada não ofende, mas marca imediatamente o estrangeiro.',
    },
    {
      title: 'O imperativo não é rude',
      note: '"Dame un café" soa normal em espanhol, ao contrário do que a tradução literal sugere ao lusófono. A cortesia vem do tom e do "por favor", não da estrutura.',
    },
    {
      title: 'Interromper faz parte',
      note: 'Na conversa espanhola, sobrepor a fala é sinal de engajamento, não de má educação. Esperar o silêncio total costuma significar não conseguir falar.',
    },
  ],
  fr: [
    {
      title: 'O "bonjour" é obrigatório',
      note: 'Entrar numa loja e falar sem dizer "bonjour" é considerado grosseiro na França, ainda que em português seja perfeitamente normal ir direto ao pedido.',
    },
    {
      title: 'Vouvoiement é o padrão com desconhecido',
      note: 'Usar "tu" sem convite explícito é invasivo. O convite existe e é verbal: "on peut se tutoyer".',
    },
    {
      title: 'Discordar é valorizado',
      note: 'Na conversa francesa, apresentar objeção é sinal de atenção ao argumento. Concordar sempre pode ser lido como desinteresse.',
    },
  ],
  it: [
    {
      title: 'Lei formal na primeira interação',
      note: 'Com desconhecidos e em contexto profissional, use "Lei". O "tu" chega rápido, mas quem oferece é o italiano.',
    },
    {
      title: 'Gesto faz parte da gramática',
      note: 'O gesto italiano não é enfeite: modifica o sentido. Falar italiano com as mãos paradas transmite frieza ou desconforto.',
    },
    {
      title: 'Diminutivo carrega afeto e ironia',
      note: '"Un caffettino" não é um café menor — é um café simpático. Ler o alterado como tamanho literal perde metade da mensagem.',
    },
  ],
  de: [
    {
      title: 'Direto não é rude',
      note: 'Um alemão que diz "das ist falsch" está corrigindo o conteúdo, não atacando você. A suavização brasileira é frequentemente lida como falta de clareza.',
    },
    {
      title: 'Sie até ser convidado',
      note: 'O "du" é oferecido, geralmente pelo mais velho ou mais graduado. Antecipar-se é falta de leitura social.',
    },
    {
      title: 'Pontualidade é conteúdo, não forma',
      note: 'Chegar cinco minutos atrasado exige desculpa explícita. Não é rigidez: é o que sinaliza respeito pelo tempo do outro.',
    },
  ],
  ja: [
    {
      title: 'Recusa direta praticamente não existe',
      note: 'Um "ちょっと…" (chotto…) seguido de silêncio é um "não". Insistir depois disso, natural no Brasil, coloca o interlocutor numa situação constrangedora.',
    },
    {
      title: 'Uchi e soto decidem a forma verbal',
      note: 'Falar do próprio chefe para alguém de fora exige rebaixá-lo com formas humildes. A hierarquia é relativa ao interlocutor, não absoluta.',
    },
    {
      title: 'Silêncio é resposta',
      note: 'A pausa longa é parte da conversa japonesa e não precisa ser preenchida. Preenchê-la por reflexo é o hábito brasileiro que mais atrapalha ali.',
    },
  ],
  ko: [
    {
      title: 'Idade define a fala',
      note: 'Perguntar a idade logo no início não é indiscrição: é o que permite escolher o nível de fala correto. Sem essa informação, a conversa fica gramaticalmente indefinida.',
    },
    {
      title: 'Recusar o primeiro convite é educado',
      note: 'Aceitar de imediato pode soar ávido. O convite costuma ser repetido, e é na segunda ou terceira vez que se aceita.',
    },
    {
      title: 'Servir bebida com as duas mãos',
      note: 'Receber ou servir com uma mão só diante de alguém mais velho é falta grave. O gesto pesa mais que a palavra.',
    },
  ],
  zh: [
    {
      title: 'Não dizer "não"',
      note: '"再说吧" (falamos depois) e "不太方便" (não é muito conveniente) são recusas. Esperar um "não" explícito leva a mal-entendidos frequentes.',
    },
    {
      title: 'Elogio se recusa',
      note: 'Responder "谢谢" a um elogio é aceitável hoje, mas a recusa modesta ("哪里哪里") ainda é a forma mais segura em contexto formal.',
    },
    {
      title: 'Mianzi: preservar a face',
      note: 'Corrigir alguém em público, mesmo com razão, custa caro. A correção acontece em particular — e é assim que se mantém a relação de trabalho.',
    },
  ],
};

/** Total de itens catalogados — usado em documentação e testes. */
export function contextItemCount(): number {
  const friends = Object.values(FALSE_FRIENDS).reduce((sum, list) => sum + list.length, 0);
  const notes = Object.values(PRAGMATIC_NOTES).reduce((sum, list) => sum + list.length, 0);
  return friends + notes;
}
