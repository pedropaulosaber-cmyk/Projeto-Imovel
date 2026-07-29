/**
 * Tutor de IA — conversa por texto e voz.
 *
 * Duas coisas o separam de um chatbot genérico:
 *
 *  1. **Funciona offline.** Sem rede, o tutor roda por cenários roteirizados e
 *     correção por regra (`OfflineTutorProvider`). Menos flexível, mas útil de
 *     verdade — e nunca uma tela de erro.
 *
 *  2. **Corrige enquanto conversa.** Cada mensagem do usuário passa pelo
 *     detector de erros típicos de lusófonos, e a correção aparece junto da
 *     resposta, não numa aba escondida que ninguém abre.
 */

import { Ionicons } from '@expo/vector-icons';
import { useCallback, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { SPEAKING_MODES } from '@/ai/conversation';
import { SCENARIO_LIST } from '@/ai/knowledge';
import { OfflineTutorProvider } from '@/ai/offline-tutor';
import { ResilientAiProvider } from '@/ai/provider';
import { Badge, Card, Chip, Screen, Text, Touchable, useTheme } from '@/design';
import type { Correction, TutorMessage } from '@/domain/types';
import { ulid } from '@/lib/id';
import { speechService } from '@/services/speech';
import { useAppStore } from '@/state/app-store';

/**
 * Sem backend configurado, o provedor remoto é `null` e tudo roda offline.
 * Injetar um `RemoteAiProvider` aqui é a única mudança necessária para ativar
 * o modelo de linguagem completo.
 */
const tutor = new ResilientAiProvider(null, new OfflineTutorProvider());

export default function Tutor() {
  const theme = useTheme();
  const scrollRef = useRef<ScrollView>(null);

  const profile = useAppStore((state) => state.profile);
  const enrollment = useAppStore((state) => state.enrollment);

  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [input, setInput] = useState('');
  const [scenario, setScenario] = useState<string | null>(null);
  // O modo de fala é o segundo eixo da conversa: o cenário decide *onde* ela
  // acontece, o modo decide *como* se fala ali. Um pedido de desculpas ao chefe
  // e ao melhor amigo usam o mesmo vocabulário e exigem registros opostos.
  const [mode, setMode] = useState<string>('casual');
  const [thinking, setThinking] = useState(false);

  const conversationId = useRef(ulid()).current;

  const send = useCallback(
    async (text: string) => {
      if (!text.trim() || !enrollment || thinking) return;

      const userMessage: TutorMessage = {
        id: ulid(),
        conversationId,
        role: 'user',
        content: text.trim(),
        createdAt: Date.now(),
        offline: true,
      };

      const history = [...messages, userMessage];
      setMessages(history);
      setInput('');
      setThinking(true);

      try {
        const { reply, corrections } = await tutor.chat(
          {
            language: enrollment.language,
            level: enrollment.currentLevel,
            nativeLanguage: profile?.nativeLanguage ?? 'pt-BR',
            history,
            activeVocabulary: [],
            knownWeaknesses: [],
            scenario: scenario ?? undefined,
            speakingMode: mode,
          },
          text.trim(),
        );

        const tutorMessage: TutorMessage = {
          id: ulid(),
          conversationId,
          role: 'tutor',
          content: reply,
          corrections,
          createdAt: Date.now(),
          offline: true,
        };

        setMessages((previous) => [...previous, tutorMessage]);

        // Fala a resposta automaticamente: escutar a própria conversa é metade
        // do valor de uma prática de conversação.
        void speechService.speak(stripHints(reply), {
          language: enrollment.language,
          rate: 0.92,
        });
      } finally {
        setThinking(false);
        requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
      }
    },
    [messages, enrollment, profile, scenario, mode, thinking, conversationId],
  );

  const startScenario = useCallback(
    (id: string) => {
      setScenario(id);
      setMessages([]);
      // A primeira fala é do tutor — o usuário não deveria ter que abrir a
      // conversa numa língua que mal fala.
      void send('__start__');
    },
    [send],
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

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <Screen padded={false}>
        {/* Cabeçalho */}
        <View
          style={{
            paddingHorizontal: theme.layout.screenPadding,
            paddingTop: theme.space[3],
            paddingBottom: theme.space[3],
            gap: theme.space[3],
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Text variant="title1">Tutor</Text>
            <Badge label="Offline" tone="success" icon="cloud-offline" />
          </View>

          {/* Cenários */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: theme.space[2], paddingRight: theme.space[4] }}
          >
            {SCENARIO_LIST.map((item) => (
              <Chip
                key={item.id}
                label={item.title}
                icon={item.icon as never}
                selected={scenario === item.id}
                onPress={() => startScenario(item.id)}
              />
            ))}
            <Chip
              label="Conversa livre"
              icon="chatbubbles-outline"
              selected={scenario === null}
              onPress={() => {
                setScenario(null);
                setMessages([]);
              }}
            />
          </ScrollView>

          {/* Modo de fala */}
          <View style={{ gap: theme.space[2], marginTop: theme.space[3] }}>
            <Text variant="caption" tone="tertiary">
              Como você quer praticar
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: theme.space[2], paddingRight: theme.space[4] }}
            >
              {SPEAKING_MODES.map((item) => (
                <Chip
                  key={item.id}
                  label={item.title}
                  icon={item.icon as never}
                  selected={mode === item.id}
                  onPress={() => {
                    setMode(item.id);
                    // Trocar de modo reinicia a conversa: manter o histórico
                    // faria o tutor mudar de registro no meio do diálogo, o que
                    // confunde mais do que ensina.
                    setMessages([]);
                  }}
                />
              ))}
            </ScrollView>
            <Text variant="caption" tone="secondary">
              {SPEAKING_MODES.find((item) => item.id === mode)?.trains ?? ''}
            </Text>
          </View>
        </View>

        {/* Conversa */}
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: theme.layout.screenPadding,
            paddingBottom: theme.space[6],
            gap: theme.space[3],
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {messages.length === 0 ? (
            <Card variant="subtle" padding={5} style={{ marginTop: theme.space[4] }}>
              <View style={{ gap: theme.space[3] }}>
                <Ionicons name="sparkles" size={24} color={theme.colors.brand} />
                <Text variant="headline">Vamos conversar?</Text>
                <Text variant="footnote" tone="secondary">
                  Escolha um cenário acima ou escreva qualquer coisa. Eu corrijo seus erros na
                  hora, explico a regra e continuo a conversa — mesmo sem internet.
                </Text>
              </View>
            </Card>
          ) : null}

          {messages
            .filter((message) => message.content !== '__start__')
            .map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}

          {thinking ? (
            <View style={{ alignSelf: 'flex-start', padding: theme.space[3] }}>
              <Text variant="footnote" tone="tertiary">
                digitando…
              </Text>
            </View>
          ) : null}
        </ScrollView>

        {/* Entrada */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-end',
            gap: theme.space[2],
            paddingHorizontal: theme.layout.screenPadding,
            paddingTop: theme.space[3],
            paddingBottom: theme.space[4],
            borderTopWidth: 1,
            borderTopColor: theme.colors.divider,
            backgroundColor: theme.colors.surface,
          }}
        >
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Escreva sua mensagem…"
            placeholderTextColor={theme.colors.textTertiary}
            multiline
            autoCorrect={false}
            autoCapitalize="sentences"
            style={{
              flex: 1,
              maxHeight: 120,
              minHeight: 46,
              paddingHorizontal: theme.space[4],
              paddingVertical: theme.space[3],
              borderRadius: theme.radius.xl,
              backgroundColor: theme.colors.surfaceSunken,
              color: theme.colors.textPrimary,
              fontSize: 16,
            }}
          />

          <Touchable
            onPress={() => void send(input)}
            disabled={!input.trim() || thinking}
            haptic="medium"
            accessibilityLabel="Enviar mensagem"
            ensureTouchTarget={false}
            style={{
              width: 46,
              height: 46,
              borderRadius: 23,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: input.trim() ? theme.colors.brand : theme.colors.surfaceSunken,
            }}
          >
            <Ionicons
              name="arrow-up"
              size={21}
              color={input.trim() ? theme.colors.onBrand : theme.colors.textTertiary}
            />
          </Touchable>
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}

/* ------------------------------------------------------------------ *
 * Bolha de mensagem
 * ------------------------------------------------------------------ */

function MessageBubble({ message }: { message: TutorMessage }) {
  const theme = useTheme();
  const enrollment = useAppStore((state) => state.enrollment);
  const isUser = message.role === 'user';

  return (
    <Animated.View
      entering={FadeInDown.duration(theme.duration.fast)}
      style={{
        alignSelf: isUser ? 'flex-end' : 'flex-start',
        maxWidth: '86%',
        gap: theme.space[2],
      }}
    >
      <View
        style={{
          paddingHorizontal: theme.space[4],
          paddingVertical: theme.space[3],
          borderRadius: theme.radius.xl,
          borderBottomRightRadius: isUser ? 6 : theme.radius.xl,
          borderBottomLeftRadius: isUser ? theme.radius.xl : 6,
          backgroundColor: isUser ? theme.colors.brand : theme.colors.surfaceRaised,
        }}
      >
        <Text
          variant="callout"
          style={{ color: isUser ? theme.colors.onBrand : theme.colors.textPrimary }}
        >
          {message.content}
        </Text>
      </View>

      {/* Correções aparecem coladas na mensagem que as gerou. */}
      {message.corrections && message.corrections.length > 0 ? (
        <View style={{ gap: theme.space[2] }}>
          {message.corrections.map((correction, index) => (
            <CorrectionCard key={index} correction={correction} />
          ))}
        </View>
      ) : null}

      {!isUser && enrollment ? (
        <Touchable
          onPress={() =>
            void speechService.speak(stripHints(message.content), {
              language: enrollment.language,
              rate: 0.9,
            })
          }
          haptic="light"
          ensureTouchTarget={false}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 2 }}
        >
          <Ionicons name="volume-low" size={15} color={theme.colors.textTertiary} />
          <Text variant="caption" tone="tertiary">
            ouvir
          </Text>
        </Touchable>
      ) : null}
    </Animated.View>
  );
}

function CorrectionCard({ correction }: { correction: Correction }) {
  const theme = useTheme();

  return (
    <Card variant="outlined" padding={3}>
      <View style={{ gap: theme.space[2] }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="build-outline" size={14} color={theme.colors.warning} />
          <Text variant="caption" tone="warning">
            {kindLabel(correction.kind)}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Text variant="footnote" tone="danger" style={{ textDecorationLine: 'line-through' }}>
            {correction.original}
          </Text>
          <Ionicons name="arrow-forward" size={13} color={theme.colors.textTertiary} />
          <Text variant="footnote" tone="success" weight="600">
            {correction.corrected}
          </Text>
        </View>

        <Text variant="caption" tone="secondary">
          {correction.explanation}
        </Text>
      </View>
    </Card>
  );
}

function kindLabel(kind: Correction['kind']): string {
  const labels: Record<Correction['kind'], string> = {
    grammar: 'Gramática',
    vocabulary: 'Vocabulário',
    spelling: 'Ortografia',
    style: 'Estilo',
    punctuation: 'Pontuação',
  };
  return labels[kind];
}

/** Remove a linha de dica (💡) antes de mandar para a síntese de voz. */
function stripHints(text: string): string {
  return text
    .split('\n')
    .filter((line) => !line.trim().startsWith('💡') && !line.includes('→'))
    .join(' ')
    .trim();
}
