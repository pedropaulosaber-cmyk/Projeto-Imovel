import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { Card } from '@/components/ui/primitives';
import { StartConversation } from '@/features/messages/start-conversation';
import { requireUser } from '@/server/auth/authorize';
import { findMessageRecipient } from '@/server/services/engagement';

export const metadata: Metadata = { title: 'Nova conversa', robots: { index: false } };

type SearchParams = Promise<{ to?: string }>;

/**
 * Início de conversa.
 *
 * Confirma que o destinatário existe e está ativo antes de mostrar o
 * formulário. Sem isso, a pessoa escreve uma mensagem inteira e só descobre no
 * envio que o perfil foi removido.
 */
export default async function NewConversationPage({ searchParams }: { searchParams: SearchParams }) {
  await requireUser();
  const { to } = await searchParams;

  if (!to) notFound();

  const recipient = await findMessageRecipient(to);

  if (!recipient) notFound();

  return (
    <div className="mx-auto max-w-[600px] px-5 py-12 lg:px-10 lg:py-16">
      <h1 className="text-[28px] font-extrabold">Falar com {recipient.name}</h1>
      {recipient.professionalProfile ? (
        <p className="mt-2 text-[15px] text-ink-body">
          {recipient.professionalProfile.headline} · costuma responder em até{' '}
          {recipient.professionalProfile.responseHours}h.
        </p>
      ) : null}

      <Card className="mt-7 p-6">
        <StartConversation recipientId={recipient.id} recipientName={recipient.name} />
      </Card>
    </div>
  );
}
