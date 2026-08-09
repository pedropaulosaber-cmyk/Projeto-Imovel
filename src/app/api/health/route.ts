import { NextResponse } from 'next/server';

import { integrations } from '@/config/env';
import { prisma } from '@/server/db/prisma';

/**
 * Health check.
 *
 * Consulta o banco de verdade em vez de responder `{ ok: true }` fixo. Um
 * health check que não toca a dependência crítica mente exatamente quando
 * mais importa: o processo está vivo, o banco caiu, e o balanceador continua
 * mandando tráfego para uma instância que só sabe devolver erro.
 *
 * Não é indexado nem cacheado, e não revela versão nem detalhe de
 * infraestrutura — informação que só ajuda quem está procurando o que atacar.
 */
export const dynamic = 'force-dynamic';

export async function GET() {
  const startedAt = Date.now();

  try {
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json(
      {
        status: 'ok',
        database: 'ok',
        latencyMs: Date.now() - startedAt,
        integrations: { payments: integrations.payments, storage: integrations.storage },
      },
      { headers: { 'cache-control': 'no-store' } },
    );
  } catch {
    return NextResponse.json(
      { status: 'degraded', database: 'unreachable' },
      { status: 503, headers: { 'cache-control': 'no-store' } },
    );
  }
}
