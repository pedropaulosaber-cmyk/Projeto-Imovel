-- ============================================================================
-- VÉRTICE — schema inicial
--
-- Aplicar com:  supabase db push       (ou o SQL editor do projeto)
--
-- Regras que moram no banco, e não na aplicação, porque aplicação tem bug e
-- constraint não tem:
--   • empreendimento publicado exige número de registro de incorporação
--     (Lei 4.591/64, art. 32);
--   • lead exige timestamp de consentimento LGPD;
--   • leitura pública só enxerga empreendimento publicado, e só as colunas
--     que não são sensíveis (ver a view `empreendimentos_publicos`).
-- ============================================================================

create extension if not exists "pgcrypto";

create type categoria_empreendimento as enum ('lancamento', 'na_planta', 'remanescente');
create type status_publicacao as enum ('rascunho', 'publicado', 'despublicado');
create type status_parceria as enum ('pendente', 'negociando', 'ativa', 'recusada');
create type origem_lead as enum ('meta_ads', 'organico', 'direto');
create type status_sync as enum ('pendente', 'enviado', 'falhou');

-- ---------------------------------------------------------------------------
-- Regiões
-- ---------------------------------------------------------------------------
create table regioes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  slug text unique not null,
  cidade text not null default 'Goiânia',
  estado text not null default 'GO'
);

-- ---------------------------------------------------------------------------
-- Empreendimentos
-- ---------------------------------------------------------------------------
create table empreendimentos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  slug text unique not null,
  categoria categoria_empreendimento not null,
  regiao_id uuid references regioes(id) not null,

  numero_registro_incorporacao text,
  status_publicacao status_publicacao not null default 'rascunho',

  incorporadora_nome text not null,
  status_parceria status_parceria not null default 'pendente',
  -- Referencia o corretor no Método CRM (id externo). Nulo até a parceria
  -- virar 'ativa'; nesse caso o lead cai no pool do SDR interno.
  corretor_responsavel_id uuid,

  preco_a_partir numeric,
  metragem_min numeric,
  metragem_max numeric,
  quartos_min int,
  quartos_max int,
  previsao_entrega date,
  descricao text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint registro_obrigatorio_se_publicado
    check (status_publicacao <> 'publicado' or numero_registro_incorporacao is not null)
);

create index empreendimentos_listagem_idx
  on empreendimentos (regiao_id, categoria)
  where status_publicacao = 'publicado';

-- ---------------------------------------------------------------------------
-- Mídias
-- ---------------------------------------------------------------------------
create table empreendimento_midias (
  id uuid primary key default gen_random_uuid(),
  empreendimento_id uuid references empreendimentos(id) on delete cascade not null,
  tipo text not null check (tipo in ('foto', 'planta', 'video')),
  url text not null,
  legenda text,
  ordem int not null default 0
);

create index empreendimento_midias_ordem_idx
  on empreendimento_midias (empreendimento_id, ordem);

-- ---------------------------------------------------------------------------
-- Leads
-- ---------------------------------------------------------------------------
create table leads (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  telefone text not null,
  email text,
  empreendimento_id uuid references empreendimentos(id) on delete set null,

  origem origem_lead not null,
  utm_source text,
  utm_campaign text,
  utm_content text,

  -- LGPD art. 8º: o consentimento precisa ser demonstrável. Guardamos quando
  -- e de onde ele veio.
  consentimento_lgpd_at timestamptz not null,
  ip_consentimento inet,

  status_sync_crm status_sync not null default 'pendente',
  tentativas_sync int not null default 0,
  ultimo_erro_sync text,
  -- Gerado no site e enviado ao CRM: é a chave de idempotência do webhook.
  crm_lead_uuid uuid unique not null,

  created_at timestamptz not null default now()
);

create index leads_pendentes_idx
  on leads (created_at)
  where status_sync_crm <> 'enviado';

-- ---------------------------------------------------------------------------
-- Auditoria (checklist de segurança do CLAUDE.md)
-- ---------------------------------------------------------------------------
create table lead_auditoria (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id) on delete cascade,
  crm_lead_uuid uuid not null,
  evento text not null,
  origem origem_lead,
  hash_assinatura text,
  detalhe jsonb,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- RLS — ligado em todas as tabelas, sem exceção
-- ---------------------------------------------------------------------------
alter table regioes                enable row level security;
alter table empreendimentos        enable row level security;
alter table empreendimento_midias  enable row level security;
alter table leads                  enable row level security;
alter table lead_auditoria         enable row level security;

-- Sem policy = ninguém lê nem escreve, exceto `service_role`, que ignora RLS.
-- É esse o padrão desejado para `leads` e `lead_auditoria`: nenhum acesso
-- direto do cliente, só por Server Action / Edge Function.

-- Leitura pública das regiões (só nome e slug importam para a navegação).
create policy regioes_leitura_publica
  on regioes for select
  to anon, authenticated
  using (true);

-- Leitura pública apenas de empreendimento publicado.
create policy empreendimentos_leitura_publica
  on empreendimentos for select
  to anon, authenticated
  using (status_publicacao = 'publicado');

-- Mídia segue a visibilidade do empreendimento dono.
create policy midias_leitura_publica
  on empreendimento_midias for select
  to anon, authenticated
  using (
    exists (
      select 1 from empreendimentos e
      where e.id = empreendimento_midias.empreendimento_id
        and e.status_publicacao = 'publicado'
    )
  );

-- ---------------------------------------------------------------------------
-- View pública: exclui as colunas comerciais sensíveis
-- (status_parceria, corretor_responsavel_id, incorporadora interna).
-- ---------------------------------------------------------------------------
create view empreendimentos_publicos
with (security_invoker = true) as
select
  e.id,
  e.nome,
  e.slug,
  e.categoria,
  e.regiao_id,
  e.numero_registro_incorporacao,
  e.preco_a_partir,
  e.metragem_min,
  e.metragem_max,
  e.quartos_min,
  e.quartos_max,
  e.previsao_entrega,
  e.descricao
from empreendimentos e
where e.status_publicacao = 'publicado';

-- ---------------------------------------------------------------------------
-- updated_at automático
-- ---------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger empreendimentos_updated_at
  before update on empreendimentos
  for each row execute function set_updated_at();
