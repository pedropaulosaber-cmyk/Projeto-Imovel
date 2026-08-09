import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

import { Card } from '@/components/ui/primitives';
import { AuthForm } from '@/features/auth/auth-form';
import { loginAction } from '@/server/actions/auth';
import { currentUser } from '@/server/auth/authorize';

export const metadata: Metadata = {
  title: 'Entrar',
  // Tela de autenticação não tem por que estar no índice de busca: não traz
  // tráfego útil e o `next` na query pode acabar indexado junto.
  robots: { index: false, follow: false },
};

export default async function LoginPage() {
  // Quem já está logado não deveria ver a tela de login: mandá-lo direto ao
  // painel evita o "por que ele está me pedindo a senha de novo?".
  if (await currentUser()) redirect('/dashboard');

  return (
    <Card className="p-7 sm:p-9">
      <h1 className="text-[26px] font-extrabold">Bem-vindo de volta</h1>
      <p className="mt-2 mb-6 text-[14.5px] text-ink-body">
        Entre para acessar sua biblioteca, seus pedidos e seu painel.
      </p>

      {/* `useSearchParams` no formulário exige limite de Suspense — sem ele a
          página inteira vira renderização dinâmica. */}
      <Suspense fallback={<div className="shimmer h-72 rounded-[var(--radius-card)]" />}>
        <AuthForm mode="login" action={loginAction} />
      </Suspense>
    </Card>
  );
}
