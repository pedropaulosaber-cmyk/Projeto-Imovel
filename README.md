# Lumo

**Fluência, um dia de cada vez.**

Aplicativo de aprendizado de idiomas **offline-first** para Android, iOS e web,
a partir de uma única base de código.

Inglês · Espanhol · Francês · Italiano · Alemão · Japonês · Coreano · Mandarim

---

## O que torna o Lumo diferente

**1. Offline-first de verdade, não "modo offline".**
Toda interação escreve primeiro no dispositivo. Correção de exercício,
agendamento de repetição espaçada, XP, ofensiva, pronúncia e tutor têm caminho
local completo. A rede é um detalhe de sincronização, nunca um requisito.

**2. A nota do SRS vem do desempenho, não de auto-avaliação.**
Apps de flashcard perguntam "você lembrou?". O Lumo observa: acertou, em quanto
tempo, e se pediu dica. Auto-avaliação é onde a repetição espaçada
silenciosamente para de funcionar nos concorrentes.

**3. Correção pensada para quem fala português.**
"I have 25 years", "je suis 25 ans", "ich habe 25 Jahre". O corretor conhece os
erros típicos de lusófonos em cada idioma e explica a regra — offline.

**4. A ofensiva sobrevive à vida real.**
Congelamentos automáticos protegem a sequência quando você viaja ou adoece.
Perder 180 dias por um imprevisto é o motivo nº 1 de desinstalação.

**5. Dois ritmos para o mesmo curso.**
O modo **Completo** entrega a trilha inteira; o **Essencial** reduz a sessão a
cinco exercícios, quatro mecânicas e nenhuma vida. O que não muda entre eles: a
correção, o XP e a repetição espaçada. Modo mais fácil que ensina menos é modo
inútil — ver [`src/domain/learning-mode.ts`](src/domain/learning-mode.ts).

**6. Apostila por nível, gerada no aparelho.**
Uma apostila por nível CEFR em cada idioma (8 × 6 = 48), montada a partir das
**mesmas fontes** das lições — vocabulário, gramática, frases e expressões — de
modo que não existe deriva entre o que a lição ensina e o que a apostila diz.
Baixar não consome dados: o documento é gerado localmente.

**7. Expressões idiomáticas explicadas em português.**
Literal, sentido real, equivalente brasileiro (ou a admissão explícita de que
não existe um) e origem. O card só revela depois do toque — recuperação ativa,
não leitura passiva.

**8. Seis níveis com conteúdo próprio, sem repetição.**
48 cursos (8 idiomas × A1–C2), 648 lições e 3.536 exercícios. Vocabulário e
gramática pertencem a **um** nível: há teste automatizado que quebra se um
termo reaparecer em outro nível. E a dificuldade é real — em A1 o exercício
pede reconhecimento, em C2 pede produção e escolha de registro.

**9. Todo módulo termina em prova de nível.**
Nota, aprovação a partir de 70% e registro de **todas** as tentativas — não só
da melhor. Três reprovações seguidas dizem algo que a melhor nota esconde.

**10. Exercício com armadilha, não com distrator aleatório.**
Cada um dos 144 pontos de gramática carrega o erro que o lusófono realmente
comete. "I have 25 years" não é alternativa aleatória: é a tradução literal de
"tenho 25 anos", e quem cai nela recebe a explicação na hora.

**11. Acesso liberado para todo mundo.**
Sem plano pago, sem cadastro, sem recurso bloqueado. O modelo de planos segue
íntegro no código, atrás de uma única constante — ver `src/domain/access.ts`.

---

## Stack

| Camada | Escolha | Por quê |
|---|---|---|
| App | **Expo SDK 52 + React Native 0.76** | Android, iOS **e web** de uma base só |
| Linguagem | **TypeScript** estrito | Contrato único entre app, domínio e backend |
| Rotas | **Expo Router** | File-based, deep link automático, export web |
| Estado | **Zustand** | Seletores granulares; legível fora de componentes |
| Animação | **Reanimated 3** | Roda na thread de UI — 60fps com o JS ocupado |
| Banco local | **SQLite** (nativo) / IndexedDB (web) | Porta única, dois adaptadores reais |
| Gráficos | **react-native-svg** | Componentes próprios em vez de ~200 KB de lib |
| Lint/format | **Biome** | Binário único sem dependências JS — ver `docs/11` |

Detalhes e alternativas descartadas em [`docs/03-arquitetura.md`](docs/03-arquitetura.md).

---

## Rodando

```bash
npm install --legacy-peer-deps

npm run start       # Expo Dev Server (QR code para o celular)
npm run web         # navegador
npm run android     # requer prebuild + Android SDK
npm run ios         # requer prebuild + Xcode
```

Verificações:

```bash
npm run typecheck   # tsc --noEmit
npm test            # 224 testes
npm run verify:all  # smoke test no Chromium + regressão de dado legado
npm run lint        # biome check
npm run build:web   # export estático em dist/
```

`verify:web` existe porque typecheck, lint e testes unitários **não pegam** erro
de avaliação de bundle nem loop de render — os dois já causaram tela branca em
produção. Ele carrega `dist/` num Chromium real, faz o onboarding inteiro,
visita todas as abas e abre cada tela empilhada. É obrigatório antes de deploy.

---

## Estrutura

```
app/          Rotas (Expo Router)
src/design/   Design system — tokens, tema claro/escuro, 15 componentes
src/domain/   Núcleo puro: SRS, gamificação, plano, correção  ← zero I/O
src/db/       Persistência local: porta + 2 adaptadores + repositórios
src/sync/     Outbox e políticas de merge
src/ai/       Tutor: porta, implementação offline, base de conhecimento
src/content/  Vocabulário, frases e gerador da trilha
docs/         15 documentos: PRD, arquitetura, banco, APIs, lançamento…
```

O domínio não importa nada de fora dele. É por isso que 224 testes rodam em
Node puro, em ~9 s, sem emulador.

---

## Documentação

| # | Documento |
|---|---|
| 1 | [Benchmark e pesquisa](docs/01-benchmark.md) |
| 2 | [PRD](docs/02-prd.md) |
| 3 | [Arquitetura](docs/03-arquitetura.md) |
| 4 | [Fluxo do usuário](docs/04-fluxo-usuario.md) |
| 5 | [Wireframes](docs/05-wireframes.md) |
| 6 | [Design system](docs/06-design-system.md) |
| 7 | [Estrutura de pastas](docs/07-estrutura.md) |
| 8 | [Banco de dados](docs/08-banco-de-dados.md) |
| 9 | [APIs](docs/09-apis.md) |
| 10 | [Plano de desenvolvimento](docs/10-plano-desenvolvimento.md) |
| 11 | [Implementação](docs/11-implementacao.md) |
| 12 | [Testes](docs/12-testes.md) |
| 13 | [Estratégia de lançamento](docs/13-lancamento.md) |
| 14 | [Estratégia de crescimento](docs/14-crescimento.md) |
| 15 | [Melhorias futuras](docs/15-melhorias-futuras.md) |

---

## Estado atual

**Funcionando de ponta a ponta, 100% offline, sem backend:** onboarding,
trilha, 16 tipos de exercício, repetição espaçada, prática por habilidade,
tutor, painel de progresso, vocabulário, downloads, paywall e perfil com
exportação/exclusão de dados (LGPD). Também: apostilas por nível com download e
exportação, módulo de expressões idiomáticas, troca de nível do curso em
andamento, alternância entre os modos Completo e Essencial, provas de nível ao
fim de cada módulo e tutor com ~1.000 itens de contexto por idioma.

**Ainda não implementado** — lista completa e honesta em
[`docs/11-implementacao.md#1109-limitações-conhecidas`](docs/11-implementacao.md):
backend e contas, reconhecimento de voz nativo (Android/iOS), download real de
pacotes por CDN, integração de pagamento e ligas com ranking real.

---

## Web

A build web (`npm run build:web` → `dist/`) publica a landing page e o app
completo como PWA. Configuração de deploy em `vercel.json`.
