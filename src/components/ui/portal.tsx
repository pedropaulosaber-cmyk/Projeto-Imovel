'use client';

import { useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';

/**
 * Move o conteúdo para o fim do `<body>`.
 *
 * Serve para as folhas do mobile, e não é preciosismo: `backdrop-filter` num
 * ancestral cria bloco de contenção para descendentes `position: fixed`. A
 * folha de filtros vivia dentro da barra pegajosa, que tem `backdrop-blur` —
 * e com isso o `inset-0` dela passou a valer contra os 124 px da barra, não
 * contra a tela. A folha aparecia espremida no topo, cortada, com a página
 * aparecendo por baixo.
 *
 * Sair para o `<body>` resolve o caso e imuniza contra o próximo: qualquer
 * `transform`, `filter` ou `contain` que alguém adicione num ancestral
 * causaria exatamente o mesmo estrago.
 */

/* `false` no servidor, `true` depois da hidratação — sem `setState` em efeito. */
const assinar = () => () => {};
const noCliente = () => true;
const noServidor = () => false;

export function Portal({ children }: { children: React.ReactNode }) {
  const montado = useSyncExternalStore(assinar, noCliente, noServidor);

  if (!montado) return null;
  return createPortal(children, document.body);
}
