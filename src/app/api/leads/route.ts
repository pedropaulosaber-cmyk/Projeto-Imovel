import { randomUUID } from 'node:crypto';

import { after, type NextRequest, NextResponse } from 'next/server';

import { urlBase } from '@/config/site';
import { pseudonimizarIp, registrar } from '@/lib/lead/auditoria';
import { enviarAoCrm, montarCorpo } from '@/lib/lead/crm';
import { enviarEventoLead } from '@/lib/lead/meta-capi';
import { gravarLead, marcarSync } from '@/lib/lead/persistencia';
import { leadSchema } from '@/lib/lead/schema';

export const runtime = 'nodejs';
/* Nunca cacheado: é escrita. */
export const dynamic = 'force-dynamic';

/**
 * Recebe o formulário, grava, repassa ao Método CRM e dispara a CAPI.
 *
 * A resposta ao visitante não espera CRM nem Meta: os dois rodam em `after()`,
 * depois que o navegador já recebeu o "recebemos seus dados". Quem preencheu
 * não tem por que esperar o retry de um serviço de terceiro.
 */
export async function POST(req: NextRequest) {
  let bruto: unknown;
  try {
    bruto = await req.json();
  } catch {
    return NextResponse.json({ erro: 'Corpo inválido.' }, { status: 400 });
  }

  const parse = leadSchema.safeParse(bruto);
  if (!parse.success) {
    const primeiro = parse.error.issues[0];
    return NextResponse.json(
      { erro: primeiro?.message ?? 'Confira os dados informados.' },
      { status: 400 },
    );
  }

  const lead = parse.data;

  /*
    Honeypot preenchido = bot. Responde 200 para não ensinar o robô a
    contornar, mas não grava nem repassa nada.
  */
  if (lead.website) {
    await registrar({ crmLeadUuid: 'honeypot', evento: 'honeypot_bloqueado' });
    return NextResponse.json({ ok: true });
  }

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    null;

  /*
    LGPD art. 8º, §2º: cabe ao controlador provar que houve consentimento.
    Registramos o instante e a origem no momento do recebimento — não confiamos
    num timestamp vindo do cliente.
  */
  const consentimentoEm = new Date().toISOString();
  const leadUuid = randomUUID();
  const eventId = lead.eventId ?? leadUuid;

  await registrar({
    crmLeadUuid: leadUuid,
    evento: 'lead_recebido',
    origem: lead.origem,
    detalhe: {
      empreendimento: lead.empreendimentoSlug ?? null,
      utm_campaign: lead.utmCampaign ?? null,
      ip_pseudonimizado: ip ? pseudonimizarIp(ip) : null,
    },
  });

  after(async () => {
    await gravarLead({
      lead,
      leadUuid,
      consentimentoEm,
      ipConsentimento: ip,
      /* O id do empreendimento no Supabase entra quando o catálogo migrar. */
      empreendimentoId: null,
    });

    const [envio] = await Promise.all([
      enviarAoCrm(montarCorpo(lead, leadUuid, consentimentoEm)),
      enviarEventoLead(lead, {
        eventId,
        ip: ip ?? undefined,
        userAgent: req.headers.get('user-agent') ?? undefined,
        urlOrigem: req.headers.get('referer') ?? urlBase(),
      }),
    ]);

    await marcarSync(leadUuid, envio.enviado ? 'enviado' : 'falhou', envio.erro);
  });

  return NextResponse.json({ ok: true, leadUuid, eventId });
}

/** Só POST. Sem isto, um GET devolveria 405 sem dizer o que fazer. */
export function GET() {
  return NextResponse.json(
    { erro: 'Use POST para enviar um lead.' },
    { status: 405, headers: { Allow: 'POST' } },
  );
}
