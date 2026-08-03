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
 * traduz seu "a gente se fala" para o inglês marca um compromisso que não
 * pretendia. Nenhum livro de gramática cobre isso, e é o que mais afeta como a
 * pessoa é percebida.
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
};

/** Total de itens catalogados — usado em documentação e testes. */
export function contextItemCount(): number {
  const friends = Object.values(FALSE_FRIENDS).reduce((sum, list) => sum + list.length, 0);
  const notes = Object.values(PRAGMATIC_NOTES).reduce((sum, list) => sum + list.length, 0);
  return friends + notes;
}
