/**
 * Assistente de onboarding.
 *
 * Uma tela por pergunta, com barra de progresso e voltar. O padrão de "uma
 * decisão por vez" tem conclusão muito maior que um formulário longo, porque
 * cada tela é trivial e o progresso é visível.
 *
 * Todas as respostas alimentam o plano de estudos — nada é perguntado por
 * educação. Se um dado não muda o produto, ele não deveria ser perguntado.
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type React from 'react';
import { ScrollView, TextInput, View } from 'react-native';

import { LANGUAGE_META } from '@/content/vocabulary';
import {
  Button,
  Chip,
  OptionCard,
  ProgressBar,
  Screen,
  Text,
  Touchable,
  useTheme,
} from '@/design';
import { COMMITMENT_LABEL, GOAL_LABEL } from '@/domain/plan';
import {
  CEFR_LEVELS,
  type CefrLevel,
  type DailyCommitment,
  type LearningGoal,
  SUPPORTED_LANGUAGES,
} from '@/domain/types';
import { formatMinuteOfDay } from '@/lib/date';
import { ONBOARDING_STEPS, useOnboardingStore } from '@/state/onboarding-store';

const COMMITMENTS: DailyCommitment[] = [5, 10, 15, 20, 30, 60];
const WEEKDAYS = [
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
  { value: 6, label: 'Sáb' },
  { value: 0, label: 'Dom' },
];

const LEVEL_DESCRIPTION: Record<CefrLevel | 'zero', string> = {
  zero: 'Nunca estudei este idioma',
  A1: 'Sei algumas palavras soltas',
  A2: 'Me viro em situações simples',
  B1: 'Converso sobre assuntos do dia a dia',
  B2: 'Me expresso bem, mas erro nos detalhes',
  C1: 'Falo com fluidez em quase tudo',
  C2: 'Domino o idioma',
};

const REMINDER_OPTIONS = [7 * 60, 12 * 60, 19 * 60, 21 * 60];

export default function Setup() {
  const theme = useTheme();
  const router = useRouter();
  const store = useOnboardingStore();

  const stepKey = ONBOARDING_STEPS[store.step]!;
  const progress = (store.step + 1) / ONBOARDING_STEPS.length;

  const handleNext = () => {
    if (store.step === ONBOARDING_STEPS.length - 1) {
      router.push('/(onboarding)/plan');
    } else {
      store.next();
    }
  };

  const handleBack = () => {
    if (store.step === 0) {
      router.back();
    } else {
      store.back();
    }
  };

  return (
    <Screen footerSpace={0}>
      {/* Cabeçalho: voltar + progresso */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.space[3],
          paddingVertical: theme.space[3],
        }}
      >
        <Touchable
          onPress={handleBack}
          haptic="light"
          accessibilityLabel="Voltar"
          ensureTouchTarget
          style={{ width: 40, justifyContent: 'center' }}
        >
          <Ionicons name="chevron-back" size={26} color={theme.colors.textSecondary} />
        </Touchable>
        <ProgressBar value={progress} style={{ flex: 1 }} accessibilityLabel="Progresso" />
        <Text variant="caption" tone="tertiary">
          {store.step + 1}/{ONBOARDING_STEPS.length}
        </Text>
      </View>

      <View style={{ flex: 1, gap: theme.space[6], paddingTop: theme.space[4] }}>
        {stepKey === 'language' ? (
          <StepShell
            title="Qual idioma você quer aprender?"
            subtitle="Você pode adicionar outros depois, sem perder o progresso."
          >
            <View style={{ gap: theme.space[2] }}>
              {SUPPORTED_LANGUAGES.map((language) => {
                const meta = LANGUAGE_META[language];
                return (
                  <OptionCard
                    key={language}
                    title={`${meta.flag}  ${meta.name}`}
                    description={`${meta.nativeName} · ${meta.speakers} de falantes`}
                    selected={store.language === language}
                    onPress={() => store.setLanguage(language)}
                  />
                );
              })}
            </View>
          </StepShell>
        ) : null}

        {stepKey === 'goals' ? (
          <StepShell
            title="Para que você vai usar?"
            subtitle="Escolha até 3. Isso muda o conteúdo que você recebe, não só a mensagem."
          >
            <View style={{ gap: theme.space[2] }}>
              {(Object.keys(GOAL_LABEL) as LearningGoal[]).map((goal) => {
                const meta = GOAL_LABEL[goal];
                return (
                  <OptionCard
                    key={goal}
                    icon={meta.icon as never}
                    title={meta.title}
                    description={meta.description}
                    selected={store.goals.includes(goal)}
                    onPress={() => store.toggleGoal(goal)}
                  />
                );
              })}
            </View>
          </StepShell>
        ) : null}

        {stepKey === 'level' ? (
          <StepShell
            title="Como está seu nível hoje?"
            subtitle="Seja honesto — vamos ajustar automaticamente conforme você estuda."
          >
            <View style={{ gap: theme.space[2] }}>
              {(['zero', ...CEFR_LEVELS] as (CefrLevel | 'zero')[]).map((level) => (
                <OptionCard
                  key={level}
                  title={level === 'zero' ? 'Do zero' : level}
                  description={LEVEL_DESCRIPTION[level]}
                  selected={store.level === level}
                  onPress={() => store.setLevel(level)}
                />
              ))}
            </View>
          </StepShell>
        ) : null}

        {stepKey === 'commitment' ? (
          <StepShell
            title="Quanto tempo por dia?"
            subtitle="Escolha algo que você consegue manter numa semana ruim, não numa boa."
          >
            <View style={{ gap: theme.space[2] }}>
              {COMMITMENTS.map((minutes) => (
                <OptionCard
                  key={minutes}
                  title={COMMITMENT_LABEL[minutes]}
                  description={`Meta de ${Math.round((minutes * 12) / 10) * 10} XP por dia`}
                  selected={store.dailyMinutes === minutes}
                  onPress={() => store.setDailyMinutes(minutes)}
                />
              ))}
            </View>
          </StepShell>
        ) : null}

        {stepKey === 'days' ? (
          <StepShell
            title="Quais dias da semana?"
            subtitle="Sua ofensiva só conta nestes dias — nos outros, você descansa sem perder nada."
          >
            <View style={{ gap: theme.space[6] }}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space[2] }}>
                {WEEKDAYS.map((day) => (
                  <Chip
                    key={day.value}
                    label={day.label}
                    selected={store.studyDays.includes(day.value)}
                    onPress={() => store.toggleDay(day.value)}
                    style={{ minWidth: 76 }}
                  />
                ))}
              </View>

              <View style={{ gap: theme.space[3] }}>
                <Text variant="headline">Lembrete diário</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space[2] }}>
                  {REMINDER_OPTIONS.map((minute) => (
                    <Chip
                      key={minute}
                      label={formatMinuteOfDay(minute)}
                      icon="notifications-outline"
                      selected={store.reminderMinute === minute}
                      onPress={() => store.setReminder(minute)}
                    />
                  ))}
                  <Chip
                    label="Sem lembrete"
                    selected={store.reminderMinute === null}
                    onPress={() => store.setReminder(null)}
                  />
                </View>
              </View>
            </View>
          </StepShell>
        ) : null}

        {stepKey === 'name' ? (
          <StepShell
            title="Como podemos te chamar?"
            subtitle="Opcional. Serve só para o tutor falar com você pelo nome."
          >
            <TextInput
              value={store.displayName}
              onChangeText={store.setName}
              placeholder="Seu nome"
              placeholderTextColor={theme.colors.textTertiary}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleNext}
              style={{
                height: 58,
                paddingHorizontal: theme.space[4],
                borderRadius: theme.radius.lg,
                borderWidth: 2,
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.surfaceSunken,
                color: theme.colors.textPrimary,
                fontSize: 18,
              }}
            />
          </StepShell>
        ) : null}
      </View>

      <View style={{ paddingBottom: theme.space[4] }}>
        <Button
          label={store.step === ONBOARDING_STEPS.length - 1 ? 'Ver meu plano' : 'Continuar'}
          size="lg"
          fullWidth
          disabled={!store.canAdvance()}
          onPress={handleNext}
        />
      </View>
    </Screen>
  );
}

/**
 * Casca comum das etapas: título, subtítulo e conteúdo rolável.
 *
 * A rolagem é obrigatória: listas como "nível" têm 7 opções e não cabem em
 * um telefone pequeno com fonte de acessibilidade aumentada.
 */
function StepShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const theme = useTheme();

  return (
    <View style={{ flex: 1, gap: theme.space[5] }}>
      <View style={{ gap: theme.space[2] }}>
        <Text variant="title1">{title}</Text>
        <Text variant="callout" tone="secondary">
          {subtitle}
        </Text>
      </View>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: theme.space[4] }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </View>
  );
}
