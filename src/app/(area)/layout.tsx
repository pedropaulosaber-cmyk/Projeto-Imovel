import { Cabecalho } from '@/components/layout/cabecalho';

/**
 * Área do corretor. Sem rodapé nem barra de ação: o design trata login e
 * painel como telas fechadas, não como páginas do site público.
 *
 * O cabeçalho aqui é só o mobile — no desktop, o login é tela cheia e o painel
 * tem barra própria, como nos artboards.
 */
export default function LayoutArea({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Cabecalho semBarraDesktop />
      {children}
    </>
  );
}
