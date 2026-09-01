import 'server-only';

import { env, supabaseConfigurado } from '@/config/env';
import { empreendimentoPorSlug } from '@/content/empreendimentos';

import { registrar } from './auditoria';

/**
 * Entrega do book de vendas.
 *
 * O book é a contrapartida pelo dado do visitante: ele só existe depois de um
 * lead válido, com consentimento LGPD registrado. Por isso o PDF vive num
 * bucket privado e a única forma de alcançá-lo é uma URL assinada emitida aqui,
 * no servidor, já do outro lado da validação.
 *
 * A assinatura vale 30 minutos. É tempo de sobra para baixar e curto o
 * bastante para o link não virar um material solto circulando em grupo de
 * WhatsApp meses depois — o que esvaziaria a captação e distribuiria material
 * da incorporadora fora do controle do corretor.
 */

const VALIDADE_SEGUNDOS = 30 * 60;

export interface BookAssinado {
  url: string;
  nomeArquivo: string;
  expiraEm: number;
}

export async function assinarBook(
  empreendimentoSlug: string | undefined,
  leadUuid: string,
): Promise<BookAssinado | null> {
  if (!empreendimentoSlug || !supabaseConfigurado) return null;

  const empreendimento = empreendimentoPorSlug(empreendimentoSlug);
  const caminho = empreendimento?.book?.arquivo;
  if (!empreendimento || !caminho) return null;

  try {
    const resposta = await fetch(
      `${env.SUPABASE_URL}/storage/v1/object/sign/books/${encodeURIComponent(caminho)}`,
      {
        method: 'POST',
        headers: {
          apikey: env.SUPABASE_SERVICE_ROLE_KEY!,
          Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY!}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ expiresIn: VALIDADE_SEGUNDOS }),
        signal: AbortSignal.timeout(8_000),
      },
    );

    if (!resposta.ok) {
      await registrar({
        crmLeadUuid: leadUuid,
        evento: 'book_assinatura_falhou',
        detalhe: {
          empreendimento: empreendimento.slug,
          status: resposta.status,
          resposta: (await resposta.text().catch(() => '')).slice(0, 300),
        },
      });
      return null;
    }

    /* O Storage devolve um caminho relativo; a URL completa monta aqui. */
    const { signedURL } = (await resposta.json()) as { signedURL?: string };
    if (!signedURL) return null;

    await registrar({
      crmLeadUuid: leadUuid,
      evento: 'book_liberado',
      detalhe: { empreendimento: empreendimento.slug },
    });

    return {
      url: `${env.SUPABASE_URL}/storage/v1${signedURL}`,
      nomeArquivo: `${empreendimento.slug}.pdf`,
      expiraEm: VALIDADE_SEGUNDOS,
    };
  } catch (e) {
    await registrar({
      crmLeadUuid: leadUuid,
      evento: 'book_assinatura_falhou',
      detalhe: {
        empreendimento: empreendimento.slug,
        erro: e instanceof Error ? e.name : 'desconhecido',
      },
    });
    return null;
  }
}
