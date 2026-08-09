import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Avatar, Card } from '@/components/ui/primitives';
import { MessageComposer } from '@/features/messages/composer';
import { isAppError } from '@/lib/errors';
import { formatDateTime } from '@/lib/text';
import { requireUser } from '@/server/auth/authorize';
import { getConversation } from '@/server/services/engagement';

export const metadata: Metadata = { title: 'Conversa', robots: { index: false } };

type Params = Promise<{ id: string }>;

/**
 * Uma conversa.
 *
 * `getConversation` confere a participação **antes** de ler qualquer mensagem
 * e lança `NOT_FOUND` para quem não participa — resposta idêntica à de uma
 * conversa inexistente, para que um id adivinhado não confirme nada.
 */
export default async function ConversationPage({ params }: { params: Params }) {
  const { id } = await params;
  const user = await requireUser();

  let conversation;
  try {
    conversation = await getConversation(user, id);
  } catch (error) {
    if (isAppError(error) && error.code === 'NOT_FOUND') notFound();
    throw error;
  }

  const other = conversation.members.find((member) => member.user.id !== user.id)?.user;

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-[760px] flex-col px-5 py-8 lg:px-10 lg:py-12">
      <div className="flex items-center gap-3 border-b border-line pb-4">
        <Link href="/messages" className="text-[13.5px] no-underline text-muted hover:text-brand-strong">
          ← Mensagens
        </Link>
      </div>

      <div className="flex items-center gap-3 py-5">
        <Avatar name={other?.name ?? 'Conversa'} src={other?.avatarUrl} size={44} />
        <div>
          <h1 className="text-[19px] font-extrabold">{other?.name ?? 'Conversa'}</h1>
          {conversation.subject ? (
            <p className="text-[13.5px] text-muted">{conversation.subject}</p>
          ) : null}
        </div>
      </div>

      <ol className="flex flex-1 list-none flex-col gap-3 p-0">
        {conversation.messages.map((message) => {
          const mine = message.sender.id === user.id;

          return (
            <li key={message.id} className={mine ? 'self-end' : 'self-start'}>
              <Card
                className={`max-w-[min(520px,85vw)] px-4 py-3 ${
                  mine ? 'border-brand/25 bg-brand-subtle' : ''
                }`}
              >
                <p className="whitespace-pre-wrap text-[14.5px] leading-relaxed text-ink-body">
                  {message.body}
                </p>
                <time
                  dateTime={new Date(message.createdAt).toISOString()}
                  className="mt-1.5 block text-[11.5px] text-muted"
                >
                  {mine ? 'Você' : message.sender.name} · {formatDateTime(message.createdAt)}
                </time>
              </Card>
            </li>
          );
        })}

        {conversation.messages.length === 0 ? (
          <li className="py-10 text-center text-[14px] text-muted">
            Nenhuma mensagem ainda. Comece a conversa.
          </li>
        ) : null}
      </ol>

      <div className="sticky bottom-0 mt-6 bg-paper pt-4">
        <MessageComposer conversationId={conversation.id} />
      </div>
    </div>
  );
}
