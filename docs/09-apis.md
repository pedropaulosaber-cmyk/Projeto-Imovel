# 9. APIs

O app v1 funciona **sem servidor**. Este documento define o contrato que o
backend precisa cumprir quando entrar, e que já está abstraído no cliente pelas
portas `SyncTransport` (`src/sync/engine.ts`) e `AiProvider`
(`src/ai/provider.ts`).

**Base:** `https://api.lumo.app/v1`
**Auth:** `Authorization: Bearer <JWT>` (Supabase Auth)
**Formato:** JSON, UTF-8. Timestamps em epoch ms.

---

## 9.1 Convenções

### Envelope de erro

Todo erro devolve o mesmo formato — o cliente trata um caso só:

```json
{
  "error": {
    "code": "quota_exceeded",
    "message": "Limite de mensagens do tutor atingido para o plano gratuito.",
    "retryAfter": 3600
  }
}
```

| Status | Quando |
|---|---|
| 400 | Payload inválido |
| 401 | Token ausente ou expirado |
| 403 | Recurso exige plano superior |
| 404 | Recurso inexistente |
| 409 | Conflito de versão de conteúdo |
| 422 | Operação de sync rejeitada (ver `rejected[]`) |
| 429 | Rate limit ou cota do plano |
| 5xx | Erro do servidor — o cliente **mantém a fila** e tenta depois |

### Idempotência

Todo `POST` que muta estado aceita `Idempotency-Key`. Obrigatório em
`/sync/push` e `/billing/*`: sem isso, um retry após timeout duplicaria XP.

### Rate limits

| Escopo | Limite |
|---|---|
| Global por usuário | 300 req/min |
| `/sync/push` | 30 req/min |
| `/ai/*` (gratuito) | 20 req/dia |
| `/ai/*` (premium) | 500 req/dia |
| `/auth/*` por IP | 10 req/min |

---

## 9.2 Autenticação

```http
POST /auth/signup          { email, password, displayName? }
POST /auth/login           { email, password }
POST /auth/refresh         { refreshToken }
POST /auth/logout
POST /auth/oauth/:provider { idToken }         # google · apple
POST /auth/claim-device    { deviceProfileId } # vincula perfil local anônimo
```

`claim-device` é o que sustenta o onboarding sem cadastro: o perfil nasce
local e anônimo; quando o usuário decide criar conta, o progresso acumulado é
adotado em vez de descartado.

---

## 9.3 Sincronização

### `POST /sync/push`

```jsonc
// Requisição
{
  "deviceId": "01HQ...",
  "operations": [
    {
      "id": "01HQZX...",
      "entity": "review_states",
      "entityId": "user1:concept42",
      "op": "upsert",
      "clock": 1287,
      "payload": { "...": "ReviewState serializado" },
      "createdAt": 1772100000000
    }
  ]
}
```

```jsonc
// Resposta
{
  "acceptedIds": ["01HQZX..."],
  "rejected": [
    { "id": "01HQZY...", "error": "unknown_entity" }
  ],
  "serverClock": 4471
}
```

O servidor aplica cada operação segundo a política de merge da entidade
(§3.5). Operações rejeitadas incrementam o contador de tentativas no cliente e
são descartadas após 10 falhas — uma operação que o servidor nunca aceitará não
pode bloquear a fila para sempre.

### `GET /sync/pull?since=<epochMs>&limit=500`

```jsonc
{
  "changes": [
    {
      "entity": "lesson_progress",
      "entityId": "user1:lesson9",
      "op": "upsert",
      "payload": { "...": "..." },
      "updatedAt": 1772100500000
    }
  ],
  "cursor": 1772100500000,
  "hasMore": false
}
```

### `GET /sync/health`

Verificação barata de conectividade, sem autenticação. Usada por
`isReachable()` antes de gastar rádio com um lote completo.

---

## 9.4 Conteúdo

```http
GET /content/manifest?languages=en,es
GET /content/bundles/:bundleId?quality=standard|high
GET /content/courses/:courseId
GET /content/lessons/:lessonId/exercises
GET /content/vocabulary?language=en&from=0&limit=500
```

O manifesto devolve as versões disponíveis; o cliente compara com a versão
local e só baixa o que mudou.

```jsonc
// GET /content/manifest
{
  "languages": [
    {
      "code": "en",
      "contentVersion": 7,
      "bundles": [
        {
          "id": "bundle:en:full",
          "scope": "language",
          "title": "Idioma completo",
          "sizeBytes": { "standard": 155189248, "high": 432013312 },
          "url": "https://cdn.lumo.app/bundles/en/full-v7-standard.zip",
          "sha256": "9f2c..."
        }
      ]
    }
  ]
}
```

Pacotes são servidos por CDN com cache imutável e verificados por hash. O
Postgres nunca entra no caminho de download.

---

## 9.5 IA (Edge Functions)

Todas exigem autenticação e consomem cota do plano. **A chave do provedor nunca
sai do servidor.**

```http
POST /ai/chat              { context, message }
POST /ai/explain-error     { language, nativeLanguage, level, userAnswer, correctAnswer, prompt }
POST /ai/review-writing    { language, nativeLanguage, level, text, task }
POST /ai/generate-exercises{ language, level, lessonId, terms, count }
POST /ai/translate         { text, from, to }
GET  /ai/health
```

```jsonc
// POST /ai/chat → resposta
{
  "reply": "That's great! What did you do there?",
  "corrections": [
    {
      "original": "I have 25 years",
      "corrected": "I am 25 years old",
      "explanation": "Em inglês a idade usa o verbo to be, não to have.",
      "kind": "grammar"
    }
  ],
  "quota": { "used": 12, "limit": 500, "resetsAt": 1772150400000 }
}
```

**Contrato de degradação:** qualquer falha (timeout de 12 s, 429, 5xx) faz o
`ResilientAiProvider` cair para o tutor offline. O usuário nunca vê erro de IA
— vê uma resposta um pouco mais simples.

---

## 9.6 Gamificação e social

```http
GET  /leagues/current                  # divisão, ranking e posição
POST /leagues/join                     # entra numa divisão da faixa
GET  /achievements
GET  /quests/active
POST /quests/:id/claim
GET  /friends
POST /friends/request       { userId }
POST /friends/:id/accept
GET  /groups?query=
POST /groups                { name, description, isPublic }
POST /groups/:id/join
```

---

## 9.7 Assinaturas

```http
GET  /billing/plans
POST /billing/checkout         { planCode, cycle }
POST /billing/verify-receipt   { provider, receipt }   # apple · google
GET  /billing/subscription
POST /billing/cancel
POST /billing/webhook/:provider                        # sem auth, com assinatura HMAC
```

`verify-receipt` valida o recibo diretamente com Apple/Google — nunca confia no
cliente para determinar se alguém é assinante.

---

## 9.8 LGPD

```http
GET    /privacy/export     # gera JSON completo dos dados do titular
DELETE /privacy/account    # inicia exclusão (soft delete + purga em 30 dias)
GET    /privacy/consents
POST   /privacy/consents   { analytics: bool, marketing: bool }
```

O app também exporta e apaga **localmente**, sem depender do servidor —
requisito de um produto offline-first e um direito que não deve depender de
conexão.
