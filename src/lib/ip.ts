/**
 * IP do cliente, a partir de fonte confiável.
 *
 * `x-forwarded-for` é cabeçalho de cliente: o valor mais à ESQUERDA é o que o
 * navegador mandou, e um atacante manda o que quiser ali. Ler `split(',')[0]`
 * é o erro clássico que deixa forjar o IP — e com ele furar o rate limit,
 * poluir o `ip_consentimento` (a prova de consentimento LGPD) e mentir o
 * `client_ip_address` para a Meta CAPI.
 *
 * Na Vercel a borda define `x-real-ip` com o IP real observado e o cliente não
 * consegue sobrescrever; e no `x-forwarded-for` ela ANEXA esse IP à direita.
 * Então a leitura confiável é: `x-real-ip` e, na falta dele, o ÚLTIMO salto do
 * `x-forwarded-for` — nunca o primeiro.
 *
 * Se um dia sair da Vercel, o trecho a rever é este: "último salto" só vale
 * quando há exatamente um proxy confiável na frente.
 */
export function ipDoCliente(headers: Headers): string | null {
  const real = headers.get('x-real-ip')?.trim();
  if (real) return real;

  const xff = headers.get('x-forwarded-for');
  if (xff) {
    const saltos = xff
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
    const ultimo = saltos.at(-1);
    if (ultimo) return ultimo;
  }

  return null;
}
