/**
 * Exportação em PDF
 * ==================
 *
 * Três plataformas, três caminhos — todos produzindo o **mesmo** documento a
 * partir do mesmo HTML:
 *
 *  - **Android e iOS** — `expo-print` entrega o HTML ao motor de impressão do
 *    sistema (WebView + PDFKit/PrintManager), que devolve um arquivo real.
 *    `expo-sharing` abre a folha de compartilhamento para salvar, enviar ou
 *    imprimir.
 *  - **Web** — abre uma janela com o documento e dispara `print()`. O usuário
 *    escolhe "Salvar como PDF" no diálogo do navegador. É o mesmo motor que
 *    gera o PDF, sem download de biblioteca nenhuma.
 *
 * ## Por que o sistema e não uma biblioteca
 *
 * Uma lib de PDF em JS pesa centenas de KB e precisa **embutir a fonte** —
 * inclusive a variante em negrito e a itálica, ou o material sai todo no mesmo
 * peso. O motor do sistema já tem as fontes instaladas, acompanha o idioma do
 * aparelho e produz PDF vetorial com texto selecionável e pesquisável.
 *
 * A decisão nasceu de uma restrição mais dura — o catálogo tinha japonês,
 * coreano e mandarim, e uma fonte que cobrisse CJK custava vários megabytes.
 * Esses idiomas saíram; a escolha continua, agora pelo tamanho e pela
 * qualidade do resultado.
 *
 * ## Falha honesta
 *
 * Se o PDF não puder ser gerado, o chamador recebe `{ ok: false, reason }` e
 * decide o que dizer. Nada de `throw` silencioso nem de sucesso fingido: o
 * usuário precisa saber que o arquivo não saiu.
 */

import { Platform } from 'react-native';

export type PdfResult = { ok: true; uri: string | null } | { ok: false; reason: string };

/**
 * Gera e compartilha o PDF.
 *
 * `uri` vem preenchido no nativo (caminho do arquivo gerado) e nulo na web,
 * onde quem materializa o arquivo é o diálogo de impressão do navegador.
 */
export async function exportHtmlAsPdf(html: string, fileName: string): Promise<PdfResult> {
  if (Platform.OS === 'web') return printOnWeb(html);
  return printOnNative(html, fileName);
}

/* ------------------------------------------------------------------ *
 * Web
 * ------------------------------------------------------------------ */

async function printOnWeb(html: string): Promise<PdfResult> {
  if (typeof window === 'undefined') {
    return { ok: false, reason: 'Impressão indisponível neste ambiente.' };
  }

  // `about:blank` em nova aba: escrever no documento atual destruiria o app.
  const target = window.open('', '_blank');
  if (!target) {
    return {
      ok: false,
      reason: 'O navegador bloqueou a janela. Libere pop-ups para este site e tente de novo.',
    };
  }

  target.document.open();
  target.document.write(html);
  target.document.close();

  // O `print()` precisa esperar o layout — chamar antes abre o diálogo com a
  // página em branco. `onload` é o sinal certo; o timeout é a rede de
  // segurança para navegadores que não disparam o evento em documentos
  // escritos por `document.write`.
  const print = () => {
    try {
      target.focus();
      target.print();
    } catch {
      // Usuário pode ter fechado a aba antes. Não há o que fazer, e não há o
      // que reportar: a janela já não existe.
    }
  };

  target.onload = print;
  setTimeout(print, 700);

  return { ok: true, uri: null };
}

/* ------------------------------------------------------------------ *
 * Android e iOS
 * ------------------------------------------------------------------ */

async function printOnNative(html: string, fileName: string): Promise<PdfResult> {
  try {
    // Import dinâmico pelo mesmo motivo de `expo-sqlite`: estes módulos
    // resolvem código nativo na avaliação, e um import estático quebraria o
    // bundle web inteiro — foi exatamente assim que o site ficou branco antes.
    const Print = await import('expo-print');
    const Sharing = await import('expo-sharing');

    const { uri } = await Print.printToFileAsync({ html, base64: false });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: fileName,
        UTI: 'com.adobe.pdf',
      });
    }

    return { ok: true, uri };
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? error.message : 'Não foi possível gerar o PDF.',
    };
  }
}
