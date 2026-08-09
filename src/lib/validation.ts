import { z } from 'zod';

/**
 * Schemas de validação
 * ====================
 *
 * Isomórfico de propósito: o mesmo schema valida no formulário (feedback
 * imediato) e no servidor (a validação que de fato protege). Duas cópias
 * divergiriam, e a que divergiria para o lado permissivo seria a do servidor —
 * porque a do cliente é a que alguém testa manualmente.
 *
 * **Nada aqui substitui a validação de servidor.** O cliente pode não executar
 * JavaScript nenhum e mandar o POST direto. Todo `parse` que importa acontece
 * dentro de uma Server Action.
 */

/** Texto obrigatório com limite. O teto evita corpo de requisição gigante. */
const text = (min: number, max: number, label: string) =>
  z
    .string()
    .trim()
    .min(min, `${label} precisa de ao menos ${min} caracteres.`)
    .max(max, `${label} passa de ${max} caracteres.`);

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, 'Informe o e-mail.')
  .max(254, 'E-mail longo demais.')
  .email('Esse e-mail não parece válido.');

/**
 * Senha.
 *
 * Comprimento mínimo de 10 e nenhuma exigência de "um símbolo e um número".
 * A regra de composição é folclore: ela empurra o usuário para `Senha@123`,
 * que está em qualquer dicionário de ataque, enquanto rejeita uma frase longa
 * e forte. O NIST 800-63B recomenda exatamente isto desde 2017 — comprimento,
 * e bloqueio das senhas mais comuns.
 */
export const passwordSchema = z
  .string()
  .min(10, 'Use pelo menos 10 caracteres — uma frase funciona bem.')
  .max(200, 'Senha longa demais.')
  .refine(
    (value) => !COMMON_PASSWORDS.has(value.toLowerCase()),
    'Essa senha aparece em vazamentos conhecidos. Escolha outra.',
  );

/**
 * Amostra das senhas mais usadas.
 *
 * Em produção isto vira uma checagem contra a API k-anonymity do Have I Been
 * Pwned (envia 5 caracteres do hash, nunca a senha). A lista curta aqui cobre
 * o caso mais frequente sem depender de rede no cadastro.
 */
const COMMON_PASSWORDS = new Set([
  'senha123456',
  '1234567890',
  'password123',
  'qwertyuiop',
  '123456789',
  'automatize',
  'senhasenha',
  'abcd123456',
]);

/** Slug de URL. Restrito porque vira parte de rota pública. */
export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, 'Slug curto demais.')
  .max(80, 'Slug longo demais.')
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use apenas letras minúsculas, números e hífen.');

/**
 * Preço em centavos.
 *
 * `int` fecha a porta para `19.999999` chegar como preço. O teto de R$ 100 mil
 * não é limitação de produto: é o valor acima do qual uma venda deveria passar
 * por conversa, e um campo sem teto é um convite a erro de digitação de dois
 * zeros.
 */
export const priceCentsSchema = z
  .number()
  .int('O preço precisa ser um valor inteiro em centavos.')
  .min(0, 'O preço não pode ser negativo.')
  .max(10_000_000, 'Para valores acima de R$ 100.000, fale com a equipe.');

export const cuidSchema = z.string().min(20).max(40).regex(/^[a-z0-9]+$/, 'Identificador inválido.');

// ---------------------------------------------------------------------------
// Autenticação
// ---------------------------------------------------------------------------

export const registerSchema = z.object({
  name: text(2, 80, 'O nome'),
  email: emailSchema,
  password: passwordSchema,
  /** Papel escolhido no cadastro. ADMIN nunca é auto-atribuível. */
  intent: z.enum(['BUYER', 'CREATOR', 'PROFESSIONAL']).default('BUYER'),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Informe a senha.'),
});

// ---------------------------------------------------------------------------
// Produtos
// ---------------------------------------------------------------------------

export const productKindSchema = z.enum([
  'AI_AGENT',
  'AUTOMATION',
  'WORKFLOW',
  'TEMPLATE',
  'PROMPT_PACK',
  'DATASET',
  'INTEGRATION',
]);

/** Lista curta de strings — usada em ferramentas, integrações e tags. */
const stringList = (max: number, label: string) =>
  z
    .array(text(1, 40, label))
    .max(max, `No máximo ${max} itens.`)
    .default([]);

export const productInputSchema = z.object({
  name: text(4, 120, 'O nome do produto'),
  tagline: text(10, 160, 'A chamada'),
  description: text(80, 20_000, 'A descrição'),
  kind: productKindSchema,
  categoryId: cuidSchema,
  priceCents: priceCentsSchema,
  requiredTools: stringList(12, 'A ferramenta'),
  integrations: stringList(12, 'A integração'),
  requirements: z.string().trim().max(4_000).optional(),
  tags: stringList(8, 'A tag'),
  coverImageUrl: z.string().url('URL de imagem inválida.').optional().or(z.literal('')),
  demoVideoUrl: z.string().url('URL de vídeo inválida.').optional().or(z.literal('')),
});

export type ProductInput = z.infer<typeof productInputSchema>;

/** Decisão de moderação. O motivo é obrigatório na recusa, e é o ponto. */
export const moderationSchema = z.discriminatedUnion('decision', [
  z.object({ decision: z.literal('approve'), productId: cuidSchema }),
  z.object({
    decision: z.literal('reject'),
    productId: cuidSchema,
    note: text(20, 2_000, 'O motivo da recusa'),
  }),
]);

// ---------------------------------------------------------------------------
// Busca e listagem
// ---------------------------------------------------------------------------

export const productSortSchema = z
  .enum(['relevance', 'recent', 'price_asc', 'price_desc', 'rating', 'sales'])
  .default('relevance');

/**
 * Filtros da vitrine.
 *
 * `coerce` porque tudo chega da query string como texto. `catch` em vez de
 * erro: uma URL adulterada não deve devolver 500 — deve devolver a listagem
 * padrão, que é o que um humano com link quebrado espera ver.
 */
export const productQuerySchema = z.object({
  q: z.string().trim().max(120).optional().catch(undefined),
  category: slugSchema.optional().catch(undefined),
  kind: productKindSchema.optional().catch(undefined),
  minPrice: z.coerce.number().int().min(0).optional().catch(undefined),
  maxPrice: z.coerce.number().int().min(0).optional().catch(undefined),
  sort: productSortSchema.catch('relevance'),
  page: z.coerce.number().int().min(1).max(500).default(1).catch(1),
});

export type ProductQuery = z.infer<typeof productQuerySchema>;

export const professionalQuerySchema = z.object({
  q: z.string().trim().max(120).optional().catch(undefined),
  specialty: z.string().trim().max(60).optional().catch(undefined),
  availability: z.enum(['AVAILABLE', 'LIMITED', 'UNAVAILABLE']).optional().catch(undefined),
  maxRate: z.coerce.number().int().min(0).optional().catch(undefined),
  sort: z.enum(['rating', 'recent', 'price_asc']).default('rating').catch('rating'),
  page: z.coerce.number().int().min(1).max(500).default(1).catch(1),
});

export const demandQuerySchema = z.object({
  q: z.string().trim().max(120).optional().catch(undefined),
  status: z.enum(['OPEN', 'IN_REVIEW', 'AWARDED', 'CLOSED']).optional().catch(undefined),
  minBudget: z.coerce.number().int().min(0).optional().catch(undefined),
  sort: z.enum(['recent', 'budget_desc', 'proposals']).default('recent').catch('recent'),
  page: z.coerce.number().int().min(1).max(500).default(1).catch(1),
});

// ---------------------------------------------------------------------------
// Demandas e propostas
// ---------------------------------------------------------------------------

export const demandInputSchema = z
  .object({
    title: text(10, 140, 'O título'),
    problem: text(40, 8_000, 'A descrição do problema'),
    goal: text(20, 4_000, 'O objetivo'),
    categoryId: cuidSchema.optional(),
    tools: stringList(10, 'A ferramenta'),
    budgetMinCents: priceCentsSchema,
    budgetMaxCents: priceCentsSchema,
    deadlineDays: z.coerce.number().int().min(1, 'Prazo mínimo de 1 dia.').max(365),
  })
  .refine((data) => data.budgetMaxCents >= data.budgetMinCents, {
    message: 'O teto do orçamento não pode ser menor que o piso.',
    path: ['budgetMaxCents'],
  });

export const proposalInputSchema = z.object({
  demandId: cuidSchema,
  amountCents: priceCentsSchema,
  deliveryDays: z.coerce.number().int().min(1).max(365),
  pitch: text(60, 4_000, 'A apresentação'),
  scope: text(40, 8_000, 'O escopo'),
  notes: z.string().trim().max(2_000).optional(),
});

// ---------------------------------------------------------------------------
// Avaliações e mensagens
// ---------------------------------------------------------------------------

export const reviewInputSchema = z.object({
  productId: cuidSchema,
  rating: z.coerce.number().int().min(1, 'A nota vai de 1 a 5.').max(5, 'A nota vai de 1 a 5.'),
  comment: text(20, 2_000, 'O comentário'),
});

export const messageInputSchema = z.object({
  conversationId: cuidSchema,
  body: text(1, 5_000, 'A mensagem'),
});

// ---------------------------------------------------------------------------
// Perfis
// ---------------------------------------------------------------------------

export const professionalProfileSchema = z.object({
  headline: text(10, 140, 'A chamada do perfil'),
  bio: text(80, 6_000, 'A biografia'),
  specialties: stringList(10, 'A especialidade'),
  tools: stringList(16, 'A ferramenta'),
  startingAtCents: priceCentsSchema,
  availability: z.enum(['AVAILABLE', 'LIMITED', 'UNAVAILABLE']).default('AVAILABLE'),
  location: z.string().trim().max(80).optional(),
  responseHours: z.coerce.number().int().min(1).max(168).default(24),
});

export const accountProfileSchema = z.object({
  name: text(2, 80, 'O nome'),
  bio: z.string().trim().max(2_000).optional(),
  company: z.string().trim().max(120).optional(),
  website: z.string().trim().url('URL inválida.').max(200).optional().or(z.literal('')),
  location: z.string().trim().max(80).optional(),
});

/**
 * Converte o erro do Zod no formato que os formulários consomem.
 *
 * Um lugar só faz a conversão para que a mensagem chegue igual em toda tela —
 * e para que mudar o formato depois seja uma edição, não dezoito.
 */
export function fieldErrorsFrom(error: z.ZodError): Record<string, string[]> {
  const output: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_form';
    (output[key] ??= []).push(issue.message);
  }

  return output;
}
