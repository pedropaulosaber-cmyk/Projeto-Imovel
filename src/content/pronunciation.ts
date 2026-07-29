/**
 * Guia de pronúncia por idioma
 * =============================
 *
 * ## Por que isto não é uma tabela de fonemas
 *
 * O aluno brasileiro não precisa saber que o inglês tem 24 consoantes. Precisa
 * saber **por que o interlocutor não entendeu** quando ele disse "beach". As
 * notas abaixo partem sempre do som que o português **não tem** ou usa de outro
 * jeito — que é onde a comunicação falha de verdade.
 *
 * Cada nota tem três partes:
 *  - `sound`   — o som ou padrão, com exemplo escrito.
 *  - `problem` — o que o falante de português faz por transferência.
 *  - `fix`     — uma instrução física executável ("a língua encosta aqui"),
 *                não uma descrição abstrata. Ninguém corrigiu a própria
 *                pronúncia lendo "vogal anterior fechada não arredondada".
 *
 * ## Progressão
 *
 * As notas são ordenadas por **custo de mal-entendido**: primeiro o que muda o
 * significado da palavra, depois o que só marca sotaque. Os níveis iniciais
 * recebem as primeiras; os avançados chegam às de entonação e ritmo, que são o
 * que separa "compreensível" de "natural".
 */

import type { CefrLevel, LanguageCode } from '@/domain/types';

export type PronunciationNote = {
  sound: string;
  problem: string;
  fix: string;
};

const NOTES: Record<LanguageCode, PronunciationNote[]> = {
  en: [
    {
      sound: 'A diferença entre /iː/ e /ɪ/ — "beach" x "bitch", "sheet" x "shit"',
      problem:
        'O português tem um só "i". Os dois viram a mesma coisa, e o resultado pode ser constrangedor.',
      fix: 'Para /iː/, estique o som e sorria; para /ɪ/, relaxe a boca e encurte — é quase um "e" preguiçoso.',
    },
    {
      sound: 'O "th" — think, this',
      problem: 'Vira "f", "t" ou "d": "free" no lugar de "three", "dis" no lugar de "this".',
      fix: 'Ponta da língua entre os dentes e sopre. Exagere no treino: na fala rápida vai suavizar sozinho.',
    },
    {
      sound: 'Consoante final — "cat", "book", "stopped"',
      problem: 'O português adiciona uma vogal: "kate", "bookie", "stoppedi".',
      fix: 'Termine a palavra fechando a boca. Grave-se dizendo "cat" e ouça se sobrou um "i" no fim.',
    },
    {
      sound: 'O schwa /ə/ — a vogal fraca de "about", "sofa", "problem"',
      problem:
        'Brasileiros pronunciam todas as vogais com clareza, o que soa robótico e lento.',
      fix: 'Em sílaba sem acento, reduza a vogal a um murmúrio. "Banana" em inglês tem uma vogal clara, não três.',
    },
    {
      sound: 'Ritmo acentual',
      problem:
        'O português dá tempo parecido a cada sílaba; o inglês espreme as átonas entre as tônicas.',
      fix: 'Bata palma só nas sílabas fortes e encaixe o resto no intervalo. É assim que a fala nativa soa.',
    },
    {
      sound: 'Entonação de pergunta',
      problem: 'Subir a voz no fim de tudo faz perguntas fechadas soarem inseguras.',
      fix: 'Perguntas com "wh-" descem no fim; só as de sim/não sobem.',
    },
  ],
  es: [
    {
      sound: 'O "r" forte — "perro", "rojo"',
      problem:
        'O "r" carioca ou paulista não existe em espanhol; vira um som gutural estranho ao ouvido nativo.',
      fix: 'Vibre a ponta da língua no céu da boca, como o "r" caipira de "porta".',
    },
    {
      sound: 'Vogais puras — sempre cinco sons',
      problem:
        'O português tem vogais abertas, fechadas e nasais. Em espanhol, "e" é sempre "e".',
      fix: 'Nunca nasalize: "también" termina com "n" pronunciado, não com vogal nasal.',
    },
    {
      sound: 'A ausência de vogal nasal',
      problem: '"Bien" vira "biém", "con" vira "cõ".',
      fix: 'Feche a boca no "n" e deixe o som sair pela boca, não pelo nariz.',
    },
    {
      sound: 'O "j" e o "g" — "jamón", "gente"',
      problem: 'Vira o "j" do português, que é um som completamente diferente.',
      fix: 'É um sopro na garganta, próximo do "rr" carioca de "carro".',
    },
    {
      sound: 'O "d" entre vogais — "nada", "cada"',
      problem:
        'O brasileiro pronuncia como "d" pleno; o espanhol suaviza quase até o "th" inglês.',
      fix: 'Deixe a língua tocar de leve os dentes, sem travar o ar.',
    },
    {
      sound: 'Ritmo silábico rápido',
      problem:
        'O espanhol dá tempo igual às sílabas e fala rápido, o que dificulta a compreensão.',
      fix: 'Pratique sem pausas entre palavras: "¿cómo estás?" sai como um bloco só.',
    },
  ],
  fr: [
    {
      sound: 'O "u" de "tu" — /y/',
      problem: 'Vira "u" comum, e "tu" fica igual a "tout".',
      fix: 'Boca de "u", língua na posição de "i". Diga "i" e arredonde os lábios sem mexer a língua.',
    },
    {
      sound: 'O "r" francês',
      problem: 'Vira o "r" do português ou desaparece.',
      fix: 'É produzido no fundo da garganta, como um leve gargarejo. Comece por "grand" e "rouge".',
    },
    {
      sound: 'Vogais nasais — "vin", "bon", "blanc"',
      problem: 'Aqui o brasileiro leva vantagem, mas confunde os três entre si.',
      fix: 'São três nasais distintas. Treine em trio: "vin, vent, vont".',
    },
    {
      sound: 'Consoantes finais mudas — "petit", "beaucoup"',
      problem: 'Pronunciar o "t" e o "p" finais denuncia o estrangeiro na primeira frase.',
      fix: 'Regra prática: consoante final não se lê, exceto C, R, F e L.',
    },
    {
      sound: 'Liaison — "les amis" soa "lezami"',
      problem: 'Separar as palavras torna a fala entrecortada e difícil de entender.',
      fix: 'Emende a consoante final na vogal seguinte. O francês é falado em blocos, não em palavras.',
    },
    {
      sound: 'Acento na última sílaba',
      problem:
        'O brasileiro acentua onde acentuaria em português, mudando o ritmo da frase inteira.',
      fix: 'Em francês, a força vai sempre no fim do grupo de palavras.',
    },
  ],
  it: [
    {
      sound: 'Consoantes duplas — "nonno" x "nono"',
      problem: 'A duplicação muda o significado, e o brasileiro simplesmente não a produz.',
      fix: 'Segure a consoante por um tempo audível: "non-no". Vale exagerar no treino.',
    },
    {
      sound: 'Vogais sempre abertas e claras',
      problem: 'O português reduz vogais átonas; o italiano pronuncia todas.',
      fix: '"Telefono" tem quatro vogais claras, nenhuma engolida.',
    },
    {
      sound: 'O "gli" — "famiglia"',
      problem: 'Vira "gl" ou "li", que soam errados.',
      fix: 'Língua no céu da boca, como o "lh" de "filha".',
    },
    {
      sound: 'O "c" e o "g" antes de e/i — "cena", "gelato"',
      problem: 'Pronunciados como em português, viram "s" e "j".',
      fix: 'São "tch" e "dj": "tchena", "djelato".',
    },
    {
      sound: 'Ausência de nasalização',
      problem: '"Bene" vira "bêne".',
      fix: 'Pronuncie o "n" com a língua, sem deixar o ar subir pelo nariz.',
    },
    {
      sound: 'Ritmo e melodia',
      problem: 'Falar italiano com entonação plana perde metade da mensagem.',
      fix: 'O italiano varia muito de altura dentro da frase. Imite a melodia antes de acertar os sons.',
    },
  ],
  de: [
    {
      sound: 'O "ü" e o "ö"',
      problem: 'Viram "u" e "o", o que muda a palavra: "schwül" x "schwul".',
      fix: 'Para "ü", diga "i" e arredonde os lábios. Para "ö", diga "e" e arredonde.',
    },
    {
      sound: 'O "ch" — dois sons diferentes',
      problem: 'O brasileiro usa um só ou troca por "k".',
      fix: 'Depois de a/o/u é gutural ("Bach"); depois de e/i é suave, como um "h" muito sibilado ("ich").',
    },
    {
      sound: 'O "r" alemão',
      problem: 'Vira o "r" do português em toda posição.',
      fix: 'No início é gutural; no fim da sílaba vira quase uma vogal: "Vater" soa "Fata".',
    },
    {
      sound: 'Consoantes finais ensurdecidas',
      problem: '"Tag" pronunciado com "g" no fim soa estrangeiro.',
      fix: 'B, D e G no fim da palavra viram P, T e K: "Tag" soa "Tak".',
    },
    {
      sound: 'Ataque glotal',
      problem: 'Emendar as palavras, hábito do português, torna a fala confusa em alemão.',
      fix: 'Palavra iniciada por vogal recebe uma pequena pausa antes: "am ˀAbend".',
    },
    {
      sound: 'Acento na primeira sílaba',
      problem: 'Acentuar no lugar errado dificulta muito o reconhecimento.',
      fix: 'Palavras alemãs têm força na primeira sílaba, salvo prefixos átonos (be-, ge-, ver-).',
    },
  ],
  ja: [
    {
      sound: 'Ritmo por mora, não por sílaba',
      problem: 'O brasileiro comprime as sílabas; em japonês cada mora tem a mesma duração.',
      fix: 'Bata uma palma por mora: と-う-きょ-う são quatro tempos, não dois.',
    },
    {
      sound: 'Vogal longa muda a palavra — おじさん x おじいさん',
      problem: 'Encurtar a vogal troca "tio" por "avô".',
      fix: 'Segure a vogal por dois tempos completos. É duração, não intensidade.',
    },
    {
      sound: 'O "r" japonês',
      problem: 'Vira "r" ou "l" do português; é nenhum dos dois.',
      fix: 'Um toque rápido da língua no céu da boca, como o "r" de "para" falado depressa.',
    },
    {
      sound: 'Vogais mudas — です soa "des"',
      problem: 'Pronunciar o "u" final soa artificial e livresco.',
      fix: 'O "u" e o "i" entre consoantes surdas quase desaparecem: すき soa "ski".',
    },
    {
      sound: 'Acento de altura (pitch)',
      problem: 'はし pode ser ponte, hashi ou borda conforme a altura da voz.',
      fix: 'Não é força, é altura. Imite a melodia do áudio antes de se preocupar com os sons.',
    },
    {
      sound: 'Ausência de entonação ascendente',
      problem: 'Subir a voz no fim de tudo soa infantil.',
      fix: 'A pergunta é marcada por か, não pela entonação.',
    },
  ],
  ko: [
    {
      sound: 'Três séries de consoantes — ㄱ / ㄲ / ㅋ',
      problem: 'O português tem uma só. As três viram "k", e as palavras se confundem.',
      fix: 'ㄱ é suave, ㄲ é tensa (garganta apertada) e ㅋ é aspirada (sopro forte). Teste com a mão na frente da boca.',
    },
    {
      sound: 'ㅓ x ㅗ — 어 e 오',
      problem: 'Ambos viram "ó".',
      fix: '어 é boca relaxada e aberta; 오 é boca arredondada. 서울 não é "Soul".',
    },
    {
      sound: 'Consoante final não explode — 밥',
      problem: 'O brasileiro solta o ar e adiciona vogal: "bapi".',
      fix: 'Feche os lábios no "p" e pare. O som fica preso.',
    },
    {
      sound: 'Assimilação — 신라 soa "실라"',
      problem: 'Ler letra por letra torna a fala incompreensível.',
      fix: 'Consoantes vizinhas se influenciam. Aprenda as combinações mais comuns como blocos.',
    },
    {
      sound: 'O ㅡ',
      problem: 'Não existe em português e vira "u".',
      fix: 'Boca em posição de "u" mas sem arredondar os lábios — quase um grunhido.',
    },
    {
      sound: 'Entonação plana',
      problem: 'A melodia do português brasileiro soa exagerada em coreano.',
      fix: 'A frase coreana varia pouco de altura. Contenha a melodia.',
    },
  ],
  zh: [
    {
      sound: 'Os quatro tons',
      problem:
        'O brasileiro usa altura para emoção, não para significado — e troca as palavras sem perceber.',
      fix: '1º alto e plano, 2º sobe, 3º desce e sobe, 4º cai seco. Treine mā má mǎ mà até sair sem pensar.',
    },
    {
      sound: 'Tom neutro',
      problem: 'Pronunciar a última sílaba com tom pleno soa mecânico.',
      fix: 'Partículas como 了, 的 e 吗 são leves e curtas, sem tom marcado.',
    },
    {
      sound: 'zh / ch / sh — retroflexos',
      problem: 'Viram "j", "tch" e "x" do português.',
      fix: 'Enrole a ponta da língua para trás antes de produzir o som.',
    },
    {
      sound: 'j / q / x',
      problem: 'Confundidos com os retroflexos acima.',
      fix: 'Aqui a língua fica plana e à frente, com os lábios esticados. 西 não é "shi".',
    },
    {
      sound: 'O "ü" — 女, 绿',
      problem: 'Vira "u" comum.',
      fix: 'Mesmo som do francês: diga "i" e arredonde os lábios.',
    },
    {
      sound: 'Mudança de tom (sandhi)',
      problem: 'Dois terceiros tons seguidos não se pronunciam como escritos.',
      fix: '你好 lê-se "níhǎo": o primeiro vira segundo tom. É regra fixa, vale para todos os casos.',
    },
  ],
};

/**
 * Foco de pronúncia de cada nível.
 *
 * Existe para que as seis apostilas de um idioma tragam conteúdo de pronúncia
 * **diferente**, e não a mesma lista com um item a mais. A primeira versão
 * usava uma fatia cumulativa e B2, C1 e C2 saíam idênticas — um teste que
 * compara o corpo das seções entre níveis pegou.
 *
 * A ordem também não é arbitrária: começa pelo que **muda o significado da
 * palavra** e termina em ritmo e entonação, que é o que separa "compreensível"
 * de "natural" e não faz sentido cobrar de quem ainda não forma frases.
 */
const LEVEL_FOCUS: Record<CefrLevel, string> = {
  A1: 'Nesta fase, mire só em ser entendido. Sotaque é irrelevante; trocar uma palavra por outra, não.',
  A2: 'Agora vale gravar-se. Ouvir a própria voz corrige mais rápido que qualquer explicação escrita.',
  B1: 'Você já forma frases: o alvo passa a ser a palavra dentro da frase, não a palavra isolada.',
  B2: 'Trabalhe o encadeamento. Palavras que você pronuncia bem sozinhas mudam de forma na fala corrida.',
  C1: 'Foque no ritmo. É ele, não os fonemas, que faz a fala soar estrangeira mesmo com sons corretos.',
  C2: 'Entonação e intenção. Neste ponto a pronúncia comunica atitude, não só conteúdo.',
};

/**
 * Notas de pronúncia de um nível, em janela deslizante.
 *
 * Cada nível recebe três notas, avançando uma posição por nível e dando a
 * volta no fim. Assim nenhum nível repete o conjunto de outro, e o aluno que
 * percorre o curso inteiro vê todas as notas mais de uma vez — o que é
 * desejável: pronúncia se corrige por revisita, não por leitura única.
 */
export function pronunciationNotes(
  language: LanguageCode,
  level: CefrLevel,
): PronunciationNote[] {
  const all = NOTES[language] ?? [];
  if (all.length === 0) return [];

  const index = (['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as CefrLevel[]).indexOf(level);
  const size = Math.min(3, all.length);

  return Array.from({ length: size }, (_, offset) => all[(index + offset) % all.length]).filter(
    (note): note is PronunciationNote => note !== undefined,
  );
}

/** Frase de enquadramento do nível, exibida no topo da seção. */
export function pronunciationFocus(level: CefrLevel): string {
  return LEVEL_FOCUS[level];
}

export { NOTES as PRONUNCIATION_NOTES };
