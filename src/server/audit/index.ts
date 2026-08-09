import 'server-only';

import { headers } from 'next/headers';

import { logger } from '@/lib/logger';
import { hashIp } from '@/server/auth/session';
import { prisma } from '@/server/db/prisma';

/**
 * Auditoria
 * =========
 *
 * Registro de quem fez o quê, em quê, quando. Existe para três perguntas que
 * aparecem cedo em qualquer plataforma que move dinheiro:
 *
 *  1. "Quem aprovou este produto?" — moderação contestada.
 *  2. "Quem mudou o preço antes da compra?" — disputa financeira.
 *  3. "Este admin acessou dado de cliente sem motivo?" — LGPD art. 37, que
 *     obriga o controlador a manter registro das operações de tratamento.
 *
 * ## O que **não** entra aqui
 *
 * Leitura comum e ação do próprio usuário sobre os próprios dados. Auditar
 * tudo produz uma tabela que ninguém consulta e um custo de escrita em toda
 * página. O critério é: ação administrativa, ação financeira, ou ação de
 * alguém sobre o dado de outra pessoa.
 */

/**
 * Ações auditadas. União fechada em vez de string livre porque um log de
 * auditoria com `"produto.aprovado"` e `"product.approved"` misturados é um
 * log que não se consegue consultar.
 */
export type AuditAction =
  | 'user.role_granted'
  | 'user.role_revoked'
  | 'user.suspended'
  | 'user.reactivated'
  | 'user.banned'
  | 'user.anonymized'
  | 'product.submitted'
  | 'product.approved'
  | 'product.rejected'
  | 'product.archived'
  | 'product.price_changed'
  | 'order.paid'
  | 'order.refunded'
  | 'payment.webhook_processed'
  | 'payment.webhook_rejected'
  | 'file.downloaded'
  | 'proposal.accepted'
  | 'proposal.rejected'
  | 'demand.closed'
  | 'review.removed';

type AuditInput = {
  action: AuditAction;
  /** Alvo no formato `tipo:id`, por exemplo `product:cmld3k...`. */
  target: string;
  actorId?: string | null;
  metadata?: Record<string, unknown>;
};

/**
 * Grava uma entrada de auditoria.
 *
 * **Nunca lança.** Uma falha ao auditar não pode desfazer a operação que já
 * aconteceu — se o produto foi aprovado e o log falhou, reverter a aprovação
 * seria pior que perder a linha do log. A falha vira alerta, que é o que o
 * time precisa ver.
 */
export async function audit(input: AuditInput): Promise<void> {
  try {
    let ipHash: string | null = null;
    try {
      const headerList = await headers();
      // `x-forwarded-for` só é confiável atrás de um proxy que o reescreve.
      // Fora disso é um header que o cliente controla — por isso ele serve
      // para correlacionar, nunca para autorizar.
      const forwarded = headerList.get('x-forwarded-for');
      ipHash = hashIp(forwarded?.split(',')[0]?.trim() ?? null);
    } catch {
      // Fora de um contexto de requisição (job, webhook, seed) não há headers,
      // e isso é normal.
    }

    await prisma.auditLog.create({
      data: {
        action: input.action,
        target: input.target,
        actorId: input.actorId ?? null,
        metadata: (input.metadata ?? {}) as never,
        ipHash,
      },
    });
  } catch (error) {
    logger.error('Falha ao gravar auditoria', error, {
      action: input.action,
      target: input.target,
    });
  }
}

/** Formata o alvo, para que o formato seja um só em todo o código. */
export function target(kind: string, id: string): string {
  return `${kind}:${id}`;
}
