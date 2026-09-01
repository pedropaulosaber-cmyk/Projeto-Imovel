import 'server-only';

import { createHmac, timingSafeEqual } from 'node:crypto';

import { crmConfigurado, env } from '@/config/env';
import { empreendimentoPorSlug } from '@/content/empreendimentos';

import { registrar } from './auditoria';
import type { Lead } from './schema';

/**
 * Repasse do lead para o Método CRM.
 *
 * Contrato (CLAUDE.md §6):
 *   POST {CRM_WEBHOOK_URL}
 *   X-Signature: HMAC-SHA256(body, LEAD_WEBHOOK_SECRET)
 *
 * A idempotência é do `lead_uuid`: o site gera, o CRM deduplica. Sem isso, um
 * retry depois de timeout cria o mesmo lead duas vezes na fila do SDR.
 */

export interface CorpoWebhook {
  lead_uuid: string;
  nome: string;
  telefone: string;
  email?: string;
  empreendimento?: {
    nome: string;
    slug: string;
    corretor_responsavel_id: string | null;
  };
  interesse?: string;
  tipologia?: string;
  origem: string;
  utm_source?: string;
  utm_campaign?: string;
  utm_content?: string;
  consentimento_lgpd_at: string;
}

export function montarCorpo(
  lead: Lead,
  leadUuid: string,
  consentimentoEm: string,
): CorpoWebhook {
  const empreendimento = lead.empreendimentoSlug
    ? empreendimentoPorSlug(lead.empreendimentoSlug)
    : undefined;

  return {
    lead_uuid: leadUuid,
    nome: lead.nome,
    telefone: lead.telefone,
    ...(lead.email ? { email: lead.email } : {}),
    ...(empreendimento
      ? {
          empreendimento: {
            nome: empreendimento.nome,
            slug: empreendimento.slug,
            /*
              Nulo quando a parceria com a incorporadora ainda não fechou.
              O Método CRM lê isso e roteia para o pool do SDR interno em vez
              de atribuir a um corretor externo.
            */
            corretor_responsavel_id: empreendimento.corretorResponsavel?.crmId ?? null,
          },
        }
      : {}),
    ...(lead.interesse ? { interesse: lead.interesse } : {}),
    ...(lead.tipologia ? { tipologia: lead.tipologia } : {}),
    origem: lead.origem,
    ...(lead.utmSource ? { utm_source: lead.utmSource } : {}),
    ...(lead.utmCampaign ? { utm_campaign: lead.utmCampaign } : {}),
    ...(lead.utmContent ? { utm_content: lead.utmContent } : {}),
    consentimento_lgpd_at: consentimentoEm,
  };
}

export function assinar(corpoSerializado: string, segredo: string): string {
  return createHmac('sha256', segredo).update(corpoSerializado, 'utf8').digest('hex');
}

/**
 * Verificação da assinatura, exposta para o lado que recebe (e para teste).
 * Comparação em tempo constante: `===` em string vaza o número de bytes
 * iguais pelo tempo de resposta.
 */
export function assinaturaConfere(
  corpoSerializado: string,
  assinaturaRecebida: string,
  segredo: string,
): boolean {
  const esperada = Buffer.from(assinar(corpoSerializado, segredo), 'utf8');
  const recebida = Buffer.from(assinaturaRecebida, 'utf8');
  if (esperada.length !== recebida.length) return false;
  return timingSafeEqual(esperada, recebida);
}

const ESPERAS_MS = [0, 1_000, 4_000, 12_000];

export interface ResultadoEnvio {
  enviado: boolean;
  tentativas: number;
  hashAssinatura?: string;
  erro?: string;
}

/**
 * Envia com backoff. Roda depois da resposta ao visitante (`after()` na rota),
 * então o tempo aqui não é tempo de espera de ninguém — e é melhor insistir do
 * que perder um lead que já custou clique no Meta Ads.
 */
export async function enviarAoCrm(corpo: CorpoWebhook): Promise<ResultadoEnvio> {
  if (!crmConfigurado) {
    await registrar({
      crmLeadUuid: corpo.lead_uuid,
      evento: 'crm_nao_configurado',
      origem: corpo.origem,
      detalhe: { motivo: 'CRM_WEBHOOK_URL ou LEAD_WEBHOOK_SECRET ausente' },
    });
    return { enviado: false, tentativas: 0, erro: 'crm_nao_configurado' };
  }

  const serializado = JSON.stringify(corpo);
  const assinatura = assinar(serializado, env.LEAD_WEBHOOK_SECRET!);
  let ultimoErro = 'desconhecido';

  for (const [indice, espera] of ESPERAS_MS.entries()) {
    if (espera > 0) await new Promise((r) => setTimeout(r, espera));

    try {
      const resposta = await fetch(env.CRM_WEBHOOK_URL!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Signature': assinatura,
          'X-Lead-Uuid': corpo.lead_uuid,
        },
        body: serializado,
        signal: AbortSignal.timeout(10_000),
      });

      if (resposta.ok) {
        await registrar({
          crmLeadUuid: corpo.lead_uuid,
          evento: 'crm_enviado',
          origem: corpo.origem,
          hashAssinatura: assinatura.slice(0, 16),
          detalhe: { tentativas: indice + 1, status: resposta.status },
        });
        return { enviado: true, tentativas: indice + 1, hashAssinatura: assinatura.slice(0, 16) };
      }

      /* 4xx que não seja 429 não melhora com retry: o corpo é que está errado. */
      if (resposta.status >= 400 && resposta.status < 500 && resposta.status !== 429) {
        ultimoErro = `http_${resposta.status}`;
        break;
      }

      ultimoErro = `http_${resposta.status}`;
    } catch (e) {
      ultimoErro = e instanceof Error ? e.name : 'erro_desconhecido';
    }
  }

  await registrar({
    crmLeadUuid: corpo.lead_uuid,
    evento: 'crm_falhou',
    origem: corpo.origem,
    hashAssinatura: assinatura.slice(0, 16),
    detalhe: { erro: ultimoErro, tentativas: ESPERAS_MS.length },
  });

  return { enviado: false, tentativas: ESPERAS_MS.length, erro: ultimoErro };
}
