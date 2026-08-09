import type { Metadata } from 'next';
import Link from 'next/link';

import { LinkButton } from '@/components/ui/button';
import { Avatar, Card, EmptyState } from '@/components/ui/primitives';
import { excerpt, formatRelative } from '@/lib/text';
import { requireUser } from '@/server/auth/authorize';
import { listConversations } from '@/server/services/engagement';

export const metadata: Metadata = { title: 'Mensagens', robots: { index: false } };

export default async function MessagesPage() {
  const user = await requireUser();
  const conversations = await listConversations(user.id);

  return (
    <div className="mx-auto max-w-[760px] px-5 py-12 lg:px-10 lg:py-16">
      <h1 className="text-[30px] font-extrabold">Mensagens</h1>
      <p className="mt-2 text-[15px] text-ink-body">
        Conversas com profissionais e clientes. Tudo registrado dentro da plataforma.
      </p>

      {conversations.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="Nenhuma conversa ainda"
            description="Ao aceitar uma proposta ou entrar em contato com um profissional, a conversa aparece aqui."
            action={<LinkButton href="/professionals">Ver profissionais</LinkButton>}
          />
        </div>
      ) : (
        <ul className="mt-8 flex list-none flex-col gap-2.5 p-0">
          {conversations.map((conversation) => {
            const other = conversation.members[0]?.user;
            const last = conversation.messages[0];

            return (
              <li key={conversation.id}>
                <Link href={`/messages/${conversation.id}`} className="block no-underline">
                  <Card interactive className="flex items-center gap-3.5 p-4">
                    <Avatar name={other?.name ?? 'Conversa'} src={other?.avatarUrl} size={42} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[14.5px] font-bold text-ink">
                        {other?.name ?? 'Conversa'}
                      </p>
                      {conversation.subject ? (
                        <p className="truncate text-[12.5px] text-brand-strong">
                          {conversation.subject}
                        </p>
                      ) : null}
                      <p className="mt-0.5 truncate text-[13px] text-muted">
                        {last ? excerpt(last.body, 80) : 'Sem mensagens ainda'}
                      </p>
                    </div>
                    <time
                      dateTime={new Date(conversation.updatedAt).toISOString()}
                      className="flex-none text-[12px] text-muted"
                    >
                      {formatRelative(conversation.updatedAt)}
                    </time>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
