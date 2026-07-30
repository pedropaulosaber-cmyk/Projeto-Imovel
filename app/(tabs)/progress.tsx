/**
 * Painel de progresso.
 *
 * Filosofia: **números honestos, não números bonitos.** Um painel que só
 * mostra métricas que sobem vira decoração e perde a confiança do usuário.
 * Aqui aparecem precisão real, pronúncia real e retenção prevista real —
 * inclusive quando são ruins, porque é isso que orienta o próximo passo.
 *
 * Organização em três níveis de zoom: hoje → semana → longo prazo. É a ordem
 * em que as perguntas surgem naturalmente.
 */

import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';

import {
  Aurora,
  Badge,
  Card,
  ProgressBar,
  Screen,
  SegmentedControl,
  Text,
  alpha,
  useTheme,
} from '@/design';
import { LEAGUE_LABEL } from '@/domain/gamification';
import {
  ActivityHeatmap,
  BarChart,
  LineChart,
  type SeriesPoint,
} from '@/features/progress/Charts';
import { formatDuration, lastNDates } from '@/lib/date';
import {
  selectAccuracy,
  selectPronunciation,
  selectTotalMinutes,
  selectWordsLearned,
  useAppStore,
  useLevelProgress,
} from '@/state/app-store';

type Range = '7' | '30' | '365';

export default function Progress() {
  const theme = useTheme();
  const [range, setRange] = useState<Range>('7');

  const enrollment = useAppStore((state) => state.enrollment);
  const stats = useAppStore((state) => state.recentStats);
  const streak = useAppStore((state) => state.streak);
  const wallet = useAppStore((state) => state.wallet);
  const refresh = useAppStore((state) => state.refresh);

  const level = useLevelProgress();
  const accuracy = useAppStore(selectAccuracy);
  const pronunciation = useAppStore(selectPronunciation);
  const totalMinutes = useAppStore(selectTotalMinutes);
  const wordsLearned = useAppStore(selectWordsLearned);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const days = range === '7' ? 7 : range === '30' ? 30 : 365;

  /**
   * Preenche os dias sem registro com zero.
   *
   * Sem esse preenchimento o gráfico "pula" os dias parados e dá a impressão
   * de constância que não existe — exatamente a desonestidade que este painel
   * evita.
   */
  const series = useMemo<{ xp: SeriesPoint[]; minutes: SeriesPoint[] }>(() => {
    const dates = lastNDates(Math.min(days, 90));
    const byDate = new Map(stats.map((stat) => [stat.date, stat]));

    return {
      xp: dates.map((date) => ({ date, value: byDate.get(date)?.xpEarned ?? 0 })),
      minutes: dates.map((date) => ({ date, value: byDate.get(date)?.minutesStudied ?? 0 })),
    };
  }, [stats, days]);

  const weekSeries = series.xp.slice(-7);
  const goalXp = enrollment?.dailyGoalXp ?? 120;

  const totalXpInRange = series.xp.reduce((sum, point) => sum + point.value, 0);
  const activeDays = series.xp.filter((point) => point.value > 0).length;
  const goalsMet = stats.filter((stat) => stat.goalMet).length;

  return (
    <Screen padded={false}>
      <Aurora seed="progress" height={280} />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: theme.layout.screenPadding,
          paddingTop: theme.space[3],
          paddingBottom: theme.space[10],
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text variant="title1" style={{ marginBottom: theme.space[5] }}>
          Progresso
        </Text>

        {/* ---------------- Nível ---------------- */}
        <Card variant="raised" padding={5}>
          <View style={{ gap: theme.space[4] }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View style={{ gap: 2 }}>
                <Text variant="overline" tone="tertiary">
                  Nível
                </Text>
                <Text variant="metric">{level.level}</Text>
              </View>

              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <Badge label={`${wallet?.totalXp ?? 0} XP total`} tone="brand" icon="flash" />
                <Badge label={`${wallet?.coins ?? 0} moedas`} tone="streak" icon="cash" />
              </View>
            </View>

            <ProgressBar
              value={level.ratio}
              accessibilityLabel="Progresso para o próximo nível"
            />
            <Text variant="caption" tone="tertiary">
              Faltam {level.xpToNextLevel} XP para o nível {level.level + 1}
            </Text>
          </View>
        </Card>

        {/* ---------------- Métricas ---------------- */}
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: theme.space[3],
            marginTop: theme.space[4],
          }}
        >
          <MetricTile
            icon="flame"
            value={String(streak?.currentStreak ?? 0)}
            label="ofensiva atual"
            hint={`recorde: ${streak?.longestStreak ?? 0}`}
            color={theme.colors.streak}
          />
          <MetricTile
            icon="time"
            value={formatDuration(totalMinutes)}
            label="estudados"
            hint="últimos 30 dias"
            color={theme.colors.brand}
          />
          <MetricTile
            icon="checkmark-done"
            value={`${Math.round(accuracy * 100)}%`}
            label="precisão"
            hint={accuracy >= 0.8 ? 'ótimo nível' : 'revise mais'}
            color={accuracy >= 0.8 ? theme.colors.success : theme.colors.warning}
          />
          <MetricTile
            icon="mic"
            value={pronunciation === null ? '—' : `${Math.round(pronunciation * 100)}%`}
            label="pronúncia"
            hint={pronunciation === null ? 'pratique fala' : 'média das sessões'}
            color={theme.colors.info}
          />
          <MetricTile
            icon="book"
            value={String(wordsLearned)}
            label="palavras novas"
            hint="últimos 30 dias"
            color={theme.colors.mastered}
          />
          <MetricTile
            icon="trophy"
            value={String(goalsMet)}
            label="metas batidas"
            hint="últimos 30 dias"
            color={theme.colors.premium}
          />
        </View>

        {/* ---------------- Evolução ---------------- */}
        <View style={{ marginTop: theme.space[8], gap: theme.space[4] }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Text variant="overline" tone="tertiary">
              Evolução
            </Text>
          </View>

          <SegmentedControl<Range>
            value={range}
            onChange={setRange}
            options={[
              { value: '7', label: 'Semana' },
              { value: '30', label: 'Mês' },
              { value: '365', label: 'Ano' },
            ]}
          />

          <Card variant="flat" padding={5}>
            <View style={{ gap: theme.space[4] }}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                }}
              >
                <Text variant="headline">XP conquistado</Text>
                <Text variant="title3" tone="brand">
                  {totalXpInRange}
                </Text>
              </View>

              {range === '7' ? (
                <BarChart data={weekSeries} unit=" XP" />
              ) : (
                <LineChart data={series.xp} />
              )}

              <Text variant="caption" tone="tertiary">
                {activeDays} de {series.xp.length} dias com estudo · meta diária de {goalXp} XP
              </Text>
            </View>
          </Card>

          <Card variant="flat" padding={5}>
            <View style={{ gap: theme.space[4] }}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                }}
              >
                <Text variant="headline">Tempo de estudo</Text>
                <Text variant="title3" tone="success">
                  {formatDuration(series.minutes.reduce((sum, point) => sum + point.value, 0))}
                </Text>
              </View>
              {range === '7' ? (
                <BarChart data={series.minutes.slice(-7)} tone="success" unit=" min" />
              ) : (
                <LineChart data={series.minutes} tone="success" />
              )}
            </View>
          </Card>
        </View>

        {/* ---------------- Calendário ---------------- */}
        <View style={{ marginTop: theme.space[8], gap: theme.space[3] }}>
          <Text variant="overline" tone="tertiary">
            Consistência
          </Text>
          <Card variant="flat" padding={5}>
            <View style={{ gap: theme.space[4] }}>
              <Text variant="footnote" tone="secondary">
                Cada quadrado é um dia. Quanto mais intenso, mais perto (ou acima) da meta.
              </Text>
              <ActivityHeatmap data={series.xp} goal={goalXp} />
            </View>
          </Card>
        </View>

        {/* ---------------- Liga ---------------- */}
        <View style={{ marginTop: theme.space[8], gap: theme.space[3] }}>
          <Text variant="overline" tone="tertiary">
            Liga semanal
          </Text>
          <Card variant="subtle" padding={5}>
            <View style={{ gap: theme.space[3] }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space[3] }}>
                <Ionicons name="trophy" size={26} color={theme.colors.streak} />
                <View style={{ flex: 1 }}>
                  <Text variant="headline">Liga {LEAGUE_LABEL.bronze}</Text>
                  <Text variant="footnote" tone="secondary">
                    {weekSeries.reduce((sum, point) => sum + point.value, 0)} XP nesta semana
                  </Text>
                </View>
              </View>

              <Text variant="caption" tone="tertiary">
                As ligas ficam ativas quando você conecta sua conta — assim conseguimos comparar
                seu ritmo com o de outros 29 estudantes na mesma faixa. Os 7 primeiros sobem de
                divisão.
              </Text>
            </View>
          </Card>
        </View>
      </ScrollView>
    </Screen>
  );
}

/**
 * Um número do painel.
 *
 * O ícone vive dentro de um disco tingido com a própria cor da métrica. Antes
 * ele era um glifo solto sobre o card, e as seis peças da grade ficavam
 * indistinguíveis: mesmo fundo, mesmo tamanho, mesma silhueta. O disco dá a
 * cada métrica uma âncora de cor, que é o que permite achar "ofensiva" sem ler
 * as seis legendas.
 */
function MetricTile({
  icon,
  value,
  label,
  hint,
  color,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
  hint: string;
  color: string;
}) {
  const theme = useTheme();

  return (
    <Card variant="flat" padding={4} style={{ flexBasis: '47%', flexGrow: 1 }}>
      <View style={{ gap: theme.space[2] }}>
        <View
          style={{
            width: 34,
            height: 34,
            borderRadius: theme.radius.pill,
            backgroundColor: alpha(color, theme.isDark ? 0.22 : 0.13),
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name={icon} size={18} color={color} />
        </View>
        <Text variant="title2">{value}</Text>
        <View style={{ gap: 2 }}>
          <Text variant="footnote" tone="secondary">
            {label}
          </Text>
          <Text variant="caption" tone="tertiary">
            {hint}
          </Text>
        </View>
      </View>
    </Card>
  );
}
