import { type NextRequest, NextResponse } from 'next/server';

import { ipDoCliente } from '@/lib/ip';

/**
 * Rate limit do endpoint de lead (CLAUDE.md §9).
 *
 * Janela deslizante em memória. Limitação conhecida e aceita nesta fase: a
 * contagem é por instância, então numa implantação com várias regiões o teto
 * efetivo é o limite multiplicado pelo número de instâncias quentes. Isso
 * ainda barra o caso que importa — um script disparando centenas de POSTs da
 * mesma origem — sem depender de infraestrutura extra.
 *
 * O IP vem de `ipDoCliente`, que lê fonte confiável: chavear pelo
 * `x-forwarded-for` mais à esquerda deixava um atacante forjar o IP e mandar
 * quantos POSTs quisesse, cada um com um IP diferente. Sem uma chave honesta,
 * este limite é decorativo.
 *
 * Quando o volume justificar, trocar o `Map` por Vercel KV / Upstash mantendo
 * esta mesma interface.
 */

const JANELA_MS = 60_000;
const TETO_PADRAO = 5;

const acessos = new Map<string, number[]>();

/** Evita que o Map cresça sem fim num processo de vida longa. */
function limpar(agora: number): void {
  if (acessos.size < 5_000) return;
  for (const [chave, marcas] of acessos) {
    const vivas = marcas.filter((t) => agora - t < JANELA_MS);
    if (vivas.length === 0) acessos.delete(chave);
    else acessos.set(chave, vivas);
  }
}

function excedeu(chave: string, teto: number): boolean {
  const agora = Date.now();
  limpar(agora);

  const marcas = (acessos.get(chave) ?? []).filter((t) => agora - t < JANELA_MS);
  if (marcas.length >= teto) {
    acessos.set(chave, marcas);
    return true;
  }

  marcas.push(agora);
  acessos.set(chave, marcas);
  return false;
}

export function middleware(req: NextRequest) {
  if (req.method !== 'POST') return NextResponse.next();

  const teto = Number(process.env.RATE_LIMIT_LEADS_POR_MINUTO) || TETO_PADRAO;
  const ip = ipDoCliente(req.headers) ?? 'desconhecido';

  if (excedeu(`lead:${ip}`, teto)) {
    return NextResponse.json(
      { erro: 'Muitos envios em pouco tempo. Aguarde um minuto e tente de novo.' },
      { status: 429, headers: { 'Retry-After': '60' } },
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/leads/:path*',
};
