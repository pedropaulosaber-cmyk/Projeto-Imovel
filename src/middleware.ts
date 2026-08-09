import { NextResponse, type NextRequest } from 'next/server';

/**
 * Middleware — CSP com nonce e proteção de rotas
 * ==============================================
 *
 * ## Por que a CSP mora aqui e não no `next.config.ts`
 *
 * Uma CSP que vale alguma coisa não pode conter `unsafe-inline` em
 * `script-src` — com ele, a política deixa de proteger contra XSS, que é o
 * único motivo de ela existir. Mas o Next injeta scripts inline para
 * hidratação, então a saída é o **nonce**: um valor aleatório por requisição
 * que autoriza exatamente aqueles scripts e nenhum outro.
 *
 * Nonce por requisição só existe onde há requisição — daí o middleware.
 *
 * ## A checagem de rota aqui é a primeira barreira, não a única
 *
 * O middleware olha só a presença do cookie, sem consultar o banco (ele roda
 * na borda, antes do runtime Node). Isso evita que um visitante deslogado
 * carregue o JavaScript inteiro do painel só para ser rejeitado depois — mas
 * **não** é autorização: um cookie inválido passa por aqui.
 *
 * A autorização de verdade é a de cada página e Server Action, que lê a
 * sessão no banco e confere papel e ownership. Confiar no middleware para
 * autorizar é o erro que já produziu bypass em produtos reais, porque o
 * `matcher` sempre esquece uma rota.
 */

const SESSION_COOKIE = 'automatize_session';

/** Prefixos que exigem sessão. Espelham a estrutura de pastas do App Router. */
const PROTECTED = ['/dashboard', '/library', '/favorites', '/messages', '/notifications', '/admin'];

function buildCsp(nonce: string, isDev: boolean): string {
  const directives = [
    "default-src 'self'",
    // `strict-dynamic` faz o navegador confiar nos scripts que um script com
    // nonce carregar, o que cobre o carregamento de chunks do Next sem abrir
    // a política para qualquer origem.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' ${isDev ? "'unsafe-eval'" : ''}`,
    // O Tailwind e o `next/font` geram estilo inline; não há mecanismo de
    // nonce para estilo que o Next suporte hoje. `unsafe-inline` em
    // `style-src` é bem menos grave que em `script-src`: permite mexer na
    // aparência, não executar código.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    // Restrito de propósito: com `connect-src` aberto, um XSS exfiltra dados
    // para qualquer servidor. Aqui, o destino tem de ser a própria origem ou
    // o Stripe.
    "connect-src 'self' https://api.stripe.com",
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
    // Impede que a aplicação seja embutida em iframe de terceiros —
    // clickjacking. É o equivalente moderno do `X-Frame-Options`.
    "frame-ancestors 'none'",
    // Sem isto, um `<base href>` injetado reescreve todo caminho relativo da
    // página para o servidor do atacante.
    "base-uri 'self'",
    // Restringe para onde formulários podem postar.
    "form-action 'self'",
    "object-src 'none'",
    ...(isDev ? [] : ['upgrade-insecure-requests']),
  ];

  return directives.filter(Boolean).join('; ');
}

export function middleware(request: NextRequest) {
  const isDev = process.env.NODE_ENV === 'development';

  // 16 bytes de aleatoriedade criptográfica. `Math.random` seria adivinhável,
  // e um nonce adivinhável é um nonce que não protege.
  const nonce = Buffer.from(crypto.randomUUID().replace(/-/g, ''), 'hex').toString('base64');
  const csp = buildCsp(nonce, isDev);

  const { pathname, search } = request.nextUrl;
  const requiresSession = PROTECTED.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (requiresSession && !request.cookies.get(SESSION_COOKIE)) {
    const login = new URL('/login', request.url);
    // Guarda o destino para devolver a pessoa exatamente onde ela tentou
    // chegar. Sem isso, quem clica num link de e-mail cai na home depois de
    // logar e tem de procurar de novo o que ia fazer.
    login.searchParams.set('next', `${pathname}${search}`);
    return NextResponse.redirect(login);
  }

  // O nonce viaja num header de requisição para que os Server Components
  // possam lê-lo com `headers()` e aplicá-lo a scripts próprios.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('content-security-policy', csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('content-security-policy', csp);

  return response;
}

export const config = {
  matcher: [
    /*
     * Tudo, menos assets estáticos e o webhook.
     *
     * O webhook fica de fora porque a requisição vem do Stripe, não de um
     * navegador: CSP é irrelevante e o redirecionamento de login quebraria a
     * entrega do evento.
     */
    {
      source: '/((?!api/webhooks|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
