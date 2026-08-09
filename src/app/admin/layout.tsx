import Link from 'next/link';

import { Logo } from '@/components/layout/logo';
import { requireAdmin } from '@/server/auth/authorize';

/**
 * Casca do painel administrativo.
 *
 * `requireAdmin` no layout protege todas as subpáginas de uma vez. É a mesma
 * lógica do painel do criador, com uma diferença de peso: aqui um furo dá
 * acesso a dado de todos os usuários da plataforma, então a checagem é de
 * papel **e** de status ativo (ver `requireRole`).
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-line bg-brand-deep">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-6 px-5 lg:px-10">
          <span className="[&_span]:text-white"><Logo /></span>
          <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11.5px] font-bold uppercase tracking-[0.12em] text-white">
            Administração
          </span>
          <nav aria-label="Administração" className="ml-auto flex gap-5">
            <Link href="/admin" className="text-[14px] font-medium text-white/80 no-underline hover:text-white">Moderação</Link>
            <Link href="/admin/users" className="text-[14px] font-medium text-white/80 no-underline hover:text-white">Usuários</Link>
            <Link href="/dashboard" className="text-[14px] font-medium text-white/80 no-underline hover:text-white">Sair da administração</Link>
          </nav>
        </div>
      </header>
      <main id="conteudo" className="flex-1 bg-canvas">{children}</main>
    </div>
  );
}
