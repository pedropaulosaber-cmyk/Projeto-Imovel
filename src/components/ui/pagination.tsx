import Link from 'next/link';

import { cn } from '@/lib/cn';

/**
 * Paginação.
 *
 * Links de verdade (`<a href>`), não botões com `onClick`: cada página é um
 * endereço próprio, o buscador consegue rastrear o catálogo inteiro e o
 * usuário pode abrir a página 3 em outra aba.
 *
 * A janela deslizante mostra no máximo cinco números em volta da atual. Listar
 * as 40 páginas de um catálogo grande estoura o layout no celular e não ajuda
 * ninguém — quem está na página 1 não vai clicar na 37.
 */
export function Pagination({
  page,
  pageCount,
  baseParams,
  className,
}: {
  page: number;
  pageCount: number;
  /** Filtros atuais, para que paginar não perca a busca em andamento. */
  baseParams: URLSearchParams;
  className?: string;
}) {
  if (pageCount <= 1) return null;

  const href = (target: number) => {
    const params = new URLSearchParams(baseParams);
    if (target === 1) params.delete('page');
    else params.set('page', String(target));
    const query = params.toString();
    return query ? `?${query}` : '?';
  };

  const start = Math.max(1, Math.min(page - 2, pageCount - 4));
  const end = Math.min(pageCount, start + 4);
  const pages = Array.from({ length: end - start + 1 }, (_, index) => start + index);

  const itemClass =
    'grid h-10 min-w-10 place-items-center rounded-[var(--radius-btn)] border px-3 text-[14px] font-semibold no-underline';

  return (
    <nav aria-label="Paginação" className={cn('flex items-center justify-center gap-2', className)}>
      {page > 1 ? (
        <Link href={href(page - 1)} rel="prev" className={cn(itemClass, 'border-line text-ink-soft hover:border-brand')}>
          <span className="sr-only">Página anterior</span>
          <span aria-hidden>←</span>
        </Link>
      ) : null}

      {start > 1 ? <span className="px-1 text-muted">…</span> : null}

      {pages.map((target) => (
        <Link
          key={target}
          href={href(target)}
          // `aria-current` é o que informa a página atual a quem usa leitor de
          // tela; a cor sozinha não comunica nada para essa pessoa.
          aria-current={target === page ? 'page' : undefined}
          className={cn(
            itemClass,
            target === page
              ? 'border-brand bg-brand text-white'
              : 'border-line text-ink-soft hover:border-brand',
          )}
        >
          {target}
        </Link>
      ))}

      {end < pageCount ? <span className="px-1 text-muted">…</span> : null}

      {page < pageCount ? (
        <Link href={href(page + 1)} rel="next" className={cn(itemClass, 'border-line text-ink-soft hover:border-brand')}>
          <span className="sr-only">Próxima página</span>
          <span aria-hidden>→</span>
        </Link>
      ) : null}
    </nav>
  );
}
