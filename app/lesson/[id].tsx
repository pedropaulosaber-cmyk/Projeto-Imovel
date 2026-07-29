/**
 * Executor de lição — a tela mais importante do app.
 *
 * Estrutura em três camadas fixas, que nunca mudam de lugar:
 *  - **topo**: sair, progresso segmentado, vidas;
 *  - **meio**: o exercício (rolável);
 *  - **base**: a ação, sempre na zona do polegar.
 *
 * Manter a ação sempre no mesmo lugar é o que permite fazer uma sessão inteira
 * sem olhar para os botões — que é o objetivo. O usuário deve pensar no idioma,
 * não na interface.
 */

import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect } from 'react';
import { ScrollView, View } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown } from 'react-native-reanimated';

import { Badge, Button, Card, SegmentedProgress, Text, Touchable, useTheme } from '@/design';
import type { UserAnswer } from '@/domain/grading';
import { ExerciseRenderer } from '@/features/exercises/ExerciseRenderer';
import { formatDuration } from '@/lib/date';
import { useAppStore } from '@/state/app-store';
import { useLessonStore } from '@/state/lesson-store';

export default function LessonScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const profile = useAppStore((state) => state.profile);
  const enrollment = useAppStore((state) => state.enrollment);
  const refresh = useAppStore((state) => state.refresh);

  // Seletores granulares em vez de `useLessonStore()` inteiro: assinar a store
  // toda faria esta tela re-renderizar a cada tecla digitada num exercício.
  // As ações do Zustand são referências estáveis, então podem entrar nas
  // dependências dos hooks sem causar reexecução.
  const phase = useLessonStore((state) => state.phase);
  const exercises = useLessonStore((state) => state.exercises);
  const index = useLessonStore((state) => state.index);
  const hearts = useLessonStore((state) => state.hearts);
  const lastResult = useLessonStore((state) => state.lastResult);
  const retryQueue = useLessonStore((state) => state.retryQueue);
  const hintUsed = useLessonStore((state) => state.hintUsed);
  const summary = useLessonStore((state) => state.summary);
  const start = useLessonStore((state) => state.start);
  const submit = useLessonStore((state) => state.submit);
  const advance = useLessonStore((state) => state.advance);
  const useHint = useLessonStore((state) => state.useHint);
  const abandon = useLessonStore((state) => state.abandon);

  const isPremium = profile?.plan !== undefined && profile.plan !== 'free';

  useEffect(() => {
    if (id) void start(id, isPremium);
    return () => abandon();
  }, [id, isPremium, start, abandon]);

  const exercise = exercises[index];

  const handleAnswer = useCallback(
    (answer: UserAnswer) => {
      void submit(answer);
    },
    [submit],
  );

  const exit = useCallback(() => {
    abandon();
    void refresh();
    router.back();
  }, [abandon, refresh, router]);

  /* ---------------- Conclusão ---------------- */
  if (phase === 'complete' && summary) {
    return <LessonComplete summary={summary} onDone={exit} />;
  }

  /* ---------------- Sem vidas ---------------- */
  if (phase === 'failed') {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colors.background,
          padding: theme.space[6],
          justifyContent: 'center',
          gap: theme.space[5],
        }}
      >
        <Ionicons name="heart-dislike" size={54} color={theme.colors.danger} />
        <Text variant="title1">Suas vidas acabaram</Text>
        <Text variant="callout" tone="secondary">
          Sem problema — errar faz parte. Você pode revisar o conteúdo e tentar de novo, ou
          assinar o Premium para ter vidas infinitas.
        </Text>
        <View style={{ gap: theme.space[2] }}>
          <Button
            label="Ver planos"
            variant="primary"
            size="lg"
            fullWidth
            icon="star"
            onPress={() => router.replace('/paywall')}
          />
          <Button
            label="Voltar à trilha"
            variant="secondary"
            size="lg"
            fullWidth
            onPress={exit}
          />
        </View>
      </View>
    );
  }

  /* ---------------- Erro / carregando ---------------- */
  if (phase === 'error') {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colors.background,
          padding: theme.space[6],
          justifyContent: 'center',
          gap: theme.space[4],
        }}
      >
        <Text variant="title3">Não foi possível abrir esta lição</Text>
        <Text variant="footnote" tone="secondary">
          O conteúdo pode não ter sido baixado ainda. Verifique a tela de downloads.
        </Text>
        <Button label="Voltar" onPress={exit} />
      </View>
    );
  }

  if (!exercise || !enrollment) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colors.background,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text tone="secondary">Preparando a lição…</Text>
      </View>
    );
  }

  const showingFeedback = phase === 'feedback';
  const result = lastResult;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* ---------------- Topo ---------------- */}
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
          onPress={exit}
          haptic="light"
          accessibilityLabel="Sair da lição"
          ensureTouchTarget={false}
          style={{ width: 32, height: 32, justifyContent: 'center' }}
        >
          <Ionicons name="close" size={26} color={theme.colors.textTertiary} />
        </Touchable>

        <SegmentedProgress total={exercises.length} completed={index} style={{ flex: 1 }} />

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons name="heart" size={17} color={theme.colors.danger} />
          <Text variant="subhead" tone="danger">
            {hearts === Number.POSITIVE_INFINITY ? '∞' : hearts}
          </Text>
        </View>
      </View>

      {/* ---------------- Exercício ---------------- */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: theme.layout.screenPadding,
          paddingBottom: theme.space[24],
          maxWidth: theme.layout.maxContentWidth,
          width: '100%',
          alignSelf: 'center',
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* `key` remonta o renderizador a cada exercício: o rascunho da
            resposta anterior nunca vaza para o próximo item. */}
        <ExerciseRenderer
          key={exercise.id}
          exercise={exercise}
          language={enrollment.language}
          locked={showingFeedback}
          onAnswer={handleAnswer}
        />

        {/* Dica: custa parte do XP, então fica discreta e explícita. */}
        {!showingFeedback && exercise.hint && !hintUsed ? (
          <Touchable
            onPress={useHint}
            haptic="light"
            style={{
              marginTop: theme.space[5],
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: theme.space[2],
            }}
          >
            <Ionicons name="bulb-outline" size={17} color={theme.colors.textTertiary} />
            <Text variant="footnote" tone="tertiary">
              Ver dica (vale menos XP)
            </Text>
          </Touchable>
        ) : null}

        {hintUsed && exercise.hint ? (
          <Animated.View entering={FadeIn.duration(theme.duration.fast)}>
            <Card variant="outlined" padding={3} style={{ marginTop: theme.space[4] }}>
              <Text variant="footnote" tone="secondary">
                💡 {exercise.hint}
              </Text>
            </Card>
          </Animated.View>
        ) : null}
      </ScrollView>

      {/* ---------------- Feedback ---------------- */}
      {showingFeedback && result ? (
        <Animated.View
          entering={SlideInDown.duration(theme.duration.normal)}
          exiting={FadeOut.duration(theme.duration.fast)}
          style={{
            backgroundColor: result.correct
              ? theme.colors.successSubtle
              : theme.colors.dangerSubtle,
            borderTopWidth: 1,
            borderTopColor: result.correct
              ? theme.colors.successBorder
              : theme.colors.dangerBorder,
            paddingHorizontal: theme.layout.screenPadding,
            paddingTop: theme.space[4],
            paddingBottom: theme.space[8],
            gap: theme.space[3],
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space[2] }}>
            <Ionicons
              name={result.correct ? 'checkmark-circle' : 'close-circle'}
              size={26}
              color={result.correct ? theme.colors.success : theme.colors.danger}
            />
            <Text variant="headline" tone={result.correct ? 'success' : 'danger'} flex>
              {result.feedback}
            </Text>
          </View>

          {!result.correct && result.correctAnswer ? (
            <View style={{ gap: 3 }}>
              <Text variant="caption" tone="secondary">
                Resposta correta
              </Text>
              <Text variant="callout" weight="600">
                {result.correctAnswer}
              </Text>
            </View>
          ) : null}

          {result.explanation ? (
            <Text variant="footnote" tone="secondary">
              {result.explanation}
            </Text>
          ) : null}

          <Button
            label={
              index + 1 >= exercises.length && retryQueue.length === 0
                ? 'Concluir'
                : 'Continuar'
            }
            variant={result.correct ? 'success' : 'danger'}
            size="lg"
            fullWidth
            onPress={() => void advance()}
          />
        </Animated.View>
      ) : null}
    </View>
  );
}

/* ------------------------------------------------------------------ *
 * Tela de conclusão
 * ------------------------------------------------------------------ */

/**
 * A recompensa.
 *
 * O detalhamento do XP (em vez de só o total) existe porque ele **ensina o
 * sistema**: o usuário descobre que acertar sem dica e manter a ofensiva rende
 * mais, e passa a jogar melhor — o que, neste app, significa estudar melhor.
 */
function LessonComplete({
  summary,
  onDone,
}: {
  summary: {
    xp: number;
    breakdown: { label: string; xp: number }[];
    accuracy: number;
    durationMinutes: number;
    newWords: number;
  };
  onDone: () => void;
}) {
  const theme = useTheme();
  const perfect = summary.accuracy === 1;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.colors.background,
        padding: theme.space[6],
        paddingTop: theme.space[20],
        justifyContent: 'space-between',
      }}
    >
      <Animated.View
        entering={FadeIn.duration(theme.duration.slow)}
        style={{ gap: theme.space[6] }}
      >
        <View style={{ alignItems: 'center', gap: theme.space[4] }}>
          <View
            style={{
              width: 96,
              height: 96,
              borderRadius: 48,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: perfect ? theme.colors.streakSubtle : theme.colors.successSubtle,
            }}
          >
            <Ionicons
              name={perfect ? 'trophy' : 'checkmark-circle'}
              size={48}
              color={perfect ? theme.colors.streak : theme.colors.success}
            />
          </View>

          <Text variant="title1" align="center">
            {perfect ? 'Lição perfeita!' : 'Lição concluída'}
          </Text>

          <Badge label={`+${summary.xp} XP`} tone="brand" icon="flash" />
        </View>

        <Card variant="flat" padding={5}>
          <View style={{ gap: theme.space[3] }}>
            {summary.breakdown.map((item) => (
              <View
                key={item.label}
                style={{ flexDirection: 'row', justifyContent: 'space-between' }}
              >
                <Text variant="footnote" tone="secondary">
                  {item.label}
                </Text>
                <Text variant="footnote" weight="600">
                  +{item.xp}
                </Text>
              </View>
            ))}
          </View>
        </Card>

        <View style={{ flexDirection: 'row', gap: theme.space[3] }}>
          <SummaryTile
            icon="checkmark-done"
            value={`${Math.round(summary.accuracy * 100)}%`}
            label="precisão"
          />
          <SummaryTile
            icon="time"
            value={formatDuration(summary.durationMinutes)}
            label="de estudo"
          />
          <SummaryTile icon="book" value={String(summary.newWords)} label="conceitos" />
        </View>
      </Animated.View>

      <Button label="Continuar" size="lg" fullWidth onPress={onDone} />
    </View>
  );
}

function SummaryTile({
  icon,
  value,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
}) {
  const theme = useTheme();

  return (
    <Card variant="flat" padding={4} style={{ flex: 1 }}>
      <View style={{ alignItems: 'center', gap: 4 }}>
        <Ionicons name={icon} size={19} color={theme.colors.brand} />
        <Text variant="title3">{value}</Text>
        <Text variant="caption" tone="tertiary">
          {label}
        </Text>
      </View>
    </Card>
  );
}
