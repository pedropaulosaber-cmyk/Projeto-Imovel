import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Junta classes resolvendo conflitos do Tailwind.
 *
 * `clsx` sozinho concatena: `"p-4"` mais `"p-6"` produz `"p-4 p-6"`, e qual
 * vence depende da ordem no CSS gerado, não da ordem na chamada — o que faz o
 * `className` passado de fora parecer que "às vezes funciona". `twMerge`
 * remove a classe anterior do mesmo grupo, tornando a sobrescrita previsível.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
