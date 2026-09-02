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
  /** Rótulo curto da tira de miniaturas. */
  legenda: string;
  /**
   * Texto alternativo descrevendo a cena. Vale mais que o nome do
   * empreendimento repetido: é o que o leitor de tela lê e o que o Google usa
   * para entender a foto.
   */
  alt?: string;
}

export interface Planta {
  area: string;
  tipo: string;
  vagas: string;
  /**
   * Planta humanizada correspondente, dentro de `midias`.
   *
   * `null` quando o book não traz o desenho daquela tipologia — acontece com
   * penthouse e garden que aparecem só no quadro de áreas. O campo é
   * obrigatório de propósito: casar a linha errada com o desenho errado num
   * anúncio de imóvel é erro caro, então ou existe um pareamento conferido na
   * página do book, ou está escrito que não existe.
   */
  imagem: string | null;
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

export interface Book {
  /** Caminho dentro do bucket privado `books` no Supabase Storage. */
  arquivo: string;
  paginas: number;
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
  /**
   * Obrigatório quando o imóvel é publicado sem `numeroRegistroIncorporacao`.
   *
   * Diz, na página e no card, por que o número não está lá: o material não
   * traz, o registro é provisório, o empreendimento está em aprovação. É o que
   * separa "ainda não localizamos o número" de "não existe registro" — e a
   * invariante do catálogo recusa publicar sem registro e sem este aviso, para
   * que a omissão nunca seja silenciosa.
   */
  avisoRegistro: string | null;
  statusPublicacao: StatusPublicacao;

  /**
   * `null` enquanto a tabela não chega da incorporadora. Preço é o dado que
   * mais gera atrito quando está errado — melhor "Sob consulta" do que um
   * número desatualizado num anúncio.
   */
  precoAPartirDe: number | null;
  quartos: string;
  /** `null` quando o material da incorporadora não informa. */
  banheiros: string | null;
  metragem: string;
  /**
   * `null` quando o book não publica área privativa — acontece em material de
   * lançamento que ainda vai receber o quadro de áreas. O card mostra
   * "Sob consulta" e o imóvel sai da ordenação por metragem, em vez de entrar
   * com um número chutado.
   */
  metragemMin: number | null;
  metragemMax: number | null;
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
  /**
   * Book de vendas em PDF. Só é entregue depois de um lead válido — ver
   * `src/lib/lead/book.ts`. `null` quando a incorporadora não forneceu.
   */
  book: Book | null;
  localizacao: {
    endereco: string;
    referencias: string;
    /**
     * Link curto do Google Maps com o alfinete cravado pelo corretor.
     *
     * O embed da página resolve o endereço em texto, e o Google acerta o
     * quarteirão mas nem sempre o lote. Este link é a marcação conferida a mão
     * — é para onde vai o botão "abrir no Google Maps", que é como o cliente
     * traça a rota de verdade.
     */
    mapaUrl?: string;
    /**
     * Latitude e longitude conferidas. Quando existem, o mapa da página nasce
     * com o alfinete exatamente no lote, em vez de deixar o Google adivinhar
     * pelo texto do endereço — que acerta o quarteirão e erra o lote.
     */
    coordenadas?: { lat: number; lng: number };
  };
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
