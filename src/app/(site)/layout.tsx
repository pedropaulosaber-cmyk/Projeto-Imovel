import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';

/**
 * Casca das páginas públicas e de conta.
 *
 * Grupo de rota `(site)`: agrupa sem aparecer na URL. `/products` continua
 * sendo `/products`, e o cabeçalho e o rodapé são declarados uma vez só, em
 * vez de repetidos em cada página — que é como uma delas acaba sem rodapé.
 */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main id="conteudo" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
