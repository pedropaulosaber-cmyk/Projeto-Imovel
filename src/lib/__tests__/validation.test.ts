import { describe, expect, it } from 'vitest';

import {
  demandInputSchema,
  passwordSchema,
  priceCentsSchema,
  productQuerySchema,
  registerSchema,
  slugSchema,
} from '../validation';

describe('senha', () => {
  it('exige comprimento, não composição', () => {
    // Frase longa passa; a regra de "um símbolo e um número" reprovaria esta e
    // aprovaria `Senha@12`, que é o oposto do que protege.
    expect(passwordSchema.safeParse('meu cachorro come muita ração').success).toBe(true);
    expect(passwordSchema.safeParse('curta12').success).toBe(false);
  });

  it('recusa senhas de vazamento conhecido', () => {
    expect(passwordSchema.safeParse('password123').success).toBe(false);
    expect(passwordSchema.safeParse('PASSWORD123').success).toBe(false);
  });
});

describe('cadastro', () => {
  it('não permite pedir o papel de administrador', () => {
    // O caminho de escalada de privilégio mais óbvio que existe: mandar
    // `intent=ADMIN` no formulário de cadastro.
    const result = registerSchema.safeParse({
      name: 'Fulano',
      email: 'fulano@exemplo.com',
      password: 'uma senha bem longa',
      intent: 'ADMIN',
    });
    expect(result.success).toBe(false);
  });

  it('normaliza o e-mail para minúsculas', () => {
    const result = registerSchema.parse({
      name: 'Fulano',
      email: '  FULANO@Exemplo.COM  ',
      password: 'uma senha bem longa',
    });
    expect(result.email).toBe('fulano@exemplo.com');
  });
});

describe('preço', () => {
  it('recusa fracionário e negativo', () => {
    expect(priceCentsSchema.safeParse(19.99).success).toBe(false);
    expect(priceCentsSchema.safeParse(-100).success).toBe(false);
    expect(priceCentsSchema.safeParse(189_000).success).toBe(true);
  });
});

describe('slug', () => {
  it('aceita só o que é seguro numa rota pública', () => {
    expect(slugSchema.safeParse('agente-de-qualificacao').success).toBe(true);
    expect(slugSchema.safeParse('Agente De Qualificacao').success).toBe(false);
    expect(slugSchema.safeParse('../../etc/passwd').success).toBe(false);
    expect(slugSchema.safeParse('a').success).toBe(false);
  });
});

describe('filtros da vitrine', () => {
  it('URL adulterada cai no padrão em vez de estourar', () => {
    // Uma query string quebrada tem de devolver a listagem padrão, não 500.
    const query = productQuerySchema.parse({ sort: 'inexistente', page: 'abc', kind: 'XPTO' });
    expect(query.sort).toBe('relevance');
    expect(query.page).toBe(1);
    expect(query.kind).toBeUndefined();
  });
});

describe('demanda', () => {
  it('recusa teto de orçamento menor que o piso', () => {
    const result = demandInputSchema.safeParse({
      title: 'Automatizar a conciliação bancária',
      problem: 'x'.repeat(50),
      goal: 'x'.repeat(30),
      tools: [],
      budgetMinCents: 1_000_000,
      budgetMaxCents: 500_000,
      deadlineDays: 30,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path.includes('budgetMaxCents'))).toBe(true);
    }
  });
});
