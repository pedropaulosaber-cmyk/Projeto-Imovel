'use client';

import { useState } from 'react';

/**
 * Lista de diferenciais do empreendimento.
 *
 * O book traz de 7 a 36 itens, e os últimos são miudeza de memorial —
 * torneira com fechamento automático, ralo linear na varanda, porcelanato
 * 84x84. Tudo isso importa na hora de fechar negócio e nada disso deveria ser
 * a primeira coisa que o visitante lê: a parede de pílulas empurrava a planta
 * e o mapa para baixo da dobra.
 *
 * O corte é por tamanho de texto, não por quantidade. Quem tem item curto
 * ("Piscina infantil", "Pet place") mostra uns quinze; quem tem item longo,
 * uns cinco — o bloco fica com a mesma altura nos dois casos. O resto continua
 * no HTML, só escondido, então o Google lê a lista inteira e o clique não
 * dispara requisição nenhuma.
 */

/* Caracteres visíveis antes do corte, e o mínimo de itens que sempre aparece. */
const ORCAMENTO = 380;
const MINIMO = 5;

function corte(itens: string[]) {
  let soma = 0;
  for (const [i, item] of itens.entries()) {
    soma += item.length;
    if (i + 1 >= MINIMO && soma > ORCAMENTO) return i + 1;
  }
  return itens.length;
}

export function Diferenciais({ itens }: { itens: string[] }) {
  const [tudo, setTudo] = useState(false);
  const visiveis = corte(itens);
  const escondidos = itens.length - visiveis;

  return (
    <>
      <ul className="flex list-none flex-wrap gap-2 p-0 md:gap-[9px]">
        {itens.map((a, i) => (
          <li
            key={a}
            hidden={!tudo && i >= visiveis}
            className="rounded-full border border-tinta/[0.22] px-[15px] py-[10px] text-[13px] md:px-[18px] md:py-[11px] md:text-sm"
          >
            {a}
          </li>
        ))}
      </ul>

      {escondidos > 0 ? (
        <button
          type="button"
          onClick={() => setTudo((v) => !v)}
          aria-expanded={tudo}
          className="mt-[14px] cursor-pointer rounded-full border border-ouro/60 px-[18px] py-[10px] font-mono text-[10px] tracking-[0.1em] text-ouro transition-colors hover:border-ouro md:mt-4 md:text-[11px]"
        >
          {tudo ? 'MOSTRAR MENOS' : `+ ${escondidos} DIFERENCIAIS`}
        </button>
      ) : null}
    </>
  );
}
