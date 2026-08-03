/**
 * Fala: síntese (TTS) e reconhecimento (STT).
 *
 * Ambos usam **recursos do sistema operacional**, não serviços de nuvem. É uma
 * decisão de produto, não só técnica:
 *
 *  - Funciona offline, que é requisito do app.
 *  - Custo zero por uso — TTS de nuvem inviabilizaria o plano gratuito.
 *  - Latência de milissegundos, não de rede. Num exercício de shadowing a
 *    latência é a diferença entre útil e inutilizável.
 *
 * O preço é a qualidade da voz variar por aparelho. Para conteúdo curado
 * (diálogos, podcasts) usamos áudio gravado e baixado; o TTS cobre o texto
 * dinâmico — palavra tocada no vocabulário, frase gerada pelo tutor.
 */

import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

import type { LanguageCode } from '@/domain/types';

/** Mapeia o idioma para a tag BCP-47 preferida pela voz do sistema. */
const VOICE_LOCALE: Record<LanguageCode, string> = {
  en: 'en-US',
  es: 'es-ES',
  fr: 'fr-FR',
  it: 'it-IT',
  de: 'de-DE',
};

export type SpeakOptions = {
  language: LanguageCode;
  /** 0.5 = metade da velocidade. Usado no controle de velocidade da escuta. */
  rate?: number;
  pitch?: number;
  onDone?: () => void;
  onError?: (error: unknown) => void;
};

export const speechService = {
  /**
   * Lê um texto em voz alta.
   *
   * Interrompe qualquer fala em andamento: tocar um áudio novo enquanto outro
   * toca é sempre um erro de UX, e deixar os dois sobrepostos é pior ainda.
   */
  async speak(text: string, options: SpeakOptions): Promise<void> {
    try {
      await this.stop();

      Speech.speak(text, {
        language: VOICE_LOCALE[options.language],
        // O TTS do sistema tende a soar rápido demais para quem está
        // aprendendo; 0.9 é o padrão calibrado para compreensão.
        rate: options.rate ?? 0.9,
        pitch: options.pitch ?? 1.0,
        onDone: options.onDone,
        onError: options.onError,
      });
    } catch (error) {
      options.onError?.(error);
    }
  },

  async stop(): Promise<void> {
    try {
      const speaking = await Speech.isSpeakingAsync();
      if (speaking) await Speech.stop();
    } catch {
      /* nada a fazer — parar a fala nunca deve lançar */
    }
  },

  async isSpeaking(): Promise<boolean> {
    try {
      return await Speech.isSpeakingAsync();
    } catch {
      return false;
    }
  },

  /** Idiomas com voz instalada no aparelho. Alimenta o aviso de "voz indisponível". */
  async availableLanguages(): Promise<string[]> {
    try {
      const voices = await Speech.getAvailableVoicesAsync();
      return [...new Set(voices.map((voice) => voice.language))];
    } catch {
      return [];
    }
  },
};

/* ------------------------------------------------------------------ *
 * Reconhecimento de fala
 * ------------------------------------------------------------------ */

export type RecognitionResult = {
  transcript: string;
  /** Confiança 0–1 informada pelo reconhecedor, quando disponível. */
  confidence: number;
  /** Verdadeiro quando o reconhecedor rodou no dispositivo. */
  onDevice: boolean;
};

export interface SpeechRecognizer {
  isAvailable(): Promise<boolean>;
  start(language: LanguageCode): Promise<void>;
  stop(): Promise<RecognitionResult>;
  cancel(): Promise<void>;
}

/*
 * Tipos mínimos da Web Speech API.
 *
 * O TypeScript não traz essas definições por padrão (a API não é padronizada
 * em todos os navegadores) e o `lib.dom` do projeto não está disponível no
 * ambiente do React Native. Declarar só o que usamos é melhor que `any`: o
 * compilador continua checando os campos que realmente tocamos.
 */
type SpeechAlternative = { transcript: string; confidence?: number };
type SpeechResultList = {
  length: number;
  [index: number]: { [index: number]: SpeechAlternative };
};
type SpeechRecognitionEventLike = { results: SpeechResultList };

type WebSpeechRecognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type SpeechRecognitionGlobal = {
  SpeechRecognition?: new () => WebSpeechRecognition;
  webkitSpeechRecognition?: new () => WebSpeechRecognition;
};

/**
 * Reconhecedor da Web Speech API (navegadores Chromium e Safari).
 *
 * Existe para que a build web tenha a funcionalidade completa. No Android e
 * iOS o app usa o reconhecedor nativo via módulo dedicado — ver
 * `docs/11-implementacao.md` para o plano de integração do build nativo.
 */
export class WebSpeechRecognizer implements SpeechRecognizer {
  private recognition: WebSpeechRecognition | null = null;
  private transcript = '';
  private confidence = 0;

  private static constructorFor(): (new () => WebSpeechRecognition) | undefined {
    const scope = globalThis as SpeechRecognitionGlobal;
    return scope.SpeechRecognition ?? scope.webkitSpeechRecognition;
  }

  async isAvailable(): Promise<boolean> {
    if (Platform.OS !== 'web') return false;
    return WebSpeechRecognizer.constructorFor() !== undefined;
  }

  async start(language: LanguageCode): Promise<void> {
    const Recognition = WebSpeechRecognizer.constructorFor();
    if (!Recognition) throw new Error('Reconhecimento de voz indisponível neste navegador.');

    this.transcript = '';
    this.confidence = 0;

    const recognition = new Recognition();
    recognition.lang = VOICE_LOCALE[language];
    // Resultados parciais deixam a UI mostrar as palavras enquanto o usuário
    // fala, o que reduz muito a sensação de travamento.
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let text = '';
      for (let i = 0; i < event.results.length; i += 1) {
        const alternative = event.results[i]?.[0];
        if (!alternative) continue;
        text += alternative.transcript;
        this.confidence = alternative.confidence ?? 0;
      }
      this.transcript = text;
    };

    this.recognition = recognition;
    recognition.start();
  }

  async stop(): Promise<RecognitionResult> {
    try {
      this.recognition?.stop();
    } catch {
      /* já parado */
    }

    // Pequena espera para o último resultado chegar antes de ler a transcrição.
    await new Promise((resolve) => setTimeout(resolve, 120));

    return {
      transcript: this.transcript,
      confidence: this.confidence,
      onDevice: true,
    };
  }

  async cancel(): Promise<void> {
    try {
      this.recognition?.abort();
    } catch {
      /* já cancelado */
    }
    this.transcript = '';
  }
}

/**
 * Reconhecedor nulo: usado quando não há suporte no ambiente.
 *
 * Devolve transcrição vazia em vez de lançar. A tela de fala detecta a
 * indisponibilidade por `isAvailable()` e oferece o modo "autoavaliação",
 * onde o usuário ouve, repete e marca ele mesmo — pior que a nota automática,
 * mas muito melhor que um botão que não faz nada.
 */
export class NullSpeechRecognizer implements SpeechRecognizer {
  async isAvailable(): Promise<boolean> {
    return false;
  }
  async start(): Promise<void> {
    /* sem operação */
  }
  async stop(): Promise<RecognitionResult> {
    return { transcript: '', confidence: 0, onDevice: false };
  }
  async cancel(): Promise<void> {
    /* sem operação */
  }
}

/** Instância adequada à plataforma atual. */
export function createSpeechRecognizer(): SpeechRecognizer {
  return Platform.OS === 'web' ? new WebSpeechRecognizer() : new NullSpeechRecognizer();
}
