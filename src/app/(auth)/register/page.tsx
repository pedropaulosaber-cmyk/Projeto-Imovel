import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

import { Card } from '@/components/ui/primitives';
import { AuthForm } from '@/features/auth/auth-form';
import { registerAction } from '@/server/actions/auth';
import { currentUser } from '@/server/auth/authorize';

export const metadata: Metadata = {
  title: 'Criar conta',
  robots: { index: false, follow: false },
};

export default async function RegisterPage() {
  if (await currentUser()) redirect('/dashboard');

  return (
    <Card className="p-7 sm:p-9">
      <h1 className="text-[26px] font-extrabold">Criar conta</h1>
      <p className="mt-2 mb-6 text-[14.5px] text-ink-body">
        Uma conta serve para tudo: comprar, vender e ser contratado. Você escolhe depois.
      </p>

      <Suspense fallback={<div className="shimmer h-96 rounded-[var(--radius-card)]" />}>
        <AuthForm mode="register" action={registerAction} />
      </Suspense>
    </Card>
  );
}
