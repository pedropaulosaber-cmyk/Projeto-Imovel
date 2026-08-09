import Link from 'next/link';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import { cn } from '@/lib/cn';

/**
 * Botão
 * =====
 *
 * As três variantes do Canvas: `primary` (azul cheio), `secondary` (borda) e
 * `ghost` (só texto). Nada além disso — cada variante nova é uma decisão a
 * mais na cabeça de quem monta uma tela, e "qual botão eu uso aqui?" é a
 * pergunta que faz interface divergir.
 *
 * ## Botão ou link?
 *
 * `<button>` executa uma ação; `<a>` navega. A distinção não é purismo: um
 * link abre em nova aba com Ctrl+clique, aparece na lista de links do leitor
 * de tela e é rastreável pelo navegador. Um botão faz nada disso, e um link
 * disfarçado de botão quebra o Enter do teclado.
 *
 * Por isso `href` troca o elemento renderizado, e o estilo é o mesmo nos dois.
 */

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-brand text-white border-transparent hover:bg-brand-strong hover:shadow-[var(--shadow-brand)] active:translate-y-px',
  secondary:
    'bg-paper text-ink border-line hover:border-brand hover:text-brand-strong hover:bg-brand-subtle',
  ghost: 'bg-transparent text-brand-strong border-transparent hover:text-brand-deep',
  danger: 'bg-danger text-white border-transparent hover:brightness-95',
};

const SIZES: Record<Size, string> = {
  sm: 'text-[13.5px] px-3.5 py-2 gap-1.5',
  md: 'text-[15px] px-[22px] py-[13px] gap-2',
  lg: 'text-base px-[26px] py-[15px] gap-2',
};

const BASE =
  'inline-flex items-center justify-center font-semibold border rounded-[var(--radius-btn)] ' +
  'transition-[background-color,border-color,transform,box-shadow] duration-150 ' +
  'disabled:opacity-50 disabled:pointer-events-none no-underline whitespace-nowrap';

type SharedProps = {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  children: ReactNode;
  className?: string;
};

export function buttonClasses({
  variant = 'primary',
  size = 'md',
  fullWidth,
  className,
}: Omit<SharedProps, 'children'>): string {
  return cn(BASE, VARIANTS[variant], SIZES[size], fullWidth && 'w-full', className);
}

type ButtonProps = SharedProps & Omit<ComponentPropsWithoutRef<'button'>, 'className' | 'children'>;

export function Button({ variant, size, fullWidth, className, children, ...rest }: ButtonProps) {
  return (
    <button
      // `type` padrão de `<button>` dentro de form é `submit`. Um botão
      // "cancelar" sem type explícito envia o formulário — defeito clássico,
      // silencioso e irritante. O padrão aqui é `button`; quem submete diz.
      type={rest.type ?? 'button'}
      className={buttonClasses({ variant, size, fullWidth, className })}
      {...rest}
    >
      {children}
    </button>
  );
}

type LinkButtonProps = SharedProps &
  Omit<ComponentPropsWithoutRef<typeof Link>, 'className' | 'children'>;

export function LinkButton({
  variant,
  size,
  fullWidth,
  className,
  children,
  ...rest
}: LinkButtonProps) {
  return (
    <Link className={buttonClasses({ variant, size, fullWidth, className })} {...rest}>
      {children}
    </Link>
  );
}
