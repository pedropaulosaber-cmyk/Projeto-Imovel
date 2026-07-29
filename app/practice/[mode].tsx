/**
 * Prática livre por habilidade.
 *
 * Monta uma sessão sob medida puxando, de todo o conteúdo já baixado, os
 * exercícios do tipo pedido. Não segue a trilha nem desbloqueio — é prática
 * deliberada de uma habilidade específica.
 *
 * A existência desta tela resolve uma limitação real das trilhas lineares: um
 * usuário que sabe que trava na escuta não deveria precisar avançar 4 lições
 * de vocabulário para treinar escuta.
 */

import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';

import { contentRepository } from '@/db/repositories/content';
import { learnerRepository } from '@/db/repositories/learner';
import { Badge, Button, Card, SegmentedProgress, Text, Touchable, useTheme } from '@/design';
import { xpForAttempt } from '@/domain/gamification';
import { type UserAnswer, gradeExercise } from '@/domain/grading';
import { gradeFromPerformance } from '@/domain/srs';
import type { Exercise, ExerciseResult, ExerciseType } from '@/domain/types';
import { ExerciseRenderer } from '@/features/exercises/ExerciseRenderer';
import { useAppStore } from '@/state/app-store';

/** Quais tipos de exercício alimentam cada modo de prática. */
const MODE_TYPES: Record<
  string,
  { title: string; types: ExerciseType[]; icon: keyof typeof Ionicons.glyphMap }
> = {
  speaking: { title: 'Pronúncia', types: ['speak', 'shadowing'], icon: 'mic' },
  listening: {
    title: 'Escuta',
    types: ['listen_type', 'listen_respond', 'dictation'],
    icon: 'headset',
  },
  reading: { title: 'Leitura', types: ['reading_comprehension'], icon: 'newspaper' },
  writing: { title: 'Escrita', types: ['describe_image', 'correct_sentence'], icon: 'create' },
  vocabulary: {
    title: 'Vocabulário',
    types: ['multiple_choice', 'translate', 'fill_blank', 'word_bank'],
    icon: 'sparkles',
  },
};

const SESSION_SIZE = 8;

export default function PracticeSession() {
  const theme = useTheme();
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode: string }>();

  const profile = useAppStore((state) => state.profile);
  const enrollment = useAppStore((state) => state.enrollment);
  const refresh = useAppStore((state) => state.refresh);

  const config = MODE_TYPES[mode ?? ''] ?? MODE_TYPES.vocabulary!;

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [index, setIndex] = useState(0);
  const [result, setResult] = useState<ExerciseResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [xp, setXp] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [questionStartedAt, setQuestionStartedAt] = useState(Date.now());
  const [startedAt] = useState(Date.now());

  // Extrair o idioma antes do efeito deixa a dependência exata: a sessão só
  // precisa ser remontada quando o idioma ou o modo mudam, não quando qualquer
  // campo da matrícula é atualizado.
  const language = enrollment?.language;

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      if (!language) {
        setLoading(false);
        return;
      }

      const courses = await contentRepository.listCourses(language);
      const course = courses[0];
      if (!course) {
        setLoading(false);
        return;
      }

      const lessons = await contentRepository.listLessonsForCourse(course.id);
      const all: Exercise[] = [];

      const types = MODE_TYPES[mode ?? '']?.types ?? MODE_TYPES.vocabulary!.types;

      for (const lesson of lessons) {
        const lessonExercises = await contentRepository.listExercises(lesson.id);
        all.push(...lessonExercises.filter((exercise) => types.includes(exercise.type)));
        // Para de varrer assim que houver material suficiente — carregar todo
        // o curso para usar 8 exercícios seria desperdício de I/O e bateria.
        if (all.length >= SESSION_SIZE * 3) break;
      }

      if (cancelled) return;

      // Amostra determinística: ordenar por id embaralha em relação à ordem
      // da trilha, mas dá sempre o mesmo conjunto para o mesmo conteúdo — o
      // que torna a sessão reproduzível para suporte e testes.
      const selected = [...all].sort((a, b) => a.id.localeCompare(b.id)).slice(0, SESSION_SIZE);

      setExercises(selected);
      setLoading(false);
      setQuestionStartedAt(Date.now());
    })();

    return () => {
      cancelled = true;
    };
  }, [language, mode]);

  const exercise = exercises[index];

  const handleAnswer = useCallback(
    (answer: UserAnswer) => {
      if (!exercise) return;

      const graded = gradeExercise(exercise, answer);
      const responseMs = Date.now() - questionStartedAt;

      setResult(graded);
      if (graded.correct) setCorrect((value) => value + 1);

      const earned = xpForAttempt(
        {
          exerciseId: exercise.id,
          type: exercise.type,
          correct: graded.correct,
          score: graded.score,
          responseMs,
          usedHint: false,
          answeredAt: Date.now(),
        },
        exercise.difficulty,
      );
      setXp((value) => value + earned);

      // Atualiza o SRS dos conceitos praticados, em background.
      void (async () => {
        if (!profile || !enrollment) return;
        const states = await learnerRepository.ensureReviewStates({
          userId: profile.id,
          language: enrollment.language,
          conceptIds: exercise.conceptIds,
        });
        const srsGrade = gradeFromPerformance(graded.correct, responseMs, false);
        for (const state of states) {
          await learnerRepository.gradeReview(state, srsGrade);
        }
      })();
    },
    [exercise, questionStartedAt, profile, enrollment],
  );

  const advance = useCallback(() => {
    setResult(null);
    setIndex((value) => value + 1);
    setQuestionStartedAt(Date.now());
  }, []);

  const finish = useCallback(async () => {
    if (profile && enrollment && index > 0) {
      const minutes = Math.max(1, Math.round((Date.now() - startedAt) / 60_000));
      const speechScores = config.types.includes('speak') ? 1 : undefined;

      const stat = await learnerRepository.accumulateDailyStat({
        userId: profile.id,
        dailyGoalXp: enrollment.dailyGoalXp,
        pronunciationScore:
          speechScores !== undefined ? correct / Math.max(1, index) : undefined,
        delta: {
          xpEarned: xp,
          minutesStudied: minutes,
          exercisesAttempted: index,
          exercisesCorrect: correct,
        },
      });
      await learnerRepository.addXp(profile.id, xp);

      if (stat.goalMet) {
        await learnerRepository.registerGoalMet(profile.id, profile.plan !== 'free');
      }
    }

    await refresh();
    router.back();
  }, [profile, enrollment, index, xp, correct, startedAt, config.types, refresh, router]);

  if (loading) {
    return (
      <Center>
        <Text tone="secondary">Preparando exercícios…</Text>
      </Center>
    );
  }

  /* Sem material para este modo */
  if (exercises.length === 0) {
    return (
      <Center>
        <Ionicons name="cloud-download-outline" size={54} color={theme.colors.textTertiary} />
        <Text variant="title3" align="center">
          Nada disponível offline ainda
        </Text>
        <Text variant="callout" tone="secondary" align="center">
          Baixe o conteúdo deste idioma para praticar {config.title.toLowerCase()} sem internet.
        </Text>
        <Button label="Ir para downloads" onPress={() => router.replace('/downloads')} />
        <Button label="Voltar" variant="ghost" onPress={() => router.back()} />
      </Center>
    );
  }

  /* Sessão concluída */
  if (!exercise) {
    const accuracy = index === 0 ? 0 : correct / index;

    return (
      <Center>
        <Ionicons name={config.icon} size={56} color={theme.colors.brand} />
        <Text variant="title2" align="center">
          Sessão de {config.title.toLowerCase()} concluída
        </Text>
        <View style={{ flexDirection: 'row', gap: theme.space[2] }}>
          <Badge label={`+${xp} XP`} tone="brand" icon="flash" />
          <Badge
            label={`${Math.round(accuracy * 100)}% de acerto`}
            tone="success"
            icon="checkmark"
          />
        </View>
        <Button label="Concluir" size="lg" onPress={() => void finish()} />
      </Center>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
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
          accessibilityLabel="Encerrar prática"
          ensureTouchTarget={false}
          style={{ width: 32, height: 32, justifyContent: 'center' }}
        >
          <Ionicons name="close" size={26} color={theme.colors.textTertiary} />
        </Touchable>
        <SegmentedProgress total={exercises.length} completed={index} style={{ flex: 1 }} />
        <Badge label={`${xp} XP`} tone="brand" />
      </View>

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
        <Animated.View entering={FadeIn.duration(theme.duration.fast)} key={exercise.id}>
          <ExerciseRenderer
            key={exercise.id}
            exercise={exercise}
            language={enrollment!.language}
            locked={result !== null}
            onAnswer={handleAnswer}
          />
        </Animated.View>
      </ScrollView>

      {result ? (
        <Animated.View
          entering={SlideInDown.duration(theme.duration.normal)}
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
              size={24}
              color={result.correct ? theme.colors.success : theme.colors.danger}
            />
            <Text variant="headline" tone={result.correct ? 'success' : 'danger'} flex>
              {result.feedback}
            </Text>
          </View>

          {!result.correct && result.correctAnswer ? (
            <Card variant="outlined" padding={3}>
              <Text variant="callout">{result.correctAnswer}</Text>
            </Card>
          ) : null}

          <Button
            label="Continuar"
            variant={result.correct ? 'success' : 'danger'}
            size="lg"
            fullWidth
            onPress={advance}
          />
        </Animated.View>
      ) : null}
    </View>
  );
}

function Center({ children }: { children: React.ReactNode }) {
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
