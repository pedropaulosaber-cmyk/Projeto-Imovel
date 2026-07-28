/**
 * Banco de vocabulário.
 *
 * Une o catálogo de palavras (conteúdo) com o estado de memória do usuário
 * (SRS). O que torna esta tela útil e não apenas uma lista: cada palavra
 * mostra **a força da memória prevista**, o que responde a pergunta que o
 * usuário realmente tem — "eu sei essa palavra?" — em vez de "eu já vi essa
 * palavra?".
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, TextInput, View } from 'react-native';

import { contentRepository } from '@/db/repositories/content';
import { learnerRepository } from '@/db/repositories/learner';
import {
  Badge,
  EmptyState,
  Screen,
  SegmentedControl,
  Text,
  Touchable,
  useTheme,
} from '@/design';
import { normalizeAnswer } from '@/domain/grading';
import { predictedRecall } from '@/domain/srs';
import type { ReviewState, VocabularyItem } from '@/domain/types';
import { speechService } from '@/services/speech';
import { useAppStore } from '@/state/app-store';

type Filter = 'all' | 'weak' | 'starred' | 'mastered';

type Entry = { item: VocabularyItem; state: ReviewState | null; recall: number };

export default function Vocabulary() {
  const theme = useTheme();
  const router = useRouter();

  const profile = useAppStore((state) => state.profile);
  const enrollment = useAppStore((state) => state.enrollment);

  const [entries, setEntries] = useState<Entry[]>([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!profile || !enrollment) {
      setLoading(false);
      return;
    }

    const [states, items] = await Promise.all([
      learnerRepository.listReviewStates(profile.id, enrollment.language),
      contentRepository.listByFrequency(enrollment.language, 500),
    ]);

    const stateByConcept = new Map(states.map((state) => [state.conceptId, state]));
    const now = Date.now();

    setEntries(
      items.map((item) => {
        const state = stateByConcept.get(item.id) ?? null;
        return {
          item,
          state,
          recall: state ? predictedRecall(state, now) : 0,
        };
      }),
    );
    setLoading(false);
  }, [profile, enrollment]);

  useEffect(() => {
    void load();
    return () => {
      void speechService.stop();
    };
  }, [load]);

  const visible = useMemo(() => {
    const normalizedQuery = normalizeAnswer(query);

    return entries
      .filter((entry) => {
        if (normalizedQuery) {
          const haystack = normalizeAnswer(`${entry.item.term} ${entry.item.translation}`);
          if (!haystack.includes(normalizedQuery)) return false;
        }

        switch (filter) {
          case 'weak':
            // "Frágil" = já estudada mas com recordação prevista baixa. Item
            // nunca visto não é frágil, é desconhecido.
            return entry.state !== null && entry.recall < 0.7;
          case 'starred':
            return entry.state?.starred === true;
          case 'mastered':
            return entry.state?.state === 'mastered';
          default:
            return true;
        }
      })
      .sort((a, b) => {
        // No filtro "frágil", o mais esquecido vem primeiro; nos outros, a
        // ordem de frequência é a mais útil.
        if (filter === 'weak') return a.recall - b.recall;
        return (a.item.frequencyRank ?? 9999) - (b.item.frequencyRank ?? 9999);
      });
  }, [entries, query, filter]);

  const toggleStar = useCallback(
    async (entry: Entry) => {
      if (!entry.state) return;
      await learnerRepository.setStarred(entry.state.id, !entry.state.starred);
      await load();
    },
    [load],
  );

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
          <Text variant="title2">Vocabulário</Text>
        </View>

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
            placeholder="Buscar palavra ou tradução"
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
            { value: 'weak', label: 'Frágeis' },
            { value: 'starred', label: 'Favoritas' },
            { value: 'mastered', label: 'Dominadas' },
          ]}
        />
      </View>

      <FlatList
        data={visible}
        keyExtractor={(entry) => entry.item.id}
        contentContainerStyle={{
          paddingHorizontal: theme.layout.screenPadding,
          paddingTop: theme.space[4],
          paddingBottom: theme.space[10],
        }}
        // Listas de vocabulário chegam a milhares de itens; estas janelas
        // mantêm a rolagem fluida em aparelhos modestos.
        initialNumToRender={14}
        maxToRenderPerBatch={10}
        windowSize={7}
        removeClippedSubviews
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          loading ? null : (
            <EmptyState
              icon="search-outline"
              title="Nada por aqui"
              description={
                filter === 'starred'
                  ? 'Toque na estrela de uma palavra para guardá-la aqui.'
                  : 'Nenhuma palavra corresponde à sua busca.'
              }
            />
          )
        }
        renderItem={({ item: entry }) => (
          <WordRow
            entry={entry}
            onSpeak={() =>
              enrollment
                ? void speechService.speak(entry.item.term, { language: enrollment.language })
                : undefined
            }
            onStar={() => void toggleStar(entry)}
          />
        )}
      />
    </Screen>
  );
}

function WordRow({
  entry,
  onSpeak,
  onStar,
}: {
  entry: Entry;
  onSpeak: () => void;
  onStar: () => void;
}) {
  const theme = useTheme();
  const { item, state, recall } = entry;

  const strengthColor =
    state === null
      ? theme.colors.textTertiary
      : recall >= 0.85
        ? theme.colors.mastered
        : recall >= 0.6
          ? theme.colors.learning
          : theme.colors.due;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.space[3],
        paddingVertical: theme.space[3],
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.divider,
      }}
    >
      {/* Indicador de força da memória — quatro barras, leitura instantânea. */}
      <View style={{ width: 4, height: 38, borderRadius: 2, backgroundColor: strengthColor }} />

      <View style={{ flex: 1, gap: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space[2] }}>
          <Text variant="headline">{item.term}</Text>
          {item.cefr ? <Badge label={item.cefr} tone="neutral" /> : null}
        </View>
        <Text variant="footnote" tone="secondary">
          {item.translation}
        </Text>
        {state ? (
          <Text variant="caption" tone="tertiary">
            memória {Math.round(recall * 100)}% ·{' '}
            {state.state === 'mastered'
              ? 'dominada'
              : state.state === 'new'
                ? 'nova'
                : `${state.totalReviews} revisões`}
          </Text>
        ) : (
          <Text variant="caption" tone="tertiary">
            ainda não estudada
          </Text>
        )}
      </View>

      <Touchable
        onPress={onSpeak}
        haptic="light"
        ensureTouchTarget={false}
        style={{ padding: 8 }}
      >
        <Ionicons name="volume-medium-outline" size={20} color={theme.colors.textSecondary} />
      </Touchable>

      <Touchable
        onPress={onStar}
        haptic="light"
        ensureTouchTarget={false}
        style={{ padding: 8 }}
        accessibilityLabel={
          state?.starred ? 'Remover dos favoritos' : 'Adicionar aos favoritos'
        }
      >
        <Ionicons
          name={state?.starred ? 'star' : 'star-outline'}
          size={20}
          color={state?.starred ? theme.colors.streak : theme.colors.textTertiary}
        />
      </Touchable>
    </View>
  );
}
