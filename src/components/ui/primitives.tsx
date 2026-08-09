import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import { cn } from '@/lib/cn';

/**
 * Primitivas visuais
 * ==================
 *
 * Os pedaços pequenos e repetidos do design do Canvas: cartão, etiqueta,
 * chip, olho-de-boi, avatar, estrelas. Ficam num arquivo só porque cada um
 * tem entre cinco e vinte linhas, e espalhá-los em quinze arquivos torna a
 * biblioteca mais difícil de folhear do que de usar.
 */

// ---------------------------------------------------------------------------
// Superfícies
// ---------------------------------------------------------------------------

export function Card({
  className,
  interactive,
  children,
  ...rest
}: ComponentPropsWithoutRef<'div'> & { interactive?: boolean }) {
  return (
    <div
      className={cn(
        'bg-paper border border-line rounded-[var(--radius-card)]',
        interactive &&
          'transition-[transform,box-shadow,border-color] duration-150 hover:-translate-y-[3px] hover:border-brand hover:shadow-[var(--shadow-card)]',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

/** Painel destacado — o bloco cinza-claro com borda do design. */
export function Panel({ className, children, ...rest }: ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      className={cn('bg-canvas border border-line rounded-[var(--radius-panel)]', className)}
      {...rest}
    >
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Texto de apoio
// ---------------------------------------------------------------------------

/** O "olho-de-boi" maiúsculo azul que abre cada seção no design. */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'text-[12.5px] font-bold uppercase tracking-[0.16em] text-brand block',
        className,
      )}
    >
      {children}
    </span>
  );
}

export function SectionTitle({
  children,
  className,
  as: Tag = 'h2',
}: {
  children: ReactNode;
  className?: string;
  as?: 'h1' | 'h2' | 'h3';
}) {
  return (
    <Tag className={cn('text-[34px] leading-[1.08] font-extrabold sm:text-[40px]', className)}>
      {children}
    </Tag>
  );
}

// ---------------------------------------------------------------------------
// Etiquetas
// ---------------------------------------------------------------------------

type TagTone = 'brand' | 'neutral' | 'positive' | 'warning' | 'danger';

const TAG_TONES: Record<TagTone, string> = {
  brand: 'bg-brand-subtle text-brand-strong',
  neutral: 'bg-line-soft text-ink-body',
  positive: 'bg-positive-subtle text-positive',
  warning: 'bg-warning-subtle text-warning',
  danger: 'bg-danger-subtle text-danger',
};

export function Tag({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode;
  tone?: TagTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center text-[11.5px] font-semibold px-[9px] py-1 rounded-md',
        TAG_TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/**
 * Chip de filtro.
 *
 * `aria-pressed` em vez de só a cor: quem usa leitor de tela precisa saber
 * que o filtro está ativo, e "azul" não é informação para essa pessoa.
 */
export function Chip({
  children,
  active,
  className,
  ...rest
}: ComponentPropsWithoutRef<'button'> & { active?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        'rounded-full border px-3.5 py-[7px] text-[13px] font-medium transition-colors duration-150',
        active
          ? 'bg-brand border-brand text-white'
          : 'bg-paper border-line text-ink-soft hover:border-brand hover:text-brand-strong',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Pessoas
// ---------------------------------------------------------------------------

/**
 * Avatar com recuo para iniciais.
 *
 * Sem foto, mostra a inicial em vez de um ícone genérico de pessoa: distingue
 * uma lista de dez vendedores, que é justamente o que o ícone genérico não faz.
 */
export function Avatar({
  name,
  src,
  size = 36,
  className,
}: {
  name: string;
  src?: string | null;
  size?: number;
  className?: string;
}) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  if (src) {
    return (
      // Avatar vem de host externo e varia por usuário; `next/image` aqui
      // exigiria allowlist de domínio para cada provedor de foto. O `img`
      // nativo com `loading="lazy"` é o certo para este caso.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        className={cn('rounded-full object-cover border border-line', className)}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      aria-hidden
      className={cn(
        'inline-grid place-items-center rounded-full bg-brand-subtle text-brand-strong font-bold border border-line',
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials || '?'}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Avaliação
// ---------------------------------------------------------------------------

/**
 * Estrelas.
 *
 * O valor numérico vai junto, em texto: cinco ícones são invisíveis para
 * leitor de tela e ilegíveis para quem tem baixa visão. O `aria-label` diz a
 * mesma coisa em uma frase.
 */
export function Stars({
  value,
  count,
  size = 14,
  className,
}: {
  value: number | null;
  count: number;
  size?: number;
  className?: string;
}) {
  if (value === null || count === 0) {
    return <span className={cn('text-[12.5px] text-muted', className)}>Sem avaliações</span>;
  }

  const filled = Math.round(value);

  return (
    <span
      className={cn('inline-flex items-center gap-1', className)}
      aria-label={`${value.toFixed(1)} de 5, ${count} avaliaç${count === 1 ? 'ão' : 'ões'}`}
    >
      <span aria-hidden className="inline-flex">
        {[1, 2, 3, 4, 5].map((index) => (
          <svg
            key={index}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill={index <= filled ? '#F59E0B' : '#E2E8F0'}
          >
            <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9z" />
          </svg>
        ))}
      </span>
      <span className="text-[12.5px] font-semibold">{value.toFixed(1)}</span>
      <span className="text-[12.5px] text-muted">({count})</span>
    </span>
  );
}

// ---------------------------------------------------------------------------
// Estados
// ---------------------------------------------------------------------------

/**
 * Estado vazio.
 *
 * Sempre com uma saída. Uma lista vazia que só diz "nada aqui" deixa a pessoa
 * sem próximo passo — e "sem próximo passo" é onde ela fecha a aba.
 */
export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-[var(--radius-card)] border border-dashed border-line bg-canvas px-6 py-14 text-center">
      {icon ? <div className="text-faint">{icon}</div> : null}
      <p className="text-lg font-bold">{title}</p>
      <p className="max-w-[46ch] text-sm text-ink-body">{description}</p>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn('shimmer rounded-[var(--radius-thumb)]', className)} />;
}

/** Miniatura de produto sem imagem — o gradiente azul do design. */
export function Thumb({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'thumb-gradient block rounded-[var(--radius-thumb)] border border-line',
        className,
      )}
    />
  );
}

/**
 * Aviso em linha.
 *
 * Usado para erro de formulário e para avisar que uma integração está
 * desligada no ambiente. `role="alert"` faz o leitor de tela anunciar na hora
 * — sem isso, quem não vê a tela não descobre que o envio falhou.
 */
export function Notice({
  tone = 'danger',
  children,
}: {
  tone?: 'danger' | 'warning' | 'positive' | 'info';
  children: ReactNode;
}) {
  const tones = {
    danger: 'bg-danger-subtle text-danger border-danger/20',
    warning: 'bg-warning-subtle text-warning border-warning/20',
    positive: 'bg-positive-subtle text-positive border-positive/20',
    info: 'bg-brand-subtle text-brand-strong border-brand/20',
  } as const;

  return (
    <p
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cn('rounded-[var(--radius-btn)] border px-3.5 py-2.5 text-sm', tones[tone])}
    >
      {children}
    </p>
  );
}
