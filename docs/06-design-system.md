# 6. Design System — Lumo

Implementação em [`src/design/`](../src/design). Este documento explica as
decisões; o código é a fonte de verdade.

---

## 6.1 Identidade

**Nome:** **Lumo**
Do latim *lumen* — luz. Curto, pronunciável em qualquer um dos idiomas
ensinados, sem significado indesejado, e memorável em uma leitura.

**Slogan:** *Fluência, um dia de cada vez.*
Diz o benefício (fluência) e o método (constância) em cinco palavras. Não
promete "aprenda inglês em 30 dias" — promessa que o produto não pode cumprir
e que destrói retenção quando não acontece.

**Conceito visual:** luz que se acende gradualmente. Cada sessão ilumina um
pouco mais o idioma. Daí a primária fria e focada (Iris) contrastando com o
acento quente de recompensa (Ember).

**Personalidade:** preciso sem ser frio · encorajador sem ser infantil ·
denso em informação sem ser poluído.

**Voz:** segunda pessoa, direta, sem jargão. Erros nunca são repreendidos
("Não foi dessa vez", nunca "Errado!"). Números são sempre honestos.

## 6.2 Paleta

Escalas cruas em `tokens.ts`; a UI consome apenas tokens **semânticos** de
`theme.ts`. Nenhum componente escreve `#4F46E5`.

| Escala | Papel | Base |
|---|---|---|
| **Iris** | Primária — confiança e foco | `#4F46E5` (600) |
| **Ember** | Ofensiva, XP, recompensa | `#F59E0B` (500) |
| **Mint** | Acerto, progresso, saúde | `#10B981` (500) |
| **Coral** | Erro — sinaliza, não repreende | `#EF4444` (500) |
| **Sky** | Informação, escuta, dicas | `#0EA5E9` (500) |
| **Violet** | Premium, exclusivo | `#A855F7` (500) |
| **Ink** | Neutros com viés azul | `#FFFFFF` → `#0B0C12` |

**Por que Iris e não verde:** o verde é território do Duolingo. Iris comunica
foco e sofisticação, combina com o acento quente e é distinguível por
daltônicos do vermelho de erro.

**Por que neutros frios:** um cinza puro parece sujo ao lado do Iris. O viés
azul faz a interface inteira parecer intencional.

### Modo escuro

Não é inversão. Duas regras deliberadas:

1. O fundo é `#0B0C12` (quase preto com viés azul), não `#000`, para que
   superfícies elevadas possam ser *mais claras* e criar hierarquia real.
2. A primária desloca para Iris 400 — o 600 não passa em contraste sobre
   fundo escuro.

## 6.3 Tipografia

**Estratégia: system-first.** SF Pro no iOS, Roboto no Android, stack nativa
na web. Nenhuma webfont.

Motivos: zero bytes baixados e zero flash de texto invisível (o app abre mais
rápido, o que importa mais que uma fonte "de marca" num app diário); herda o
ajuste de tamanho de acessibilidade do sistema; e é o que a Apple faz.
Tipografia impecável aqui significa **escala, ritmo e tracking corretos** — não
uma fonte exótica. A personalidade vem da cor, do espaço e do movimento.

| Variante | Tamanho/Entrelinha | Peso | Tracking | Uso |
|---|---|---|---|---|
| `display` | 40 / 46 | 800 | −1,0 | Hero, marca |
| `title1` | 30 / 36 | 700 | −0,6 | Título de tela |
| `title2` | 24 / 30 | 700 | −0,4 | Seção |
| `title3` | 20 / 26 | 600 | −0,3 | Card |
| `headline` | 17 / 23 | 600 | −0,2 | Ênfase |
| `body` | 17 / 25 | 400 | −0,1 | Texto corrido |
| `callout` | 16 / 22 | 400 | −0,1 | Secundário |
| `subhead` | 15 / 20 | 500 | 0 | Rótulos |
| `footnote` | 13 / 18 | 400 | +0,1 | Apoio |
| `caption` | 12 / 16 | 500 | +0,2 | Meta |
| `overline` | 11 / 14 | 700 | +0,8 | Cabeçalho de seção |
| **`target`** | 26 / 36 | 600 | −0,3 | **Frase no idioma-alvo** |
| **`metric`** | 32 / 36 | 800 | −0,8 | **Números de destaque** |

Regra de tracking: tamanhos grandes recebem tracking negativo (as letras
"abrem" ao crescer); tamanhos pequenos recebem positivo. É a regra que faz uma
tela parecer desenhada em vez de montada.

## 6.4 Espaçamento, raios e elevação

- **Espaçamento:** escala de 4pt, nomes numéricos (`space[4] = 16`). A
  densidade de qualquer tela é legível no código.
- **Raios:** 6 · 8 · 12 · 16 · 20 · 28 · 36 · pill.
- **Elevação:** 5 níveis, todos sutis. Profundidade no Lumo vem de cor de
  superfície e espaçamento; a sombra só separa camadas que realmente flutuam
  (modais, barras fixas). No escuro, a sombra some contra o fundo e uma borda
  sutil assume o papel.

## 6.5 Movimento

Nada acima de **320 ms** num caminho crítico.

| Token | Duração | Uso |
|---|---|---|
| `instant` | 90 ms | Pressão, toggle |
| `fast` | 160 ms | Estado |
| `normal` | 240 ms | Entrada de conteúdo |
| `slow` | 320 ms | Transição de tela |
| `celebrate` | 620 ms | Só conclusão |

Toda animação de interação roda na **thread de UI** (Reanimated). A resposta ao
toque não trava nem quando a thread JS está ocupada corrigindo um exercício —
é essa escolha que sustenta a promessa de 60fps.

## 6.6 Layout mobile-first

| Token | Valor | Razão |
|---|---|---|
| `maxContentWidth` | 560 | Linha legível; evita linhas de 1200px em tablet/web |
| `screenPadding` | 20 | Respiro horizontal padrão |
| `minTouchTarget` | 44 | Piso absoluto (diretriz Apple) |
| `primaryTouchTarget` | 48 | Controles primários |
| `thumbZoneStart` | 0,62 | Ações primárias abaixo desta fração da altura |

## 6.7 Biblioteca de componentes

Superfície pública em `src/design/components/index.ts`. Telas nunca importam
arquivos internos.

| Componente | Papel | Nota de design |
|---|---|---|
| `Text` | Toda tipografia | Nenhum `fontSize` solto entra no código; limita o ajuste de acessibilidade a 1,6× |
| `Touchable` | Toda área tocável | Escala de pressão + háptico + alvo mínimo, consistentes |
| `Button` | 5 variantes × 3 tamanhos | Só a primária tem sombra — é a única que deve flutuar |
| `Card` | flat/raised/outlined/subtle | `raised` ganha borda no escuro |
| `Screen` | Container de rota | Resolve safe area, largura máxima e zona do polegar num lugar só |
| `ProgressBar` / `ProgressRing` | Progresso animado | Transicionam do valor anterior; nunca "pulam" |
| `SegmentedProgress` | Barra da lição | Comunica quantos **faltam**, não uma % abstrata |
| `Badge` / `Chip` | Metadados e seleção | Seleção por borda + fundo, nunca só cor |
| `OptionCard` | Escolha do onboarding | Alvo generoso; seleção óbvia sob sol e para daltônicos |
| `SegmentedControl` | Alternância | Padrão de plataforma |
| `ListRow` / `Divider` | Listas de config | — |
| `EmptyState` | Vazio | Sempre com uma saída acionável |
| `Skeleton` | Carregando | Raro num app offline-first; existe para downloads |

**Ícones:** Ionicons (via `@expo/vector-icons`) — família única, dois pesos
(outline para inativo, filled para ativo), presente nas três plataformas.

## 6.8 Acessibilidade

- Contraste AA em todos os pares de texto, nos dois temas.
- `accessibilityRole`, `accessibilityLabel` e `accessibilityState` em todo
  controle interativo.
- Gráficos SVG expõem resumo textual (leitor de tela não enxerga SVG).
- Estado nunca é comunicado só por cor: acerto tem ✓ + verde, erro tem ✕ +
  vermelho.
- Alvos de 44pt no mínimo, com `hitSlop` para ícones pequenos.
- Suporte a fonte ampliada até 1,6× sem quebrar layout de exercício.
