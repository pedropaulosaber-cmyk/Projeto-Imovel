/**
 * Testes da camada de ilustração.
 *
 * Só a lógica pura é testada aqui — cor, geometria e determinismo. O que um
 * teste de unidade não alcança (a cena estar bonita, o contraste funcionar no
 * escuro) fica com a verificação no navegador; fingir que um `expect` cobre
 * isso seria pior que não testar.
 */

import { alpha, mix } from '../color';
import { SCENES, sceneFor } from '../illustrations/motifs';
import {
  hillPath,
  ridgePath,
  seedFrom,
  seededRandom,
  svgId,
} from '../illustrations/primitives';

const LANGUAGES = ['en', 'es', 'fr', 'it', 'de', 'ja', 'ko', 'zh'];

describe('cor', () => {
  it('mistura devolve os extremos exatos', () => {
    expect(mix('#000000', '#FFFFFF', 0)).toBe('#000000');
    expect(mix('#000000', '#FFFFFF', 1)).toBe('#ffffff');
  });

  it('o ponto médio entre preto e branco é cinza médio', () => {
    expect(mix('#000000', '#FFFFFF', 0.5)).toBe('#808080');
  });

  it('aceita hexadecimal de três dígitos', () => {
    expect(mix('#000', '#fff', 1)).toBe('#ffffff');
  });

  it('trava a mistura fora do intervalo em vez de estourar o canal', () => {
    // Um `amount` de 2 produziria #1fe... sem o clamp — cor inválida e
    // silenciosa, que é o pior tipo de bug visual.
    expect(mix('#000000', '#FFFFFF', 2)).toBe('#ffffff');
    expect(mix('#000000', '#FFFFFF', -1)).toBe('#000000');
  });

  it('alpha produz hexadecimal de oito dígitos', () => {
    expect(alpha('#6366F1', 1)).toBe('#6366F1ff');
    expect(alpha('#6366F1', 0)).toBe('#6366F100');
    expect(alpha('#6366F1', 0.5)).toBe('#6366F180');
  });
});

describe('determinismo', () => {
  it('a mesma semente produz a mesma sequência', () => {
    const first = seededRandom(seedFrom('ja'));
    const second = seededRandom(seedFrom('ja'));
    const a = [first(), first(), first()];
    const b = [second(), second(), second()];

    // Sem isto, o fundo mudaria a cada render e a tela pareceria instável.
    expect(a).toEqual(b);
  });

  it('sementes diferentes produzem sequências diferentes', () => {
    const a = seededRandom(seedFrom('learn'));
    const b = seededRandom(seedFrom('progress'));
    expect(a()).not.toBe(b());
  });

  it('os valores ficam no intervalo [0, 1)', () => {
    const random = seededRandom(seedFrom('lumo'));
    for (let index = 0; index < 200; index += 1) {
      const value = random();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});

describe('geometria', () => {
  it('a cordilheira fecha o caminho', () => {
    const path = ridgePath([
      { x: 0, y: 50 },
      { x: 50, y: 20 },
      { x: 100, y: 50 },
    ]);
    expect(path.startsWith('M 0 50')).toBe(true);
    expect(path.endsWith('Z')).toBe(true);
  });

  it('a colina também fecha o caminho', () => {
    const path = hillPath([
      { x: 0, y: 60 },
      { x: 50, y: 40 },
      { x: 100, y: 55 },
    ]);
    expect(path.endsWith('Z')).toBe(true);
  });

  it('nenhum caminho fica vazio ou com NaN', () => {
    // `NaN` num atributo `d` não lança erro: o SVG simplesmente não desenha, e
    // a tela fica com um buraco que ninguém associa à causa.
    for (const language of LANGUAGES) {
      for (const layer of sceneFor(language).layers) {
        expect(layer.path.length).toBeGreaterThan(0);
        expect(layer.path).not.toMatch(/NaN|undefined|Infinity/);
      }
    }
  });
});

describe('cenas', () => {
  it('todo idioma suportado tem cena própria', () => {
    for (const language of LANGUAGES) {
      expect(SCENES[language]).toBeDefined();
    }
  });

  it('um idioma desconhecido cai na cena de reserva em vez de quebrar', () => {
    const scene = sceneFor('xx');
    expect(scene.layers.length).toBeGreaterThan(0);
  });

  it('cada idioma tem uma silhueta distinta', () => {
    // Duas cenas iguais significariam que o aluno de alemão e o de japonês
    // veem a mesma paisagem — o oposto do que a ilustração promete.
    const signatures = LANGUAGES.map((language) =>
      sceneFor(language)
        .layers.map((layer) => layer.path)
        .join('|'),
    );
    expect(new Set(signatures).size).toBe(LANGUAGES.length);
  });

  it('as camadas cobrem a faixa de profundidade', () => {
    for (const language of LANGUAGES) {
      const depths = sceneFor(language).layers.map((layer) => layer.depth);
      expect(Math.min(...depths)).toBeLessThan(0.4);
      expect(Math.max(...depths)).toBe(1);
      for (const depth of depths) {
        expect(depth).toBeGreaterThanOrEqual(0);
        expect(depth).toBeLessThanOrEqual(1);
      }
    }
  });

  it('as camadas vêm ordenadas do fundo para a frente', () => {
    // A ordem é a ordem de desenho: fora dela, a montanha distante cobriria o
    // portal em primeiro plano.
    for (const language of LANGUAGES) {
      const depths = sceneFor(language).layers.map((layer) => layer.depth);
      expect([...depths].sort((a, b) => a - b)).toEqual(depths);
    }
  });
});

describe('identificadores de SVG', () => {
  it('remove os caracteres que o React gera e o SVG não aceita', () => {
    expect(svgId(':r7:', 'sky')).toBe('lumo-r7-sky');
  });

  it('instâncias diferentes não colidem', () => {
    // Ids iguais fariam todas as instâncias na página usarem o gradiente da
    // primeira — bug que só aparece com dois componentes na mesma tela.
    expect(svgId(':r1:', 'sky')).not.toBe(svgId(':r2:', 'sky'));
  });
});
