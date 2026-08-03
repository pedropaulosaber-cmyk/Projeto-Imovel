/**
 * Biblioteca de apostilas.
 *
 * Uma apostila por nível CEFR, no idioma que o usuário está estudando. A do
 * nível atual aparece em destaque; as anteriores ficam disponíveis para
 * consulta e as seguintes, visíveis para dar noção do caminho.
 *
 * O botão de download não transfere nada da rede: a apostila é gerada no
 * próprio dispositivo. "Baixar" a fixa para consulta offline permanente.
 */

import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, ScrollView, Share, View } from 'react-native';

import { LANGUAGE_META } from '@/content/vocabulary';
import { workbookFileName, workbookToPrintableHtml } from '@/content/workbook-pdf';
import { workbookToText } from '@/content/workbooks';
import { libraryRepository } from '@/db/repositories/library';
import { Badge, Button, Card, Screen, Text, Touchable, useTheme } from '@/design';
import { CEFR_LEVELS, type Workbook } from '@/domain/types';
import { formatBytes } from '@/lib/date';
import { exportHtmlAsPdf } from '@/services/pdf';
import { useAppStore } from '@/state/app-store';

export default function Workbooks() {
  const theme = useTheme();
  const router = useRouter();

  const enrollment = useAppStore((state) => state.enrollment);
  const [workbooks, setWorkbooks] = useState<Workbook[]>([]);
  const [downloaded, setDownloaded] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!enrollment) return;

    const [list, downloads] = await Promise.all([
      libraryRepository.listWorkbooks(enrollment.language),
      libraryRepository.listWorkbookDownloads(),
    ]);

    setWorkbooks(list);
    setDownloaded(
      Object.fromEntries(downloads.map((record) => [record.workbookId, record.sizeBytes])),
    );
  }, [enrollment]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const toggleDownload = useCallback(
    async (workbook: Workbook) => {
      setBusy(workbook.id);
      try {
        if (downloaded[workbook.id]) {
          await libraryRepository.removeWorkbookDownload(workbook.id);
        } else {
          await libraryRepository.markWorkbookDownloaded(workbook);
        }
        await load();
      } finally {
        setBusy(null);
      }
    },
    [downloaded, load],
  );

  /**
   * Gera o PDF.
   *
   * O documento é montado como HTML e impresso pelo motor do sistema, que já
   * tem as fontes instaladas. Uma biblioteca de PDF em JS teria de embutir
   * cada peso e cada estilo no bundle para produzir o mesmo material.
   */
  const exportPdf = useCallback(
    async (workbook: Workbook) => {
      if (!enrollment) return;
      setBusy(workbook.id);

      try {
        const result = await exportHtmlAsPdf(
          workbookToPrintableHtml(workbook),
          workbookFileName(workbook, enrollment.language),
        );

        // Falha honesta: se o PDF não saiu, o usuário precisa saber por quê —
        // e ainda assim levar o conteúdo embora, em texto.
        if (!result.ok) {
          Alert.alert('Não foi possível gerar o PDF', result.reason, [
            { text: 'Fechar', style: 'cancel' },
            {
              text: 'Exportar como texto',
              onPress: () => {
                void Share.share({ message: workbookToText(workbook), title: workbook.title });
              },
            },
          ]);
        }
      } finally {
        setBusy(null);
      }
    },
    [enrollment],
  );

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
          <Text variant="title2">Apostilas</Text>
        </View>

        <Card variant="subtle" padding={4} style={{ marginTop: theme.space[5] }}>
          <View style={{ flexDirection: 'row', gap: theme.space[3] }}>
            <Ionicons name="library" size={22} color={theme.colors.brand} />
            <Text variant="footnote" tone="secondary" flex>
              Uma apostila por nível de {meta.name.toLowerCase()}, acompanhando a trilha. Serve
              para consultar a regra depois — sem precisar refazer a lição.
            </Text>
          </View>
        </Card>

        <View style={{ marginTop: theme.space[6], gap: theme.space[3] }}>
          {workbooks.map((workbook) => {
            const levelIndex = CEFR_LEVELS.indexOf(workbook.level);
            const isCurrent = workbook.level === enrollment.currentLevel;
            const isAhead = levelIndex > currentIndex;
            const size = downloaded[workbook.id];

            return (
              <Card
                key={workbook.id}
                variant={isCurrent ? 'subtle' : 'flat'}
                padding={4}
                style={{ opacity: isAhead ? 0.72 : 1 }}
              >
                <View style={{ gap: theme.space[3] }}>
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
                        backgroundColor: isCurrent
                          ? theme.colors.brand
                          : theme.colors.surfaceSunken,
                      }}
                    >
                      <Text
                        variant="headline"
                        style={{
                          color: isCurrent ? theme.colors.onBrand : theme.colors.textSecondary,
                        }}
                      >
                        {workbook.level}
                      </Text>
                    </View>

                    <View style={{ flex: 1, gap: 2 }}>
                      <Text variant="headline" numberOfLines={1}>
                        {workbook.title}
                      </Text>
                      <Text variant="caption" tone="secondary" numberOfLines={2}>
                        {workbook.subtitle}
                      </Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', gap: theme.space[2], flexWrap: 'wrap' }}>
                    <Badge
                      label={`${workbook.sections.length} seções`}
                      tone="neutral"
                      icon="list"
                    />
                    <Badge label={`~${workbook.estimatedPages} págs`} tone="neutral" />
                    {isCurrent ? <Badge label="Seu nível" tone="brand" icon="star" /> : null}
                    {size ? (
                      <Badge
                        label={`Offline · ${formatBytes(size)}`}
                        tone="success"
                        icon="checkmark-circle"
                      />
                    ) : null}
                  </View>

                  <View style={{ flexDirection: 'row', gap: theme.space[2] }}>
                    <Button
                      label="Abrir"
                      size="sm"
                      onPress={() => router.push(`/workbook/${workbook.id}` as never)}
                      style={{ flex: 1 }}
                    />
                    <Button
                      label={size ? 'Remover' : 'Baixar'}
                      size="sm"
                      variant="secondary"
                      icon={size ? 'trash-outline' : 'download-outline'}
                      loading={busy === workbook.id}
                      onPress={() => void toggleDownload(workbook)}
                      style={{ flex: 1 }}
                    />
                    <Button
                      label="PDF"
                      size="sm"
                      variant="ghost"
                      icon="document-text-outline"
                      loading={busy === workbook.id}
                      onPress={() => void exportPdf(workbook)}
                    />
                  </View>
                </View>
              </Card>
            );
          })}
        </View>

        <Card variant="outlined" padding={4} style={{ marginTop: theme.space[6] }}>
          <View style={{ flexDirection: 'row', gap: theme.space[3] }}>
            <Ionicons name="information-circle" size={20} color={theme.colors.info} />
            <Text variant="caption" tone="secondary" flex>
              As apostilas são geradas no seu aparelho a partir do conteúdo já instalado —
              baixar não consome dados móveis. "PDF" gera o documento completo — com capa,
              sumário e cerca de 20 páginas — pronto para imprimir ou guardar.
            </Text>
          </View>
        </Card>
      </ScrollView>
    </Screen>
  );
}
