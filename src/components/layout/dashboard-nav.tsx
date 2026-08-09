'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/cn';

/**
 * Navegação do painel.
 *
 * Client Component só por causa do `usePathname` — precisa saber qual item
 * está ativo. O `aria-current="page"` é o que comunica isso a quem não vê a
 * cor de destaque.
 */
export function DashboardNav({ items }: { items: { href: string; label: string }[] }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Painel" className="-mx-1 flex gap-1 overflow-x-auto lg:mx-0 lg:flex-col">
      {items.map((item) => {
        const active = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'whitespace-nowrap rounded-[var(--radius-btn)] px-3.5 py-2.5 text-[14.5px] font-medium no-underline transition-colors',
              active
                ? 'bg-brand-subtle text-brand-strong'
                : 'text-ink-soft hover:bg-canvas hover:text-brand-strong',
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
