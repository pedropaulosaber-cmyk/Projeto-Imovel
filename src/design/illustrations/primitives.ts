/**
 * Ilustrações — vocabulário formal comum
 * =======================================
 *
 * ## Por que ilustração gerada, e não imagem
 *
 * O Lumo promete funcionar offline por inteiro. Uma imagem hospedada quebra
 * essa promessa no primeiro voo de avião; uma imagem embutida no bundle custa
 * megabytes e precisa de três resoluções por densidade de tela. Ilustração
 * vetorial gerada em código custa alguns kilobytes, é nítida em qualquer
 * densidade, e — o que mais importa aqui — **reage ao tema**: a mesma cena
 * funciona no claro e no escuro porque as cores vêm dos tokens, não do arquivo.
 *
 * ## A regra que faz oito cenas parecerem um conjunto
 *
 * Todas as cenas de idioma usam o **mesmo vocabulário formal**: um céu em
 * gradiente, um disco (sol ou lua), duas ou três silhuetas em camadas e uma
 * linha de horizonte. Só as silhuetas mudam de idioma para idioma.
 *
 * É essa restrição que separa um conjunto desenhado de oito desenhos avulsos.
 * Sem ela, o app ganharia oito ilustrações bonitas que não conversam entre si
 * — que é exatamente como uma interface começa a parecer montada por comitê.
 */

/** Ponto num sistema de coordenadas 0–100, independente do tamanho final. */
export type Point = { x: number; y: number };

/**
 * Gerador pseudoaleatório determinístico (mulberry32).
 *
 * Determinismo não é detalhe: sem ele a mesma tela desenharia uma silhueta
 * diferente a cada render, e o app pareceria instável. A semente vem do código
 * do idioma, então cada idioma tem a sua cena — sempre a mesma.
 */
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Converte um texto em semente numérica estável (hash djb2). */
export function seedFrom(text: string): number {
  let hash = 5381;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 33) ^ text.charCodeAt(index);
  }
  return hash >>> 0;
}

/**
 * Caminho SVG de uma cordilheira: uma linha quebrada fechada até a base.
 *
 * `peaks` define a silhueta em coordenadas 0–100. O caminho fecha nos cantos
 * inferiores para que o preenchimento seja uma massa sólida, não um traço.
 */
export function ridgePath(peaks: Point[], baseline = 100): string {
  if (peaks.length === 0) return '';
  const first = peaks[0] as Point;
  const last = peaks[peaks.length - 1] as Point;

  const segments = peaks.map((peak, index) =>
    index === 0 ? `M ${first.x} ${first.y}` : `L ${peak.x} ${peak.y}`,
  );

  return [...segments, `L ${last.x} ${baseline}`, `L ${first.x} ${baseline}`, 'Z'].join(' ');
}

/**
 * Caminho de colina suave — mesma ideia da cordilheira, com curvas.
 *
 * Usa curvas quadráticas entre os pontos médios, técnica que produz uma
 * silhueta contínua sem "bicos" nos vértices.
 */
export function hillPath(peaks: Point[], baseline = 100): string {
  if (peaks.length < 2) return ridgePath(peaks, baseline);
  const first = peaks[0] as Point;
  const last = peaks[peaks.length - 1] as Point;

  let path = `M ${first.x} ${first.y}`;
  for (let index = 1; index < peaks.length; index += 1) {
    const previous = peaks[index - 1] as Point;
    const current = peaks[index] as Point;
    const midX = (previous.x + current.x) / 2;
    const midY = (previous.y + current.y) / 2;
    path += ` Q ${previous.x} ${previous.y} ${midX} ${midY}`;
  }
  path += ` T ${last.x} ${last.y}`;
  path += ` L ${last.x} ${baseline} L ${first.x} ${baseline} Z`;
  return path;
}

/**
 * Identificador válido para `url(#…)` dentro de um SVG.
 *
 * `useId` do React devolve algo como `:r7:`. Dois-pontos é legal em HTML5, mas
 * quebra em seletores CSS e em parte das ferramentas — e um id repetido faria
 * **todas** as instâncias na página usarem o gradiente da primeira, que é o
 * tipo de bug que só aparece quando há dois componentes na mesma tela.
 */
export function svgId(reactId: string, suffix: string): string {
  return `lumo-${reactId.replace(/[^a-zA-Z0-9]/g, '')}-${suffix}`;
}
