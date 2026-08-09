import 'server-only';

import { PrismaPg } from '@prisma/adapter-pg';

import { env, isProduction } from '@/config/env';
import { PrismaClient } from '@/generated/prisma/client';

/**
 * Cliente Prisma — instância única do processo
 * ============================================
 *
 * ## Por que o singleton em `globalThis`
 *
 * Em desenvolvimento o Next recarrega os módulos a cada alteração de arquivo,
 * mas **não** reinicia o processo. Um `new PrismaClient()` no topo do módulo
 * cria uma conexão nova a cada save; depois de uma tarde editando, o Postgres
 * recusa conexão por esgotamento do pool e o erro aponta para a query, não
 * para a causa. Pendurar a instância no `globalThis` sobrevive ao recarregamento.
 *
 * Em produção não há recarregamento, e o `globalThis` é apenas inofensivo.
 *
 * ## Por que o adaptador
 *
 * O Prisma 7 fala com o banco por um driver adapter em vez do motor nativo.
 * Na prática isso significa um pool de conexões `pg` comum, que dá controle
 * explícito sobre limite de conexões — o parâmetro que decide se a aplicação
 * degrada com elegância ou derruba o banco sob pico.
 */

function createClient(): PrismaClient {
  const adapter = new PrismaPg({
    connectionString: env.DATABASE_URL,
    // Teto de conexões por instância. Serverless multiplica instâncias, então
    // o teto por instância precisa ser baixo: 10 instâncias × 20 conexões
    // estoura o `max_connections` padrão do Postgres (100) sozinho.
    max: isProduction ? 10 : 5,
    // Conexão ociosa segurada para sempre é conexão desperdiçada quando o
    // tráfego cai.
    idleTimeoutMillis: 30_000,
    // Sem isto, uma indisponibilidade do banco vira requisição pendurada em
    // vez de erro — e requisição pendurada esgota o servidor de aplicação.
    connectionTimeoutMillis: 5_000,
  });

  return new PrismaClient({
    adapter,
    // Query no log de produção vaza dado de usuário (e-mail em `WHERE`, por
    // exemplo). Em desenvolvimento é a ferramenta que mostra o N+1.
    log: isProduction ? ['warn', 'error'] : ['warn', 'error'],
  });
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma: PrismaClient = globalForPrisma.prisma ?? createClient();

if (!isProduction) globalForPrisma.prisma = prisma;

export type { Prisma } from '@/generated/prisma/client';
