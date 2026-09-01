import 'server-only';

import { createHash } from 'node:crypto';

import { capiConfigurada, env } from '@/config/env';

import { registrar } from './auditoria';
import type { Lead } from './schema';

/**
 * Conversions API do Meta.
 *
 * O par Pixel (navegador) + CAPI (servidor) existe porque bloqueador de
 * anúncio e ITP derrubam boa parte dos eventos do Pixel. O `event_id` é o
 * mesmo dos dois lados: é ele que impede o Meta de contar a mesma conversão
 * duas vezes.
 *
 * Todo identificador vai com SHA-256, normalizado como o Meta exige — e é por
 * isso que a Política de Privacidade pode dizer que o Meta não recebe dado em
 * texto aberto.
 */

const VERSAO_API = 'v21.0';

function hash(valor: string): string {
  return createHash('sha256').update(valor.trim().toLowerCase()).digest('hex');
}

export interface ContextoCapi {
  eventId: string;
  ip?: string;
  userAgent?: string;
  urlOrigem: string;
}

export async function enviarEventoLead(lead: Lead, ctx: ContextoCapi): Promise<boolean> {
  if (!capiConfigurada) {
    await registrar({
      crmLeadUuid: ctx.eventId,
      evento: 'capi_nao_configurada',
      origem: lead.origem,
    });
    return false;
  }

  /* Telefone já chega normalizado em E.164 sem "+" pelo schema. */
  const userData: Record<string, unknown> = {
    ph: [hash(lead.telefone)],
    ...(lead.email ? { em: [hash(lead.email)] } : {}),
    ...(lead.fbp ? { fbp: lead.fbp } : {}),
    ...(lead.fbc ? { fbc: lead.fbc } : {}),
    ...(ctx.ip ? { client_ip_address: ctx.ip } : {}),
    ...(ctx.userAgent ? { client_user_agent: ctx.userAgent } : {}),
  };

  const corpo = {
    data: [
      {
        event_name: 'Lead',
        event_time: Math.floor(Date.now() / 1000),
        event_id: ctx.eventId,
        event_source_url: ctx.urlOrigem,
        action_source: 'website',
        user_data: userData,
        custom_data: {
          content_name: lead.empreendimentoSlug ?? lead.interesse ?? 'formulario_geral',
          content_category: lead.interesse ?? 'imovel',
        },
      },
    ],
    ...(env.META_TEST_EVENT_CODE ? { test_event_code: env.META_TEST_EVENT_CODE } : {}),
  };

  try {
    const resposta = await fetch(
      `https://graph.facebook.com/${VERSAO_API}/${env.META_PIXEL_ID}/events?access_token=${env.META_CAPI_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corpo),
        signal: AbortSignal.timeout(8_000),
      },
    );

    await registrar({
      crmLeadUuid: ctx.eventId,
      evento: resposta.ok ? 'capi_enviada' : 'capi_falhou',
      origem: lead.origem,
      detalhe: { status: resposta.status },
    });

    return resposta.ok;
  } catch (e) {
    await registrar({
      crmLeadUuid: ctx.eventId,
      evento: 'capi_falhou',
      origem: lead.origem,
      detalhe: { erro: e instanceof Error ? e.name : 'desconhecido' },
    });
    return false;
  }
}
