# VÉRTICE — imóveis em Goiânia

Site de captação de leads para empreendimentos imobiliários em Goiânia-GO. Lançamentos, imóveis na
planta e remanescentes no Setor Serrinha, Setor Pedro Ludovico e Jardim Atlântico.

O contexto completo do projeto — regras de negócio, contrato com o Método CRM, design system e o
que ainda falta — está em [`CLAUDE.md`](./CLAUDE.md).

---

## Rodando

```bash
npm install
cp .env.example .env.local   # nada é obrigatório para subir
npm run dev
```

O site sobe sem banco, sem CRM e sem Meta. O formulário continua respondendo ao visitante e o lead
fica registrado no log de auditoria — perder um lead porque um segredo não foi preenchido seria
pior que entregar sem integração.

## Verificação

```bash
npm run verify   # typecheck + lint + build
```

Para conferir as telas num navegador de verdade (é onde os defeitos de layout aparecem, não no
typecheck):

```bash
npm run build && npm run start
# em outro terminal, com Playwright apontando para o Chromium local
```

## Decisões que valem saber antes de mexer

| Decisão | Por quê |
| --- | --- |
| Catálogo é um módulo TypeScript, não um banco | O Supabase ainda não foi provisionado. Todo acesso passa pelas funções em `src/content/empreendimentos.ts`, então trocar a fonte não toca em nenhuma página. |
| `/[regiao]/[categoria]` não lê `searchParams` | Ler tornaria a página dinâmica, e é ela que precisa ranquear. O filtro interativo mora em `/imoveis`. |
| CSP com `'unsafe-inline'` em `script-src` | Nonce por requisição mataria o SSG. Ver a justificativa no `next.config.ts`. |
| Rate limit em memória | Contagem por instância. Barra o caso que importa (um script disparando POSTs) sem exigir Redis. Trocar por Vercel KV quando o volume justificar. |
| Login não autentica | Depende do Supabase Auth. A tela diz isso em vez de fingir — um login que deixa qualquer um entrar é pior que nenhum. |
| Um empreendimento é rascunho de propósito | `residencial-bosque-t9` não tem registro de incorporação. Ele não pode aparecer em nenhuma listagem, página ou sitemap: é a prova viva de que o filtro de publicação funciona. |
| O site inteiro é `noindex` enquanto `site.conteudoDemonstracao` for `true` | Os imóveis são fictícios e o CRECI no rodapé é real. Deixar o Google indexar anúncio inventado sob uma inscrição verdadeira é problema de conselho regional, não de SEO. |

## Estrutura

```
src/
├── app/           rotas (App Router) — ver CLAUDE.md §5
├── components/    UI, agrupada por papel (layout, listagem, lead, secoes…)
├── config/        site.ts (marca, CRECI, contato) e env.ts (validação de ambiente)
├── content/       catálogo tipado: empreendimentos, regiões, parques, institucional
└── lib/           filtros, rotas e o pipeline de lead (schema, CRM, CAPI, auditoria)

supabase/migrations/  schema Postgres com RLS, pronto para aplicar
public/imagens/       fotos do design
```

## Conformidade

O site trata dois pontos que não são opcionais em divulgação imobiliária no Brasil:

- **Lei 4.591/64, art. 32** — nenhum empreendimento é publicado sem número de registro de
  incorporação. A regra é verificada na carga do catálogo (o build quebra) e existe como
  `check constraint` no banco.
- **Resolução COFECI 1.065/2007** — o CRECI aparece com a expressão "corretor de imóveis" em toda
  página, e o CRECI do corretor responsável aparece na página de cada imóvel.

A **Política de Privacidade** em `/privacidade` é texto base e precisa passar pelo jurídico antes
de a publicidade ir ao ar.
