import type { Metadata } from 'next';

import { Card, Tag } from '@/components/ui/primitives';
import { LogoutButton } from '@/features/auth/logout-button';
import { formatDate } from '@/lib/text';
import { requireUser } from '@/server/auth/authorize';
import { getAccountProfile } from '@/server/services/accounts';

export const metadata: Metadata = { title: 'Perfil', robots: { index: false } };

const ROLE_LABEL: Record<string, string> = {
  BUYER: 'Comprador',
  CREATOR: 'Criador',
  PROFESSIONAL: 'Profissional',
  ADMIN: 'Administrador',
};

export default async function ProfilePage() {
  const user = await requireUser();
  const account = await getAccountProfile(user.id);

  return (
    <>
      <h1 className="text-[30px] font-extrabold">Perfil</h1>

      <Card className="mt-8 p-6">
        <dl className="flex flex-col gap-5 text-[15px]">
          <div>
            <dt className="text-[12.5px] uppercase tracking-[0.1em] text-muted">Nome</dt>
            <dd className="mt-1 font-semibold">{account?.name}</dd>
          </div>
          <div>
            <dt className="text-[12.5px] uppercase tracking-[0.1em] text-muted">E-mail</dt>
            <dd className="mt-1 font-semibold">{account?.email}</dd>
          </div>
          <div>
            <dt className="text-[12.5px] uppercase tracking-[0.1em] text-muted">Papéis</dt>
            <dd className="mt-2 flex flex-wrap gap-1.5">
              {account?.roles.map((role) => (
                <Tag key={role.role} tone="brand">{ROLE_LABEL[role.role] ?? role.role}</Tag>
              ))}
            </dd>
          </div>
          <div>
            <dt className="text-[12.5px] uppercase tracking-[0.1em] text-muted">Na plataforma desde</dt>
            <dd className="mt-1 font-semibold">{account ? formatDate(account.createdAt) : '—'}</dd>
          </div>
        </dl>
      </Card>

      <Card className="mt-5 p-6">
        <h2 className="text-[17px] font-bold">Privacidade e seus dados</h2>
        <p className="mt-2 text-[14.5px] leading-relaxed text-ink-body">
          Você pode pedir a exclusão da sua conta a qualquer momento (LGPD art. 18). Os dados
          pessoais são anonimizados; o registro fiscal das transações é preservado, como a
          legislação exige, porque envolve também a contraparte da compra.
        </p>
        <p className="mt-3 text-[13.5px] text-muted">
          Solicitações: <a href="mailto:privacidade@automatize.com.br">privacidade@automatize.com.br</a>
        </p>
      </Card>

      <div className="mt-6">
        <LogoutButton />
      </div>
    </>
  );
}
