/**
 * Página de assinatura.
 *
 * ## Como esta página foi construída
 *
 * Persuasão aqui não é pressão — é **remoção de dúvida**. A ordem é
 * deliberada e segue o que de fato trava a decisão:
 *
 *  1. Ancoragem no valor já entregue ("você já aprendeu X palavras"). O
 *     usuário decide sobre um produto que já provou funcionar, não sobre uma
 *     promessa.
 *  2. Comparação lado a lado, com o gratuito descrito de forma honesta. Pintar
 *     o plano grátis como inútil destrói confiança — e o gratuito é o que
 *     alimenta o funil.
 *  3. Preço com âncora anual e economia explícita em reais.
 *  4. Objeções respondidas antes de serem feitas (cancelamento, cobrança).
 *
 * O que **não** tem: contador regressivo falso, "restam 2 vagas", preço
 * riscado que nunca existiu. Além de ilegal no Brasil (CDC art. 37), esse tipo
 * de tática eleva a conversão do dia e destrói a retenção do mês.
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { LANGUAGE_META } from '@/content/vocabulary';
import { Badge, Button, Card, Screen, Text, Touchable, useTheme } from '@/design';
import { OPEN_ACCESS } from '@/domain/access';
import { SUPPORTED_LANGUAGES } from '@/domain/types';
import { selectWordsLearned, useAppStore } from '@/state/app-store';

type Cycle = 'monthly' | 'annual';

const FEATURES: { feature: string; free: string | false; premium: string | true }[] = [
  { feature: 'Trilha completa de A1', free: 'Incluída', premium: true },
  { feature: 'Revisão espaçada', free: 'Ilimitada', premium: true },
  { feature: 'Vidas por sessão', free: '5', premium: 'Infinitas' },
  { feature: 'Idiomas simultâneos', free: '1', premium: 'Todos os 5' },
  { feature: 'Níveis A1 → C2', free: 'Só A1', premium: 'Todos' },
  { feature: 'Tutor de IA', free: 'Modo offline', premium: 'Completo, voz e texto' },
  { feature: 'Correção de redações', free: false, premium: 'Detalhada, por IA' },
  { feature: 'Download offline', free: 'Curso básico', premium: 'Tudo, sem limite' },
  { feature: 'Congelamentos de ofensiva', free: '2', premium: '5 por mês' },
  { feature: 'Anúncios', free: 'Ocasionais', premium: 'Nenhum' },
];

const PRICES: Record<Cycle, { price: string; per: string; note: string; savings?: string }> = {
  monthly: { price: 'R$ 29,90', per: '/mês', note: 'Cobrado mensalmente' },
  annual: {
    price: 'R$ 16,58',
    per: '/mês',
    note: 'R$ 199,00 cobrados uma vez por ano',
    savings: 'Economize R$ 159,80 por ano',
  },
};

/**
 * Nomes dos idiomas em frase — "Inglês, espanhol e alemão".
 *
 * Sai do catálogo em vez de ser digitado aqui porque esta é a tela que promete
 * o que o produto entrega: uma lista escrita à mão sobrevive à remoção de um
 * idioma e vira propaganda enganosa sem que nenhum teste reclame.
 */
function languagePhrase(): string {
  const names = SUPPORTED_LANGUAGES.map((code, index) =>
    index === 0 ? LANGUAGE_META[code].name : LANGUAGE_META[code].name.toLowerCase(),
  );
  const last = names[names.length - 1];
  return `${names.slice(0, -1).join(', ')} e ${last}`;
}

/** Tudo que está liberado hoje. Serve de índice do produto, não de vitrine. */
const INCLUDED: { icon: keyof typeof Ionicons.glyphMap; title: string; text: string }[] = [
  {
    icon: 'globe',
    title: `Os ${SUPPORTED_LANGUAGES.length} idiomas`,
    text: `${languagePhrase()} — todos ao mesmo tempo, se quiser.`,
  },
  {
    icon: 'trending-up',
    title: 'Todos os níveis, A1 a C2',
    text: 'Trilha inteira liberada. Você escolhe onde entrar e pode mudar de nível quando quiser.',
  },
  {
    icon: 'heart',
    title: 'Vidas infinitas',
    text: 'Errar não interrompe a sessão nem cobra espera.',
  },
  {
    icon: 'chatbubble-ellipses',
    title: 'Tutor sem limite',
    text: 'Conversa por voz e texto, correção de redação e explicação de gramática, sem cota diária.',
  },
  {
    icon: 'library',
    title: 'Apostilas e expressões',
    text: 'Uma apostila por nível em cada idioma, com download, mais o módulo de expressões idiomáticas.',
  },
  {
    icon: 'cloud-offline',
    title: 'Download à vontade',
    text: 'Baixe o que quiser para estudar sem internet. Nenhum conteúdo fica atrás de cadeado.',
  },
];

export default function Paywall() {
  // Com o acesso aberto não existe o que vender: esta tela vira um resumo
  // honesto do que já está incluído. A página de assinatura continua escrita
  // logo abaixo, intacta, para o dia em que a cobrança voltar.
  if (OPEN_ACCESS) return <OpenAccessScreen />;
  return <SubscriptionScreen />;
}

function OpenAccessScreen() {
  const theme = useTheme();
  const router = useRouter();

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
        <Touchable
          onPress={() => router.back()}
          haptic="light"
          accessibilityLabel="Fechar"
          ensureTouchTarget={false}
          style={{ alignSelf: 'flex-start', width: 34, height: 34, justifyContent: 'center' }}
        >
          <Ionicons name="close" size={26} color={theme.colors.textTertiary} />
        </Touchable>

        <View style={{ gap: theme.space[4], paddingTop: theme.space[4] }}>
          <Badge label="Acesso completo" tone="premium" icon="star" />
          <Text variant="title1">Está tudo liberado.</Text>
          <Text variant="body" tone="secondary">
            Não há plano pago, cadastro obrigatório nem recurso bloqueado. Tudo o que existe no
            Lumo está disponível para você agora — sem cartão, sem teste que expira.
          </Text>
        </View>

        <View style={{ marginTop: theme.space[8], gap: theme.space[3] }}>
          {INCLUDED.map((item) => (
            <Card key={item.title} variant="flat" padding={4}>
              <View style={{ flexDirection: 'row', gap: theme.space[3] }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: theme.radius.sm,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: theme.colors.brandSubtle,
                  }}
                >
                  <Ionicons name={item.icon} size={20} color={theme.colors.brand} />
                </View>
                <View style={{ flex: 1, gap: 3 }}>
                  <Text variant="headline">{item.title}</Text>
                  <Text variant="caption" tone="secondary">
                    {item.text}
                  </Text>
                </View>
                <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
              </View>
            </Card>
          ))}
        </View>

        <Card variant="outlined" padding={4} style={{ marginTop: theme.space[6] }}>
          <View style={{ flexDirection: 'row', gap: theme.space[3] }}>
            <Ionicons name="lock-open" size={20} color={theme.colors.info} />
            <Text variant="caption" tone="secondary" flex>
              Seus dados continuam neste aparelho e funcionam sem internet. Se um dia houver
              cobrança, ela será anunciada antes — nada que você já estudou será bloqueado.
            </Text>
          </View>
        </Card>

        <Button
          label="Voltar a estudar"
          size="lg"
          fullWidth
          onPress={() => router.back()}
          style={{ marginTop: theme.space[8] }}
        />
      </ScrollView>
    </Screen>
  );
}

function SubscriptionScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [cycle, setCycle] = useState<Cycle>('annual');

  const wordsLearned = useAppStore(selectWordsLearned);
  const streak = useAppStore((state) => state.streak);
  const wallet = useAppStore((state) => state.wallet);

  const pricing = PRICES[cycle];
  const hasHistory = (wallet?.totalXp ?? 0) > 0;

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
        <Touchable
          onPress={() => router.back()}
          haptic="light"
          accessibilityLabel="Fechar"
          ensureTouchTarget={false}
          style={{ alignSelf: 'flex-start', width: 34, height: 34, justifyContent: 'center' }}
        >
          <Ionicons name="close" size={26} color={theme.colors.textTertiary} />
        </Touchable>

        {/* ---------------- Ancoragem no valor ---------------- */}
        <View style={{ gap: theme.space[4], paddingTop: theme.space[4] }}>
          <Badge label="Lumo Premium" tone="premium" icon="star" />

          {hasHistory ? (
            <>
              <Text variant="title1">
                Você já conquistou {wallet?.totalXp} XP
                {streak && streak.currentStreak > 0
                  ? ` e ${streak.currentStreak} ${streak.currentStreak === 1 ? 'dia' : 'dias'} de ofensiva`
                  : ''}
                .
              </Text>
              <Text variant="body" tone="secondary">
                {wordsLearned > 0
                  ? `São ${wordsLearned} palavras novas no seu vocabulário. O Premium tira os limites do que vem a seguir.`
                  : 'O Premium tira os limites do que vem a seguir.'}
              </Text>
            </>
          ) : (
            <>
              <Text variant="title1">Aprenda sem limites.</Text>
              <Text variant="body" tone="secondary">
                Todos os idiomas, todos os níveis, tutor de IA completo e download ilimitado
                para estudar em qualquer lugar — com ou sem internet.
              </Text>
            </>
          )}
        </View>

        {/* ---------------- Ciclo ---------------- */}
        <View style={{ flexDirection: 'row', gap: theme.space[3], marginTop: theme.space[8] }}>
          <CycleOption
            selected={cycle === 'annual'}
            onPress={() => setCycle('annual')}
            title="Anual"
            price="R$ 16,58/mês"
            badge="45% off"
          />
          <CycleOption
            selected={cycle === 'monthly'}
            onPress={() => setCycle('monthly')}
            title="Mensal"
            price="R$ 29,90/mês"
          />
        </View>

        {/* ---------------- Preço ---------------- */}
        <Card variant="subtle" padding={5} style={{ marginTop: theme.space[4] }}>
          <View style={{ gap: theme.space[2], alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
              <Text variant="display" style={{ fontSize: 42, lineHeight: 48 }}>
                {pricing.price}
              </Text>
              <Text variant="headline" tone="secondary">
                {pricing.per}
              </Text>
            </View>
            <Text variant="footnote" tone="secondary">
              {pricing.note}
            </Text>
            {pricing.savings ? (
              <Badge label={pricing.savings} tone="success" icon="trending-down" />
            ) : null}
          </View>
        </Card>

        <View style={{ gap: theme.space[2], marginTop: theme.space[5] }}>
          <Button
            label="Assinar Premium"
            size="lg"
            fullWidth
            icon="star"
            onPress={() => router.back()}
          />
          <Text variant="caption" tone="tertiary" align="center">
            7 dias grátis. Cancele quando quiser, direto no app — sem ligar para ninguém.
          </Text>
        </View>

        {/* ---------------- Comparação ---------------- */}
        <View style={{ marginTop: theme.space[10], gap: theme.space[3] }}>
          <Text variant="overline" tone="tertiary">
            Comparação honesta
          </Text>

          <Card variant="outlined" padding={0}>
            <View
              style={{
                flexDirection: 'row',
                paddingVertical: theme.space[3],
                paddingHorizontal: theme.space[4],
                borderBottomWidth: 1,
                borderBottomColor: theme.colors.divider,
              }}
            >
              <Text variant="caption" tone="tertiary" style={{ flex: 2 }}>
                RECURSO
              </Text>
              <Text variant="caption" tone="tertiary" style={{ flex: 1, textAlign: 'center' }}>
                GRÁTIS
              </Text>
              <Text variant="caption" tone="premium" style={{ flex: 1.4, textAlign: 'center' }}>
                PREMIUM
              </Text>
            </View>

            {FEATURES.map((row, index) => (
              <View
                key={row.feature}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: theme.space[3],
                  paddingHorizontal: theme.space[4],
                  borderBottomWidth: index === FEATURES.length - 1 ? 0 : 1,
                  borderBottomColor: theme.colors.divider,
                }}
              >
                <Text variant="footnote" style={{ flex: 2 }}>
                  {row.feature}
                </Text>

                <View style={{ flex: 1, alignItems: 'center' }}>
                  {row.free === false ? (
                    <Ionicons name="close" size={16} color={theme.colors.textTertiary} />
                  ) : (
                    <Text variant="caption" tone="secondary" align="center">
                      {row.free}
                    </Text>
                  )}
                </View>

                <View style={{ flex: 1.4, alignItems: 'center' }}>
                  {row.premium === true ? (
                    <Ionicons name="checkmark" size={17} color={theme.colors.success} />
                  ) : (
                    <Text variant="caption" tone="premium" align="center">
                      {row.premium}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </Card>
        </View>

        {/* ---------------- Outros planos ---------------- */}
        <View style={{ marginTop: theme.space[8], gap: theme.space[3] }}>
          <Text variant="overline" tone="tertiary">
            Outros planos
          </Text>

          <Card variant="flat" padding={4}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space[3] }}>
              <Ionicons name="people" size={22} color={theme.colors.brand} />
              <View style={{ flex: 1 }}>
                <Text variant="headline">Família · R$ 49,90/mês</Text>
                <Text variant="caption" tone="secondary">
                  Até 6 perfis independentes, cada um com seu progresso. Sai por R$ 8,31 por
                  pessoa.
                </Text>
              </View>
            </View>
          </Card>

          <Card variant="flat" padding={4}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space[3] }}>
              <Ionicons name="school" size={22} color={theme.colors.brand} />
              <View style={{ flex: 1 }}>
                <Text variant="headline">Estudante · R$ 14,95/mês</Text>
                <Text variant="caption" tone="secondary">
                  50% de desconto com comprovante de matrícula. Renovação anual.
                </Text>
              </View>
            </View>
          </Card>
        </View>

        {/* ---------------- Objeções ---------------- */}
        <View style={{ marginTop: theme.space[8], gap: theme.space[4] }}>
          <Text variant="overline" tone="tertiary">
            Perguntas frequentes
          </Text>

          {[
            {
              q: 'Perco meu progresso se cancelar?',
              a: 'Não. Todo o seu progresso, vocabulário e ofensiva continuam no aparelho. Você volta ao plano gratuito e mantém tudo.',
            },
            {
              q: 'Preciso de internet para usar?',
              a: 'Não. O app inteiro funciona offline. A assinatura libera baixar mais conteúdo e o tutor de IA completo, que precisa de rede só nas respostas mais elaboradas.',
            },
            {
              q: 'Como cancelo?',
              a: 'Pelo próprio app, em dois toques, ou pela loja onde assinou. Sem ligação, sem e-mail, sem retenção.',
            },
            {
              q: 'Os 7 dias grátis cobram alguma coisa?',
              a: 'Nada é cobrado durante o teste. Avisamos 2 dias antes do fim, e você pode cancelar até o último minuto.',
            },
          ].map((item) => (
            <View key={item.q} style={{ gap: 5 }}>
              <Text variant="headline">{item.q}</Text>
              <Text variant="footnote" tone="secondary" style={{ lineHeight: 21 }}>
                {item.a}
              </Text>
            </View>
          ))}
        </View>

        <Button
          label="Assinar Premium"
          size="lg"
          fullWidth
          icon="star"
          style={{ marginTop: theme.space[10] }}
          onPress={() => router.back()}
        />
        <Button
          label="Continuar no plano gratuito"
          variant="ghost"
          fullWidth
          style={{ marginTop: theme.space[2] }}
          onPress={() => router.back()}
        />
      </ScrollView>
    </Screen>
  );
}

function CycleOption({
  selected,
  onPress,
  title,
  price,
  badge,
}: {
  selected: boolean;
  onPress: () => void;
  title: string;
  price: string;
  badge?: string;
}) {
  const theme = useTheme();

  return (
    <Touchable
      onPress={onPress}
      haptic="light"
      pressedScale={0.98}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      style={{
        flex: 1,
        padding: theme.space[4],
        borderRadius: theme.radius.lg,
        borderWidth: 2,
        gap: 4,
        backgroundColor: selected ? theme.colors.brandSubtle : theme.colors.surface,
        borderColor: selected ? theme.colors.brand : theme.colors.border,
      }}
    >
      {badge ? <Badge label={badge} tone="success" /> : null}
      <Text variant="headline">{title}</Text>
      <Text variant="footnote" tone="secondary">
        {price}
      </Text>
    </Touchable>
  );
}
