import 'server-only';

import { randomBytes } from 'node:crypto';

import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { env, integrations } from '@/config/env';
import { integrationUnavailable, validationFailed } from '@/lib/errors';

/**
 * Armazenamento de arquivos
 * =========================
 *
 * ## O bucket é privado. Sempre.
 *
 * Arquivo vendido não pode ter URL pública, nem "difícil de adivinhar". URL
 * secreta é URL vazada: ela aparece no histórico do navegador, no `Referer`
 * de qualquer link clicado a partir do arquivo, no log do CDN e no grupo de
 * WhatsApp em que o comprador compartilhou.
 *
 * O padrão correto é o daqui: o cliente **nunca** recebe a chave do objeto.
 * Ele pede o download, o servidor confirma que a compra existe, e só então
 * assina uma URL que vale poucos minutos.
 *
 * ## Por que a chave inclui um segmento aleatório
 *
 * `products/<id>/<aleatório>/<nome>` — mesmo que uma URL assinada vaze depois
 * de expirada, o caminho não é derivável a partir do id do produto. É defesa
 * em profundidade: a autorização já barra, e o nome não ajuda quem tentar.
 */

let client: S3Client | null = null;

function getClient(): S3Client {
  if (!integrations.storage) throw integrationUnavailable('armazenamento de arquivos');

  client ??= new S3Client({
    region: env.S3_REGION,
    // `endpoint` presente permite MinIO, R2, Spaces e afins. Sem ele, cai na
    // AWS — que é o padrão e não precisa de configuração extra.
    ...(env.S3_ENDPOINT ? { endpoint: env.S3_ENDPOINT, forcePathStyle: true } : {}),
    credentials: {
      accessKeyId: env.S3_ACCESS_KEY_ID!,
      secretAccessKey: env.S3_SECRET_ACCESS_KEY!,
    },
  });

  return client;
}

/**
 * Tipos aceitos no upload de entregável.
 *
 * Lista de permissão, nunca de bloqueio. Bloquear `.exe` e `.sh` deixa passar
 * as centenas de outras extensões executáveis que ninguém lembrou — e basta
 * uma. Aqui, o que não está na lista não entra.
 *
 * `text/html` fica de fora de propósito: um HTML servido do mesmo domínio
 * executa JavaScript no contexto da aplicação, o que é XSS armazenado com
 * upload de arquivo como vetor.
 */
const ALLOWED_CONTENT_TYPES = new Set([
  'application/json',
  'application/pdf',
  'application/zip',
  'application/x-yaml',
  'text/yaml',
  'text/markdown',
  'text/plain',
  'text/csv',
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/svg+xml',
]);

const MAX_FILE_BYTES = 100 * 1024 * 1024;

/**
 * Higieniza o nome do arquivo.
 *
 * Remove separador de diretório e sequências `..` — sem isto, um nome como
 * `../../../etc/passwd` faz o objeto ser gravado fora do prefixo pretendido
 * (path traversal). O nome também vai para o `Content-Disposition` do
 * download, então aspas e quebras de linha precisam sair junto.
 */
export function sanitizeFilename(input: string): string {
  const base = input.split(/[/\\]/).pop() ?? 'arquivo';
  const clean = base
    .replace(/\.{2,}/g, '.')
    .replace(/[^\w.\- ]+/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120);

  return clean || 'arquivo';
}

export function assertUploadAllowed(file: { contentType: string; sizeBytes: number }): void {
  if (!ALLOWED_CONTENT_TYPES.has(file.contentType)) {
    throw validationFailed(
      'Formato não aceito. Envie ZIP, JSON, YAML, PDF, Markdown, CSV ou imagem.',
    );
  }

  if (file.sizeBytes > MAX_FILE_BYTES) {
    throw validationFailed('Arquivo maior que 100 MB. Divida em partes ou use um link externo.');
  }

  if (file.sizeBytes <= 0) {
    throw validationFailed('Arquivo vazio.');
  }
}

/** Chave do objeto no bucket. */
export function buildStorageKey(productId: string, filename: string): string {
  const scope = randomBytes(12).toString('hex');
  return `products/${productId}/${scope}/${sanitizeFilename(filename)}`;
}

/**
 * URL assinada para o **criador** enviar o arquivo.
 *
 * O upload vai direto do navegador para o bucket, sem passar pelo servidor de
 * aplicação. Isso evita que um arquivo de 100 MB ocupe memória e tempo de um
 * processo que deveria estar respondendo páginas.
 *
 * O `ContentType` entra na assinatura: o cliente não consegue enviar um tipo
 * diferente do que foi autorizado.
 */
export async function createUploadUrl(input: {
  key: string;
  contentType: string;
  sizeBytes: number;
}): Promise<string> {
  assertUploadAllowed(input);

  return getSignedUrl(
    getClient(),
    new PutObjectCommand({
      Bucket: env.S3_BUCKET!,
      Key: input.key,
      ContentType: input.contentType,
      ContentLength: input.sizeBytes,
    }),
    { expiresIn: 900 },
  );
}

/**
 * URL assinada de download.
 *
 * **Não** verifica autorização — quem chama já verificou. A separação é
 * deliberada: esta função assina, `issueDownload` decide. Misturar as duas
 * responsabilidades é como se acaba assinando uma URL num caminho que
 * esqueceu de checar a compra.
 *
 * O `ResponseContentDisposition` força o download com o nome original em vez
 * de abrir no navegador — e `attachment` também impede que um SVG enviado
 * como entregável seja renderizado (e execute script) no domínio do bucket.
 */
export async function createDownloadUrl(input: { key: string; filename: string }): Promise<string> {
  return getSignedUrl(
    getClient(),
    new GetObjectCommand({
      Bucket: env.S3_BUCKET!,
      Key: input.key,
      ResponseContentDisposition: `attachment; filename="${sanitizeFilename(input.filename)}"`,
    }),
    { expiresIn: env.S3_SIGNED_URL_TTL },
  );
}

export const storageAvailable = integrations.storage;
