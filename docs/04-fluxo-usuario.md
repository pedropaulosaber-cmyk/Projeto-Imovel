# 4. Fluxo completo do usuário

## 4.1 Mapa de navegação

```
                        ┌──────────────┐
                        │  app/index   │  decide o destino
                        └──────┬───────┘
             ┌─────────────────┼──────────────────┐
             ▼                 ▼                  ▼
   Landing (só web)     Onboarding          (tabs) — usuário existente
        │                    │                     │
        │  "Começar"         │  welcome            ├── Aprender   (trilha + plano)
        └───────────────────►│  setup ×6           ├── Praticar   (SRS + habilidades)
                             │  plan               ├── Tutor      (conversa IA)
                             └────────┬────────────┤── Progresso  (painel)
                                      │            └── Perfil     (config + LGPD)
                                      ▼
                              (tabs)/learn

  Rotas modais / empilhadas:
    /lesson/[id]      executor de lição
    /review           sessão de repetição espaçada
    /practice/[mode]  prática por habilidade
    /vocabulary       banco de palavras
    /downloads        gerenciar conteúdo offline
    /paywall          assinatura
```

## 4.2 Primeira sessão (o funil que mais importa)

| # | Tela | Ação | Fricção removida |
|---|---|---|---|
| 1 | Landing / abertura | Toca em "Começar agora" | Sem cadastro, sem cartão |
| 2 | Boas-vindas | Uma promessa, um botão | Nenhum texto longo antes da primeira ação |
| 3 | Idioma | Escolhe entre 5 | Bandeira + nº de falantes ancoram a decisão |
| 4 | Objetivo | Até 3 opções | Muda o conteúdo, e a tela diz isso |
| 5 | Nível | "Do zero" + A1–C2 com descrição em linguagem natural | Ninguém precisa saber o que é "B1" |
| 6 | Tempo | 5 a 60 min | Frase-chave: "escolha o que dá numa semana ruim" |
| 7 | Dias + lembrete | Seg–sex e 19h pré-marcados | Padrões sensatos reduzem abandono |
| 8 | Nome | Opcional | Não bloqueia o avanço |
| 9 | Plano | Projeções conservadoras + primeira lição | Fecha o loop de expectativa |
| 10 | Trilha | Primeira lição em um toque | — |

**Meta:** ≤ 2 minutos, 100% offline, zero campos obrigatórios além das escolhas.

## 4.3 Sessão diária recorrente

```
Abre o app
   │
   ▼
Trilha: saudação · ofensiva · XP de hoje
   │
   ▼
Anel de meta diária (progresso do dia)
   │
   ▼
"Seu plano de hoje" — blocos ordenados por prioridade
   │   ① revisão vencida   (se houver dívida de SRS)
   │   ② próxima lição     (avanço na trilha)
   │   ③ habilidade fraca  (escolhida pelos pesos do objetivo)
   │   ④ conversa          (se sobrar tempo e o objetivo pedir fala)
   ▼
Toca no primeiro bloco → sessão → conclusão com XP detalhado
   │
   ▼
Volta à trilha com o anel atualizado
   │
   ▼
Meta batida → ofensiva +1 → (opcional) continua no ritmo livre
```

O topo da tela responde **"o que eu faço agora?"**, não "onde eu estou". Um
usuário com 8 minutos livres não quer navegar uma árvore de módulos.

## 4.4 Fluxo dentro de uma lição

```
Abre  →  carrega exercícios do banco local
      →  registra os conceitos no SRS já na abertura*
      →  loop:
             mostra exercício
             usuário responde
             correção local (< 1 ms)  →  feedback colorido embaixo
             errou?  →  perde vida  +  reentra no fim da fila
             SRS atualizado em background
      →  fila vazia e sem pendências  →  tela de conclusão
             XP total + detalhamento por origem
             precisão · tempo · conceitos
      →  meta do dia batida?  →  atualiza ofensiva
```

\* Registrar na abertura garante que, mesmo se o usuário abandonar no meio, o
vocabulário visto entre na fila de revisão — o contato já aconteceu e a
memória já começou a decair.

**Sem vidas:** oferece assinatura ou volta à trilha. Nunca é um beco sem saída.

## 4.5 Fluxo de revisão (SRS)

Diferente da lição: **sem vidas, sem erro fatal**. Revisão é diagnóstico, não
prova. Punir o erro faria o usuário evitar os itens difíceis — justamente os
que precisam de revisão.

```
Fila montada (vencidos por menor recordação prevista + novos intercalados)
   │
   ▼
Mostra o termo → usuário tenta lembrar → "Mostrar resposta"
   │
   ▼
Quatro notas, cada uma exibindo QUANDO o item volta:
   De novo (1 min) · Difícil (3 d) · Bom (8 d) · Fácil (21 d)
   │
   ├─ "De novo" → reinsere 3 posições à frente na mesma sessão
   └─ demais    → reagenda e avança
   │
   ▼
Fim: XP creditado, estatística do dia acumulada, ofensiva avaliada
```

Mostrar o intervalo de cada botão torna o SRS **auditável** — o usuário confia
no agendamento em vez de tentar burlá-lo.

## 4.6 Fluxo offline → online

```
[Sem rede]
  Usuário estuda normalmente. Cada escrita:
    · grava no SQLite
    · enfileira na outbox (coalescida)
  Indicador mostra "N alterações pendentes"

[Rede volta]
  AppState → 'active'  ou  ciclo de 5 min
    │
    ├─ push em lotes de 50, em ordem de relógio lógico
    ├─ confirmadas → removidas da fila
    ├─ rejeitadas  → contador de tentativas (descarta após 10)
    └─ pull → merge por política → banco local
    │
    ▼
  Indicador some. O usuário nunca soube que havia algo pendente.
```

## 4.7 Momentos de conversão

O paywall aparece em três pontos, todos **contextuais** — nunca uma interrupção
aleatória:

1. **Vidas esgotadas** — o usuário quer continuar agora. Maior intenção.
2. **Lição premium na trilha** — a partir do módulo 3, quando o valor já foi
   sentido.
3. **Perfil / Praticar** — busca ativa, não interrupção.

A página abre ancorando no que o usuário **já conquistou** ("Você já tem 1.240
XP e 12 dias de ofensiva"), porque a decisão passa a ser sobre um produto
comprovado, não sobre uma promessa.
