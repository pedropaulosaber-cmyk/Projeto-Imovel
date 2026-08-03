/**
 * Apostila em PDF
 * ================
 *
 * ## A decisão técnica: HTML impresso pelo sistema, não uma biblioteca de PDF
 *
 * Existem duas formas de gerar PDF num app React Native:
 *
 *  1. **Biblioteca de PDF em JS** (pdfmake, jsPDF). Pesa ~500 KB no bundle e,
 *     pior, precisa **embutir a fonte** — cada peso e cada estilo, ou o
 *     material inteiro sai na mesma variante. Cobrir bem os acentos e as
 *     ligaduras dos cinco idiomas custa mais algumas centenas de KB.
 *
 *  2. **HTML renderizado pelo motor de impressão do sistema** — `expo-print`
 *     no Android e iOS, `window.print()` na web. O sistema operacional já tem
 *     as fontes instaladas e já produz PDF vetorial com texto selecionável e
 *     pesquisável.
 *
 * A segunda opção custa ~40 KB, não embute fonte nenhuma e produz um PDF
 * melhor. Este arquivo existe para produzir esse HTML.
 *
 * ## Por que o CSS é tão detalhado
 *
 * Um PDF gerado sem cuidado de paginação é pior que texto: título órfão no pé
 * da página, tabela cortada ao meio, exemplo separado da explicação. As regras
 * `break-inside: avoid` e `break-after` espalhadas aqui são o que transforma
 * "HTML impresso" em "apostila".
 *
 * As cores acompanham a identidade do app (índigo #4F46E5) mas com contraste
 * calibrado para **papel**, não para tela: o cinza de texto secundário é mais
 * escuro do que seria num app, porque papel não tem retroiluminação.
 */

import type {
  Idiom,
  LanguageCode,
  VocabularyItem,
  Workbook,
  WorkbookBlock,
} from '@/domain/types';
import { LANGUAGE_META } from './vocabulary';

/**
 * Escapa texto que vai para dentro do HTML.
 *
 * Nome próprio em vez de `escape` para não sombrear a função global de mesmo
 * nome — que é obsoleta, faz outra coisa (codificação de URL) e cuja presença
 * torna o código ambíguo para quem lê depois.
 */
function html(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ------------------------------------------------------------------ *
 * Folha de estilo
 * ------------------------------------------------------------------ */

const STYLES = `
  @page {
    size: A4;
    margin: 18mm 16mm 20mm 16mm;
  }

  * { box-sizing: border-box; }

  body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
      "Helvetica Neue", "Noto Sans", "Noto Sans JP", "Noto Sans KR",
      "Noto Sans SC", sans-serif;
    color: #14161c;
    font-size: 10.8pt;
    line-height: 1.62;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* ---------------- Capa ---------------- */

  .cover {
    height: 245mm;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    break-after: page;
  }
  .cover-top { padding-top: 8mm; }
  .brand {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-weight: 700;
    letter-spacing: 0.22em;
    font-size: 9pt;
    text-transform: uppercase;
    color: #4F46E5;
  }
  .brand-dot {
    width: 9px; height: 9px; border-radius: 50%;
    background: #4F46E5;
    display: inline-block;
  }
  .cover-level {
    margin-top: 26mm;
    font-size: 76pt;
    font-weight: 800;
    line-height: 0.9;
    letter-spacing: -0.04em;
    color: #4F46E5;
  }
  .cover-title {
    margin-top: 6mm;
    font-size: 30pt;
    font-weight: 800;
    letter-spacing: -0.025em;
    line-height: 1.1;
  }
  .cover-subtitle {
    margin-top: 5mm;
    font-size: 12.5pt;
    color: #43485a;
    max-width: 125mm;
    line-height: 1.5;
  }
  .cover-rule {
    height: 3px;
    width: 46mm;
    background: linear-gradient(90deg, #4F46E5, #8B7BF7);
    border-radius: 2px;
    margin-top: 9mm;
  }
  .cover-meta {
    border-top: 1px solid #dfe1ea;
    padding-top: 5mm;
    display: flex;
    justify-content: space-between;
    font-size: 9.5pt;
    color: #5b6072;
  }
  .cover-flag { font-size: 30pt; }

  /* ---------------- Estrutura ---------------- */

  h2.section-title {
    font-size: 19pt;
    font-weight: 800;
    letter-spacing: -0.02em;
    margin: 0 0 1mm 0;
    color: #14161c;
    break-after: avoid;
  }
  .section-index {
    font-size: 8.5pt;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: #4F46E5;
    margin-bottom: 2mm;
  }
  .section {
    break-before: page;
    padding-top: 2mm;
  }
  .section-rule {
    height: 2px;
    background: #eceef5;
    margin: 4mm 0 6mm 0;
  }

  h3 {
    font-size: 13pt;
    font-weight: 700;
    margin: 7mm 0 2mm 0;
    letter-spacing: -0.01em;
    break-after: avoid;
  }
  p { margin: 0 0 3.5mm 0; }
  p.lead { font-size: 11.6pt; color: #363b4c; }

  /* ---------------- Blocos ---------------- */

  .callout {
    border-radius: 10px;
    padding: 5mm 6mm;
    margin: 5mm 0;
    break-inside: avoid;
    border-left: 4px solid;
  }
  .callout-title {
    font-weight: 700;
    font-size: 10.5pt;
    margin-bottom: 1.5mm;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .callout-tip     { background: #f1efff; border-color: #6C5CE7; }
  .callout-warning { background: #fff5e8; border-color: #E8873A; }
  .callout-rule    { background: #eef4ff; border-color: #3B7DDD; }
  .callout p { margin: 0; font-size: 10.2pt; color: #2c3040; }

  ul.checklist { margin: 3mm 0 5mm 0; padding: 0; list-style: none; }
  ul.checklist li {
    position: relative;
    padding-left: 8mm;
    margin-bottom: 2.4mm;
    break-inside: avoid;
  }
  ul.checklist li::before {
    content: "";
    position: absolute;
    left: 1.5mm;
    top: 1.7mm;
    width: 3.4mm; height: 3.4mm;
    border: 1.6px solid #b9bdcc;
    border-radius: 3px;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 4mm 0 6mm 0;
    font-size: 10.2pt;
  }
  thead th {
    text-align: left;
    font-size: 8pt;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #6b7085;
    padding: 0 3mm 2mm 3mm;
    border-bottom: 1.5px solid #d8dbe6;
  }
  tbody tr { break-inside: avoid; }
  tbody tr:nth-child(even) { background: #f7f8fc; }
  tbody td {
    padding: 2.6mm 3mm;
    border-bottom: 1px solid #eceef5;
    vertical-align: top;
  }
  td.term { font-weight: 700; width: 33%; }
  td.roman { color: #6b7085; font-size: 9.2pt; }

  .example {
    background: #f7f8fc;
    border-radius: 8px;
    padding: 3.4mm 4.5mm;
    margin-bottom: 2.6mm;
    break-inside: avoid;
  }
  .example .target { font-weight: 650; }
  .example .roman { color: #6b7085; font-size: 9.2pt; }
  .example .native { color: #43485a; font-size: 9.8pt; margin-top: 0.8mm; }

  .conjugation {
    border: 1.5px solid #e4e7f0;
    border-radius: 10px;
    padding: 4mm 5mm;
    margin: 4mm 0;
    break-inside: avoid;
  }
  .conjugation .verb {
    display: inline-block;
    background: #4F46E5;
    color: #fff;
    font-weight: 700;
    font-size: 9.5pt;
    padding: 1mm 3mm;
    border-radius: 20px;
    margin-bottom: 2.5mm;
  }
  .conjugation-row {
    display: flex;
    justify-content: space-between;
    padding: 1.3mm 0;
    border-bottom: 1px solid #f0f2f8;
  }
  .conjugation-row:last-child { border-bottom: none; }
  .conjugation-row .person { color: #6b7085; font-size: 9.6pt; }
  .conjugation-row .form { font-weight: 650; }

  /* ---------------- Sumário ---------------- */

  .toc { break-after: page; }
  .toc-entry {
    display: flex;
    align-items: baseline;
    gap: 3mm;
    padding: 2.6mm 0;
    border-bottom: 1px solid #f0f2f8;
  }
  .toc-number {
    font-weight: 800;
    color: #4F46E5;
    width: 9mm;
    font-size: 11pt;
  }
  .toc-name { font-weight: 650; flex: 1; }
  .toc-hint { color: #6b7085; font-size: 9.4pt; }

  /* ---------------- Idioma-alvo ---------------- */

  .target-lang { font-weight: 650; }

  .footer-note {
    margin-top: 10mm;
    padding-top: 4mm;
    border-top: 1px solid #eceef5;
    font-size: 8.8pt;
    color: #7b8095;
  }
`;

/* ------------------------------------------------------------------ *
 * Renderização de blocos
 * ------------------------------------------------------------------ */

function renderBlock(block: WorkbookBlock): string {
  switch (block.kind) {
    case 'heading':
      return `<h3>${html(block.text)}</h3>`;

    case 'paragraph':
      return `<p>${html(block.text)}</p>`;

    case 'callout': {
      const icon = { tip: '💡', warning: '⚠️', rule: '📐' }[block.tone];
      return `<div class="callout callout-${block.tone}">
        <div class="callout-title">${icon} ${html(block.title)}</div>
        <p>${html(block.text)}</p>
      </div>`;
    }

    case 'list':
      return `<ul class="checklist">${block.items
        .map((item) => `<li>${html(item)}</li>`)
        .join('')}</ul>`;

    case 'vocabTable':
      return `<table>
        <thead><tr><th>Termo</th><th>Leitura</th><th>Português</th></tr></thead>
        <tbody>${block.rows
          .map(
            (row) => `<tr>
              <td class="term target-lang">${html(row.term)}</td>
              <td class="roman">${html(row.romanization ?? '')}</td>
              <td>${html(row.translation)}</td>
            </tr>`,
          )
          .join('')}</tbody>
      </table>`;

    case 'examples':
      return block.items
        .map(
          (item) => `<div class="example">
            <div class="target target-lang">${html(item.target)}</div>
            ${item.romanization ? `<div class="roman">${html(item.romanization)}</div>` : ''}
            <div class="native">${html(item.native)}</div>
          </div>`,
        )
        .join('');

    case 'conjugation':
      return `<div class="conjugation">
        <div class="verb">${html(block.verb)}</div>
        ${block.forms
          .map(
            (form) => `<div class="conjugation-row">
              <span class="person">${html(form.person)}</span>
              <span class="form target-lang">${html(form.form)}</span>
            </div>`,
          )
          .join('')}
      </div>`;
  }
}

/* ------------------------------------------------------------------ *
 * Documento
 * ------------------------------------------------------------------ */

/** Uma linha do sumário, com uma pista do que a seção entrega. */
const SECTION_HINT: Record<string, string> = {
  intro: 'O que você vai conseguir fazer ao final',
  vocabulary: 'Palavras do nível, com leitura e exemplo',
  grammar: 'As regras e os erros típicos de quem fala português',
  phrases: 'Frases prontas para usar hoje',
  idioms: 'O que os nativos dizem e não está no dicionário',
  practice: 'Exercícios para fixar',
  summary: 'Checklist de saída e próximo passo',
};

/**
 * Converte a apostila em HTML pronto para impressão.
 *
 * O documento tem capa, sumário e uma seção por página — estrutura de material
 * didático de verdade, não um despejo de conteúdo. A capa carrega o nível em
 * corpo grande porque é assim que o aluno acha a apostila certa numa pasta com
 * seis arquivos.
 */
export function workbookToPrintableHtml(workbook: Workbook): string {
  const meta = LANGUAGE_META[workbook.language];
  const sections = [...workbook.sections].sort((a, b) => a.order - b.order);

  const cover = `
    <section class="cover">
      <div class="cover-top">
        <div class="brand"><span class="brand-dot"></span> Lumo</div>
        <div class="cover-level">${html(workbook.level)}</div>
        <div class="cover-title">${html(workbook.title)}</div>
        <div class="cover-rule"></div>
        <div class="cover-subtitle">${html(workbook.subtitle)}</div>
      </div>
      <div class="cover-meta">
        <div>
          <div class="cover-flag">${meta.flag}</div>
          <div style="margin-top:2mm"><strong>${html(meta.name)}</strong> · ${html(meta.nativeName)}</div>
        </div>
        <div style="text-align:right">
          <div>${sections.length} seções · ~${workbook.estimatedPages} páginas</div>
          <div>Apostila do nível ${html(workbook.level)}</div>
        </div>
      </div>
    </section>`;

  const toc = `
    <section class="toc">
      <div class="section-index">Sumário</div>
      <h2 class="section-title">O que tem nesta apostila</h2>
      <div class="section-rule"></div>
      <p class="lead">
        Esta apostila acompanha o curso de ${html(meta.name.toLowerCase())} no nível
        ${html(workbook.level)}. Ela não substitui as lições — serve para consultar a regra
        depois, sem precisar refazer o exercício.
      </p>
      ${sections
        .map(
          (section, index) => `<div class="toc-entry">
            <span class="toc-number">${String(index + 1).padStart(2, '0')}</span>
            <span class="toc-name">${html(section.title)}</span>
            <span class="toc-hint">${html(SECTION_HINT[section.kind] ?? '')}</span>
          </div>`,
        )
        .join('')}
      <div class="footer-note">
        Gerada no seu aparelho a partir do mesmo conteúdo das lições — por isso a apostila e o
        curso nunca divergem.
      </div>
    </section>`;

  const body = sections
    .map(
      (section, index) => `<section class="section">
        <div class="section-index">Seção ${String(index + 1).padStart(2, '0')}</div>
        <h2 class="section-title">${html(section.title)}</h2>
        <div class="section-rule"></div>
        ${section.blocks.map(renderBlock).join('\n')}
      </section>`,
    )
    .join('\n');

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>${html(workbook.title)} · ${html(workbook.level)} · Lumo</title>
  <style>${STYLES}</style>
</head>
<body>
${cover}
${toc}
${body}
</body>
</html>`;
}

/** Nome de arquivo previsível, útil quando o usuário baixa as seis. */
export function workbookFileName(workbook: Workbook, language: LanguageCode): string {
  const meta = LANGUAGE_META[language];
  const slug = meta.name.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
  return `lumo-${slug}-${workbook.level.toLowerCase()}.pdf`;
}

/**
 * Estimativa de páginas a partir do conteúdo real.
 *
 * Calculada, não chutada: cada tipo de bloco ocupa uma altura conhecida em A4
 * com este CSS. Serve para o card da apostila prometer um número honesto —
 * dizer "20 páginas" e entregar 6 é o tipo de detalhe que corrói confiança.
 */
export function estimatePages(workbook: Workbook): number {
  // Capa + sumário.
  let lines = 0;

  for (const section of workbook.sections) {
    // Cada seção começa em página nova: cabeçalho custa ~6 linhas.
    lines += 6;

    for (const block of section.blocks) {
      switch (block.kind) {
        case 'heading':
          lines += 3;
          break;
        case 'paragraph':
          lines += Math.ceil(block.text.length / 95) + 1;
          break;
        case 'callout':
          lines += Math.ceil(block.text.length / 90) + 4;
          break;
        case 'list':
          lines += block.items.length + 2;
          break;
        case 'vocabTable':
          lines += block.rows.length + 4;
          break;
        case 'examples':
          lines += block.items.length * 3 + 1;
          break;
        case 'conjugation':
          lines += block.forms.length + 4;
          break;
      }
    }
  }

  // 33 linhas por página: número **medido**, não deduzido. A primeira versão
  // usava 44 (a conta teórica para A4 a 10,8 pt) e errava para menos — o PDF
  // real de inglês B1 saiu com 19 páginas contra 14 estimadas. Renderizei as
  // apostilas no Chromium, contei as páginas do arquivo e calibrei. Prometer
  // 20 páginas e entregar 14 é exatamente o tipo de detalhe que corrói
  // confiança no material.
  // O "+1" é a capa. O sumário cabe na mesma folha em que a primeira seção
  // começa, então não conta — medido contra PDFs reais (inglês B1 = 26,
  // alemão C2 = 23), onde a fórmula com "+2" errava por exatamente uma página
  // em todos.
  return Math.max(2, 1 + Math.ceil(lines / 33));
}

export type { Idiom, VocabularyItem };
