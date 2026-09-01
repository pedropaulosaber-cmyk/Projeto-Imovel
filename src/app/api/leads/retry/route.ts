import { type NextRequest, NextResponse } from 'next/server';

import { env, supabaseConfigurado } from '@/config/env';
import { registrar } from '@/lib/lead/auditoria';
import { enviarAoCrm, type CorpoWebhook } from '@/lib/lead/crm';
import { marcarSync } from '@/lib/lead/persistencia';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Reenvio dos leads que não chegaram ao Método CRM.
 *
 * O `after()` da rota de captação já tenta quatro vezes com backoff. Isto aqui
 * é a rede de baixo: se o CRM ficou fora do ar por vinte minutos, os leads
 * daquele intervalo ficaram em `status_sync_crm = 'falhou'` e é este endpoint
 * que os recupera.
 *
 * Agendado em `vercel.json`. No plano Hobby a Vercel só aceita cron diário,
 * então a varredura roda às 09:00 UTC; no Pro, dá para baixar a cadência para
 * quinze minutos. O backoff do `after()` continua sendo a primeira linha de
 * defesa — este endpoint só pega o que sobreviveu às quatro tentativas.
 *
 * A Vercel manda `Authorization: Bearer $CRON_SECRET` nas chamadas de cron.
 * Sem `CRON_SECRET` configurado o endpoint recusa tudo — um reenviador aberto
 * na internet é um jeito barato de inundar o CRM.
 */
export async function GET(req: NextRequest) {
  const segredo = process.env.CRON_SECRET;
  if (!segredo) {
    return NextResponse.json({ erro: 'CRON_SECRET não configurado.' }, { status: 503 });
  }
  if (req.headers.get('authorization') !== `Bearer ${segredo}`) {
    return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401 });
  }
  if (!supabaseConfigurado) {
    return NextResponse.json({ erro: 'Supabase não configurado.' }, { status: 503 });
  }

  const url =
    `${env.SUPABASE_URL}/rest/v1/leads` +
    '?status_sync_crm=eq.falhou&select=*&order=created_at.asc&limit=50';

  const resposta = await fetch(url, {
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY!,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY!}`,
    },
    signal: AbortSignal.timeout(10_000),
  });

  if (!resposta.ok) {
    return NextResponse.json({ erro: 'Falha ao ler a fila.' }, { status: 502 });
  }

  const pendentes = (await resposta.json()) as LinhaLead[];
  let recuperados = 0;

  for (const linha of pendentes) {
    const envio = await enviarAoCrm(reconstruirCorpo(linha));
    await marcarSync(linha.crm_lead_uuid, envio.enviado ? 'enviado' : 'falhou', envio.erro);
    if (envio.enviado) recuperados += 1;
  }

  await registrar({
    crmLeadUuid: 'lote',
    evento: 'retry_executado',
    detalhe: { pendentes: pendentes.length, recuperados },
  });

  return NextResponse.json({ pendentes: pendentes.length, recuperados });
}

interface LinhaLead {
  crm_lead_uuid: string;
  nome: string;
  telefone: string;
  email: string | null;
  origem: string;
  utm_source: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  consentimento_lgpd_at: string;
}

/**
 * O reenvio manda o mesmo `lead_uuid` do envio original — é isso que faz o CRM
 * reconhecer a repetição em vez de abrir um segundo atendimento.
 */
function reconstruirCorpo(linha: LinhaLead): CorpoWebhook {
  return {
    lead_uuid: linha.crm_lead_uuid,
    nome: linha.nome,
    telefone: linha.telefone,
    ...(linha.email ? { email: linha.email } : {}),
    origem: linha.origem,
    ...(linha.utm_source ? { utm_source: linha.utm_source } : {}),
    ...(linha.utm_campaign ? { utm_campaign: linha.utm_campaign } : {}),
    ...(linha.utm_content ? { utm_content: linha.utm_content } : {}),
    consentimento_lgpd_at: linha.consentimento_lgpd_at,
  };
}
