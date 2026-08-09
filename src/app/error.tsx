'use client';

import { useEffect } from 'react';

import { Button, LinkButton } from '@/components/ui/button';

/**
 * Fronteira de erro global.
 *
 * Mostra uma frase honesta e um caminho de volta — nunca a mensagem do erro,
 * que pode conter nome de tabela, trecho de query ou caminho de arquivo.
 *
 * O `digest` **é** mostrado: é um identificador opaco que o Next gera e grava
 * no log do servidor. Com ele, o usuário consegue dizer ao suporte qual erro
 * viu, e o time consegue achar a linha exata sem pedir "descreve o que
 * aconteceu".
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Em produção isto vai para o coletor de erros (Sentry e similares); o
    // `console.error` é o piso, para que nada suma em silêncio.
    console.error('Erro não tratado na interface:', error.digest ?? error.message);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-5 text-center">
      <p className="text-[13px] font-bold uppercase tracking-[0.16em] text-brand">Erro inesperado</p>
      <h1 className="max-w-[20ch] text-[32px] font-extrabold leading-tight">
        Algo quebrou do nosso lado.
      </h1>
      <p className="max-w-[48ch] text-[15.5px] leading-relaxed text-ink-body">
        Já registramos o que aconteceu. Você pode tentar de novo — em boa parte dos casos, funciona.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button onClick={reset}>Tentar de novo</Button>
        <LinkButton href="/" variant="secondary">Voltar ao início</LinkButton>
      </div>
      {error.digest ? (
        <p className="text-[12.5px] text-muted">
          Código para o suporte: <code className="font-mono">{error.digest}</code>
        </p>
      ) : null}
    </div>
  );
}
