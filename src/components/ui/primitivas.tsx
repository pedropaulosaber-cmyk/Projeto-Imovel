import Image from 'next/image';

import { site } from '@/config/site';

/** O rótulo mono em maiúsculas que abre cada seção: "01 — DISPONÍVEIS AGORA". */
export function Eyebrow({
  children,
  tom = 'ouro',
  className = '',
}: {
  children: React.ReactNode;
  tom?: 'ouro' | 'claro' | 'escuro';
  className?: string;
}) {
  const cor = tom === 'ouro' ? 'text-ouro' : tom === 'escuro' ? 'text-areia' : 'text-creme/50';

  return (
    <p className={`font-mono text-[10px] tracking-[0.16em] sm:text-[11px] ${cor} ${className}`}>
      {children}
    </p>
  );
}

/**
 * Placeholder hachurado do design, usado enquanto a foto real do
 * empreendimento não existe. Quando `url` chega, vira a foto — mesmo box,
 * mesma proporção, sem salto de layout.
 */
export function Foto({
  url,
  alt,
  legenda,
  className = '',
  sizes = '(max-width: 768px) 100vw, 33vw',
  prioridade = false,
  claro = false,
}: {
  url: string | null;
  alt: string;
  legenda?: string;
  className?: string;
  sizes?: string;
  prioridade?: boolean;
  claro?: boolean;
}) {
  if (url) {
    return (
      <Image
        src={url}
        alt={alt}
        fill
        sizes={sizes}
        priority={prioridade}
        className={`object-cover ${className}`}
      />
    );
  }

  return (
    <div
      className={`absolute inset-0 grid place-items-center p-3 text-center ${
        claro ? 'hachura-clara' : 'hachura'
      } ${className}`}
      role="img"
      aria-label={alt}
    >
      {legenda ? (
        <span
          className={`font-mono text-[9px] sm:text-[10px] ${claro ? 'text-areia' : 'text-creme/45'}`}
        >
          {legenda}
        </span>
      ) : null}
    </div>
  );
}

/**
 * Resolução COFECI 1.065/2007, art. 2º: toda divulgação de imóvel exibe o
 * número de inscrição no CRECI, e a expressão "corretor de imóveis" tem de
 * ocupar no mínimo 25% do tamanho do nome usado na peça. O nome do escritório
 * é renderizado em `text-[17px]`, então 25% disso é ~4,25px — os 11px abaixo
 * folgam bem acima do mínimo.
 */
export function Creci({ className = '' }: { className?: string }) {
  return (
    <span className={`font-mono text-[11px] tracking-[0.1em] ${className}`}>
      Corretor de imóveis · {site.creci}
    </span>
  );
}

/** Divisor de 1px que o design usa entre linhas de lista. */
export function Filete({ escuro = false }: { escuro?: boolean }) {
  return <div className={escuro ? 'filete-topo-escuro' : 'filete-topo'} aria-hidden />;
}
