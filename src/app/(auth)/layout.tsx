import Link from 'next/link';

import { Logo } from '@/components/layout/logo';

/**
 * Casca das telas de entrada e cadastro.
 *
 * Sem o cabeçalho e o rodapé do site: nesta tela existe exatamente uma coisa a
 * fazer, e cada link a mais é uma chance de a pessoa sair sem fazê-la. O único
 * caminho de volta é a marca, que é também a âncora de confiança de quem vai
 * digitar uma senha.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <header className="border-b border-line bg-paper">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center px-5 lg:px-10">
          <Logo />
        </div>
      </header>

      <main id="conteudo" className="flex flex-1 items-center justify-center px-5 py-12">
        <div className="w-full max-w-[440px]">{children}</div>
      </main>

      <footer className="px-5 py-6 text-center text-[12.5px] text-muted">
        Ao continuar você concorda com os{' '}
        <Link href="/terms">termos de uso</Link> e a{' '}
        <Link href="/privacy">política de privacidade</Link>.
      </footer>
    </div>
  );
}
