/**
 * Cenários e modos de fala do tutor
 * ==================================
 *
 * ## Dois eixos, não um
 *
 * Praticar conversa tem duas dimensões independentes, e tratá-las como uma só
 * é o erro que faz o tutor soar sempre igual:
 *
 *  - **Cenário** — *onde* a conversa acontece. Restaurante, entrevista de
 *    emprego, consulta médica. Define o vocabulário e o objetivo.
 *  - **Modo de fala** — *como* se fala. Formal, casual, sob pressão, com um
 *    interlocutor que discorda. Define o registro e a atitude.
 *
 * Um pedido de desculpas ao chefe e ao melhor amigo usam o mesmo vocabulário e
 * exigem registros opostos. Sem o segundo eixo, o aluno aprende palavras e
 * continua soando estrangeiro — ou pior, mal-educado.
 *
 * ## Por que os cenários novos cobrem os oito idiomas
 *
 * Os cenários originais em `knowledge.ts` trazem falas em cinco idiomas; nos
 * três asiáticos, o tutor caía no texto de reserva em inglês. Aqui todas as
 * falas existem nos oito, com romanização junto quando a escrita não é latina
 * — sem ela o aluno de japonês lê a fala do tutor e não consegue nem repetir.
 */

import type { LanguageCode } from '@/domain/types';
import type { ScenarioScript } from './knowledge';

/* ------------------------------------------------------------------ *
 * Modos de fala
 * ------------------------------------------------------------------ */

export type SpeakingMode = {
  id: string;
  title: string;
  description: string;
  icon: string;
  /** Como o tutor deve se comportar — vira instrução no provedor remoto. */
  tutorBehavior: string;
  /** O que o aluno treina neste modo. */
  trains: string;
};

export const SPEAKING_MODES: SpeakingMode[] = [
  {
    id: 'casual',
    title: 'Bate-papo',
    description: 'Conversa solta, como com um amigo.',
    icon: 'happy',
    tutorBehavior:
      'Fale de forma informal, use contrações e gírias comuns, interrompa às vezes e mude de assunto naturalmente.',
    trains: 'Fluidez e naturalidade. O objetivo é não travar, não é a perfeição.',
  },
  {
    id: 'formal',
    title: 'Formal',
    description: 'Registro cuidado, como numa reunião ou com quem você não conhece.',
    icon: 'briefcase',
    tutorBehavior:
      'Use tratamento formal, frases completas e vocabulário preciso. Corrija deslizes de registro, não só de gramática.',
    trains: 'Escolha de registro — o que separa "correto" de "apropriado".',
  },
  {
    id: 'pressure',
    title: 'Sob pressão',
    description: 'Respostas rápidas, sem tempo para pensar.',
    icon: 'timer',
    tutorBehavior:
      'Faça perguntas curtas em sequência, insista se a resposta demorar e não espere frases perfeitas.',
    trains:
      'Automatismo. Na conversa real ninguém espera você conjugar mentalmente — e é aí que o aluno de sala de aula trava.',
  },
  {
    id: 'debate',
    title: 'Discordância',
    description: 'Um interlocutor que discorda e pede justificativa.',
    icon: 'flash',
    tutorBehavior:
      'Discorde do aluno de forma educada mas firme, peça razões e aponte contradições no que ele disser.',
    trains: 'Sustentar uma posição — o uso mais difícil de qualquer idioma.',
  },
  {
    id: 'patient',
    title: 'Paciente',
    description: 'Ritmo lento, com reformulação sempre que preciso.',
    icon: 'heart',
    tutorBehavior:
      'Fale devagar, use frases curtas, reformule quando o aluno hesitar e confirme o entendimento com frequência.',
    trains: 'Compreensão e confiança. É o modo para quem está começando ou voltando.',
  },
  {
    id: 'roleplay',
    title: 'Personagem',
    description: 'O tutor assume um papel e mantém a ficção.',
    icon: 'people',
    tutorBehavior:
      'Assuma o papel do cenário e permaneça nele. Não saia do personagem para explicar gramática — as correções vêm no fim.',
    trains: 'Uso funcional: resolver algo no idioma, não conversar sobre o idioma.',
  },
];

export function speakingMode(id: string): SpeakingMode | null {
  return SPEAKING_MODES.find((mode) => mode.id === id) ?? null;
}

/* ------------------------------------------------------------------ *
 * Cenários adicionais, nos oito idiomas
 * ------------------------------------------------------------------ */

export const EXTRA_SCENARIOS: Record<string, ScenarioScript> = {
  airport: {
    title: 'No aeroporto',
    description: 'Check-in, bagagem, embarque e imprevisto de voo.',
    icon: 'airplane',
    minLevel: 'A1',
    fallback: 'Good morning. May I see your passport and ticket, please?',
    turns: [
      {
        en: 'Good morning. May I see your passport, please?',
        es: 'Buenos días. ¿Me permite su pasaporte, por favor?',
        fr: 'Bonjour. Votre passeport, s’il vous plaît ?',
        it: 'Buongiorno. Il passaporto, per favore?',
        de: 'Guten Morgen. Ihren Reisepass, bitte?',
        ja: 'おはようございます。パスポートをお願いします。(Ohayō gozaimasu. Pasupōto o onegai shimasu.)',
        ko: '안녕하세요. 여권 좀 보여주시겠어요? (Annyeonghaseyo. Yeogwon jom boyeojusigesseoyo?)',
        zh: '早上好。请出示您的护照。(Zǎoshang hǎo. Qǐng chūshì nín de hùzhào.)',
      },
      {
        en: 'How many bags are you checking in today?',
        es: '¿Cuántas maletas va a facturar?',
        fr: 'Combien de bagages enregistrez-vous ?',
        it: 'Quanti bagagli deve imbarcare?',
        de: 'Wie viele Gepäckstücke geben Sie auf?',
        ja: 'お預けの荷物はいくつですか。(Oazuke no nimotsu wa ikutsu desu ka.)',
        ko: '부치실 짐이 몇 개인가요? (Buchisil jimi myeot gaeingayo?)',
        zh: '您要托运几件行李？(Nín yào tuōyùn jǐ jiàn xínglǐ?)',
      },
      {
        en: 'I am sorry, your flight is delayed by two hours.',
        es: 'Lo siento, su vuelo tiene un retraso de dos horas.',
        fr: 'Je suis désolé, votre vol a deux heures de retard.',
        it: 'Mi dispiace, il suo volo è in ritardo di due ore.',
        de: 'Es tut mir leid, Ihr Flug hat zwei Stunden Verspätung.',
        ja: '申し訳ありません。ご搭乗便は二時間遅れています。(Mōshiwake arimasen. Gotōjōbin wa nijikan okurete imasu.)',
        ko: '죄송합니다. 항공편이 두 시간 지연됐습니다. (Joesonghamnida. Hanggongpyeoni du sigan jiyeondwaetseumnida.)',
        zh: '很抱歉，您的航班延误两个小时。(Hěn bàoqiàn, nín de hángbān yánwù liǎng gè xiǎoshí.)',
      },
      {
        en: 'Your gate is B12. Boarding starts at eleven. Have a good flight!',
        es: 'Su puerta es la B12. El embarque empieza a las once. ¡Buen viaje!',
        fr: 'Votre porte est la B12. L’embarquement commence à onze heures. Bon voyage !',
        it: 'Il suo gate è il B12. L’imbarco inizia alle undici. Buon viaggio!',
        de: 'Ihr Gate ist B12. Das Boarding beginnt um elf. Guten Flug!',
        ja: 'ゲートはB12です。搭乗は十一時からです。良いご旅行を。(Gēto wa B12 desu. Tōjō wa jūichi-ji kara desu.)',
        ko: '게이트는 B12입니다. 탑승은 열한 시부터입니다. 좋은 여행 되세요. (Geiteuneun B12imnida.)',
        zh: '您的登机口是B12，十一点开始登机。祝您旅途愉快。(Nín de dēngjīkǒu shì B12.)',
      },
    ],
  },

  doctor: {
    title: 'Na consulta médica',
    description: 'Explicar sintomas e entender o tratamento.',
    icon: 'medkit',
    minLevel: 'A2',
    fallback: 'Hello. What brings you in today?',
    turns: [
      {
        en: 'Hello. What brings you in today?',
        es: 'Hola. ¿Qué le trae por aquí?',
        fr: 'Bonjour. Qu’est-ce qui vous amène ?',
        it: 'Buongiorno. Cosa la porta qui oggi?',
        de: 'Guten Tag. Was führt Sie zu mir?',
        ja: 'こんにちは。今日はどうされましたか。(Konnichiwa. Kyō wa dō saremashita ka.)',
        ko: '안녕하세요. 어디가 불편하세요? (Annyeonghaseyo. Eodiga bulpyeonhaseyo?)',
        zh: '您好，哪里不舒服？(Nín hǎo, nǎlǐ bù shūfu?)',
      },
      {
        en: 'How long have you had these symptoms?',
        es: '¿Desde cuándo tiene estos síntomas?',
        fr: 'Depuis combien de temps avez-vous ces symptômes ?',
        it: 'Da quanto tempo ha questi sintomi?',
        de: 'Seit wann haben Sie diese Beschwerden?',
        ja: 'その症状はいつからですか。(Sono shōjō wa itsu kara desu ka.)',
        ko: '증상이 언제부터였나요? (Jeungsangi eonjebuteoyeonnayo?)',
        zh: '这些症状有多久了？(Zhèxiē zhèngzhuàng yǒu duōjiǔ le?)',
      },
      {
        en: 'Are you taking any medication at the moment?',
        es: '¿Está tomando alguna medicación?',
        fr: 'Prenez-vous des médicaments en ce moment ?',
        it: 'Sta prendendo qualche farmaco?',
        de: 'Nehmen Sie zurzeit Medikamente?',
        ja: '今、何かお薬を飲んでいますか。(Ima, nanika okusuri o nonde imasu ka.)',
        ko: '지금 복용 중인 약이 있나요? (Jigeum bogyong jungin yagi innayo?)',
        zh: '您现在有在吃什么药吗？(Nín xiànzài yǒu zài chī shénme yào ma?)',
      },
      {
        en: 'Take this twice a day after meals, and come back in a week.',
        es: 'Tome esto dos veces al día después de comer y vuelva en una semana.',
        fr: 'Prenez ceci deux fois par jour après les repas et revenez dans une semaine.',
        it: 'Prenda questo due volte al giorno dopo i pasti e torni fra una settimana.',
        de: 'Nehmen Sie das zweimal täglich nach dem Essen und kommen Sie in einer Woche wieder.',
        ja: 'これを食後に一日二回飲んで、一週間後にまた来てください。(Kore o shokugo ni ichinichi nikai nonde kudasai.)',
        ko: '식후에 하루 두 번 드시고 일주일 뒤에 다시 오세요. (Sikhue haru du beon deusigo.)',
        zh: '饭后一天两次，一周后再来复诊。(Fàn hòu yītiān liǎng cì, yī zhōu hòu zài lái fùzhěn.)',
      },
    ],
  },

  apartment: {
    title: 'Alugando um lugar',
    description: 'Visitar, perguntar condições e negociar.',
    icon: 'home',
    minLevel: 'A2',
    fallback: 'Come in. This is the living room.',
    turns: [
      {
        en: 'Come in. This is the living room. What do you think?',
        es: 'Pase. Este es el salón. ¿Qué le parece?',
        fr: 'Entrez. Voici le salon. Qu’en pensez-vous ?',
        it: 'Prego, entri. Questo è il soggiorno. Che ne pensa?',
        de: 'Kommen Sie herein. Das ist das Wohnzimmer. Was meinen Sie?',
        ja: 'どうぞ。こちらがリビングです。いかがですか。(Dōzo. Kochira ga ribingu desu.)',
        ko: '들어오세요. 여기가 거실이에요. 어떠세요? (Deureooseyo. Yeogiga geosirieyo.)',
        zh: '请进。这是客厅，您觉得怎么样？(Qǐng jìn. Zhè shì kètīng.)',
      },
      {
        en: 'The rent is 900 a month, bills not included.',
        es: 'El alquiler es de 900 al mes, sin gastos incluidos.',
        fr: 'Le loyer est de 900 par mois, charges non comprises.',
        it: "L'affitto è 900 al mese, spese escluse.",
        de: 'Die Miete beträgt 900 im Monat, ohne Nebenkosten.',
        ja: '家賃は月九百です。光熱費は別です。(Yachin wa tsuki kyūhyaku desu.)',
        ko: '월세는 900이고 관리비는 별도예요. (Wolsereun gubaegigo gwallibineun byeoldoyeyo.)',
        zh: '房租每月九百，不含水电。(Fángzū měi yuè jiǔbǎi, bù hán shuǐdiàn.)',
      },
      {
        en: 'The contract is for one year. Would that work for you?',
        es: 'El contrato es de un año. ¿Le viene bien?',
        fr: 'Le bail est d’un an. Cela vous convient ?',
        it: 'Il contratto è di un anno. Le va bene?',
        de: 'Der Vertrag läuft ein Jahr. Wäre das in Ordnung?',
        ja: '契約は一年です。よろしいですか。(Keiyaku wa ichinen desu.)',
        ko: '계약은 일 년이에요. 괜찮으세요? (Gyeyageun il nyeonieyo.)',
        zh: '合同是一年，可以吗？(Hétong shì yī nián, kěyǐ ma?)',
      },
      {
        en: 'If you decide today, I can lower the deposit.',
        es: 'Si se decide hoy, puedo bajar la fianza.',
        fr: 'Si vous vous décidez aujourd’hui, je peux baisser la caution.',
        it: 'Se decide oggi, posso ridurre la caparra.',
        de: 'Wenn Sie sich heute entscheiden, kann ich die Kaution senken.',
        ja: '今日お決めいただければ、敷金を下げられます。(Kyō okime itadakereba, shikikin o sageraremasu.)',
        ko: '오늘 결정하시면 보증금을 낮춰드릴 수 있어요. (Oneul gyeoljeonghasimyeon.)',
        zh: '您今天决定的话，押金可以少一些。(Nín jīntiān juédìng dehuà.)',
      },
    ],
  },

  meeting: {
    title: 'Reunião de trabalho',
    description: 'Apresentar, discordar e negociar prazo.',
    icon: 'people',
    minLevel: 'B1',
    fallback: 'Thanks for joining. Shall we start with the timeline?',
    turns: [
      {
        en: 'Thanks for joining. Shall we start with the timeline?',
        es: 'Gracias por venir. ¿Empezamos por el calendario?',
        fr: 'Merci d’être là. On commence par le calendrier ?',
        it: 'Grazie di esserci. Iniziamo dai tempi?',
        de: 'Danke fürs Kommen. Fangen wir mit dem Zeitplan an?',
        ja: 'お集まりありがとうございます。スケジュールから始めましょうか。(Osumari arigatō gozaimasu.)',
        ko: '와 주셔서 감사합니다. 일정부터 시작할까요? (Wa jusyeoseo gamsahamnida.)',
        zh: '感谢各位参加。我们先看进度表好吗？(Gǎnxiè gèwèi cānjiā.)',
      },
      {
        en: 'I am not sure that deadline is realistic. What do you think?',
        es: 'No estoy seguro de que ese plazo sea realista. ¿Qué opina?',
        fr: 'Je ne suis pas sûr que ce délai soit réaliste. Qu’en pensez-vous ?',
        it: 'Non sono sicuro che quella scadenza sia realistica. Lei che ne pensa?',
        de: 'Ich bin nicht sicher, ob die Frist realistisch ist. Was meinen Sie?',
        ja: 'その締め切りは現実的でしょうか。ご意見は。(Sono shimekiri wa genjitsuteki deshō ka.)',
        ko: '그 마감이 현실적일까요? 어떻게 생각하세요? (Geu magami hyeonsiljeogilkkayo?)',
        zh: '这个截止日期现实吗？您怎么看？(Zhège jiézhǐ rìqī xiànshí ma?)',
      },
      {
        en: 'If we push it by a week, what would we lose?',
        es: 'Si lo retrasamos una semana, ¿qué perderíamos?',
        fr: 'Si on décale d’une semaine, qu’est-ce qu’on perd ?',
        it: 'Se lo spostiamo di una settimana, cosa perdiamo?',
        de: 'Wenn wir eine Woche verschieben, was verlieren wir?',
        ja: '一週間ずらすと、何を失いますか。(Isshūkan zurasu to, nani o ushinaimasu ka.)',
        ko: '일주일 미루면 무엇을 잃게 되나요? (Iljuil mirumyeon mueoseul ilke doenayo?)',
        zh: '如果推迟一周，我们会损失什么？(Rúguǒ tuīchí yī zhōu?)',
      },
      {
        en: 'Good. Let us agree on that and review it on Friday.',
        es: 'Bien. Acordemos eso y lo revisamos el viernes.',
        fr: 'Très bien. On acte ça et on revoit vendredi.',
        it: 'Bene. Decidiamo così e rivediamo venerdì.',
        de: 'Gut. Halten wir das fest und schauen Freitag noch mal.',
        ja: 'では、そう決めて金曜日に見直しましょう。(Dewa, sō kimete kin’yōbi ni minaoshimashō.)',
        ko: '좋아요. 그렇게 정하고 금요일에 다시 보죠. (Joayo. Geureoke jeonghago.)',
        zh: '好，就这么定，周五再看。(Hǎo, jiù zhème dìng, zhōuwǔ zài kàn.)',
      },
    ],
  },

  friends: {
    title: 'Reencontro com amigos',
    description: 'Contar novidades, reagir e fazer planos.',
    icon: 'wine',
    minLevel: 'A2',
    fallback: 'Hey! It has been ages. How have you been?',
    turns: [
      {
        en: 'Hey! It has been ages. How have you been?',
        es: '¡Eh! Cuánto tiempo. ¿Qué tal estás?',
        fr: 'Salut ! Ça fait un bail. Tu deviens quoi ?',
        it: 'Ehi! Quanto tempo. Come stai?',
        de: 'Hey! Lange nicht gesehen. Wie geht es dir?',
        ja: 'おー、久しぶり！元気にしてた？(Ō, hisashiburi! Genki ni shiteta?)',
        ko: '야! 진짜 오랜만이다. 잘 지냈어? (Ya! Jinjja oraenmanida. Jal jinaesseo?)',
        zh: '哎，好久不见！最近怎么样？(Āi, hǎojiǔ bùjiàn! Zuìjìn zěnmeyàng?)',
      },
      {
        en: 'No way! Tell me everything.',
        es: '¡No me digas! Cuéntamelo todo.',
        fr: 'Sérieux ! Raconte-moi tout.',
        it: 'Ma dai! Raccontami tutto.',
        de: 'Echt jetzt? Erzähl mal alles.',
        ja: 'えー、まじで！全部聞かせて。(Ē, maji de! Zenbu kikasete.)',
        ko: '진짜? 다 얘기해 봐. (Jinjja? Da yaegihae bwa.)',
        zh: '真的假的！快说说。(Zhēn de jiǎ de! Kuài shuōshuo.)',
      },
      {
        en: 'Same here, honestly. Work has been non-stop.',
        es: 'Igual, la verdad. El trabajo no para.',
        fr: 'Pareil, franchement. Le boulot n’arrête pas.',
        it: 'Uguale, sinceramente. Il lavoro non si ferma.',
        de: 'Bei mir genauso, ehrlich. Die Arbeit hört nicht auf.',
        ja: 'こっちも同じ。仕事がずっと忙しくて。(Kotchi mo onaji. Shigoto ga zutto isogashikute.)',
        ko: '나도 똑같아. 일이 계속 바빠. (Nado ttokgata. Iri gyesok bappa.)',
        zh: '我也一样，工作一直没停。(Wǒ yě yīyàng, gōngzuò yīzhí méi tíng.)',
      },
      {
        en: 'Let us not wait another year. Next weekend?',
        es: 'No esperemos otro año. ¿El finde que viene?',
        fr: 'On n’attend pas encore un an. Le week-end prochain ?',
        it: 'Non aspettiamo un altro anno. Il weekend prossimo?',
        de: 'Lass uns nicht noch ein Jahr warten. Nächstes Wochenende?',
        ja: 'また一年空けないようにしよう。来週末は？(Mata ichinen akenai yō ni shiyō. Raishūmatsu wa?)',
        ko: '또 일 년 기다리지 말자. 다음 주말 어때? (Tto il nyeon gidariji malja.)',
        zh: '别再等一年了，下周末怎么样？(Bié zài děng yī nián le.)',
      },
    ],
  },

  complaint: {
    title: 'Reclamar de um problema',
    description: 'Explicar o que deu errado e pedir solução.',
    icon: 'alert-circle',
    minLevel: 'B1',
    fallback: 'Good afternoon. How can I help you?',
    turns: [
      {
        en: 'Good afternoon. How can I help you?',
        es: 'Buenas tardes. ¿En qué puedo ayudarle?',
        fr: 'Bonjour. Comment puis-je vous aider ?',
        it: 'Buon pomeriggio. Come posso aiutarla?',
        de: 'Guten Tag. Wie kann ich Ihnen helfen?',
        ja: 'こんにちは。どのようなご用件でしょうか。(Konnichiwa. Dono yō na goyōken deshō ka.)',
        ko: '안녕하세요. 무엇을 도와드릴까요? (Annyeonghaseyo. Mueoseul dowadeurilkkayo?)',
        zh: '您好，有什么可以帮您的？(Nín hǎo, yǒu shénme kěyǐ bāng nín de?)',
      },
      {
        en: 'I understand. Do you have the receipt with you?',
        es: 'Entiendo. ¿Tiene el recibo?',
        fr: 'Je comprends. Avez-vous le reçu ?',
        it: 'Capisco. Ha lo scontrino?',
        de: 'Ich verstehe. Haben Sie die Quittung dabei?',
        ja: 'かしこまりました。領収書はお持ちですか。(Kashikomarimashita. Ryōshūsho wa omochi desu ka.)',
        ko: '알겠습니다. 영수증 가지고 계세요? (Algesseumnida. Yeongsujeung gajigo gyeseyo?)',
        zh: '我明白了。您有发票吗？(Wǒ míngbái le. Nín yǒu fāpiào ma?)',
      },
      {
        en: 'I am afraid I cannot refund it, but I can offer an exchange.',
        es: 'Me temo que no puedo devolverle el dinero, pero puedo cambiárselo.',
        fr: 'Je ne peux malheureusement pas rembourser, mais je peux échanger.',
        it: 'Purtroppo non posso rimborsare, ma posso sostituirlo.',
        de: 'Leider kann ich nicht erstatten, aber ich kann es umtauschen.',
        ja: '返金はいたしかねますが、交換なら可能です。(Henkin wa itashikanemasu ga, kōkan nara kanō desu.)',
        ko: '환불은 어렵지만 교환은 가능합니다. (Hwanbureun eoryeopjiman gyohwaneun ganeunghamnida.)',
        zh: '退款恐怕不行，但可以换货。(Tuìkuǎn kǒngpà bùxíng, dàn kěyǐ huànhuò.)',
      },
      {
        en: 'Let me speak to my manager and see what we can do.',
        es: 'Déjeme hablar con mi responsable a ver qué podemos hacer.',
        fr: 'Laissez-moi voir avec mon responsable ce qu’on peut faire.',
        it: 'Mi lasci parlare con il responsabile per vedere cosa possiamo fare.',
        de: 'Lassen Sie mich mit meinem Vorgesetzten sprechen.',
        ja: '上の者に確認いたします。少々お待ちください。(Ue no mono ni kakunin itashimasu.)',
        ko: '상급자에게 확인해 보겠습니다. (Sanggeupjaege hwaginhae bogesseumnida.)',
        zh: '我跟主管确认一下，看看能怎么处理。(Wǒ gēn zhǔguǎn quèrèn yīxià.)',
      },
    ],
  },
};

/** Todos os cenários disponíveis, para a tela do tutor. */
export function extraScenarioList(): {
  id: string;
  title: string;
  description: string;
  icon: string;
  minLevel: string;
}[] {
  return Object.entries(EXTRA_SCENARIOS).map(([id, script]) => ({
    id,
    title: script.title,
    description: script.description,
    icon: script.icon,
    minLevel: script.minLevel,
  }));
}

/** Quantos idiomas um cenário cobre — usado em testes de completude. */
export function scenarioLanguageCoverage(script: ScenarioScript): LanguageCode[] {
  const languages = new Set<LanguageCode>();
  for (const turn of script.turns) {
    for (const key of Object.keys(turn)) languages.add(key as LanguageCode);
  }
  return [...languages];
}
