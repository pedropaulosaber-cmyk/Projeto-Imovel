/**
 * Lumo — Controle de acesso
 * ==========================
 *
 * Ponto **único** que decide o que o usuário pode usar. Nenhuma tela consulta
 * `profile.plan` diretamente; todas perguntam aqui.
 *
 * ## Estado atual: tudo liberado para todo mundo
 *
 * `OPEN_ACCESS` está ligado. Enquanto estiver, todo usuário tem acesso
 * completo: todos os idiomas, todas as lições, vidas infinitas, tutor sem
 * limite, downloads sem restrição.
 *
 * ## Por que uma constante e não apagar o código de planos
 *
 * Apagar a noção de plano economizaria algumas linhas hoje e custaria uma
 * refatoração inteira no dia em que a cobrança voltar — e é um dia que quase
 * sempre chega. Mantendo o modelo intacto e concentrando a decisão num único
 * lugar, ligar a cobrança de volta é mudar `OPEN_ACCESS` para `false`: as
 * regras por plano continuam escritas, testadas e prontas.
 *
 * A alternativa que eu **não** escolhi foi marcar todo mundo como assinante no
 * banco. Isso funcionaria e seria irreversível: quando a cobrança voltasse,
 * seria impossível distinguir quem realmente assinou de quem foi promovido em
 * massa, e a correção envolveria adivinhar. Uma trava de leitura não suja o
 * dado; um `UPDATE` em massa suja para sempre.
 */

import type { SubscriptionPlan, UserProfile } from './types';

/**
 * Acesso aberto: todo recurso liberado, independentemente do plano gravado.
 * Trocar para `false` reativa as regras por plano, que continuam abaixo.
 */
export const OPEN_ACCESS = true;

/** O usuário tem acesso a todo o produto? */
export function hasFullAccess(profile: Pick<UserProfile, 'plan'> | null | undefined): boolean {
  if (OPEN_ACCESS) return true;
  const plan = profile?.plan ?? 'free';
  return plan !== 'free';
}

/** Vidas infinitas na lição. */
export function hasUnlimitedHearts(
  profile: Pick<UserProfile, 'plan'> | null | undefined,
): boolean {
  return hasFullAccess(profile);
}

/** Pode abrir uma lição marcada como premium. */
export function canOpenLesson(
  profile: Pick<UserProfile, 'plan'> | null | undefined,
  lesson: { premium: boolean },
): boolean {
  return !lesson.premium || hasFullAccess(profile);
}

/**
 * Rótulo do plano exibido no perfil.
 *
 * Com acesso aberto ninguém é "gratuito" nem "premium" — todo mundo tem tudo,
 * e o rótulo diz isso em vez de mentir em qualquer das duas direções.
 */
export function planLabel(plan: SubscriptionPlan | undefined): {
  label: string;
  tone: 'neutral' | 'premium';
  icon: 'star' | undefined;
} {
  if (OPEN_ACCESS) return { label: 'Acesso completo', tone: 'premium', icon: 'star' };
  if (!plan || plan === 'free')
    return { label: 'Plano gratuito', tone: 'neutral', icon: undefined };
  return { label: 'Premium', tone: 'premium', icon: 'star' };
}

/** Deve exibir convites para assinar? Com acesso aberto, não há o que vender. */
export function shouldShowUpsell(
  profile: Pick<UserProfile, 'plan'> | null | undefined,
): boolean {
  if (OPEN_ACCESS) return false;
  return !hasFullAccess(profile);
}
