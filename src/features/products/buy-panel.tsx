'use client';

import Link from 'next/link';
import { useActionState } from 'react';

import { Button, LinkButton } from '@/components/ui/button';
import { SubmitButton } from '@/components/ui/form';
import { Card, Notice } from '@/components/ui/primitives';
import { startCheckoutAction, toggleFavoriteAction } from '@/server/actions/commerce';
import { useState, useTransition } from 'react';

/**
 * Painel de compra.
 *
 * ## O que muda conforme quem olha
 *
 * Quatro estados, e cada um tem um próximo passo diferente:
 *
 *  · **Visitante** — precisa criar conta, e o `next` traz de volta para cá.
 *  · **Comprador** — botão de compra.
 *  · **Já comprou** — vai para a biblioteca, não compra de novo.
 *  · **Autor** — edita, não compra.
 *
 * Mostrar "Comprar agora" para quem já comprou é o tipo de detalhe que faz o
 * produto parecer que não sabe quem é o usuário.
 *
 * O preço vem formatado do servidor: o cliente **exibe**, nunca calcula.
 */

type Props = {
  productId: string;
  priceLabel: string;
  owned: boolean;
  isOwner: boolean;
  signedIn: boolean;
  publishedAt: string | null;
  slug: string;
};

export function BuyPanel({
  productId,
  priceLabel,
  owned,
  isOwner,
  signedIn,
  publishedAt,
  slug,
}: Props) {
  const [state, formAction] = useActionState(startCheckoutAction, null);
  const [favorited, setFavorited] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <Card className="p-6">
      <p className="text-[32px] font-extrabold leading-none tracking-tight">{priceLabel}</p>
      <p className="mt-1.5 text-[13px] text-muted">
        Pagamento único · acesso vitalício e atualizações incluídas
      </p>

      <div className="mt-5 flex flex-col gap-2.5">
        {isOwner ? (
          <LinkButton href="/dashboard/products" fullWidth size="lg">
            Gerenciar produto
          </LinkButton>
        ) : owned ? (
          <LinkButton href="/library" fullWidth size="lg">
            Abrir na biblioteca
          </LinkButton>
        ) : signedIn ? (
          <form action={formAction}>
            <input type="hidden" name="productId" value={productId} />
            <SubmitButton fullWidth size="lg" pendingLabel="Abrindo checkout…">
              Comprar agora
            </SubmitButton>
          </form>
        ) : (
          <LinkButton href={`/register?next=/products/${slug}`} fullWidth size="lg">
            Criar conta para comprar
          </LinkButton>
        )}

        {!isOwner ? (
          <Button
            variant="secondary"
            fullWidth
            disabled={pending || !signedIn}
            aria-pressed={favorited}
            onClick={() => {
              if (!signedIn) return;
              startTransition(async () => {
                const result = await toggleFavoriteAction(productId);
                if (result.ok) setFavorited(result.data.favorited);
              });
            }}
          >
            <svg
              width="17" height="17" viewBox="0 0 24 24"
              fill={favorited ? 'currentColor' : 'none'}
              stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" aria-hidden
            >
              <path d="M6 4h12v17l-6-4.2L6 21z" />
            </svg>
            {favorited ? 'Salvo' : 'Salvar'}
          </Button>
        ) : null}
      </div>

      {state && !state.ok ? (
        <div className="mt-4">
          <Notice>{state.message}</Notice>
        </div>
      ) : null}

      {!signedIn ? (
        <p className="mt-4 text-center text-[13px] text-muted">
          Já tem conta? <Link href={`/login?next=/products/${slug}`}>Entrar</Link>
        </p>
      ) : null}

      {publishedAt ? (
        <p className="mt-5 border-t border-line pt-4 text-[12.5px] text-muted">
          Publicado em {publishedAt}
        </p>
      ) : null}
    </Card>
  );
}
