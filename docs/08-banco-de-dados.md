# 8. Banco de dados

Dois esquemas coexistem, com papéis diferentes:

- **Local (dispositivo)** — SQLite. É a **fonte de verdade** do usuário.
- **Servidor** — PostgreSQL. É o **backup, o sincronizador e a base analítica**.

Essa inversão é o coração do offline-first: o servidor não é onde o dado nasce.

---

## 8.1 Esquema local (SQLite)

Cada coleção declarada em `src/db/collections.ts` vira uma tabela no formato
híbrido: colunas tipadas para os campos consultáveis + `doc` com o JSON
completo.

```sql
CREATE TABLE "review_states" (
  id         TEXT PRIMARY KEY NOT NULL,
  userId     TEXT,
  language   TEXT,
  conceptId  TEXT,
  dueAt      INTEGER,
  state      TEXT,
  starred    INTEGER,
  doc        TEXT NOT NULL      -- ReviewState serializado
);
CREATE INDEX idx_review_states_userId    ON "review_states" (userId);
CREATE INDEX idx_review_states_dueAt     ON "review_states" (dueAt);
CREATE INDEX idx_review_states_state     ON "review_states" (state);
CREATE INDEX idx_review_states_language  ON "review_states" (language);
CREATE INDEX idx_review_states_conceptId ON "review_states" (conceptId);
```

**Por que híbrido e não totalmente normalizado no cliente:** consulta indexada
rápida nos caminhos quentes (`dueAt <= now`), e evolução de schema sem migração
para todo campo novo que não é filtrado. Um app offline pode ficar meses sem
atualizar; migração aditiva-apenas é o caminho seguro.

### Coleções

| Coleção | Conteúdo | Campos indexados |
|---|---|---|
| `profiles` | Perfil do usuário | email, plan, onboardingCompleted, updatedAt |
| `enrollments` | Matrícula por idioma | userId, language, isActive |
| `courses` | Cursos | language, level, order |
| `modules` | Módulos | courseId, order |
| `lessons` | Lições | moduleId, order, kind, premium |
| `exercises` | Exercícios | lessonId, order, type |
| `vocabulary` | Léxico | language, term, cefr, frequencyRank |
| `review_states` | **Estado de memória (SRS)** | userId, language, conceptId, dueAt, state, starred |
| `lesson_progress` | Progresso por lição | userId, lessonId, status |
| `daily_stats` | Agregado diário | userId, date, goalMet |
| `sessions` | Sessões de estudo | userId, startedAt, kind, language |
| `quests` | Missões | userId, period, expiresAt |
| `achievement_progress` | Conquistas | userId, achievementId, unlockedAt, seen |
| `tutor_conversations` | Conversas | userId, language, updatedAt |
| `tutor_messages` | Mensagens | conversationId, createdAt, role |
| `content_bundles` | Catálogo de download | language, scope, scopeId |
| `downloads` | Downloads | bundleId, status |
| `sync_queue` | **Outbox** | entity, entityId, clock, attempts |
| `key_value` | Estado avulso (ofensiva, carteira) | updatedAt |

**Critério para promover um campo a coluna:** só entra se for usado em `WHERE`
ou `ORDER BY` de uma consulta real. Índice a mais custa escrita e espaço — os
dois recursos mais escassos num celular de entrada.

### PRAGMAs

```sql
PRAGMA journal_mode = WAL;      -- leitura/escrita concorrentes sem bloqueio
PRAGMA synchronous  = NORMAL;   -- seguro em WAL; muito menos I/O = bateria
PRAGMA foreign_keys = ON;
PRAGMA temp_store   = MEMORY;   -- ordenações na RAM, não no cartão
```

---

## 8.2 Esquema do servidor (PostgreSQL)

Totalmente normalizado, com RLS por usuário e particionamento nas tabelas de
maior volume.

```sql
-- ═══════════════ Identidade ═══════════════

CREATE TABLE profiles (
  id                UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name      TEXT NOT NULL DEFAULT 'Estudante',
  avatar_url        TEXT,
  bio               TEXT,
  ui_language       TEXT NOT NULL DEFAULT 'pt',
  native_language   TEXT NOT NULL DEFAULT 'pt-BR',
  timezone          TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at        TIMESTAMPTZ            -- exclusão LGPD (soft, 30 d)
);

CREATE TABLE languages (
  code              TEXT PRIMARY KEY,      -- ISO 639-1
  name              TEXT NOT NULL,
  native_name       TEXT NOT NULL,
  is_active         BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE enrollments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  language_code     TEXT NOT NULL REFERENCES languages(code),
  goals             TEXT[] NOT NULL DEFAULT '{}',
  current_level     TEXT NOT NULL DEFAULT 'A1',
  daily_goal_xp     INT  NOT NULL DEFAULT 120,
  daily_minutes     INT  NOT NULL DEFAULT 10,
  study_days        SMALLINT[] NOT NULL DEFAULT '{1,2,3,4,5}',
  reminder_minute   INT,
  is_active         BOOLEAN NOT NULL DEFAULT true,
  started_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, language_code)
);
CREATE INDEX ON enrollments (user_id) WHERE is_active;

-- ═══════════════ Conteúdo ═══════════════

CREATE TABLE courses (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  language_code     TEXT NOT NULL REFERENCES languages(code),
  title             TEXT NOT NULL,
  description       TEXT,
  level             TEXT NOT NULL,
  sort_order        INT  NOT NULL,
  content_version   INT  NOT NULL DEFAULT 1,
  published_at      TIMESTAMPTZ
);

CREATE TABLE modules (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id         UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  subtitle          TEXT,
  icon              TEXT,
  sort_order        INT  NOT NULL,
  can_do_statements TEXT[] NOT NULL DEFAULT '{}'
);
CREATE INDEX ON modules (course_id, sort_order);

CREATE TABLE lessons (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id         UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  kind              TEXT NOT NULL,
  sort_order        INT  NOT NULL,
  estimated_minutes INT  NOT NULL DEFAULT 5,
  xp_reward         INT  NOT NULL DEFAULT 25,
  prerequisites     UUID[] NOT NULL DEFAULT '{}',
  is_premium        BOOLEAN NOT NULL DEFAULT false
);
CREATE INDEX ON lessons (module_id, sort_order);

CREATE TABLE exercises (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id         UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  type              TEXT NOT NULL,
  sort_order        INT  NOT NULL,
  difficulty        REAL NOT NULL DEFAULT 0.5,
  concept_ids       UUID[] NOT NULL DEFAULT '{}',
  payload           JSONB NOT NULL,   -- campos específicos do tipo
  explanation       TEXT,
  hint              TEXT
);
CREATE INDEX ON exercises (lesson_id, sort_order);
CREATE INDEX ON exercises USING GIN (concept_ids);

CREATE TABLE vocabulary (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  language_code     TEXT NOT NULL REFERENCES languages(code),
  term              TEXT NOT NULL,
  translation       TEXT NOT NULL,
  part_of_speech    TEXT,
  phonetic          TEXT,
  example_sentence  TEXT,
  example_translation TEXT,
  frequency_rank    INT,
  cefr              TEXT,
  audio_url         TEXT,
  tags              TEXT[] NOT NULL DEFAULT '{}',
  UNIQUE (language_code, term)
);
CREATE INDEX ON vocabulary (language_code, frequency_rank);
-- Busca textual do banco de vocabulário.
CREATE INDEX ON vocabulary USING GIN (to_tsvector('simple', term || ' ' || translation));

-- ═══════════════ Progresso ═══════════════

CREATE TABLE review_states (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  concept_id        UUID NOT NULL,
  language_code     TEXT NOT NULL REFERENCES languages(code),
  ease_factor       REAL NOT NULL DEFAULT 2.5,
  interval_days     REAL NOT NULL DEFAULT 0,
  repetitions       INT  NOT NULL DEFAULT 0,
  due_at            TIMESTAMPTZ NOT NULL,
  last_reviewed_at  TIMESTAMPTZ,
  stability         REAL NOT NULL DEFAULT 0,
  difficulty        REAL NOT NULL DEFAULT 0.3,
  lapses            INT  NOT NULL DEFAULT 0,
  total_reviews     INT  NOT NULL DEFAULT 0,
  state             TEXT NOT NULL DEFAULT 'new',
  starred           BOOLEAN NOT NULL DEFAULT false,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, concept_id)
);
-- Índice parcial: a consulta quente é "meus itens vencidos".
CREATE INDEX ON review_states (user_id, due_at) WHERE state <> 'new';

CREATE TABLE lesson_progress (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lesson_id         UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  status            TEXT NOT NULL DEFAULT 'available',
  best_accuracy     REAL NOT NULL DEFAULT 0,
  attempts          INT  NOT NULL DEFAULT 0,
  completed_at      TIMESTAMPTZ,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, lesson_id)
);

CREATE TABLE daily_stats (
  user_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stat_date         DATE NOT NULL,
  xp_earned         INT  NOT NULL DEFAULT 0,
  minutes_studied   INT  NOT NULL DEFAULT 0,
  lessons_completed INT  NOT NULL DEFAULT 0,
  reviews_completed INT  NOT NULL DEFAULT 0,
  exercises_attempted INT NOT NULL DEFAULT 0,
  exercises_correct INT  NOT NULL DEFAULT 0,
  pronunciation_score REAL,
  new_words_learned INT  NOT NULL DEFAULT 0,
  goal_met          BOOLEAN NOT NULL DEFAULT false,
  PRIMARY KEY (user_id, stat_date)
) PARTITION BY RANGE (stat_date);
-- Partição mensal: a tabela cresce em (usuários × dias) e é o maior volume
-- do sistema. Particionar mantém os índices pequenos e permite arquivar.

CREATE TABLE study_sessions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  kind              TEXT NOT NULL,
  lesson_id         UUID REFERENCES lessons(id) ON DELETE SET NULL,
  language_code     TEXT NOT NULL REFERENCES languages(code),
  started_at        TIMESTAMPTZ NOT NULL,
  ended_at          TIMESTAMPTZ,
  xp_earned         INT  NOT NULL DEFAULT 0,
  exercises_attempted INT NOT NULL DEFAULT 0,
  exercises_correct INT  NOT NULL DEFAULT 0,
  attempts          JSONB NOT NULL DEFAULT '[]'
) PARTITION BY RANGE (started_at);

-- ═══════════════ Gamificação ═══════════════

CREATE TABLE wallets (
  user_id           UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  coins             INT NOT NULL DEFAULT 0,
  total_xp          BIGINT NOT NULL DEFAULT 0,
  level             INT NOT NULL DEFAULT 1,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE streaks (
  user_id           UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  current_streak    INT NOT NULL DEFAULT 0,
  longest_streak    INT NOT NULL DEFAULT 0,
  last_active_date  DATE,
  freezes_available INT NOT NULL DEFAULT 1,
  freezes_used      DATE[] NOT NULL DEFAULT '{}'
);

CREATE TABLE achievements (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code              TEXT UNIQUE NOT NULL,
  title             TEXT NOT NULL,
  description       TEXT NOT NULL,
  icon              TEXT NOT NULL,
  tier              TEXT NOT NULL,
  metric            TEXT NOT NULL,
  target            INT  NOT NULL,
  coin_reward       INT  NOT NULL DEFAULT 0
);

CREATE TABLE achievement_progress (
  user_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id    UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  progress          INT NOT NULL DEFAULT 0,
  unlocked_at       TIMESTAMPTZ,
  seen              BOOLEAN NOT NULL DEFAULT false,
  PRIMARY KEY (user_id, achievement_id)
);

CREATE TABLE quests (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  period            TEXT NOT NULL,
  code              TEXT NOT NULL,
  target            INT  NOT NULL,
  progress          INT  NOT NULL DEFAULT 0,
  xp_reward         INT  NOT NULL DEFAULT 0,
  coin_reward       INT  NOT NULL DEFAULT 0,
  expires_at        TIMESTAMPTZ NOT NULL,
  completed_at      TIMESTAMPTZ
);
CREATE INDEX ON quests (user_id, expires_at);

-- ═══════════════ Ligas ═══════════════

CREATE TABLE leagues (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier              TEXT NOT NULL,
  week_start        DATE NOT NULL,
  UNIQUE (tier, week_start, id)
);

CREATE TABLE league_members (
  league_id         UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  weekly_xp         INT NOT NULL DEFAULT 0,
  PRIMARY KEY (league_id, user_id)
);
CREATE INDEX ON league_members (league_id, weekly_xp DESC);

-- ═══════════════ Assinaturas ═══════════════

CREATE TABLE plans (
  code              TEXT PRIMARY KEY,     -- free · premium · family · student
  name              TEXT NOT NULL,
  price_cents       INT  NOT NULL,
  billing_period    TEXT NOT NULL,        -- month · year
  max_members       INT  NOT NULL DEFAULT 1,
  features          JSONB NOT NULL DEFAULT '{}'
);

CREATE TABLE subscriptions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan_code         TEXT NOT NULL REFERENCES plans(code),
  status            TEXT NOT NULL,        -- trialing · active · past_due · canceled
  provider          TEXT NOT NULL,        -- apple · google · stripe
  provider_ref      TEXT NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  trial_ends_at     TIMESTAMPTZ,
  canceled_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_ref)
);
CREATE INDEX ON subscriptions (user_id, status);

CREATE TABLE family_members (
  subscription_id   UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (subscription_id, user_id)
);

-- ═══════════════ Comunidade ═══════════════

CREATE TABLE friendships (
  requester_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  addressee_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status            TEXT NOT NULL DEFAULT 'pending',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (requester_id, addressee_id),
  CHECK (requester_id <> addressee_id)
);

CREATE TABLE groups (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  description       TEXT,
  owner_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_public         BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE group_members (
  group_id          UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role              TEXT NOT NULL DEFAULT 'member',
  joined_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, user_id)
);

-- ═══════════════ Tutor ═══════════════

CREATE TABLE tutor_conversations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  language_code     TEXT NOT NULL REFERENCES languages(code),
  title             TEXT,
  scenario          TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE tutor_messages (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id   UUID NOT NULL REFERENCES tutor_conversations(id) ON DELETE CASCADE,
  role              TEXT NOT NULL,
  content           TEXT NOT NULL,
  translation       TEXT,
  corrections       JSONB,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON tutor_messages (conversation_id, created_at);

-- ═══════════════ Auditoria ═══════════════

CREATE TABLE audit_log (
  id                BIGSERIAL PRIMARY KEY,
  user_id           UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action            TEXT NOT NULL,
  entity            TEXT,
  entity_id         TEXT,
  metadata          JSONB,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON audit_log (user_id, created_at DESC);
```

## 8.3 Row Level Security

Toda tabela com `user_id` é protegida. O padrão:

```sql
ALTER TABLE review_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "próprios dados" ON review_states
  FOR ALL
  USING      (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

Conteúdo (`courses`, `lessons`, `exercises`, `vocabulary`) é leitura pública
para autenticados; escrita apenas por `service_role`.

Ligas exigem política mais frouxa de leitura (o usuário precisa ver os
colegas de divisão), restrita às colunas expostas por uma view:

```sql
CREATE VIEW league_standings AS
  SELECT lm.league_id, lm.user_id, p.display_name, p.avatar_url, lm.weekly_xp
  FROM league_members lm
  JOIN profiles p ON p.id = lm.user_id;
```

## 8.4 Escala para milhões de usuários

| Preocupação | Medida |
|---|---|
| Volume de `daily_stats` e `study_sessions` | Particionamento por intervalo de data (mensal); partições antigas em armazenamento frio |
| Consulta de itens vencidos | Índice **parcial** `(user_id, due_at) WHERE state <> 'new'` — exclui a maior fatia da tabela |
| Ranking de liga | Índice `(league_id, weekly_xp DESC)`; grupos de 30 tornam a consulta trivial |
| Leitura de conteúdo | Imutável e versionado → CDN + cache agressivo; nunca consulta o Postgres no caminho quente |
| Carga de escrita | O cliente é a fonte de verdade; o servidor recebe **lotes** coalescidos, não escrita por evento |
| Analytics | Réplica de leitura / warehouse separado; nenhuma consulta analítica no banco transacional |
| Exclusão LGPD | `deleted_at` (soft) + rotina de purga em 30 dias, com `ON DELETE CASCADE` fazendo o trabalho |
