'use client';

import { useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { requestDownloadAction } from '@/server/actions/commerce';

/**
 * Botão de download.
 *
 * ## Por que não é um `<a href>` direto
 *
 * A URL assinada tem vida curta e precisa ser gerada **no momento do clique**,
 * depois de o servidor conferir a compra. Renderizá-la no HTML significaria
 * assiná-la para todo mundo que abre a página, deixá-la no cache do navegador
 * e no histórico, e expirá-la antes de a pessoa clicar.
 *
 * Aqui a URL nasce no clique, vive segundos no navegador e nunca é gravada.
 */
export function DownloadButton({ fileId }: { fileId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <span className="flex flex-col items-end gap-1">
      <Button
        size="sm"
        variant="secondary"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const result = await requestDownloadAction(fileId);

            if (!result.ok) {
              setError(result.message);
              return;
            }

            // Navegação direta em vez de `window.open`: bloqueador de pop-up
            // barra a segunda, e o `Content-Disposition: attachment` do objeto
            // faz o navegador baixar sem sair da página.
            window.location.href = result.data.url;
          })
        }
      >
        {pending ? 'Preparando…' : 'Baixar'}
      </Button>
      {error ? <span role="alert" className="text-[11.5px] text-danger">{error}</span> : null}
    </span>
  );
}
