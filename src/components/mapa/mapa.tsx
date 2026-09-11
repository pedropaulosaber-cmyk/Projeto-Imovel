/**
 * Mapa da localização do imóvel — o embed do Google já vem carregado, com
 * alfinete no ponto.
 *
 * O embed resolve o endereço (quadra e lote do book) e crava um alfinete;
 * quando há coordenada conferida, o alfinete nasce exato. Usa `loading="lazy"`,
 * então o Google só é buscado quando o mapa entra na tela — não no topo da
 * página. Antes ele só aparecia depois de um clique (e o placeholder escuro
 * parecia quebrado); agora o cliente vê o mapa de verdade direto.
 */

const ZOOM = 17;

export function Mapa({
  rotulo,
  endereco,
  mapaUrl,
  coordenadas,
  proporcao = 'aspect-[4/3] md:aspect-video',
  claro = false,
}: {
  rotulo: string;
  endereco: string;
  mapaUrl?: string;
  coordenadas?: { lat: number; lng: number };
  proporcao?: string;
  /** Página de fundo claro (imóvel): borda e legenda em tom escuro. */
  claro?: boolean;
}) {
  /* Coordenada conferida crava o alfinete; sem ela, o Google resolve o texto. */
  const alvo = coordenadas ? `${coordenadas.lat},${coordenadas.lng}` : `${endereco}, Goiânia - GO`;
  const busca = encodeURIComponent(alvo);
  const embed = `https://www.google.com/maps?q=${busca}&z=${ZOOM}&hl=pt-BR&output=embed`;
  const externo = mapaUrl ?? `https://www.google.com/maps/search/?api=1&query=${busca}`;

  return (
    <figure className="m-0">
      <div
        className={`relative overflow-hidden rounded-[10px] border md:rounded-lg ${
          claro ? 'border-tinta/[0.12]' : 'border-creme/[0.16]'
        } ${proporcao}`}
      >
        <iframe
          src={embed}
          title={`Mapa da localização de ${rotulo}`}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="absolute inset-0 h-full w-full border-0"
        />
      </div>
      <figcaption
        className={`mt-[10px] flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] md:text-[11px] ${
          claro ? 'text-pedra' : 'text-creme/45'
        }`}
      >
        <span>
          {coordenadas ? '[ COORDENADA CONFERIDA ]' : '[ LOCALIZAÇÃO PELO ENDEREÇO DO BOOK ]'}
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
