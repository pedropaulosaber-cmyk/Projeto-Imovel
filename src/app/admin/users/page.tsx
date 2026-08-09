import type { Metadata } from 'next';

import { Avatar, Card, Tag } from '@/components/ui/primitives';
import { Pagination } from '@/components/ui/pagination';
import { formatDate } from '@/lib/text';
import { listUsers } from '@/server/services/accounts';

export const metadata: Metadata = { title: 'Usuários', robots: { index: false } };

type SearchParams = Promise<{ q?: string; page?: string }>;

const STATUS_TONE = { ACTIVE: 'positive', SUSPENDED: 'warning', BANNED: 'danger' } as const;

export default async function AdminUsersPage({ searchParams }: { searchParams: SearchParams }) {
  const { q, page } = await searchParams;
  const { items, total, page: current, pageCount } = await listUsers({
    q,
    page: Number(page) || 1,
  });

  const params = new URLSearchParams();
  if (q) params.set('q', q);

  return (
    <div className="mx-auto max-w-[1000px] px-5 py-12 lg:px-10">
      <h1 className="text-[30px] font-extrabold">Usuários</h1>
      <p className="mt-2 text-[15px] text-ink-body">{total} contas cadastradas.</p>

      <form role="search" className="mt-6 flex gap-2">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ''}
          placeholder="Buscar por nome ou e-mail"
          aria-label="Buscar usuários"
          className="flex-1 rounded-[var(--radius-field)] border border-line bg-paper px-3.5 py-2.5 text-[15px]"
        />
        <button type="submit" className="rounded-[var(--radius-btn)] bg-brand px-5 text-[15px] font-semibold text-white">
          Buscar
        </button>
      </form>

      <ul className="mt-8 flex list-none flex-col gap-2.5 p-0">
        {items.map((user) => (
          <li key={user.id}>
            <Card className="flex flex-wrap items-center gap-4 p-4">
              <Avatar name={user.name} size={38} />
              <div className="min-w-0 flex-1">
                <p className="text-[14.5px] font-bold">
                  {user.name}
                  {user.deletedAt ? <span className="ml-2 text-[12px] text-muted">(removida)</span> : null}
                </p>
                <p className="truncate text-[12.5px] text-muted">{user.email}</p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {user.roles.map((role) => (
                  <Tag key={role.role}>{role.role}</Tag>
                ))}
                <Tag tone={STATUS_TONE[user.status]}>{user.status}</Tag>
              </div>
              <div className="text-right text-[12px] text-muted">
                <p>{user._count.products} produtos · {user._count.orders} pedidos</p>
                <p>desde {formatDate(user.createdAt)}</p>
              </div>
            </Card>
          </li>
        ))}
      </ul>

      <Pagination page={current} pageCount={pageCount} baseParams={params} className="mt-10" />
    </div>
  );
}
