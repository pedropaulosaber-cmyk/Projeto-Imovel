# 5. Wireframes em texto

Baseados em um telefone de 390 × 844 pt. Tudo que é ação primária vive abaixo
de 62% da altura — a zona alcançável pelo polegar em uso com uma mão.

## 5.1 Trilha (aba principal)

```
┌─────────────────────────────────────────┐
│ Bom dia, Pedro              🔥 12  ⚡ 40 │  ← ofensiva e XP de hoje
│ 🇺🇸 Inglês  ⌄                            │  ← troca de idioma
├─────────────────────────────────────────┤
│ ╭─────────────────────────────────────╮ │
│ │      ╭───────╮                      │ │
│ │      │  40   │   Faltam 80 XP       │ │  ← anel de meta diária
│ │      │ /120  │   Cerca de 10 min    │ │     é o elemento âncora
│ │      ╰───────╯   🔥 12 dias seguidos│ │
│ ╰─────────────────────────────────────╯ │
│                                          │
│ SEU PLANO DE HOJE                 15 min │
│ ╭─────────────────────────────────────╮ │
│ │ 🔁  Revisar 23 itens                │ │  ← ① dívida de SRS
│ │     Memórias prestes a enfraquecer  │ │     sempre em primeiro
│ │                        3 min +92 XP │ │
│ ╰─────────────────────────────────────╯ │
│ ╭─────────────────────────────────────╮ │
│ │ ▶️  Presente simples                │ │  ← ② avanço na trilha
│ │     Próxima lição da sua trilha     │ │
│ │                        6 min +25 XP │ │
│ ╰─────────────────────────────────────╯ │
│ ╭─────────────────────────────────────╮ │
│ │ 🎤  Treino de pronúncia             │ │  ← ③ habilidade fraca
│ │                        5 min +40 XP │ │
│ ╰─────────────────────────────────────╯ │
│                                          │
│ SUA TRILHA                               │
│  ✓  Olá e tchau        4 min · 92%      │
│  ✓  Quem é você        5 min · 100%     │
│  ▶  Ouvindo apresent.  4 min · 25 XP    │
│  🔒 Sons e ritmo                         │
│  🔒 Checkpoint         [Premium]        │
├─────────────────────────────────────────┤
│  🎓      🔁²³     💬      📊      👤     │  ← badge = revisões vencidas
│ Aprender Praticar Tutor Progresso Perfil │
└─────────────────────────────────────────┘
```

## 5.2 Exercício — escolha múltipla

```
┌─────────────────────────────────────────┐
│ ✕   ▮▮▮▯▯▯▯▯▯▯                    ♥ 4   │  ← sair · progresso · vidas
├─────────────────────────────────────────┤
│                                          │
│ Escolha a alternativa correta            │
│                                          │
│ ╭─────────────────────────────────────╮ │
│ │ 🔊  Toque para ouvir novamente      │ │
│ ╰─────────────────────────────────────╯ │
│                                          │
│ O que significa "water"?                 │  ← escala `target`, 26pt
│                                          │
│ ╭─────────────────────────────────────╮ │
│ │ Ⓐ  água                             │ │
│ ╰─────────────────────────────────────╯ │
│ ╭─────────────────────────────────────╮ │
│ │ Ⓑ  fogo                             │ │
│ ╰─────────────────────────────────────╯ │
│ ╭─────────────────────────────────────╮ │
│ │ Ⓒ  terra                            │ │
│ ╰─────────────────────────────────────╯ │
│                                          │
│           💡 Ver dica (vale menos XP)    │
└─────────────────────────────────────────┘

Depois de responder, a barra de feedback sobe de baixo:

┌─────────────────────────────────────────┐
│ ✓  Perfeito!                             │  ← verde: acerto
│                                          │
│ The book is on the table. — O livro está │
│ na mesa.                                 │
│ ╭─────────────────────────────────────╮ │
│ │            Continuar                 │ │  ← na zona do polegar
│ ╰─────────────────────────────────────╯ │
└─────────────────────────────────────────┘
```

## 5.3 Exercício de fala

```
┌─────────────────────────────────────────┐
│ ✕   ▮▮▮▮▮▯▯▯▯▯                    ♥ 5   │
├─────────────────────────────────────────┤
│ Toque no microfone e diga a frase        │
│ ╭─────────────────────────────────────╮ │
│ │      Good morning, how are you?      │ │
│ │        /ɡʊd ˈmɔːrnɪŋ/                │ │
│ │         🔊 Ouvir modelo              │ │
│ ╰─────────────────────────────────────╯ │
│                                          │
│ ╭─ Pronúncia            78% ───────────╮ │
│ │ [good] [morning] [how] [are] [you]   │ │  ← verde = ok
│ │  ✓      ✓         ✗     ✓     ✓      │ │     vermelho = errou
│ ╰─────────────────────────────────────╯ │
│                                          │
│                  ╭───╮                   │
│                  │ 🎤 │  ← pulsa gravando│
│                  ╰───╯                   │
│              Toque para falar            │
└─────────────────────────────────────────┘
```

Mostrar **qual palavra** saiu errada é o que transforma "78%" em aprendizado.

## 5.4 Revisão espaçada

```
┌─────────────────────────────────────────┐
│ ✕   ▮▮▮▮▯▯▯▯▯▯▯▯                  7/23  │
├─────────────────────────────────────────┤
│                                          │
│    ╭───────────────────────────────╮    │
│    │                                │    │
│    │          because               │    │
│    │        /bɪˈkɔːz/               │    │
│    │        🔊 Ouvir                │    │
│    │      ─────────────             │    │
│    │          porque                │    │  ← só após revelar
│    │  I stayed because it rained.   │    │
│    │  Fiquei porque choveu.         │    │
│    ╰───────────────────────────────╯    │
│                                          │
│         Quanto você lembrou?             │
│ ╭──────╮ ╭──────╮ ╭──────╮ ╭──────╮    │
│ │  ↻   │ │  ↓   │ │  ✓   │ │  ⚡  │    │
│ │De novo│ │Difícil│ │ Bom  │ │Fácil │    │
│ │ 1 min│ │  3 d │ │  8 d │ │ 21 d │    │  ← intervalo visível
│ ╰──────╯ ╰──────╯ ╰──────╯ ╰──────╯    │
└─────────────────────────────────────────┘
```

## 5.5 Painel de progresso

```
┌─────────────────────────────────────────┐
│ Progresso                                │
│ ╭─────────────────────────────────────╮ │
│ │ NÍVEL                    ⚡ 4.280 XP │ │
│ │  12                      🪙 340      │ │
│ │ ▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░                │ │
│ │ Faltam 320 XP para o nível 13       │ │
│ ╰─────────────────────────────────────╯ │
│                                          │
│ ╭──────────────╮ ╭──────────────╮       │
│ │ 🔥  12       │ │ ⏱  6h 20min  │       │
│ │ ofensiva     │ │ estudados    │       │
│ │ recorde: 34  │ │ últimos 30 d │       │
│ ╰──────────────╯ ╰──────────────╯       │
│ ╭──────────────╮ ╭──────────────╮       │
│ │ ✓  87%       │ │ 🎤  74%      │       │
│ │ precisão     │ │ pronúncia    │       │
│ ╰──────────────╯ ╰──────────────╯       │
│                                          │
│ EVOLUÇÃO                                 │
│ [ Semana │  Mês  │  Ano ]                │
│ ╭─────────────────────────────────────╮ │
│ │ XP conquistado                  840 │ │
│ │  ▁ ▃ █ ▆ █ ▂ ▅                      │ │
│ │  S T Q Q S S D                      │ │
│ │ 6 de 7 dias com estudo              │ │
│ ╰─────────────────────────────────────╯ │
│                                          │
│ CONSISTÊNCIA                             │
│ ▪▪▫▪▪▪▪ ▪▪▪▫▪▪▪ ▪▪▪▪▫▫▪ ▪▪▪▪▪▪▫        │
│ menos ▫▪▪▪ mais                          │
└─────────────────────────────────────────┘
```

## 5.6 Tutor

```
┌─────────────────────────────────────────┐
│ Tutor                        [Offline]  │
│ (🍽 Restaurante)(🛏 Hotel)(💼 Entrevista)│  ← cenários, rolagem horiz.
├─────────────────────────────────────────┤
│ ╭────────────────────────────╮          │
│ │ Good evening! Welcome. Do  │          │  ← tutor, à esquerda
│ │ you have a reservation?    │          │
│ ╰────────────────────────────╯          │
│   🔉 ouvir                               │
│                                          │
│          ╭────────────────────────────╮ │
│          │ No, I have 25 years and I  │ │  ← usuário, à direita
│          │ want a table               │ │
│          ╰────────────────────────────╯ │
│          ╭────────────────────────────╮ │
│          │ 🔧 Gramática               │ │  ← correção colada
│          │ I have 25 years →           │ │     à mensagem
│          │ I am 25 years old           │ │
│          │ Em inglês a idade usa o     │ │
│          │ verbo to be, não to have.   │ │
│          ╰────────────────────────────╯ │
├─────────────────────────────────────────┤
│ ╭──────────────────────────────╮  ╭──╮ │
│ │ Escreva sua mensagem…        │  │ ↑ │ │
│ ╰──────────────────────────────╯  ╰──╯ │
└─────────────────────────────────────────┘
```

## 5.7 Downloads

```
┌─────────────────────────────────────────┐
│ ‹  Downloads                             │
│ ╭─────────────────────────────────────╮ │
│ │ Espaço usado                 42,3 MB │ │
│ │ 17 lições · 214 exercícios ·         │ │
│ │ 168 palavras offline                 │ │
│ │ ✓ Conteúdo básico já incluído        │ │
│ ╰─────────────────────────────────────╯ │
│                                          │
│ QUALIDADE DOS ÁUDIOS                     │
│ [  Padrão  │   Alta   ]                  │
│ Padrão (64 kbps): ocupa 3× menos e      │
│ baixa muito mais rápido no 4G.           │
│                                          │
│ 🇺🇸 Inglês                       [Ativo] │
│ ╭─────────────────────────────────────╮ │
│ │ 🌐 Idioma completo   148 MB [Baixar]│ │
│ ╰─────────────────────────────────────╯ │
│ ╭─────────────────────────────────────╮ │
│ │ ✓ Curso A1            42 MB     🗑  │ │
│ │   disponível offline                 │ │
│ ╰─────────────────────────────────────╯ │
│ ╭─────────────────────────────────────╮ │
│ │ 🎵 Somente áudios     96 MB         │ │
│ │ ▓▓▓▓▓▓▓░░░░  60% · 57 MB            │ │
│ ╰─────────────────────────────────────╯ │
└─────────────────────────────────────────┘
```
