/**
 * Testes da migração de forma na leitura.
 *
 * Este arquivo existe por causa de uma tela branca real em produção: uma
 * matrícula gravada antes de `learningMode` existir derrubou o Perfil inteiro
 * com `Cannot read properties of undefined (reading 'icon')`.
 *
 * A lição que os testes travam: **o tipo descreve o código novo, não o disco
 * antigo**. Todo campo adicionado depois do lançamento precisa de um caso aqui.
 */

import type { Enrollment, UserProfile } from '@/domain/types';
import { type Stored, normalizeEnrollment, normalizeProfile } from '../migrations';

const COMPLETE_ENROLLMENT: Enrollment = {
  id: 'e1',
  userId: 'u1',
  language: 'en',
  goals: ['travel'],
  currentLevel: 'B1',
  dailyGoalXp: 120,
  dailyMinutes: 10,
  studyDays: [1, 3, 5],
  reminderMinute: 1140,
  startedAt: 1,
  isActive: true,
  learningMode: 'essential',
  updatedAt: 2,
};

describe('normalizeEnrollment', () => {
  it('devolve null para entrada null', () => {
    expect(normalizeEnrollment(null)).toBeNull();
  });

  it('preenche learningMode ausente com o modo completo', () => {
    // Exatamente o documento que quebrou o Perfil em produção.
    const { learningMode, ...legacy } = COMPLETE_ENROLLMENT;
    const result = normalizeEnrollment(legacy as Stored<Enrollment>);

    expect(result?.learningMode).toBe('complete');
  });

  it('não altera um registro que já está no formato atual', () => {
    expect(normalizeEnrollment(COMPLETE_ENROLLMENT)).toEqual(COMPLETE_ENROLLMENT);
  });

  it('é idempotente — passa duas vezes e dá o mesmo resultado', () => {
    const { learningMode, ...legacy } = COMPLETE_ENROLLMENT;
    const once = normalizeEnrollment(legacy as Stored<Enrollment>);
    const twice = normalizeEnrollment(once);

    expect(twice).toEqual(once);
  });

  it('preserva o modo escolhido em vez de sobrescrever com o padrão', () => {
    // Regressão importante: um "conserto" ingênuo que sempre atribuísse
    // 'complete' passaria em todos os testes acima e jogaria fora a escolha
    // de quem usa o Essencial.
    expect(normalizeEnrollment(COMPLETE_ENROLLMENT)?.learningMode).toBe('essential');
  });

  it('substitui arrays ausentes por padrões utilizáveis', () => {
    const truncated = { id: 'e2', userId: 'u1', language: 'en' } as Stored<Enrollment>;
    const result = normalizeEnrollment(truncated);

    expect(result?.goals).toEqual([]);
    expect(result?.studyDays).toEqual([1, 2, 3, 4, 5]);
    expect(result?.currentLevel).toBe('A1');
    expect(result?.reminderMinute).toBeNull();
  });

  it('trata reminderMinute = 0 como valor legítimo, não como ausente', () => {
    // Meia-noite é 0. Um `||` no lugar do `??` transformaria isso em null e
    // desligaria silenciosamente o lembrete de quem estuda de madrugada.
    const midnight = { ...COMPLETE_ENROLLMENT, reminderMinute: 0 };
    expect(normalizeEnrollment(midnight)?.reminderMinute).toBe(0);
  });
});

describe('normalizeProfile', () => {
  const PROFILE: UserProfile = {
    id: 'u1',
    displayName: 'Pedro',
    email: null,
    avatarUrl: null,
    bio: null,
    uiLanguage: 'pt',
    nativeLanguage: 'pt-BR',
    plan: 'free',
    planExpiresAt: null,
    createdAt: 1,
    updatedAt: 2,
    onboardingCompleted: true,
    timezone: 'America/Sao_Paulo',
  };

  it('devolve null para entrada null', () => {
    expect(normalizeProfile(null)).toBeNull();
  });

  it('assume plano gratuito quando o campo falta', () => {
    const { plan, ...legacy } = PROFILE;
    expect(normalizeProfile(legacy as Stored<UserProfile>)?.plan).toBe('free');
  });

  it('dá um nome utilizável quando o nome está vazio', () => {
    expect(normalizeProfile({ ...PROFILE, displayName: '' })?.displayName).toBe('Estudante');
  });

  it('não altera um perfil já completo', () => {
    expect(normalizeProfile(PROFILE)).toEqual(PROFILE);
  });
});
