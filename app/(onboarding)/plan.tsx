/**
 * Plano gerado — a última tela do onboarding.
 *
 * Esta tela existe por um motivo de retenção muito específico: fechar o
 * **loop de expectativa**. O usuário acabou de investir dois minutos
 * respondendo perguntas; se ele cair direto na trilha, aquele investimento
 * parece ter sido em vão e a taxa de primeira lição despenca.
 *
 * Mostrar o plano — com números concretos e batíveis — transforma o esforço em
 * recompensa e ancora uma expectativa realista. As projeções são deliberadamente
 * conservadoras: prometer 1.000 palavras em 30 dias converte melhor no dia 1 e
 * destrói a retenção no dia 30.
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { LANGUAGE_META } from '@/content/vocabulary';
import { Badge, Button, Card, Screen, Text, useTheme } from '@/design';
import {
  COMMITMENT_LABEL,
  GOAL_LABEL,
  projectOutcome,
  resolveStartingLevel,
} from '@/domain/plan';
import { useAppStore } from '@/state/app-store';
import { useOnboardingStore } from '@/state/onboarding-store';

export default function PlanPreview() {
  const theme = useTheme();
  const router = useRouter();
  const store = useOnboardingStore();
  const completeOnboarding = useAppStore((state) => state.completeOnboarding);
  const [saving, setSaving] = useState(false);

  const answers = store.toAnswers();

  const projection = useMemo(() => (answers ? projectOutcome(answers) : null), [answers]);
  const level = useMemo(() => (answers ? resolveStartingLevel(answers) : 'A1'), [answers]);

  // Guarda de segurança: se o usuário chegou aqui sem responder tudo (deep
  // link, recarregamento na web), volta para o assistente em vez de quebrar.
  if (!answers || !projection || !store.language || !store.dailyMinutes) {
    return (
      <Screen>
        <View style={{ flex: 1, justifyContent: 'center', gap: theme.space[4] }}>
          <Text variant="title3">Faltam algumas respostas</Text>
          <Button
            label="Voltar ao questionário"
            onPress={() => router.replace('/(onboarding)/setup')}
          />
        </View>
      </Screen>
    );
  }

  const meta = LANGUAGE_META[store.language];

  const start = async () => {
    setSaving(true);
    try {
      await completeOnboarding({
        displayName: store.displayName,
        language: store.language!,
        goals: store.goals,
        level,
        dailyMinutes: store.dailyMinutes!,
        studyDays: store.studyDays,
        reminderMinute: store.reminderMinute,
      });
      store.reset();
      router.replace('/(tabs)/learn');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen scroll footerSpace={100}>
      <View style={{ gap: theme.space[6], paddingTop: theme.space[8] }}>
        <View style={{ gap: theme.space[3] }}>
          <Badge label="Plano personalizado" tone="brand" icon="sparkles" />
          <Text variant="title1">
            {store.displayName
              ? `${store.displayName}, seu plano está pronto.`
              : 'Seu plano está pronto.'}
          </Text>
          <Text variant="callout" tone="secondary">
            Montado a partir das suas respostas. Ele se ajusta sozinho conforme você estuda.
          </Text>
        </View>

        {/* Resumo das escolhas — confirma que as respostas foram usadas. */}
        <Card variant="subtle" padding={5}>
          <View style={{ gap: theme.space[4] }}>
            <Row icon="globe" label="Idioma" value={`${meta.flag}  ${meta.name}`} />
            <Row icon="trending-up" label="Nível inicial" value={level} />
            <Row icon="time" label="Ritmo" value={COMMITMENT_LABEL[store.dailyMinutes]} />
            <Row
              icon="calendar"
              label="Dias por semana"
              value={`${store.studyDays.length} ${store.studyDays.length === 1 ? 'dia' : 'dias'}`}
            />
            <Row
              icon="flag"
              label="Foco"
              value={store.goals.map((goal) => GOAL_LABEL[goal].title).join(' · ')}
            />
          </View>
        </Card>

        {/* Projeções */}
        <View style={{ gap: theme.space[3] }}>
          <Text variant="overline" tone="tertiary">
            No seu ritmo
          </Text>

          <View style={{ flexDirection: 'row', gap: theme.space[3] }}>
            <Projection
              value={String(projection.wordsIn30Days)}
              label="palavras em 30 dias"
              icon="book"
            />
            <Projection
              value={String(projection.wordsIn90Days)}
              label="palavras em 90 dias"
              icon="library"
            />
          </View>

          <Card variant="outlined" padding={4}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space[3] }}>
              <Ionicons name="trophy" size={22} color={theme.colors.streak} />
              <Text variant="callout" flex>
                Próximo nível em cerca de{' '}
                <Text variant="callout" weight="700">
                  {projection.weeksToNextLevel} semanas
                </Text>
                , estudando {projection.minutesPerWeek} minutos por semana.
              </Text>
            </View>
          </Card>

          <Text variant="caption" tone="tertiary">
            Estimativas conservadoras, baseadas nas horas de referência do Quadro Europeu (CEFR)
            e na sua carga semanal. O app recalcula conforme seu desempenho real.
          </Text>
        </View>

        {/* O que vem hoje */}
        <View style={{ gap: theme.space[3] }}>
          <Text variant="overline" tone="tertiary">
            Sua primeira sessão
          </Text>
          <Card variant="raised" padding={5}>
            <View style={{ gap: theme.space[3] }}>
              <Text variant="headline">Módulo 1 · Primeiros contatos</Text>
              <Text variant="footnote" tone="secondary">
                Cumprimentar, se apresentar e sobreviver ao primeiro diálogo. Cinco lições,
                começando por vocabulário essencial.
              </Text>
              <View style={{ flexDirection: 'row', gap: theme.space[2] }}>
                <Badge label={`${store.dailyMinutes} min`} tone="brand" icon="time" />
                <Badge label="Offline" tone="success" icon="cloud-offline" />
              </View>
            </View>
          </Card>
        </View>
      </View>

      <View style={{ gap: theme.space[2], paddingTop: theme.space[6] }}>
        <Button
          label="Começar a estudar"
          size="lg"
          fullWidth
          loading={saving}
          onPress={() => void start()}
          icon="play"
        />
        <Text variant="caption" tone="tertiary" align="center">
          Você pode mudar tudo isso depois, nas configurações.
        </Text>
      </View>
    </Screen>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  const theme = useTheme();

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space[3] }}>
      <Ionicons name={icon} size={18} color={theme.colors.brand} />
      <Text variant="footnote" tone="secondary" style={{ width: 120 }}>
        {label}
      </Text>
      <Text variant="callout" flex numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

function Projection({
  value,
  label,
  icon,
}: {
  value: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  const theme = useTheme();

  return (
    <Card variant="flat" padding={4} style={{ flex: 1 }}>
      <View style={{ gap: theme.space[2] }}>
        <Ionicons name={icon} size={20} color={theme.colors.brand} />
        <Text variant="metric">{value}</Text>
        <Text variant="caption" tone="secondary">
          {label}
        </Text>
      </View>
    </Card>
  );
}
