/**
 * Leitor de apostila.
 *
 * Renderiza os blocos tipados com o design system. Duas decisões de leitura
 * que importam num app de idioma:
 *
 *  - **Todo exemplo é tocável** e fala em voz alta. Ler uma frase sem ouvir é
 *    metade do aprendizado, e o TTS já está no aparelho.
 *  - **Navegação por seção no topo**, fixa. Apostila serve para consulta
 *    pontual; obrigar a rolar até achar a regra derrota o propósito.
 */

import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { workbookFileName, workbookToPrintableHtml } from '@/content/workbook-pdf';
import { libraryRepository } from '@/db/repositories/library';
import { Badge, Card, Chip, Screen, Text, Touchable, useTheme } from '@/design';
import type { Workbook, WorkbookBlock } from '@/domain/types';
import { exportHtmlAsPdf } from '@/services/pdf';
import { speechService } from '@/services/speech';
import { useAppStore } from '@/state/app-store';

export default function WorkbookReader() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const enrollment = useAppStore((state) => state.enrollment);

  const [workbook, setWorkbook] = useState<Workbook | null>(null);
  const [activeSection, setActiveSection] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!id) return;
    void libraryRepository.getWorkbook(id).then(setWorkbook);

    return () => {
      void speechService.stop();
    };
  }, [id]);

  if (!workbook) {
    return (
      <Screen>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text tone="secondary">Abrindo apostila…</Text>
        </View>
      </Screen>
    );
  }

  const sections = [...workbook.sections].sort((a, b) => a.order - b.order);
  const section = sections[activeSection];

  return (
    <Screen padded={false}>
      {/* Cabeçalho */}
      <View
        style={{
          paddingHorizontal: theme.layout.screenPadding,
          paddingTop: theme.space[10],
          gap: theme.space[3],
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
            <Text variant="headline" numberOfLines={1}>
              {workbook.title}
            </Text>
            <Text variant="caption" tone="tertiary">
              Nível {workbook.level} · {sections.length} seções
            </Text>
          </View>

          <Touchable
            onPress={() => {
              void exportHtmlAsPdf(
                workbookToPrintableHtml(workbook),
                workbookFileName(workbook, workbook.language),
              );
            }}
            haptic="light"
            accessibilityLabel="Baixar apostila em PDF"
            ensureTouchTarget={false}
            style={{ padding: 6 }}
          >
            <Ionicons name="document-text-outline" size={22} color={theme.colors.brand} />
          </Touchable>
        </View>

        {/* Índice de seções — apostila é feita para consulta pontual. */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: theme.space[2], paddingRight: theme.space[4] }}
        >
          {sections.map((item, index) => (
            <Chip
              key={item.id}
              label={item.title}
              selected={index === activeSection}
              onPress={() => {
                setActiveSection(index);
                scrollRef.current?.scrollTo({ y: 0, animated: true });
              }}
            />
          ))}
        </ScrollView>
      </View>

      {/* Conteúdo */}
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: theme.layout.screenPadding,
          paddingTop: theme.space[5],
          paddingBottom: theme.space[16],
          maxWidth: theme.layout.maxContentWidth,
          width: '100%',
          alignSelf: 'center',
          gap: theme.space[4],
        }}
        showsVerticalScrollIndicator={false}
      >
        {section?.blocks.map((block, index) => (
          <BlockView
            key={`${section.id}:${index}`}
            block={block}
            language={enrollment?.language ?? 'en'}
          />
        ))}

        {/* Navegação entre seções no fim — evita rolar de volta ao topo. */}
        <View style={{ flexDirection: 'row', gap: theme.space[2], marginTop: theme.space[6] }}>
          {activeSection > 0 ? (
            <Touchable
              onPress={() => {
                setActiveSection(activeSection - 1);
                scrollRef.current?.scrollTo({ y: 0, animated: true });
              }}
              haptic="light"
              style={{
                flex: 1,
                padding: theme.space[4],
                borderRadius: theme.radius.lg,
                backgroundColor: theme.colors.surfaceRaised,
              }}
            >
              <Text variant="caption" tone="tertiary">
                Anterior
              </Text>
              <Text variant="callout" numberOfLines={1}>
                {sections[activeSection - 1]?.title}
              </Text>
            </Touchable>
          ) : null}

          {activeSection < sections.length - 1 ? (
            <Touchable
              onPress={() => {
                setActiveSection(activeSection + 1);
                scrollRef.current?.scrollTo({ y: 0, animated: true });
              }}
              haptic="light"
              style={{
                flex: 1,
                padding: theme.space[4],
                borderRadius: theme.radius.lg,
                backgroundColor: theme.colors.brandSubtle,
              }}
            >
              <Text variant="caption" tone="brand">
                Próxima
              </Text>
              <Text variant="callout" numberOfLines={1}>
                {sections[activeSection + 1]?.title}
              </Text>
            </Touchable>
          ) : null}
        </View>
      </ScrollView>
    </Screen>
  );
}

/* ------------------------------------------------------------------ *
 * Renderização dos blocos
 * ------------------------------------------------------------------ */

function BlockView({
  block,
  language,
}: {
  block: WorkbookBlock;
  language: Parameters<typeof speechService.speak>[1]['language'];
}) {
  const theme = useTheme();

  switch (block.kind) {
    case 'heading':
      return (
        <Text variant="title3" style={{ marginTop: theme.space[3] }}>
          {block.text}
        </Text>
      );

    case 'paragraph':
      return (
        <Text variant="body" tone="secondary" style={{ lineHeight: 26 }}>
          {block.text}
        </Text>
      );

    case 'callout': {
      const tone = {
        tip: { bg: theme.colors.brandSubtle, border: theme.colors.brandBorder, icon: 'bulb' },
        warning: {
          bg: theme.colors.warningSubtle,
          border: theme.colors.warningBorder,
          icon: 'alert-circle',
        },
        rule: { bg: theme.colors.infoSubtle, border: theme.colors.infoBorder, icon: 'book' },
      }[block.tone];

      return (
        <View
          style={{
            padding: theme.space[4],
            borderRadius: theme.radius.lg,
            backgroundColor: tone.bg,
            borderWidth: 1,
            borderColor: tone.border,
            gap: theme.space[2],
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons
              name={tone.icon as keyof typeof Ionicons.glyphMap}
              size={16}
              color={theme.colors.textSecondary}
            />
            <Text variant="headline">{block.title}</Text>
          </View>
          <Text variant="footnote" tone="secondary" style={{ lineHeight: 21 }}>
            {block.text}
          </Text>
        </View>
      );
    }

    case 'list':
      return (
        <View style={{ gap: theme.space[2] }}>
          {block.items.map((item) => (
            <View key={item} style={{ flexDirection: 'row', gap: theme.space[2] }}>
              <Ionicons
                name="ellipse"
                size={6}
                color={theme.colors.brand}
                style={{ marginTop: 8 }}
              />
              <Text variant="callout" flex>
                {item}
              </Text>
            </View>
          ))}
        </View>
      );

    case 'vocabTable':
      return (
        <Card variant="outlined" padding={0}>
          {block.rows.map((row, index) => (
            <Touchable
              key={`${row.term}-${index}`}
              onPress={() => void speechService.speak(row.term, { language })}
              haptic="light"
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: theme.space[3],
                paddingVertical: theme.space[3],
                paddingHorizontal: theme.space[4],
                borderBottomWidth: index === block.rows.length - 1 ? 0 : 1,
                borderBottomColor: theme.colors.divider,
              }}
            >
              <View style={{ flex: 1, gap: 1 }}>
                <Text variant="callout" weight="600">
                  {row.term}
                </Text>
                {row.romanization ? (
                  <Text variant="caption" tone="tertiary">
                    {row.romanization}
                  </Text>
                ) : null}
              </View>
              <Text variant="footnote" tone="secondary" style={{ flex: 1 }}>
                {row.translation}
              </Text>
              <Ionicons name="volume-low-outline" size={16} color={theme.colors.textTertiary} />
            </Touchable>
          ))}
        </Card>
      );

    case 'examples':
      return (
        <View style={{ gap: theme.space[3] }}>
          {block.items.map((item, index) => (
            <Touchable
              key={`${item.target}-${index}`}
              onPress={() => void speechService.speak(item.target, { language })}
              haptic="light"
              style={{
                padding: theme.space[3],
                borderRadius: theme.radius.md,
                backgroundColor: theme.colors.surfaceSunken,
                gap: 3,
              }}
            >
              <Text variant="callout" weight="600">
                {item.target}
              </Text>
              {item.romanization ? (
                <Text variant="caption" tone="tertiary">
                  {item.romanization}
                </Text>
              ) : null}
              <Text variant="footnote" tone="secondary">
                {item.native}
              </Text>
            </Touchable>
          ))}
        </View>
      );

    case 'conjugation':
      return (
        <Card variant="outlined" padding={4}>
          <View style={{ gap: theme.space[2] }}>
            <Badge label={block.verb} tone="brand" />
            {block.forms.map((form) => (
              <View
                key={form.person}
                style={{ flexDirection: 'row', justifyContent: 'space-between' }}
              >
                <Text variant="footnote" tone="secondary">
                  {form.person}
                </Text>
                <Text variant="callout">{form.form}</Text>
              </View>
            ))}
          </View>
        </Card>
      );
  }
}
