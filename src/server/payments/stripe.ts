import 'server-only';

import Stripe from 'stripe';

import { env, integrations, publicEnv } from '@/config/env';
import { integrationUnavailable } from '@/lib/errors';

/**
 * Pagamentos
 * ==========
 *
 * ## O que o frontend nunca faz
 *
 * Não envia preço, não envia valor, não confirma pagamento. Envia o id do
 * produto. Tudo o mais é decidido aqui e no serviço de pedidos.
 *
 * A sessão de checkout é criada com `line_items` construídos a partir do
 * **pedido gravado no banco** — que por sua vez foi construído a partir do
 * preço do produto no banco. Não existe caminho por onde um valor vindo do
 * navegador chegue ao provedor.
 *
 * ## Idempotência
 *
 * Duas camadas, porque uma falha:
 *
 *  1. `idempotencyKey` na criação da sessão: um duplo clique não gera duas
 *     cobranças, mesmo que gere duas requisições.
 *  2. `WebhookEvent` com `@@unique([provider, eventId])` no processamento: o
 *     Stripe reenvia o mesmo evento em timeout e em replay manual, e a segunda
 *     entrega precisa ser um no-op.
 *
 * ## Ausência de credencial não é falha
 *
 * Sem `STRIPE_SECRET_KEY` a plataforma funciona inteira, menos comprar. O
 * checkout responde um erro explícito ("pagamento não configurado neste
 * ambiente") em vez de simular uma compra que não aconteceu — nada aqui finge
 * ter funcionado.
 */

let stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!integrations.payments) throw integrationUnavailable('pagamentos');

  stripe ??= new Stripe(env.STRIPE_SECRET_KEY!, {
    // Versão fixada de propósito: a API do Stripe evolui, e uma atualização
    // silenciosa do formato de resposta quebraria o webhook em produção sem
    // nenhum deploy do nosso lado.
    apiVersion: '2026-07-29.dahlia',
    // Sem teto de tentativas, uma instabilidade do provedor vira requisição
    // pendurada; com teto, vira erro tratável.
    maxNetworkRetries: 2,
    timeout: 15_000,
  });

  return stripe;
}

export type CheckoutSession = { url: string; sessionId: string };

/**
 * Cria a sessão de checkout hospedada.
 *
 * Hospedada, e não formulário próprio, por uma razão de conformidade: o dado
 * do cartão nunca toca nosso servidor, o que mantém a plataforma no escopo
 * PCI-DSS mais leve (SAQ A). Um formulário próprio moveria a aplicação para
 * um escopo de auditoria caro sem ganho de produto.
 */
export async function createCheckoutSession(input: {
  orderId: string;
  orderNumber: string;
  productName: string;
  amountCents: number;
  currency: string;
  buyerEmail: string;
}): Promise<CheckoutSession> {
  const client = getStripe();

  const session = await client.checkout.sessions.create(
    {
      mode: 'payment',
      customer_email: input.buyerEmail,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: input.currency.toLowerCase(),
            unit_amount: input.amountCents,
            product_data: { name: input.productName },
          },
        },
      ],
      // O id do pedido viaja como metadado e volta no webhook. É por ele que
      // se liga a confirmação do provedor ao registro daqui — e não pelo
      // e-mail nem pelo valor, que não são identificadores.
      metadata: { orderId: input.orderId, orderNumber: input.orderNumber },
      success_url: `${publicEnv.NEXT_PUBLIC_APP_URL}/checkout/sucesso?pedido=${input.orderNumber}`,
      cancel_url: `${publicEnv.NEXT_PUBLIC_APP_URL}/checkout/cancelado?pedido=${input.orderNumber}`,
      // 30 minutos: tempo de sobra para pagar, curto o bastante para não
      // deixar pedidos pendentes acumulando indefinidamente.
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    },
    {
      // A chave é o id do pedido: a mesma tentativa devolve a mesma sessão em
      // vez de criar uma cobrança nova.
      idempotencyKey: `order_${input.orderId}`,
    },
  );

  if (!session.url) {
    throw new Error('Stripe não devolveu URL de checkout.');
  }

  return { url: session.url, sessionId: session.id };
}

/**
 * Verifica a assinatura do webhook e devolve o evento.
 *
 * **Este é o ponto mais sensível da integração.** Sem a verificação, o
 * endpoint aceita qualquer POST e vira uma API pública de "marcar pedido como
 * pago" — o vetor mais direto que existe para levar o catálogo inteiro de
 * graça.
 *
 * `constructEvent` compara HMAC em tempo constante e rejeita evento com
 * carimbo de tempo antigo, o que também fecha a porta para replay de um
 * evento legítimo capturado.
 *
 * O corpo precisa chegar como **texto cru**: qualquer `JSON.parse` seguido de
 * `stringify` reordena chaves e invalida a assinatura.
 */
export function verifyWebhook(rawBody: string, signature: string | null): Stripe.Event {
  if (!integrations.payments) throw integrationUnavailable('pagamentos');
  if (!signature) throw new Error('Requisição de webhook sem assinatura.');

  return getStripe().webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET!);
}

export const paymentsAvailable = integrations.payments;
