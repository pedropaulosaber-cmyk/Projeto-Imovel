'use client';

import { useId, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { useFormStatus } from 'react-dom';

import { cn } from '@/lib/cn';
import { Button } from './button';

/**
 * Campos de formulário
 * ====================
 *
 * ## O rótulo é o componente, não um enfeite ao lado dele
 *
 * `Field` gera o `id`, amarra `<label htmlFor>`, `aria-describedby` e
 * `aria-invalid` de uma vez. A razão é que essa amarração é fácil de fazer e
 * fácil de esquecer — e quando falta, quem usa leitor de tela ouve "campo de
 * texto, em branco" sem saber o que preencher, e o toque no rótulo deixa de
 * focar o campo no celular.
 *
 * Fazendo o componente cuidar disso, não existe caminho onde alguém esqueça.
 */

type FieldProps = {
  label: string;
  hint?: string;
  error?: string | string[];
  required?: boolean;
  children: (props: {
    id: string;
    'aria-describedby': string | undefined;
    'aria-invalid': boolean | undefined;
  }) => ReactNode;
};

export function Field({ label, hint, error, required, children }: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const message = Array.isArray(error) ? error[0] : error;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13.5px] font-semibold text-ink-soft">
        {label}
        {required ? (
          <span className="text-danger" aria-hidden>
            {' '}
            *
          </span>
        ) : null}
      </label>

      {children({
        id,
        'aria-describedby': [hintId, errorId].filter(Boolean).join(' ') || undefined,
        'aria-invalid': message ? true : undefined,
      })}

      {hint && !message ? (
        <p id={hintId} className="text-xs text-muted">
          {hint}
        </p>
      ) : null}

      {message ? (
        <p id={errorId} className="text-xs font-medium text-danger">
          {message}
        </p>
      ) : null}
    </div>
  );
}

const CONTROL =
  'w-full rounded-[var(--radius-field)] border border-line bg-paper px-3.5 py-2.5 text-[15px] ' +
  'placeholder:text-faint transition-colors focus:border-brand aria-[invalid=true]:border-danger';

export function Input({ className, ...rest }: ComponentPropsWithoutRef<'input'>) {
  return <input className={cn(CONTROL, className)} {...rest} />;
}

export function Textarea({ className, ...rest }: ComponentPropsWithoutRef<'textarea'>) {
  return <textarea className={cn(CONTROL, 'min-h-32 resize-y leading-relaxed', className)} {...rest} />;
}

export function Select({ className, children, ...rest }: ComponentPropsWithoutRef<'select'>) {
  return (
    <select className={cn(CONTROL, 'appearance-none pr-9', className)} {...rest}>
      {children}
    </select>
  );
}

/**
 * Botão de envio ciente do estado do formulário.
 *
 * `useFormStatus` sabe se a Server Action está em voo. Sem isto, o duplo
 * clique manda a ação duas vezes e o usuário não tem nenhum sinal de que a
 * primeira já saiu — os dois defeitos que fazem um formulário parecer quebrado
 * mesmo funcionando.
 */
export function SubmitButton({
  children,
  pendingLabel,
  ...rest
}: {
  children: ReactNode;
  pendingLabel?: string;
} & Omit<ComponentPropsWithoutRef<typeof Button>, 'children' | 'type'>) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} aria-busy={pending} {...rest}>
      {pending ? (pendingLabel ?? 'Enviando…') : children}
    </Button>
  );
}
