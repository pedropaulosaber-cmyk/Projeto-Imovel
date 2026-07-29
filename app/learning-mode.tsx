/**
 * Escolha do modo de aprendizado.
 *
 * A tela mostra os dois modos lado a lado com o que cada um entrega, e diz
 * explicitamente o que **não** muda ao trocar. Essa frase é o ponto: sem ela,
 * "modo mais fácil" é lido como "modo que ensina menos", e quem mais se
 * beneficiaria do Essencial é justamente quem não vai escolhê-lo por medo de
 * estar trapaceando.
 *
 * A troca é imediata e reversível a qualquer momento — nada de confirmação.
 * Decisão que pode ser desfeita com um toque não merece um diálogo.
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { Badge, Card, Screen, Text, Touchable, useTheme } from '@/design';
import { LEARNING_MODE_META } from '@/domain/learning-mode';
import { LEARNING_MODES, type LearningMode } from '@/domain/types';
import { useAppStore } from '@/state/app-store';

export default function LearningModeScreen() {
  const theme = useTheme();
  const router = useRouter();

  const enrollment = useAppStore((state) => state.enrollment);
  const setLearningMode = useAppStore((state) => state.setLearningMode);
  const [saving, setSaving] = useState<LearningMode | null>(null);

  const current = enrollment?.learningMode ?? 'complete';

  const choose = (mode: LearningMode) => {
    if (mode === current) return;
    setSaving(mode);
    void setLearningMode(mode).finally(() => setSaving(null));
  };

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: theme.layout.screenPadding,
          paddingTop: theme.space[10],
          paddingBottom: theme.space[10],
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space[3] }}>
          <Touchable
            onPress={() => router.back()}
            haptic="light"
            accessibilityLabel="Voltar"
            ensureTouchTarget={false}
            style={{ width: 32, height: 32, justifyContent: 'center' }}
          >
            <Ionicons name="chevron-back" size={26} color={theme.colors.textSecondary} />
          </Touchable>
          <Text variant="title2">Modo de aprendizado</Text>
        </View>

        <Text
          variant="footnote"
          tone="secondary"
          style={{ marginTop: theme.space[3], lineHeight: 21 }}
        >
          Dois ritmos para o mesmo curso. Você troca quando quiser, sem perder nada — o modo
          vale só para o idioma que está estudando agora.
        </Text>

        <View style={{ marginTop: theme.space[6], gap: theme.space[3] }}>
          {LEARNING_MODES.map((mode) => {
            const meta = LEARNING_MODE_META[mode];
            const selected = mode === current;

            return (
              <Touchable
                key={mode}
                onPress={() => choose(mode)}
                haptic="medium"
                pressedScale={0.99}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={`Modo ${meta.title}`}
              >
                <Card variant={selected ? 'subtle' : 'flat'} padding={5}>
                  <View style={{ gap: theme.space[4] }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: theme.space[3],
                      }}
                    >
                      <View
                        style={{
                          width: 46,
                          height: 46,
                          borderRadius: theme.radius.md,
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: selected
                            ? theme.colors.brand
                            : theme.colors.surfaceSunken,
                        }}
                      >
                        <Ionicons
                          name={meta.icon as keyof typeof Ionicons.glyphMap}
                          size={22}
                          color={selected ? theme.colors.onBrand : theme.colors.textSecondary}
                        />
                      </View>

                      <View style={{ flex: 1, gap: 2 }}>
                        <Text variant="headline">{meta.title}</Text>
                        <Text variant="caption" tone="tertiary">
                          {meta.tagline}
                        </Text>
                      </View>

                      {selected ? (
                        <Badge label="Ativo" tone="brand" icon="checkmark-circle" />
                      ) : saving === mode ? (
                        <Text variant="caption" tone="tertiary">
                          Aplicando…
                        </Text>
                      ) : null}
                    </View>

                    <Text variant="footnote" tone="secondary" style={{ lineHeight: 21 }}>
                      {meta.description}
                    </Text>

                    <View style={{ gap: theme.space[2] }}>
                      {meta.highlights.map((item) => (
                        <View
                          key={item}
                          style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
                        >
                          <Ionicons
                            name="checkmark"
                            size={14}
                            color={selected ? theme.colors.brand : theme.colors.textTertiary}
                          />
                          <Text variant="caption" tone="secondary" flex>
                            {item}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </Card>
              </Touchable>
            );
          })}
        </View>

        {/* O que NÃO muda — a informação que faz a escolha ser honesta. */}
        <Card variant="outlined" padding={4} style={{ marginTop: theme.space[6] }}>
          <View style={{ flexDirection: 'row', gap: theme.space[3] }}>
            <Ionicons name="shield-checkmark" size={20} color={theme.colors.info} />
            <Text variant="caption" tone="secondary" flex>
              O Essencial não é um modo "de mentira": a correção é a mesma, o XP é o mesmo e a
              revisão espaçada continua idêntica. Muda o tamanho da sessão e a variedade de
              exercícios — não o rigor.
            </Text>
          </View>
        </Card>
      </ScrollView>
    </Screen>
  );
}
