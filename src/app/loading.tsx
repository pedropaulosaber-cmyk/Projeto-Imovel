/**
 * Estado de carregamento raiz.
 *
 * Um esqueleto com a forma aproximada do conteúdo, não um spinner centralizado:
 * a silhueta certa faz a espera parecer mais curta e evita o salto de layout
 * quando o conteúdo chega.
 */
export default function Loading() {
  return (
    <div className="mx-auto max-w-[1200px] px-5 py-14 lg:px-10">
      <div className="shimmer h-5 w-40 rounded" />
      <div className="shimmer mt-5 h-14 w-full max-w-[640px] rounded" />
      <div className="shimmer mt-3 h-5 w-full max-w-[460px] rounded" />
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index} className="rounded-[var(--radius-card)] border border-line p-[18px]">
            <div className="shimmer h-36 w-full rounded-[var(--radius-thumb)]" />
            <div className="shimmer mt-3 h-4 w-24 rounded" />
            <div className="shimmer mt-2 h-5 w-full rounded" />
          </div>
        ))}
      </div>
      <span className="sr-only" role="status">Carregando…</span>
    </div>
  );
}
