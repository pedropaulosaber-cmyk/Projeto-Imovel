# 15. Melhorias futuras

Ordenadas por **impacto sobre a métrica-norte** dividido pelo custo de
construção — não por quão interessantes são de implementar.

---

## Alto impacto

### 1. Avaliação fonética real no dispositivo
**Hoje:** a nota de pronúncia compara a transcrição do reconhecedor com o texto
alvo. Distingue bem "falou errado" de "falou certo", mas não identifica *qual
fonema* saiu errado.

**Proposta:** modelo acústico leve embarcado (Whisper tiny quantizado ou
Kaldi/Vosk) para *Goodness of Pronunciation* sobre alinhamento forçado.
Permite: "seu /θ/ em *think* está saindo como /t/ — a língua vai entre os
dentes".

**Por que importa:** é o feedback que só um professor humano dá hoje, e é o
principal motivo de as pessoas pagarem R$ 80/hora por aula. Continua offline.
**Custo:** alto (~40–120 MB por idioma; pesquisa de ML).

### 2. FSRS com pesos otimizados
**Hoje:** SM-2 estendido com estabilidade e dificuldade.

**Proposta:** quando houver ~1 milhão de revisões agregadas, treinar os 17
pesos do FSRS e distribuí-los como configuração remota. Ganho esperado na
literatura: 15–25% menos revisões para a mesma retenção.

**Por que importa:** menos tempo revisando = mais tempo aprendendo coisa nova,
com a mesma memória. A troca é local: só `schedule()` muda.
**Custo:** médio. **Bloqueio:** volume de dados.

### 3. Conversa por voz em tempo real
**Hoje:** o tutor conversa por texto e lê as respostas em voz alta.

**Proposta:** pipeline full-duplex (STT em streaming → LLM → TTS) com
interrupção natural, latência abaixo de 700 ms. A prática mais próxima de uma
conversa real que um app pode oferecer.
**Custo:** alto (latência e custo por minuto). Premium por definição.

### 4. Importar conteúdo próprio
**Proposta:** colar um artigo, subir um PDF ou apontar um vídeo do YouTube; o
app extrai o vocabulário desconhecido, gera exercícios e alimenta o SRS.

**Por que importa:** resolve o teto de conteúdo de forma estrutural. Um usuário
B2 não precisa da nossa lição — precisa das *palavras que ele encontrou hoje*.
Foi o que sustentou o LingQ por 15 anos.
**Custo:** médio-alto.

---

## Médio impacto

### 5. Cartões com imagem e mnemônicos gerados
Codificação dupla (visual + verbal) melhora retenção mensuravelmente. Gerar
imagem para os 1.000 termos mais frequentes de cada idioma, uma vez, e
distribuir nos pacotes de download.

### 6. Adaptação de dificuldade em tempo real
Ajustar a dificuldade dos próximos exercícios dentro da mesma sessão com base
nos acertos recentes, mantendo o usuário na zona de ~85% de acerto — a faixa
com melhor retorno de aprendizado por minuto (*desirable difficulty*).

### 7. Mapa de trilha visual
Substituir a lista de lições por um mapa com ramificações opcionais. Aumenta a
sensação de jornada e permite caminhos alternativos por objetivo.

### 8. Widget e complicação
Widget de tela inicial com ofensiva e itens vencidos; complicação no Apple
Watch. Reduz a fricção de "lembrar de estudar" a zero.

### 9. Modo revisão em áudio
Sessão inteiramente auditiva para dirigir, correr ou caminhar. Pergunta em
português, pausa, resposta no idioma. Cobre a janela do dia em que a pessoa não
pode olhar a tela — hoje totalmente perdida.

### 10. Certificado de nível
Teste adaptativo que estima o CEFR com certificado compartilhável. Fecha o loop
motivacional ("estou no B1 agora") e vira material de compartilhamento.

---

## Menor impacto / apostas

### 11. Idiomas com escrita não latina
Japonês, coreano, mandarim, árabe, russo. A arquitetura de conteúdo já suporta;
o trabalho é de tipografia, método de entrada e ordem de introdução do sistema
de escrita.

Os três primeiros chegaram a existir no catálogo e foram removidos. O motivo
não foi técnico: manter cinco idiomas com profundidade real custa menos revisão
do que manter oito rasos, e profundidade é o que o aluno percebe. O que ficou
da tentativa está no código e continua útil — `usesNonLatinScript`, o campo
`romanization` em cada verbete e o teste que o exige são as guardas prontas
para o dia em que a decisão se inverter. Ver `RETIRED_LANGUAGES` em
`domain/types.ts` para o tratamento de quem já tinha matrícula num deles.

### 12. Grupos de estudo síncronos
Sessões ao vivo com 4–6 pessoas do mesmo nível, mediadas pelo tutor de IA.
Sociabilidade é o maior preditor de persistência em adultos.

### 13. Correção por nativos
Marketplace onde nativos corrigem redações por moedas ganhas no app. Cria
economia interna e conteúdo humano sem custo direto.

### 14. Modo professor (B2B)
Painel para escolas: turmas, acompanhamento, tarefas, relatórios. Receita
recorrente maior e churn muito menor que B2C.

---

## Dívida técnica priorizada

| Item | Impacto | Esforço |
|---|---|---|
| Reconhecimento de voz nativo (Android/iOS) | Alto | Médio |
| Download real de pacotes com `expo-file-system` | Alto | Baixo |
| Injetar transporte de sync real | Alto | Baixo |
| Testes E2E com Maestro | Médio | Médio |
| Testes de componente | Médio | Médio |
| Migrar `console.warn` para telemetria estruturada | Médio | Baixo |
| Code splitting da build web | Baixo | Médio |
| Substituir simulação de download da UI | Médio | Baixo |

---

## Princípio para decidir

Antes de construir qualquer coisa desta lista, uma pergunta:

> **Isso aumenta a chance de o usuário abrir o app amanhã e sentir que
> avançou?**

Se a resposta não for um sim claro, a feature espera. O concorrente real não é
o Duolingo — é o abandono no dia 14.
