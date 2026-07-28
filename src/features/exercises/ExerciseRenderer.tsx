/**
 * Renderizador de exercícios.
 *
 * Recebe um `Exercise` e devolve a interface correspondente. É o ponto de
 * extensão do app: adicionar um tipo novo é escrever um componente e um `case`
 * — nada mais no sistema precisa saber que ele existe.
 *
 * Contrato de todo componente de exercício:
 *  - recebe o exercício e um `onAnswer(answer)`;
 *  - **não corrige nada** (a correção é do domínio, em `grading.ts`);
 *  - fica desabilitado quando `locked` (a tela está mostrando feedback).
 */

import { Ionicons } from '@expo/vector-icons';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { TextInput, View } from 'react-native';

import { Button, Card, Text, Touchable, useTheme } from '@/design';
import type { UserAnswer } from '@/domain/grading';
import type { Exercise, LanguageCode } from '@/domain/types';
import { speechService } from '@/services/speech';
import { SpeakExerciseView } from './SpeakExercise';

export type ExerciseViewProps = {
  exercise: Exercise;
  language: LanguageCode;
  /** Bloqueia a interação enquanto o feedback está na tela. */
  locked: boolean;
  onAnswer: (answer: UserAnswer) => void;
};

/* ------------------------------------------------------------------ *
 * Enunciado
 * ------------------------------------------------------------------ */

/** Cabeçalho comum: instrução + botão de áudio quando há texto para ouvir. */
const Prompt = memo(function Prompt({
  instruction,
  text,
  audioText,
  language,
  rate,
}: {
  instruction: string;
  text?: string;
  audioText?: string;
  language: LanguageCode;
  rate?: number;
}) {
  const theme = useTheme();

  const play = useCallback(() => {
    if (audioText) void speechService.speak(audioText, { language, rate });
  }, [audioText, language, rate]);

  // Toca automaticamente ao abrir um exercício de escuta: o usuário abriu
  // justamente para ouvir, e um toque a mais em cada item soma dezenas de
  // toques por sessão.
  useEffect(() => {
    if (audioText && !text) play();
    return () => {
      void speechService.stop();
    };
  }, [audioText, text, play]);

  return (
    <View style={{ gap: theme.space[3] }}>
      <Text variant="subhead" tone="secondary">
        {instruction}
      </Text>

      {audioText ? (
        <Touchable
          onPress={play}
          haptic="light"
          accessibilityLabel="Ouvir novamente"
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.space[3],
            padding: theme.space[4],
            borderRadius: theme.radius.xl,
            backgroundColor: theme.colors.infoSubtle,
            borderWidth: 1,
            borderColor: theme.colors.infoBorder,
          }}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: theme.colors.info,
            }}
          >
            <Ionicons name="volume-high" size={22} color={theme.colors.onBrand} />
          </View>
          <Text variant="callout" tone="info" flex>
            Toque para ouvir novamente
          </Text>
        </Touchable>
      ) : null}

      {text ? (
        <Text variant="target" selectable>
          {text}
        </Text>
      ) : null}
    </View>
  );
});

/* ------------------------------------------------------------------ *
 * Escolha múltipla
 * ------------------------------------------------------------------ */

const ChoiceList = memo(function ChoiceList({
  choices,
  selected,
  locked,
  onSelect,
}: {
  choices: string[];
  selected: number | null;
  locked: boolean;
  onSelect: (index: number) => void;
}) {
  const theme = useTheme();

  return (
    <View style={{ gap: theme.space[2] }}>
      {choices.map((choice, index) => {
        const isSelected = selected === index;
        return (
          <Touchable
            key={`${choice}-${index}`}
            onPress={() => onSelect(index)}
            disabled={locked}
            haptic="light"
            pressedScale={0.985}
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected, disabled: locked }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: theme.space[3],
              padding: theme.space[4],
              borderRadius: theme.radius.lg,
              borderWidth: 2,
              backgroundColor: isSelected ? theme.colors.brandSubtle : theme.colors.surface,
              borderColor: isSelected ? theme.colors.brand : theme.colors.border,
            }}
          >
            {/* A letra da alternativa dá um alvo de leitura rápido e permite
                responder por teclado na web. */}
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isSelected ? theme.colors.brand : theme.colors.surfaceSunken,
              }}
            >
              <Text
                variant="caption"
                style={{
                  color: isSelected ? theme.colors.onBrand : theme.colors.textSecondary,
                }}
              >
                {String.fromCharCode(65 + index)}
              </Text>
            </View>
            <Text variant="callout" flex>
              {choice}
            </Text>
          </Touchable>
        );
      })}
    </View>
  );
});

/* ------------------------------------------------------------------ *
 * Entrada de texto
 * ------------------------------------------------------------------ */

const AnswerInput = memo(function AnswerInput({
  value,
  onChange,
  onSubmit,
  locked,
  placeholder,
  multiline = false,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  locked: boolean;
  placeholder: string;
  multiline?: boolean;
}) {
  const theme = useTheme();

  return (
    <TextInput
      value={value}
      onChangeText={onChange}
      onSubmitEditing={onSubmit}
      editable={!locked}
      placeholder={placeholder}
      placeholderTextColor={theme.colors.textTertiary}
      multiline={multiline}
      // Autocorreção e capitalização automática sabotam exercício de idioma:
      // o teclado "conserta" a resposta e o usuário não aprende a grafia.
      autoCorrect={false}
      autoCapitalize="none"
      autoComplete="off"
      spellCheck={false}
      returnKeyType="done"
      blurOnSubmit
      style={{
        minHeight: multiline ? 120 : 56,
        padding: theme.space[4],
        borderRadius: theme.radius.lg,
        borderWidth: 2,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surfaceSunken,
        color: theme.colors.textPrimary,
        fontSize: 17,
        textAlignVertical: multiline ? 'top' : 'center',
      }}
    />
  );
});

/* ------------------------------------------------------------------ *
 * Banco de palavras
 * ------------------------------------------------------------------ */

const WordBankView = memo(function WordBankView({
  tokens,
  locked,
  onChange,
}: {
  tokens: string[];
  locked: boolean;
  onChange: (selected: string[]) => void;
}) {
  const theme = useTheme();
  // Guarda índices, não strings: uma frase pode repetir a mesma palavra
  // ("de" em "um copo de água de coco") e strings iguais colidiriam.
  const [selected, setSelected] = useState<number[]>([]);

  const update = useCallback(
    (next: number[]) => {
      setSelected(next);
      onChange(next.map((index) => tokens[index]!));
    },
    [tokens, onChange],
  );

  const available = tokens
    .map((_, index) => index)
    .filter((index) => !selected.includes(index));

  return (
    <View style={{ gap: theme.space[4] }}>
      {/* Linha de construção da resposta */}
      <View
        style={{
          minHeight: 84,
          padding: theme.space[3],
          borderRadius: theme.radius.lg,
          backgroundColor: theme.colors.surfaceSunken,
          borderWidth: 1,
          borderColor: theme.colors.border,
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: theme.space[2],
          alignContent: 'flex-start',
        }}
      >
        {selected.length === 0 ? (
          <Text variant="footnote" tone="tertiary">
            Toque nas palavras abaixo para montar a frase
          </Text>
        ) : null}

        {selected.map((tokenIndex, position) => (
          <Touchable
            key={`selected-${tokenIndex}`}
            onPress={() => update(selected.filter((_, i) => i !== position))}
            disabled={locked}
            haptic="light"
            ensureTouchTarget={false}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 9,
              borderRadius: theme.radius.md,
              backgroundColor: theme.colors.brand,
            }}
          >
            <Text variant="callout" tone="onBrand">
              {tokens[tokenIndex]}
            </Text>
          </Touchable>
        ))}
      </View>

      {/* Banco disponível */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space[2] }}>
        {available.map((tokenIndex) => (
          <Touchable
            key={`available-${tokenIndex}`}
            onPress={() => update([...selected, tokenIndex])}
            disabled={locked}
            haptic="light"
            ensureTouchTarget={false}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 9,
              borderRadius: theme.radius.md,
              backgroundColor: theme.colors.surface,
              borderWidth: 1.5,
              borderColor: theme.colors.border,
            }}
          >
            <Text variant="callout">{tokens[tokenIndex]}</Text>
          </Touchable>
        ))}
      </View>
    </View>
  );
});

/* ------------------------------------------------------------------ *
 * Ligar pares
 * ------------------------------------------------------------------ */

const MatchPairsView = memo(function MatchPairsView({
  pairs,
  locked,
  onChange,
}: {
  pairs: { left: string; right: string }[];
  locked: boolean;
  onChange: (matches: { left: string; right: string }[]) => void;
}) {
  const theme = useTheme();
  const [activeLeft, setActiveLeft] = useState<string | null>(null);
  const [matches, setMatches] = useState<{ left: string; right: string }[]>([]);

  // Embaralha a coluna direita de forma determinística, senão os pares ficam
  // alinhados e o exercício se resolve sozinho.
  const shuffledRight = useMemo(
    () => [...pairs].sort((a, b) => a.right.localeCompare(b.right)),
    [pairs],
  );

  const matchedLeft = new Set(matches.map((match) => match.left));
  const matchedRight = new Set(matches.map((match) => match.right));

  const selectRight = (right: string) => {
    if (!activeLeft) return;
    const next = [...matches, { left: activeLeft, right }];
    setMatches(next);
    setActiveLeft(null);
    onChange(next);
  };

  const cell = (label: string, active: boolean, matched: boolean, onPress: () => void) => (
    <Touchable
      key={label}
      onPress={onPress}
      disabled={locked || matched}
      haptic="light"
      pressedScale={0.97}
      style={{
        flex: 1,
        padding: theme.space[3],
        borderRadius: theme.radius.md,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: matched ? 0.4 : 1,
        backgroundColor: active ? theme.colors.brandSubtle : theme.colors.surface,
        borderColor: active ? theme.colors.brand : theme.colors.border,
      }}
    >
      <Text variant="subhead" align="center">
        {label}
      </Text>
    </Touchable>
  );

  return (
    <View style={{ flexDirection: 'row', gap: theme.space[3] }}>
      <View style={{ flex: 1, gap: theme.space[2] }}>
        {pairs.map((pair) =>
          cell(pair.left, activeLeft === pair.left, matchedLeft.has(pair.left), () =>
            setActiveLeft(pair.left),
          ),
        )}
      </View>
      <View style={{ flex: 1, gap: theme.space[2] }}>
        {shuffledRight.map((pair) =>
          cell(pair.right, false, matchedRight.has(pair.right), () => selectRight(pair.right)),
        )}
      </View>
    </View>
  );
});

/* ------------------------------------------------------------------ *
 * Ordenar diálogo
 * ------------------------------------------------------------------ */

const OrderDialogueView = memo(function OrderDialogueView({
  lines,
  locked,
  onChange,
}: {
  lines: { speaker: string; text: string }[];
  locked: boolean;
  onChange: (order: number[]) => void;
}) {
  const theme = useTheme();
  const [order, setOrder] = useState<number[]>([]);

  const shuffled = useMemo(
    () =>
      lines.map((_, index) => index).sort((a, b) => (lines[a]!.text > lines[b]!.text ? 1 : -1)),
    [lines],
  );

  const toggle = (index: number) => {
    const next = order.includes(index)
      ? order.filter((value) => value !== index)
      : [...order, index];
    setOrder(next);
    onChange(next);
  };

  return (
    <View style={{ gap: theme.space[2] }}>
      {shuffled.map((index) => {
        const position = order.indexOf(index);
        const line = lines[index]!;

        return (
          <Touchable
            key={index}
            onPress={() => toggle(index)}
            disabled={locked}
            haptic="light"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: theme.space[3],
              padding: theme.space[3],
              borderRadius: theme.radius.lg,
              borderWidth: 2,
              backgroundColor: position >= 0 ? theme.colors.brandSubtle : theme.colors.surface,
              borderColor: position >= 0 ? theme.colors.brand : theme.colors.border,
            }}
          >
            <View
              style={{
                width: 26,
                height: 26,
                borderRadius: 13,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor:
                  position >= 0 ? theme.colors.brand : theme.colors.surfaceSunken,
              }}
            >
              <Text
                variant="caption"
                style={{
                  color: position >= 0 ? theme.colors.onBrand : theme.colors.textTertiary,
                }}
              >
                {position >= 0 ? position + 1 : '·'}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="caption" tone="tertiary">
                {line.speaker}
              </Text>
              <Text variant="callout">{line.text}</Text>
            </View>
          </Touchable>
        );
      })}
    </View>
  );
});

/* ------------------------------------------------------------------ *
 * Renderizador
 * ------------------------------------------------------------------ */

/**
 * O `switch` é exaustivo sobre `Exercise['type']`. Adicionar um tipo novo em
 * `domain/types.ts` sem tratá-lo aqui quebra a compilação — de propósito.
 */
export function ExerciseRenderer({ exercise, language, locked, onAnswer }: ExerciseViewProps) {
  const theme = useTheme();
  const [draft, setDraft] = useState<UserAnswer | null>(null);
  const [text, setText] = useState('');

  const submit = useCallback(() => {
    if (draft) onAnswer(draft);
  }, [draft, onAnswer]);

  const submitText = useCallback(() => {
    if (text.trim()) onAnswer({ kind: 'text', value: text });
  }, [text, onAnswer]);

  const gap = theme.space[5];

  switch (exercise.type) {
    case 'multiple_choice':
      return (
        <View style={{ gap }}>
          <Prompt
            instruction="Escolha a alternativa correta"
            text={exercise.prompt}
            audioText={exercise.audioText}
            language={language}
          />
          <ChoiceList
            choices={exercise.choices}
            selected={draft?.kind === 'choice' ? draft.index : null}
            locked={locked}
            onSelect={(index) => {
              setDraft({ kind: 'choice', index });
              // Escolha múltipla envia direto: um botão "confirmar" a mais em
              // cada item soma centenas de toques por semana.
              onAnswer({ kind: 'choice', index });
            }}
          />
        </View>
      );

    case 'listen_respond':
      return (
        <View style={{ gap }}>
          <Prompt
            instruction="Escute e escolha a melhor resposta"
            audioText={exercise.audioText}
            language={language}
          />
          <ChoiceList
            choices={exercise.choices}
            selected={draft?.kind === 'choice' ? draft.index : null}
            locked={locked}
            onSelect={(index) => onAnswer({ kind: 'choice', index })}
          />
        </View>
      );

    case 'translate':
      return (
        <View style={{ gap }}>
          <Prompt
            instruction={
              exercise.direction === 'to_target'
                ? 'Traduza para o idioma que você está aprendendo'
                : 'Traduza para o português'
            }
            text={exercise.prompt}
            audioText={exercise.direction === 'to_native' ? exercise.prompt : undefined}
            language={language}
          />
          <AnswerInput
            value={text}
            onChange={setText}
            onSubmit={submitText}
            locked={locked}
            placeholder="Digite sua resposta"
          />
          <Button
            label="Verificar"
            onPress={submitText}
            disabled={locked || text.trim().length === 0}
            fullWidth
            size="lg"
          />
        </View>
      );

    case 'listen_type':
    case 'dictation':
      return (
        <View style={{ gap }}>
          <Prompt
            instruction="Ouça e escreva o que você entendeu"
            audioText={exercise.audioText}
            language={language}
            rate={exercise.type === 'listen_type' ? exercise.rate : 0.8}
          />
          <AnswerInput
            value={text}
            onChange={setText}
            onSubmit={submitText}
            locked={locked}
            placeholder="Escreva aqui"
            multiline={exercise.type === 'dictation'}
          />
          <Button
            label="Verificar"
            onPress={submitText}
            disabled={locked || text.trim().length === 0}
            fullWidth
            size="lg"
          />
        </View>
      );

    case 'correct_sentence':
      return (
        <View style={{ gap }}>
          <Prompt instruction="Esta frase tem um erro. Corrija-a." language={language} />
          <Card variant="outlined">
            <Text variant="target" style={{ textDecorationLine: 'line-through' }}>
              {exercise.incorrect}
            </Text>
          </Card>
          <AnswerInput
            value={text}
            onChange={setText}
            onSubmit={submitText}
            locked={locked}
            placeholder="Escreva a frase correta"
          />
          <Button
            label="Verificar"
            onPress={submitText}
            disabled={locked || text.trim().length === 0}
            fullWidth
            size="lg"
          />
        </View>
      );

    case 'fill_blank':
      return (
        <View style={{ gap }}>
          <Prompt instruction="Complete a frase" text={exercise.template} language={language} />
          {exercise.choices ? (
            <ChoiceList
              choices={exercise.choices}
              selected={draft?.kind === 'choice' ? draft.index : null}
              locked={locked}
              onSelect={(index) => onAnswer({ kind: 'choice', index })}
            />
          ) : (
            <>
              <AnswerInput
                value={text}
                onChange={setText}
                onSubmit={submitText}
                locked={locked}
                placeholder="Palavra que falta"
              />
              <Button
                label="Verificar"
                onPress={submitText}
                disabled={locked || text.trim().length === 0}
                fullWidth
                size="lg"
              />
            </>
          )}
        </View>
      );

    case 'word_bank':
      return (
        <View style={{ gap }}>
          <Prompt instruction="Monte a frase" text={exercise.prompt} language={language} />
          <WordBankView
            tokens={exercise.tokens}
            locked={locked}
            onChange={(values) => setDraft({ kind: 'tokens', values })}
          />
          <Button
            label="Verificar"
            onPress={submit}
            disabled={locked || draft?.kind !== 'tokens' || draft.values.length === 0}
            fullWidth
            size="lg"
          />
        </View>
      );

    case 'match_pairs':
      return (
        <View style={{ gap }}>
          <Prompt instruction="Ligue os pares" language={language} />
          <MatchPairsView
            pairs={exercise.pairs}
            locked={locked}
            onChange={(matches) => setDraft({ kind: 'pairs', matches })}
          />
          <Button
            label="Verificar"
            onPress={submit}
            disabled={
              locked || draft?.kind !== 'pairs' || draft.matches.length < exercise.pairs.length
            }
            fullWidth
            size="lg"
          />
        </View>
      );

    case 'order_dialogue':
      return (
        <View style={{ gap }}>
          <Prompt instruction="Coloque o diálogo em ordem" language={language} />
          <OrderDialogueView
            lines={exercise.lines}
            locked={locked}
            onChange={(values) => setDraft({ kind: 'order', values })}
          />
          <Button
            label="Verificar"
            onPress={submit}
            disabled={
              locked || draft?.kind !== 'order' || draft.values.length < exercise.lines.length
            }
            fullWidth
            size="lg"
          />
        </View>
      );

    case 'speak':
    case 'shadowing':
      return (
        <SpeakExerciseView
          exercise={exercise}
          language={language}
          locked={locked}
          onAnswer={onAnswer}
        />
      );

    case 'reading_comprehension':
      return (
        <ReadingComprehensionView
          exercise={exercise}
          language={language}
          locked={locked}
          onAnswer={onAnswer}
        />
      );

    case 'describe_image':
      return (
        <View style={{ gap }}>
          <Prompt
            instruction={`Escreva pelo menos ${exercise.minWords} palavras descrevendo a cena`}
            language={language}
          />
          <Card variant="subtle">
            <Text variant="footnote" tone="secondary">
              Tente usar: {exercise.expectedKeywords.join(', ')}
            </Text>
          </Card>
          <AnswerInput
            value={text}
            onChange={setText}
            onSubmit={submitText}
            locked={locked}
            placeholder="Descreva o que você vê..."
            multiline
          />
          <Text variant="caption" tone="tertiary">
            {text.trim().split(/\s+/).filter(Boolean).length} / {exercise.minWords} palavras
          </Text>
          <Button
            label="Enviar"
            onPress={submitText}
            disabled={locked || text.trim().length === 0}
            fullWidth
            size="lg"
          />
        </View>
      );

    case 'conversation':
      return (
        <View style={{ gap }}>
          <Prompt instruction="Conversa livre com o tutor" language={language} />
          <Card variant="subtle" padding={5}>
            <View style={{ gap: theme.space[3] }}>
              <Text variant="headline">{exercise.tutorRole}</Text>
              <Text variant="footnote" tone="secondary">
                Seus objetivos nesta conversa:
              </Text>
              {exercise.objectives.map((objective) => (
                <View
                  key={objective}
                  style={{ flexDirection: 'row', gap: theme.space[2], alignItems: 'center' }}
                >
                  <Ionicons name="ellipse" size={7} color={theme.colors.brand} />
                  <Text variant="callout">{objective}</Text>
                </View>
              ))}
            </View>
          </Card>
          <Button
            label="Abrir conversa com o tutor"
            icon="chatbubble-ellipses"
            onPress={() => onAnswer({ kind: 'text', value: String(exercise.minTurns) })}
            fullWidth
            size="lg"
          />
        </View>
      );

    case 'flashcard':
      return (
        <View style={{ gap }}>
          <Card variant="raised" padding={8}>
            <View style={{ alignItems: 'center', gap: theme.space[3] }}>
              <Text variant="target" align="center">
                {exercise.front}
              </Text>
              <Text variant="body" tone="secondary" align="center">
                {exercise.back}
              </Text>
              {exercise.example ? (
                <Text variant="footnote" tone="tertiary" align="center">
                  {exercise.example}
                </Text>
              ) : null}
            </View>
          </Card>
          <Button
            label="Continuar"
            onPress={() => onAnswer({ kind: 'skip' })}
            fullWidth
            size="lg"
          />
        </View>
      );
  }
}

/* ------------------------------------------------------------------ *
 * Interpretação de texto
 * ------------------------------------------------------------------ */

function ReadingComprehensionView({
  exercise,
  locked,
  onAnswer,
}: ExerciseViewProps & { exercise: Extract<Exercise, { type: 'reading_comprehension' }> }) {
  const theme = useTheme();
  const [answers, setAnswers] = useState<number[]>([]);

  const allAnswered = exercise.questions.every((_, index) => answers[index] !== undefined);

  return (
    <View style={{ gap: theme.space[5] }}>
      <Card variant="outlined" padding={5}>
        <Text variant="body" selectable style={{ lineHeight: 28 }}>
          {exercise.passage}
        </Text>
      </Card>

      {exercise.questions.map((question, questionIndex) => (
        <View key={question.prompt} style={{ gap: theme.space[3] }}>
          <Text variant="headline">{question.prompt}</Text>
          <ChoiceList
            choices={question.choices}
            selected={answers[questionIndex] ?? null}
            locked={locked}
            onSelect={(choiceIndex) => {
              const next = [...answers];
              next[questionIndex] = choiceIndex;
              setAnswers(next);
            }}
          />
        </View>
      ))}

      <Button
        label="Verificar respostas"
        onPress={() => onAnswer({ kind: 'choices', indices: answers })}
        disabled={locked || !allAnswered}
        fullWidth
        size="lg"
      />
    </View>
  );
}
