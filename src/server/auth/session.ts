import 'server-only';

import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

import { cookies } from 'next/headers';

import { env, isProduction } from '@/config/env';
import { prisma } from '@/server/db/prisma';

/**
 * Sessão
 * ======
 *
 * ## A decisão: token opaco em banco, não JWT
 *
 * JWT é atraente porque não consulta o banco. O preço é que **não dá para
 * revogar**: quem tem o token continua autenticado até ele expirar, mesmo
 * depois de o usuário trocar a senha, ser banido, perder o papel de admin ou
 * clicar em "sair de todos os dispositivos". Para uma plataforma que move
 * dinheiro e tem papéis administrativos, isso não é aceitável — a revogação
 * imediata é o requisito, e a consulta ao banco é o preço barato dela
 * (uma leitura por id indexado).
 *
 * ## O token no banco é um hash
 *
 * Guardamos SHA-256 do token, nunca o token. Um vazamento de leitura no banco
 * (backup exposto, SQL injection em outra query, dump de suporte) daria ao
 * atacante uma sessão válida de **todo mundo** se o token estivesse em claro.
 *
 * SHA-256 e não argon2 de propósito: o token tem 256 bits de entropia
 * aleatória. KDF lento existe para compensar a entropia baixa de senha humana;
 * aqui não há o que compensar, e um KDF lento em toda requisição autenticada
 * seria só latência.
 *
 * ## Expiração deslizante
 *
 * A sessão vale 30 dias e se renova quando usada, mas só depois de um dia de
 * uso — renovar a cada requisição seria uma escrita no banco por page view.
 */

const COOKIE_NAME = 'automatize_session';
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const RENEW_AFTER_MS = 24 * 60 * 60 * 1000;

function hashToken(token: string): string {
  // O `AUTH_SECRET` entra como pimenta: mesmo com o banco inteiro nas mãos, o
  // atacante não consegue pré-computar hashes sem também ter o segredo da
  // aplicação, que mora em outro lugar (gerenciador de segredos, não no dump).
  return createHash('sha256').update(`${token}${env.AUTH_SECRET}`).digest('hex');
}

/** Hash de IP para o registro de sessão — ver a nota em `hashIp`. */
export function hashIp(ip: string | null): string | null {
  if (!ip) return null;
  // IP é dado pessoal sob a LGPD. Guardamos o hash: continua servindo para
  // detectar "mesma sessão em cinquenta lugares" sem armazenar a localização
  // de ninguém em claro.
  return createHash('sha256').update(`${ip}${env.AUTH_SECRET}`).digest('hex').slice(0, 32);
}

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  roles: string[];
  status: 'ACTIVE' | 'SUSPENDED' | 'BANNED';
};

/**
 * Cria a sessão e grava o cookie.
 *
 * Devolve o token só para teste; o caminho normal é o cookie.
 */
export async function createSession(
  userId: string,
  meta: { ip?: string | null; userAgent?: string | null } = {},
): Promise<string> {
  // 32 bytes = 256 bits. `randomBytes` usa o CSPRNG do sistema; `Math.random`
  // é previsível e já foi a causa de sequestro de sessão em produtos reais.
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await prisma.session.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      expiresAt,
      ipHash: hashIp(meta.ip ?? null),
      userAgent: meta.userAgent?.slice(0, 300) ?? null,
    },
  });

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    // Fora do alcance de qualquer JavaScript — é o que transforma um XSS em
    // dano limitado em vez de sequestro imediato da conta.
    httpOnly: true,
    // Em produção o cookie nunca viaja em claro.
    secure: isProduction,
    // `lax` bloqueia o CSRF clássico (POST de outro site) e ainda permite que
    // um link externo caia na aplicação já logado. `strict` quebraria isso sem
    // ganho real, porque as escritas já checam origem.
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });

  return token;
}

/**
 * Lê a sessão do cookie e devolve o usuário.
 *
 * Devolve `null` — não lança — em qualquer caso de falha. Quem precisa de
 * usuário obrigatório usa `requireUser`, que decide o que fazer.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    select: {
      id: true,
      expiresAt: true,
      lastUsedAt: true,
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          status: true,
          deletedAt: true,
          roles: { select: { role: true } },
        },
      },
    },
  });

  if (!session) return null;

  // Expirada: some do banco em vez de acumular. Sessão morta guardada é só
  // dado pessoal retido sem finalidade.
  if (session.expiresAt.getTime() < Date.now()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }

  // Conta banida ou excluída tem sessão viva até a revogação propagar. Checar
  // aqui é o que torna o banimento **imediato** — é justamente esta checagem
  // que o JWT não permitiria.
  if (session.user.deletedAt || session.user.status === 'BANNED') {
    await prisma.session.deleteMany({ where: { userId: session.user.id } }).catch(() => undefined);
    return null;
  }

  if (Date.now() - session.lastUsedAt.getTime() > RENEW_AFTER_MS) {
    await prisma.session
      .update({
        where: { id: session.id },
        data: { lastUsedAt: new Date(), expiresAt: new Date(Date.now() + SESSION_TTL_MS) },
      })
      .catch(() => undefined);
  }

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    avatarUrl: session.user.avatarUrl,
    roles: session.user.roles.map((entry) => entry.role),
    status: session.user.status,
  };
}

/** Encerra a sessão atual. */
export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;

  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } }).catch(() => undefined);
  }

  store.delete(COOKIE_NAME);
}

/**
 * Encerra **todas** as sessões do usuário.
 *
 * Chamado na troca de senha, na mudança de papel e no banimento. Trocar a
 * senha sem derrubar as sessões antigas é a metade do trabalho: quem roubou o
 * cookie continua dentro.
 */
export async function destroyAllSessions(userId: string): Promise<void> {
  await prisma.session.deleteMany({ where: { userId } });
}

/**
 * Comparação em tempo constante.
 *
 * Usada onde se compara segredo com segredo (assinatura de webhook, por
 * exemplo). `===` em string sai no primeiro byte diferente, e essa diferença
 * de tempo é mensurável pela rede o suficiente para reconstruir o valor.
 */
export function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
