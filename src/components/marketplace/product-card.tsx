import Link from 'next/link';

import { Card, Stars, Tag, Thumb } from '@/components/ui/primitives';
import { cn } from '@/lib/cn';
import { formatBRLCompact } from '@/lib/money';
import { averageRating, excerpt } from '@/lib/text';
import type { ProductCard as ProductCardData } from '@/server/services/products';

/**
 * Card de produto.
 *
 * ## O card inteiro é um link, e há só um link nele
 *
 * Aninhar `<a>` dentro de `<a>` é HTML inválido, e a saída comum — envolver o
 * card num `onClick` — quebra Ctrl+clique, o menu de contexto e a leitura por
 * teclado. A solução aqui é o "link estendido": um único `<a>` no título, com
 * um pseudo-elemento cobrindo o card. O alvo de clique é o card todo; a árvore
 * de acessibilidade vê um link só, com o nome certo.
 *
 * ## O que o card promete
 *
 * Nome, o que faz, quem fez, quanto custa e quanto as pessoas gostaram. São as
 * cinco perguntas que decidem o clique — e nenhuma delas exige abrir a página.
 */

export const PRODUCT_KIND_LABEL: Record<string, string> = {
  AI_AGENT: 'Agente de IA',
  AUTOMATION: 'Automação',
  WORKFLOW: 'Workflow',
  TEMPLATE: 'Template',
  PROMPT_PACK: 'Prompts',
  DATASET: 'Dataset',
  INTEGRATION: 'Integração',
};

export function ProductCard({
  product,
  className,
}: {
  product: ProductCardData;
  className?: string;
}) {
  const rating = averageRating(product.ratingSum, product.ratingCount);

  return (
    <Card
      interactive
      className={cn('relative flex flex-col gap-2.5 p-[18px]', className)}
    >
      {product.coverImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={product.coverImageUrl}
          alt=""
          loading="lazy"
          className="h-36 w-full rounded-[var(--radius-thumb)] border border-line object-cover"
        />
      ) : (
        <Thumb className="h-36 w-full" />
      )}

      <div className="flex flex-wrap items-center gap-1.5">
        <Tag tone="brand">{PRODUCT_KIND_LABEL[product.kind] ?? product.kind}</Tag>
        <Tag>{product.category.name}</Tag>
      </div>

      <h3 className="text-[16.5px] font-bold leading-snug">
        <Link
          href={`/products/${product.slug}`}
          // `after:absolute after:inset-0` é o que estende a área clicável do
          // título para o card inteiro sem criar um segundo link.
          className="text-ink no-underline after:absolute after:inset-0 after:content-[''] hover:text-brand-strong"
        >
          {product.name}
        </Link>
      </h3>

      <p className="text-[13.5px] leading-relaxed text-ink-body">{excerpt(product.tagline, 96)}</p>

      <div className="mt-auto flex items-end justify-between gap-3 pt-2">
        <div>
          <Stars value={rating} count={product.ratingCount} />
          <p className="mt-1 truncate text-xs text-muted">por {product.author.name}</p>
        </div>
        <span className="whitespace-nowrap text-[17px] font-extrabold tracking-tight">
          {product.priceCents === 0 ? 'Grátis' : formatBRLCompact(product.priceCents)}
        </span>
      </div>
    </Card>
  );
}

/** Esqueleto com a mesma altura do card — evita o salto de layout ao carregar. */
export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col gap-2.5 rounded-[var(--radius-card)] border border-line p-[18px]">
      <div className="shimmer h-36 w-full rounded-[var(--radius-thumb)]" />
      <div className="shimmer h-4 w-24 rounded" />
      <div className="shimmer h-5 w-full rounded" />
      <div className="shimmer h-4 w-3/4 rounded" />
      <div className="mt-2 flex justify-between">
        <div className="shimmer h-4 w-20 rounded" />
        <div className="shimmer h-5 w-16 rounded" />
      </div>
    </div>
  );
}
