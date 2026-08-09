import Link from 'next/link';

import { LogoMark } from './logo';

/**
 * Rodapé.
 *
 * Além dos links, carrega o que a legislação brasileira espera de um
 * marketplace: termos, política de privacidade e o canal do encarregado de
 * dados (LGPD art. 41). Não é enfeite jurídico — é onde o usuário procura
 * quando quer exercer um direito, e esconder isso gera reclamação formal.
 */

const COLUMNS = [
  {
    title: 'Marketplace',
    links: [
      { href: '/products', label: 'Produtos' },
      { href: '/professionals', label: 'Profissionais' },
      { href: '/demands', label: 'Demandas abertas' },
      { href: '/demands/new', label: 'Publicar uma demanda' },
    ],
  },
  {
    title: 'Para criadores',
    links: [
      { href: '/sell', label: 'Vender na AUTOMATIZE' },
      { href: '/dashboard/products/new', label: 'Publicar um produto' },
      { href: '/dashboard/earnings', label: 'Receitas e repasses' },
    ],
  },
  {
    title: 'Plataforma',
    links: [
      { href: '/terms', label: 'Termos de uso' },
      { href: '/privacy', label: 'Privacidade e LGPD' },
      { href: '/support', label: 'Suporte' },
    ],
  },
] as const;

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line bg-canvas">
      <div className="mx-auto grid max-w-[1200px] gap-10 px-5 py-14 sm:grid-cols-2 lg:grid-cols-4 lg:px-10">
        <div>
          <span className="flex items-center gap-2.5">
            <LogoMark size={24} />
            <span className="text-[17px] font-extrabold tracking-[-0.045em]">AUTOMATIZE</span>
          </span>
          <p className="mt-3 max-w-[34ch] text-[13.5px] leading-relaxed text-muted">
            O marketplace de soluções de IA. Compre automações prontas ou contrate quem constrói a
            sua.
          </p>
        </div>

        {COLUMNS.map((column) => (
          <div key={column.title}>
            <h2 className="text-[12.5px] font-bold uppercase tracking-[0.14em] text-ink">
              {column.title}
            </h2>
            <ul className="mt-3.5 flex list-none flex-col gap-2.5 p-0">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[14px] text-ink-body no-underline hover:text-brand-strong"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-line">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-2 px-5 py-6 text-[12.5px] text-muted sm:flex-row sm:items-center sm:justify-between lg:px-10">
          <p>© {new Date().getFullYear()} AUTOMATIZE. Todos os direitos reservados.</p>
          <p>
            Encarregado de dados:{' '}
            <a href="mailto:privacidade@automatize.com.br" className="text-brand-strong">
              privacidade@automatize.com.br
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
