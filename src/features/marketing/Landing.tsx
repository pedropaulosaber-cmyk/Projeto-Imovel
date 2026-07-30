/**
 * Landing page (web).
 *
 * É a vitrine pública do Lumo — o que substitui a página anterior no domínio.
 * Renderizada com os mesmos componentes do app, e não em HTML separado, por
 * três razões:
 *  1. Uma base de código só. A marca não pode divergir entre site e produto.
 *  2. O visitante vê a interface real, não uma maquete.
 *  3. O botão "começar agora" leva direto ao onboarding — sem cadastro, sem
 *     download, sem fricção. O funil mais curto possível.
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { View, useWindowDimensions } from 'react-native';

import { LANGUAGE_META } from '@/content/vocabulary';
import { Aurora, Badge, Button, Card, Screen, Text, useTheme } from '@/design';
import { SUPPORTED_LANGUAGES } from '@/domain/types';

const PILLARS = [
  {
    icon: 'cloud-offline' as const,
    title: 'Funciona sem internet',
    description:
      'Não é "modo offline": é arquitetura offline-first. Toda interação acontece primeiro no seu aparelho e sincroniza depois, sozinha.',
  },
  {
    icon: 'repeat' as const,
    title: 'Repetição espaçada de verdade',
    description:
      'O app calcula quando cada palavra está prestes a ser esquecida e traz ela de volta exatamente nesse dia. Você revisa menos e lembra mais.',
  },
  {
    icon: 'mic' as const,
    title: 'Fala desde o primeiro dia',
    description:
      'Nota de pronúncia palavra por palavra, com feedback instantâneo. Sem depender da nuvem, sem gastar seus dados.',
  },
  {
    icon: 'sparkles' as const,
    title: 'Tutor de IA paciente',
    description:
      'Conversa por texto e voz, explica seus erros, lembra o que você já estudou e adapta a dificuldade sozinho.',
  },
  {
    icon: 'analytics' as const,
    title: 'Progresso que você sente',
    description:
      'XP, ofensiva, ligas e um painel honesto: precisão, pronúncia, palavras dominadas e quanto falta para o próximo nível.',
  },
  {
    icon: 'flash' as const,
    title: 'Rápido de verdade',
    description:
      'Abre em segundos, responde no toque e mantém 60fps. Feito para o celular que você tem, não para o carro-chefe do ano.',
  },
];

const DIFFERENTIATORS = [
  {
    title: 'A nota vem do que você faz, não de autoavaliação',
    body: 'Em apps de flashcard você decide se "acertou". No Lumo, a dificuldade sai do desempenho real: se acertou, quanto demorou, se pediu dica. É onde a repetição espaçada silenciosamente para de funcionar nos concorrentes.',
  },
  {
    title: 'Correção pensada para quem fala português',
    body: '"I have 25 years", "je suis 25 ans", "ich habe 25 Jahre". O corretor conhece os erros típicos de lusófonos em cada idioma e explica a regra — offline, sem consumir nada.',
  },
  {
    title: 'Sua ofensiva sobrevive à vida real',
    body: 'Congelamentos automáticos protegem a sequência quando você viaja ou adoece. Perder 180 dias por um imprevisto é o motivo nº 1 de desinstalação — aqui isso não acontece.',
  },
];

const PLANS = [
  {
    name: 'Gratuito',
    price: 'R$ 0',
    period: 'para sempre',
    highlight: false,
    features: [
      'Trilha completa de nível A1',
      'Revisão espaçada ilimitada',
      '5 vidas por sessão',
      'Tutor offline',
      'Download do curso básico',
    ],
  },
  {
    name: 'Premium',
    price: 'R$ 29,90',
    period: 'por mês',
    highlight: true,
    features: [
      'Todos os idiomas e níveis',
      'Vidas infinitas',
      'Tutor de IA completo, por voz e texto',
      'Correção detalhada de redações',
      'Download ilimitado, offline total',
      'Sem anúncios, 5 congelamentos',
    ],
  },
  {
    name: 'Família',
    price: 'R$ 49,90',
    period: 'por mês · até 6 pessoas',
    highlight: false,
    features: [
      'Tudo do Premium para cada membro',
      'Painel da família',
      'Desafios entre membros',
      'Perfis independentes',
    ],
  },
];

export function Landing() {
  const theme = useTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();

  // Mobile-first: a régua é o telefone, e o desktop apenas ganha respiro.
  const isWide = width >= 900;

  const start = () => router.push('/(onboarding)/welcome');

  return (
    <Screen scroll padded={false} edgeTop={false}>
      <Aurora seed="landing" height={520} intensity={1.25} />

      <View style={{ paddingHorizontal: theme.space[5], paddingTop: theme.space[16] }}>
        {/* ---------------- Hero ---------------- */}
        <View style={{ gap: theme.space[5], alignItems: isWide ? 'center' : 'flex-start' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space[2] }}>
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: theme.radius.md,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: theme.colors.brand,
              }}
            >
              <Ionicons name="flash" size={21} color={theme.colors.onBrand} />
            </View>
            <Text variant="title3">Lumo</Text>
          </View>

          <Badge label="Offline-first · Android, iOS e web" tone="brand" icon="cloud-offline" />

          <Text
            variant="display"
            align={isWide ? 'center' : 'left'}
            style={{ fontSize: isWide ? 56 : 40, lineHeight: isWide ? 62 : 46 }}
          >
            Fluência, um dia de cada vez.
          </Text>

          <Text
            variant="body"
            tone="secondary"
            align={isWide ? 'center' : 'left'}
            style={{ maxWidth: 620, fontSize: 19, lineHeight: 30 }}
          >
            {/*
              A contagem vem da lista de idiomas suportados, não de um número
              digitado à mão. A frase anterior citava cinco idiomas e o app já
              tinha oito — o tipo de mentira que ninguém escreve de propósito e
              que ninguém revisa depois de adicionar o sexto.
            */}
            Aprenda {SUPPORTED_LANGUAGES.length} idiomas — do inglês ao japonês — com repetição
            espaçada, prática de fala e um tutor de IA que lembra do que você errou. Tudo
            funciona sem internet, de verdade.
          </Text>

          <View
            style={{
              flexDirection: 'row',
              gap: theme.space[3],
              flexWrap: 'wrap',
              justifyContent: isWide ? 'center' : 'flex-start',
            }}
          >
            <Button label="Começar agora — é grátis" size="lg" onPress={start} icon="rocket" />
            <Button
              label="Ver planos"
              size="lg"
              variant="secondary"
              onPress={() => router.push('/paywall')}
            />
          </View>

          <Text variant="footnote" tone="tertiary">
            Sem cadastro para começar. Sem cartão de crédito.
          </Text>
        </View>

        {/* ---------------- Idiomas ---------------- */}
        <View style={{ marginTop: theme.space[16], gap: theme.space[4] }}>
          <Text variant="overline" tone="tertiary">
            Idiomas disponíveis
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space[3] }}>
            {SUPPORTED_LANGUAGES.map((language) => {
              const meta = LANGUAGE_META[language];
              return (
                <Card
                  key={language}
                  variant="outlined"
                  padding={4}
                  style={{ minWidth: 150, flex: 1 }}
                >
                  <View style={{ gap: 4 }}>
                    <Text variant="title3">{meta.flag}</Text>
                    <Text variant="headline">{meta.name}</Text>
                    <Text variant="caption" tone="tertiary">
                      {meta.speakers} de falantes
                    </Text>
                  </View>
                </Card>
              );
            })}
          </View>
        </View>

        {/* ---------------- Pilares ---------------- */}
        <View style={{ marginTop: theme.space[16], gap: theme.space[6] }}>
          <View style={{ gap: theme.space[2] }}>
            <Text variant="overline" tone="brand">
              Por que o Lumo
            </Text>
            <Text variant="title1" style={{ maxWidth: 620 }}>
              Um app de idiomas construído por quem entende de memória, não só de telas.
            </Text>
          </View>

          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: theme.space[4],
            }}
          >
            {PILLARS.map((pillar) => (
              <Card
                key={pillar.title}
                variant="flat"
                padding={5}
                style={{ flexGrow: 1, flexBasis: isWide ? 300 : '100%' }}
              >
                <View style={{ gap: theme.space[3] }}>
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: theme.radius.md,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: theme.colors.brandSubtle,
                    }}
                  >
                    <Ionicons name={pillar.icon} size={22} color={theme.colors.brand} />
                  </View>
                  <Text variant="headline">{pillar.title}</Text>
                  <Text variant="footnote" tone="secondary" style={{ lineHeight: 21 }}>
                    {pillar.description}
                  </Text>
                </View>
              </Card>
            ))}
          </View>
        </View>

        {/* ---------------- Diferenciais ---------------- */}
        <View style={{ marginTop: theme.space[16], gap: theme.space[5] }}>
          <Text variant="title2">O que ninguém mais faz</Text>
          {DIFFERENTIATORS.map((item, index) => (
            <View
              key={item.title}
              style={{
                flexDirection: 'row',
                gap: theme.space[4],
                paddingVertical: theme.space[4],
                borderTopWidth: index === 0 ? 0 : 1,
                borderTopColor: theme.colors.divider,
              }}
            >
              <Text variant="title3" tone="brand">
                {String(index + 1).padStart(2, '0')}
              </Text>
              <View style={{ flex: 1, gap: theme.space[2] }}>
                <Text variant="headline">{item.title}</Text>
                <Text variant="footnote" tone="secondary" style={{ lineHeight: 21 }}>
                  {item.body}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* ---------------- Planos ---------------- */}
        <View style={{ marginTop: theme.space[16], gap: theme.space[5] }}>
          <View style={{ gap: theme.space[2] }}>
            <Text variant="overline" tone="brand">
              Planos
            </Text>
            <Text variant="title1">Comece de graça. Suba quando fizer sentido.</Text>
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space[4] }}>
            {PLANS.map((plan) => (
              <Card
                key={plan.name}
                variant={plan.highlight ? 'subtle' : 'outlined'}
                padding={5}
                style={{ flexGrow: 1, flexBasis: isWide ? 280 : '100%' }}
              >
                <View style={{ gap: theme.space[3] }}>
                  {plan.highlight ? <Badge label="Mais escolhido" tone="brand" /> : null}
                  <Text variant="headline">{plan.name}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                    <Text variant="title1">{plan.price}</Text>
                    <Text variant="footnote" tone="tertiary">
                      {plan.period}
                    </Text>
                  </View>

                  <View style={{ gap: theme.space[2], marginTop: theme.space[2] }}>
                    {plan.features.map((feature) => (
                      <View
                        key={feature}
                        style={{
                          flexDirection: 'row',
                          gap: theme.space[2],
                          alignItems: 'flex-start',
                        }}
                      >
                        <Ionicons
                          name="checkmark-circle"
                          size={17}
                          color={theme.colors.success}
                          style={{ marginTop: 2 }}
                        />
                        <Text variant="footnote" flex>
                          {feature}
                        </Text>
                      </View>
                    ))}
                  </View>

                  <Button
                    label={plan.highlight ? 'Assinar Premium' : 'Escolher'}
                    variant={plan.highlight ? 'primary' : 'secondary'}
                    onPress={plan.highlight ? () => router.push('/paywall') : start}
                    fullWidth
                    style={{ marginTop: theme.space[3] }}
                  />
                </View>
              </Card>
            ))}
          </View>

          <Text variant="caption" tone="tertiary">
            Plano Estudante: 50% de desconto com comprovação de matrícula. Cancele quando
            quiser.
          </Text>
        </View>

        {/* ---------------- CTA final ---------------- */}
        <Card
          variant="raised"
          padding={8}
          style={{ marginTop: theme.space[16], alignItems: 'center' }}
        >
          <View style={{ gap: theme.space[4], alignItems: 'center', maxWidth: 520 }}>
            <Text variant="title2" align="center">
              Seu próximo idioma começa nos próximos 3 minutos.
            </Text>
            <Text variant="callout" tone="secondary" align="center">
              Responda cinco perguntas e o Lumo monta seu plano de estudos personalizado.
            </Text>
            <Button label="Montar meu plano" size="lg" onPress={start} icon="arrow-forward" />
          </View>
        </Card>

        {/* ---------------- Rodapé ---------------- */}
        <View
          style={{
            marginTop: theme.space[16],
            paddingVertical: theme.space[8],
            borderTopWidth: 1,
            borderTopColor: theme.colors.divider,
            gap: theme.space[2],
          }}
        >
          <Text variant="footnote" tone="tertiary">
            Lumo · Fluência, um dia de cada vez.
          </Text>
          <Text variant="caption" tone="tertiary">
            Dados tratados conforme a LGPD. Você pode exportar ou apagar tudo a qualquer
            momento, direto no app.
          </Text>
        </View>
      </View>
    </Screen>
  );
}
