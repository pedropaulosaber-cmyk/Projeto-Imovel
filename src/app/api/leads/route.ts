import { randomUUID } from 'node:crypto';

import { after, type NextRequest, NextResponse } from 'next/server';

import { urlBase } from '@/config/site';
import { ipDoCliente } from '@/lib/ip';
import { pseudonimizarIp, registrar } from '@/lib/lead/auditoria';
import { assinarBook } from '@/lib/lead/book';
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
/* Um lead honesto cabe em menos de 1 KB; 16 KB é folga generosa. Recusar antes
   do `req.json()` evita bufferizar um corpo multi-MB só para o zod rejeitar
   depois. */
const CORPO_MAXIMO = 16_384;

export async function POST(req: NextRequest) {
  const tamanho = Number(req.headers.get('content-length'));
  if (Number.isFinite(tamanho) && tamanho > CORPO_MAXIMO) {
    return NextResponse.json({ erro: 'Corpo grande demais.' }, { status: 413 });
  }

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

  const ip = ipDoCliente(req.headers);

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

  /*
    O book é a contrapartida pelo dado, então a URL assinada precisa voltar
    JUNTO com a resposta — não dá para jogar no `after()`, que roda depois que
    o navegador já foi embora. É a única chamada externa no caminho da
    resposta, e ela falha para `null` sem derrubar o envio.
  */
  const book = await assinarBook(lead.empreendimentoSlug, leadUuid);

  after(async () => {
    await gravarLead({ lead, leadUuid, consentimentoEm, ipConsentimento: ip });

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

  return NextResponse.json({ ok: true, leadUuid, eventId, book });
}

/** Só POST. Sem isto, um GET devolveria 405 sem dizer o que fazer. */
export function GET() {
  return NextResponse.json(
    { erro: 'Use POST para enviar um lead.' },
    { status: 405, headers: { Allow: 'POST' } },
  );
}
