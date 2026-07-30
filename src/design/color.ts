/**
 * Utilitários de cor do design system.
 *
 * Existem para que as ilustrações possam derivar tons a partir dos tokens do
 * tema, em vez de trazer uma paleta própria. Uma cena que fixa `#6366F1` fica
 * bonita no tema claro e erra no escuro — e erra de novo no dia em que a marca
 * mudar de cor. Derivando do token, ela acompanha.
 */

type Rgb = { r: number; g: number; b: number };

function parseHex(hex: string): Rgb {
  const value = hex.replace('#', '');
  const full =
    value.length === 3
      ? value
          .split('')
          .map((char) => char + char)
          .join('')
      : value;

  return {
    r: Number.parseInt(full.slice(0, 2), 16),
    g: Number.parseInt(full.slice(2, 4), 16),
    b: Number.parseInt(full.slice(4, 6), 16),
  };
}

function toHex({ r, g, b }: Rgb): string {
  const channel = (value: number) =>
    Math.max(0, Math.min(255, Math.round(value)))
      .toString(16)
      .padStart(2, '0');
  return `#${channel(r)}${channel(g)}${channel(b)}`;
}

/**
 * Mistura duas cores hexadecimais. `amount` 0 devolve `from`, 1 devolve `to`.
 *
 * A interpolação é feita em sRGB, não em espaço perceptual. É a escolha certa
 * aqui: as misturas usadas nas cenas são entre tons vizinhos, onde sRGB não
 * produz a faixa acinzentada que estragaria um gradiente entre complementares.
 */
export function mix(from: string, to: string, amount: number): string {
  const a = parseHex(from);
  const b = parseHex(to);
  const t = Math.max(0, Math.min(1, amount));
  return toHex({
    r: a.r + (b.r - a.r) * t,
    g: a.g + (b.g - a.g) * t,
    b: a.b + (b.b - a.b) * t,
  });
}

/**
 * Cor com transparência, no formato `#RRGGBBAA`.
 *
 * `rgba()` também funcionaria, mas `react-native-svg` aceita os dois e o hex
 * de oito dígitos mantém as cores comparáveis no código.
 */
export function alpha(hex: string, value: number): string {
  const clamped = Math.max(0, Math.min(1, value));
  const channel = Math.round(clamped * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${channel}`;
}
