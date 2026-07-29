/**
 * Expressões idiomáticas.
 *
 * O card só revela o significado depois do toque. Isso é deliberado: mostrar
 * a expressão e a tradução juntas transforma a tela numa lista passiva, que se
 * lê e se esquece. Esconder o sentido força **recuperação ativa** — o usuário
 * tenta adivinhar antes de ver, e é a tentativa que fixa a memória.
 *
 * A tradução literal aparece junto do significado, nunca antes: o
 * estranhamento de "está chovendo gatos e cachorros" só funciona como âncora
 * depois que a pessoa já tentou entender sozinha.
 */

import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, TextInput, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { LANGUAGE_META } from '@/content/vocabulary';
import { libraryRepository } from '@/db/repositories/library';
import {
  Badge,
  Card,
  EmptyState,
  Screen,
  SegmentedControl,
  Text,
  Touchable,
  useTheme,
} from '@/design';
import { normalizeAnswer } from '@/domain/grading';
import type { Idiom, IdiomProgress } from '@/domain/types';
import { speechService } from '@/services/speech';
import { useAppStore } from '@/state/app-store';

type Filter = 'all' | 'common' | 'starred' | 'level';

const REGISTER_LABEL: Record<
  Idiom['register'],
  { label: string; tone: 'neutral' | 'brand' | 'warning' | 'danger' }
> = {
  formal: { label: 'Formal', tone: 'brand' },
  neutral: { label: 'Neutro', tone: 'neutral' },
  informal: { label: 'Informal', tone: 'warning' },
  slang: { label: 'Gíria', tone: 'danger' },
};

export default function Idioms() {
  const theme = useTheme();
  const router = useRouter();

  const profile = useAppStore((state) => state.profile);
  const enrollment = useAppStore((state) => state.enrollment);

  const [idioms, setIdioms] = useState<Idiom[]>([]);
  const [progress, setProgress] = useState<Record<string, IdiomProgress>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const load = useCallback(async () => {
    if (!enrollment || !profile) return;

    const [list, records] = await Promise.all([
      libraryRepository.listIdioms(enrollment.language),
      libraryRepository.listIdiomProgress(profile.id),
    ]);

    setIdioms(list);
    setProgress(Object.fromEntries(records.map((record) => [record.idiomId, record])));
  }, [enrollment, profile]);

  useFocusEffect(
    useCallback(() => {
      void load();
      return () => {
        void speechService.stop();
      };
    }, [load]),
  );

  const visible = useMemo(() => {
    const needle = normalizeAnswer(query);

    return idioms.filter((idiom) => {
      if (needle) {
        const haystack = normalizeAnswer(
          `${idiom.expression} ${idiom.romanization ?? ''} ${idiom.meaning} ${idiom.equivalent ?? ''}`,
        );
        if (!haystack.includes(needle)) return false;
      }

      switch (filter) {
        case 'common':
          return idiom.frequency >= 4;
        case 'starred':
          return progress[idiom.id]?.starred === true;
        case 'level':
          return idiom.cefr === enrollment?.currentLevel;
        default:
          return true;
      }
    });
  }, [idioms, query, filter, progress, enrollment]);

  const reveal = useCallback(
    (idiom: Idiom) => {
      setRevealed((current) => ({ ...current, [idiom.id]: true }));
      if (profile) void libraryRepository.recordIdiomSeen(profile.id, idiom.id);
    },
    [profile],
  );

  const toggleStar = useCallback(
    async (idiom: Idiom) => {
      if (!profile) return;
      await libraryRepository.toggleIdiomStar(profile.id, idiom.id);
      await load();
    },
    [profile, load],
  );

  const meta = enrollment ? LANGUAGE_META[enrollment.language] : null;

  return (
    <Screen padded={false}>
      <View
        style={{
          paddingHorizontal: theme.layout.screenPadding,
          paddingTop: theme.space[10],
          gap: theme.space[4],
        }}
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
            <Text variant="title2">Expressões</Text>
            {meta ? (
              <Text variant="caption" tone="tertiary">
                {meta.flag} {meta.name} · {idioms.length} expressões
              </Text>
            ) : null}
          </View>
        </View>

        <Card variant="subtle" padding={3}>
          <View style={{ flexDirection: 'row', gap: theme.space[2] }}>
            <Ionicons name="bulb" size={17} color={theme.colors.brand} />
            <Text variant="caption" tone="secondary" flex>
              Tente adivinhar o significado antes de tocar. É a tentativa que fixa a expressão —
              ler a resposta direto não ensina.
            </Text>
          </View>
        </Card>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.space[2],
            paddingHorizontal: theme.space[3],
            height: 46,
            borderRadius: theme.radius.lg,
            backgroundColor: theme.colors.surfaceSunken,
          }}
        >
          <Ionicons name="search" size={18} color={theme.colors.textTertiary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar expressão ou significado"
            placeholderTextColor={theme.colors.textTertiary}
            autoCorrect={false}
            autoCapitalize="none"
            style={{ flex: 1, color: theme.colors.textPrimary, fontSize: 16 }}
          />
          {query ? (
            <Touchable onPress={() => setQuery('')} ensureTouchTarget={false} haptic="none">
              <Ionicons name="close-circle" size={18} color={theme.colors.textTertiary} />
            </Touchable>
          ) : null}
        </View>

        <SegmentedControl<Filter>
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: 'Todas' },
            { value: 'common', label: 'Mais usadas' },
            { value: 'level', label: 'Meu nível' },
            { value: 'starred', label: 'Salvas' },
          ]}
        />
      </View>

      <FlatList
        data={visible}
        keyExtractor={(idiom) => idiom.id}
        contentContainerStyle={{
          paddingHorizontal: theme.layout.screenPadding,
          paddingTop: theme.space[4],
          paddingBottom: theme.space[10],
          gap: theme.space[3],
        }}
        initialNumToRender={8}
        maxToRenderPerBatch={6}
        windowSize={7}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="search-outline"
            title="Nenhuma expressão aqui"
            description={
              filter === 'starred'
                ? 'Toque na estrela de uma expressão para guardá-la.'
                : 'Nenhuma expressão corresponde à sua busca.'
            }
          />
        }
        renderItem={({ item }) => (
          <IdiomCard
            idiom={item}
            revealed={revealed[item.id] === true}
            starred={progress[item.id]?.starred === true}
            onReveal={() => reveal(item)}
            onStar={() => void toggleStar(item)}
            onSpeak={() =>
              enrollment
                ? void speechService.speak(item.expression, { language: enrollment.language })
                : undefined
            }
          />
        )}
      />
    </Screen>
  );
}

/* ------------------------------------------------------------------ *
 * Card
 * ------------------------------------------------------------------ */

function IdiomCard({
  idiom,
  revealed,
  starred,
  onReveal,
  onStar,
  onSpeak,
}: {
  idiom: Idiom;
  revealed: boolean;
  starred: boolean;
  onReveal: () => void;
  onStar: () => void;
  onSpeak: () => void;
}) {
  const theme = useTheme();
  const register = REGISTER_LABEL[idiom.register];

  return (
    <Card variant={revealed ? 'subtle' : 'outlined'} padding={4}>
      <View style={{ gap: theme.space[3] }}>
        {/* Expressão */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: theme.space[2] }}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="title3">{idiom.expression}</Text>
            {idiom.romanization ? (
              <Text variant="footnote" tone="tertiary">
                {idiom.romanization}
              </Text>
            ) : null}
          </View>

          <Touchable
            onPress={onSpeak}
            haptic="light"
            ensureTouchTarget={false}
            style={{ padding: 6 }}
          >
            <Ionicons
              name="volume-medium-outline"
              size={20}
              color={theme.colors.textSecondary}
            />
          </Touchable>
          <Touchable
            onPress={onStar}
            haptic="light"
            ensureTouchTarget={false}
            style={{ padding: 6 }}
            accessibilityLabel={starred ? 'Remover das salvas' : 'Salvar expressão'}
          >
            <Ionicons
              name={starred ? 'star' : 'star-outline'}
              size={20}
              color={starred ? theme.colors.streak : theme.colors.textTertiary}
            />
          </Touchable>
        </View>

        <View style={{ flexDirection: 'row', gap: theme.space[2], flexWrap: 'wrap' }}>
          <Badge label={register.label} tone={register.tone} />
          <Badge label={idiom.cefr} tone="neutral" />
          <Badge
            label={
              idiom.frequency >= 4 ? 'Muito usada' : idiom.frequency >= 3 ? 'Comum' : 'Rara'
            }
            tone={idiom.frequency >= 4 ? 'success' : 'neutral'}
          />
        </View>

        {revealed ? (
          <Animated.View
            entering={FadeIn.duration(theme.duration.fast)}
            style={{ gap: theme.space[3] }}
          >
            <View
              style={{
                padding: theme.space[3],
                borderRadius: theme.radius.md,
                backgroundColor: theme.colors.surfaceSunken,
                gap: theme.space[2],
              }}
            >
              <Row label="Ao pé da letra" value={idiom.literal} tone="tertiary" />
              <Row label="Significa" value={idiom.meaning} />
              {idiom.equivalent ? (
                <Row label="Em português" value={idiom.equivalent} tone="brand" />
              ) : (
                <Text variant="caption" tone="tertiary">
                  Não há equivalente exato em português — use pelo significado.
                </Text>
              )}
            </View>

            {idiom.origin ? (
              <View style={{ flexDirection: 'row', gap: theme.space[2] }}>
                <Ionicons name="time-outline" size={15} color={theme.colors.textTertiary} />
                <Text variant="caption" tone="tertiary" flex>
                  {idiom.origin}
                </Text>
              </View>
            ) : null}

            <View
              style={{
                padding: theme.space[3],
                borderRadius: theme.radius.md,
                borderLeftWidth: 3,
                borderLeftColor: theme.colors.brand,
                backgroundColor: theme.colors.surface,
                gap: 3,
              }}
            >
              <Text variant="callout">{idiom.example}</Text>
              <Text variant="footnote" tone="secondary">
                {idiom.exampleTranslation}
              </Text>
            </View>
          </Animated.View>
        ) : (
          <Touchable
            onPress={onReveal}
            haptic="light"
            style={{
              paddingVertical: theme.space[3],
              borderRadius: theme.radius.md,
              backgroundColor: theme.colors.surfaceSunken,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              gap: theme.space[2],
            }}
          >
            <Ionicons name="eye-outline" size={17} color={theme.colors.brand} />
            <Text variant="subhead" tone="brand">
              O que será que significa?
            </Text>
          </Touchable>
        )}
      </View>
    </Card>
  );
}

function Row({
  label,
  value,
  tone = 'primary',
}: {
  label: string;
  value: string;
  tone?: 'primary' | 'tertiary' | 'brand';
}) {
  return (
    <View style={{ gap: 1 }}>
      <Text variant="caption" tone="tertiary">
        {label}
      </Text>
      <Text variant="callout" tone={tone === 'primary' ? 'primary' : tone}>
        {value}
      </Text>
    </View>
  );
}
