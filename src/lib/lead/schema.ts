import { z } from 'zod';

/**
 * O mesmo schema roda no formulário e no endpoint. O do servidor é o que
 * protege: o cliente pode ser desligado, editado ou substituído por um `curl`.
 */

export const ORIGENS = ['meta_ads', 'organico', 'direto'] as const;
export const INTERESSES = ['lancamento', 'na_planta', 'remanescente'] as const;

/** Aceita o que o brasileiro digita de verdade: (62) 9 9999-0000, +55 62..., 62999990000. */
const telefoneBr = z
  .string()
  .trim()
  .transform((v) => v.replace(/\D/g, ''))
  .refine((v) => v.length >= 10 && v.length <= 13, {
    message: 'Informe o WhatsApp com DDD.',
  })
  /* Normaliza para E.164 sem o "+": 55 + DDD + número. */
  .transform((v) => (v.startsWith('55') && v.length > 11 ? v : `55${v}`));

export const leadSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(3, 'Informe seu nome completo.')
    .max(120, 'Nome longo demais.')
    /* Duas palavras: "nome completo" é o que o SDR precisa para abrir a conversa. */
    .refine((v) => v.split(/\s+/).length >= 2, 'Informe nome e sobrenome.'),

  telefone: telefoneBr,

  email: z
    .union([z.email('E-mail inválido.'), z.literal('')])
    .optional()
    .transform((v) => (v ? v : undefined)),

  /** Slug do empreendimento, quando o lead vem de uma página de imóvel. */
  empreendimentoSlug: z.string().trim().max(120).optional(),

  /** Interesse declarado no formulário genérico da home. */
  interesse: z.enum(INTERESSES).optional(),

  /** Tipologia escolhida no formulário da página de imóvel. */
  tipologia: z.string().trim().max(120).optional(),

  /**
   * LGPD art. 8º: sem consentimento não há tratamento. `true` literal — um
   * checkbox desmarcado chega como `false` e o lead é recusado.
   */
  consentimentoLgpd: z.literal(true, {
    message: 'É preciso autorizar o contato para enviarmos as informações.',
  }),

  origem: z.enum(ORIGENS).default('direto'),
  utmSource: z.string().trim().max(200).optional(),
  utmCampaign: z.string().trim().max(200).optional(),
  utmContent: z.string().trim().max(200).optional(),

  /** Deduplicação de evento entre Pixel (browser) e CAPI (servidor). */
  eventId: z.uuid().optional(),
  /** Cookies do Meta, quando existem — melhoram a atribuição da CAPI. */
  fbp: z.string().trim().max(200).optional(),
  fbc: z.string().trim().max(200).optional(),

  /**
   * Honeypot. Formulário legítimo nunca preenche: o campo é invisível e sem
   * label. Bot preenche tudo que encontra.
   *
   * O schema **aceita** o campo preenchido de propósito — quem decide é a
   * rota, que responde 200 e descarta em silêncio. Rejeitar aqui devolveria
   * um 400 com mensagem de validação, que é exatamente a dica que o robô
   * precisa para descobrir o campo e parar de preenchê-lo.
   */
  website: z.string().max(200).optional(),
});

export type LeadEntrada = z.input<typeof leadSchema>;
export type Lead = z.output<typeof leadSchema>;
