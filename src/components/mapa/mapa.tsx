'use client';

import { useState } from 'react';

/**
 * Mapa navegável da localização do imóvel.
 *
 * Duas decisões que valem explicação:
 *
 * 1. **Só carrega depois do clique.** O embed do Google é um terceiro que
 *    grava cookie assim que aparece na página. Carregar por padrão em todas as
 *    páginas de imóvel colocaria um rastreador de terceiro no site inteiro sem
 *    o visitante pedir — problema de LGPD antes de ser problema de
 *    performance. Enquanto ninguém clica, o que se vê é o mapa estilizado do
 *    design, que já entrega o endereço e o alfinete.
 *
 * 2. **O embed é por endereço, não por coordenada.** Não temos latitude e
 *    longitude conferidas dos 20 empreendimentos, e chutar coordenada em site
 *    de imóvel é mandar cliente para a esquina errada. O Google resolve o
 *    endereço — que veio do book, com quadra e lote — e o rodapé avisa que a
 *    marcação é aproximada.
 */

const ZOOM = 17;

export function Mapa({
  rotulo,
  endereco,
  mapaUrl,
  proporcao = 'aspect-[4/3] md:aspect-video',
}: {
  rotulo: string;
  endereco: string;
  mapaUrl?: string;
  proporcao?: string;
}) {
  const [aberto, setAberto] = useState(false);
  const busca = encodeURIComponent(`${endereco}, Goiânia - GO`);
  const embed = `https://www.google.com/maps?q=${busca}&z=${ZOOM}&hl=pt-BR&output=embed`;
  /* Com alfinete conferido, o botão leva a ele; sem, cai na busca por endereço. */
  const externo = mapaUrl ?? `https://www.google.com/maps/search/?api=1&query=${busca}`;

  if (aberto) {
    return (
      <figure className="m-0">
        <div
          className={`relative overflow-hidden rounded-[10px] border border-creme/[0.16] md:rounded-lg ${proporcao}`}
        >
          <iframe
            src={embed}
            title={`Mapa da localização de ${rotulo}`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="absolute inset-0 h-full w-full border-0"
          />
        </div>
        <figcaption className="mt-[10px] flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] text-creme/45 md:text-[11px]">
          <span>
            {mapaUrl
              ? '[ ALFINETE CONFERIDO PELO CORRETOR ]'
              : '[ MARCAÇÃO APROXIMADA PELO ENDEREÇO ]'}
          </span>
          <a
            href={externo}
            target="_blank"
            rel="noopener noreferrer"
            className="text-ouro underline underline-offset-2"
          >
            ABRIR NO GOOGLE MAPS
          </a>
        </figcaption>
      </figure>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-[10px] border border-creme/[0.16] bg-[#171714] bg-[linear-gradient(rgba(246,243,236,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(246,243,236,0.06)_1px,transparent_1px)] bg-[length:44px_44px] md:rounded-lg md:bg-[length:48px_48px] ${proporcao}`}
    >
      <div className="absolute inset-x-0 top-[44%] h-[14px] bg-white/[0.07] md:top-[43%] md:h-4" />
      <div className="absolute inset-y-0 left-[58%] hidden w-[14px] bg-white/[0.07] md:block" />
      <div className="absolute top-[42%] left-1/2 flex -translate-x-1/2 -translate-y-full flex-col items-center gap-[6px] md:top-[41%]">
        <span className="rounded-full bg-ouro px-3 py-[7px] text-[11px] font-semibold whitespace-nowrap text-tinta md:px-[14px] md:py-2 md:text-xs">
          {rotulo}
        </span>
        <span className="h-[10px] w-[10px] rounded-full bg-ouro md:h-[11px] md:w-[11px]" />
      </div>

      <button
        type="button"
        onClick={() => setAberto(true)}
        className="absolute inset-0 flex cursor-pointer items-end justify-center bg-transparent pb-5 transition-colors hover:bg-preto/25 md:pb-6"
      >
        <span className="rounded-full border border-creme/25 bg-preto/70 px-[18px] py-[10px] text-[12px] font-medium text-creme backdrop-blur-sm md:text-[13px]">
          Abrir mapa e ver o entorno
        </span>
      </button>

      <span className="pointer-events-none absolute bottom-[10px] left-3 font-mono text-[9px] text-creme/40 md:bottom-3 md:left-[14px] md:text-[10px]">
        [ GOOGLE MAPS — CARREGA AO CLICAR ]
      </span>
    </div>
  );
}
