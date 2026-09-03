/**
 * Identidade do site em um lugar só.
 *
 * ▶ PARA PUBLICAR NO GOOGLE, nesta ordem:
 *     1. Preencha os campos marcados com  ← PREENCHER  (marca e contato).
 *        O CRECI já é o real — não mexa nele.
 *     2. Confira os números da home e do escritório (ver o TODO em
 *        `src/content/escritorio.ts`: "dezoito anos", "+500 famílias",
 *        "R$ 1,2 bi em VGV", "11 min de resposta"). São afirmações de fato sob
 *        um CRECI real.
 *     3. Troque `conteudoDemonstracao` para `false` (última linha do objeto).
 *
 * Enquanto `conteudoDemonstracao` for `true`, o site inteiro fica FORA do
 * Google (noindex) e o rodapé avisa que a operação está sendo configurada.
 *
 * Há uma trava no fim deste arquivo: se você virar para `false` com o telefone
 * ainda no número de exemplo do design, o build falha de propósito. Anúncio no
 * Google com número que não atende queima o anúncio e o CRECI que assina
 * embaixo — melhor o build travar do que o cliente ligar no vazio.
 */
export const site = {
  // ── Marca ──────────────────────────────────────────────────────────────
  nome: 'VÉRTICE', // ← PREENCHER: nome da sua marca / imobiliária
  descricao: 'Imóveis em Goiânia — lançamentos, na planta e remanescentes',

  // ── CRECI (JÁ É O REAL — não trocar) ───────────────────────────────────
  // Resolução COFECI 1.065/2007: em toda divulgação de imóvel o número do CRECI
  // é obrigatório, e "corretor de imóveis" precisa ter ao menos 25% do tamanho
  // do nome usado. Ver `<Creci />`.
  creci: 'CRECI-GO 47958',
  responsavelTecnico: 'Pedro Paulo Saber',

  // ── Contato ────────────────────────────────────────────────────────────
  // Os três primeiros campos são o MESMO número, em três formatos. Preencha os
  // três com o seu número real:
  //   whatsappE164     → só dígitos, começando com 55 (país).  Ex.: 5562988887777
  //   whatsapp         → o mesmo número, com +55.               Ex.: +55 62 98888-7777
  //   telefoneExibicao → o mesmo número, como o cliente lê.     Ex.: (62) 98888-7777
  contato: {
    whatsappE164: '5562999990000', // ← PREENCHER: número real, só dígitos, com 55
    whatsapp: '+55 62 99999-0000', // ← PREENCHER: o mesmo número, com +55
    telefoneExibicao: '(62) 99999-0000', // ← PREENCHER: o mesmo número, formatado
    endereco: 'Av. T-9, 1.500 — Setor Pedro Ludovico', // ← PREENCHER: endereço do atendimento
    cidade: 'Goiânia', // ← confira
    estado: 'GO', // ← confira
    horario: 'Seg a sex, 9h às 19h · Sáb, 9h às 14h', // ← confira o horário de atendimento
  },

  // ── Trava de publicação ────────────────────────────────────────────────
  //   true  = site em modo demonstração, fora do Google (noindex).
  //   false = site liberado para o Google. SÓ vire para false depois de
  //           preencher tudo acima.
  conteudoDemonstracao: true, // ← trocar para false quando for publicar
} as const;

/*
 * Trava de segurança: o site não pode ir ao ar com o telefone de exemplo do
 * design. Roda quando o módulo carrega — ou seja, no build. Se disparar, a
 * mensagem diz exatamente o que falta.
 */
const TELEFONE_EXEMPLO_DO_DESIGN = '5562999990000';
const emDemonstracao: boolean = site.conteudoDemonstracao;

if (!emDemonstracao && site.contato.whatsappE164 === TELEFONE_EXEMPLO_DO_DESIGN) {
  throw new Error(
    'src/config/site.ts: conteudoDemonstracao está false (site liberado para o Google), mas o ' +
      'telefone ainda é o número de exemplo do design. Preencha contato.whatsappE164, ' +
      'contato.whatsapp e contato.telefoneExibicao com o número real antes de publicar.',
  );
}

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
