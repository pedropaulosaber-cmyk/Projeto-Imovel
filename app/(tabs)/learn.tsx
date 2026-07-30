/**
 * Tela principal — o plano de hoje e a trilha.
 *
 * A decisão de design mais importante aqui: **o topo da tela responde "o que
 * eu faço agora?"**, não "onde eu estou". Um usuário que abre o app com 8
 * minutos livres não quer navegar por uma árvore de módulos; quer um botão.
 *
 * A trilha completa vem logo abaixo, para quem quer explorar — mas nunca antes
 * da próxima ação.
 */

import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';

import { trackIntro } from '@/content/goal-tracks';
import { LANGUAGE_META } from '@/content/vocabulary';
import {
  Aurora,
  Badge,
  Card,
  LanguageScene,
  ProgressRing,
  Screen,
  Spot,
  Text,
  Touchable,
  useTheme,
} from '@/design';
import { canOpenLesson, hasFullAccess } from '@/domain/access';
import type { Lesson, PlanBlock } from '@/domain/types';
import { formatDuration } from '@/lib/date';
import { selectGoalRatio, selectTodayXp, useAppStore } from '@/state/app-store';

export default function Learn() {
  const theme = useTheme();
  const router = useRouter();

  const profile = useAppStore((state) => state.profile);
  const enrollment = useAppStore((state) => state.enrollment);
  const plan = useAppStore((state) => state.plan);
  const streak = useAppStore((state) => state.streak);
  const lessons = useAppStore((state) => state.lessons);
  const lessonProgress = useAppStore((state) => state.lessonProgress);
  const refresh = useAppStore((state) => state.refresh);
  const todayXp = useAppStore(selectTodayXp);
  const goalRatio = useAppStore(selectGoalRatio);

  // Recarrega ao voltar para a aba: o usuário pode ter concluído uma lição e
  // precisa ver o progresso atualizado imediatamente.
  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  if (!enrollment || !plan) {
    return (
      <Screen>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text tone="secondary">Carregando sua trilha…</Text>
        </View>
      </Screen>
    );
  }

  const meta = LANGUAGE_META[enrollment.language];
  const goalMet = todayXp >= enrollment.dailyGoalXp;

  return (
    <Screen padded={false} scroll={false}>
      {/*
        Fundo ambiente. Fica atrás do conteúdo e não recebe toque — existe para
        dar profundidade ao topo da tela, não para ser visto como um elemento.
      */}
      <Aurora seed={`learn-${enrollment.language}`} height={320} />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: theme.layout.screenPadding,
          paddingBottom: theme.space[10],
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={() => void refresh()}
            tintColor={theme.colors.brand}
          />
        }
      >
        {/* ------------ Cabeçalho ------------ */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: theme.space[3],
            paddingBottom: theme.space[5],
          }}
        >
          <View style={{ gap: 2 }}>
            <Text variant="footnote" tone="secondary">
              {greeting()}
              {profile?.displayName ? `, ${profile.displayName.split(' ')[0]}` : ''}
            </Text>
            <Touchable
              onPress={() => router.push('/(tabs)/profile')}
              haptic="light"
              ensureTouchTarget={false}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
            >
              <Text variant="title3">
                {meta.flag} {meta.name}
              </Text>
              <Ionicons name="chevron-down" size={16} color={theme.colors.textTertiary} />
            </Touchable>
          </View>

          <View style={{ flexDirection: 'row', gap: theme.space[2] }}>
            <StatPill
              icon="flame"
              value={String(streak?.currentStreak ?? 0)}
              tone={theme.colors.streak}
            />
            <StatPill icon="flash" value={String(todayXp)} tone={theme.colors.brand} />
          </View>
        </View>

        {/* ------------ Meta do dia ------------ */}
        {/*
          A cena fica no topo do card, e não como fundo atrás do texto: sobre a
          ilustração, o número da meta perderia contraste — e o número é a
          informação mais importante da tela.
        */}
        <Card variant="raised" padding={0} style={{ overflow: 'hidden' }}>
          <LanguageScene
            language={enrollment.language}
            height={112}
            label={`Paisagem que representa ${meta.name}`}
          />

          <View
            style={{
              padding: theme.space[5],
              flexDirection: 'row',
              alignItems: 'center',
              gap: theme.space[5],
            }}
          >
            <ProgressRing
              value={goalRatio}
              size={104}
              thickness={11}
              tone={goalMet ? 'success' : 'brand'}
              label="Meta diária"
            >
              <View style={{ alignItems: 'center' }}>
                {goalMet ? (
                  <Ionicons name="checkmark" size={30} color={theme.colors.success} />
                ) : (
                  <>
                    <Text variant="title3">{todayXp}</Text>
                    <Text variant="caption" tone="tertiary">
                      /{enrollment.dailyGoalXp}
                    </Text>
                  </>
                )}
              </View>
            </ProgressRing>

            <View style={{ flex: 1, gap: theme.space[2] }}>
              <Text variant="headline">
                {goalMet
                  ? 'Meta batida hoje!'
                  : `Faltam ${enrollment.dailyGoalXp - todayXp} XP`}
              </Text>
              <Text variant="footnote" tone="secondary">
                {goalMet
                  ? 'Sua ofensiva está garantida. Tudo daqui em diante é bônus.'
                  : `Cerca de ${formatDuration(plan.targetMinutes)} de estudo.`}
              </Text>
              {streak && streak.currentStreak > 0 ? (
                <Badge
                  label={`${streak.currentStreak} ${streak.currentStreak === 1 ? 'dia' : 'dias'} seguidos`}
                  tone="streak"
                  icon="flame"
                />
              ) : null}
            </View>
          </View>
        </Card>

        {/* ------------ Plano de hoje ------------ */}
        <View style={{ marginTop: theme.space[8], gap: theme.space[3] }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Text variant="overline" tone="tertiary">
              Seu plano de hoje
            </Text>
            <Text variant="caption" tone="tertiary">
              {formatDuration(
                plan.blocks.reduce((sum, block) => sum + block.estimatedMinutes, 0),
              )}
            </Text>
          </View>

          {plan.blocks.length === 0 ? (
            <Card variant="subtle" padding={6}>
              <View style={{ alignItems: 'center', gap: theme.space[3] }}>
                <Spot name="done" size={84} tone="success" />
                <Text variant="headline" align="center">
                  Tudo em dia por hoje
                </Text>
                <Text variant="footnote" tone="secondary" align="center">
                  Volte amanhã ou continue no ritmo livre.
                </Text>
              </View>
            </Card>
          ) : (
            plan.blocks.map((block, index) => (
              <PlanBlockCard
                key={`${block.kind}-${index}`}
                block={block}
                primary={index === 0}
                onPress={() => router.push(block.route as never)}
              />
            ))
          )}
        </View>

        {/* ------------ Trilha ------------ */}
        <View style={{ marginTop: theme.space[10], gap: theme.space[3] }}>
          <Text variant="overline" tone="tertiary">
            Sua trilha
          </Text>

          {/*
            O aluno respondeu por que quer aprender; ele precisa **ver** que
            isso mudou alguma coisa. Um onboarding que pergunta e não usa é pior
            que um onboarding que não pergunta.
          */}
          {enrollment && enrollment.goals.length > 0 ? (
            <Card variant="subtle" padding={4}>
              <View style={{ flexDirection: 'row', gap: theme.space[3] }}>
                <Ionicons name="navigate" size={20} color={theme.colors.brand} />
                <Text variant="caption" tone="secondary" flex>
                  {trackIntro(enrollment.goals)}
                </Text>
              </View>
            </Card>
          ) : null}

          {lessons.map((lesson, index) => {
            const progress = lessonProgress[lesson.id];
            const previous = lessons[index - 1];
            const previousDone =
              !previous || lessonProgress[previous.id]?.status === 'completed';

            return (
              <LessonRow
                key={lesson.id}
                lesson={lesson}
                completed={progress?.status === 'completed'}
                accuracy={progress?.bestAccuracy ?? null}
                locked={!previousDone}
                isPremiumUser={hasFullAccess(profile)}
                onPress={() => {
                  if (!canOpenLesson(profile, lesson)) {
                    router.push('/paywall');
                  } else {
                    router.push(`/lesson/${lesson.id}` as never);
                  }
                }}
              />
            );
          })}
        </View>
      </ScrollView>
    </Screen>
  );
}

/* ------------------------------------------------------------------ *
 * Peças
 * ------------------------------------------------------------------ */

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return 'Boa madrugada';
  if (hour < 12) return 'Bom dia';
  if (hour < 19) return 'Boa tarde';
  return 'Boa noite';
}

function StatPill({
  icon,
  value,
  tone,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  tone: string;
}) {
  const theme = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 11,
        height: 34,
        borderRadius: theme.radius.pill,
        backgroundColor: theme.colors.surfaceSunken,
      }}
    >
      <Ionicons name={icon} size={15} color={tone} />
      <Text variant="subhead" style={{ color: tone }}>
        {value}
      </Text>
    </View>
  );
}

function PlanBlockCard({
  block,
  primary,
  onPress,
}: {
  block: PlanBlock;
  primary: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <Touchable onPress={onPress} haptic="medium" pressedScale={0.985}>
      <Card variant={primary ? 'subtle' : 'flat'} padding={4}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space[3] }}>
          <View
            style={{
              width: 46,
              height: 46,
              borderRadius: theme.radius.md,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: primary ? theme.colors.brand : theme.colors.surfaceSunken,
            }}
          >
            <Ionicons
              name={block.icon as keyof typeof Ionicons.glyphMap}
              size={22}
              color={primary ? theme.colors.onBrand : theme.colors.textSecondary}
            />
          </View>

          <View style={{ flex: 1, gap: 3 }}>
            <Text variant="headline" numberOfLines={1}>
              {block.title}
            </Text>
            <Text variant="footnote" tone="secondary" numberOfLines={2}>
              {block.description}
            </Text>
          </View>

          <View style={{ alignItems: 'flex-end', gap: 3 }}>
            <Text variant="caption" tone="tertiary">
              {block.estimatedMinutes} min
            </Text>
            <Text variant="caption" tone="brand">
              +{block.xpReward} XP
            </Text>
          </View>
        </View>
      </Card>
    </Touchable>
  );
}

function LessonRow({
  lesson,
  completed,
  accuracy,
  locked,
  isPremiumUser,
  onPress,
}: {
  lesson: Lesson;
  completed: boolean;
  accuracy: number | null;
  locked: boolean;
  isPremiumUser: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const needsPremium = lesson.premium && !isPremiumUser;

  const iconByKind: Record<string, keyof typeof Ionicons.glyphMap> = {
    vocabulary: 'book',
    grammar: 'construct',
    listening: 'headset',
    speaking: 'mic',
    reading: 'newspaper',
    writing: 'create',
    conversation: 'chatbubbles',
    shadowing: 'mic-circle',
    review: 'repeat',
    checkpoint: 'ribbon',
    project: 'trophy',
  };

  return (
    <Touchable
      onPress={onPress}
      disabled={locked}
      haptic="light"
      pressedScale={0.99}
      accessibilityLabel={`${lesson.title}${completed ? ', concluída' : ''}${locked ? ', bloqueada' : ''}`}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.space[3],
        padding: theme.space[3],
        borderRadius: theme.radius.lg,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: completed ? theme.colors.successBorder : theme.colors.border,
        opacity: locked ? 0.45 : 1,
      }}
    >
      <View
        style={{
          width: 42,
          height: 42,
          borderRadius: theme.radius.md,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: completed ? theme.colors.successSubtle : theme.colors.surfaceSunken,
        }}
      >
        <Ionicons
          name={
            locked
              ? 'lock-closed'
              : completed
                ? 'checkmark'
                : (iconByKind[lesson.kind] ?? 'ellipse')
          }
          size={20}
          color={completed ? theme.colors.success : theme.colors.textSecondary}
        />
      </View>

      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="callout" numberOfLines={1}>
          {lesson.title}
        </Text>
        <Text variant="caption" tone="tertiary">
          {lesson.estimatedMinutes} min · {lesson.xpReward} XP
          {accuracy !== null ? ` · ${Math.round(accuracy * 100)}% de acerto` : ''}
        </Text>
      </View>

      {needsPremium ? <Badge label="Premium" tone="premium" icon="star" /> : null}
    </Touchable>
  );
}
