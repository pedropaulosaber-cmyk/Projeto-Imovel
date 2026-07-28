/**
 * Lumo — Camada de IA
 * ====================
 *
 * Define o contrato do provedor de IA e a política de degradação.
 *
 * ## Regra arquitetural: a IA é um acelerador, nunca um requisito
 *
 * Nenhum fluxo essencial do app pode depender de uma chamada de rede. Corrigir
 * exercício, agendar revisão, contar XP, conversar o básico — tudo funciona
 * offline. A IA remota **enriquece**: explica melhor, conversa mais natural,
 * escreve exercícios sob medida.
 *
 * Na prática isso significa que toda chamada aqui tem um caminho de fallback
 * determinístico, implementado em `offline-tutor.ts`.
 *
 * ## Segurança
 *
 * A chave de API **nunca** vive no app. O cliente fala com uma Edge Function
 * própria, que autentica o usuário, aplica limite de uso por plano e só então
 * chama o provedor. Um app móvel é um binário público: qualquer segredo
 * embutido nele é um segredo vazado.
 */

import type {
  CefrLevel,
  Correction,
  Exercise,
  LanguageCode,
  TutorMessage,
} from '@/domain/types';

/* ------------------------------------------------------------------ *
 * Contrato
 * ------------------------------------------------------------------ */

export type TutorContext = {
  language: LanguageCode;
  level: CefrLevel;
  /** Idioma nativo, para as explicações. */
  nativeLanguage: string;
  /** Últimas mensagens da conversa. */
  history: TutorMessage[];
  /** Palavras que o usuário está aprendendo agora — o tutor deve usá-las. */
  activeVocabulary: string[];
  /** Erros recorrentes detectados, para o tutor reforçar. */
  knownWeaknesses: string[];
  scenario?: string;
};

export type WritingFeedback = {
  /** Nota 0–100. */
  score: number;
  corrections: Correction[];
  /** Versão reescrita no nível-alvo. */
  rewritten: string;
  /** Comentário geral, encorajador e específico. */
  summary: string;
  strengths: string[];
  suggestions: string[];
};

export type ExplainedError = {
  explanation: string;
  rule: string;
  examples: { correct: string; incorrect: string }[];
};

export interface AiProvider {
  /** Resposta do tutor em conversa. */
  chat(
    context: TutorContext,
    message: string,
  ): Promise<{ reply: string; corrections: Correction[] }>;

  /** Explicação didática de um erro cometido. */
  explainError(params: {
    language: LanguageCode;
    nativeLanguage: string;
    level: CefrLevel;
    userAnswer: string;
    correctAnswer: string;
    prompt: string;
  }): Promise<ExplainedError>;

  /** Correção de texto livre (redação). */
  reviewWriting(params: {
    language: LanguageCode;
    nativeLanguage: string;
    level: CefrLevel;
    text: string;
    task: string;
  }): Promise<WritingFeedback>;

  /** Geração de exercícios sob medida a partir do vocabulário fraco. */
  generateExercises(params: {
    language: LanguageCode;
    level: CefrLevel;
    lessonId: string;
    terms: string[];
    count: number;
  }): Promise<Exercise[]>;

  /** Traduz uma frase mantendo registro e nível. */
  translate(params: {
    text: string;
    from: string;
    to: string;
  }): Promise<string>;

  /** Está disponível agora? (rede + cota do plano) */
  isAvailable(): Promise<boolean>;
}

/* ------------------------------------------------------------------ *
 * Provedor remoto
 * ------------------------------------------------------------------ */

export type RemoteAiConfig = {
  /** URL da Edge Function que faz a ponte com o provedor. */
  endpoint: string;
  /** Token do usuário — não a chave do provedor. */
  getAccessToken: () => Promise<string | null>;
  /** Timeout curto: se a IA demora, o fallback offline responde melhor. */
  timeoutMs?: number;
};

export class RemoteAiProvider implements AiProvider {
  constructor(private readonly config: RemoteAiConfig) {}

  private async call<T>(operation: string, body: unknown): Promise<T> {
    const token = await this.config.getAccessToken();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs ?? 12_000);

    try {
      const response = await fetch(`${this.config.endpoint}/${operation}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`IA indisponível (${response.status})`);
      }

      return (await response.json()) as T;
    } finally {
      clearTimeout(timeout);
    }
  }

  async chat(context: TutorContext, message: string) {
    return this.call<{ reply: string; corrections: Correction[] }>('chat', {
      context: serializeContext(context),
      message,
    });
  }

  async explainError(params: Parameters<AiProvider['explainError']>[0]) {
    return this.call<ExplainedError>('explain-error', params);
  }

  async reviewWriting(params: Parameters<AiProvider['reviewWriting']>[0]) {
    return this.call<WritingFeedback>('review-writing', params);
  }

  async generateExercises(params: Parameters<AiProvider['generateExercises']>[0]) {
    return this.call<Exercise[]>('generate-exercises', params);
  }

  async translate(params: Parameters<AiProvider['translate']>[0]) {
    const result = await this.call<{ text: string }>('translate', params);
    return result.text;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const token = await this.config.getAccessToken();
      if (!token) return false;
      const response = await fetch(`${this.config.endpoint}/health`, { method: 'GET' });
      return response.ok;
    } catch {
      return false;
    }
  }
}

/**
 * Enxuga o contexto antes de enviar.
 *
 * Duas motivações: custo de tokens e privacidade. Só sobem as últimas 12
 * mensagens e nenhum dado identificável — o servidor já sabe quem é o usuário
 * pelo token, não precisa do nome dentro do prompt.
 */
function serializeContext(context: TutorContext) {
  return {
    language: context.language,
    level: context.level,
    nativeLanguage: context.nativeLanguage,
    scenario: context.scenario,
    activeVocabulary: context.activeVocabulary.slice(0, 30),
    knownWeaknesses: context.knownWeaknesses.slice(0, 10),
    history: context.history.slice(-12).map((message) => ({
      role: message.role,
      content: message.content,
    })),
  };
}

/* ------------------------------------------------------------------ *
 * Composição com fallback
 * ------------------------------------------------------------------ */

/**
 * Envolve um provedor remoto com um fallback local.
 *
 * Toda chamada tenta o remoto; qualquer falha (sem rede, timeout, cota
 * estourada, erro do provedor) cai silenciosamente no offline. O usuário nunca
 * vê um erro de IA — vê uma resposta um pouco mais simples.
 */
export class ResilientAiProvider implements AiProvider {
  constructor(
    private readonly remote: AiProvider | null,
    private readonly offline: AiProvider,
  ) {}

  private async withFallback<K extends keyof AiProvider>(
    operation: K,
    invoke: (provider: AiProvider) => Promise<unknown>,
  ): Promise<unknown> {
    if (this.remote) {
      try {
        return await invoke(this.remote);
      } catch (error) {
        console.info(`[lumo/ai] ${String(operation)} caiu para o modo offline.`, error);
      }
    }
    return invoke(this.offline);
  }

  async chat(context: TutorContext, message: string) {
    return this.withFallback('chat', (provider) => provider.chat(context, message)) as Promise<{
      reply: string;
      corrections: Correction[];
    }>;
  }

  async explainError(params: Parameters<AiProvider['explainError']>[0]) {
    return this.withFallback('explainError', (provider) =>
      provider.explainError(params),
    ) as Promise<ExplainedError>;
  }

  async reviewWriting(params: Parameters<AiProvider['reviewWriting']>[0]) {
    return this.withFallback('reviewWriting', (provider) =>
      provider.reviewWriting(params),
    ) as Promise<WritingFeedback>;
  }

  async generateExercises(params: Parameters<AiProvider['generateExercises']>[0]) {
    return this.withFallback('generateExercises', (provider) =>
      provider.generateExercises(params),
    ) as Promise<Exercise[]>;
  }

  async translate(params: Parameters<AiProvider['translate']>[0]) {
    return this.withFallback('translate', (provider) =>
      provider.translate(params),
    ) as Promise<string>;
  }

  async isAvailable(): Promise<boolean> {
    if (!this.remote) return false;
    return this.remote.isAvailable();
  }
}
