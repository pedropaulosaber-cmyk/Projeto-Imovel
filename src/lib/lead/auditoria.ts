import 'server-only';

import { createHash } from 'node:crypto';

import { env, supabaseConfigurado } from '@/config/env';

/**
 * Log de auditoria de lead (checklist de segurança do CLAUDE.md §9).
 *
 * Grava origem, timestamp e o prefixo do hash da assinatura — nunca o dado
 * pessoal em claro e nunca o segredo. Quando o Supabase estiver configurado,
 * o registro também vai para a tabela `lead_auditoria`; sem ele, fica no log
 * do processo, que é o que a Vercel retém.
 */

export interface EventoAuditoria {
  crmLeadUuid: string;
  evento: string;
  origem?: string;
  hashAssinatura?: string;
  detalhe?: Record<string, unknown>;
}

/**
 * IP pseudonimizado: guardar o IP em claro no log de aplicação é dado pessoal
 * espalhado sem necessidade. O IP real do consentimento vai para a coluna
 * `leads.ip_consentimento`, que é onde ele tem função legal.
 */
export function pseudonimizarIp(ip: string): string {
  return createHash('sha256').update(ip).digest('hex').slice(0, 16);
}

export async function registrar(evento: EventoAuditoria): Promise<void> {
  const linha = {
    ts: new Date().toISOString(),
    ...evento,
  };

  console.info('[lead]', JSON.stringify(linha));

  if (!supabaseConfigurado) return;

  try {
    await fetch(`${env.SUPABASE_URL}/rest/v1/lead_auditoria`, {
      method: 'POST',
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY!,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY!}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        crm_lead_uuid: evento.crmLeadUuid,
        evento: evento.evento,
        origem: evento.origem,
        hash_assinatura: evento.hashAssinatura,
        detalhe: evento.detalhe ?? {},
      }),
      signal: AbortSignal.timeout(5_000),
    });
  } catch (e) {
    /* Auditoria que falha não pode derrubar o atendimento ao lead. */
    console.error('[lead] auditoria_falhou', e instanceof Error ? e.message : e);
  }
}
