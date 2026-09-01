/**
 * Identidade do site em um lugar só.
 *
 * O design (Site_Modelo_4) veio com marca, CRECI, telefone e endereço
 * fictícios — está escrito no rodapé dele: "MARCA, DADOS E IMÓVEIS FICTÍCIOS
 * PARA FINS DE DESIGN". Publicar um CRECI inventado é infração à Resolução
 * COFECI 1.065/2007, então o número aqui é o real; o resto continua
 * placeholder até você trocar. Um arquivo, sem caça a string pelo JSX.
 */
export const site = {
  nome: 'VÉRTICE',
  descricao: 'Imóveis em Goiânia — lançamentos, na planta e remanescentes',

  /**
   * Resolução COFECI 1.065/2007: em toda divulgação de imóvel o número de
   * inscrição no CRECI é obrigatório, e a expressão "corretor de imóveis"
   * precisa ter ao menos 25% do tamanho do nome usado. Ver `<Creci />`.
   */
  creci: 'CRECI-GO 47958',
  responsavelTecnico: 'Pedro Paulo Saber',

  contato: {
    // TODO(marca): trocar pelos dados reais antes de publicar.
    whatsapp: '+55 62 99999-0000',
    whatsappE164: '5562999990000',
    telefoneExibicao: '(62) 99999-0000',
    endereco: 'Av. T-9, 1.500 — Setor Pedro Ludovico',
    cidade: 'Goiânia',
    estado: 'GO',
    horario: 'Seg a sex, 9h às 19h · Sáb, 9h às 14h',
  },

  /**
   * Trava de publicação. Enquanto for `true`, o site inteiro fica `noindex` e
   * o rodapé avisa que a operação ainda está sendo configurada.
   *
   * Os imóveis já são reais e com registro conferido — o que ainda impede
   * indexar é a marca e os contatos acima, que continuam sendo os do design.
   * Anúncio no Google com telefone que não atende é pior que anúncio nenhum.
   */
  conteudoDemonstracao: true,
} as const;

/** URL canônica do site, usada em metadata, sitemap e Schema.org. */
export function urlBase(): string {
  const bruta =
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : 'http://localhost:3000');

  return bruta.replace(/\/+$/, '');
}

/** Link de WhatsApp com mensagem pré-preenchida. */
export function linkWhatsApp(mensagem?: string): string {
  const texto = mensagem ?? 'Olá! Vim pelo site e quero falar sobre um imóvel.';
  return `https://wa.me/${site.contato.whatsappE164}?text=${encodeURIComponent(texto)}`;
}
