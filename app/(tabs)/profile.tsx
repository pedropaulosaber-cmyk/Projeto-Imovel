/**
 * Perfil e configurações.
 *
 * Inclui as ações de LGPD (exportar e apagar dados) em local visível, não
 * enterradas. Direito do titular que exige três níveis de menu para ser
 * exercido é conformidade de fachada.
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, Share, View } from 'react-native';

import { LANGUAGE_META } from '@/content/vocabulary';
import { closeDatabase, getDatabase } from '@/db';
import { learnerRepository } from '@/db/repositories/learner';
import {
  Badge,
  Button,
  Card,
  Divider,
  ListRow,
  ProgressBar,
  Screen,
  SegmentedControl,
  Text,
  type ThemePreference,
  Touchable,
  useTheme,
} from '@/design';
import { planLabel, shouldShowUpsell } from '@/domain/access';
import { ACHIEVEMENTS, levelProgress } from '@/domain/gamification';
import { LEARNING_MODE_META } from '@/domain/learning-mode';
import { type LanguageCode, SUPPORTED_LANGUAGES } from '@/domain/types';
import { formatBytes, formatDuration } from '@/lib/date';
import { selectAccuracy, selectTotalMinutes, useAppStore } from '@/state/app-store';

export default function Profile() {
  const theme = useTheme();
  const router = useRouter();

  const profile = useAppStore((state) => state.profile);
  const enrollment = useAppStore((state) => state.enrollment);
  const wallet = useAppStore((state) => state.wallet);
  const streak = useAppStore((state) => state.streak);
  const switchLanguage = useAppStore((state) => state.switchLanguage);
  const bootstrap = useAppStore((state) => state.bootstrap);

  const accuracy = useAppStore(selectAccuracy);
  const totalMinutes = useAppStore(selectTotalMinutes);

  const [storageBytes, setStorageBytes] = useState(0);

  useEffect(() => {
    void getDatabase()
      .estimateSizeBytes()
      .then(setStorageBytes)
      .catch(() => setStorageBytes(0));
  }, []);

  const level = levelProgress(wallet?.totalXp ?? 0);

  /* ---------------- LGPD: exportar ---------------- */
  const exportData = useCallback(async () => {
    if (!profile) return;

    const [enrollments, progress, stats, sessions] = await Promise.all([
      learnerRepository.listEnrollments(profile.id),
      learnerRepository.listLessonProgress(profile.id),
      learnerRepository.listDailyStats(profile.id, '2000-01-01', '2100-01-01'),
      learnerRepository.listRecentSessions(profile.id, 1000),
    ]);

    const payload = JSON.stringify(
      { profile, enrollments, progress, stats, sessions, exportedAt: new Date().toISOString() },
      null,
      2,
    );

    // Compartilhar é o caminho universal: o usuário escolhe salvar em arquivo,
    // enviar por e-mail ou mandar para outro app. Não precisamos de permissão
    // de armazenamento nem de servidor.
    await Share.share({ message: payload, title: 'Meus dados no Lumo' });
  }, [profile]);

  /* ---------------- LGPD: apagar ---------------- */
  const deleteData = useCallback(() => {
    if (!profile) return;

    Alert.alert(
      'Apagar todos os dados?',
      'Isso remove seu perfil, progresso, vocabulário e histórico deste dispositivo. A ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Apagar tudo',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              await learnerRepository.purgeUserData(profile.id);
              await closeDatabase();
              await bootstrap();
              router.replace('/');
            })();
          },
        },
      ],
    );
  }, [profile, bootstrap, router]);

  if (!profile || !enrollment) {
    return (
      <Screen>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <Text tone="secondary">Carregando…</Text>
        </View>
      </Screen>
    );
  }

  // Indexar um Record por valor que veio do disco exige fallback: o repositório
  // já normaliza, mas uma tela que fica branca por um campo ausente é cara
  // demais para depender de uma única linha de defesa.
  const modeMeta = LEARNING_MODE_META[enrollment.learningMode] ?? LEARNING_MODE_META.complete;
  const plan = planLabel(profile.plan);

  const initials = profile.displayName
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

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
        {/* ---------------- Cabeçalho ---------------- */}
        <View
          style={{ alignItems: 'center', gap: theme.space[3], paddingVertical: theme.space[5] }}
        >
          <View
            style={{
              width: 84,
              height: 84,
              borderRadius: 42,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: theme.colors.brand,
            }}
          >
            <Text variant="title1" tone="onBrand">
              {initials || '🙂'}
            </Text>
          </View>

          <Text variant="title2">{profile.displayName || 'Estudante'}</Text>

          <View style={{ flexDirection: 'row', gap: theme.space[2] }}>
            <Badge label={`Nível ${level.level}`} tone="brand" icon="flash" />
            <Badge label={plan.label} tone={plan.tone} icon={plan.icon} />
          </View>

          <ProgressBar
            value={level.ratio}
            style={{ width: '100%', marginTop: theme.space[2] }}
          />
          <Text variant="caption" tone="tertiary">
            {level.xpIntoLevel} / {level.nextLevelXp - level.currentLevelXp} XP neste nível
          </Text>
        </View>

        {/* ---------------- Resumo ---------------- */}
        <View style={{ flexDirection: 'row', gap: theme.space[3] }}>
          <SummaryTile value={String(streak?.currentStreak ?? 0)} label="ofensiva" />
          <SummaryTile value={formatDuration(totalMinutes)} label="estudado" />
          <SummaryTile value={`${Math.round(accuracy * 100)}%`} label="precisão" />
        </View>

        {/* ---------------- Idiomas ---------------- */}
        <Section title="Idiomas">
          <View style={{ gap: theme.space[2] }}>
            {SUPPORTED_LANGUAGES.map((language) => (
              <LanguageRow
                key={language}
                language={language}
                active={language === enrollment.language}
                onPress={() => void switchLanguage(language)}
              />
            ))}
          </View>
        </Section>

        {/* ---------------- Conquistas ---------------- */}
        <Section title="Conquistas">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space[3] }}>
            {ACHIEVEMENTS.slice(0, 8).map((achievement) => {
              const unlocked =
                achievement.metric === 'streak_days'
                  ? (streak?.longestStreak ?? 0) >= achievement.target
                  : achievement.metric === 'total_xp'
                    ? (wallet?.totalXp ?? 0) >= achievement.target
                    : false;

              return (
                <View
                  key={achievement.code}
                  style={{ alignItems: 'center', gap: 6, width: 76 }}
                >
                  <View
                    style={{
                      width: 54,
                      height: 54,
                      borderRadius: 27,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: unlocked
                        ? theme.colors.streakSubtle
                        : theme.colors.surfaceSunken,
                      opacity: unlocked ? 1 : 0.5,
                    }}
                  >
                    <Ionicons
                      name={achievement.icon as never}
                      size={24}
                      color={unlocked ? theme.colors.streak : theme.colors.textTertiary}
                    />
                  </View>
                  <Text
                    variant="caption"
                    tone={unlocked ? 'primary' : 'tertiary'}
                    align="center"
                  >
                    {achievement.title}
                  </Text>
                </View>
              );
            })}
          </View>
        </Section>

        {/* ---------------- Aparência ---------------- */}
        <Section title="Aparência">
          <ThemeSelector />
        </Section>

        {/* ---------------- Configurações ---------------- */}
        <Section title="Estudo">
          <ListRow
            icon="school"
            title="Meu nível"
            subtitle={`${enrollment.currentLevel} · trocar não apaga seu progresso`}
            onPress={() => router.push('/level')}
          />
          <Divider inset={44} />
          <ListRow
            icon={modeMeta.icon as never}
            title="Modo de aprendizado"
            subtitle={`${modeMeta.title} · ${modeMeta.tagline}`}
            onPress={() => router.push('/learning-mode')}
          />
          <Divider inset={44} />
          <ListRow
            icon="library"
            title="Apostilas"
            subtitle="Uma por nível, para consultar offline"
            onPress={() => router.push('/workbooks')}
          />
          <Divider inset={44} />
          <ListRow
            icon="download"
            title="Downloads e armazenamento"
            subtitle={`${formatBytes(storageBytes)} usados neste aparelho`}
            onPress={() => router.push('/downloads')}
          />
          <Divider inset={44} />
          <ListRow
            icon="flag"
            title="Meta diária"
            subtitle={`${enrollment.dailyGoalXp} XP · ${enrollment.dailyMinutes} min por dia`}
            onPress={() => router.push('/(onboarding)/setup')}
          />
          <Divider inset={44} />
          <ListRow
            icon="notifications"
            title="Lembretes"
            subtitle={
              enrollment.reminderMinute === null
                ? 'Desativados'
                : `Todos os dias às ${String(Math.floor(enrollment.reminderMinute / 60)).padStart(2, '0')}:${String(enrollment.reminderMinute % 60).padStart(2, '0')}`
            }
            onPress={() => router.push('/(onboarding)/setup')}
          />
        </Section>

        {/* ---------------- Acesso ---------------- */}
        {shouldShowUpsell(profile) ? (
          <Card variant="subtle" padding={5} style={{ marginTop: theme.space[6] }}>
            <View style={{ gap: theme.space[3] }}>
              <Badge label="Premium" tone="premium" icon="star" />
              <Text variant="headline">Desbloqueie tudo</Text>
              <Text variant="footnote" tone="secondary">
                Todos os idiomas, vidas infinitas, tutor completo por IA e download ilimitado.
              </Text>
              <Button label="Ver planos" onPress={() => router.push('/paywall')} fullWidth />
            </View>
          </Card>
        ) : (
          <Card variant="subtle" padding={5} style={{ marginTop: theme.space[6] }}>
            <View style={{ gap: theme.space[3] }}>
              <Badge label="Acesso completo" tone="premium" icon="star" />
              <Text variant="headline">Tudo liberado, sem cobrança</Text>
              <Text variant="footnote" tone="secondary">
                Os 8 idiomas, todas as lições, vidas infinitas, tutor sem limite e download à
                vontade. Nada aqui está bloqueado nem pede cartão.
              </Text>
              <Button
                label="Ver o que está incluso"
                variant="secondary"
                onPress={() => router.push('/paywall')}
                fullWidth
              />
            </View>
          </Card>
        )}

        {/* ---------------- Privacidade ---------------- */}
        <Section title="Privacidade e dados">
          <ListRow
            icon="download-outline"
            title="Exportar meus dados"
            subtitle="Baixe tudo o que guardamos sobre você, em JSON"
            onPress={() => void exportData()}
          />
          <Divider inset={44} />
          <ListRow
            icon="trash-outline"
            title="Apagar todos os dados"
            subtitle="Remove seu perfil e progresso deste aparelho"
            destructive
            onPress={deleteData}
          />
        </Section>

        <View style={{ alignItems: 'center', paddingTop: theme.space[10], gap: 4 }}>
          <Text variant="caption" tone="tertiary">
            Lumo · versão 1.0.0
          </Text>
          <Text variant="caption" tone="tertiary">
            Seus dados ficam neste aparelho até você conectar uma conta.
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

/* ------------------------------------------------------------------ *
 * Peças
 * ------------------------------------------------------------------ */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ marginTop: theme.space[8], gap: theme.space[3] }}>
      <Text variant="overline" tone="tertiary">
        {title}
      </Text>
      <Card variant="flat" padding={4}>
        {children}
      </Card>
    </View>
  );
}

function SummaryTile({ value, label }: { value: string; label: string }) {
  return (
    <Card variant="flat" padding={4} style={{ flex: 1 }}>
      <View style={{ alignItems: 'center', gap: 2 }}>
        <Text variant="title3">{value}</Text>
        <Text variant="caption" tone="tertiary">
          {label}
        </Text>
      </View>
    </Card>
  );
}

function LanguageRow({
  language,
  active,
  onPress,
}: {
  language: LanguageCode;
  active: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const meta = LANGUAGE_META[language];

  return (
    <Touchable
      onPress={onPress}
      haptic="light"
      pressedScale={0.99}
      accessibilityState={{ selected: active }}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.space[3],
        padding: theme.space[3],
        borderRadius: theme.radius.md,
        backgroundColor: active ? theme.colors.brandSubtle : 'transparent',
      }}
    >
      <Text variant="title3">{meta.flag}</Text>
      <View style={{ flex: 1 }}>
        <Text variant="callout">{meta.name}</Text>
        <Text variant="caption" tone="tertiary">
          {meta.nativeName}
        </Text>
      </View>
      {active ? (
        <Ionicons name="checkmark-circle" size={22} color={theme.colors.brand} />
      ) : (
        <Ionicons name="add-circle-outline" size={22} color={theme.colors.textTertiary} />
      )}
    </Touchable>
  );
}

function ThemeSelector() {
  const { preference, setPreference } = useTheme();

  return (
    <SegmentedControl<ThemePreference>
      value={preference}
      onChange={setPreference}
      options={[
        { value: 'light', label: 'Claro' },
        { value: 'dark', label: 'Escuro' },
        { value: 'system', label: 'Sistema' },
      ]}
    />
  );
}
