# 14. Estratégia de crescimento

## 14.1 O modelo

Em educação por assinatura, **retenção é aquisição**. Um usuário que fica 12
meses vale 12× um que fica 1, e o produto que retém pode pagar mais caro por
usuário do que a concorrência — o que, na prática, é a única forma de comprar
mídia contra um incumbente com bilhões em caixa.

Por isso a ordem de investimento é: **retenção → monetização → aquisição**.
Gastar em aquisição antes de retenção é encher um balde furado.

## 14.2 Loops de crescimento

### Loop 1 — Hábito (o principal)

```
Lembrete no horário escolhido
        ↓
Sessão curta (5–15 min)
        ↓
Meta batida → ofensiva +1 → XP visível
        ↓
Investimento acumulado (ofensiva, palavras, nível)
        ↓
Custo psicológico de parar aumenta
        ↓
    volta ao topo, no dia seguinte
```

É o loop que a ofensiva com congelamento protege. Cada quebra definitiva é um
usuário perdido para sempre.

### Loop 2 — Social

```
Conquista desbloqueada (ofensiva de 30, 1.000 palavras)
        ↓
Card compartilhável gerado no app
        ↓
Postagem em rede social
        ↓
Amigo instala → entra na mesma liga
        ↓
Competição amigável aumenta a frequência dos dois
```

Diferencial: o card é gerado **offline**, com os números reais do usuário.

### Loop 3 — Conteúdo (SEO)

```
Páginas geradas a partir do banco de vocabulário
"Como se diz X em inglês" · "1000 palavras mais usadas em espanhol"
        ↓
Tráfego orgânico de cauda longa
        ↓
CTA para o app com o termo já carregado
        ↓
Instalação com intenção altíssima
```

O banco de vocabulário com frequência, fonética e exemplo é um ativo de SEO
que já existe — publicá-lo custa quase nada e compõe ao longo dos anos.

### Loop 4 — Família e instituições

Plano Família (6 perfis por R$ 49,90) faz um assinante trazer até 5 pessoas com
CAC próximo de zero. Escolas e cursinhos são a extensão natural: um contrato
B2B traz centenas de alunos e valida a marca.

## 14.3 Canais, por ordem de prioridade

| Canal | Custo | Escala | Quando |
|---|---|---|---|
| **ASO** | Baixo | Alta | Desde o dia 1 |
| **SEO de vocabulário** | Baixo | Alta | Mês 2 (compõe lentamente) |
| **Comunidades** (Reddit, Discord, grupos de intercâmbio) | Baixo | Média | Beta |
| **Criadores de conteúdo** de idiomas | Médio | Média | Mês 3 |
| **Compartilhamento in-app** | Zero | Média | Fase 5 |
| **Mídia paga** (Meta, TikTok, Google) | Alto | Alta | Só após LTV medida |
| **B2B escolas** | Médio | Média | Mês 6 |

## 14.4 Alavancas de retenção

| Momento | Risco | Intervenção |
|---|---|---|
| Dia 1 | Não completa o onboarding | Onboarding sem cadastro, ≤ 2 min |
| Dia 2 | Não volta | Lembrete no horário escolhido + primeira lição curta |
| Dia 3–7 | Hábito não formado | Missões diárias fáceis; primeira conquista no dia 3 |
| Dia 7–14 | Ofensiva em risco | Notificação de ofensiva (a mais eficaz do app) |
| Dia 14–30 | Sensação de estagnação | Checkpoint de módulo; painel mostrando palavras dominadas |
| Dia 30+ | Fila de revisão acumulada | Plano paga a dívida primeiro; previsão de carga mostra que é finita |
| Dia 90+ | Conteúdo esgotado | Novo nível CEFR; segundo idioma |

## 14.5 Notificações — política

Máximo **2 por dia**, sempre acionáveis:

1. **Lembrete diário** no horário que o usuário escolheu.
2. **Ofensiva em risco**, disparada por `streakAtRisk()`, só quando ele
   realmente estudou ontem e ainda não estudou hoje.

Nunca: notificação genérica de engajamento, promoção disfarçada de aviso, ou
"sentimos sua falta". Cada notificação irrelevante aumenta a chance de o
usuário desligar **todas** — e aí perdemos a única alavanca de retorno.

## 14.6 Monetização — evolução

| Fase | Estratégia |
|---|---|
| Lançamento | Freemium com limite de vidas; paywall contextual |
| Mês 3 | Teste A/B de gatilhos e de limite gratuito |
| Mês 6 | Plano Família e Estudante ativos |
| Mês 9 | B2B para escolas e empresas |
| Mês 12 | Conteúdo especializado (inglês para TI, saúde, aviação) como upsell |

**Princípio:** o plano gratuito precisa ser genuinamente útil. É ele que
alimenta o funil, gera avaliações e sustenta o SEO. Estrangular o gratuito
aumenta a conversão do mês e mata o crescimento do ano.

## 14.7 Métricas de crescimento

| Métrica | Fórmula | Meta ano 1 |
|---|---|---|
| **Métrica-norte** | Usuários com ≥ 5 dias de meta em 7 | 35% dos ativos |
| Coeficiente viral (K) | Convites × taxa de conversão | 0,25 |
| CAC | Gasto ÷ instalações pagas | < R$ 18 |
| LTV | ARPU × meses de vida | > R$ 120 |
| Razão LTV/CAC | — | > 3 |
| Payback | CAC ÷ margem mensal | < 6 meses |
| Churn mensal | Cancelamentos ÷ assinantes | < 6% |
