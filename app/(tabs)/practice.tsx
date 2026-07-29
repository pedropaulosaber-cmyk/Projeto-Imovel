/**
 * Aba Praticar — a casa da memória.
 *
 * Reúne tudo que não é "avançar na trilha": revisão espaçada, banco de
 * vocabulário, treino de habilidade específica.
 *
 * O card de revisão fica no topo e mostra a **previsão de carga dos próximos
 * dias**. Isso é raro em apps do gênero e resolve um problema real: sem ver
 * que a fila é finita e planejada, o usuário interpreta 80 revisões pendentes
 * como uma dívida infinita — e para de abrir o app.
 */

import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { learnerRepository } from '@/db/repositories/learner';
import { Badge, Button, Card, ProgressBar, Screen, Text, Touchable, useTheme } from '@/design';
import { averageRetention, estimateReviewMinutes, forecastLoad } from '@/domain/srs';
import type { ReviewState } from '@/domain/types';
import { weekdayInitial } from '@/lib/date';
import { useAppStore } from '@/state/app-store';

const PRACTICE_MODES = [
  {
    key: 'speaking',
    title: 'Pronúncia',
    description: 'Repita frases e receba nota palavra por palavra.',
    icon: 'mic' as const,
    route: '/practice/speaking',
  },
  {
    key: 'listening',
    title: 'Escuta',
    description: 'Diálogos com velocidade ajustável e legenda opcional.',
    icon: 'headset' as const,
    route: '/practice/listening',
  },
  {
    key: 'reading',
    title: 'Leitura',
    description: 'Textos no seu nível com tradução ao toque.',
    icon: 'newspaper' as const,
    route: '/practice/reading',
  },
  {
    key: 'writing',
    title: 'Escrita',
    description: 'Escreva e receba correção detalhada.',
    icon: 'create' as const,
    route: '/practice/writing',
  },
];

export default function Practice() {
  const theme = useTheme();
  const router = useRouter();

  const profile = useAppStore((state) => state.profile);
  const enrollment = useAppStore((state) => state.enrollment);
  const dueCount = useAppStore((state) => state.dueReviewCount);

  const [states, setStates] = useState<ReviewState[]>([]);

  const load = useCallback(async () => {
    if (!profile || !enrollment) return;
    setStates(await learnerRepository.listReviewStates(profile.id, enrollment.language));
  }, [profile, enrollment]);

  useEffect(() => {
    void load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const now = Date.now();
  const retention = averageRetention(states, now);
  const forecast = forecastLoad(states, now, 7);
  const maxForecast = Math.max(1, ...forecast.map((day) => day.count));

  const mastered = states.filter((state) => state.state === 'mastered').length;
  const learning = states.filter(
    (state) => state.state === 'learning' || state.state === 'relearning',
  ).length;
  const starred = states.filter((state) => state.starred).length;

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: theme.layout.screenPadding,
          paddingTop: theme.space[3],
          paddingBottom: theme.space[10],
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text variant="title1" style={{ marginBottom: theme.space[5] }}>
          Praticar
        </Text>

        {/* ---------------- Revisão ---------------- */}
        <Card variant={dueCount > 0 ? 'subtle' : 'flat'} padding={5}>
          <View style={{ gap: theme.space[4] }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space[3] }}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: theme.radius.md,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor:
                    dueCount > 0 ? theme.colors.brand : theme.colors.surfaceSunken,
                }}
              >
                <Ionicons
                  name="repeat"
                  size={24}
                  color={dueCount > 0 ? theme.colors.onBrand : theme.colors.textSecondary}
                />
              </View>

              <View style={{ flex: 1, gap: 2 }}>
                <Text variant="headline">
                  {dueCount > 0
                    ? `${dueCount} ${dueCount === 1 ? 'item' : 'itens'} para revisar`
                    : 'Nenhuma revisão pendente'}
                </Text>
                <Text variant="footnote" tone="secondary">
                  {dueCount > 0
                    ? `Cerca de ${estimateReviewMinutes(dueCount)} min`
                    : 'Sua memória está em dia. Volte amanhã.'}
                </Text>
              </View>
            </View>

            {dueCount > 0 ? (
              <Button
                label="Revisar agora"
                size="lg"
                fullWidth
                icon="play"
                onPress={() => router.push('/review')}
              />
            ) : null}

            {/* Previsão de carga */}
            {states.length > 0 ? (
              <View style={{ gap: theme.space[2] }}>
                <Text variant="caption" tone="tertiary">
                  Próximos 7 dias
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'flex-end',
                    justifyContent: 'space-between',
                    height: 68,
                  }}
                >
                  {forecast.map((day, index) => (
                    <View key={day.date} style={{ alignItems: 'center', gap: 5, flex: 1 }}>
                      <Text variant="caption" tone="tertiary">
                        {day.count > 0 ? day.count : ''}
                      </Text>
                      <View
                        style={{
                          width: 20,
                          height: Math.max(4, (day.count / maxForecast) * 38),
                          borderRadius: 4,
                          backgroundColor:
                            index === 0 ? theme.colors.brand : theme.colors.brandBorder,
                        }}
                      />
                      <Text variant="caption" tone="tertiary">
                        {weekdayInitial(day.date)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}
          </View>
        </Card>

        {/* ---------------- Saúde da memória ---------------- */}
        {states.length > 0 ? (
          <Card variant="outlined" padding={5} style={{ marginTop: theme.space[4] }}>
            <View style={{ gap: theme.space[4] }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text variant="headline">Saúde da memória</Text>
                <Text variant="headline" tone={retention >= 0.85 ? 'success' : 'warning'}>
                  {Math.round(retention * 100)}%
                </Text>
              </View>

              <ProgressBar
                value={retention}
                tone={retention >= 0.85 ? 'success' : 'brand'}
                accessibilityLabel="Retenção prevista"
              />

              <Text variant="caption" tone="tertiary">
                Probabilidade média de você lembrar dos itens que já estudou, agora. Abaixo de
                85% significa que há revisão atrasada.
              </Text>

              <View style={{ flexDirection: 'row', gap: theme.space[3] }}>
                <Stat value={String(states.length)} label="no total" />
                <Stat value={String(mastered)} label="dominadas" tone={theme.colors.mastered} />
                <Stat
                  value={String(learning)}
                  label="aprendendo"
                  tone={theme.colors.learning}
                />
                <Stat value={String(starred)} label="favoritas" tone={theme.colors.streak} />
              </View>
            </View>
          </Card>
        ) : null}

        {/* ---------------- Modos de prática ---------------- */}
        <View style={{ marginTop: theme.space[8], gap: theme.space[3] }}>
          <Text variant="overline" tone="tertiary">
            Treinar uma habilidade
          </Text>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space[3] }}>
            {PRACTICE_MODES.map((mode) => (
              <Touchable
                key={mode.key}
                onPress={() => router.push(mode.route as never)}
                haptic="light"
                pressedScale={0.98}
                style={{ flexBasis: '47%', flexGrow: 1 }}
              >
                <Card variant="flat" padding={4}>
                  <View style={{ gap: theme.space[2], minHeight: 116 }}>
                    <View
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: theme.radius.sm,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: theme.colors.brandSubtle,
                      }}
                    >
                      <Ionicons name={mode.icon} size={19} color={theme.colors.brand} />
                    </View>
                    <Text variant="headline">{mode.title}</Text>
                    <Text variant="caption" tone="secondary">
                      {mode.description}
                    </Text>
                  </View>
                </Card>
              </Touchable>
            ))}
          </View>
        </View>

        {/* ---------------- Biblioteca ---------------- */}
        <View style={{ marginTop: theme.space[8], gap: theme.space[3] }}>
          <Text variant="overline" tone="tertiary">
            Sua biblioteca
          </Text>

          <LibraryRow
            icon="bookmarks"
            title="Banco de palavras"
            subtitle={`${states.length} termos · buscar, favoritar e ouvir`}
            onPress={() => router.push('/vocabulary')}
          />

          <LibraryRow
            icon="chatbox-ellipses"
            title="Expressões idiomáticas"
            subtitle="O que os nativos dizem — e o que aquilo significa em português"
            onPress={() => router.push('/idioms')}
          />

          <LibraryRow
            icon="library"
            title="Apostilas"
            subtitle="Uma por nível, para consultar offline a qualquer momento"
            onPress={() => router.push('/workbooks')}
          />
        </View>

        {profile?.plan === 'free' ? (
          <Card variant="subtle" padding={4} style={{ marginTop: theme.space[6] }}>
            <View style={{ gap: theme.space[3] }}>
              <Badge label="Premium" tone="premium" icon="star" />
              <Text variant="callout">
                Assinantes têm correção de redação por IA, conversas ilimitadas com o tutor e
                download de todos os idiomas.
              </Text>
              <Button
                label="Conhecer o Premium"
                variant="secondary"
                onPress={() => router.push('/paywall')}
              />
            </View>
          </Card>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

/** Linha de acesso à biblioteca: vocabulário, expressões e apostilas. */
function LibraryRow({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <Touchable onPress={onPress} haptic="light" pressedScale={0.99}>
      <Card variant="flat" padding={4}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space[3] }}>
          <Ionicons name={icon} size={22} color={theme.colors.brand} />
          <View style={{ flex: 1 }}>
            <Text variant="headline">{title}</Text>
            <Text variant="caption" tone="secondary">
              {subtitle}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.colors.textTertiary} />
        </View>
      </Card>
    </Touchable>
  );
}

function Stat({ value, label, tone }: { value: string; label: string; tone?: string }) {
  return (
    <View style={{ flex: 1, gap: 2 }}>
      <Text variant="title3" style={tone ? { color: tone } : undefined}>
        {value}
      </Text>
      <Text variant="caption" tone="tertiary">
        {label}
      </Text>
    </View>
  );
}
