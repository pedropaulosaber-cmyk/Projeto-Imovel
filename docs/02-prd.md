# 2. PRD — Documento de Requisitos do Produto

**Produto:** Lumo
**Slogan:** Fluência, um dia de cada vez.
**Versão:** 1.0
**Plataformas:** Android, iOS (nativos) e web (PWA)

---

## 2.1 Visão

Levar uma pessoa do zero à conversação real em um idioma estrangeiro, com
sessões curtas e diárias que funcionam **em qualquer lugar, com ou sem
internet**.

## 2.2 Problema

Quem estuda idioma sozinho falha por quatro motivos, nesta ordem de frequência:

1. **Perde o hábito** — sem estrutura e sem retorno visível, o estudo some da
   rotina em duas semanas.
2. **Esquece o que aprendeu** — sem revisão espaçada, ~70% do vocabulário novo
   evapora em 30 dias.
3. **Não fala** — reconhece e traduz, mas trava numa conversa real, porque
   nunca produziu output sob pressão.
4. **Estuda no lugar errado** — a janela livre (transporte, fila, espera) é
   justamente onde a conexão falha.

## 2.3 Público-alvo

| Segmento | % estimado | Necessidade dominante |
|---|---|---|
| Profissional 25–40 anos | 40% | Inglês para trabalho; 10–15 min/dia; usa no deslocamento |
| Estudante 16–24 anos | 25% | Provas e intercâmbio; sensível a preço; mobile-only |
| Viajante 30–55 anos | 20% | Sobrevivência funcional antes de uma viagem específica |
| Hobbista 25–60 anos | 15% | Cultura, filmes, música; motivação intrínseca |

Mercado inicial: **Brasil** (interface e explicações em português; conteúdo
calibrado para erros de lusófonos). Expansão prevista para hispanofalantes.

## 2.4 Objetivos e métricas de sucesso

| Objetivo | Métrica | Meta 6 meses |
|---|---|---|
| Formar hábito | D7 / D30 de retenção | 42% / 22% |
| Gerar aprendizado real | Palavras dominadas por usuário ativo em 90 dias | ≥ 300 |
| Provar o offline | % de sessões iniciadas sem rede | ≥ 25% |
| Monetizar | Conversão free → premium | 5,5% |
| Sustentar | Churn mensal de assinantes | < 6% |
| Qualidade percebida | Nota nas lojas | ≥ 4,6 |

**Métrica-norte:** *usuários que completaram ≥ 5 dias de meta em 7 dias
corridos.* Ela captura hábito e aprendizado ao mesmo tempo, e não pode ser
inflada por engajamento vazio.

## 2.5 Requisitos funcionais

### RF-01 — Onboarding personalizado (P0)
Coleta idioma, objetivo (até 3), nível, minutos/dia, dias da semana e horário
de lembrete. Gera plano com projeções conservadoras. **Sem exigir cadastro.**
- Critério de aceite: perfil criado e primeira lição acessível em ≤ 2 min,
  totalmente offline.

### RF-02 — Trilha de aprendizado (P0)
Cursos por nível CEFR → módulos temáticos → lições com pré-requisitos.
Checkpoint ao fim de cada módulo, projeto ao fim do curso.
- Critério: lição só desbloqueia com a anterior concluída; estado persiste
  após fechar o app.

### RF-03 — Motor de exercícios (P0)
16 tipos implementados: escolha múltipla, tradução, ouça e escreva, complete a
frase, banco de palavras, ligar pares, pronúncia, shadowing, ditado, descrever
imagem, corrigir frase, ordenar diálogo, escutar e responder, interpretação de
texto, conversa e flashcard.
- Critério: correção 100% local, feedback em ≤ 100 ms, tolerância a erro de
  digitação e a diferença de acento.

### RF-04 — Repetição espaçada (P0)
SM-2 estendido com estabilidade e dificuldade por item. Nota inferida do
desempenho. Fila priorizada por probabilidade de esquecimento, com
intercalação e tetos diários.
- Critério: agendamento determinístico e idêntico entre dispositivos.

### RF-05 — Prática de fala (P0)
Reconhecimento de voz do sistema, nota palavra a palavra, comparação com
modelo TTS. Degradação para autoavaliação guiada quando não houver
reconhecedor.
- Critério: nunca exibir botão de microfone inoperante.

### RF-06 — Tutor de IA (P0)
Conversa por texto e voz, cenários guiados, correção de erros com explicação
da regra, memória do que foi estudado.
- Critério: funcional offline com qualidade reduzida; **nunca** tela de erro
  por falta de rede.

### RF-07 — Gamificação (P0)
XP ponderado por dificuldade, níveis, ofensiva com congelamento, moedas,
conquistas, missões diárias/semanais, ligas semanais, loja.
- Critério: XP não é "farmável" repetindo a lição mais fácil (teto por sessão
  + ponderação por dificuldade).

### RF-08 — Painel de progresso (P0)
Ofensiva, XP, nível, tempo, palavras, precisão, pronúncia, retenção prevista,
calendário de consistência, gráficos semanal/mensal/anual.
- Critério: métricas honestas, incluindo as desfavoráveis.

### RF-09 — Offline e downloads (P0)
Download por idioma / curso / só áudio, com escolha de qualidade, visualização
de espaço ocupado e remoção seletiva.
- Critério: nada é baixado sem ação explícita do usuário.

### RF-10 — Sincronização (P0)
Outbox durável, envio em lote, três políticas de merge, resolução automática.
- Critério: nenhuma tela de conflito; convergência garantida por testes.

### RF-11 — Vocabulário (P1)
Banco pesquisável com força de memória por palavra, favoritos, filtros e áudio.

### RF-12 — Leitura, escuta e escrita (P1)
Sessões de prática deliberada por habilidade, independentes da trilha.

### RF-13 — Monetização (P1)
Gratuito, Premium, Família e Estudante. Paywall contextual e honesto.

### RF-14 — Comunidade (P2)
Amigos, ranking, grupos e desafios. Depende de conta conectada.

### RF-15 — Notificações (P1)
Lembrete no horário escolhido, alerta de ofensiva em risco, aviso de revisão
acumulada. Máximo 2/dia.

### RF-16 — Modos de aprendizado (P0)
Dois ritmos para o mesmo curso, alternáveis a qualquer momento e escolhidos
**por matrícula**, não por conta. **Completo**: 16 tipos de exercício, sessão
do tamanho da meta diária, sistema de vidas. **Essencial**: 4 tipos, sessão de
5 exercícios, sem vidas, plano do dia com no máximo 2 blocos.
- Critério: trocar de modo não altera XP acumulado, fila de SRS nem progresso;
  a correção é idêntica nos dois. Um modo que ensina menos seria inútil — o que
  muda é a carga de interface, não o rigor.

### RF-17 — Apostila por nível (P1)
Uma apostila por nível CEFR em cada idioma (48 no total), gerada no dispositivo
a partir das mesmas fontes das lições. Seções de vocabulário, gramática,
frases, expressões e checklist de saída. Download (fixa offline) e exportação
em texto — que o usuário salva, imprime ou converte em PDF.
- Critério: abrir e ler sem rede; "baixar" não consome dados móveis; todo
  exemplo é tocável e fala em voz alta.

### RF-18 — Expressões idiomáticas (P1)
Módulo por idioma com literal, sentido em português, equivalente brasileiro
(ou a afirmação explícita de que não existe), origem e exemplo em contexto.
Ordenado por frequência de uso real. Filtros por nível e favoritos, busca que
ignora acentuação.
- Critério: o sentido só aparece **depois do toque** — a tentativa de adivinhar
  é o que fixa a memória; lista com tradução à vista vira leitura passiva.

### RF-19 — Trocar o nível do curso (P1)
O usuário muda seu nível CEFR no idioma em andamento a qualquer momento, do
perfil.
- Critério: nada é apagado. Lições concluídas, vocabulário e fila de revisão
  permanecem. O nível define o conteúdo daqui para frente. Zerar progresso ao
  corrigir um nivelamento errado torna a correção cara demais para acontecer.

## 2.6 Requisitos não funcionais

| Categoria | Requisito | Verificação |
|---|---|---|
| Desempenho | Abertura a frio < 2,5 s em Android de entrada | Perfil de inicialização |
| Desempenho | 60 fps em todas as transições | Animações na thread de UI (Reanimated) |
| Desempenho | Correção de exercício < 100 ms | Correção síncrona e local |
| Offline | 100% das funções essenciais sem rede | Suíte de testes + QA em modo avião |
| Bateria | < 3% por sessão de 15 min | TTS/STT locais, sync a cada 5 min |
| Armazenamento | App base < 60 MB; conteúdo sob demanda | Semente enxuta + pacotes |
| Acessibilidade | WCAG 2.1 AA; leitor de tela; fonte até 1,6× | `accessibilityLabel` em todo controle |
| Segurança | Nenhum segredo no binário | IA sempre via Edge Function |
| Privacidade | LGPD: exportar e apagar em ≤ 2 toques | Tela de perfil |
| Escala | 1M+ usuários | Servidor sem estado; verdade no cliente |

## 2.7 Fora de escopo na v1

- Videoaulas gravadas e aulas com professores humanos.
- Idiomas com sistema de escrita não latino (japonês, mandarim, árabe) — a
  arquitetura suporta, mas exigem trabalho de tipografia e input.
- Certificação formal.
- Versão desktop dedicada (a web cobre o caso).

## 2.8 Riscos e mitigação

| Risco | Impacto | Mitigação |
|---|---|---|
| Custo de IA cresce com o uso | Alto | Correção sempre local; IA só enriquece; cota por plano na Edge Function |
| Qualidade do TTS varia por aparelho | Médio | Áudio gravado para conteúdo curado; TTS só para texto dinâmico |
| Reconhecimento de voz indisponível | Médio | Degradação para autoavaliação guiada |
| Conteúdo gerado parecer robótico | Alto | Frases curadas por tema como base; expansão editorial contínua |
| Duolingo copiar os diferenciais | Médio | Offline-first é decisão arquitetural, não recurso — caro de retrofitar |
