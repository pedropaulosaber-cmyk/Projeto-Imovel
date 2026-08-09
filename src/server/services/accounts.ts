import 'server-only';

import { conflict, forbidden, notFound, validationFailed } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { slugify, uniqueSlug } from '@/lib/text';
import { audit, target } from '@/server/audit';
import type { Role } from '@/server/auth/authorize';
import { equalizeTiming, hashPassword, verifyPassword } from '@/server/auth/password';
import { createSession, destroyAllSessions, type SessionUser } from '@/server/auth/session';
import { prisma } from '@/server/db/prisma';
import { enforce } from '@/server/ratelimit';

/**
 * Contas
 * ======
 *
 * Cadastro, login e administração de papéis.
 *
 * ## A mensagem de erro do login é sempre a mesma
 *
 * "E-mail ou senha incorretos" — nunca "e-mail não cadastrado". A mensagem
 * específica é útil para o usuário e ainda mais útil para quem quer descobrir
 * quem tem conta aqui: com ela, uma lista de e-mails vazados vira uma lista de
 * clientes confirmados em minutos.
 *
 * A mesma preocupação vale para o **tempo** da resposta, e é por isso que o
 * caminho "e-mail não existe" chama `equalizeTiming`.
 */

type RegisterInput = {
  name: string;
  email: string;
  password: string;
  intent: 'BUYER' | 'CREATOR' | 'PROFESSIONAL';
};

/**
 * Cria a conta e já abre a sessão.
 *
 * `ADMIN` não é alcançável por aqui em nenhuma hipótese: o tipo de `intent`
 * exclui, e o valor gravado vem de uma lista fechada. Papel administrativo se
 * concede, nunca se pede.
 */
export async function registerAccount(
  input: RegisterInput,
  request: { ip?: string | null; userAgent?: string | null },
): Promise<SessionUser> {
  await enforce('register', request.ip ?? 'desconhecido');

  const existing = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true },
  });

  if (existing) {
    // Aqui a revelação é inevitável — não dá para cadastrar duas contas com o
    // mesmo e-mail e o usuário precisa saber por que falhou. O que se pode
    // fazer é não dar mais informação que essa.
    throw conflict('Já existe uma conta com esse e-mail.');
  }

  const passwordHash = await hashPassword(input.password);

  // Todo mundo compra. O papel escolhido no cadastro é adicional, e é isso que
  // permite a mesma pessoa vender e comprar sem uma segunda conta.
  const roles: Role[] = input.intent === 'BUYER' ? ['BUYER'] : ['BUYER', input.intent];

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
        roles: { create: roles.map((role) => ({ role })) },
        profile: { create: {} },
      },
      select: { id: true, email: true, name: true, avatarUrl: true, status: true },
    });

    // Quem se cadastra como profissional precisa de perfil desde o primeiro
    // acesso: sem ele, a pessoa cai num dashboard vazio e não descobre que
    // precisa criar algo antes de aparecer no diretório.
    if (input.intent === 'PROFESSIONAL') {
      const slug = await uniqueSlug(input.name, async (candidate) => {
        const found = await tx.professionalProfile.findUnique({
          where: { slug: candidate },
          select: { id: true },
        });
        return found !== null;
      });

      await tx.professionalProfile.create({
        data: {
          userId: created.id,
          slug,
          headline: 'Especialista em automação e IA',
          bio: 'Perfil em construção.',
          startingAtCents: 0,
          availability: 'UNAVAILABLE',
        },
      });
    }

    return created;
  });

  await createSession(user.id, request);

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    roles,
    status: user.status,
  };
}

/**
 * Autentica e abre a sessão.
 *
 * O limite de taxa usa o **e-mail** como identidade, não o IP: um ataque de
 * credential stuffing vem de milhares de IPs residenciais contra uma conta só,
 * e limitar por IP não vê isso acontecer. Limitar por IP também existe, no
 * cadastro, onde o padrão de abuso é o contrário.
 */
export async function authenticate(
  credentials: { email: string; password: string },
  request: { ip?: string | null; userAgent?: string | null },
): Promise<SessionUser> {
  await enforce('login', credentials.email);

  const user = await prisma.user.findUnique({
    where: { email: credentials.email },
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      status: true,
      passwordHash: true,
      deletedAt: true,
      roles: { select: { role: true } },
    },
  });

  if (!user || user.deletedAt) {
    await equalizeTiming();
    throw validationFailed('E-mail ou senha incorretos.');
  }

  const valid = await verifyPassword(user.passwordHash, credentials.password);
  if (!valid) {
    logger.warn('Tentativa de login com senha incorreta', { userId: user.id });
    throw validationFailed('E-mail ou senha incorretos.');
  }

  if (user.status === 'BANNED') {
    throw forbidden('Esta conta foi encerrada por violação dos termos de uso.');
  }

  await createSession(user.id, request);

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    roles: user.roles.map((entry) => entry.role),
    status: user.status,
  };
}

/**
 * Troca a senha.
 *
 * Derruba **todas** as outras sessões. Trocar a senha é o que a pessoa faz
 * quando desconfia que a conta foi comprometida; deixar as sessões antigas
 * vivas transforma a ação em teatro.
 */
export async function changePassword(
  user: SessionUser,
  input: { current: string; next: string },
  request: { ip?: string | null; userAgent?: string | null },
): Promise<void> {
  const record = await prisma.user.findUnique({
    where: { id: user.id },
    select: { passwordHash: true },
  });

  if (!record) throw notFound();

  const valid = await verifyPassword(record.passwordHash, input.current);
  if (!valid) throw validationFailed('A senha atual não confere.', { current: ['Senha incorreta.'] });

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(input.next) },
  });

  await destroyAllSessions(user.id);
  await createSession(user.id, request);
}

/** Concede papel. Só admin — a chamada é protegida por `requireAdmin`. */
export async function grantRole(admin: SessionUser, userId: string, role: Role): Promise<void> {
  await prisma.userRole.upsert({
    where: { userId_role: { userId, role } },
    create: { userId, role },
    update: {},
  });

  // Papel novo muda o que a sessão pode fazer. Como a sessão é consultada no
  // banco a cada requisição, o efeito é imediato — mas derrubar as sessões
  // deixa explícito para o usuário que algo mudou na conta dele.
  await destroyAllSessions(userId);

  await audit({
    action: 'user.role_granted',
    target: target('user', userId),
    actorId: admin.id,
    metadata: { role },
  });
}

export async function revokeRole(admin: SessionUser, userId: string, role: Role): Promise<void> {
  if (role === 'ADMIN' && admin.id === userId) {
    // Um admin que remove o próprio papel pode deixar a plataforma sem
    // nenhum administrador — e a recuperação disso é acesso direto ao banco.
    throw conflict('Você não pode remover o próprio acesso administrativo.');
  }

  await prisma.userRole.deleteMany({ where: { userId, role } });
  await destroyAllSessions(userId);

  await audit({
    action: 'user.role_revoked',
    target: target('user', userId),
    actorId: admin.id,
    metadata: { role },
  });
}

/** Suspende, reativa ou bane. */
export async function setAccountStatus(
  admin: SessionUser,
  userId: string,
  status: 'ACTIVE' | 'SUSPENDED' | 'BANNED',
): Promise<void> {
  if (admin.id === userId) throw conflict('Você não pode alterar o status da própria conta.');

  await prisma.user.update({ where: { id: userId }, data: { status } });

  if (status !== 'ACTIVE') await destroyAllSessions(userId);

  await audit({
    action: status === 'ACTIVE' ? 'user.reactivated' : status === 'BANNED' ? 'user.banned' : 'user.suspended',
    target: target('user', userId),
    actorId: admin.id,
  });
}

/**
 * Exclusão a pedido do titular (LGPD art. 18, VI).
 *
 * Anonimiza em vez de apagar. O motivo é uma tensão real entre duas
 * obrigações: o titular pede a exclusão dos dados pessoais, e a plataforma
 * precisa manter o registro fiscal da transação — que envolve o dado de
 * **outra** pessoa, o comprador. A saída é remover o que identifica e manter
 * o que a lei obriga a guardar.
 */
export async function anonymizeUser(actorId: string, userId: string): Promise<void> {
  const anonymousEmail = `removido+${slugify(userId)}@automatize.invalid`;

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        name: 'Conta removida',
        email: anonymousEmail,
        avatarUrl: null,
        deletedAt: new Date(),
      },
    }),
    prisma.profile.updateMany({
      where: { userId },
      data: { bio: null, company: null, website: null, location: null },
    }),
    prisma.session.deleteMany({ where: { userId } }),
  ]);

  await audit({ action: 'user.anonymized', target: target('user', userId), actorId });
}

/** Lista de contas para o painel administrativo. */
export async function listUsers(query: { q?: string; page: number }, pageSize = 30) {
  const where = query.q
    ? {
        OR: [
          { name: { contains: query.q, mode: 'insensitive' as const } },
          { email: { contains: query.q, mode: 'insensitive' as const } },
        ],
      }
    : {};

  const [items, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        createdAt: true,
        deletedAt: true,
        roles: { select: { role: true } },
        _count: { select: { products: true, orders: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.user.count({ where }),
  ]);

  return { items, total, page: query.page, pageCount: Math.max(1, Math.ceil(total / pageSize)) };
}

/** Perfil público da conta, para `/dashboard/profile`. */
export async function getAccountProfile(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
      createdAt: true,
      profile: { select: { bio: true, company: true, website: true, location: true } },
      roles: { select: { role: true } },
    },
  });
}

export async function updateAccountProfile(
  user: SessionUser,
  input: { name: string; bio?: string; company?: string; website?: string; location?: string },
): Promise<void> {
  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { name: input.name } }),
    prisma.profile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        bio: input.bio || null,
        company: input.company || null,
        website: input.website || null,
        location: input.location || null,
      },
      update: {
        bio: input.bio || null,
        company: input.company || null,
        website: input.website || null,
        location: input.location || null,
      },
    }),
  ]);
}
