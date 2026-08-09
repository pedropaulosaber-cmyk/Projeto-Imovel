import Link from 'next/link';

import { Avatar } from '@/components/ui/primitives';
import { LinkButton } from '@/components/ui/button';
import { currentUser } from '@/server/auth/authorize';
import { unreadCount } from '@/server/services/engagement';
import { Logo } from './logo';
import { MobileNav } from './mobile-nav';

/**
 * Cabeçalho do site.
 *
 * Server Component: lê a sessão direto do banco, sem estado no cliente e sem
 * o "pisca" de quem renderiza deslogado e depois corrige. O usuário chega com
 * o HTML já certo.
 *
 * A navegação existe em duas formas na mesma árvore — barra horizontal no
 * desktop, gaveta e barra inferior no celular — porque as duas precisam do
 * mesmo dado de sessão e duplicar a busca seria duas consultas por página.
 */

const NAV = [
  { href: '/products', label: 'Produtos' },
  { href: '/professionals', label: 'Profissionais' },
  { href: '/demands', label: 'Demandas' },
  { href: '/sell', label: 'Vender' },
] as const;

export async function SiteHeader() {
  const user = await currentUser();
  const unread = user ? await unreadCount(user.id) : 0;

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-paper/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-6 px-5 lg:px-10">
        <Logo />

        <nav aria-label="Principal" className="ml-4 hidden items-center gap-7 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-[14.5px] font-medium text-ink-soft no-underline hover:text-brand-strong"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2.5">
          {user ? (
            <>
              <Link
                href="/notifications"
                className="relative hidden rounded-[var(--radius-btn)] p-2 text-ink-soft no-underline hover:bg-canvas sm:block"
                aria-label={
                  unread > 0 ? `Notificações, ${unread} não lidas` : 'Notificações'
                }
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.7 21a2 2 0 0 1-3.4 0" />
                </svg>
                {unread > 0 ? (
                  <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-brand px-1 text-[10px] font-bold text-white">
                    {unread > 9 ? '9+' : unread}
                  </span>
                ) : null}
              </Link>

              <Link
                href="/dashboard"
                className="hidden items-center gap-2 rounded-[var(--radius-btn)] px-2 py-1.5 no-underline hover:bg-canvas sm:flex"
              >
                <Avatar name={user.name} src={user.avatarUrl} size={30} />
                <span className="max-w-28 truncate text-[14px] font-semibold text-ink">
                  {user.name.split(' ')[0]}
                </span>
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden text-[14.5px] font-medium text-ink-soft no-underline hover:text-brand-strong sm:block"
              >
                Entrar
              </Link>
              <LinkButton href="/register" size="sm" className="hidden sm:inline-flex">
                Começar agora
              </LinkButton>
            </>
          )}

          <MobileNav
            authenticated={Boolean(user)}
            items={NAV.map((item) => ({ ...item }))}
          />
        </div>
      </div>
    </header>
  );
}
