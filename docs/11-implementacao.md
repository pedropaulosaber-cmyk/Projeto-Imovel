# 11. Implementação

O que foi construído, onde está, e as decisões técnicas por trás.

---

## 11.1 Panorama

| Camada | Arquivos | O que faz |
|---|---|---|
| Rotas | 15 | Onboarding, 5 abas, lição, revisão, prática, vocabulário, downloads, paywall |
| Design system | 9 | Tokens, tema, provider, 15 componentes |
| Domínio | 5 + 4 suítes | SRS, gamificação, plano, correção, tipos |
| Dados | 7 + 1 suíte | Porta, 2 adaptadores, 3 repositórios, coleções |
| Sync | 3 + 1 suíte | Merge puro, motor, ciclo de vida |
| IA | 3 | Porta, tutor offline, base de conhecimento |
| Conteúdo | 4 | Léxico, frases, gerador de trilha, semente |
| Features | 4 | Exercícios, fala, gráficos, landing |
| Estado | 3 | App, lição, onboarding |

**Verificação:** `tsc --noEmit` limpo em 61 arquivos · 169 testes passando ·
`expo export --platform web` gerando `dist/`.

---

## 11.2 Motor de repetição espaçada

`src/domain/srs.ts` — SM-2 estendido com dois conceitos do FSRS:

- **Estabilidade** (dias até a recordação cair a ~90%) guardada explicitamente,
  o que permite calcular retenção prevista a qualquer momento e mostrar "força
  da memória" ao usuário.
- **Dificuldade por item**, aprendida por média móvel com peso baixo (0,2) —
  uma revisão ruim isolada não marca o item para sempre.

**Por que não FSRS completo:** o FSRS depende de 17 pesos otimizados sobre
milhões de revisões agregadas. Sem essa base, os pesos padrão não superam um
SM-2 bem afinado, e o custo é um modelo impossível de explicar ao usuário ou
depurar. A troca está pronta: `schedule()` é a única função a mudar.

**A inovação principal** é `gradeFromPerformance()`: a nota sai do
comportamento, não de auto-avaliação. Acertar em 1,5 s é `easy`; a mesma
resposta em 15 s é `hard` e volta antes. É onde o SRS dos concorrentes
silenciosamente para de funcionar.

**Dispersão determinística:** o `fuzz` de ±5% vem de um hash do id, não de
`Math.random`. Dois dispositivos offline reagendando o mesmo item chegam ao
mesmo resultado — requisito de convergência. *(Um teste pegou um bug real
aqui: `hash % 1000` em JavaScript preserva o sinal do dividendo, e sem
`Math.abs` a dispersão chegava a −15%, encurtando intervalos silenciosamente.)*

---

## 11.3 Correção offline

`src/domain/grading.ts` — 16 tipos corrigidos localmente em menos de 1 ms.

A parte delicada é a **tolerância**:

- Normalização remove acento, caixa e pontuação, mas **preserva apóstrofos
  internos** (`l'école`, `don't`) porque fazem parte da palavra.
- Erro de digitação é aceito com tolerância proporcional: 1 caractere em
  palavras curtas, até 15% em frases. A resposta conta como correta, mas a
  forma certa é exibida — o usuário aprende sem ser punido por um dedo torto.
- Pronúncia é pontuada palavra a palavra com janela deslizante, tolerando
  inserções e omissões do reconhecedor.

O `switch` sobre `Exercise['type']` é **exaustivo sem `default`**: adicionar um
tipo novo quebra a compilação até que a correção seja implementada.

---

## 11.4 Camada de dados

**A porta `DocumentStore`** abstrai no nível de coleções com campos indexados,
não de SQL. Isso permite dois adaptadores reais:

- `SqliteDocumentStore` — tabelas com colunas tipadas + índices + JSON;
  PRAGMAs de WAL e I/O reduzido; escrita em lote em transação única (semear 500
  registros passa de segundos para milissegundos).
- `WebDocumentStore` — índices em memória + persistência debounced. Transação
  com snapshot-and-rollback: sem SQLite não há transação nativa, então copiamos
  o estado antes do bloco e restauramos em caso de erro. É O(n) na memória, mas
  as transações do app são pequenas e a atomicidade vale mais.

**Ids determinísticos** (`deterministicId(userId, lessonId)`) fazem o mesmo
registro lógico ter o mesmo id em qualquer dispositivo. É o que transforma
merge em upsert.

**ULID em vez de UUIDv4** para ids gerados: o prefixo de timestamp torna os ids
monotonicamente ordenáveis, então inserções caem sempre no fim do índice B-tree
em vez de espalhadas — menos páginas tocadas, menos I/O, menos bateria.

---

## 11.5 Sincronização

`src/sync/merge.ts` (puro) + `src/sync/engine.ts` (orquestração).

A separação é deliberada e foi **imposta por um teste**: as funções de merge
precisavam ser testáveis sem React Native no caminho de import. Isso melhorou o
desenho — a lógica que pode apagar estudo do usuário agora vive isolada, com 21
testes de convergência.

Detalhes de implementação que importam:

- **Coalescência da outbox** por `(entidade, id)`: uma sessão de 80 revisões
  gera 1 operação de estatística diária, não 80.
- **Push antes de pull**: as mutações locais são a verdade mais recente;
  enviá-las primeiro evita que um pull sobrescreva trabalho não sincronizado.
- **Reentrância bloqueada**: dois ciclos simultâneos enviariam o mesmo lote
  duas vezes.
- **Descarte após 10 falhas**: uma operação que o servidor nunca aceitará não
  pode bloquear a fila para sempre.
- **Intervalo de 5 min**, não 30 s: num app cuja verdade está no dispositivo,
  sincronizar com frequência só gasta rádio. O que importa é sincronizar ao
  abrir, ao voltar do background e ao fim da sessão.

---

## 11.6 Camada de IA

`ResilientAiProvider` compõe remoto + offline. Qualquer falha cai para o local
sem o usuário perceber.

O **tutor offline** não é um chatbot degradado — é um tutor de conversa
guiada. Um modelo de linguagem no dispositivo seria pesado demais para um app
que precisa abrir em segundos. Em vez disso ele usa o que a didática já sabe:
iniciante não precisa de conversa aberta, precisa de prática de padrões com
correção imediata. Entrega cenários roteirizados, correção por regra e
explicação gramatical — offline, em 5 idiomas.

O **catálogo de erros de lusófonos** (`src/ai/knowledge.ts`) é o diferencial
mais barato do produto: pegar "I have 25 years" offline vale mais, para um
brasileiro, que uma análise sofisticada que só funciona com 4G.

---

## 11.7 Geração de conteúdo

A estrutura pedagógica é **uma só** (módulos, progressão, tipos de exercício,
ordem de introdução); cada idioma fornece apenas seus dados: vocabulário por
frequência e frases curadas por tema.

Adicionar japonês = adicionar duas listas. A trilha inteira nasce pronta e
consistente com as outras.

A ordem dentro da lição segue a dificuldade de recuperação de memória:
**reconhecer → completar → produzir**. Pedir produção livre antes de
reconhecimento gera frustração; pedir só reconhecimento gera a ilusão de saber.

---

## 11.8 Desempenho na prática

| Decisão | Efeito |
|---|---|
| Animação de toque em Reanimated (thread de UI) | 60fps mesmo com o JS ocupado corrigindo |
| Fontes do sistema | Zero byte de webfont, zero flash de texto invisível |
| Gráficos SVG próprios | Evita ~200 KB de biblioteca de charting |
| `FlatList` com janelas ajustadas | Vocabulário de milhares de itens rola liso |
| Seletores Zustand nomeados | XP muda sem re-renderizar a trilha |
| Semeadura versionada | Zero I/O de conteúdo nas aberturas seguintes |
| Correção síncrona e local | Feedback no mesmo frame do toque |

---

## 11.9 Limitações conhecidas

Explícitas, porque um relatório honesto vale mais que um verde falso:

1. **Reconhecimento de voz nativo** — implementado via Web Speech API na web;
   Android e iOS usam `NullSpeechRecognizer` e caem no modo de autoavaliação
   guiada. A integração nativa está na Fase 3 e exige `expo prebuild`.
2. **Download real de pacotes** — a tela de downloads é funcional (modelo de
   dados, progresso, remoção, espaço ocupado), mas o download em si é simulado
   porque não há CDN configurada. Trocar por `expo-file-system` é uma função.
3. **Backend** — o transporte de sync é `OfflineOnlyTransport`. A fila enche
   corretamente e será drenada quando o transporte real for injetado.
4. **Cobertura de conteúdo** — a semente cobre A1 nos 5 idiomas (~30–40 termos
   e 18 frases por idioma). Produção exige o trabalho editorial da Fase 4.
5. **Pagamento** — o paywall está completo como interface; a integração com
   as lojas é da Fase 3.
6. **Comunidade e ligas** — a interface de liga mostra o estado local; o
   ranking real depende do backend.

---

## 11.10 Como rodar

```bash
npm install --legacy-peer-deps

npm run start        # Expo Dev Server (QR code para o celular)
npm run web          # navegador
npm run android      # requer prebuild + Android SDK
npm run ios          # requer prebuild + Xcode

npm run typecheck    # tsc --noEmit
npm test             # 169 testes
npm run lint         # biome check
npm run format       # biome format --write
npm run build:web    # export estático em dist/
```

> **Por que Biome em vez de ESLint.** O ESLint (v8 e v9) depende de `ajv@6`,
> enquanto `schema-utils` — dependência transitiva do plugin do Expo Router —
> exige `ajv@8`. Com as duas no mesmo `node_modules`, ou o lint quebrava
> (`Cannot set properties of undefined`) ou o bundler web quebrava
> (`Cannot find module 'ajv/dist/compile/codegen'`), e o `overrides` do npm não
> consegue aninhar as duas versões de forma confiável. O Biome é um binário
> único sem dependências JS: elimina o conflito na raiz, roda o projeto inteiro
> em ~100 ms e ainda cobre formatação. A migração não foi cosmética — foi a
> forma de ter build e lint verdes ao mesmo tempo.
