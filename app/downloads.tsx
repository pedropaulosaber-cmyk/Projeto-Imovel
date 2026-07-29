/**
 * Downloads e armazenamento.
 *
 * Tela crítica para a promessa offline. Três coisas ela precisa fazer bem:
 *  1. deixar claro **o que já está disponível offline**;
 *  2. deixar o usuário escolher granularidade (idioma / curso / só áudio) e
 *     qualidade, porque plano de dados no Brasil é caro;
 *  3. permitir liberar espaço com um toque, mostrando quanto cada coisa ocupa.
 *
 * Nada aqui pode acontecer "por mágica": baixar consome dados do usuário e
 * essa decisão é sempre dele, nunca nossa.
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';

import { LANGUAGE_META } from '@/content/vocabulary';
import { getDatabase } from '@/db';
import { COLLECTION } from '@/db/collections';
import { contentRepository } from '@/db/repositories/content';
import {
  Badge,
  Button,
  Card,
  ProgressBar,
  Screen,
  SegmentedControl,
  Text,
  Touchable,
  useTheme,
} from '@/design';
import type { ContentBundle, DownloadQuality, DownloadRecord } from '@/domain/types';
import { formatBytes } from '@/lib/date';
import { useAppStore } from '@/state/app-store';

export default function Downloads() {
  const theme = useTheme();
  const router = useRouter();

  const enrollment = useAppStore((state) => state.enrollment);

  const [bundles, setBundles] = useState<ContentBundle[]>([]);
  const [downloads, setDownloads] = useState<Record<string, DownloadRecord>>({});
  const [quality, setQuality] = useState<DownloadQuality>('standard');
  const [storageBytes, setStorageBytes] = useState(0);
  const [counts, setCounts] = useState({ courses: 0, lessons: 0, exercises: 0, vocabulary: 0 });

  const load = useCallback(async () => {
    const db = getDatabase();

    const [allBundles, allDownloads, size, contentCounts] = await Promise.all([
      db.query<ContentBundle>(COLLECTION.contentBundles),
      db.query<DownloadRecord>(COLLECTION.downloads),
      db.estimateSizeBytes(),
      contentRepository.contentCounts(),
    ]);

    setBundles(allBundles);
    setDownloads(Object.fromEntries(allDownloads.map((record) => [record.bundleId, record])));
    setStorageBytes(size);
    setCounts(contentCounts);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  /**
   * Inicia o download de um pacote.
   *
   * Sem CDN configurado, o progresso é simulado localmente e o conteúdo já
   * embutido é marcado como disponível. A troca para o download real é a
   * substituição desta função por `expo-file-system` + a URL do pacote —
   * o resto da tela e o modelo de dados não mudam.
   */
  const startDownload = useCallback(
    async (bundle: ContentBundle) => {
      const db = getDatabase();

      const record: DownloadRecord = {
        id: `download:${bundle.id}`,
        bundleId: bundle.id,
        status: 'downloading',
        quality,
        progress: 0,
        bytesDownloaded: 0,
        downloadedAt: null,
        contentVersion: bundle.contentVersion,
        error: null,
      };

      await db.put(COLLECTION.downloads, record);
      setDownloads((previous) => ({ ...previous, [bundle.id]: record }));

      // Progresso incremental — a UI precisa mostrar movimento real, e este é
      // o mesmo caminho que o downloader de verdade vai percorrer.
      for (let step = 1; step <= 10; step += 1) {
        await new Promise((resolve) => setTimeout(resolve, 90));
        const progress = step / 10;
        const updated: DownloadRecord = {
          ...record,
          progress,
          bytesDownloaded: Math.round(bundle.sizeBytes[quality] * progress),
          status: progress === 1 ? 'complete' : 'downloading',
          downloadedAt: progress === 1 ? Date.now() : null,
        };
        await db.put(COLLECTION.downloads, updated);
        setDownloads((previous) => ({ ...previous, [bundle.id]: updated }));
      }

      await load();
    },
    [quality, load],
  );

  const removeDownload = useCallback(
    (bundle: ContentBundle) => {
      Alert.alert(
        'Remover download?',
        `Isso libera cerca de ${formatBytes(bundle.sizeBytes[quality])}. Você poderá baixar de novo quando quiser.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Remover',
            style: 'destructive',
            onPress: () => {
              void (async () => {
                const db = getDatabase();
                await db.delete(COLLECTION.downloads, `download:${bundle.id}`);

                // Só o escopo "idioma inteiro" apaga o conteúdo em si; os
                // demais apenas soltam o marcador, para não deixar o usuário
                // sem a base que veio embutida no app.
                if (bundle.scope === 'language') {
                  await contentRepository.removeLanguageContent(bundle.language);
                }

                await load();
              })();
            },
          },
        ],
      );
    },
    [quality, load],
  );

  const byLanguage = bundles.reduce<Record<string, ContentBundle[]>>((acc, bundle) => {
    const group = acc[bundle.language] ?? [];
    group.push(bundle);
    acc[bundle.language] = group;
    return acc;
  }, {});

  // Idioma ativo primeiro: é o que o usuário veio gerenciar em 90% dos casos.
  const orderedLanguages = Object.keys(byLanguage).sort((a, b) => {
    if (a === enrollment?.language) return -1;
    if (b === enrollment?.language) return 1;
    return a.localeCompare(b);
  });

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
          <Text variant="title2">Downloads</Text>
        </View>

        {/* ---------------- Armazenamento ---------------- */}
        <Card variant="flat" padding={5} style={{ marginTop: theme.space[5] }}>
          <View style={{ gap: theme.space[3] }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'baseline',
              }}
            >
              <Text variant="headline">Espaço usado</Text>
              <Text variant="title3" tone="brand">
                {formatBytes(storageBytes)}
              </Text>
            </View>

            <Text variant="caption" tone="tertiary">
              {counts.lessons} lições · {counts.exercises} exercícios · {counts.vocabulary}{' '}
              palavras disponíveis offline neste aparelho.
            </Text>

            <Badge
              label="Conteúdo básico já incluído no app"
              tone="success"
              icon="checkmark-circle"
            />
          </View>
        </Card>

        {/* ---------------- Qualidade ---------------- */}
        <View style={{ marginTop: theme.space[6], gap: theme.space[3] }}>
          <Text variant="overline" tone="tertiary">
            Qualidade dos áudios
          </Text>
          <SegmentedControl<DownloadQuality>
            value={quality}
            onChange={setQuality}
            options={[
              { value: 'standard', label: 'Padrão' },
              { value: 'high', label: 'Alta' },
            ]}
          />
          <Text variant="caption" tone="tertiary">
            {quality === 'standard'
              ? 'Padrão (64 kbps): suficiente para compreensão, ocupa 3× menos espaço e baixa muito mais rápido no 4G.'
              : 'Alta (192 kbps): melhor para treinar pronúncia com fones. Recomendado só no Wi-Fi.'}
          </Text>
        </View>

        {/* ---------------- Pacotes ---------------- */}
        {orderedLanguages.map((language) => {
          const meta = LANGUAGE_META[language as keyof typeof LANGUAGE_META];
          const items = byLanguage[language] ?? [];

          return (
            <View key={language} style={{ marginTop: theme.space[8], gap: theme.space[3] }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space[2] }}>
                <Text variant="title3">{meta?.flag}</Text>
                <Text variant="headline">{meta?.name}</Text>
                {language === enrollment?.language ? (
                  <Badge label="Ativo" tone="brand" />
                ) : null}
              </View>

              {items.map((bundle) => (
                <BundleRow
                  key={bundle.id}
                  bundle={bundle}
                  record={downloads[bundle.id]}
                  quality={quality}
                  onDownload={() => void startDownload(bundle)}
                  onRemove={() => removeDownload(bundle)}
                />
              ))}
            </View>
          );
        })}

        <Card variant="outlined" padding={4} style={{ marginTop: theme.space[8] }}>
          <View style={{ flexDirection: 'row', gap: theme.space[3] }}>
            <Ionicons name="information-circle" size={20} color={theme.colors.info} />
            <Text variant="caption" tone="secondary" flex>
              O Lumo baixa conteúdo apenas quando você pede. Nada é baixado automaticamente no
              plano de dados móveis.
            </Text>
          </View>
        </Card>
      </ScrollView>
    </Screen>
  );
}

function BundleRow({
  bundle,
  record,
  quality,
  onDownload,
  onRemove,
}: {
  bundle: ContentBundle;
  record: DownloadRecord | undefined;
  quality: DownloadQuality;
  onDownload: () => void;
  onRemove: () => void;
}) {
  const theme = useTheme();

  const downloading = record?.status === 'downloading';
  const complete = record?.status === 'complete';

  const icon: keyof typeof Ionicons.glyphMap =
    bundle.scope === 'audio' ? 'musical-notes' : bundle.scope === 'language' ? 'globe' : 'book';

  return (
    <Card variant="flat" padding={4}>
      <View style={{ gap: theme.space[3] }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space[3] }}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: theme.radius.sm,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: complete
                ? theme.colors.successSubtle
                : theme.colors.surfaceSunken,
            }}
          >
            <Ionicons
              name={complete ? 'checkmark-circle' : icon}
              size={20}
              color={complete ? theme.colors.success : theme.colors.textSecondary}
            />
          </View>

          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="callout">{bundle.title}</Text>
            <Text variant="caption" tone="tertiary">
              {formatBytes(bundle.sizeBytes[quality])}
              {complete ? ' · disponível offline' : ''}
            </Text>
          </View>

          {complete ? (
            <Touchable
              onPress={onRemove}
              haptic="warning"
              accessibilityLabel={`Remover ${bundle.title}`}
              ensureTouchTarget={false}
              style={{ padding: 8 }}
            >
              <Ionicons name="trash-outline" size={19} color={theme.colors.danger} />
            </Touchable>
          ) : downloading ? null : (
            <Button label="Baixar" size="sm" variant="secondary" onPress={onDownload} />
          )}
        </View>

        {downloading ? (
          <View style={{ gap: 5 }}>
            <ProgressBar value={record?.progress ?? 0} height={6} />
            <Text variant="caption" tone="tertiary">
              {Math.round((record?.progress ?? 0) * 100)}% ·{' '}
              {formatBytes(record?.bytesDownloaded ?? 0)}
            </Text>
          </View>
        ) : null}
      </View>
    </Card>
  );
}
