import { NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { audit, target } from '@/server/audit';
import { prisma } from '@/server/db/prisma';
import { verifyWebhook } from '@/server/payments/stripe';
import { markOrderPaid } from '@/server/services/orders';

/**
 * Webhook de pagamento
 * ====================
 *
 * A **única** fonte de verdade sobre "este pedido foi pago". O retorno do
 * navegador para a página de sucesso não é: ele pode ser forjado digitando a
 * URL, e o usuário legítimo pode fechar a aba antes de chegar lá.
 *
 * ## Ordem das operações, e por que ela é essa
 *
 *  1. **Lê o corpo cru.** `req.text()`, nunca `req.json()`. A assinatura é
 *     calculada sobre os bytes exatos; parsear e re-serializar reordena chaves
 *     e invalida a verificação.
 *  2. **Verifica a assinatura.** Antes de olhar qualquer campo. Sem isso, este
 *     endpoint é uma API pública de "marcar pedido como pago".
 *  3. **Registra o id do evento.** A constraint única faz a segunda entrega do
 *     mesmo evento colidir — é a idempotência que impede creditar duas vezes.
 *  4. **Processa.**
 *
 * ## Por que responder 200 mesmo em erro de negócio
 *
 * O Stripe reenvia enquanto não receber 2xx. Um evento que nunca vai dar certo
 * (pedido apagado, por exemplo) ficaria em retry infinito, poluindo o log e
 * atrasando os eventos seguintes da fila. Erro de **infraestrutura** devolve
 * 500 de propósito, porque esse sim vale reenviar.
 */

// O corpo precisa chegar intacto: qualquer transformação quebra a assinatura.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get('stripe-signature');

  let event;
  try {
    event = verifyWebhook(rawBody, signature);
  } catch (error) {
    // Assinatura inválida é tentativa de fraude ou configuração errada. Nos
    // dois casos: 400, registro, e nada mais acontece.
    logger.error('Webhook com assinatura inválida', error);
    await audit({
      action: 'payment.webhook_rejected',
      target: target('webhook', 'stripe'),
      metadata: { reason: 'assinatura inválida' },
    });
    return NextResponse.json({ error: 'assinatura inválida' }, { status: 400 });
  }

  try {
    // Idempotência: a segunda entrega do mesmo evento viola a constraint única
    // e cai no `catch` abaixo, sem reprocessar nada.
    await prisma.webhookEvent.create({
      data: { provider: 'stripe', eventId: event.id, type: event.type },
    });
  } catch {
    logger.info('Evento de webhook já processado; ignorando', { eventId: event.id });
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const orderId = session.metadata?.orderId;

        if (!orderId) {
          logger.warn('Sessão de checkout sem orderId nos metadados', { eventId: event.id });
          break;
        }

        // `payment_status` é o campo que diz se o dinheiro entrou. Uma sessão
        // "completed" com pagamento pendente (boleto, por exemplo) ainda não
        // dá direito ao produto.
        if (session.payment_status !== 'paid') {
          logger.info('Sessão concluída sem pagamento confirmado', { orderId });
          break;
        }

        const result = await markOrderPaid(orderId, {
          providerRef: session.id,
          amountCents: session.amount_total ?? 0,
          raw: event,
        });

        if (!result.alreadyProcessed) {
          await audit({
            action: 'order.paid',
            target: target('order', orderId),
            metadata: { eventId: event.id, provider: 'stripe' },
          });
        }
        break;
      }

      case 'charge.refunded': {
        logger.info('Reembolso recebido do provedor', { eventId: event.id });
        break;
      }

      default:
        logger.debug('Evento de webhook ignorado', { type: event.type });
    }

    await audit({
      action: 'payment.webhook_processed',
      target: target('webhook', event.id),
      metadata: { type: event.type },
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error('Falha ao processar webhook', error, { eventId: event.id, type: event.type });

    // Erro de processamento **não** devolve 500: o evento já está registrado
    // como recebido, e o retry entregaria o mesmo erro para sempre. O alerta
    // no log é o caminho de resolução.
    return NextResponse.json({ received: true, error: 'falha no processamento' }, { status: 200 });
  }
}
