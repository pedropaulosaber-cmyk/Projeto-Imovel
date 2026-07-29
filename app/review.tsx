/**
 * Sessão de revisão espaçada.
 *
 * Diferente da lição, aqui **não há vidas e não há erro fatal**. Revisão é
 * diagnóstico, não prova: o objetivo é descobrir o que está esquecido e
 * reagendar. Punir o erro faria o usuário evitar os itens difíceis — que são
 * exatamente os que precisam de revisão.
 *
 * O usuário vê o item, tenta lembrar, revela e avalia. As quatro notas
 * (De novo / Difícil / Bom / Fácil) mapeiam direto na escala do SRS, e o app
 * mostra **quando cada opção traz o item de volta** — transparência que faz o
 * usuário confiar no agendamento em vez de tentar burlá-lo.
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { contentRepository } from '@/db/repositories/content';
import { learnerRepository } from '@/db/repositories/learner';
import { Badge, Button, Card, SegmentedProgress, Text, Touchable, useTheme } from '@/design';
import { hasFullAccess } from '@/domain/access';
import { schedule } from '@/domain/srs';
import type { ReviewGrade, ReviewState, VocabularyItem } from '@/domain/types';
import { speechService } from '@/services/speech';
import { useAppStore } from '@/state/app-store';

type QueueItem = { state: ReviewState; item: VocabularyItem | null };

const GRADES: {
  grade: ReviewGrade;
  label: string;
  tone: 'danger' | 'warning' | 'brand' | 'success';
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { grade: 'again', label: 'De novo', tone: 'danger', icon: 'refresh' },
  { grade: 'hard', label: 'Difícil', tone: 'warning', icon: 'trending-down' },
  { grade: 'good', label: 'Bom', tone: 'brand', icon: 'checkmark' },
  { grade: 'easy', label: 'Fácil', tone: 'success', icon: 'flash' },
];

export default function Review() {
  const theme = useTheme();
  const router = useRouter();

  const profile = useAppStore((state) => state.profile);
  const enrollment = useAppStore((state) => state.enrollment);
  const refresh = useAppStore((state) => state.refresh);

  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reviewed, setReviewed] = useState(0);
  const [startedAt] = useState(Date.now());

  /* Monta a fila uma única vez ao abrir. */
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      if (!profile || !enrollment) {
        setLoading(false);
        return;
      }

      const states = await learnerRepository.buildTodayQueue({
        userId: profile.id,
        language: enrollment.language,
      });

      const items = await contentRepository.getVocabularyItems(
        states.map((state) => state.conceptId),
      );
      const byId = new Map(items.map((item) => [item.id, item]));

      if (cancelled) return;
      setQueue(states.map((state) => ({ state, item: byId.get(state.conceptId) ?? null })));
      setLoading(false);
    })();

    return () => {
      cancelled = true;
      void speechService.stop();
    };
  }, [profile, enrollment]);

  const current = queue[index];

  /** Pré-visualização do intervalo de cada nota, para a transparência do SRS. */
  const intervals = useMemo(() => {
    if (!current) return null;
    const now = Date.now();

    return GRADES.reduce<Record<ReviewGrade, string>>(
      (acc, { grade }) => {
        const { intervalDays } = schedule(current.state, grade, now);
        acc[grade] = formatInterval(intervalDays);
        return acc;
      },
      { again: '', hard: '', good: '', easy: '' },
    );
  }, [current]);

  const grade = useCallback(
    async (value: ReviewGrade) => {
      if (!current) return;

      await learnerRepository.gradeReview(current.state, value);
      setReviewed((count) => count + 1);

      // "De novo" reinsere o item três posições à frente — perto o bastante
      // para reforçar na mesma sessão, longe o bastante para não ser cópia.
      if (value === 'again') {
        setQueue((previous) => {
          const next = [...previous];
          const [item] = next.splice(index, 1);
          if (item) next.splice(Math.min(index + 3, next.length), 0, item);
          return next;
        });
      } else {
        setIndex((value_) => value_ + 1);
      }

      setRevealed(false);
    },
    [current, index],
  );

  const finish = useCallback(async () => {
    if (profile && enrollment && reviewed > 0) {
      const minutes = Math.max(1, Math.round((Date.now() - startedAt) / 60_000));
      const stat = await learnerRepository.accumulateDailyStat({
        userId: profile.id,
        dailyGoalXp: enrollment.dailyGoalXp,
        delta: { xpEarned: reviewed * 4, minutesStudied: minutes, reviewsCompleted: reviewed },
      });
      await learnerRepository.addXp(profile.id, reviewed * 4);

      if (stat.goalMet) {
        await learnerRepository.registerGoalMet(profile.id, hasFullAccess(profile));
      }
    }

    await refresh();
    router.back();
  }, [profile, enrollment, reviewed, startedAt, refresh, router]);

  if (loading) {
    return (
      <Centered>
        <Text tone="secondary">Montando sua fila…</Text>
      </Centered>
    );
  }

  /* Fila vazia ou concluída */
  if (!current) {
    return (
      <Centered>
        <Ionicons name="checkmark-circle" size={60} color={theme.colors.success} />
        <Text variant="title2" align="center">
          {reviewed > 0 ? 'Revisão concluída!' : 'Nada para revisar agora'}
        </Text>
        {reviewed > 0 ? (
          <Badge label={`+${reviewed * 4} XP · ${reviewed} itens`} tone="brand" icon="flash" />
        ) : (
          <Text variant="callout" tone="secondary" align="center">
            Sua memória está em dia. Novos itens entram na fila conforme você avança na trilha.
          </Text>
        )}
        <Button label="Voltar" size="lg" onPress={() => void finish()} />
      </Centered>
    );
  }

  const item = current.item;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Topo */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.space[3],
          paddingHorizontal: theme.layout.screenPadding,
          paddingTop: theme.space[12],
          paddingBottom: theme.space[3],
        }}
      >
        <Touchable
          onPress={() => void finish()}
          haptic="light"
          accessibilityLabel="Encerrar revisão"
          ensureTouchTarget={false}
          style={{ width: 32, height: 32, justifyContent: 'center' }}
        >
          <Ionicons name="close" size={26} color={theme.colors.textTertiary} />
        </Touchable>
        <SegmentedProgress total={queue.length} completed={index} style={{ flex: 1 }} />
        <Text variant="caption" tone="tertiary">
          {index + 1}/{queue.length}
        </Text>
      </View>

      {/* Cartão */}
      <View
        style={{
          flex: 1,
          padding: theme.layout.screenPadding,
          justifyContent: 'center',
          maxWidth: theme.layout.maxContentWidth,
          width: '100%',
          alignSelf: 'center',
        }}
      >
        <Card variant="raised" padding={8}>
          <View
            style={{
              gap: theme.space[5],
              alignItems: 'center',
              minHeight: 220,
              justifyContent: 'center',
            }}
          >
            <Text variant="target" align="center">
              {item?.term ?? current.state.conceptId}
            </Text>

            {item?.phonetic ? (
              <Text
                variant="footnote"
                tone="tertiary"
                style={{ fontFamily: theme.fontFamily.mono }}
              >
                /{item.phonetic}/
              </Text>
            ) : null}

            <Touchable
              onPress={() =>
                item && enrollment
                  ? void speechService.speak(item.term, { language: enrollment.language })
                  : undefined
              }
              haptic="light"
              accessibilityLabel="Ouvir pronúncia"
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
            >
              <Ionicons name="volume-medium" size={20} color={theme.colors.brand} />
              <Text variant="subhead" tone="brand">
                Ouvir
              </Text>
            </Touchable>

            {revealed ? (
              <Animated.View
                entering={FadeIn.duration(theme.duration.fast)}
                style={{ gap: theme.space[3], alignItems: 'center' }}
              >
                <View
                  style={{
                    height: 1,
                    width: 120,
                    backgroundColor: theme.colors.divider,
                  }}
                />
                <Text variant="title3" align="center">
                  {item?.translation ?? '—'}
                </Text>
                {item?.exampleSentence ? (
                  <View style={{ gap: 4, alignItems: 'center' }}>
                    <Text variant="callout" tone="secondary" align="center">
                      {item.exampleSentence}
                    </Text>
                    <Text variant="footnote" tone="tertiary" align="center">
                      {item.exampleTranslation}
                    </Text>
                  </View>
                ) : null}
              </Animated.View>
            ) : null}
          </View>
        </Card>
      </View>

      {/* Ações */}
      <View
        style={{
          paddingHorizontal: theme.layout.screenPadding,
          paddingBottom: theme.space[10],
          gap: theme.space[3],
          maxWidth: theme.layout.maxContentWidth,
          width: '100%',
          alignSelf: 'center',
        }}
      >
        {revealed ? (
          <Animated.View
            entering={FadeIn.duration(theme.duration.fast)}
            style={{ gap: theme.space[2] }}
          >
            <Text variant="caption" tone="tertiary" align="center">
              Quanto você lembrou?
            </Text>
            <View style={{ flexDirection: 'row', gap: theme.space[2] }}>
              {GRADES.map(({ grade: value, label, tone, icon }) => (
                <Touchable
                  key={value}
                  onPress={() => void grade(value)}
                  haptic={value === 'again' ? 'warning' : 'success'}
                  pressedScale={0.95}
                  style={{
                    flex: 1,
                    paddingVertical: theme.space[3],
                    borderRadius: theme.radius.lg,
                    alignItems: 'center',
                    gap: 3,
                    backgroundColor:
                      tone === 'danger'
                        ? theme.colors.dangerSubtle
                        : tone === 'warning'
                          ? theme.colors.warningSubtle
                          : tone === 'success'
                            ? theme.colors.successSubtle
                            : theme.colors.brandSubtle,
                  }}
                >
                  <Ionicons
                    name={icon}
                    size={17}
                    color={
                      tone === 'danger'
                        ? theme.colors.danger
                        : tone === 'warning'
                          ? theme.colors.warning
                          : tone === 'success'
                            ? theme.colors.success
                            : theme.colors.brand
                    }
                  />
                  <Text variant="caption" tone={tone === 'brand' ? 'brand' : tone}>
                    {label}
                  </Text>
                  {/* Mostrar o intervalo torna o SRS auditável pelo usuário. */}
                  <Text variant="caption" tone="tertiary">
                    {intervals?.[value]}
                  </Text>
                </Touchable>
              ))}
            </View>
          </Animated.View>
        ) : (
          <Button
            label="Mostrar resposta"
            size="lg"
            fullWidth
            onPress={() => setRevealed(true)}
          />
        )}
      </View>
    </View>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  const theme = useTheme();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.space[4],
        padding: theme.space[6],
      }}
    >
      {children}
    </View>
  );
}

/** '10 min', '3 d', '2 mes' — curto o bastante para caber no botão. */
function formatInterval(days: number): string {
  if (days < 1) {
    const minutes = Math.round(days * 24 * 60);
    return `${minutes} min`;
  }
  if (days < 30) return `${Math.round(days)} d`;
  if (days < 365) return `${Math.round(days / 30)} mes`;
  return `${(days / 365).toFixed(1)} a`;
}
