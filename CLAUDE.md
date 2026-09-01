# Site de Empreendimentos Imobiliários — Contexto do Projeto

> Fonte de verdade do projeto para qualquer sessão do Claude Code.

## 1. Visão geral

Site de captação de leads para empreendimentos imobiliários em Goiânia-GO, dividido em três
categorias: **Lançamento**, **Na Planta** e **Remanescente**, organizados por **região**. O site
converte visitante de tráfego pago (Meta Ads) e orgânico (SEO) em lead, que é enviado em tempo
real para o **Método CRM** (produto irmão, projeto separado), onde um time de SDR qualifica e
distribui para o corretor responsável.

Este é um **projeto separado** do Método CRM — integração via API/webhook autenticado, sem banco
compartilhado.

### Papéis do operador (Pedro)

Corretor de imóveis (CRECI-GO 47958), fundador do Método CRM. Este site é o segundo produto do
ecossistema, reaproveitando marca, pipeline de Meta CAPI e infraestrutura de CRM já existentes.

## 2. Regras de negócio (não negociáveis — validar sempre antes de implementar feature nova)

- **Só publica empreendimento com número de registro de incorporação** (Lei 4.591/64, art. 32).
  Sem registro = rascunho, nunca visível publicamente.
  → Onde vive hoje: invariante na carga de `src/content/empreendimentos.ts` (o build quebra) e
  `constraint registro_obrigatorio_se_publicado` em `supabase/migrations/0001_init.sql`.
  Todo acesso a dado passa por `empreendimentosPublicados()`; nenhuma página importa o catálogo
  direto.
- **CRECI visível** em todo lugar que há divulgação de imóvel, formatado conforme Resolução
  COFECI 1.065/2007 (expressão "corretor de imóveis" em pelo menos 25% do tamanho do nome usado).
  → Componente `<Creci />` em `src/components/ui/primitivas.tsx`; rodapé de todas as páginas;
  linha de registro na página de cada imóvel.
- Empreendimento pode ser publicado **antes** da parceria formal com a incorporadora estar
  fechada (`status_parceria = pendente`). Nesse caso, o lead cai num pool do SDR interno, não é
  repassado a um corretor externo.
- Quando a parceria fecha e `corretor_responsavel_id` é definido, leads novos daquele
  empreendimento roteiam direto para o corretor no CRM.
  → `montarCorpo()` em `src/lib/lead/crm.ts` envia `corretor_responsavel_id: null` quando não há.
- LGPD: todo lead exige consentimento explícito registrado (timestamp + IP), com política de
  privacidade acessível no formulário.
  → `z.literal(true)` no schema, timestamp carimbado no servidor (nunca no cliente), IP capturado
  em `/api/leads`, política em `/privacidade`.

## 3. Stack técnica

- **Next.js 16 (App Router)**, SSG/ISR nas páginas de listagem e de empreendimento (SEO exige HTML
  pré-renderizado). Revalidação de 1 h.
- **Tailwind v4**, tokens em `src/app/globals.css` — uma fonte de verdade para a marca.
- **Supabase** (projeto próprio, separado do Método CRM) — Postgres + RLS + Edge Functions.
  Migração pronta em `supabase/migrations/0001_init.sql`; **ainda não provisionado**.
- **Vercel** para deploy, Edge Middleware para rate limiting.
- `next/image` para otimização de mídia (Core Web Vitals).
- Tracking: Meta Pixel (client) + Meta CAPI (server-side), com `event_id` compartilhado para
  deduplicação — mesmo padrão do Método CRM/ebook site.

## 4. Modelo de dados

O schema completo está em `supabase/migrations/0001_init.sql` — é ele o documento vivo, não este
trecho. Os tipos TypeScript que o espelham estão em `src/content/tipos.ts`.

Tabelas: `regioes`, `empreendimentos`, `empreendimento_midias`, `leads`, `lead_auditoria`.
Enums: `categoria_empreendimento`, `status_publicacao`, `status_parceria`, `origem_lead`,
`status_sync`.

**RLS**: ligado em todas as tabelas. `leads` e `lead_auditoria` não têm policy nenhuma — só
`service_role` (que ignora RLS) alcança, e só a partir do servidor. Leitura pública de
`empreendimentos` tem policy própria restrita a `status_publicacao = 'publicado'`; as colunas
comerciais sensíveis ficam fora da view `empreendimentos_publicos`.

## 5. Estrutura de rotas (App Router)

```
src/app/
├── (site)/                                    -- header + rodapé + barra de ação mobile
│   ├── page.tsx                               -- landing page (estática, ISR 1 h)
│   ├── imoveis/page.tsx                       -- listagem com filtros (dinâmica, noindex se filtrada)
│   ├── [regiao]/[categoria]/page.tsx          -- listagem indexável (SSG, dynamicParams: false)
│   ├── [regiao]/[categoria]/[slug]/page.tsx   -- página do imóvel (SSG) + Schema.org
│   ├── parques/[slug]/page.tsx                -- Parque Serrinha / Parque Cascavel (SSG)
│   ├── escritorio/page.tsx                    -- institucional
│   └── privacidade/page.tsx                   -- política LGPD
├── (area)/                                    -- sem rodapé nem barra de ação
│   ├── login/page.tsx                         -- ⚠ autenticação ainda não implementada
│   └── painel/page.tsx                        -- ⚠ prévia com dados de exemplo
├── api/leads/route.ts                         -- recebe form, grava, dispara webhook + CAPI
└── api/leads/retry/route.ts                   -- cron de reenvio (Vercel, a cada 15 min)

src/lib/
├── lead/{schema,crm,meta-capi,persistencia,auditoria}.ts
├── filtros.ts                                 -- leitura e aplicação dos filtros da listagem
└── rotas.ts                                   -- todas as URLs em um lugar
```

**Por que `/imoveis` é dinâmica e `/[regiao]/[categoria]` não é:** ler `searchParams` torna a
página dinâmica no Next. As rotas que precisam ranquear não leem — a barra de filtros nelas leva
para `/imoveis` já com região e categoria marcadas. Não mexer nisso sem entender o custo em SEO.

## 6. Contrato de integração com o Método CRM

```
POST {CRM_WEBHOOK_URL}
Headers:
  Content-Type: application/json
  X-Signature: HMAC-SHA256(body, LEAD_WEBHOOK_SECRET)
  X-Lead-Uuid: {lead_uuid}
Body:
{
  "lead_uuid": "uuid gerado pelo site (idempotência)",
  "nome": "...", "telefone": "...", "email": "...",
  "empreendimento": { "nome": "...", "slug": "...", "corretor_responsavel_id": "..." },
  "origem": "meta_ads", "utm_campaign": "...",
  "consentimento_lgpd_at": "ISO timestamp"
}
```

- Reenvio com backoff (0 s, 1 s, 4 s, 12 s) fora do caminho da resposta, via `after()`. Status em
  `leads.status_sync_crm`; o que sobra é recuperado por `/api/leads/retry`.
- `LEAD_WEBHOOK_SECRET` diferente por ambiente, nunca exposto no client.
- Se `corretor_responsavel_id` vier nulo, o Método CRM roteia para o pool de SDR interno.
- Verificação da assinatura em tempo constante (`assinaturaConfere`), exportada para o lado que
  recebe.

## 7. Design system

Transcrito do design **Site_Modelo_4** (dois artboards: desktop e mobile, que **não** são o mesmo
layout responsivo — ver §12). Tokens em `src/app/globals.css`, sob `@theme`.

| Token | Valor | Uso |
| --- | --- | --- |
| `preto` | `#0E0E0C` | fundo do site |
| `breu` | `#0A0A09` | fundo atrás do menu mobile |
| `carvao` | `#16150F` | card de empreendimento, folhas |
| `tinta` | `#14130F` | texto sobre creme e sobre ouro |
| `creme` | `#F6F3EC` | texto sobre preto, fundo das seções claras |
| `ouro` | `#E8B33C` | **único acento** — CTA, eyebrow, destaque |
| `grafite` / `pedra` / `areia` | `#4A4842` / `#6E6A60` / `#8A8778` | hierarquia sobre creme |

**Divergência registrada do briefing original:** o briefing pedia preto + creme sem cor terciária.
O design aprovado introduziu o ouro `#E8B33C` como acento e ele está em toda parte (CTAs, eyebrows,
badges, gráfico do painel). O design venceu. Não reintroduzir uma quarta cor.

Tipografia: **Poppins** (300/400/500/600/700) nos títulos e no corpo, **IBM Plex Mono** (400/500)
nos eyebrows, migalhas e linhas legais. Carregadas por `next/font` — sem request ao Google Fonts.

Badges de categoria são diferenciados por peso visual (preenchido / outline / cinza-chumbo), nunca
por cor.

## 8. SEO

- URL semântica `/[regiao]/[categoria]/[slug]`; a página 404 se a URL não bater com o imóvel.
- Schema.org: `RealEstateListing` + `Residence` em cada imóvel; `RealEstateAgent` na home.
- SSG/ISR obrigatório nas páginas indexáveis. Variação de filtro é `noindex, follow`.
- `sitemap.ts` só lista o que é indexável e publicado; rascunho nunca vaza.
- Conteúdo único por página — nunca copiar descrição literal da incorporadora (duplicidade +
  direitos autorais).

## 9. Segurança — checklist

- [x] RLS ativo em todas as tabelas, sem exceção (`0001_init.sql`)
- [x] Rate limiting no endpoint de lead (`src/middleware.ts`, 5/min por IP)
- [x] Validação server-side (zod) em todo input
- [x] HMAC no webhook site → CRM, com segredo rotacionável
- [x] Headers de segurança (CSP, HSTS) no `next.config.ts`
- [x] Log de auditoria de todo lead (origem, timestamp, hash da assinatura, IP pseudonimizado)
- [x] `service_role key` do Supabase nunca em código client-side
- [ ] Autenticação da área do corretor — **pendente**, entra com o Supabase Auth

A CSP usa `'unsafe-inline'` em `script-src` por decisão explícita: nonce por requisição obrigaria
toda página a ser renderizada sob demanda, e o SEO depende do SSG. Revisitar quando `/painel`
tratar dado sensível no navegador.

## 10. Estado atual e próximos passos

1. **Provisionar o Supabase** e aplicar `supabase/migrations/0001_init.sql`.
2. **Trocar o catálogo de demonstração** por empreendimentos reais, com registro de incorporação
   conferido, e virar `site.conteudoDemonstracao` para `false`.
3. **Trocar marca e contatos** em `src/config/site.ts` (hoje: nome VÉRTICE e telefone/endereço do
   design; o CRECI já é o real).
4. **Ligar o Método CRM** (`CRM_WEBHOOK_URL` + `LEAD_WEBHOOK_SECRET`) e o Meta (Pixel + CAPI).
5. **Implementar a autenticação** do corretor.
6. Fotos reais dos empreendimentos — hoje o placeholder hachurado do design entra sozinho quando
   `midia.url` é `null`.

## 11. Fora de escopo desta fase (não implementar ainda)

- Módulo de SDR completo com SLA automatizado
- Login social (login/senha simples é suficiente na v1)
- Multi-idioma
- Mapa interativo (o placeholder do design está no lugar; o botão "Mapa" da listagem está
  desabilitado com o motivo à mostra)

## 12. Como ler o design

O design tem **dois artboards distintos**, não um layout responsivo único:

- **Desktop** — pílula de navegação flutuante na home, barra sólida nas internas, herói em duas
  colunas com caixa de busca de três seletores, grade de cards.
- **Mobile** — barra compacta com "Buscar" + hambúrguer, menu de tela cheia, barra de ação fixa no
  rodapé, folhas vindas de baixo para busca e filtros, cards empilhados, carrosséis horizontais.

Diferem também na **ordem das seções** da home: no desktop os números vêm antes das oportunidades;
no mobile o estoque vem primeiro. Isso está implementado com `order-*` no `flex-col` da home.

Ao mexer em qualquer tela, conferir os dois. `md:` é a quebra entre eles.
