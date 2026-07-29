/**
 * Exercícios de fala e shadowing.
 *
 * Separado do renderizador principal porque tem estado próprio (gravação,
 * permissão, transcrição parcial) e um caminho de degradação específico:
 * quando não há reconhecedor disponível, vira **autoavaliação guiada** —
 * o usuário ouve, repete e julga a si mesmo.
 *
 * Essa degradação é importante: um botão de microfone que não funciona é pior
 * que não ter o exercício. Autoavaliação é menos precisa, mas mantém o hábito
 * de abrir a boca — que é o objetivo real do módulo.
 */

import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Button, Card, Text, Touchable, useTheme } from '@/design';
import type { UserAnswer } from '@/domain/grading';
import { scorePronunciation } from '@/domain/grading';
import type { Exercise, LanguageCode } from '@/domain/types';
import {
  type SpeechRecognizer,
  createSpeechRecognizer,
  speechService,
} from '@/services/speech';

type Props = {
  exercise: Extract<Exercise, { type: 'speak' | 'shadowing' }>;
  language: LanguageCode;
  locked: boolean;
  onAnswer: (answer: UserAnswer) => void;
};

type RecordingState = 'idle' | 'recording' | 'processing';

export function SpeakExerciseView({ exercise, language, locked, onAnswer }: Props) {
  const theme = useTheme();
  const recognizer = useRef<SpeechRecognizer>(createSpeechRecognizer());
  const [supported, setSupported] = useState<boolean | null>(null);
  const [state, setState] = useState<RecordingState>('idle');
  const [transcript, setTranscript] = useState('');

  const targetText = exercise.type === 'speak' ? exercise.targetText : exercise.audioText;

  useEffect(() => {
    // Copia a referência para uma variável local: no momento em que a limpeza
    // roda, `recognizer.current` pode já ter sido substituído, e cancelaríamos
    // o reconhecedor errado (deixando o microfone aberto).
    const instance = recognizer.current;
    void instance.isAvailable().then(setSupported);

    return () => {
      void instance.cancel();
      void speechService.stop();
    };
  }, []);

  // Pulso do botão durante a gravação, na thread de UI para não engasgar
  // enquanto o reconhecedor processa o áudio.
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value =
      state === 'recording'
        ? withRepeat(withTiming(1.12, { duration: 620 }), -1, true)
        : withTiming(1, { duration: 160 });
  }, [state, pulse]);

  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  const playModel = useCallback(() => {
    void speechService.speak(targetText, { language, rate: 0.85 });
  }, [targetText, language]);

  const startRecording = useCallback(async () => {
    try {
      await speechService.stop();
      await recognizer.current.start(language);
      setTranscript('');
      setState('recording');
    } catch {
      setSupported(false);
    }
  }, [language]);

  const stopRecording = useCallback(async () => {
    setState('processing');
    const result = await recognizer.current.stop();
    setTranscript(result.transcript);
    setState('idle');
    onAnswer({ kind: 'speech', transcript: result.transcript });
  }, [onAnswer]);

  /** Prévia da nota, mostrada antes de enviar para dar feedback imediato. */
  const preview = useMemo(
    () => (transcript ? scorePronunciation(transcript, targetText) : null),
    [transcript, targetText],
  );

  return (
    <View style={{ gap: theme.space[5] }}>
      <Text variant="subhead" tone="secondary">
        {exercise.type === 'speak'
          ? 'Toque no microfone e diga a frase'
          : 'Ouça e fale junto, acompanhando o ritmo'}
      </Text>

      <Card variant="outlined" padding={5}>
        <View style={{ gap: theme.space[3] }}>
          <Text variant="target" align="center">
            {targetText}
          </Text>

          {exercise.type === 'speak' && exercise.phonetic ? (
            <Text
              variant="footnote"
              tone="tertiary"
              align="center"
              style={{ fontFamily: theme.fontFamily.mono }}
            >
              /{exercise.phonetic}/
            </Text>
          ) : null}

          <Touchable
            onPress={playModel}
            haptic="light"
            accessibilityLabel="Ouvir a pronúncia modelo"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: theme.space[2],
              paddingVertical: theme.space[2],
            }}
          >
            <Ionicons name="volume-medium" size={19} color={theme.colors.brand} />
            <Text variant="subhead" tone="brand">
              Ouvir modelo
            </Text>
          </Touchable>
        </View>
      </Card>

      {/* Shadowing mostra os segmentos: falar junto exige saber onde respirar. */}
      {exercise.type === 'shadowing' ? (
        <View style={{ gap: theme.space[2] }}>
          {exercise.segments.map((segment, index) => (
            <View
              key={index}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: theme.space[3],
                padding: theme.space[3],
                borderRadius: theme.radius.md,
                backgroundColor: theme.colors.surfaceSunken,
              }}
            >
              <Text variant="caption" tone="tertiary">
                {(segment.startMs / 1000).toFixed(1)}s
              </Text>
              <Text variant="callout" flex>
                {segment.text}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {preview ? (
        <Card variant={preview.score >= 0.7 ? 'subtle' : 'outlined'} padding={4}>
          <View style={{ gap: theme.space[3] }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space[2] }}>
              <Text variant="headline">Pronúncia</Text>
              <Text
                variant="headline"
                tone={
                  preview.score >= 0.8 ? 'success' : preview.score >= 0.6 ? 'warning' : 'danger'
                }
              >
                {Math.round(preview.score * 100)}%
              </Text>
            </View>

            {/* Palavra a palavra: dizer "70%" não ensina; mostrar *qual* palavra
                saiu errada, sim. */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {preview.wordScores.map((word, index) => (
                <View
                  key={`${word.word}-${index}`}
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: theme.radius.sm,
                    backgroundColor: word.correct
                      ? theme.colors.successSubtle
                      : theme.colors.dangerSubtle,
                  }}
                >
                  <Text variant="footnote" tone={word.correct ? 'success' : 'danger'}>
                    {word.word}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </Card>
      ) : null}

      {supported === false ? (
        /* Modo autoavaliação */
        <View style={{ gap: theme.space[3] }}>
          <Card variant="outlined" padding={4}>
            <Text variant="footnote" tone="secondary">
              O reconhecimento de voz não está disponível neste dispositivo. Ouça o modelo,
              repita em voz alta e avalie você mesmo — o hábito de falar vale mais que a nota.
            </Text>
          </Card>
          <View style={{ flexDirection: 'row', gap: theme.space[2] }}>
            <Button
              label="Errei"
              variant="secondary"
              onPress={() => onAnswer({ kind: 'speech', transcript: '' })}
              disabled={locked}
              style={{ flex: 1 }}
            />
            <Button
              label="Falei certo"
              variant="success"
              onPress={() => onAnswer({ kind: 'speech', transcript: targetText })}
              disabled={locked}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      ) : (
        <View style={{ alignItems: 'center', gap: theme.space[3] }}>
          <Animated.View style={pulseStyle}>
            <Touchable
              onPress={state === 'recording' ? stopRecording : startRecording}
              disabled={locked || state === 'processing'}
              haptic={state === 'recording' ? 'success' : 'medium'}
              pressedScale={0.94}
              accessibilityLabel={state === 'recording' ? 'Parar gravação' : 'Gravar sua fala'}
              style={{
                width: 88,
                height: 88,
                borderRadius: 44,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor:
                  state === 'recording' ? theme.colors.danger : theme.colors.brand,
                ...theme.elevation.lg,
                shadowColor: state === 'recording' ? theme.colors.danger : theme.colors.brand,
              }}
            >
              <Ionicons
                name={state === 'recording' ? 'stop' : 'mic'}
                size={34}
                color={theme.colors.onBrand}
              />
            </Touchable>
          </Animated.View>

          <Text variant="footnote" tone="tertiary">
            {state === 'recording'
              ? 'Gravando… toque para parar'
              : state === 'processing'
                ? 'Analisando…'
                : 'Toque para falar'}
          </Text>
        </View>
      )}
    </View>
  );
}
