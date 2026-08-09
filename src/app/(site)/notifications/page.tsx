import type { Metadata } from 'next';
import Link from 'next/link';

import { Card, EmptyState, Tag } from '@/components/ui/primitives';
import { formatRelative } from '@/lib/text';
import { requireUser } from '@/server/auth/authorize';
import { listNotifications } from '@/server/services/engagement';

export const metadata: Metadata = { title: 'Notificações', robots: { index: false } };

export default async function NotificationsPage() {
  const user = await requireUser();
  const notifications = await listNotifications(user.id);

  return (
    <div className="mx-auto max-w-[760px] px-5 py-12 lg:px-10 lg:py-16">
      <h1 className="text-[30px] font-extrabold">Notificações</h1>

      {notifications.length === 0 ? (
        <div className="mt-8">
          <EmptyState title="Nada por aqui" description="Compras, vendas, propostas e avaliações aparecem nesta lista." />
        </div>
      ) : (
        <ul className="mt-8 flex list-none flex-col gap-2.5 p-0">
          {notifications.map((notification) => {
            const body = (
              <Card className={`p-4 ${notification.readAt ? '' : 'border-brand/30 bg-brand-subtle/30'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[14.5px] font-bold">{notification.title}</p>
                    <p className="mt-1 text-[13.5px] leading-relaxed text-ink-body">{notification.body}</p>
                  </div>
                  <div className="flex flex-none flex-col items-end gap-1.5">
                    {!notification.readAt ? <Tag tone="brand">Nova</Tag> : null}
                    <time dateTime={new Date(notification.createdAt).toISOString()} className="text-[12px] text-muted">
                      {formatRelative(notification.createdAt)}
                    </time>
                  </div>
                </div>
              </Card>
            );

            return (
              <li key={notification.id}>
                {notification.href ? (
                  <Link href={notification.href} className="block no-underline">{body}</Link>
                ) : (
                  body
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
