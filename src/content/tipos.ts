/**
 * Tipos do domínio, espelhando o schema Postgres em
 * `supabase/migrations/0001_init.sql`. Quando o Supabase entrar, a fonte de
 * dados muda; estes tipos não.
 */

export type CategoriaEmpreendimento = 'lancamento' | 'na_planta' | 'remanescente';
export type StatusPublicacao = 'rascunho' | 'publicado' | 'despublicado';
export type StatusParceria = 'pendente' | 'negociando' | 'ativa' | 'recusada';

export interface Regiao {
  slug: string;
  nome: string;
  cidade: string;
  estado: string;
}

export interface Midia {
  tipo: 'foto' | 'planta' | 'video';
  /** `null` enquanto a foto real não chega: o card cai no placeholder hachurado do design. */
  url: string | null;
  legenda: string;
}

export interface Planta {
  area: string;
  tipo: string;
  vagas: string;
}

export interface ItemFicha {
  label: string;
  valor: string;
}

export interface CorretorResponsavel {
  nome: string;
  creci: string;
  regiao: string;
  /** Id do corretor no Método CRM. `null` enquanto a parceria não fecha. */
  crmId: string | null;
}

export interface Empreendimento {
  slug: string;
  nome: string;
  categoria: CategoriaEmpreendimento;
  regiaoSlug: string;
  incorporadora: string;
  statusParceria: StatusParceria;
  corretorResponsavel: CorretorResponsavel | null;

  /**
   * Lei 4.591/64, art. 32: sem registro de incorporação averbado, não se
   * anuncia. `null` obriga `statusPublicacao: 'rascunho'` — a invariante é
   * verificada em `empreendimentos.ts` na carga do módulo.
   */
  numeroRegistroIncorporacao: string | null;
  statusPublicacao: StatusPublicacao;

  precoAPartirDe: number;
  precoExibicao: string;
  quartos: string;
  banheiros: string;
  metragem: string;
  metragemMin: number;
  metragemMax: number;
  entrega: string;
  previsaoEntrega: string | null;

  /** Uma frase, usada nos cards. */
  resumo: string;
  /** Texto próprio da página — nunca copiado do material da incorporadora. */
  descricao: string[];
  amenidades: string[];
  plantas: Planta[];
  ficha: ItemFicha[];
  midias: Midia[];

  obra: { etapa: string; percentual: number } | null;
  localizacao: { endereco: string; referencias: string };
  /** Slugs dos parques a que o empreendimento é vizinho. */
  parquesProximos: string[];
  destaqueHome: boolean;
}

export interface EtapaObraParque {
  n: string;
  titulo: string;
  texto: string;
}

export interface Parque {
  slug: string;
  nome: string;
  selo: string;
  chamadaCurta: string;
  titulo: string;
  resumoHome: string;
  resumoPagina: string;
  resumoPaginaMobile: string;
  imagem: string;
  imagemAlt: string;
  numeros: { valor: string; label: string; labelMobile: string }[];
  etapas: EtapaObraParque[];
  impacto: { titulo: string; paragrafos: string[]; linhas: { rotulo: string; valor: string }[] };
  tituloProximos: string;
  eyebrowProximos: string;
}
