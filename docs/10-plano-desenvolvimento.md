# 10. Plano de desenvolvimento por fases

## Fase 0 — Fundação ✅ *entregue neste repositório*

| Entrega | Status |
|---|---|
| Identidade de marca (nome, slogan, paleta, tipografia) | ✅ |
| Design system com tokens, tema claro/escuro e 15 componentes | ✅ |
| Arquitetura offline-first (porta `DocumentStore` + 2 adaptadores) | ✅ |
| Domínio puro: SRS, gamificação, plano adaptativo, correção | ✅ |
| Outbox de sincronização + 3 políticas de merge | ✅ |
| 16 tipos de exercício com correção local | ✅ |
| Onboarding de 6 etapas com plano gerado | ✅ |
| Trilha, executor de lição, revisão SRS, prática por habilidade | ✅ |
| Painel de progresso com gráficos SVG próprios | ✅ |
| Tutor offline (cenários + correção por regra) | ✅ |
| Vocabulário, downloads, paywall, perfil com LGPD | ✅ |
| Conteúdo semente dos 5 idiomas | ✅ |
| Landing web (substitui a página anterior na Vercel) | ✅ |
| 169 testes automatizados; typecheck e build web verdes | ✅ |

**Estado:** o app funciona de ponta a ponta, 100% offline, sem backend.

---

## Fase 1 — Backend e contas (4 semanas)

| Semana | Entrega |
|---|---|
| 1 | Projeto Supabase, schema do §8, RLS em todas as tabelas, seeds |
| 2 | Auth (e-mail, Google, Apple) + `claim-device` para adotar perfil anônimo |
| 3 | Edge Functions `/sync/push` e `/sync/pull`; injeção do transporte real |
| 4 | Pipeline de conteúdo: CDN, manifesto, download real com `expo-file-system` |

**Critério de saída:** dois dispositivos estudando offline convergem para o
mesmo estado após sincronizar, em teste manual e automatizado.

**Riscos:** o merge é a parte mais delicada. Mitigação: as políticas já estão
testadas por convergência (`src/sync/__tests__/merge.test.ts`) antes de haver
servidor.

---

## Fase 2 — IA em produção (3 semanas)

| Semana | Entrega |
|---|---|
| 1 | Edge Function `/ai/*` com cota por plano, cache e limite de tokens |
| 2 | Tutor completo: memória de conversa, adaptação de nível, voz |
| 3 | Correção de redação, geração de exercícios sob medida, explicação de erro |

**Critério de saída:** com a rede desligada no meio de uma conversa, a
transição para o tutor offline é imperceptível.

**Controle de custo:** correção continua 100% local; a IA só entra em
explicação, conversa e escrita. Cota diária por plano imposta no servidor, não
no cliente.

---

## Fase 3 — Build nativo e lojas (3 semanas)

| Semana | Entrega |
|---|---|
| 1 | `expo prebuild`, EAS Build, ícones, splash, assinatura |
| 2 | Reconhecimento de voz nativo (Android `SpeechRecognizer`, iOS `SFSpeechRecognizer`) |
| 3 | Notificações locais, compras in-app, submissão às lojas |

**Critério de saída:** aprovação nas duas lojas; abertura a frio < 2,5 s num
Android de entrada real.

---

## Fase 4 — Conteúdo em escala (6 semanas, em paralelo)

| Entrega |
|---|
| A2 e B1 completos para inglês e espanhol |
| 3.000 termos por idioma com áudio de nativo gravado |
| Biblioteca de leitura (notícias adaptadas, histórias curtas) |
| Diálogos e podcasts com transcrição sincronizada |
| Ferramenta interna de autoria para o time editorial |

**Por que em paralelo:** conteúdo é o gargalo de longo prazo e não depende de
engenharia. Começar cedo evita que o app fique pronto e vazio.

---

## Fase 5 — Social e retenção (4 semanas)

| Entrega |
|---|
| Ligas semanais com processamento agendado |
| Amigos, ranking entre amigos, desafios |
| Grupos e comunidades |
| Compartilhamento de conquistas (loop viral) |
| Notificações inteligentes por comportamento |

---

## Fase 6 — Otimização e escala (contínuo)

| Frente |
|---|
| Telemetria de desempenho (tempo de abertura, fps, bateria) |
| Testes A/B de paywall, onboarding e metas |
| Ajuste do SRS com dados reais de revisão agregados |
| Novos idiomas (exigem curadoria de léxico e frases do zero) |
| Modelo de pronúncia no dispositivo (ver §15) |

---

## Marcos

| Marco | Prazo | Condição |
|---|---|---|
| **M1 — Alfa interno** | +4 sem | Backend no ar, sync convergente |
| **M2 — Beta fechado** | +8 sem | IA em produção, 200 testadores |
| **M3 — Lançamento nas lojas** | +12 sem | Nota ≥ 4,5 no beta, crash-free ≥ 99,5% |
| **M4 — Escala** | +24 sem | 3 idiomas com A1–B1 completos |

## Equipe mínima

| Papel | Quantidade | Fase |
|---|---|---|
| Engenheiro mobile (RN/TS) | 2 | Todas |
| Engenheiro backend | 1 | 1–2 |
| Designer de produto | 1 | Todas |
| Linguista / autor de conteúdo | 2 | 4 em diante |
| Growth | 1 | 5 em diante |
