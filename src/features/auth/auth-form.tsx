'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useActionState } from 'react';

import { Field, Input, Select, SubmitButton } from '@/components/ui/form';
import { Notice } from '@/components/ui/primitives';
import type { ActionResult } from '@/server/actions/action';

/**
 * Formulário de entrada e cadastro.
 *
 * Um componente para os dois porque a diferença é um campo e um rótulo —
 * duplicar significaria corrigir o tratamento de erro duas vezes.
 *
 * ## `useActionState`
 *
 * Mantém o resultado da Server Action entre renders sem estado manual, e o
 * formulário continua funcionando **sem JavaScript**: o `<form action={...}>`
 * envia normalmente e o servidor responde. Isso não é purismo — é o que faz a
 * página funcionar no primeiro carregamento, antes de a hidratação terminar,
 * que é justamente quando o usuário impaciente já clicou.
 */

type Props = {
  mode: 'login' | 'register';
  action: (
    previous: ActionResult<never> | null,
    formData: FormData,
  ) => Promise<ActionResult<never>>;
};

export function AuthForm({ mode, action }: Props) {
  const [state, formAction] = useActionState(action, null);
  const searchParams = useSearchParams();
  const next = searchParams.get('next') ?? '';

  const errors = state && !state.ok ? state.fieldErrors : undefined;
  const message = state && !state.ok ? state.message : undefined;

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {/* O destino pós-login viaja no formulário; o servidor valida antes de
          redirecionar (ver `safeRedirect`). */}
      <input type="hidden" name="next" value={next} />

      {message && !errors ? <Notice>{message}</Notice> : null}

      {mode === 'register' ? (
        <Field label="Nome" error={errors?.name} required>
          {(props) => (
            <Input
              {...props}
              name="name"
              autoComplete="name"
              placeholder="Como devemos te chamar"
              required
            />
          )}
        </Field>
      ) : null}

      <Field label="E-mail" error={errors?.email} required>
        {(props) => (
          <Input
            {...props}
            name="email"
            type="email"
            autoComplete="email"
            placeholder="voce@empresa.com.br"
            required
          />
        )}
      </Field>

      <Field
        label="Senha"
        error={errors?.password}
        hint={mode === 'register' ? 'Pelo menos 10 caracteres. Uma frase funciona bem.' : undefined}
        required
      >
        {(props) => (
          <Input
            {...props}
            name="password"
            type="password"
            // `new-password` no cadastro faz o gerenciador de senhas oferecer
            // uma senha forte; `current-password` na entrada faz ele preencher.
            autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
            required
          />
        )}
      </Field>

      {mode === 'register' ? (
        <Field label="O que você quer fazer aqui?" error={errors?.intent}>
          {(props) => (
            <Select {...props} name="intent" defaultValue="BUYER">
              <option value="BUYER">Comprar soluções e contratar profissionais</option>
              <option value="CREATOR">Vender produtos que eu criei</option>
              <option value="PROFESSIONAL">Ser contratado para construir soluções</option>
            </Select>
          )}
        </Field>
      ) : null}

      <SubmitButton
        fullWidth
        size="lg"
        pendingLabel={mode === 'login' ? 'Entrando…' : 'Criando conta…'}
      >
        {mode === 'login' ? 'Entrar' : 'Criar conta'}
      </SubmitButton>

      <p className="text-center text-sm text-muted">
        {mode === 'login' ? (
          <>
            Não tem conta?{' '}
            <Link href={`/register${next ? `?next=${encodeURIComponent(next)}` : ''}`}>
              Criar agora
            </Link>
          </>
        ) : (
          <>
            Já tem conta?{' '}
            <Link href={`/login${next ? `?next=${encodeURIComponent(next)}` : ''}`}>Entrar</Link>
          </>
        )}
      </p>
    </form>
  );
}
