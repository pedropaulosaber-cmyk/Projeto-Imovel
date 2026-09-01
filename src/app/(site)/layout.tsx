import { BarraInferior } from '@/components/layout/barra-inferior';
import { Rodape } from '@/components/layout/rodape';

/**
 * Casca das páginas públicas. O `padding-bottom` no mobile abre espaço para a
 * barra fixa de ação — sem ele o último bloco de cada página fica embaixo dela.
 */
export default function LayoutSite({ children }: { children: React.ReactNode }) {
  return (
    <div className="pb-[84px] md:pb-0">
      {children}
      <Rodape />
      <BarraInferior />
    </div>
  );
}
