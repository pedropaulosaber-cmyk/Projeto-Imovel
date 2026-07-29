# 13. Estratégia de lançamento

## 13.1 Premissa

O mercado de apps de idiomas é saturado e dominado por uma marca com bilhões em
capital. Competir por gasto em mídia é perder. A entrada é por **posicionamento
específico e defensável**:

> O app de idiomas que funciona no metrô.

Isso não é uma tagline de marketing — é uma decisão arquitetural que os
concorrentes não conseguem copiar rápido, porque offline-first não é um
recurso que se acrescenta a um app cliente-servidor: é uma reescrita.

## 13.2 Fases

### Alfa fechado — semanas 1–2
- 30 pessoas do círculo próximo, com perfis reais dos 4 segmentos.
- Objetivo: encontrar bugs de fluxo e medir o funil de onboarding.
- Critério de saída: 80% completam o onboarding e fazem a primeira lição.

### Beta fechado — semanas 3–8
- 200 testadores via TestFlight e Google Play Beta.
- Recrutamento: comunidades de intercâmbio, estudo de idiomas e produtividade.
- Métricas acompanhadas: D1, D7, taxa de conclusão de lição, crash-free,
  **% de sessões offline** (a métrica que valida a tese do produto).
- Critério de saída: D7 ≥ 35%, crash-free ≥ 99,5%, NPS ≥ 40.

### Lançamento suave — semanas 9–12
- Publicação nas lojas **sem anúncio pago**.
- Foco em ASO e nas primeiras 100 avaliações orgânicas.
- Objetivo: validar que a retenção se sustenta fora do grupo de testadores
  (que é sempre otimista) antes de gastar em aquisição.

### Lançamento público — semana 13+
- Product Hunt, imprensa de tecnologia e educação, criadores de conteúdo.
- Primeira verba de mídia paga, com CAC-alvo definido pela LTV medida no beta.

## 13.3 ASO

**Nome nas lojas:** `Lumo: Idiomas Offline com IA`
Carrega o nome, a categoria e os dois diferenciais em 32 caracteres.

**Palavras-chave prioritárias (Brasil):**
aprender inglês offline · inglês sem internet · repetição espaçada ·
flashcards inglês · praticar pronúncia · tutor de inglês IA · espanhol offline

**Capturas de tela** — na ordem que responde às objeções reais:

1. "Funciona sem internet. De verdade." — lição rodando em modo avião
2. "O app sabe quando você vai esquecer" — fila de revisão + curva
3. "Fale desde o primeiro dia" — nota de pronúncia palavra a palavra
4. "Um tutor que corrige seus erros de brasileiro" — correção do tutor
5. "Veja sua evolução de verdade" — painel de progresso
6. "Grátis para começar" — comparação de planos

**Vídeo de 15 s:** modo avião ativado → lição completa → tela de conclusão.
Uma promessa, demonstrada, sem narração.

## 13.4 Preços de lançamento

| Plano | Mensal | Anual | Observação |
|---|---|---|---|
| Gratuito | R$ 0 | — | A1 completo, SRS ilimitado, 5 vidas |
| Premium | R$ 29,90 | R$ 199 (R$ 16,58/mês) | 7 dias grátis |
| Família | R$ 49,90 | R$ 349 | Até 6 perfis |
| Estudante | R$ 14,95 | R$ 99 | Com comprovação |

Referência de mercado: Duolingo Super ~R$ 39,99/mês; Babbel ~R$ 44/mês. O Lumo
entra ~25% abaixo, com plano anual agressivo — assinatura anual reduz churn
pela metade e é o que financia a aquisição.

## 13.5 Riscos e planos de contingência

| Risco | Sinal | Resposta |
|---|---|---|
| D7 abaixo de 30% | Retenção do beta | Reforçar onboarding e notificações antes de gastar em mídia |
| Conversão abaixo de 3% | Painel de assinaturas | Testar paywall em outros gatilhos e revisar o limite gratuito |
| Custo de IA por usuário acima do previsto | Faturamento do provedor | Reduzir cota gratuita; cache mais agressivo; modelo menor para tarefas simples |
| Avaliações ruins por conteúdo raso | Lojas | Acelerar Fase 4; comunicar o roadmap dentro do app |
| Concorrente lança offline-first | Notícia | Já teremos vantagem de execução; dobrar em correção específica para lusófonos |

## 13.6 Métricas do primeiro trimestre

| Métrica | Meta |
|---|---|
| Downloads | 25.000 |
| Ativação (onboarding + 1ª lição) | 70% |
| D1 / D7 / D30 | 55% / 40% / 20% |
| Conversão para pago | 4% |
| Nota nas lojas | ≥ 4,6 |
| % de sessões offline | ≥ 25% |
| Crash-free | ≥ 99,5% |
