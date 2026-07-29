/**
 * Utilidades de data.
 *
 * Regra do projeto: "hoje" é sempre calculado no **fuso local do dispositivo**.
 * Um usuário em São Paulo que estuda às 23h de terça espera que aquilo conte
 * como terça, não como quarta em UTC. Ofensiva e metas diárias dependem disso
 * estar certo, e é o tipo de bug que só aparece em produção.
 */

import type { LocalDate, Timestamp } from '@/domain/types';

export const DAY_MS = 24 * 60 * 60 * 1000;

/** 'YYYY-MM-DD' no fuso local. */
export function toLocalDate(input: Date | Timestamp = Date.now()): LocalDate {
  const date = typeof input === 'number' ? new Date(input) : input;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Converte 'YYYY-MM-DD' para o Date da meia-noite local. */
export function fromLocalDate(value: LocalDate): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1);
}

/** Diferença em dias de calendário entre duas datas locais. */
export function daysBetween(from: LocalDate, to: LocalDate): number {
  const fromDate = fromLocalDate(from);
  const toDate = fromLocalDate(to);
  // Normaliza via UTC para não ser afetado por horário de verão no meio.
  const fromUtc = Date.UTC(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
  const toUtc = Date.UTC(toDate.getFullYear(), toDate.getMonth(), toDate.getDate());
  return Math.round((toUtc - fromUtc) / DAY_MS);
}

/** Soma dias a uma data local. */
export function addDays(date: LocalDate, days: number): LocalDate {
  const base = fromLocalDate(date);
  base.setDate(base.getDate() + days);
  return toLocalDate(base);
}

/** As últimas N datas, terminando hoje (mais antiga primeiro). */
export function lastNDates(days: number, endingAt: LocalDate = toLocalDate()): LocalDate[] {
  return Array.from({ length: days }, (_, index) => addDays(endingAt, index - days + 1));
}

/** Segunda-feira da semana da data informada — âncora das ligas e missões. */
export function startOfWeek(date: LocalDate = toLocalDate()): LocalDate {
  const base = fromLocalDate(date);
  const weekday = base.getDay(); // 0 = domingo
  const offset = weekday === 0 ? -6 : 1 - weekday;
  return addDays(date, offset);
}

export function startOfMonth(date: LocalDate = toLocalDate()): LocalDate {
  const [year, month] = date.split('-');
  return `${year}-${month}-01`;
}

/** Início do dia local em epoch ms. */
export function startOfDayMs(date: LocalDate = toLocalDate()): Timestamp {
  return fromLocalDate(date).getTime();
}

/** Fim do dia local (exclusivo) em epoch ms. */
export function endOfDayMs(date: LocalDate = toLocalDate()): Timestamp {
  return startOfDayMs(date) + DAY_MS;
}

const WEEKDAY_SHORT = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const WEEKDAY_LONG = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const MONTH_SHORT = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez',
];

export function weekdayInitial(date: LocalDate): string {
  return WEEKDAY_SHORT[fromLocalDate(date).getDay()] ?? '';
}

export function weekdayName(date: LocalDate): string {
  return WEEKDAY_LONG[fromLocalDate(date).getDay()] ?? '';
}

/** '14 de mar' — formato curto para gráficos e listas. */
export function formatShortDate(date: LocalDate): string {
  const parsed = fromLocalDate(date);
  return `${parsed.getDate()} de ${MONTH_SHORT[parsed.getMonth()] ?? ''}`;
}

/** Minutos desde a meia-noite formatados como 'HH:MM'. */
export function formatMinuteOfDay(minute: number): string {
  const hours = String(Math.floor(minute / 60)).padStart(2, '0');
  const minutes = String(minute % 60).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/** Duração humanizada: 90 → '1h 30min'. */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)}min`;
  const hours = Math.floor(minutes / 60);
  const rest = Math.round(minutes % 60);
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}min`;
}

/** Bytes humanizados, para a tela de downloads. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/** Número compacto: 1234 → '1,2 mil'. */
export function formatCompactNumber(value: number): string {
  if (value < 1000) return String(value);
  if (value < 1_000_000) return `${(value / 1000).toFixed(1).replace('.', ',')} mil`;
  return `${(value / 1_000_000).toFixed(1).replace('.', ',')} mi`;
}
