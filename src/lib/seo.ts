import { urlBase } from '@/config/site';
import { precoExibicao } from '@/content/empreendimentos';
import { nomeDaRegiao, regiaoPorSlug, regioes, rotuloDaCategoria } from '@/content/regioes';
import type { Empreendimento } from '@/content/tipos';

/**
 * Derivados de SEO reunidos num lugar só.
 *
 * O que o Google efetivamente ranqueia — `<title>`, `<h1>`, a descrição e o
 * texto da página — já nasce rico de nome, região e tipologia no catálogo.
 * Aqui ficam os derivados que reaproveitamos em `<meta>`, Open Graph, Twitter e
 * JSON-LD, para que "nome + localização + tipologia" apareça igual em toda
 * parte, sem repetir a mesma montagem de string em cada página.
 *
 * `keywords` pesa pouco ou nada no Google (o Bing ainda lê). Entra curto e
 * verdadeiro — palavra-chave empilhada é sinal de spam, e quem assina embaixo é
 * um CRECI real. O trabalho de palavra-chave que conta está no título, no H1,
 * na descrição e no corpo da página; isto aqui é só o reforço.
 */

const cidadeDoImovel = (e: Empreendimento): string =>
  regiaoPorSlug(e.regiaoSlug)?.cidade ?? 'Goiânia';

/** Descrição de resultado de busca: os fatos de maior valor vêm primeiro. */
export function descricaoDoImovel(e: Empreendimento): string {
  const rotulo = rotuloDaCategoria(e.categoria).toLowerCase();
  const preco = e.precoAPartirDe ? ` A partir de ${precoExibicao(e)}.` : '';
  const registro = e.numeroRegistroIncorporacao ? ' Registro de incorporação conferido.' : '';
  return `${e.nome}: apartamentos de ${e.quartos}, ${e.metragem}, ${rotulo} no ${nomeDaRegiao(
    e.regiaoSlug,
  )}, ${cidadeDoImovel(e)}.${preco}${registro}`;
}

/** Termos de busca do imóvel — curtos, específicos e verdadeiros. */
export function palavrasChaveDoImovel(e: Empreendimento): string[] {
  const regiao = nomeDaRegiao(e.regiaoSlug);
  const cidade = cidadeDoImovel(e);
  const rotulo = rotuloDaCategoria(e.categoria).toLowerCase();
  return semRepetir([
    e.nome,
    `${e.nome} ${cidade}`,
    `apartamento à venda ${regiao}`,
    `apartamento ${rotulo} ${regiao}`,
    `${rotulo} ${cidade}`,
    `imóveis ${regiao} ${cidade}`,
    e.incorporadora,
  ]);
}

/** Termos amplos da marca — home, listagem geral e raiz. */
export function palavrasChaveBase(): string[] {
  const porRegiao = regioes.flatMap((r) => [`imóveis ${r.nome}`, `apartamento à venda ${r.nome}`]);
  return semRepetir([
    'imóveis em Goiânia',
    'apartamentos à venda em Goiânia',
    'lançamentos em Goiânia',
    'apartamentos na planta em Goiânia',
    'apartamentos remanescentes em Goiânia',
    ...porRegiao,
  ]);
}

/**
 * Primeira foto do imóvel, para Open Graph/Twitter. Devolve o caminho relativo:
 * o Next resolve para URL absoluta contra o `metadataBase`.
 */
export function imagemSocialDoImovel(e: Empreendimento): string | undefined {
  return e.midias.find((m) => m.tipo === 'foto' && m.url)?.url ?? undefined;
}

/** Até `n` fotos do imóvel em URL absoluta, para o campo `image` do Schema.org. */
export function imagensAbsolutasDoImovel(e: Empreendimento, n = 6): string[] {
  return e.midias
    .filter((m) => m.tipo === 'foto' && m.url)
    .slice(0, n)
    .map((m) => `${urlBase()}${m.url}`);
}

/** `BreadcrumbList` do Schema.org a partir de pares nome × caminho. */
export function trilhaJsonLd(itens: { nome: string; caminho: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: itens.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.nome,
      item: `${urlBase()}${it.caminho}`,
    })),
  };
}

function semRepetir(xs: string[]): string[] {
  return [...new Set(xs.filter(Boolean))];
}
