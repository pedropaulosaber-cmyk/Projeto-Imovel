import { DashboardNav } from '@/components/layout/dashboard-nav';
import { requireUser } from '@/server/auth/authorize';

/**
 * Casca do painel.
 *
 * `requireUser` aqui protege **todas** as subpáginas de uma vez: no App
 * Router, o layout renderiza antes de qualquer página filha, então uma página
 * nova nasce protegida sem ninguém precisar lembrar de adicionar a checagem.
 *
 * Isso não substitui a autorização das Server Actions — o layout protege o
 * caminho da navegação, a ação protege a escrita.
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  const items = [
    { href: '/dashboard', label: 'Visão geral' },
    { href: '/dashboard/products', label: 'Meus produtos' },
    { href: '/dashboard/orders', label: 'Pedidos' },
    { href: '/dashboard/customers', label: 'Clientes' },
    { href: '/dashboard/earnings', label: 'Receitas' },
    { href: '/dashboard/profile', label: 'Perfil' },
  ];

  if (user.roles.includes('ADMIN')) items.push({ href: '/admin', label: 'Administração' });

  return (
    <div className="mx-auto max-w-[1200px] px-5 py-10 lg:px-10 lg:py-14">
      <div className="grid gap-8 grid-cols-1 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-12">
        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <DashboardNav items={items} />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
