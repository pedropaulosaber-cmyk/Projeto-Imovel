/**
 * Migração de forma na leitura
 * =============================
 *
 * Um app offline-first lê **documentos JSON gravados por versões anteriores do
 * próprio app**. Quando um campo novo entra num tipo, o TypeScript garante que
 * todo código novo o preencha — e não garante nada sobre os registros já
 * gravados no aparelho do usuário. Para o compilador o campo existe; em disco,
 * não existe.
 *
 * Foi assim que o Perfil ficou branco: `learningMode` entrou em `Enrollment`,
 * quem instalou depois passou bem, e quem já tinha matrícula gravada abriu o
 * Perfil e recebeu `Cannot read properties of undefined (reading 'icon')`.
 *
 * ## Regras destas funções
 *
 *  1. **Puramente aditivas.** Preenchem o que falta; nunca reinterpretam o que
 *     existe. Registro já correto sai idêntico ao que entrou.
 *  2. **Idempotentes.** Aplicar duas vezes dá o mesmo resultado — importante
 *     porque o mesmo documento passa por aqui a cada leitura.
 *  3. **Sem I/O.** É por isso que este arquivo não importa nada de `db/` nem
 *     de `react-native`: assim roda em Node puro e é testável em milissegundos.
 *
 * O lugar certo é a **fronteira de leitura** do repositório. Blindar a tela
 * conserta uma tela; normalizar na fronteira faz o resto do código poder
 * confiar no tipo — que é o que um tipo deveria significar.
 */

import type { Enrollment, UserProfile } from '@/domain/types';

/**
 * Documento como ele realmente sai do disco: qualquer campo pode faltar,
 * inclusive os que o tipo declara como obrigatórios.
 *
 * Este alias existe para tornar a mentira explícita. `Enrollment` promete que
 * `learningMode` é uma string; o disco não prometeu nada.
 */
export type Stored<T> = Partial<T> & { id: string };

/** Normaliza uma matrícula lida do disco para o formato atual. */
export function normalizeEnrollment(enrollment: Stored<Enrollment> | null): Enrollment | null {
  if (!enrollment) return null;

  return {
    ...enrollment,
    // v2 — modo de aprendizado. Quem já estudava estava no modo completo.
    learningMode: enrollment.learningMode ?? 'complete',
    // Defensivos contra documento truncado: array ausente vira lista vazia em
    // vez de derrubar todo `.map` que encostar nele.
    goals: enrollment.goals ?? [],
    studyDays: enrollment.studyDays ?? [1, 2, 3, 4, 5],
    currentLevel: enrollment.currentLevel ?? 'A1',
    reminderMinute: enrollment.reminderMinute ?? null,
    dailyMinutes: enrollment.dailyMinutes ?? 10,
    dailyGoalXp: enrollment.dailyGoalXp ?? 120,
  } as Enrollment;
}

/** Normaliza um perfil lido do disco para o formato atual. */
export function normalizeProfile(profile: Stored<UserProfile> | null): UserProfile | null {
  if (!profile) return null;

  return {
    ...profile,
    plan: profile.plan ?? 'free',
    displayName: profile.displayName || 'Estudante',
    uiLanguage: profile.uiLanguage ?? 'pt',
    nativeLanguage: profile.nativeLanguage ?? 'pt-BR',
  } as UserProfile;
}
