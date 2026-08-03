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
 * ## Por que estes cenários ficam separados dos originais
 *
 * Os cenários de `knowledge.ts` nasceram com falas parciais e caíam no texto de
 * reserva em inglês para parte do catálogo. Aqui toda fala existe em todo
 * idioma suportado — é essa garantia, e não o assunto do cenário, que justifica
 * o arquivo à parte.
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
 * Cenários adicionais, em todos os idiomas
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
      },
      {
        en: 'How many bags are you checking in today?',
        es: '¿Cuántas maletas va a facturar?',
        fr: 'Combien de bagages enregistrez-vous ?',
        it: 'Quanti bagagli deve imbarcare?',
        de: 'Wie viele Gepäckstücke geben Sie auf?',
      },
      {
        en: 'I am sorry, your flight is delayed by two hours.',
        es: 'Lo siento, su vuelo tiene un retraso de dos horas.',
        fr: 'Je suis désolé, votre vol a deux heures de retard.',
        it: 'Mi dispiace, il suo volo è in ritardo di due ore.',
        de: 'Es tut mir leid, Ihr Flug hat zwei Stunden Verspätung.',
      },
      {
        en: 'Your gate is B12. Boarding starts at eleven. Have a good flight!',
        es: 'Su puerta es la B12. El embarque empieza a las once. ¡Buen viaje!',
        fr: 'Votre porte est la B12. L’embarquement commence à onze heures. Bon voyage !',
        it: 'Il suo gate è il B12. L’imbarco inizia alle undici. Buon viaggio!',
        de: 'Ihr Gate ist B12. Das Boarding beginnt um elf. Guten Flug!',
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
      },
      {
        en: 'How long have you had these symptoms?',
        es: '¿Desde cuándo tiene estos síntomas?',
        fr: 'Depuis combien de temps avez-vous ces symptômes ?',
        it: 'Da quanto tempo ha questi sintomi?',
        de: 'Seit wann haben Sie diese Beschwerden?',
      },
      {
        en: 'Are you taking any medication at the moment?',
        es: '¿Está tomando alguna medicación?',
        fr: 'Prenez-vous des médicaments en ce moment ?',
        it: 'Sta prendendo qualche farmaco?',
        de: 'Nehmen Sie zurzeit Medikamente?',
      },
      {
        en: 'Take this twice a day after meals, and come back in a week.',
        es: 'Tome esto dos veces al día después de comer y vuelva en una semana.',
        fr: 'Prenez ceci deux fois par jour après les repas et revenez dans une semaine.',
        it: 'Prenda questo due volte al giorno dopo i pasti e torni fra una settimana.',
        de: 'Nehmen Sie das zweimal täglich nach dem Essen und kommen Sie in einer Woche wieder.',
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
      },
      {
        en: 'The rent is 900 a month, bills not included.',
        es: 'El alquiler es de 900 al mes, sin gastos incluidos.',
        fr: 'Le loyer est de 900 par mois, charges non comprises.',
        it: "L'affitto è 900 al mese, spese escluse.",
        de: 'Die Miete beträgt 900 im Monat, ohne Nebenkosten.',
      },
      {
        en: 'The contract is for one year. Would that work for you?',
        es: 'El contrato es de un año. ¿Le viene bien?',
        fr: 'Le bail est d’un an. Cela vous convient ?',
        it: 'Il contratto è di un anno. Le va bene?',
        de: 'Der Vertrag läuft ein Jahr. Wäre das in Ordnung?',
      },
      {
        en: 'If you decide today, I can lower the deposit.',
        es: 'Si se decide hoy, puedo bajar la fianza.',
        fr: 'Si vous vous décidez aujourd’hui, je peux baisser la caution.',
        it: 'Se decide oggi, posso ridurre la caparra.',
        de: 'Wenn Sie sich heute entscheiden, kann ich die Kaution senken.',
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
      },
      {
        en: 'I am not sure that deadline is realistic. What do you think?',
        es: 'No estoy seguro de que ese plazo sea realista. ¿Qué opina?',
        fr: 'Je ne suis pas sûr que ce délai soit réaliste. Qu’en pensez-vous ?',
        it: 'Non sono sicuro che quella scadenza sia realistica. Lei che ne pensa?',
        de: 'Ich bin nicht sicher, ob die Frist realistisch ist. Was meinen Sie?',
      },
      {
        en: 'If we push it by a week, what would we lose?',
        es: 'Si lo retrasamos una semana, ¿qué perderíamos?',
        fr: 'Si on décale d’une semaine, qu’est-ce qu’on perd ?',
        it: 'Se lo spostiamo di una settimana, cosa perdiamo?',
        de: 'Wenn wir eine Woche verschieben, was verlieren wir?',
      },
      {
        en: 'Good. Let us agree on that and review it on Friday.',
        es: 'Bien. Acordemos eso y lo revisamos el viernes.',
        fr: 'Très bien. On acte ça et on revoit vendredi.',
        it: 'Bene. Decidiamo così e rivediamo venerdì.',
        de: 'Gut. Halten wir das fest und schauen Freitag noch mal.',
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
      },
      {
        en: 'No way! Tell me everything.',
        es: '¡No me digas! Cuéntamelo todo.',
        fr: 'Sérieux ! Raconte-moi tout.',
        it: 'Ma dai! Raccontami tutto.',
        de: 'Echt jetzt? Erzähl mal alles.',
      },
      {
        en: 'Same here, honestly. Work has been non-stop.',
        es: 'Igual, la verdad. El trabajo no para.',
        fr: 'Pareil, franchement. Le boulot n’arrête pas.',
        it: 'Uguale, sinceramente. Il lavoro non si ferma.',
        de: 'Bei mir genauso, ehrlich. Die Arbeit hört nicht auf.',
      },
      {
        en: 'Let us not wait another year. Next weekend?',
        es: 'No esperemos otro año. ¿El finde que viene?',
        fr: 'On n’attend pas encore un an. Le week-end prochain ?',
        it: 'Non aspettiamo un altro anno. Il weekend prossimo?',
        de: 'Lass uns nicht noch ein Jahr warten. Nächstes Wochenende?',
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
      },
      {
        en: 'I understand. Do you have the receipt with you?',
        es: 'Entiendo. ¿Tiene el recibo?',
        fr: 'Je comprends. Avez-vous le reçu ?',
        it: 'Capisco. Ha lo scontrino?',
        de: 'Ich verstehe. Haben Sie die Quittung dabei?',
      },
      {
        en: 'I am afraid I cannot refund it, but I can offer an exchange.',
        es: 'Me temo que no puedo devolverle el dinero, pero puedo cambiárselo.',
        fr: 'Je ne peux malheureusement pas rembourser, mais je peux échanger.',
        it: 'Purtroppo non posso rimborsare, ma posso sostituirlo.',
        de: 'Leider kann ich nicht erstatten, aber ich kann es umtauschen.',
      },
      {
        en: 'Let me speak to my manager and see what we can do.',
        es: 'Déjeme hablar con mi responsable a ver qué podemos hacer.',
        fr: 'Laissez-moi voir avec mon responsable ce qu’on peut faire.',
        it: 'Mi lasci parlare con il responsabile per vedere cosa possiamo fare.',
        de: 'Lassen Sie mich mit meinem Vorgesetzten sprechen.',
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
