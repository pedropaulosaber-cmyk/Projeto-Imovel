import Link from 'next/link';

import { LinkButton } from '@/components/ui/button';
import { Logo } from '@/components/layout/logo';

/**
 * Página 404.
 *
 * ## Por que ela é dinâmica
 *
 * A CSP desta aplicação usa **nonce por requisição** (ver `middleware.ts`), e
 * nonce por requisição é incompatível com HTML pré-renderizado: o build
 * carimba um valor no `<script>`, o middleware manda outro no header, e o
 * navegador — corretamente — recusa executar tudo. O sintoma é uma 404 sem
 * estilo e sem JavaScript, que é a página que alguém vê justamente quando já
 * está perdido.
 *
 * `force-dynamic` faz esta rota ser renderizada por requisição, com o mesmo
 * nonce do header. O custo é desprezível — a página não consulta nada — e a
 * alternativa seria enfraquecer a CSP do site inteiro por causa de uma tela.
 */
export const dynamic = 'force-dynamic';

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-5 text-center">
      <Logo />
      <p className="text-[13px] font-bold uppercase tracking-[0.16em] text-brand">Erro 404</p>
      <h1 className="max-w-[18ch] text-[34px] font-extrabold leading-tight">
        Não encontramos esta página.
      </h1>
      <p className="max-w-[46ch] text-[15.5px] leading-relaxed text-ink-body">
        O endereço pode ter mudado, ou o conteúdo saiu do ar. O catálogo continua no lugar.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <LinkButton href="/products">Explorar soluções</LinkButton>
        <LinkButton href="/" variant="secondary">Voltar ao início</LinkButton>
      </div>
      <p className="text-[13px] text-muted">
        Acha que isto é um erro nosso? <Link href="/support">Fale com o suporte</Link>.
      </p>
    </div>
  );
}
