/**
 * Frases curadas por idioma e tema.
 *
 * São a matéria-prima dos exercícios de gramática, escuta, fala e leitura.
 * Escolhidas por **utilidade imediata**, não por conveniência gramatical: cada
 * frase aqui é algo que o usuário realmente vai dizer nos primeiros dias de
 * uso da língua.
 *
 * `reply` existe para os exercícios de "escute e responda": é a resposta
 * natural àquela fala, o que ensina o *par adjacente* da conversa em vez de
 * frases soltas.
 */

import type { LanguageCode } from '@/domain/types';

export type Phrase = {
  id: string;
  topic: 'greetings' | 'routine' | 'out';
  /** Frase no idioma estudado. */
  target: string;
  /** Tradução em português. */
  native: string;
  /** Resposta natural a esta fala, quando ela é uma pergunta ou abertura. */
  reply?: string;
};

function phrases(language: LanguageCode, list: Omit<Phrase, 'id'>[]): Phrase[] {
  return list.map((phrase, index) => ({
    ...phrase,
    id: `phrase:${language}:${phrase.topic}:${index}`,
  }));
}

export const CURATED_PHRASES: Record<LanguageCode, Phrase[]> = {
  en: phrases('en', [
    {
      topic: 'greetings',
      target: 'Good morning, how are you?',
      native: 'Bom dia, como você está?',
      reply: "I'm fine, thank you.",
    },
    {
      topic: 'greetings',
      target: 'My name is Ana, nice to meet you.',
      native: 'Meu nome é Ana, prazer em conhecê-lo.',
      reply: 'Nice to meet you too.',
    },
    {
      topic: 'greetings',
      target: 'Where are you from?',
      native: 'De onde você é?',
      reply: "I'm from Brazil.",
    },
    {
      topic: 'greetings',
      target: 'Sorry, could you repeat that?',
      native: 'Desculpe, você poderia repetir?',
      reply: 'Of course, no problem.',
    },
    {
      topic: 'greetings',
      target: 'See you tomorrow!',
      native: 'Até amanhã!',
      reply: 'See you!',
    },
    {
      topic: 'greetings',
      target: 'I do not speak English very well.',
      native: 'Eu não falo inglês muito bem.',
      reply: "Don't worry, you're doing great.",
    },

    {
      topic: 'routine',
      target: 'I wake up at seven every day.',
      native: 'Eu acordo às sete todos os dias.',
    },
    {
      topic: 'routine',
      target: 'She works in a hospital downtown.',
      native: 'Ela trabalha em um hospital no centro.',
    },
    {
      topic: 'routine',
      target: 'What do you do in your free time?',
      native: 'O que você faz no tempo livre?',
      reply: 'I usually read or go running.',
    },
    {
      topic: 'routine',
      target: 'I like coffee more than tea.',
      native: 'Eu gosto mais de café do que de chá.',
    },
    {
      topic: 'routine',
      target: 'We usually have dinner at eight.',
      native: 'Normalmente jantamos às oito.',
    },
    {
      topic: 'routine',
      target: 'He does not work on weekends.',
      native: 'Ele não trabalha nos fins de semana.',
    },

    {
      topic: 'out',
      target: 'A table for two, please.',
      native: 'Uma mesa para dois, por favor.',
      reply: 'Right this way.',
    },
    {
      topic: 'out',
      target: 'Could I see the menu, please?',
      native: 'Eu poderia ver o cardápio, por favor?',
      reply: 'Here you are.',
    },
    {
      topic: 'out',
      target: 'How much does this cost?',
      native: 'Quanto custa isso?',
      reply: 'It is twelve euros.',
    },
    {
      topic: 'out',
      target: 'Excuse me, where is the station?',
      native: 'Com licença, onde fica a estação?',
      reply: 'Go straight and turn left.',
    },
    {
      topic: 'out',
      target: 'The bill, please.',
      native: 'A conta, por favor.',
      reply: 'Sure, one moment.',
    },
    {
      topic: 'out',
      target: 'I would like a coffee without sugar.',
      native: 'Eu gostaria de um café sem açúcar.',
    },
  ]),

  es: phrases('es', [
    {
      topic: 'greetings',
      target: 'Buenos días, ¿cómo estás?',
      native: 'Bom dia, como você está?',
      reply: 'Estoy bien, gracias.',
    },
    {
      topic: 'greetings',
      target: 'Me llamo Ana, mucho gusto.',
      native: 'Meu nome é Ana, muito prazer.',
      reply: 'Igualmente.',
    },
    {
      topic: 'greetings',
      target: '¿De dónde eres?',
      native: 'De onde você é?',
      reply: 'Soy de Brasil.',
    },
    {
      topic: 'greetings',
      target: 'Perdón, ¿puedes repetir?',
      native: 'Desculpe, você pode repetir?',
      reply: 'Claro, sin problema.',
    },
    {
      topic: 'greetings',
      target: '¡Hasta mañana!',
      native: 'Até amanhã!',
      reply: '¡Hasta luego!',
    },
    {
      topic: 'greetings',
      target: 'No hablo español muy bien.',
      native: 'Eu não falo espanhol muito bem.',
      reply: 'Lo estás haciendo muy bien.',
    },

    {
      topic: 'routine',
      target: 'Me levanto a las siete todos los días.',
      native: 'Eu acordo às sete todos os dias.',
    },
    {
      topic: 'routine',
      target: 'Ella trabaja en un hospital del centro.',
      native: 'Ela trabalha em um hospital no centro.',
    },
    {
      topic: 'routine',
      target: '¿Qué haces en tu tiempo libre?',
      native: 'O que você faz no tempo livre?',
      reply: 'Normalmente leo o salgo a correr.',
    },
    {
      topic: 'routine',
      target: 'Me gusta más el café que el té.',
      native: 'Gosto mais de café do que de chá.',
    },
    {
      topic: 'routine',
      target: 'Solemos cenar a las ocho.',
      native: 'Normalmente jantamos às oito.',
    },
    {
      topic: 'routine',
      target: 'Él no trabaja los fines de semana.',
      native: 'Ele não trabalha nos fins de semana.',
    },

    {
      topic: 'out',
      target: 'Una mesa para dos, por favor.',
      native: 'Uma mesa para dois, por favor.',
      reply: 'Por aquí, por favor.',
    },
    {
      topic: 'out',
      target: '¿Me trae la carta, por favor?',
      native: 'Pode me trazer o cardápio, por favor?',
      reply: 'Aquí tiene.',
    },
    {
      topic: 'out',
      target: '¿Cuánto cuesta esto?',
      native: 'Quanto custa isso?',
      reply: 'Son doce euros.',
    },
    {
      topic: 'out',
      target: 'Perdone, ¿dónde está la estación?',
      native: 'Com licença, onde fica a estação?',
      reply: 'Siga recto y gire a la izquierda.',
    },
    {
      topic: 'out',
      target: 'La cuenta, por favor.',
      native: 'A conta, por favor.',
      reply: 'Enseguida.',
    },
    {
      topic: 'out',
      target: 'Quisiera un café sin azúcar.',
      native: 'Eu gostaria de um café sem açúcar.',
    },
  ]),

  fr: phrases('fr', [
    {
      topic: 'greetings',
      target: 'Bonjour, comment allez-vous ?',
      native: 'Bom dia, como vai?',
      reply: 'Je vais bien, merci.',
    },
    {
      topic: 'greetings',
      target: "Je m'appelle Ana, enchantée.",
      native: 'Meu nome é Ana, encantada.',
      reply: 'Enchanté aussi.',
    },
    {
      topic: 'greetings',
      target: "D'où venez-vous ?",
      native: 'De onde você vem?',
      reply: 'Je viens du Brésil.',
    },
    {
      topic: 'greetings',
      target: 'Pardon, pouvez-vous répéter ?',
      native: 'Desculpe, pode repetir?',
      reply: 'Bien sûr.',
    },
    { topic: 'greetings', target: 'À demain !', native: 'Até amanhã!', reply: 'À bientôt !' },
    {
      topic: 'greetings',
      target: 'Je ne parle pas très bien français.',
      native: 'Eu não falo francês muito bem.',
      reply: 'Vous vous débrouillez bien.',
    },

    {
      topic: 'routine',
      target: 'Je me lève à sept heures tous les jours.',
      native: 'Eu acordo às sete todos os dias.',
    },
    {
      topic: 'routine',
      target: 'Elle travaille dans un hôpital du centre.',
      native: 'Ela trabalha em um hospital no centro.',
    },
    {
      topic: 'routine',
      target: 'Que faites-vous pendant votre temps libre ?',
      native: 'O que você faz no tempo livre?',
      reply: 'Je lis ou je cours.',
    },
    {
      topic: 'routine',
      target: "J'aime le café plus que le thé.",
      native: 'Gosto mais de café do que de chá.',
    },
    {
      topic: 'routine',
      target: 'Nous dînons généralement à huit heures.',
      native: 'Normalmente jantamos às oito.',
    },
    {
      topic: 'routine',
      target: 'Il ne travaille pas le week-end.',
      native: 'Ele não trabalha no fim de semana.',
    },

    {
      topic: 'out',
      target: 'Une table pour deux, s’il vous plaît.',
      native: 'Uma mesa para dois, por favor.',
      reply: 'Suivez-moi.',
    },
    {
      topic: 'out',
      target: 'La carte, s’il vous plaît.',
      native: 'O cardápio, por favor.',
      reply: 'Voilà.',
    },
    {
      topic: 'out',
      target: 'Combien ça coûte ?',
      native: 'Quanto custa?',
      reply: 'Ça fait douze euros.',
    },
    {
      topic: 'out',
      target: 'Excusez-moi, où est la gare ?',
      native: 'Com licença, onde fica a estação?',
      reply: 'Tout droit puis à gauche.',
    },
    {
      topic: 'out',
      target: "L'addition, s'il vous plaît.",
      native: 'A conta, por favor.',
      reply: 'Tout de suite.',
    },
    {
      topic: 'out',
      target: 'Je voudrais un café sans sucre.',
      native: 'Eu gostaria de um café sem açúcar.',
    },
  ]),

  it: phrases('it', [
    {
      topic: 'greetings',
      target: 'Buongiorno, come sta?',
      native: 'Bom dia, como vai?',
      reply: 'Sto bene, grazie.',
    },
    {
      topic: 'greetings',
      target: 'Mi chiamo Ana, piacere.',
      native: 'Meu nome é Ana, prazer.',
      reply: 'Piacere mio.',
    },
    {
      topic: 'greetings',
      target: 'Di dove sei?',
      native: 'De onde você é?',
      reply: 'Sono del Brasile.',
    },
    {
      topic: 'greetings',
      target: 'Scusi, può ripetere?',
      native: 'Desculpe, pode repetir?',
      reply: 'Certo.',
    },
    { topic: 'greetings', target: 'A domani!', native: 'Até amanhã!', reply: 'A presto!' },
    {
      topic: 'greetings',
      target: 'Non parlo molto bene italiano.',
      native: 'Não falo italiano muito bem.',
      reply: 'Te la cavi benissimo.',
    },

    {
      topic: 'routine',
      target: 'Mi sveglio alle sette tutti i giorni.',
      native: 'Acordo às sete todos os dias.',
    },
    {
      topic: 'routine',
      target: 'Lei lavora in un ospedale in centro.',
      native: 'Ela trabalha em um hospital no centro.',
    },
    {
      topic: 'routine',
      target: 'Cosa fai nel tempo libero?',
      native: 'O que você faz no tempo livre?',
      reply: 'Di solito leggo o corro.',
    },
    {
      topic: 'routine',
      target: 'Mi piace più il caffè del tè.',
      native: 'Gosto mais de café do que de chá.',
    },
    {
      topic: 'routine',
      target: 'Di solito ceniamo alle otto.',
      native: 'Normalmente jantamos às oito.',
    },
    {
      topic: 'routine',
      target: 'Lui non lavora nel fine settimana.',
      native: 'Ele não trabalha no fim de semana.',
    },

    {
      topic: 'out',
      target: 'Un tavolo per due, per favore.',
      native: 'Uma mesa para dois, por favor.',
      reply: 'Prego, da questa parte.',
    },
    {
      topic: 'out',
      target: 'Il menù, per favore.',
      native: 'O cardápio, por favor.',
      reply: 'Ecco a lei.',
    },
    {
      topic: 'out',
      target: 'Quanto costa questo?',
      native: 'Quanto custa isso?',
      reply: 'Sono dodici euro.',
    },
    {
      topic: 'out',
      target: 'Scusi, dov’è la stazione?',
      native: 'Com licença, onde fica a estação?',
      reply: 'Dritto e poi a sinistra.',
    },
    {
      topic: 'out',
      target: 'Il conto, per favore.',
      native: 'A conta, por favor.',
      reply: 'Subito.',
    },
    {
      topic: 'out',
      target: 'Vorrei un caffè senza zucchero.',
      native: 'Eu gostaria de um café sem açúcar.',
    },
  ]),

  de: phrases('de', [
    {
      topic: 'greetings',
      target: 'Guten Morgen, wie geht es Ihnen?',
      native: 'Bom dia, como vai?',
      reply: 'Mir geht es gut, danke.',
    },
    {
      topic: 'greetings',
      target: 'Ich heiße Ana, freut mich.',
      native: 'Meu nome é Ana, prazer.',
      reply: 'Freut mich auch.',
    },
    {
      topic: 'greetings',
      target: 'Woher kommst du?',
      native: 'De onde você vem?',
      reply: 'Ich komme aus Brasilien.',
    },
    {
      topic: 'greetings',
      target: 'Entschuldigung, können Sie das wiederholen?',
      native: 'Desculpe, pode repetir?',
      reply: 'Natürlich.',
    },
    { topic: 'greetings', target: 'Bis morgen!', native: 'Até amanhã!', reply: 'Bis bald!' },
    {
      topic: 'greetings',
      target: 'Ich spreche nicht sehr gut Deutsch.',
      native: 'Não falo alemão muito bem.',
      reply: 'Das machst du schon gut.',
    },

    {
      topic: 'routine',
      target: 'Ich stehe jeden Tag um sieben auf.',
      native: 'Acordo às sete todos os dias.',
    },
    {
      topic: 'routine',
      target: 'Sie arbeitet in einem Krankenhaus im Zentrum.',
      native: 'Ela trabalha em um hospital no centro.',
    },
    {
      topic: 'routine',
      target: 'Was machst du in deiner Freizeit?',
      native: 'O que você faz no tempo livre?',
      reply: 'Ich lese oder gehe laufen.',
    },
    {
      topic: 'routine',
      target: 'Ich mag Kaffee lieber als Tee.',
      native: 'Gosto mais de café do que de chá.',
    },
    {
      topic: 'routine',
      target: 'Wir essen normalerweise um acht zu Abend.',
      native: 'Normalmente jantamos às oito.',
    },
    {
      topic: 'routine',
      target: 'Er arbeitet nicht am Wochenende.',
      native: 'Ele não trabalha no fim de semana.',
    },

    {
      topic: 'out',
      target: 'Einen Tisch für zwei, bitte.',
      native: 'Uma mesa para dois, por favor.',
      reply: 'Hier entlang, bitte.',
    },
    {
      topic: 'out',
      target: 'Die Speisekarte, bitte.',
      native: 'O cardápio, por favor.',
      reply: 'Bitte schön.',
    },
    {
      topic: 'out',
      target: 'Wie viel kostet das?',
      native: 'Quanto custa isso?',
      reply: 'Das macht zwölf Euro.',
    },
    {
      topic: 'out',
      target: 'Entschuldigung, wo ist der Bahnhof?',
      native: 'Com licença, onde fica a estação?',
      reply: 'Geradeaus und dann links.',
    },
    {
      topic: 'out',
      target: 'Die Rechnung, bitte.',
      native: 'A conta, por favor.',
      reply: 'Sofort.',
    },
    {
      topic: 'out',
      target: 'Ich hätte gern einen Kaffee ohne Zucker.',
      native: 'Eu gostaria de um café sem açúcar.',
    },
  ]),

  ja: phrases('ja', [
    {
      topic: 'greetings',
      target: 'おはようございます。お元気ですか。',
      native: 'Bom dia. Como você está?',
      reply: '元気です、ありがとう。',
    },
    {
      topic: 'greetings',
      target: '私はアナです。はじめまして。',
      native: 'Eu sou a Ana. Prazer em conhecê-lo.',
      reply: 'こちらこそ、はじめまして。',
    },
    {
      topic: 'greetings',
      target: 'どこから来ましたか。',
      native: 'De onde você é?',
      reply: 'ブラジルから来ました。',
    },
    {
      topic: 'greetings',
      target: 'すみません、もう一度お願いします。',
      native: 'Desculpe, pode repetir?',
      reply: 'はい、もちろん。',
    },
    { topic: 'greetings', target: 'また明日。', native: 'Até amanhã.', reply: 'また明日ね。' },
    {
      topic: 'greetings',
      target: '日本語があまり話せません。',
      native: 'Não falo japonês muito bem.',
      reply: '大丈夫ですよ。',
    },

    {
      topic: 'routine',
      target: '毎日七時に起きます。',
      native: 'Acordo às sete todos os dias.',
    },
    {
      topic: 'routine',
      target: '彼女は病院で働いています。',
      native: 'Ela trabalha em um hospital.',
    },
    {
      topic: 'routine',
      target: '暇な時に何をしますか。',
      native: 'O que você faz no tempo livre?',
      reply: '本を読みます。',
    },
    {
      topic: 'routine',
      target: 'お茶よりコーヒーが好きです。',
      native: 'Gosto mais de café do que de chá.',
    },
    {
      topic: 'routine',
      target: 'いつも八時に晩ご飯を食べます。',
      native: 'Normalmente janto às oito.',
    },
    {
      topic: 'routine',
      target: '彼は週末に働きません。',
      native: 'Ele não trabalha nos fins de semana.',
    },

    {
      topic: 'out',
      target: '二人です。',
      native: 'Mesa para dois.',
      reply: 'こちらへどうぞ。',
    },
    {
      topic: 'out',
      target: 'メニューをお願いします。',
      native: 'O cardápio, por favor.',
      reply: 'はい、どうぞ。',
    },
    {
      topic: 'out',
      target: 'これはいくらですか。',
      native: 'Quanto custa isso?',
      reply: '千円です。',
    },
    {
      topic: 'out',
      target: 'すみません、駅はどこですか。',
      native: 'Com licença, onde fica a estação?',
      reply: 'まっすぐ行って左です。',
    },
    {
      topic: 'out',
      target: 'お会計をお願いします。',
      native: 'A conta, por favor.',
      reply: 'かしこまりました。',
    },
    {
      topic: 'out',
      target: '砂糖なしのコーヒーをください。',
      native: 'Um café sem açúcar, por favor.',
    },
  ]),

  ko: phrases('ko', [
    {
      topic: 'greetings',
      target: '안녕하세요. 잘 지내세요?',
      native: 'Olá. Como você está?',
      reply: '네, 잘 지내요. 감사합니다.',
    },
    {
      topic: 'greetings',
      target: '저는 아나예요. 만나서 반갑습니다.',
      native: 'Eu sou a Ana. Prazer em conhecê-lo.',
      reply: '저도 반갑습니다.',
    },
    {
      topic: 'greetings',
      target: '어디에서 왔어요?',
      native: 'De onde você é?',
      reply: '브라질에서 왔어요.',
    },
    {
      topic: 'greetings',
      target: '죄송해요, 다시 말해 주세요.',
      native: 'Desculpe, pode repetir?',
      reply: '네, 그럼요.',
    },
    {
      topic: 'greetings',
      target: '내일 봐요.',
      native: 'Até amanhã.',
      reply: '네, 내일 봐요.',
    },
    {
      topic: 'greetings',
      target: '한국어를 잘 못해요.',
      native: 'Não falo coreano muito bem.',
      reply: '잘하고 있어요.',
    },

    {
      topic: 'routine',
      target: '매일 일곱 시에 일어나요.',
      native: 'Acordo às sete todos os dias.',
    },
    {
      topic: 'routine',
      target: '그녀는 병원에서 일해요.',
      native: 'Ela trabalha em um hospital.',
    },
    {
      topic: 'routine',
      target: '시간 있을 때 뭐 해요?',
      native: 'O que você faz no tempo livre?',
      reply: '보통 책을 읽어요.',
    },
    {
      topic: 'routine',
      target: '차보다 커피를 더 좋아해요.',
      native: 'Gosto mais de café do que de chá.',
    },
    {
      topic: 'routine',
      target: '보통 여덟 시에 저녁을 먹어요.',
      native: 'Normalmente janto às oito.',
    },
    {
      topic: 'routine',
      target: '그는 주말에 일하지 않아요.',
      native: 'Ele não trabalha nos fins de semana.',
    },

    {
      topic: 'out',
      target: '두 명이요.',
      native: 'Mesa para dois.',
      reply: '이쪽으로 오세요.',
    },
    {
      topic: 'out',
      target: '메뉴 주세요.',
      native: 'O cardápio, por favor.',
      reply: '여기 있습니다.',
    },
    {
      topic: 'out',
      target: '이거 얼마예요?',
      native: 'Quanto custa isso?',
      reply: '만 원이에요.',
    },
    {
      topic: 'out',
      target: '실례합니다, 역이 어디예요?',
      native: 'Com licença, onde fica a estação?',
      reply: '직진하고 왼쪽이에요.',
    },
    {
      topic: 'out',
      target: '계산서 주세요.',
      native: 'A conta, por favor.',
      reply: '네, 잠시만요.',
    },
    {
      topic: 'out',
      target: '설탕 없는 커피 주세요.',
      native: 'Um café sem açúcar, por favor.',
    },
  ]),

  zh: phrases('zh', [
    {
      topic: 'greetings',
      target: '早上好，你好吗？',
      native: 'Bom dia, como você está?',
      reply: '我很好，谢谢。',
    },
    {
      topic: 'greetings',
      target: '我叫安娜，很高兴认识你。',
      native: 'Meu nome é Ana, prazer em conhecê-lo.',
      reply: '我也很高兴。',
    },
    {
      topic: 'greetings',
      target: '你从哪里来？',
      native: 'De onde você é?',
      reply: '我从巴西来。',
    },
    {
      topic: 'greetings',
      target: '对不起，请再说一遍。',
      native: 'Desculpe, pode repetir?',
      reply: '当然可以。',
    },
    { topic: 'greetings', target: '明天见。', native: 'Até amanhã.', reply: '明天见。' },
    {
      topic: 'greetings',
      target: '我的中文不太好。',
      native: 'Meu chinês não é muito bom.',
      reply: '你说得很好。',
    },

    { topic: 'routine', target: '我每天七点起床。', native: 'Acordo às sete todos os dias.' },
    { topic: 'routine', target: '她在医院工作。', native: 'Ela trabalha em um hospital.' },
    {
      topic: 'routine',
      target: '你有空的时候做什么？',
      native: 'O que você faz no tempo livre?',
      reply: '我常常看书。',
    },
    {
      topic: 'routine',
      target: '我喜欢咖啡胜过茶。',
      native: 'Gosto mais de café do que de chá.',
    },
    {
      topic: 'routine',
      target: '我们通常八点吃晚饭。',
      native: 'Normalmente jantamos às oito.',
    },
    {
      topic: 'routine',
      target: '他周末不工作。',
      native: 'Ele não trabalha nos fins de semana.',
    },

    { topic: 'out', target: '两个人。', native: 'Mesa para dois.', reply: '这边请。' },
    { topic: 'out', target: '请给我菜单。', native: 'O cardápio, por favor.', reply: '给您。' },
    { topic: 'out', target: '这个多少钱？', native: 'Quanto custa isso?', reply: '五十块。' },
    {
      topic: 'out',
      target: '请问，车站在哪里？',
      native: 'Com licença, onde fica a estação?',
      reply: '一直走然后左转。',
    },
    { topic: 'out', target: '请结账。', native: 'A conta, por favor.', reply: '好的，稍等。' },
    { topic: 'out', target: '我要一杯不加糖的咖啡。', native: 'Quero um café sem açúcar.' },
  ]),
};
