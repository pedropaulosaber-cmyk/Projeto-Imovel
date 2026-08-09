import 'server-only';

import { cache } from 'react';

import { forbidden, notFound, unauthenticated } from '@/lib/errors';
import { getSessionUser, type SessionUser } from './session';

/**
 * Autorização
 * ===========
 *
 * Ponto único onde se responde "esta pessoa pode fazer isto?". Espalhar a
 * resposta por Server Actions e páginas é como se produz o defeito clássico:
 * dezoito lugares checam, o décimo nono esquece, e o décimo nono é o que
 * transfere dinheiro.
 *
 * ## As duas perguntas são diferentes
 *
 * **Papel** ("é CREATOR?") é grosso: diz que a pessoa pertence a uma classe.
 * **Ownership** ("este produto é dele?") é fino: diz que aquele registro é
 * dela.
 *
 * Checar só o papel é a vulnerabilidade mais comum de marketplace: qualquer
 * criador consegue editar o produto de qualquer outro criador trocando o id
 * na requisição. É IDOR, e nenhum teste de papel pega.
 *
 * Por isso `requireOwnership` existe e é obrigatório em toda escrita sobre
 * registro de terceiro.
 */

export type Role = 'BUYER' | 'CREATOR' | 'PROFESSIONAL' | 'ADMIN';

/**
 * Usuário da requisição, memoizado.
 *
 * `cache` do React deduplica dentro de **uma** requisição: layout, página e
 * três componentes podem pedir o usuário e o banco é consultado uma vez só.
 * Sem isto, uma página com sidebar, header e conteúdo faz três leituras
 * idênticas de sessão.
 */
export const currentUser = cache(async (): Promise<SessionUser | null> => getSessionUser());

/** Usuário obrigatório. Lança `UNAUTHENTICATED` quando não há sessão. */
export async function requireUser(): Promise<SessionUser> {
  const user = await currentUser();
  if (!user) throw unauthenticated();

  // Conta suspensa continua autenticando (para ver o próprio histórico e
  // contestar) mas não passa por nenhuma checagem de papel — ver `requireRole`.
  return user;
}

export function hasRole(user: SessionUser | null, role: Role): boolean {
  if (!user) return false;
  // Admin implica todos os papéis: sem isto, cada tela administrativa
  // precisaria testar `ADMIN || CREATOR`, e uma delas esqueceria.
  return user.roles.includes(role) || user.roles.includes('ADMIN');
}

export function isAdmin(user: SessionUser | null): boolean {
  return Boolean(user?.roles.includes('ADMIN'));
}

/**
 * Papel obrigatório.
 *
 * Conta suspensa é barrada aqui, e não no login: ela ainda precisa entrar para
 * ver o que aconteceu e falar com o suporte. O que ela não pode é continuar
 * publicando, vendendo ou propondo.
 */
export async function requireRole(role: Role): Promise<SessionUser> {
  const user = await requireUser();

  if (user.status !== 'ACTIVE') {
    throw forbidden('Sua conta está suspensa. Fale com o suporte para reativá-la.');
  }

  if (!hasRole(user, role)) {
    throw forbidden('Sua conta não tem esse tipo de acesso.');
  }

  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  return requireRole('ADMIN');
}

/**
 * Ownership do registro.
 *
 * Recebe o dono real (lido do banco, **nunca** do formulário) e o usuário.
 * Admin passa — é o que torna a moderação possível.
 *
 * Lança `NOT_FOUND`, não `FORBIDDEN`, de propósito: 403 confirmaria ao
 * atacante que o id existe, e é essa confirmação que transforma um chute em
 * enumeração. Ver a nota em `lib/errors.ts`.
 */
export function requireOwnership(user: SessionUser, ownerId: string): void {
  if (user.id === ownerId) return;
  if (isAdmin(user)) return;
  throw notFound();
}

/**
 * Versão que devolve booleano em vez de lançar.
 *
 * Para a interface: decidir se mostra o botão "editar" não deve exigir
 * `try/catch`. A checagem que **protege** continua sendo a que lança, no
 * servidor — esta aqui só evita oferecer ao usuário uma ação que vai falhar.
 */
export function canManage(user: SessionUser | null, ownerId: string): boolean {
  if (!user) return false;
  return user.id === ownerId || isAdmin(user);
}
