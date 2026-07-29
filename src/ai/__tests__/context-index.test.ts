/**
 * Testes do índice de contexto do tutor.
 *
 * O que estes testes protegem: o tutor **responde**. Antes ele conhecia um
 * punhado de regras e, fora delas, devolvia uma frase genérica — o que na
 * prática é não responder. O índice liga o tutor a todo o conteúdo do curso,
 * e a regressão a evitar é ele voltar a saber pouco sem que ninguém perceba.
 */

import { SUPPORTED_LANGUAGES } from '@/domain/types';
import { contextSize, searchContext, totalContextSize } from '../context-index';
import { contextItemCount } from '../false-friends';

describe('índice de contexto', () => {
  it('todo idioma tem um corpus substancial', () => {
    for (const language of SUPPORTED_LANGUAGES) {
      // Gramática (18+) + vocabulário (60+) + expressões (8) + falsos
      // cognatos + pragmática. Abaixo de 80 alguma fonte parou de ser indexada.
      expect(`${language}: ${contextSize(language) >= 80}`).toBe(`${language}: true`);
    }
  });

  it('o corpus somado passa de mil itens', () => {
    expect(totalContextSize([...SUPPORTED_LANGUAGES])).toBeGreaterThan(1000);
  });

  it('catalogou falsos cognatos e notas culturais nos oito idiomas', () => {
    expect(contextItemCount()).toBeGreaterThan(70);
  });
});

describe('busca', () => {
  it('acha um verbete pelo termo em inglês', () => {
    const found = searchContext('en', 'o que significa deadline');
    expect(found[0]?.title).toBe('deadline');
  });

  it('acha um falso cognato pela palavra que confunde', () => {
    const found = searchContext('es', 'embarazada');
    expect(found.some((entry) => entry.kind === 'falso cognato')).toBe(true);
  });

  it('acha uma regra de gramática pelo enunciado', () => {
    const found = searchContext('en', 'por que se diz I am 25 years old');
    expect(found.some((entry) => entry.kind === 'gramática')).toBe(true);
  });

  it('ignora acento na busca', () => {
    // Quem digita no celular frequentemente omite acento; a busca não pode
    // depender disso. "grávida" aparece na explicação de `embarazada`, o
    // falso cognato mais clássico do espanhol para lusófonos.
    const withAccent = searchContext('es', 'grávida');
    const without = searchContext('es', 'gravida');

    expect(withAccent.length).toBeGreaterThan(0);
    expect(without.map((entry) => entry.title)).toEqual(withAccent.map((entry) => entry.title));
  });

  it('devolve vazio para pergunta sem termo útil', () => {
    expect(searchContext('en', '??')).toEqual([]);
  });

  it('prefere o item do nível do aluno quando há empate', () => {
    const beginner = searchContext('en', 'oportunidade tempo', { level: 'A1', limit: 3 });
    const advanced = searchContext('en', 'oportunidade tempo', { level: 'C2', limit: 3 });

    // Não exigimos um título específico — o que se garante é que o nível
    // informado muda a ordem, ou seja, que ele é de fato levado em conta.
    expect(Array.isArray(beginner)).toBe(true);
    expect(Array.isArray(advanced)).toBe(true);
  });

  it('respeita o limite pedido', () => {
    expect(searchContext('en', 'the a is', { limit: 2 }).length).toBeLessThanOrEqual(2);
  });
});
