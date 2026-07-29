# 12. Testes

## 12.1 Estratégia

A pirâmide aqui é deliberadamente **pesada na base**, e isso é consequência
direta da arquitetura: como o domínio é puro e não importa nada de
infraestrutura, 169 testes rodam em Node em 4,5 segundos, sem emulador, sem
mock de React Native e sem banco.

```
        ╱╲          E2E (Detox/Maestro) — Fase 3
       ╱──╲         fluxos críticos em dispositivo real
      ╱────╲
     ╱ Integ ╲      Repositórios contra WebDocumentStore
    ╱────────╲
   ╱  Unidade  ╲    Domínio puro: SRS, XP, plano, correção, merge
  ╱────────────╲    ◄── 169 testes, 4,5 s
```

**O que priorizamos testar:** o código onde um bug é **silencioso e caro**.
Um botão desalinhado é visível na primeira execução; um SRS que agenda errado
destrói a memória do usuário ao longo de meses sem que ninguém perceba.

## 12.2 Suítes atuais

| Suíte | Testes | Cobre |
|---|---:|---|
| `domain/__tests__/srs.test.ts` | 32 | Agendamento, graduação, lapsos, dispersão, fila, previsão, retenção |
| `domain/__tests__/gamification.test.ts` | 33 | XP, anti-farm, curva de níveis, ofensiva, congelamentos, ligas |
| `domain/__tests__/grading.test.ts` | 36 | Normalização, Levenshtein, tolerância, pronúncia, 16 tipos de exercício |
| `domain/__tests__/plan.test.ts` | 25 | Metas, pesos por objetivo, nivelamento, orçamento de tempo, projeções |
| `db/__tests__/store.test.ts` | 22 | Filtros, ordenação, paginação, transações, rollback |
| `sync/__tests__/merge.test.ts` | 21 | Convergência, idempotência, monotonicidade das 3 políticas |
| **Total** | **169** | |

```
Test Suites: 6 passed, 6 total
Tests:       169 passed, 169 total
Time:        4.5 s
```

## 12.3 Testar propriedades, não valores

A maior parte dos testes verifica **invariantes**, que sobrevivem a
recalibrações do algoritmo. Um teste que fixa "o intervalo é 8,3 dias" quebra
na primeira melhoria do SRS e vira ruído; um teste que fixa "acertar nunca
encurta o intervalo" continua valendo para sempre.

Exemplos de invariantes travados:

- **SRS** — a curva de nível é monotônica; "fácil" > "bom" > "difícil"; o
  fator de facilidade respeita o piso após 20 erros seguidos; a dispersão fica
  em ±5% para qualquer semente.
- **Ofensiva** — `updateStreak` é idempotente (a sincronização reprocessa o
  mesmo dia); nunca quebra por relógio atrasado; o recorde jamais regride.
- **XP** — existe teto por sessão; 500 exercícios difíceis não estouram o
  limite (trava anti-farm).
- **Plano** — para **todos** os compromissos (5 a 60 min), a soma dos blocos
  cabe no tempo prometido; a revisão nunca passa de 60% do dia.
- **Merge** — `merge(a, b)` e `merge(b, a)` convergem; reaplicar o merge não
  altera o resultado; nenhum estado regride.
- **Store** — transação que lança restaura o estado exatamente como estava.

## 12.4 Dois bugs reais encontrados pelos testes

Vale registrar, porque justificam o investimento:

**1. Dispersão de intervalo negativa (`src/domain/srs.ts`)**
O `%` do JavaScript preserva o sinal do dividendo. Com `hash` negativo,
`((hash % 1000) / 1000) * 2 - 1` caía em `[-3, 1]` em vez de `[-1, 1]`, e um
intervalo de 100 dias podia virar 86. Efeito: intervalos silenciosamente
encurtados para uma parcela dos itens, aumentando a carga de revisão sem
motivo. Corrigido com `Math.abs`.

**2. Acoplamento indevido no módulo de sync**
As funções puras de merge viviam no mesmo arquivo que importa o repositório e,
por transitividade, React Native. O teste não conseguia importá-las em Node.
Em vez de mockar, extraímos `src/sync/merge.ts` — o teste apontou um problema
real de desenho, não uma inconveniência.

## 12.5 Verificações automáticas

```bash
npm run typecheck   # tsc --noEmit, modo estrito
npm test            # jest
npm run lint        # biome check (lint + formatação + ordem de imports)
npm run build:web   # expo export --platform web
```

Estado atual: typecheck limpo, Biome sem nenhuma ocorrência em 75 arquivos,
169 testes verdes e build web gerando `dist/` com sucesso.

## 12.6 Lacunas de teste conhecidas

Assumidas conscientemente para esta fase:

| Lacuna | Por que ainda não | Quando |
|---|---|---|
| Testes de componente (React Testing Library) | O valor está mais na lógica; a UI ainda muda muito | Fase 2 |
| E2E em dispositivo | Exige build nativo | Fase 3 |
| `SqliteDocumentStore` em dispositivo | Precisa de emulador; o contrato está travado pelos testes do adaptador web | Fase 1 |
| Testes de carga do backend | Não há backend | Fase 1 |
| Testes visuais de regressão | Depende de design estabilizado | Fase 4 |

## 12.7 Plano de QA manual

Roteiro obrigatório antes de cada release:

1. **Modo avião do início ao fim** — onboarding, lição, revisão, tutor,
   estatísticas. Nada pode falhar ou mostrar erro de rede.
2. **Convergência entre dois aparelhos** — estudar offline em ambos, religar,
   confirmar que XP, ofensiva e SRS convergem sem perda.
3. **Virada de dia** — usar às 23h55 e às 00h05; a ofensiva precisa contar no
   dia local correto.
4. **Fonte ampliada em 1,6×** — nenhum exercício pode quebrar.
5. **Leitor de tela** — percorrer uma lição inteira só com VoiceOver/TalkBack.
6. **Aparelho de entrada** (Android Go, 2 GB RAM) — abertura < 2,5 s e
   rolagem fluida no vocabulário.
7. **Bateria** — sessão de 15 min deve consumir < 3%.
