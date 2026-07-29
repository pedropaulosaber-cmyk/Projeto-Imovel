/**
 * Trocar o nível do curso em andamento.
 *
 * Um nivelamento errado é a causa mais comum de abandono precoce: quem começou
 * alto trava, quem começou baixo se entedia — e nos dois casos a culpa parece
 * ser do idioma. Deixar a correção a dois toques transforma um motivo de
 * desinstalação em um ajuste de tarde de domingo.
 *
 * Duas garantias que a tela precisa comunicar, porque são o que trava a
 * decisão:
 *
 *  1. **Nada é apagado.** Lições concluídas, vocabulário e fila de revisão
 *     seguem intactos. O nível decide o conteúdo daqui para frente.
 *  2. **Dá para voltar.** Se subir demais, é só descer de novo.
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { LANGUAGE_META } from '@/content/vocabulary';
import { Badge, Card, Screen, Text, Touchable, useTheme } from '@/design';
import { weeksToNextLevel } from '@/domain/plan';
import { CEFR_LEVELS, type CefrLevel } from '@/domain/types';
import { useAppStore } from '@/state/app-store';

const LEVEL_INFO: Record<CefrLevel, { title: string; description: string }> = {
  A1: { title: 'Iniciante', description: 'Sei algumas palavras soltas e frases prontas.' },
  A2: { title: 'Básico', description: 'Me viro em situações simples e previsíveis.' },
  B1: { title: 'Intermediário', description: 'Converso sobre assuntos do dia a dia.' },
  B2: { title: 'Avançado', description: 'Me expresso bem, mas ainda erro nos detalhes.' },
  C1: { title: 'Proficiente', description: 'Falo com fluidez em quase qualquer contexto.' },
  C2: { title: 'Domínio', description: 'Uso o idioma com precisão de nativo.' },
};

export default function LevelScreen() {
  const theme = useTheme();
  const router = useRouter();

  const enrollment = useAppStore((state) => state.enrollment);
  const setCurrentLevel = useAppStore((state) => state.setCurrentLevel);
  const [saving, setSaving] = useState<CefrLevel | null>(null);

  if (!enrollment) {
    return (
      <Screen>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <Text tone="secondary">Carregando…</Text>
        </View>
      </Screen>
    );
  }

  const meta = LANGUAGE_META[enrollment.language];
  const currentIndex = CEFR_LEVELS.indexOf(enrollment.currentLevel);

  const choose = (level: CefrLevel) => {
    if (level === enrollment.currentLevel) return;
    setSaving(level);
    void setCurrentLevel(level).finally(() => setSaving(null));
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
          <View style={{ flex: 1 }}>
            <Text variant="title2">Meu nível</Text>
            <Text variant="caption" tone="tertiary">
              {meta.flag} {meta.name}
            </Text>
          </View>
        </View>

        <Card variant="subtle" padding={4} style={{ marginTop: theme.space[5] }}>
          <View style={{ flexDirection: 'row', gap: theme.space[3] }}>
            <Ionicons name="sync" size={20} color={theme.colors.brand} />
            <Text variant="footnote" tone="secondary" flex>
              Trocar de nível não apaga nada. Suas lições concluídas, seu vocabulário e sua fila
              de revisão continuam iguais — muda o conteúdo que vem daqui para frente.
            </Text>
          </View>
        </Card>

        <View style={{ marginTop: theme.space[6], gap: theme.space[3] }}>
          {CEFR_LEVELS.map((level, index) => {
            const info = LEVEL_INFO[level];
            const selected = level === enrollment.currentLevel;
            const weeks = weeksToNextLevel(
              level,
              enrollment.dailyMinutes,
              enrollment.studyDays.length || 5,
            );

            return (
              <Touchable
                key={level}
                onPress={() => choose(level)}
                haptic="medium"
                pressedScale={0.99}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={`Nível ${level} — ${info.title}`}
              >
                <Card variant={selected ? 'subtle' : 'flat'} padding={4}>
                  <View
                    style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space[3] }}
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
                      <Text
                        variant="headline"
                        style={{
                          color: selected ? theme.colors.onBrand : theme.colors.textSecondary,
                        }}
                      >
                        {level}
                      </Text>
                    </View>

                    <View style={{ flex: 1, gap: 2 }}>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: theme.space[2],
                        }}
                      >
                        <Text variant="headline">{info.title}</Text>
                        {index < currentIndex ? (
                          <Badge label="Já passou" tone="neutral" />
                        ) : null}
                      </View>
                      <Text variant="caption" tone="secondary">
                        {info.description}
                      </Text>
                      <Text variant="caption" tone="tertiary">
                        ~{weeks} semanas até o próximo, no seu ritmo atual
                      </Text>
                    </View>

                    {selected ? (
                      <Ionicons name="checkmark-circle" size={24} color={theme.colors.brand} />
                    ) : saving === level ? (
                      <Text variant="caption" tone="tertiary">
                        …
                      </Text>
                    ) : null}
                  </View>
                </Card>
              </Touchable>
            );
          })}
        </View>

        <Card variant="outlined" padding={4} style={{ marginTop: theme.space[6] }}>
          <View style={{ flexDirection: 'row', gap: theme.space[3] }}>
            <Ionicons name="bulb" size={20} color={theme.colors.info} />
            <Text variant="caption" tone="secondary" flex>
              Na dúvida, escolha o nível abaixo do que você acha que tem. Um degrau baixo demais
              se recupera em uma sessão; um degrau alto demais custa semanas de frustração.
            </Text>
          </View>
        </Card>
      </ScrollView>
    </Screen>
  );
}
