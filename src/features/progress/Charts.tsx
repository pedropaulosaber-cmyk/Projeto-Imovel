/**
 * Gráficos do painel de progresso.
 *
 * Construídos à mão com `react-native-svg` em vez de uma biblioteca de
 * gráficos. Três razões:
 *  1. As bibliotecas do ecossistema pesam centenas de KB para desenhar duas
 *     formas — num app que precisa abrir rápido, isso é caro demais.
 *  2. Elas trazem o próprio tema, que sempre destoa do design system.
 *  3. O que precisamos aqui é simples e estável: barras, linha e mapa de calor.
 *
 * Acessibilidade: todo gráfico expõe um resumo textual via
 * `accessibilityLabel`, porque um leitor de tela não enxerga SVG.
 */

import { memo } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { Text, useTheme } from '@/design';
import type { LocalDate } from '@/domain/types';
import { formatShortDate, weekdayInitial } from '@/lib/date';

export type SeriesPoint = { date: LocalDate; value: number };

/* ------------------------------------------------------------------ *
 * Barras
 * ------------------------------------------------------------------ */

export const BarChart = memo(function BarChart({
  data,
  height = 140,
  tone = 'brand',
  unit = '',
}: {
  data: SeriesPoint[];
  height?: number;
  tone?: 'brand' | 'streak' | 'success';
  unit?: string;
}) {
  const theme = useTheme();
  const max = Math.max(1, ...data.map((point) => point.value));

  const color = {
    brand: theme.colors.brand,
    streak: theme.colors.streak,
    success: theme.colors.success,
  }[tone];

  const total = data.reduce((sum, point) => sum + point.value, 0);

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={`Gráfico de barras. Total de ${total}${unit} em ${data.length} dias.`}
      style={{ gap: theme.space[2] }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          height,
          gap: 3,
        }}
      >
        {data.map((point) => {
          const ratio = point.value / max;
          return (
            <View key={point.date} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
              <View
                style={{
                  width: '100%',
                  maxWidth: 26,
                  // Barras de valor zero mantêm um traço mínimo visível: some
                  // significa "sem dado", 2px significa "zero" — são coisas
                  // diferentes e o usuário precisa distinguir.
                  height: Math.max(point.value > 0 ? 6 : 2, ratio * (height - 24)),
                  borderRadius: 5,
                  backgroundColor: point.value > 0 ? color : theme.colors.surfaceSunken,
                }}
              />
            </View>
          );
        })}
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {data.map((point) => (
          <View key={point.date} style={{ flex: 1, alignItems: 'center' }}>
            <Text variant="caption" tone="tertiary">
              {weekdayInitial(point.date)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
});

/* ------------------------------------------------------------------ *
 * Linha
 * ------------------------------------------------------------------ */

/**
 * Curva de tendência com área preenchida.
 *
 * Usa uma spline suave (Catmull-Rom convertida em Bézier cúbica) porque uma
 * poligonal de 30 pontos fica visualmente ruidosa e sugere variação que não
 * existe. A suavização é estética, não interpolação de dados: os pontos reais
 * seguem sobre a curva.
 */
export const LineChart = memo(function LineChart({
  data,
  height = 160,
  tone = 'brand',
}: {
  data: SeriesPoint[];
  height?: number;
  tone?: 'brand' | 'success';
}) {
  const theme = useTheme();
  const width = 320;
  const padding = 8;

  const color = tone === 'brand' ? theme.colors.brand : theme.colors.success;

  if (data.length < 2) {
    return (
      <View style={{ height, alignItems: 'center', justifyContent: 'center' }}>
        <Text variant="footnote" tone="tertiary">
          Dados insuficientes ainda
        </Text>
      </View>
    );
  }

  const max = Math.max(1, ...data.map((point) => point.value));
  const stepX = (width - padding * 2) / (data.length - 1);

  const points = data.map((point, index) => ({
    x: padding + index * stepX,
    y: height - padding - (point.value / max) * (height - padding * 2),
  }));

  const line = buildSmoothPath(points);
  const area = `${line} L ${points[points.length - 1]!.x} ${height} L ${points[0]!.x} ${height} Z`;

  const total = data.reduce((sum, point) => sum + point.value, 0);
  const average = Math.round(total / data.length);

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={`Gráfico de linha de ${formatShortDate(data[0]!.date)} a ${formatShortDate(
        data[data.length - 1]!.date,
      )}. Média de ${average} por dia.`}
    >
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        <Defs>
          <LinearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity="0.24" />
            <Stop offset="1" stopColor={color} stopOpacity="0" />
          </LinearGradient>
        </Defs>

        <Path d={area} fill="url(#areaFill)" />
        <Path d={line} stroke={color} strokeWidth={2.5} fill="none" strokeLinecap="round" />

        {/* Só o último ponto ganha marcador — é o que o usuário quer ler. */}
        <Circle
          cx={points[points.length - 1]!.x}
          cy={points[points.length - 1]!.y}
          r={4.5}
          fill={color}
          stroke={theme.colors.surface}
          strokeWidth={2}
        />
      </Svg>
    </View>
  );
});

/** Catmull-Rom → Bézier cúbica. */
function buildSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';

  let path = `M ${points[0]!.x} ${points[0]!.y}`;

  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[Math.max(0, i - 1)]!;
    const p1 = points[i]!;
    const p2 = points[i + 1]!;
    const p3 = points[Math.min(points.length - 1, i + 2)]!;

    // Tensão 1/6 é a conversão canônica de Catmull-Rom uniforme.
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }

  return path;
}

/* ------------------------------------------------------------------ *
 * Mapa de calor (calendário)
 * ------------------------------------------------------------------ */

/**
 * Calendário de atividade, no estilo do gráfico de contribuições.
 *
 * É o visual mais eficaz para hábito: mostra a **consistência**, não o volume.
 * Uma sequência de quadrados preenchidos comunica "eu sou uma pessoa que
 * estuda" — que é a identidade que sustenta o hábito a longo prazo.
 */
export const ActivityHeatmap = memo(function ActivityHeatmap({
  data,
  goal,
}: {
  data: SeriesPoint[];
  goal: number;
}) {
  const theme = useTheme();

  const activeDays = data.filter((point) => point.value > 0).length;

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={`Calendário de atividade: ${activeDays} dias estudados nos últimos ${data.length} dias.`}
      style={{ gap: theme.space[3] }}
    >
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5 }}>
        {data.map((point) => {
          const ratio = goal > 0 ? Math.min(1, point.value / goal) : 0;

          // Quatro níveis discretos em vez de opacidade contínua: níveis são
          // legíveis a um relance, um degradê contínuo não é.
          const background =
            point.value === 0
              ? theme.colors.surfaceSunken
              : ratio < 0.34
                ? theme.colors.brandBorder
                : ratio < 0.67
                  ? theme.colors.brand
                  : ratio < 1
                    ? theme.colors.brand
                    : theme.colors.success;

          return (
            <View
              key={point.date}
              style={{
                width: 14,
                height: 14,
                borderRadius: 3.5,
                backgroundColor: background,
                opacity: point.value === 0 ? 1 : Math.max(0.55, ratio),
              }}
            />
          );
        })}
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Text variant="caption" tone="tertiary">
          menos
        </Text>
        {[0, 0.3, 0.6, 1].map((level) => (
          <View
            key={level}
            style={{
              width: 11,
              height: 11,
              borderRadius: 3,
              backgroundColor:
                level === 0
                  ? theme.colors.surfaceSunken
                  : level === 1
                    ? theme.colors.success
                    : theme.colors.brand,
              opacity: level === 0 ? 1 : Math.max(0.55, level),
            }}
          />
        ))}
        <Text variant="caption" tone="tertiary">
          mais
        </Text>
      </View>
    </View>
  );
});
