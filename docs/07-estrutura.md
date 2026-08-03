# 7. Estrutura de pastas

```
lumo/
├── app/                                # Rotas (Expo Router — file-based)
│   ├── _layout.tsx                     # Raiz: providers + bootstrap offline
│   ├── index.tsx                       # Gate: landing / onboarding / app
│   ├── (onboarding)/
│   │   ├── _layout.tsx
│   │   ├── welcome.tsx                 # Uma promessa, um botão
│   │   ├── setup.tsx                   # Assistente de 6 etapas
│   │   └── plan.tsx                    # Plano gerado + projeções
│   ├── (tabs)/
│   │   ├── _layout.tsx                 # 5 abas + badge de revisões
│   │   ├── learn.tsx                   # Plano do dia + trilha
│   │   ├── practice.tsx                # SRS + habilidades + vocabulário
│   │   ├── tutor.tsx                   # Conversa com IA
│   │   ├── progress.tsx                # Painel com gráficos
│   │   └── profile.tsx                 # Perfil, config e LGPD
│   ├── lesson/[id].tsx                 # Executor de lição
│   ├── practice/[mode].tsx             # Prática por habilidade
│   ├── review.tsx                      # Sessão de repetição espaçada
│   ├── vocabulary.tsx                  # Banco de palavras
│   ├── idioms.tsx                      # Expressões idiomáticas
│   ├── workbooks.tsx                   # Biblioteca de apostilas
│   ├── workbook/[id].tsx               # Leitor de apostila
│   ├── level.tsx                       # Trocar o nível do curso
│   ├── learning-mode.tsx               # Completo × Essencial
│   ├── downloads.tsx                   # Conteúdo offline
│   └── paywall.tsx                     # Assinatura
│
├── src/
│   ├── design/                         # DESIGN SYSTEM
│   │   ├── tokens.ts                   # Cor, espaço, tipo, movimento, layout
│   │   ├── theme.ts                    # Tokens semânticos claro/escuro
│   │   ├── ThemeProvider.tsx           # Provider + useTheme
│   │   ├── components/
│   │   │   ├── Text.tsx
│   │   │   ├── Pressable.tsx           # Touchable com microinteração
│   │   │   ├── Button.tsx
│   │   │   ├── Surface.tsx             # Card · Screen · Divider · Skeleton
│   │   │   ├── Progress.tsx            # Bar · Ring · Segmented · Metric
│   │   │   ├── Feedback.tsx            # Badge · Chip · OptionCard · ...
│   │   │   └── index.ts                # Superfície pública
│   │   └── index.ts
│   │
│   ├── domain/                         # NÚCLEO — funções puras, zero I/O
│   │   ├── types.ts                    # Contrato compartilhado
│   │   ├── srs.ts                      # Repetição espaçada
│   │   ├── gamification.ts             # XP · níveis · ofensiva · ligas
│   │   ├── plan.ts                     # Plano adaptativo
│   │   ├── learning-mode.ts            # Regras do Completo × Essencial
│   │   ├── grading.ts                  # Correção offline
│   │   └── __tests__/                  # 5 suítes
│   │
│   ├── db/                             # PERSISTÊNCIA LOCAL
│   │   ├── store.ts                    # Porta DocumentStore
│   │   ├── collections.ts              # Coleções e campos indexados
│   │   ├── index.ts                    # Abertura + fallback
│   │   ├── adapters/
│   │   │   ├── sqlite.ts               # Android/iOS
│   │   │   └── web.ts                  # Web · testes · fallback
│   │   ├── repositories/
│   │   │   ├── content.ts              # Cursos, lições, exercícios (leitura)
│   │   │   ├── library.ts              # Apostilas, downloads e expressões
│   │   │   ├── learner.ts              # Perfil, progresso, SRS, stats
│   │   │   └── sync.ts                 # Outbox
│   │   └── __tests__/
│   │
│   ├── sync/                           # SINCRONIZAÇÃO
│   │   ├── merge.ts                    # Políticas puras (testáveis)
│   │   ├── engine.ts                   # Orquestração + transporte
│   │   ├── useSyncBootstrap.ts         # Ciclo de vida
│   │   └── __tests__/
│   │
│   ├── ai/                             # CAMADA DE IA
│   │   ├── provider.ts                 # Porta + remoto + resiliente
│   │   ├── offline-tutor.ts            # Implementação sem rede
│   │   └── knowledge.ts                # Erros de lusófonos · regras · cenários
│   │
│   ├── content/                        # CONTEÚDO
│   │   ├── vocabulary.ts               # Léxico por frequência
│   │   ├── vocabulary-extra/           # Lotes de ampliação, por tema
│   │   ├── phrases.ts                  # Frases curadas por tema
│   │   ├── idioms.ts                   # Expressões idiomáticas
│   │   ├── workbooks.ts                # Gerador das 30 apostilas
│   │   ├── courses.ts                  # Gerador da trilha
│   │   └── seed.ts                     # Semeadura idempotente
│   │
│   ├── features/                       # FEATURES COMPOSTAS
│   │   ├── exercises/
│   │   │   ├── ExerciseRenderer.tsx    # Despacho por tipo
│   │   │   └── SpeakExercise.tsx       # Fala e shadowing
│   │   ├── progress/Charts.tsx         # Barras · linha · mapa de calor
│   │   └── marketing/Landing.tsx       # Vitrine web
│   │
│   ├── services/
│   │   └── speech.ts                   # TTS e reconhecimento de voz
│   │
│   ├── state/                          # ESTADO GLOBAL (Zustand)
│   │   ├── app-store.ts                # Sessão, perfil, plano, stats
│   │   ├── lesson-store.ts             # Sessão de lição
│   │   └── onboarding-store.ts         # Rascunho do onboarding
│   │
│   └── lib/
│       ├── id.ts                       # ULID + ids determinísticos
│       └── date.ts                     # Datas locais e formatação
│
├── docs/                               # 15 documentos
├── app.json                            # Config Expo (Android/iOS/web)
├── vercel.json                         # Build web → dist/
├── babel.config.js                     # Preset Expo + Reanimated
└── package.json
```

## Princípios de organização

**1. Por camada, não por feature.** O núcleo (`domain/`) precisa ser
importável sem arrastar UI ou banco junto — é o que permite 181 testes rodarem
em Node puro, sem emulador. Uma organização por feature acopla domínio e
apresentação e mata essa propriedade.

**2. Rotas são finas.** Um arquivo em `app/` orquestra e compõe; a lógica mora
em `domain/` ou `features/`. Se uma rota passa de ~400 linhas, há lógica
vazando para a camada errada.

**3. Superfície pública explícita.** `design/components/index.ts` e
`db/index.ts` são as fronteiras. Importar arquivo interno de outra camada é o
sinal de que o desenho quebrou.

**4. Testes ao lado do código.** `__tests__/` dentro da pasta testada, não numa
árvore paralela — quem mexe no SRS vê o teste do SRS.

**5. Conteúdo é dado, não código.** `content/` guarda listas; a estrutura
pedagógica é uma só e vale para todos os idiomas. Adicionar um idioma é
adicionar duas listas — e as 30 apostilas saem das *mesmas* fontes que as
lições, justamente para que nunca divirjam do que é ensinado.
