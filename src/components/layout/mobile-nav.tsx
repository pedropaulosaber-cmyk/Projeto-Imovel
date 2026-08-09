'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import { LinkButton } from '@/components/ui/button';

/**
 * Navegação móvel — gaveta.
 *
 * Client Component porque abre e fecha; é o único pedaço do cabeçalho que
 * precisa de JavaScript, e por isso está isolado num arquivo próprio. Se
 * vivesse dentro do `SiteHeader`, o cabeçalho inteiro (que lê sessão do banco)
 * viraria cliente.
 *
 * ## O que costuma faltar num menu assim
 *
 * Três coisas, todas implementadas abaixo, todas invisíveis quando funcionam:
 *
 *  · **Esc fecha.** Sem isso, quem navega por teclado fica preso.
 *  · **Trava a rolagem do fundo.** Sem isso, o corpo da página rola atrás do
 *    painel e a pessoa perde o lugar onde estava.
 *  · **Fecha ao navegar.** Sem isso, o menu continua aberto sobre a página
 *    nova e parece que o clique não funcionou. O fechamento é no `onClick` do
 *    link, e não num efeito que observa a rota: o efeito só rodaria depois da
 *    navegação começar, deixando um piscar do painel sobre a página nova.
 */

type NavItem = { href: string; label: string };

export function MobileNav({
  items,
  authenticated,
}: {
  items: NavItem[];
  authenticated: boolean;
}) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // O foco vai para o painel: sem isso o teclado continua no botão, atrás
    // do overlay, e o Tab passeia por links que a pessoa não está vendo.
    panelRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls="menu-mobile"
        className="grid h-10 w-10 place-items-center rounded-[var(--radius-field)] border border-line bg-paper lg:hidden"
      >
        <span className="sr-only">Abrir menu</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
          <path d="M3 6h18M3 12h18M3 18h18" />
        </svg>
      </button>

      {open ? (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <button
            type="button"
            aria-label="Fechar menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-brand-deep/50"
          />

          <div
            id="menu-mobile"
            ref={panelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="absolute inset-x-0 top-0 rounded-b-[22px] bg-paper p-5 shadow-[var(--shadow-panel)] outline-none"
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="text-[13px] font-bold uppercase tracking-[0.14em] text-muted">
                Menu
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid h-10 w-10 place-items-center rounded-[var(--radius-field)] border border-line"
              >
                <span className="sr-only">Fechar menu</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <nav aria-label="Principal (celular)" className="flex flex-col">
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="border-b border-line py-3.5 text-[17px] font-semibold text-ink no-underline last:border-0"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="mt-5 flex flex-col gap-2.5">
              {authenticated ? (
                <>
                  <LinkButton href="/dashboard" fullWidth onClick={() => setOpen(false)}>
                    Meu painel
                  </LinkButton>
                  <LinkButton href="/library" variant="secondary" fullWidth>
                    Minha biblioteca
                  </LinkButton>
                </>
              ) : (
                <>
                  <LinkButton href="/register" fullWidth>
                    Começar agora
                  </LinkButton>
                  <LinkButton href="/login" variant="secondary" fullWidth>
                    Entrar
                  </LinkButton>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
