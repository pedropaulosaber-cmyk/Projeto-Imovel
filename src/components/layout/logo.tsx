import Link from 'next/link';

import { cn } from '@/lib/cn';

/**
 * Marca.
 *
 * O símbolo do Canvas: três nós ligados por traços — dois passos de entrada
 * convergindo num de saída. É a forma abstrata de "automação" sem recorrer ao
 * robô e à engrenagem, que é onde toda marca de IA acaba parecendo igual.
 *
 * O SVG é inline, e não um arquivo: são 300 bytes que evitam uma requisição
 * extra e permitem que a cor acompanhe o contexto.
 */
export function LogoMark({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-hidden focusable="false">
      <circle cx="6" cy="7" r="3.2" fill="#2563EB" />
      <circle cx="6" cy="21" r="3.2" fill="#0B1F3A" />
      <circle cx="21" cy="14" r="3.2" fill="#2563EB" />
      <path d="M8.6 8.6 18.4 13M8.6 19.4 18.4 15" stroke="#94A3B8" strokeWidth="1.6" />
    </svg>
  );
}

export function Logo({ className, size = 26 }: { className?: string; size?: number }) {
  return (
    <Link
      href="/"
      className={cn('inline-flex items-center gap-2.5 no-underline text-ink', className)}
      aria-label="AUTOMATIZE — página inicial"
    >
      <LogoMark size={size} />
      <span className="text-[19px] font-extrabold tracking-[-0.045em]">AUTOMATIZE</span>
    </Link>
  );
}
