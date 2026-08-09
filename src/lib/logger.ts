import { isAppError } from './errors';

/**
 * Log estruturado
 * ===============
 *
 * Uma linha por evento, em JSON, com campos estáveis. A razão é operacional:
 * `console.log('usuário', id, 'comprou', produto)` é legível por uma pessoa
 * olhando o terminal e inútil para qualquer agregador — não dá para filtrar,
 * contar nem alertar sobre texto livre.
 *
 * ## Redação de dado sensível
 *
 * O `redact` abaixo não é zelo: log é o vazamento mais comum que existe,
 * porque ninguém pensa no log ao tratar dado sensível. Senha, token e chave
 * de API são cortados **na serialização**, não na chamada, justamente para não
 * depender de quem chama lembrar.
 */

type Level = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_ORDER: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };

function threshold(): number {
  const configured = (process.env.LOG_LEVEL ?? 'info') as Level;
  return LEVEL_ORDER[configured] ?? LEVEL_ORDER.info;
}

/** Chaves cujo valor nunca deve chegar ao log, em qualquer profundidade. */
const SECRET_KEYS =
  /^(password|passwordHash|token|tokenHash|secret|authorization|cookie|apiKey|accessToken|refreshToken|cardNumber|cvv)$/i;

type Serializable = string | number | boolean | null | undefined | Serializable[] | { [k: string]: Serializable };

function redact(value: unknown, depth = 0): Serializable {
  if (depth > 6) return '[profundo demais]';
  if (value === null || value === undefined) return null;

  const type = typeof value;
  if (type === 'string' || type === 'number' || type === 'boolean') return value as Serializable;
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.slice(0, 50).map((item) => redact(item, depth + 1));

  if (type === 'object') {
    const output: Record<string, Serializable> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      output[key] = SECRET_KEYS.test(key) ? '[redigido]' : redact(nested, depth + 1);
    }
    return output;
  }

  return String(value);
}

/**
 * Erro serializado.
 *
 * `Error` não sobrevive a `JSON.stringify` — vira `{}`, que é o pior resultado
 * possível: o log existe, parece completo e não diz nada. A `cause` é seguida
 * porque é onde mora a causa raiz quando o erro foi reembrulhado.
 */
function serializeError(error: unknown, depth = 0): Serializable {
  if (!(error instanceof Error)) return redact(error);

  const base: Record<string, Serializable> = {
    name: error.name,
    message: error.message,
    // `stack` só em erro inesperado: erro de aplicação é fluxo normal e o
    // stack só polui.
    ...(isAppError(error) ? { code: error.code } : { stack: error.stack ?? null }),
  };

  if (error.cause && depth < 3) base.cause = serializeError(error.cause, depth + 1);
  return base;
}

function emit(level: Level, message: string, context?: Record<string, unknown>): void {
  if (LEVEL_ORDER[level] < threshold()) return;

  const line = JSON.stringify({
    level,
    time: new Date().toISOString(),
    message,
    ...(context ? { context: redact(context) } : {}),
  });

  // `warn` e `error` vão para stderr, o resto para stdout: é a separação que
  // faz um coletor de logs conseguir alertar sem parsear o nível.
  if (level === 'error' || level === 'warn') process.stderr.write(`${line}\n`);
  else process.stdout.write(`${line}\n`);
}

export const logger = {
  debug: (message: string, context?: Record<string, unknown>) => emit('debug', message, context),
  info: (message: string, context?: Record<string, unknown>) => emit('info', message, context),
  warn: (message: string, context?: Record<string, unknown>) => emit('warn', message, context),

  /**
   * Falha inesperada.
   *
   * Erro de aplicação (senha errada, permissão negada) **não** passa por aqui:
   * são fluxo normal, e alertar sobre eles treina o time a ignorar alerta.
   */
  error: (message: string, error: unknown, context?: Record<string, unknown>) =>
    emit('error', message, { ...context, error: serializeError(error) }),
};
