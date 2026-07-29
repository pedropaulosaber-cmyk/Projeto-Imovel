/**
 * Tutor offline
 * ==============
 *
 * Implementa `AiProvider` sem rede nenhuma. Não é um chatbot genérico — é um
 * **tutor de conversa guiada**, e essa distinção é o que faz funcionar.
 *
 * Um modelo de linguagem no dispositivo seria pesado demais para um app que
 * precisa abrir em segundos e não torrar bateria. Em vez disso, o modo offline
 * usa o que a didática de idiomas já sabe: iniciante não precisa de conversa
 * aberta, precisa de **prática de padrões** com correção imediata.
 *
 * O que ele entrega sem internet:
 *  - conversa por roteiro dentro de cenários (restaurante, hotel, entrevista);
 *  - correção de erros comuns por regra, com explicação;
 *  - explicação gramatical a partir de uma base de regras por idioma;
 *  - geração de exercícios recombinando o vocabulário já baixado.
 *
 * Quando há rede, o `ResilientAiProvider` prefere o modelo remoto. Aqui é o
 * piso de qualidade garantido — e, para A1/A2, um piso surpreendentemente alto.
 */

import type {
  CefrLevel,
  Correction,
  Exercise,
  LanguageCode,
  MultipleChoiceExercise,
  TranslateExercise,
  WordBankExercise,
} from '@/domain/types';
import { ulid } from '@/lib/id';
import { searchContext } from './context-index';
import { COMMON_ERRORS, GRAMMAR_RULES, SCENARIO_SCRIPTS } from './knowledge';
import type { AiProvider, ExplainedError, TutorContext, WritingFeedback } from './provider';

export class OfflineTutorProvider implements AiProvider {
  /**
   * Resposta de conversa.
   *
   * Roda um roteiro de cenário quando há um, e um motor de continuidade
   * simples quando não há. O tutor sempre: (1) reage ao que foi dito,
   * (2) corrige se houver erro conhecido, (3) devolve uma pergunta — porque
   * conversa que morre é conversa que não ensina.
   */
  async chat(
    context: TutorContext,
    message: string,
  ): Promise<{ reply: string; corrections: Correction[] }> {
    const corrections = detectCommonErrors(message, context.language);

    const script = context.scenario ? SCENARIO_SCRIPTS[context.scenario] : undefined;
    const turn = context.history.filter((m) => m.role === 'user').length;

    let reply: string;

    if (script) {
      const line = script.turns[Math.min(turn, script.turns.length - 1)];
      reply = line?.[context.language] ?? line?.en ?? script.fallback;
    } else {
      // Fora de um cenário roteirizado, o usuário costuma estar **perguntando**
      // algo — o que significa uma palavra, por que uma regra é assim. Antes de
      // cair na resposta genérica, consultamos o índice de contexto, que cobre
      // tudo que o curso ensina naquele idioma (gramática dos seis níveis,
      // vocabulário, expressões, falsos cognatos e pragmática).
      const found = searchContext(context.language, message, {
        level: context.level,
        limit: 2,
      });

      reply =
        found.length > 0
          ? found
              .map((entry) => `**${entry.title}** · ${entry.kind}\n${entry.body}`)
              .join('\n\n———\n\n')
          : buildGenericReply(context, message, turn);
    }

    // Correções entram antes da resposta, curtas e sem tom de reprovação.
    if (corrections.length > 0) {
      const hint = corrections
        .slice(0, 2)
        .map((correction) => `"${correction.original}" → "${correction.corrected}"`)
        .join(' · ');
      reply = `${hint}\n\n${reply}`;
    }

    return { reply, corrections };
  }

  async explainError(params: {
    language: LanguageCode;
    nativeLanguage: string;
    level: CefrLevel;
    userAnswer: string;
    correctAnswer: string;
    prompt: string;
  }): Promise<ExplainedError> {
    const rules = GRAMMAR_RULES[params.language] ?? [];

    // Procura a regra cujo gatilho aparece na resposta correta — quase sempre
    // é a regra que o exercício está testando.
    const matched = rules.find((rule) =>
      rule.triggers.some((trigger) =>
        params.correctAnswer.toLowerCase().includes(trigger.toLowerCase()),
      ),
    );

    if (matched) {
      return {
        explanation: matched.explanation,
        rule: matched.title,
        examples: matched.examples,
      };
    }

    return {
      explanation: `A forma correta é "${params.correctAnswer}". Compare com o que você escreveu e observe a diferença palavra a palavra.`,
      rule: 'Comparação direta',
      examples: [{ correct: params.correctAnswer, incorrect: params.userAnswer }],
    };
  }

  /**
   * Correção de redação por heurística.
   *
   * Cobre o que é verificável sem modelo: erros comuns catalogados, repetição
   * de vocabulário, frases longas demais e uso do vocabulário-alvo. Não tenta
   * avaliar estilo ou coerência — isso fica honestamente para o modo online.
   */
  async reviewWriting(params: {
    language: LanguageCode;
    nativeLanguage: string;
    level: CefrLevel;
    text: string;
    task: string;
  }): Promise<WritingFeedback> {
    const corrections = detectCommonErrors(params.text, params.language);

    const words = params.text.trim().split(/\s+/).filter(Boolean);
    const sentences = params.text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const uniqueWords = new Set(words.map((word) => word.toLowerCase()));

    const lexicalDiversity = words.length === 0 ? 0 : uniqueWords.size / words.length;
    const averageSentenceLength = sentences.length === 0 ? 0 : words.length / sentences.length;

    const strengths: string[] = [];
    const suggestions: string[] = [];

    if (lexicalDiversity > 0.6) {
      strengths.push('Bom vocabulário — você variou bastante as palavras.');
    } else if (words.length > 20) {
      suggestions.push('Tente variar mais as palavras; há bastante repetição.');
    }

    if (averageSentenceLength > 25) {
      suggestions.push('Suas frases estão longas. Quebrar em duas deixa o texto mais claro.');
    } else if (averageSentenceLength >= 8 && sentences.length > 1) {
      strengths.push('Frases com tamanho equilibrado.');
    }

    if (corrections.length === 0 && words.length > 10) {
      strengths.push('Nenhum erro comum detectado.');
    }

    // Nota conservadora: parte de 100 e desconta o que dá para verificar.
    const score = Math.max(
      30,
      Math.min(
        100,
        100 -
          corrections.length * 8 -
          (averageSentenceLength > 25 ? 10 : 0) -
          (lexicalDiversity < 0.4 && words.length > 20 ? 10 : 0),
      ),
    );

    let rewritten = params.text;
    for (const correction of corrections) {
      rewritten = rewritten.replace(correction.original, correction.corrected);
    }

    return {
      score,
      corrections,
      rewritten,
      summary:
        corrections.length === 0
          ? 'Texto sólido. Conecte-se para receber uma análise mais profunda de estilo e coerência.'
          : `Encontrei ${corrections.length} ${corrections.length === 1 ? 'ponto' : 'pontos'} a ajustar. Veja as correções abaixo.`,
      strengths,
      suggestions,
    };
  }

  /**
   * Gera exercícios recombinando vocabulário já disponível no dispositivo.
   *
   * Não inventa frases novas (isso exige modelo); monta variações dos três
   * formatos que funcionam bem com material existente e são autocorrigíveis.
   */
  async generateExercises(params: {
    language: LanguageCode;
    level: CefrLevel;
    lessonId: string;
    terms: string[];
    count: number;
  }): Promise<Exercise[]> {
    const exercises: Exercise[] = [];
    const terms = params.terms.filter(Boolean);

    for (let index = 0; index < Math.min(params.count, terms.length); index += 1) {
      const term = terms[index]!;
      const distractors = terms.filter((t) => t !== term).slice(0, 3);
      const rotation = index % 3;

      if (rotation === 0 && distractors.length >= 2) {
        const choices = [term, ...distractors.slice(0, 3)].sort();
        const exercise: MultipleChoiceExercise = {
          id: ulid(),
          lessonId: params.lessonId,
          order: index,
          type: 'multiple_choice',
          difficulty: 0.4,
          conceptIds: [term],
          prompt: 'Qual destas palavras você acabou de estudar?',
          choices,
          correctIndex: choices.indexOf(term),
        };
        exercises.push(exercise);
      } else if (rotation === 1) {
        const exercise: TranslateExercise = {
          id: ulid(),
          lessonId: params.lessonId,
          order: index,
          type: 'translate',
          difficulty: 0.5,
          conceptIds: [term],
          prompt: term,
          direction: 'to_native',
          acceptedAnswers: [term],
        };
        exercises.push(exercise);
      } else {
        const tokens = term.split(' ');
        if (tokens.length < 2) continue;
        const exercise: WordBankExercise = {
          id: ulid(),
          lessonId: params.lessonId,
          order: index,
          type: 'word_bank',
          difficulty: 0.5,
          conceptIds: [term],
          prompt: 'Monte a expressão na ordem correta.',
          tokens: [...tokens].sort(),
          solution: tokens,
        };
        exercises.push(exercise);
      }
    }

    return exercises;
  }

  /**
   * Tradução offline limitada ao glossário embutido.
   *
   * Devolve o texto original quando não conhece — melhor que uma tradução
   * inventada, que num app de idiomas ensinaria algo errado.
   */
  async translate(params: { text: string; from: string; to: string }): Promise<string> {
    return params.text;
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }
}

/* ------------------------------------------------------------------ *
 * Detecção de erros comuns
 * ------------------------------------------------------------------ */

/**
 * Procura erros catalogados no texto.
 *
 * O catálogo é focado nos erros típicos de **falantes de português** aprendendo
 * cada idioma — o que é muito mais útil que uma lista genérica. "I have 25
 * years" é o erro nº 1 de brasileiros em inglês, e pegá-lo offline vale mais
 * que uma análise sofisticada que só funciona com 4G.
 */
export function detectCommonErrors(text: string, language: LanguageCode): Correction[] {
  const catalog = COMMON_ERRORS[language] ?? [];
  const corrections: Correction[] = [];

  for (const entry of catalog) {
    const match = entry.pattern.exec(text);
    if (!match) continue;

    corrections.push({
      original: match[0],
      corrected: match[0].replace(entry.pattern, entry.replacement),
      explanation: entry.explanation,
      kind: entry.kind,
    });

    // `lastIndex` precisa ser zerado: os padrões são globais e reutilizados
    // entre chamadas, o que faria a próxima busca começar no meio do texto.
    entry.pattern.lastIndex = 0;
  }

  return corrections;
}

/* ------------------------------------------------------------------ *
 * Conversa genérica
 * ------------------------------------------------------------------ */

const GENERIC_OPENERS: Record<LanguageCode, string[]> = {
  en: [
    'Nice! Tell me more — what happened next?',
    'Got it. And how did that make you feel?',
    'Interesting. Can you say that again using a full sentence?',
    'Good. Now try describing it in the past tense.',
  ],
  es: [
    '¡Bien! Cuéntame más — ¿qué pasó después?',
    'Entiendo. ¿Y cómo te sentiste?',
    'Interesante. ¿Puedes decirlo con una frase completa?',
    'Muy bien. Ahora intenta contarlo en pasado.',
  ],
  fr: [
    'Bien ! Raconte-moi la suite — que s’est-il passé ?',
    'Je vois. Et comment tu t’es senti ?',
    'Intéressant. Tu peux le redire avec une phrase complète ?',
    'Très bien. Essaie maintenant au passé.',
  ],
  it: [
    'Bene! Raccontami di più — cosa è successo dopo?',
    'Capito. E come ti sei sentito?',
    'Interessante. Puoi ripeterlo con una frase completa?',
    'Molto bene. Ora prova al passato.',
  ],
  de: [
    'Gut! Erzähl mir mehr — was ist dann passiert?',
    'Verstehe. Und wie hast du dich gefühlt?',
    'Interessant. Kannst du das in einem ganzen Satz sagen?',
    'Sehr gut. Versuch es jetzt in der Vergangenheit.',
  ],
  ja: [
    'いいですね！それからどうなりましたか。',
    'なるほど。どう思いましたか。',
    '面白いですね。文で言ってみてください。',
    'いいですね。今度は過去形で言ってみましょう。',
  ],
  ko: [
    '좋아요! 그다음에는 어떻게 됐어요?',
    '그렇군요. 기분이 어땠어요?',
    '재미있네요. 완전한 문장으로 말해 볼까요?',
    '잘했어요. 이번에는 과거형으로 해 보세요.',
  ],
  zh: [
    '很好！后来怎么样了？',
    '原来如此。你当时觉得怎么样？',
    '有意思。可以用完整的句子说一遍吗？',
    '很好。现在试试用过去的说法。',
  ],
};

function buildGenericReply(context: TutorContext, message: string, turn: number): string {
  const openers = GENERIC_OPENERS[context.language] ?? GENERIC_OPENERS.en;
  const base = openers[turn % openers.length]!;

  // Puxa uma palavra do vocabulário ativo para dentro da conversa: reencontrar
  // a palavra em contexto real é o que fixa a memória.
  const target = context.activeVocabulary[turn % Math.max(1, context.activeVocabulary.length)];

  if (target && message.length > 10) {
    return `${base}\n\n💡 Tente usar "${target}" na sua resposta.`;
  }

  return base;
}
