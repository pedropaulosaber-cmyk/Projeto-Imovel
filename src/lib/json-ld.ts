/**
 * Serializa um objeto para embutir em `<script type="application/ld+json">`.
 *
 * `JSON.stringify` não escapa `<`: uma string com `</script>` fecharia a tag e
 * o que viesse depois viraria HTML executável — XSS. Hoje o catálogo é estático
 * e de confiança, mas quando ele for espelhado do Postgres (CLAUDE.md §10) o
 * texto passa a ser editável fora do código, e é aí que este escape segura.
 *
 * Escapa também U+2028 e U+2029, que são quebra de linha para o parser de
 * JavaScript e cortariam o JSON embutido no meio. O padrão vem de uma string
 * ASCII (RegExp por construtor) de propósito: um U+2028 literal aqui quebraria
 * o próprio arquivo — que é exatamente o perigo que a função existe para tapar.
 */
const PERIGOSOS = new RegExp('[<>&\\u2028\\u2029]', 'g');

export function jsonLdSeguro(dado: unknown): string {
  return JSON.stringify(dado).replace(
    PERIGOSOS,
    (c) => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'),
  );
}
