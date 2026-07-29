# 1. Pesquisa e benchmark

> Análise dos principais aplicativos de idiomas, o que cada um faz bem, onde
> falha, e o que o Lumo incorpora ou faz diferente.

## 1.1 Panorama competitivo

| App | Força principal | Falha estrutural | O que o Lumo faz |
|---|---|---|---|
| **Duolingo** | Gamificação e retenção sem paralelo. Ofensiva, ligas e missões formam hábito de verdade. | O usuário fica bom **no Duolingo**, não no idioma. Pouca produção livre, quase nada de fala real, conteúdo raso acima de A2. | Mantém o loop de hábito, mas amarra a ofensiva ao *compromisso declarado* e força produção (fala e escrita) desde o módulo 1. |
| **Babbel** | Diálogos úteis, conteúdo bem escrito por linguistas, foco em conversação real. | Progressão linear e rígida; repetição espaçada fraca; sem adaptação ao desempenho. | Conteúdo funcional + SRS de verdade, com fila priorizada por probabilidade de esquecimento. |
| **Memrise** | Vídeos de falantes nativos ("learn with locals") — insubstituível para ouvido real. | SRS impreciso, curadoria irregular, app pesado e lento. | Áudio nativo baixável + SRS que aprende com o desempenho, não com auto-avaliação. |
| **Anki** | O SRS mais respeitado que existe. Controle total. | Curva de aprendizado brutal, sem conteúdo, sem estrutura pedagógica, autoavaliação obrigatória. | O rigor do SRS, com a nota **inferida do desempenho** e um app que ninguém precisa configurar. |
| **Busuu** | Correção por falantes nativos da comunidade. Certificados McGraw-Hill. | Correção depende de haver alguém disponível; feedback demora horas ou dias. | Correção instantânea local + IA, com comunidade como camada extra, não como dependência. |
| **Pimsleur** | Método de áudio com recall espaçado, excelente para pronúncia e para uso "mãos livres". | Zero visual, zero leitura/escrita, caro, catálogo pequeno. | Shadowing e prática de áudio como módulo de primeira classe, dentro de um app completo. |
| **italki / Preply** | Aula com professor humano. Insubstituível para fluência. | Caro (R$ 40–150/h), exige agenda, alta fricção. | Tutor de IA como *ponte* — prática diária ilimitada entre aulas humanas, não substituto delas. |
| **LingQ** | Aprendizado por imersão em texto real, com vocabulário rastreado. | Interface datada, curva de entrada alta, pouco guiado para iniciantes. | Biblioteca de leitura com tradução ao toque e vocabulário integrado ao mesmo SRS. |

## 1.2 As quatro lacunas que o Lumo ataca

### Lacuna 1 — Offline é sempre segunda classe

Todo concorrente trata offline como recurso premium degradado: baixa a lição,
mas o SRS não roda, as estatísticas não contam, o tutor some, a pronúncia não
funciona.

**Por que isso importa no Brasil:** a maior parte do consumo de app acontece em
deslocamento — metrô, ônibus, sala de espera —, com sinal instável e franquia
de dados limitada. Um app de estudo diário que só funciona bem no Wi-Fi perde
exatamente a janela em que o usuário tem tempo livre.

**Decisão do Lumo:** arquitetura **offline-first**, não "modo offline". Toda
interação escreve primeiro no dispositivo; a rede é um detalhe de
sincronização. Correção de exercício, agendamento de SRS, XP, ofensiva,
pronúncia e até o tutor têm caminho local completo. Ver
[`docs/03-arquitetura.md`](03-arquitetura.md).

### Lacuna 2 — O SRS depende de auto-avaliação

Anki, Memrise e derivados perguntam "você lembrou?". Duas consequências
documentadas na literatura de metacognição:

1. **Ilusão de fluência** — reconhecer a resposta é confundido com saber
   produzi-la. O usuário marca "fácil" e o item some por meses.
2. **Otimismo sistemático** — as pessoas superestimam o próprio desempenho, e o
   agendamento derrapa gradualmente até o SRS parar de funcionar sem que
   ninguém perceba.

**Decisão do Lumo:** a nota é **inferida do comportamento** — acertou ou não,
quanto tempo levou, se pediu dica. Uma resposta correta em 1,5s é recuperação
automática (`easy`); a mesma resposta em 15s é recuperação com esforço
(`hard`) e volta antes. Ver `gradeFromPerformance` em `src/domain/srs.ts`.

### Lacuna 3 — Correção genérica para um erro específico

Corretores tratam todo aprendiz como igual. Mas os erros de um brasileiro
aprendendo inglês são **previsíveis e catalogáveis**: "I have 25 years",
"I am agree", "explain me", "actually" no sentido de "atualmente".

**Decisão do Lumo:** base de erros típicos de **lusófonos** por idioma,
embutida no app e aplicada offline, com explicação da regra. Custa zero de
rede e acerta mais que uma análise genérica. Ver `src/ai/knowledge.ts`.

### Lacuna 4 — A ofensiva é frágil demais

A ofensiva é a mecânica de retenção mais poderosa do segmento — e a maior
causa de abandono **definitivo**. Perder 200 dias por uma viagem ou uma gripe
não gera "vou recomeçar"; gera desinstalação.

**Decisão do Lumo:** congelamentos automáticos conquistados a cada 10 dias, a
ofensiva conta apenas nos dias que o usuário declarou no onboarding, e o merge
de sincronização é monotônico (dois aparelhos nunca derrubam a sequência).
Ver `updateStreak` em `src/domain/gamification.ts`.

## 1.3 O que copiamos sem cerimônia

Nem tudo precisa ser reinventado. Estas mecânicas são comprovadamente boas:

- **Ofensiva + meta diária** (Duolingo) — o loop de hábito mais eficaz já
  desenhado para educação.
- **Vidas por sessão** (Duolingo) — dá consequência ao erro sem punir, e é o
  gatilho de conversão mais honesto do segmento.
- **Diálogos funcionais** (Babbel) — conteúdo que o usuário usa na semana
  seguinte, não frases artificiais de livro didático.
- **Ligas semanais em grupos pequenos** (Duolingo) — competição com pares, não
  com um ranking global impossível.
- **Tradução ao toque na leitura** (LingQ) — remove a fricção que faz o
  iniciante desistir de ler texto real.
- **Shadowing** (Pimsleur, Glossika) — o exercício com melhor retorno por
  minuto para prosódia e ritmo.

## 1.4 Fundamentos de aquisição de segunda língua aplicados

Decisões de produto ancoradas em pesquisa, não em intuição:

| Princípio | Implicação no produto | Onde está no código |
|---|---|---|
| **Efeito de espaçamento** (Ebbinghaus, Cepeda et al.) | Revisão agendada na curva de esquecimento, não em intervalo fixo. | `src/domain/srs.ts` |
| **Recuperação ativa** (Roediger & Karpicke) | Produzir antes de reconhecer sempre que possível; testar em vez de reapresentar. | Ordem dos exercícios em `src/content/courses.ts` |
| **Prática intercalada** (Rohrer & Taylor) | Itens novos distribuídos entre revisões, não agrupados. | `buildReviewQueue`, opção `interleave` |
| **Frequência lexical** (Nation) | 1.000 palavras ≈ 80% de um texto; 3.000 ≈ 95% da fala. Ensinar por frequência, não por tema. | `src/content/vocabulary.ts` |
| **Hipótese do output** (Swain) | Produção forçada gera aprendizado que o input sozinho não gera. | Exercícios de fala e escrita desde o módulo 1 |
| **Input compreensível i+1** (Krashen) | Conteúdo levemente acima do nível atual. | Dificuldade adaptativa e nível CEFR resolvido no onboarding |
| **Filtro afetivo** (Krashen) | Ansiedade bloqueia aquisição — daí erro sem punição na revisão e tolerância a erro de digitação. | `matchAnswer`, sessão de revisão sem vidas |

## 1.5 Posicionamento

> **Duolingo forma o hábito. Babbel ensina o conteúdo. Anki fixa a memória.
> O Lumo faz os três, funcionando no metrô.**

O concorrente real não é nenhum app da lista — é o **abandono no dia 14**. Toda
decisão do produto é avaliada por uma pergunta: *isso aumenta a chance de o
usuário abrir o app amanhã e sentir que avançou?*
