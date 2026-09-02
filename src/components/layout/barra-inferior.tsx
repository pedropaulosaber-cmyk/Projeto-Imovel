'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { rotas } from '@/lib/rotas';
import { linkWhatsAppDoCaminho } from '@/lib/whatsapp';

/**
 * Barra de ação fixa do mobile. No design ela vive fora das telas, em todas
 * elas — é o par "ver estoque / falar agora" sempre ao alcance do polegar.
 *
 * No celular este é o botão de WhatsApp mais apertado do site, e ele vive no
 * layout — que no App Router não recebe os parâmetros da rota filha. Daí ler o
 * caminho: numa página de imóvel a mensagem já sai com o nome do imóvel.
 *
 * O `padding-bottom` respeita a safe area do iOS: sem isso o botão fica
 * embaixo da barra de gestos do iPhone.
 */
export function BarraInferior() {
  const caminho = usePathname();

  return (
    <div className="fixed inset-x-0 bottom-0 z-[80] flex gap-[10px] bg-[rgba(14,14,12,0.94)] px-[18px] pt-3 pb-[max(16px,env(safe-area-inset-bottom))] shadow-[0_-1px_0_rgba(246,243,236,0.16)] backdrop-blur-[14px] md:hidden">
      <Link
        href={rotas.imoveis}
        className="min-h-[50px] flex-1 rounded-lg border border-creme/[0.24] p-[15px] text-center text-sm font-medium"
      >
        Ver imóveis
      </Link>
      <a
        href={linkWhatsAppDoCaminho(caminho)}
        target="_blank"
        rel="noopener noreferrer"
        className="min-h-[50px] flex-1 rounded-lg bg-ouro p-[15px] text-center text-sm font-semibold text-tinta"
      >
        WhatsApp
      </a>
    </div>
  );
}
