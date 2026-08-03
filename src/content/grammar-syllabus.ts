/**
 * Programa de gramática por nível
 * ================================
 *
 * ## O que é um "exercício que ensina"
 *
 * Um exercício de múltipla escolha com três alternativas absurdas não ensina
 * nada: o aluno acerta por eliminação e sai sem ter pensado na regra. O que
 * ensina é o item em que **o distrator é o erro que aquela pessoa realmente
 * cometeria**.
 *
 * Por isso cada ponto aqui carrega um campo `trap`: a forma errada que um
 * falante de português produz por transferência da língua materna. "I have 25
 * years" não é uma alternativa aleatória — é a tradução literal de "tenho 25
 * anos", e é exatamente o que o aluno escreveria. Colocá-la como distrator
 * transforma o exercício num diagnóstico: quem cai nela precisa da regra, e
 * recebe a explicação na hora.
 *
 * ## Estrutura de cada ponto
 *
 *  - `title`      — o nome da regra, em português.
 *  - `rule`       — a regra em uma frase, sem jargão. Se precisa de metalinguagem
 *                   para ser entendida, está mal escrita.
 *  - `correct`    — a forma certa, em contexto.
 *  - `trap`       — a forma que o lusófono produz por interferência.
 *  - `why`        — por que a intuição do português falha aqui. Esta é a parte
 *                   que efetivamente corrige o erro; sem ela o aluno decora o
 *                   item e reproduz o erro na frase seguinte.
 *
 * ## Progressão
 *
 * A1/A2 tratam de morfologia básica e das armadilhas de alta frequência.
 * B1/B2 tratam de tempo, modo e subordinação. C1/C2 tratam de registro,
 * inversão, ênfase e do que separa "correto" de "natural".
 */

import type { CefrLevel, CorrectSentenceExercise, LanguageCode } from '@/domain/types';

export type GrammarPoint = {
  title: string;
  rule: string;
  correct: string;
  trap: string;
  why: string;
  /**
   * Categoria do erro, para o feedback. Opcional: a maioria dos erros de
   * transferência do português é de uso, e `usage` é o padrão aplicado na
   * geração — declarar aqui só vale quando o erro é claramente morfológico.
   */
  errorKind?: CorrectSentenceExercise['errorKind'];
};

type GrammarMap = Partial<Record<CefrLevel, GrammarPoint[]>>;

/* ================================================================== *
 * Inglês
 * ================================================================== */

const EN: GrammarMap = {
  A1: [
    {
      title: 'Idade com "to be"',
      rule: 'Em inglês a idade se diz com o verbo "to be", não com "have".',
      correct: 'I am 25 years old.',
      trap: 'I have 25 years.',
      why: 'Em português a idade é uma posse ("tenho 25 anos"); em inglês é um estado ("sou de 25 anos de idade"). É o erro nº 1 de brasileiros e sobrevive até níveis altos.',
    },
    {
      title: 'Presente simples na 3ª pessoa',
      rule: 'Com he, she e it, o verbo ganha -s no presente.',
      correct: 'She works in a hospital.',
      trap: 'She work in a hospital.',
      why: 'O português marca a pessoa em todas as formas, então o -s do inglês parece redundante e some. É a marca mais audível de quem "sabe inglês mas erra".',
    },
    {
      title: 'Artigo indefinido a / an',
      rule: 'Use "an" antes de som de vogal, não de letra vogal.',
      correct: 'an hour, a university',
      trap: 'a hour, an university',
      why: 'A regra é fonética, não ortográfica: "hour" começa com som de vogal (o h é mudo) e "university" começa com som de /j/.',
    },
  ],
  A2: [
    {
      title: 'Passado simples com "did"',
      rule: 'Depois de "did", o verbo principal volta à forma base.',
      correct: 'Did you go to the party?',
      trap: 'Did you went to the party?',
      why: 'O tempo já está marcado em "did". Marcar duas vezes é redundância — como dizer "você foi foi".',
    },
    {
      title: 'Some e any',
      rule: 'Use "some" em afirmativas e "any" em negativas e perguntas.',
      correct: "I don't have any money.",
      trap: "I don't have some money.",
      why: 'Em português "algum" serve nos dois casos, então a distinção não existe na intuição e precisa ser aprendida explicitamente.',
    },
    {
      title: 'Comparativos',
      rule: 'Adjetivos curtos levam -er; longos levam "more".',
      correct: 'This one is cheaper and more comfortable.',
      trap: 'This one is more cheap and comfortabler.',
      why: 'O português usa "mais" para tudo, então a tendência é generalizar "more" — ou, quando se aprende o -er, aplicá-lo onde não cabe.',
    },
  ],
  B1: [
    {
      title: 'Present perfect x past simple',
      rule: 'Present perfect liga o passado ao agora; past simple fecha o fato num momento terminado.',
      correct: 'I have lived here for ten years. / I lived there in 2010.',
      trap: 'I live here for ten years.',
      why: 'O português usa o presente ("moro aqui há dez anos"), e essa é a origem exata do erro. Se há um marcador de tempo terminado, use past simple; se a ação alcança o presente, present perfect.',
    },
    {
      title: 'Condicional real (first conditional)',
      rule: 'Depois de "if" não se usa "will": o futuro fica só na outra oração.',
      correct: 'If it rains, I will stay home.',
      trap: 'If it will rain, I will stay home.',
      why: 'Em português dizemos "se chover" (futuro do subjuntivo), forma que o inglês não tem — e a saída intuitiva errada é repetir o futuro.',
    },
    {
      title: 'Verbos seguidos de gerúndio',
      rule: 'Alguns verbos exigem -ing depois deles: enjoy, avoid, finish, suggest.',
      correct: 'I enjoy studying at night.',
      trap: 'I enjoy to study at night.',
      why: 'Em português quase tudo aceita infinitivo ("gosto de estudar"), então o "to" é escolhido por padrão. Esta é uma lista a memorizar, não uma regra a deduzir.',
    },
  ],
  B2: [
    {
      title: 'Condicional irreal (second conditional)',
      rule: 'Situação hipotética no presente: past simple no "if", "would" na outra oração.',
      correct: 'If I had more time, I would travel.',
      trap: 'If I would have more time, I would travel.',
      why: 'O "would" no "if" é o decalque do "eu teria" do português. Em inglês o passado ali não é passado: é marca de irrealidade.',
    },
    {
      title: 'Voz passiva',
      rule: 'A passiva combina "to be" + particípio, e o agente vem com "by".',
      correct: 'The report was written by the team.',
      trap: 'The report was write by the team.',
      why: 'O particípio irregular é onde o erro acontece — write/wrote/written. A passiva pede sempre o terceiro.',
    },
    {
      title: 'Discurso indireto',
      rule: 'Ao relatar, o tempo verbal recua um passo.',
      correct: 'She said she was tired.',
      trap: 'She said she is tired.',
      why: 'O português admite manter o presente ("ela disse que está cansada"); o inglês formal exige o recuo, e mantê-lo soa descuidado na escrita.',
    },
  ],
  C1: [
    {
      title: 'Inversão com advérbios negativos',
      rule: 'Começando a frase com "never", "rarely", "not only", o auxiliar vem antes do sujeito.',
      correct: 'Never have I seen such a thing.',
      trap: 'Never I have seen such a thing.',
      why: 'É estrutura de registro alto, sem paralelo em português. Serve para dar ênfase na escrita formal e em discurso público.',
    },
    {
      title: 'Cleft sentences',
      rule: 'Para destacar um elemento, use "It is X that…" ou "What… is…".',
      correct: 'It was the delay that ruined the launch.',
      trap: 'The delay that ruined the launch.',
      why: 'O português destaca pela entonação e pela ordem livre; o inglês, de ordem rígida, precisa de uma estrutura sintática para fazer o mesmo.',
    },
    {
      title: 'Subjuntivo em orações de recomendação',
      rule: 'Depois de suggest, insist, demand, recommend, usa-se a forma base do verbo.',
      correct: 'I suggest that he be present.',
      trap: 'I suggest that he is present.',
      why: 'Coincide com o subjuntivo português ("sugiro que ele esteja"), mas em inglês a forma é a base do verbo, sem conjugação — o que confunde justamente quem já entendeu a lógica.',
    },
  ],
  C2: [
    {
      title: 'Condicional misto',
      rule: 'Condição no passado com consequência no presente combina "had + particípio" e "would + base".',
      correct: 'If I had studied medicine, I would be a doctor now.',
      trap: 'If I had studied medicine, I would have been a doctor now.',
      why: 'O "now" exige consequência presente. Manter "would have been" joga a consequência para o passado e contradiz o advérbio.',
    },
    {
      title: 'Hedging acadêmico',
      rule: 'Na escrita acadêmica, afirmações categóricas são atenuadas: "appears to", "tends to", "may well".',
      correct: 'The data appear to suggest a correlation.',
      trap: 'The data prove there is a correlation.',
      why: 'Não é timidez: em inglês acadêmico, afirmação categórica sem prova soa amadora. O registro exige calibrar a certeza.',
    },
    {
      title: 'Colocação e naturalidade',
      rule: 'Palavras têm parceiras fixas; trocá-las produz frases corretas mas estranhas.',
      correct: 'make a decision, do research, take a risk',
      trap: 'do a decision, make research, make a risk',
      why: 'Colocação não se deduz de regra nenhuma — é o último traço que denuncia um estrangeiro proficiente, e só se resolve com exposição e memorização deliberada.',
    },
  ],
};

/* ================================================================== *
 * Espanhol
 * ================================================================== */

const ES: GrammarMap = {
  A1: [
    {
      title: 'Ser e estar',
      rule: 'Ser para característica e identidade; estar para estado e localização.',
      correct: 'Estoy cansado. / Soy brasileño.',
      trap: 'Soy cansado.',
      why: 'O português também tem os dois verbos, mas a fronteira não coincide: "sou casado" em espanhol é "estoy casado".',
    },
    {
      title: 'Muy e mucho',
      rule: '"Muy" acompanha adjetivo e advérbio; "mucho" acompanha substantivo e verbo.',
      correct: 'Es muy difícil. / Trabaja mucho.',
      trap: 'Es mucho difícil.',
      why: 'O português usa "muito" para os dois casos, e a distinção espanhola não tem equivalente na intuição.',
    },
    {
      title: 'Gênero enganoso',
      rule: 'Vários substantivos mudam de gênero entre português e espanhol.',
      correct: 'la leche, el viaje, la nariz',
      trap: 'el leche, la viaje, el nariz',
      why: 'A semelhança das línguas é o próprio risco: o falante aplica o gênero português sem desconfiar.',
    },
  ],
  A2: [
    {
      title: 'Pretérito indefinido x imperfecto',
      rule: 'Indefinido para ação concluída; imperfecto para hábito e descrição.',
      correct: 'Ayer comí paella. / Antes comía paella todos los domingos.',
      trap: 'Ayer comía paella.',
      why: 'A oposição existe em português, mas os marcadores temporais do espanhol são mais rígidos: "ayer" praticamente obriga o indefinido.',
    },
    {
      title: 'Falsos amigos frequentes',
      rule: 'Palavras iguais com sentidos diferentes.',
      correct: 'exquisito = delicioso; embarazada = grávida',
      trap: 'exquisito = esquisito; embarazada = envergonhada',
      why: 'São os erros que causam constrangimento real. A semelhança gráfica é justamente o que impede a checagem.',
    },
    {
      title: 'Gustar e o objeto indireto',
      rule: 'Quem gosta é o objeto indireto; a coisa é o sujeito.',
      correct: 'Me gustan los libros.',
      trap: 'Yo gusto los libros.',
      why: 'A estrutura é invertida em relação ao português. Literalmente: "os livros me agradam".',
    },
  ],
  B1: [
    {
      title: 'Subjuntivo depois de expressões de desejo',
      rule: 'Querer que, esperar que e ojalá pedem subjuntivo.',
      correct: 'Quiero que vengas.',
      trap: 'Quiero que vienes.',
      why: 'O português faz igual ("quero que venhas"), mas o uso brasileiro do indicativo na fala ("quero que você vem") transfere o erro.',
    },
    {
      title: 'Por e para',
      rule: 'Por para causa, meio e troca; para para finalidade e destino.',
      correct: 'Lo hice por ti. / Este regalo es para ti.',
      trap: 'Lo hice para ti (quando o sentido é "por sua causa").',
      why: 'O português resolve quase tudo com "para", então a distinção precisa ser construída do zero.',
    },
    {
      title: 'Pretérito perfecto',
      rule: 'Na Espanha, "he hecho" cobre o passado dentro do período atual.',
      correct: 'Hoy he trabajado mucho.',
      trap: 'Hoy trabajé mucho (no espanhol peninsular).',
      why: 'O português brasileiro quase não usa "tenho feito" nesse sentido. Na América Latina o indefinido predomina — vale conhecer as duas normas.',
    },
  ],
  B2: [
    {
      title: 'Condicional irreal',
      rule: 'Si + imperfecto de subjuntivo, seguido de condicional.',
      correct: 'Si tuviera tiempo, viajaría.',
      trap: 'Si tendría tiempo, viajaría.',
      why: 'O condicional nunca aparece depois de "si" em espanhol padrão — é erro marcado, inclusive entre nativos.',
    },
    {
      title: 'Voz passiva com "se"',
      rule: 'O espanhol prefere a passiva reflexa à passiva com "ser".',
      correct: 'Se venden pisos.',
      trap: 'Pisos son vendidos.',
      why: 'A passiva com "ser" existe, mas soa traduzida. A reflexa é a forma natural em anúncios, avisos e textos técnicos.',
    },
    {
      title: 'Concordância dos tempos',
      rule: 'Verbo principal no passado puxa subjuntivo imperfeito na subordinada.',
      correct: 'Me pidió que llegara temprano.',
      trap: 'Me pidió que llegue temprano.',
      why: 'A fala brasileira relaxa essa concordância; o espanhol escrito, não.',
    },
  ],
  C1: [
    {
      title: 'Leísmo, laísmo e loísmo',
      rule: 'A norma culta usa "lo/la" para objeto direto e "le" para indireto.',
      correct: 'Lo vi ayer. / Le di el libro.',
      trap: 'Le vi ayer (aceito na Espanha para pessoa masculina, incorreto na América).',
      why: 'Ponto em que a norma varia por região. Saber qual norma se está usando é parte da proficiência.',
    },
    {
      title: 'Subjuntivo em orações concessivas',
      rule: 'Aunque + subjuntivo quando o fato é hipotético ou já sabido e minimizado.',
      correct: 'Aunque llueva, saldré.',
      trap: 'Aunque llueve, saldré (muda o sentido para "embora esteja chovendo").',
      why: 'A escolha entre indicativo e subjuntivo aqui não é estilo: muda o que a frase afirma sobre a realidade.',
    },
    {
      title: 'Conectores de argumentação',
      rule: 'No obstante, por consiguiente e de ahí que organizam o texto formal.',
      correct: 'De ahí que sea necesario revisarlo.',
      trap: 'De ahí que es necesario revisarlo.',
      why: '"De ahí que" exige subjuntivo — detalhe que separa texto acadêmico correto de texto quase correto.',
    },
  ],
  C2: [
    {
      title: 'Futuro de probabilidade',
      rule: 'O futuro expressa suposição sobre o presente.',
      correct: 'Serán las tres. (Devem ser três horas.)',
      trap: 'Deben ser las tres (correto, mas menos idiomático).',
      why: 'Uso muito frequente na fala nativa e quase ausente no espanhol de estrangeiros — reconhecê-lo muda a compreensão auditiva.',
    },
    {
      title: 'Subjuntivo pluscuamperfecto',
      rule: 'Hubiera/hubiese + particípio para o irreal no passado.',
      correct: 'Si hubiera sabido, habría venido.',
      trap: 'Si sabría, habría venido.',
      why: 'É a estrutura do arrependimento, onipresente em narrativa. Errá-la denuncia nível intermediário.',
    },
    {
      title: 'Registro e atenuação',
      rule: 'O espanhol formal atenua com condicional e imperfeito de cortesia.',
      correct: 'Querría hacerle una consulta. / Quería preguntarle algo.',
      trap: 'Quiero preguntarle algo.',
      why: 'O presente soa abrupto em contexto formal. A atenuação é gramatical, não apenas lexical.',
    },
  ],
};

/* ================================================================== *
 * Francês
 * ================================================================== */

const FR: GrammarMap = {
  A1: [
    {
      title: 'Idade com "avoir"',
      rule: 'A idade se diz com "avoir", como em português.',
      correct: "J'ai 25 ans.",
      trap: 'Je suis 25 ans.',
      why: 'Quem já estudou inglês transfere o "I am 25" e erra. O francês, aqui, concorda com o português.',
    },
    {
      title: 'Negação em duas partes',
      rule: 'A negação usa "ne… pas" cercando o verbo.',
      correct: 'Je ne comprends pas.',
      trap: 'Je comprends pas (fala informal) / Je ne comprends.',
      why: 'A negação francesa é descontínua, sem paralelo em português. Na fala o "ne" cai, mas na escrita é obrigatório.',
    },
    {
      title: 'Artigo partitivo',
      rule: 'Diante de quantidade indeterminada, usa-se du, de la, des.',
      correct: 'Je bois du café.',
      trap: 'Je bois café.',
      why: 'O português dispensa artigo ("bebo café"); o francês o exige, e omiti-lo soa telegráfico.',
    },
  ],
  A2: [
    {
      title: 'Passé composé: avoir ou être',
      rule: 'A maioria usa "avoir"; verbos de movimento e pronominais usam "être" e concordam.',
      correct: 'Elle est allée au marché.',
      trap: 'Elle a allé au marché.',
      why: 'O português usa só "ter" no composto. A lista de verbos com "être" precisa ser memorizada.',
    },
    {
      title: 'Adjetivos: posição e concordância',
      rule: 'A maioria vem depois do substantivo e concorda em gênero e número.',
      correct: 'une voiture rouge, des idées intéressantes',
      trap: 'une rouge voiture',
      why: 'A ordem é como em português, mas um grupo pequeno e frequente (grand, petit, bon, beau) vem antes — e muda de sentido se mudar de lugar.',
    },
    {
      title: 'Pronomes complemento',
      rule: 'Os pronomes vêm antes do verbo conjugado.',
      correct: 'Je le vois. / Je lui parle.',
      trap: 'Je vois le.',
      why: 'O português brasileiro coloca o pronome depois ("vejo ele"); o francês nunca faz isso.',
    },
  ],
  B1: [
    {
      title: 'Imparfait x passé composé',
      rule: 'Imparfait para cenário e hábito; passé composé para o evento.',
      correct: 'Il pleuvait quand je suis sorti.',
      trap: 'Il a plu quand je sortais.',
      why: 'A oposição é igual à do português, mas os franceses a aplicam com mais rigor na narrativa escrita.',
    },
    {
      title: 'Subjonctif depois de expressões de vontade',
      rule: 'Il faut que, vouloir que e bien que pedem subjuntivo.',
      correct: 'Il faut que tu viennes.',
      trap: 'Il faut que tu viens.',
      why: 'A regra existe em português, mas as formas do subjuntivo francês são irregulares e pouco audíveis, o que faz o aluno evitá-las.',
    },
    {
      title: 'Pronomes "y" e "en"',
      rule: '"Y" substitui complemento com "à"; "en" substitui complemento com "de".',
      correct: "J'y pense. / J'en ai deux.",
      trap: 'Je pense à ça sempre por extenso.',
      why: 'Não há equivalente direto em português, e evitar esses pronomes é o que mais deixa o francês de estrangeiro pesado.',
    },
  ],
  B2: [
    {
      title: 'Concordância do particípio com COD antecipado',
      rule: 'Com "avoir", o particípio concorda se o objeto direto vier antes.',
      correct: 'Les lettres que j’ai écrites.',
      trap: 'Les lettres que j’ai écrit.',
      why: 'Regra invisível na fala e obrigatória na escrita — é o item clássico do ditado escolar francês.',
    },
    {
      title: 'Conditionnel de informação não confirmada',
      rule: 'O condicional relata algo não confirmado, sobretudo no jornalismo.',
      correct: 'Le ministre aurait démissionné.',
      trap: 'Le ministre a démissionné (afirma como fato).',
      why: 'Muda o compromisso do falante com a verdade da frase. Ignorar isso é ler notícia errado.',
    },
    {
      title: 'Discurso indireto e concordância',
      rule: 'O presente vira imparfait; o passé composé vira plus-que-parfait.',
      correct: "Il a dit qu'il était fatigué.",
      trap: "Il a dit qu'il est fatigué.",
      why: 'O francês escrito exige o recuo, ao contrário do português falado.',
    },
  ],
  C1: [
    {
      title: 'Subjonctif passé',
      rule: 'Para ação anterior à do verbo principal dentro do subjuntivo.',
      correct: 'Je doute qu’il soit venu.',
      trap: 'Je doute qu’il est venu.',
      why: 'A anterioridade dentro do subjuntivo é sistematicamente perdida por estrangeiros.',
    },
    {
      title: 'Inversão em registro formal',
      rule: 'Na escrita cuidada, certos advérbios iniciais pedem inversão.',
      correct: 'Peut-être viendra-t-il demain.',
      trap: 'Peut-être il viendra demain.',
      why: 'A forma sem inversão não é errada na fala, mas destoa em texto formal.',
    },
    {
      title: 'Articulação do argumento',
      rule: 'Or, dès lors, en revanche e néanmoins estruturam o texto argumentativo.',
      correct: 'Or, les données disent le contraire.',
      trap: 'Mais, les données disent le contraire.',
      why: '"Or" introduz um dado que vira o argumento — não é sinônimo de "mais". A dissertação francesa se organiza em torno desses conectores.',
    },
  ],
  C2: [
    {
      title: 'Passé simple',
      rule: 'Tempo exclusivo da narrativa literária e histórica.',
      correct: 'Il entra, regarda autour de lui et sortit.',
      trap: 'Usar passé simple na conversa.',
      why: 'Ninguém fala assim, mas todo romance é escrito assim. Sem reconhecê-lo, a literatura fica inacessível.',
    },
    {
      title: 'Subjonctif imparfait',
      rule: 'Forma literária de concordância no passado.',
      correct: "Il fallait qu'il vînt.",
      trap: 'Usá-la em contexto contemporâneo comum.',
      why: 'Praticamente extinta na fala, viva em textos clássicos e em registro irônico. Reconhecer é obrigatório; produzir, opcional.',
    },
    {
      title: 'Nuance de registro',
      rule: 'A mesma ideia muda de nível pela escolha lexical e sintática.',
      correct: 'Je vous saurais gré de bien vouloir…',
      trap: 'Je veux que vous fassiez…',
      why: 'O francês tem gradação de formalidade mais marcada que o português. Errar o nível soa grosseiro mesmo com gramática correta.',
    },
  ],
};

/* ================================================================== *
 * Italiano
 * ================================================================== */

const IT: GrammarMap = {
  A1: [
    {
      title: 'Artigos definidos',
      rule: 'A forma do artigo depende do som que inicia a palavra.',
      correct: 'lo studente, il ragazzo, gli amici',
      trap: 'il studente',
      why: 'Palavras que começam com s + consoante, z, ps e gn pedem "lo/gli". Não há regra equivalente em português.',
    },
    {
      title: 'Idade com "avere"',
      rule: 'A idade usa "avere", como em português.',
      correct: 'Ho 25 anni.',
      trap: 'Sono 25 anni.',
      why: 'Erro típico de quem chega ao italiano pelo inglês.',
    },
    {
      title: 'Concordância de gênero e número',
      rule: 'Adjetivos concordam com o substantivo, e o plural muda a vogal final.',
      correct: 'i libri rossi, le case bianche',
      trap: 'i libros rossos',
      why: 'O italiano não forma plural com -s. A interferência do português e do espanhol é imediata.',
    },
  ],
  A2: [
    {
      title: 'Passato prossimo: essere ou avere',
      rule: 'Verbos de movimento e reflexivos usam "essere" e concordam com o sujeito.',
      correct: 'Lei è andata al mercato.',
      trap: 'Lei ha andato al mercato.',
      why: 'Como no francês, exige memorizar a lista — o português usa só "ter".',
    },
    {
      title: 'Pronomes átonos',
      rule: 'Os pronomes vêm antes do verbo conjugado e se juntam ao infinitivo.',
      correct: 'Lo vedo. / Voglio vederlo.',
      trap: 'Vedo lo.',
      why: 'A colocação é fixa e não segue a liberdade do português brasileiro.',
    },
    {
      title: 'Preposições articuladas',
      rule: 'Preposição + artigo se fundem: a + il = al, di + la = della.',
      correct: 'Vado al cinema con gli amici della scuola.',
      trap: 'Vado a il cinema.',
      why: 'O português também contrai, mas o inventário italiano é maior e obrigatório em todos os casos.',
    },
  ],
  B1: [
    {
      title: 'Imperfetto x passato prossimo',
      rule: 'Imperfetto descreve; passato prossimo narra o acontecimento.',
      correct: 'Pioveva quando sono uscito.',
      trap: 'Ha piovuto quando uscivo.',
      why: 'Paralelo ao português, mas o italiano usa o passato prossimo onde o português usaria o perfeito simples.',
    },
    {
      title: 'Congiuntivo depois de opinião',
      rule: 'Penso che, credo che e sembra che pedem congiuntivo.',
      correct: 'Penso che sia giusto.',
      trap: 'Penso che è giusto.',
      why: 'O português brasileiro usa indicativo nesse contexto ("acho que é justo"), e a transferência é automática.',
    },
    {
      title: 'Ci e ne',
      rule: '"Ci" retoma lugar e complemento com "a"; "ne" retoma complemento com "di" e quantidade.',
      correct: 'Ci vado domani. / Ne voglio due.',
      trap: 'Vado là domani, sempre por extenso.',
      why: 'Sem esses clíticos, o italiano soa artificial. São de altíssima frequência na fala.',
    },
  ],
  B2: [
    {
      title: 'Periodo ipotetico da irrealidade',
      rule: 'Se + congiuntivo imperfetto, seguido de condizionale.',
      correct: 'Se avessi tempo, viaggerei.',
      trap: 'Se avrei tempo, viaggerei.',
      why: 'O condicional nunca entra depois de "se". Mesmo erro estrutural do espanhol.',
    },
    {
      title: 'Concordância do particípio com pronome',
      rule: 'Com pronome de objeto direto, o particípio concorda.',
      correct: 'Le ho viste.',
      trap: 'Le ho visto.',
      why: 'Detalhe audível: muda a vogal final e marca imediatamente o nível do falante.',
    },
    {
      title: 'Futuro de suposição',
      rule: 'O futuro expressa hipótese sobre o presente.',
      correct: 'Saranno le tre.',
      trap: 'Traduzir sempre como futuro real.',
      why: 'Frequentíssimo na fala. Interpretar literalmente leva a mal-entendidos.',
    },
  ],
  C1: [
    {
      title: 'Congiuntivo trapassato',
      rule: 'Para o irreal no passado, com "avessi/fossi" + particípio.',
      correct: 'Se avessi saputo, sarei venuto.',
      trap: 'Se sapevo, venivo (aceito na fala coloquial, não na escrita).',
      why: 'A forma coloquial existe e é comum, mas em texto formal denuncia registro baixo.',
    },
    {
      title: 'Passato remoto',
      rule: 'Passado concluído e distante, vivo no sul e na literatura.',
      correct: 'Dante nacque a Firenze.',
      trap: 'Dante è nato a Firenze (aceitável, mas menos idiomático em texto histórico).',
      why: 'Corresponde bem ao perfeito simples do português, o que facilita — mas o uso regional precisa ser conhecido.',
    },
    {
      title: 'Conectores textuais',
      rule: 'Tuttavia, pertanto, anzi e semmai organizam o texto formal.',
      correct: 'Non è tardi, anzi è presto.',
      trap: 'Usar "ma" para tudo.',
      why: '"Anzi" corrige e intensifica ao mesmo tempo — não tem tradução única em português.',
    },
  ],
  C2: [
    {
      title: 'Forma passiva com "andare"',
      rule: '"Andare" + particípio expressa passiva com valor de obrigação.',
      correct: 'Il modulo va compilato entro venerdì.',
      trap: 'Il modulo deve essere compilato (correto, mas menos idiomático).',
      why: 'Construção muito usada em texto normativo e instruções; reconhecê-la é essencial em contexto profissional.',
    },
    {
      title: 'Dislocazione',
      rule: 'O italiano falado antecipa o tema e o retoma com clítico.',
      correct: 'Il libro, l’ho già letto.',
      trap: 'Ho già letto il libro (correto, mas neutro).',
      why: 'A dislocação é a marca da fala nativa. O português brasileiro faz algo parecido, o que ajuda — mas o clítico é obrigatório.',
    },
    {
      title: 'Registro e ironia',
      rule: 'Diminutivos e alterados carregam avaliação, não tamanho.',
      correct: 'Che problemino! (irônico: problema grande)',
      trap: 'Ler o diminutivo como tamanho literal.',
      why: 'O sistema de alterados italiano é riquíssimo e a leitura literal inverte o sentido.',
    },
  ],
};

/* ================================================================== *
 * Alemão
 * ================================================================== */

const DE: GrammarMap = {
  A1: [
    {
      title: 'Verbo em segunda posição',
      rule: 'Na oração principal o verbo conjugado ocupa sempre a segunda posição.',
      correct: 'Heute gehe ich ins Kino.',
      trap: 'Heute ich gehe ins Kino.',
      why: 'O português tem ordem livre; o alemão fixa o verbo em segundo lugar, mesmo com outro elemento à frente.',
    },
    {
      title: 'Gênero e artigo',
      rule: 'Todo substantivo tem gênero, e ele não segue o do português.',
      correct: 'das Mädchen (a menina), der Tisch (a mesa)',
      trap: 'die Mädchen, die Tisch',
      why: 'O gênero é lexical, não semântico. Aprender substantivo sem artigo é aprender pela metade.',
    },
    {
      title: 'Substantivos com maiúscula',
      rule: 'Todo substantivo se escreve com inicial maiúscula.',
      correct: 'Der Hund läuft im Park.',
      trap: 'Der hund läuft im park.',
      why: 'Regra sem paralelo em português e frequentemente esquecida na escrita.',
    },
  ],
  A2: [
    {
      title: 'Acusativo e dativo',
      rule: 'O caso muda o artigo: objeto direto em acusativo, indireto em dativo.',
      correct: 'Ich gebe dem Mann das Buch.',
      trap: 'Ich gebe der Mann das Buch.',
      why: 'O português marca a função pela preposição e pela ordem; o alemão a marca no artigo, e a ordem fica livre por causa disso.',
    },
    {
      title: 'Verbos separáveis',
      rule: 'O prefixo se desloca para o fim da oração.',
      correct: 'Ich stehe um sieben Uhr auf.',
      trap: 'Ich aufstehe um sieben Uhr.',
      why: 'Não existe equivalente em português. O sentido do verbo só se completa no fim da frase.',
    },
    {
      title: 'Perfekt com haben ou sein',
      rule: 'Verbos de movimento e mudança de estado usam "sein".',
      correct: 'Ich bin nach Berlin gefahren.',
      trap: 'Ich habe nach Berlin gefahren.',
      why: 'Mesma armadilha do francês e do italiano, agravada porque o alemão usa o Perfekt onde o português usaria o passado simples.',
    },
  ],
  B1: [
    {
      title: 'Ordem na oração subordinada',
      rule: 'Depois de weil, dass, wenn e ob, o verbo vai para o fim.',
      correct: 'Ich bleibe zu Hause, weil es regnet.',
      trap: 'Ich bleibe zu Hause, weil es regnet nicht… (verbo antes do fim)',
      why: 'É a diferença estrutural mais visível entre alemão e português, e a que mais exige reprogramar a produção oral.',
    },
    {
      title: 'Declinação do adjetivo',
      rule: 'A terminação do adjetivo depende do artigo, do gênero e do caso.',
      correct: 'ein guter Wein / der gute Wein',
      trap: 'ein gute Wein',
      why: 'Não há nada parecido em português. É o item que mais consome tempo de estudo em B1.',
    },
    {
      title: 'Preposições com caso fixo',
      rule: 'Cada preposição rege um caso: mit + dativo, für + acusativo.',
      correct: 'Ich fahre mit dem Bus für meinen Vater.',
      trap: 'Ich fahre mit den Bus.',
      why: 'A regência é arbitrária e precisa ser memorizada com a preposição, nunca depois.',
    },
  ],
  B2: [
    {
      title: 'Konjunktiv II',
      rule: 'Para hipótese e cortesia, com "würde" ou a forma própria do verbo.',
      correct: 'Wenn ich Zeit hätte, würde ich reisen.',
      trap: 'Wenn ich Zeit habe, würde ich reisen.',
      why: 'Confundir Konjunktiv com presente transforma hipótese em plano real — muda o sentido, não só a forma.',
    },
    {
      title: 'Passiva',
      rule: '"werden" + particípio; o agente entra com "von".',
      correct: 'Der Bericht wurde vom Team geschrieben.',
      trap: 'Der Bericht war vom Team geschrieben (isso é estado, não ação).',
      why: 'Alemão distingue passiva de processo (werden) e de estado (sein). O português não faz essa distinção.',
    },
    {
      title: 'Orações relativas',
      rule: 'O pronome relativo concorda em gênero e número e recebe caso da própria oração.',
      correct: 'Der Mann, dem ich geholfen habe, ist mein Nachbar.',
      trap: 'Der Mann, den ich geholfen habe…',
      why: '"Helfen" rege dativo, então o relativo é "dem". A regência do verbo decide o caso do relativo.',
    },
  ],
  C1: [
    {
      title: 'Konjunktiv I no discurso indireto',
      rule: 'A imprensa relata declarações com Konjunktiv I.',
      correct: 'Er sagte, er sei müde.',
      trap: 'Er sagte, er ist müde.',
      why: 'Marca que o falante apenas relata, sem se comprometer com a verdade. Indispensável para ler jornal alemão.',
    },
    {
      title: 'Nominalização',
      rule: 'O registro formal converte verbos em substantivos.',
      correct: 'nach Beendigung des Projekts',
      trap: 'nachdem das Projekt beendet wurde (correto, porém menos formal).',
      why: 'O alemão administrativo e acadêmico é fortemente nominal. Sem isso, o texto soa oral.',
    },
    {
      title: 'Partículas modais',
      rule: 'doch, ja, mal e eben carregam atitude, não conteúdo.',
      correct: 'Komm doch mal vorbei!',
      trap: 'Komm vorbei! (correto, mas seco)',
      why: 'São intraduzíveis palavra a palavra e são o que faz o alemão soar humano em vez de robótico.',
    },
  ],
  C2: [
    {
      title: 'Particípio atributivo estendido',
      rule: 'Uma oração inteira pode ser comprimida antes do substantivo.',
      correct: 'die im letzten Jahr veröffentlichte Studie',
      trap: 'die Studie, die im letzten Jahr veröffentlicht wurde (correto, porém menos denso).',
      why: 'Estrutura típica do alemão acadêmico. Sem reconhecê-la, a leitura técnica trava.',
    },
    {
      title: 'Funktionsverbgefüge',
      rule: 'Construções fixas verbo + substantivo do registro formal.',
      correct: 'zur Verfügung stellen, in Betracht ziehen',
      trap: 'geben, denken (semanticamente próximos, estilisticamente errados).',
      why: 'São colocações rígidas. Trocar o verbo produz frase compreensível e inequivocamente estrangeira.',
    },
    {
      title: 'Ordem dos complementos',
      rule: 'No campo central, a informação conhecida vem antes da nova.',
      correct: 'Ich habe ihm das Buch gestern gegeben.',
      trap: 'Ich habe gestern das Buch ihm gegeben.',
      why: 'A ordem é gramaticalmente livre, mas informacionalmente rígida. É o último nível de naturalidade em alemão.',
    },
  ],
};

/* ================================================================== *
 * Registro
 * ================================================================== */

const GRAMMAR_SYLLABUS: Record<LanguageCode, GrammarMap> = {
  en: EN,
  es: ES,
  fr: FR,
  it: IT,
  de: DE,
};

/** Pontos de gramática de um idioma num nível. Lista vazia quando não houver. */
export function grammarPoints(language: LanguageCode, level: CefrLevel): GrammarPoint[] {
  return GRAMMAR_SYLLABUS[language]?.[level] ?? [];
}

/** Total de pontos catalogados — usado em documentação e testes. */
export function grammarPointCount(): number {
  return Object.values(GRAMMAR_SYLLABUS).reduce(
    (total, map) =>
      total + Object.values(map).reduce((sum, points) => sum + (points?.length ?? 0), 0),
    0,
  );
}

export { GRAMMAR_SYLLABUS };
