import 'server-only';

import { env, papelDaChaveSupabase, supabaseConfigurado } from '@/config/env';

import { registrar } from './auditoria';
import type { Lead } from './schema';

/**
 * Gravação do lead no Supabase.
 *
 * Usa a `service_role` via PostgREST, sempre no servidor — RLS está ligado em
 * `leads` e não há policy para `anon`, então nenhum cliente alcança a tabela
 * nem por engano.
 *
 * Sem Supabase configurado, o lead segue o fluxo (CRM + CAPI + auditoria) e
 * esta função não faz nada: derrubar a captação porque o banco ainda não foi
 * provisionado seria perder o lead que já custou clique.
 */
export async function gravarLead(params: {
  lead: Lead;
  leadUuid: string;
  consentimentoEm: string;
  ipConsentimento: string | null;
}): Promise<boolean> {
  if (!supabaseConfigurado) return false;

  const empreendimentoId = params.lead.empreendimentoSlug
    ? await idDoEmpreendimento(params.lead.empreendimentoSlug)
    : null;

  try {
    const resposta = await fetch(`${env.SUPABASE_URL}/rest/v1/leads`, {
      method: 'POST',
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY!,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY!}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal,resolution=ignore-duplicates',
      },
      body: JSON.stringify({
        nome: params.lead.nome,
        telefone: params.lead.telefone,
        email: params.lead.email ?? null,
        empreendimento_id: empreendimentoId,
        origem: params.lead.origem,
        utm_source: params.lead.utmSource ?? null,
        utm_campaign: params.lead.utmCampaign ?? null,
        utm_content: params.lead.utmContent ?? null,
        consentimento_lgpd_at: params.consentimentoEm,
        ip_consentimento: params.ipConsentimento,
        crm_lead_uuid: params.leadUuid,
      }),
      signal: AbortSignal.timeout(8_000),
    });

    if (!resposta.ok) {
      /*
        O corpo do PostgREST é o que diz se foi chave errada, RLS ou coluna
        inválida. Guardamos code/message/hint — que diagnosticam — mas nunca o
        `details`: numa violação de constraint ele traz a "Failing row", ou
        seja, o nome e o telefone do lead ecoados para dentro do log. Dado
        pessoal em log de aplicação sem função é o que este projeto pseudonimiza
        em todo lugar; o caminho de erro não pode ser a exceção.
      */
      await registrar({
        crmLeadUuid: params.leadUuid,
        evento: 'persistencia_falhou',
        origem: params.lead.origem,
        detalhe: {
          status: resposta.status,
          erro: await erroSemPii(resposta),
          papelDaChave: papelDaChaveSupabase(),
        },
      });
      return false;
    }

    return true;
  } catch (e) {
    await registrar({
      crmLeadUuid: params.leadUuid,
      evento: 'persistencia_falhou',
      origem: params.lead.origem,
      detalhe: { erro: e instanceof Error ? e.name : 'desconhecido' },
    });
    return false;
  }
}

/**
 * Extrai do erro do PostgREST só o que diagnostica, sem o `details`.
 *
 * O PostgREST responde `{ code, message, details, hint }`. `details` é onde
 * mora a linha que falhou — com o dado do lead. Ficamos com o resto; se não for
 * o JSON esperado, um recorte curto que não chega a formar registro.
 */
async function erroSemPii(resposta: Response): Promise<unknown> {
  const texto = await resposta.text().catch(() => '');
  try {
    const { code, message, hint } = JSON.parse(texto) as Record<string, unknown>;
    return { code, message, hint };
  } catch {
    return texto.slice(0, 120);
  }
}

/** Marca o resultado do repasse ao CRM, para o job de reenvio saber o que sobrou. */
export async function marcarSync(
  leadUuid: string,
  status: 'enviado' | 'falhou',
  erro?: string,
): Promise<void> {
  if (!supabaseConfigurado) return;

  try {
    await fetch(
      `${env.SUPABASE_URL}/rest/v1/leads?crm_lead_uuid=eq.${encodeURIComponent(leadUuid)}`,
      {
        method: 'PATCH',
        headers: {
          apikey: env.SUPABASE_SERVICE_ROLE_KEY!,
          Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY!}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          status_sync_crm: status,
          ultimo_erro_sync: erro ?? null,
        }),
        signal: AbortSignal.timeout(5_000),
      },
    );
  } catch {
    /* Já foi auditado no envio; não vale derrubar nada por causa do PATCH. */
  }
}

/**
 * Resolve o slug do empreendimento no id do banco.
 *
 * O formulário manda slug porque é o que a página conhece; a tabela `leads`
 * referencia `empreendimentos(id)`. Falhar aqui não pode custar o lead: se a
 * consulta não achar, o lead é gravado sem vínculo e o corretor ainda recebe o
 * contato — o nome do empreendimento vai junto no payload do CRM de qualquer
 * jeito.
 */
async function idDoEmpreendimento(slug: string): Promise<string | null> {
  try {
    const resposta = await fetch(
      `${env.SUPABASE_URL}/rest/v1/empreendimentos` +
        `?slug=eq.${encodeURIComponent(slug)}&select=id&limit=1`,
      {
        headers: {
          apikey: env.SUPABASE_SERVICE_ROLE_KEY!,
          Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY!}`,
        },
        signal: AbortSignal.timeout(5_000),
      },
    );

    if (!resposta.ok) return null;

    const linhas = (await resposta.json()) as { id: string }[];
    return linhas[0]?.id ?? null;
  } catch {
    return null;
  }
}
