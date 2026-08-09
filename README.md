# AUTOMATIZE

Marketplace de soluções de IA: criadores publicam agentes, automações e
workflows; empresas compram pronto, publicam demandas ou contratam
especialistas.

---

## Stack e por quê

| Camada | Escolha | Motivo |
| --- | --- | --- |
| Framework | **Next.js 16, App Router** | Server Components deixam a consulta ao banco no servidor, sem API intermediária nem dado sensível no bundle |
| Linguagem | **TypeScript strict** | `noUncheckedIndexedAccess` incluído — o acesso a índice que "sempre existe" é de onde vem metade dos `undefined` em produção |
| Estilo | **Tailwind v4** | Tokens do design em `globals.css`, uma fonte de verdade para a marca |
| Banco | **PostgreSQL + Prisma 7** | Constraints e transações no banco, não na aplicação |
| Sessão | **Token opaco em banco** | Revogação imediata: banimento, troca de senha e mudança de papel valem no ato — o que JWT não permite |
| Senha | **argon2id** | Custa memória, não só CPU; é o que derruba a vantagem da GPU |
| Validação | **Zod 4** | O mesmo schema no formulário e no servidor; o do servidor é o que protege |
| Pagamento | **Stripe Checkout** | O cartão não toca nosso servidor (escopo PCI-DSS SAQ A) |
| Arquivos | **S3 privado + URL assinada** | Nada de link público "difícil de adivinhar" |

---

## Rodando

```bash
npm install

cp .env.example .env      # preencha DATABASE_URL e AUTH_SECRET
npx prisma migrate dev    # cria o schema
npm run db:seed           # catálogo de desenvolvimento

npm run dev
```

Contas de desenvolvimento (senha `automatize-dev-2026`):

| E-mail | Papéis |
| --- | --- |
| `admin@automatize.com.br` | ADMIN, BUYER |
| `mariana@exemplo.com.br` | BUYER, CREATOR, PROFESSIONAL |
| `rafael@exemplo.com.br` | BUYER, CREATOR, PROFESSIONAL |
| `carlos@exemplo.com.br` | BUYER, CREATOR, PROFESSIONAL |
| `bruno@empresaexemplo.com.br` | BUYER |

---

## Verificação

```bash
npm run verify        # typecheck + lint + testes
npm run build
node scripts/verify-web.mjs   # navegador real: rotas, autorização, mobile
```

`verify-web.mjs` sobe a build de produção num Chromium e percorre as rotas
públicas, o fluxo autenticado e o mobile. Existe porque typecheck, lint e teste
unitário passam com folga em cima de uma tela branca — e já pegou três defeitos
reais neste projeto: CSP quebrando a página 404, um grid estourando a viewport
no celular e um link para uma rota que não existia.

---

## Arquitetura

```
src/
  app/          Rotas (App Router). Só apresentação — não consulta o banco.
  components/   Design system e UI compartilhada, sem regra de negócio.
  features/     UI com estado, por domínio (produtos, demandas, mensagens…).
  server/
    auth/       Sessão, senha, RBAC e ownership.
    services/   Regra de negócio. Único lugar que fala com o Prisma.
    actions/    Server Actions: validam, autorizam, chamam o service.
    payments/   Stripe: checkout e verificação de webhook.
    storage/    S3 privado e URLs assinadas.
    ratelimit/  Limite por janela deslizante.
    audit/      Registro de ação sensível.
  lib/          Utilidades isomórficas (dinheiro, texto, erros, validação).
  config/       Variáveis de ambiente validadas na inicialização.
```

**A regra que estrutura tudo:** a camada de apresentação não consulta o banco.
Não é convenção — é uma regra de lint (`no-restricted-imports`) que quebra o
build. O motivo é concreto: a checagem de ownership vive dentro do service, na
mesma função que escreve. Uma página que consulta direto pula essa checagem, e
é exatamente assim que nasce um IDOR.

---

## Segurança

O que está implementado e onde conferir:

- **Preço e comissão decididos no servidor** — `services/orders.ts`. O cliente
  envia o id do produto; nada mais.
- **Pagamento confirmado só por webhook assinado** — `api/webhooks/stripe`.
  Idempotente em duas camadas (chave do provedor e tabela `WebhookEvent`).
- **Ownership em toda escrita sobre registro de terceiro** — `auth/authorize.ts`.
  Responde 404, não 403, para não confirmar que o id existe.
- **Arquivos em bucket privado**, liberados por URL assinada de vida curta e
  só depois de conferir a compra — `services/downloads.ts`.
- **CSP com nonce por requisição**, sem `unsafe-inline` em `script-src` —
  `middleware.ts`.
- **Limite de taxa** em login, cadastro, checkout, download e escrita —
  `server/ratelimit`. Por e-mail no login (credential stuffing vem de milhares
  de IPs), por IP no cadastro.
- **argon2id** com os parâmetros do RFC 9106, e equalização de tempo no
  caminho "e-mail não existe" para não virar oráculo de enumeração.
- **Auditoria** de toda ação administrativa e financeira — `server/audit`.

---

## O que ainda não está pronto

Honestidade sobre o estado atual:

- **Upload de arquivo pela interface.** A infraestrutura existe e está testada
  (`storage/index.ts`: URL assinada, allowlist de MIME, teto de tamanho,
  sanitização de nome), mas a tela que a usa ainda não foi construída — o seed
  cria os registros de arquivo direto.
- **E-mail transacional.** As notificações são gravadas e aparecem in-app; não
  há envio por e-mail.
- **Mensagens em tempo real.** O modelo e as telas funcionam por requisição;
  falta o transporte (WebSocket/SSE) para atualizar sem recarregar.
- **Repasse automático ao vendedor.** O cálculo do líquido está correto e
  registrado por venda; a transferência ao vendedor (Stripe Connect) não está
  integrada.
- **Revisão jurídica** dos termos e da política de privacidade. Os textos
  descrevem o que o código faz de verdade, mas precisam passar por advogado
  antes de ir ao ar.
