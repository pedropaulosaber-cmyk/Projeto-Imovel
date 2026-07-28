# 3. Arquitetura do sistema

## 3.1 Escolha da stack mobile — e por quê

O requisito é um app **nativo para Android e iOS**, mobile-first, offline-first,
com 60fps e baixo consumo de bateria, a partir de uma base de código só.

### Alternativas avaliadas

| Opção | A favor | Contra | Veredito |
|---|---|---|---|
| **Nativo puro** (Kotlin + Swift) | Melhor desempenho e integração possível | Duas bases, dois times, duas vezes o custo de cada feature | Rejeitado — inviabiliza o ritmo de iteração |
| **Flutter** | Renderização própria (Impeller), animação previsível, excelente desempenho | Dart isola o time do ecossistema JS/TS; sem alvo web de qualidade real; widgets não são nativos, e o app "parece Flutter" nos dois sistemas | Rejeitado por causa da web (ver abaixo) |
| **React Native + Expo** ✅ | TypeScript de ponta a ponta (app, domínio, backend); componentes nativos reais; Nova Arquitetura (Fabric + TurboModules) fecha a distância de desempenho; **`react-native-web` gera a versão web da mesma base**; OTA update com EAS Update | Bundle inicial maior que Flutter; algumas libs nativas exigem cuidado | **Escolhido** |

### O fator decisivo

O produto precisa entregar **três alvos**: Android, iOS e uma presença web
(landing + PWA). Flutter cobre dois bem e o terceiro mal. React Native com Expo
Router cobre os três com a mesma base — o que significa que a landing page
mostra a interface real do produto, não uma maquete, e que uma correção de
design vale nos três lugares.

Os contra-argumentos clássicos ("RN é lento") deixaram de valer com a Nova
Arquitetura: `react-native-reanimated` roda animação e gesto na thread de UI,
e o JSI eliminou a serialização da ponte. Neste app, o trabalho pesado é I/O de
banco e correção de string — nenhum dos dois é limitado por renderização.

### Decisões complementares

- **Expo SDK 52** (RN 0.76, Nova Arquitetura ligada) — build nativo gerenciado
  via EAS, sem manter Xcode/Gradle na mão.
- **Expo Router** — roteamento baseado em arquivos, deep linking automático e
  exportação web estática.
- **Zustand** em vez de Redux — seletores granulares, sem boilerplate, e
  legível fora de componentes (necessário para sync e handlers de background).
- **TypeScript estrito** com `noUncheckedIndexedAccess` — o acesso a índice de
  array é a fonte nº 1 de `undefined` em runtime em código de exercícios.

## 3.2 Visão em camadas

```
┌──────────────────────────────────────────────────────────────┐
│  APRESENTAÇÃO   app/ (rotas)  ·  src/design/  ·  src/features/│
│  Componentes puros. Não sabem que existe banco ou rede.       │
├──────────────────────────────────────────────────────────────┤
│  ESTADO         src/state/  (Zustand)                         │
│  Cache reativo do disco. Nunca é a fonte de verdade.          │
├──────────────────────────────────────────────────────────────┤
│  DOMÍNIO        src/domain/  ·  src/sync/merge.ts             │
│  Funções puras: SRS, XP, ofensiva, plano, correção, merge.    │
│  Zero I/O. 100% testável. É aqui que mora o produto.          │
├──────────────────────────────────────────────────────────────┤
│  DADOS          src/db/  (repositórios → DocumentStore)       │
│  Fonte de verdade local. Toda escrita enfileira na outbox.    │
├──────────────────────────────────────────────────────────────┤
│  INFRA          src/db/adapters/  ·  src/services/  ·  src/ai/│
│  SQLite | Web · TTS/STT · provedor de IA · transporte de sync │
└──────────────────────────────────────────────────────────────┘
```

**Regra de dependência:** as setas apontam sempre para baixo. O domínio não
importa nada de fora dele — é por isso que 169 testes rodam em Node puro, sem
emulador e sem mock de React Native.

## 3.3 Fluxo offline-first

```
      Usuário responde um exercício
                  │
                  ▼
      ┌───────────────────────┐
      │ gradeExercise()       │  função pura, síncrona
      │ src/domain/grading.ts │  < 1 ms
      └───────────┬───────────┘
                  ▼
        Feedback na tela  ◄── o usuário já seguiu em frente
                  │
                  ▼  (assíncrono, sem bloquear)
      ┌───────────────────────────────────┐
      │ Transação no banco local          │
      │ · estado de SRS reagendado        │
      │ · XP e estatística do dia         │
      │ · progresso da lição              │
      │ · N operações na outbox           │
      └───────────────┬───────────────────┘
                      ▼
      ┌───────────────────────────────────┐
      │ SyncEngine (quando houver rede)   │
      │ push em lote → pull → merge       │
      └───────────────────────────────────┘
```

O caminho crítico do usuário **nunca toca a rede**. Essa é a diferença entre
offline-first e "modo offline".

## 3.4 Persistência: a porta `DocumentStore`

O app precisa de SQLite no celular e de algo que funcione no navegador sem
exigir cabeçalhos COOP/COEP (necessários para SQLite via WASM/OPFS).

A abstração fica no nível de **coleções com campos indexados**, não de SQL:

- **`SqliteDocumentStore`** (Android/iOS) — cada coleção vira uma tabela real,
  com colunas tipadas para os campos consultáveis, índices de verdade e uma
  coluna `doc` com o JSON completo. PRAGMAs: `WAL`, `synchronous=NORMAL`,
  `foreign_keys=ON`, `temp_store=MEMORY`.
- **`WebDocumentStore`** (web, testes e fallback) — índices em memória +
  persistência debounced em `AsyncStorage`.

O formato híbrido (coluna indexada + JSON) dá consulta rápida nos caminhos
quentes (`dueAt <= now`) e evolução de schema sem migração para todo campo novo
que não é filtrado. Migração de coluna é **aditiva apenas** — um app offline
pode ficar meses sem atualizar e precisa continuar abrindo.

## 3.5 Sincronização

**Outbox pattern.** Toda escrita do usuário grava no banco e enfileira uma
operação com relógio lógico monotônico. A fila é coalescida por
`(entidade, id)`: uma sessão de 80 revisões gera 1 operação de estatística
diária, não 80.

**Três políticas de merge** (`src/sync/merge.ts`), escolhidas por natureza do
dado:

- `lww` — perfil, matrícula, configurações. Intenção declarativa; a mais
  recente vence.
- `additive` — estatísticas, XP, contadores. Acúmulos; sobrescrever apagaria
  estudo real.
- `monotonic` — progresso, SRS, ofensiva, conquistas. Só avançam; o merge pega
  o estado mais avançado, o que garante **convergência independente da ordem**.

Ids determinísticos (`deterministicId(userId, lessonId)`) fazem dois
dispositivos offline criarem o *mesmo* registro lógico — o merge vira upsert em
vez de duplicata. Não existe tela de resolução de conflito.

## 3.6 Camada de IA

```
  App  →  ResilientAiProvider
              ├── RemoteAiProvider ──► Edge Function ──► LLM
              │      (falhou? timeout? sem cota?)
              └── OfflineTutorProvider  ◄── sempre responde
```

Duas regras inegociáveis:

1. **A chave de API nunca vive no app.** Binário móvel é público; qualquer
   segredo embutido é um segredo vazado. O cliente fala com uma Edge Function
   própria, que autentica, aplica cota por plano e só então chama o provedor.
2. **A IA é acelerador, nunca requisito.** Toda chamada tem caminho de
   degradação determinístico. Timeout curto (12 s) porque uma resposta offline
   imediata vale mais que uma resposta remota lenta.

## 3.7 Backend (planejado)

O app v1 funciona 100% sem servidor. Quando entrar, o desenho é:

```
Cliente ──HTTPS──► Supabase
                    ├── Auth (JWT, e-mail + OAuth)
                    ├── Postgres + RLS por user_id
                    ├── Storage (áudios, imagens, avatares)
                    ├── Edge Functions
                    │     ├── /ai/*        proxy do LLM, com cota
                    │     ├── /sync/push   aplica outbox
                    │     ├── /sync/pull   entrega mudanças
                    │     └── /billing/*   webhooks de assinatura
                    └── Realtime (ligas e comunidade)
```

O servidor é **sem estado de sessão** e não é caminho crítico. Isso é o que
permite escalar para milhões de usuários com custo baixo: a maior parte do
trabalho já aconteceu no dispositivo.

## 3.8 Desempenho

| Técnica | Onde | Efeito |
|---|---|---|
| Animação na thread de UI | `Touchable`, `ProgressBar`, `ProgressRing` | 60fps mesmo com JS ocupado |
| Consultas indexadas | `dueAt`, `moduleId`, `userId` | Fila de revisão em O(log n) |
| Escrita em lote em transação única | `putMany` | Semente de 500 registros: segundos → ms |
| Coalescência da outbox | `syncRepository.enqueue` | 80 operações → 1 |
| Janela de renderização | `FlatList` no vocabulário | Rolagem fluida com milhares de itens |
| Seletores granulares | Zustand | XP muda sem re-renderizar a trilha |
| Fontes do sistema | `tokens.ts` | Zero byte de webfont, zero FOIT |
| Semeadura versionada | `seedContentIfNeeded` | Zero I/O nas aberturas seguintes |
