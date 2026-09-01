import type { Metadata } from 'next';

import { Cabecalho } from '@/components/layout/cabecalho';
import { Listagem } from '@/components/listagem/listagem';
import { lerFiltros, temFiltroAtivo } from '@/lib/filtros';
import { rotas } from '@/lib/rotas';
import { regioesEmTexto } from '@/content/regioes';

type Params = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ searchParams }: Params): Promise<Metadata> {
  const filtros = lerFiltros(await searchParams);

  return {
    title: 'Imóveis em Goiânia',
    description: `Lançamentos, imóveis na planta e remanescentes em ${regioesEmTexto()}, com registro de incorporação conferido.`,
    alternates: { canonical: rotas.imoveis },
    /*
      Cada combinação de filtro é uma variação da mesma lista. Indexar todas
      espalha o sinal por dezenas de URLs quase iguais; as páginas que devem
      ranquear são /[regiao]/[categoria].
    */
    robots: temFiltroAtivo(filtros) ? { index: false, follow: true } : undefined,
  };
}

export default async function PaginaImoveis({ searchParams }: Params) {
  const filtros = lerFiltros(await searchParams);

  return (
    <>
      <Cabecalho ativo="imoveis" />
      <Listagem
        filtros={filtros}
        basePath={rotas.imoveis}
        titulo="Imóveis em Goiânia"
        migalhas={[{ rotulo: 'HOME', href: rotas.home }, { rotulo: 'IMÓVEIS' }]}
      />
    </>
  );
}
