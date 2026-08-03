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
};
