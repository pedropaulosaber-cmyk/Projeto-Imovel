/**
 * Erros de aplicação
 * ==================
 *
 * O ponto deste módulo é a distinção entre **erro esperado** e **falha**.
 *
 * Erro esperado é parte do fluxo: senha errada, produto esgotado, permissão
 * negada. Tem mensagem para o usuário, tem código estável e não é incidente.
 *
 * Falha é o que não devia acontecer: banco fora, bug, invariante violada. Não
 * tem mensagem para o usuário — porque qualquer mensagem específica vaza
 * detalhe de implementação — e **tem** de aparecer no monitoramento.
 *
 * Misturar os dois produz os dois defeitos clássicos ao mesmo tempo: o usuário
 * vê "Internal Server Error" quando só digitou a senha errada, e o time não vê
 * nada quando o banco cai, porque o erro foi engolido pelo mesmo `catch` que
 * trata senha errada.
 */

export type AppErrorCode =
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'PAYMENT_REQUIRED'
  | 'INTEGRATION_UNAVAILABLE';

/** Mapa para HTTP. Fica aqui para que rota e Server Action respondam igual. */
const STATUS: Record<AppErrorCode, number> = {
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION: 422,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  PAYMENT_REQUIRED: 402,
  INTEGRATION_UNAVAILABLE: 503,
};

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly status: number;
  /** Erros por campo, quando a origem é validação de formulário. */
  readonly fieldErrors?: Record<string, string[]>;

  constructor(
    code: AppErrorCode,
    message: string,
    options?: { fieldErrors?: Record<string, string[]>; cause?: unknown },
  ) {
    super(message, options?.cause ? { cause: options.cause } : undefined);
    this.name = 'AppError';
    this.code = code;
    this.status = STATUS[code];
    if (options?.fieldErrors) this.fieldErrors = options.fieldErrors;
  }
}

export const unauthenticated = (message = 'Faça login para continuar.') =>
  new AppError('UNAUTHENTICATED', message);

/**
 * Recurso existe mas não é seu.
 *
 * Repare que quase todo lugar do código usa `notFound` no lugar deste, mesmo
 * quando o recurso existe. É deliberado: responder 403 confirma ao atacante
 * que o id que ele adivinhou é válido, o que transforma uma varredura de IDOR
 * numa enumeração eficiente. 404 não confirma nada.
 *
 * Use `forbidden` só quando o usuário **sabe** que o recurso existe — por
 * exemplo, ele vê o próprio pedido mas não pode cancelá-lo depois de pago.
 */
export const forbidden = (message = 'Você não tem permissão para esta ação.') =>
  new AppError('FORBIDDEN', message);

export const notFound = (message = 'Não encontramos o que você procura.') =>
  new AppError('NOT_FOUND', message);

export const conflict = (message: string) => new AppError('CONFLICT', message);

export const validationFailed = (
  message: string,
  fieldErrors?: Record<string, string[]>,
) => new AppError('VALIDATION', message, fieldErrors ? { fieldErrors } : undefined);

export const rateLimited = (message = 'Muitas tentativas. Aguarde um instante.') =>
  new AppError('RATE_LIMITED', message);

export const integrationUnavailable = (integration: string) =>
  new AppError(
    'INTEGRATION_UNAVAILABLE',
    `A integração de ${integration} não está configurada neste ambiente.`,
  );

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Mensagem segura para mostrar ao usuário.
 *
 * Erro de aplicação já foi escrito pensando em quem lê. Qualquer outra coisa
 * vira uma frase genérica: a mensagem de um `TypeError` ou de um erro do driver
 * de banco pode conter nome de tabela, trecho de query ou caminho de arquivo.
 */
export function publicMessage(error: unknown): string {
  if (isAppError(error)) return error.message;
  return 'Algo deu errado do nosso lado. Tente de novo em instantes.';
}
