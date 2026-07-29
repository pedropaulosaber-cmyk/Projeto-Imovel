#!/usr/bin/env node
/**
 * Reprodução da tela branca no Perfil.
 *
 * Hipótese: usuários que já usavam o app têm uma matrícula gravada ANTES do
 * campo `learningMode` existir. O Perfil lê `LEARNING_MODE_META[undefined]` e
 * estoura. O teste de fumaça não pega porque sempre cria perfil do zero — e
 * perfil do zero já nasce com o campo.
 *
 * Este script faz o onboarding, remove o campo do localStorage (simulando o
 * dado legado), recarrega e abre o Perfil.
 */

const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const DIST = path.resolve(__dirname, '..', 'dist');
const PORT = Number(process.env.REPRO_PORT ?? 8097);
const SETTLE_MS = 900;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ttf': 'font/ttf',
  '.woff2': 'font/woff2',
};

function findChromium() {
  const root = process.env.PLAYWRIGHT_BROWSERS_PATH ?? '/opt/pw-browsers';
  const dir = fs
    .readdirSync(root)
    .filter((name) => name.startsWith('chromium-'))
    .sort()
    .pop();
  return path.join(root, dir, 'chrome-linux', 'chrome');
}

function startServer() {
  const server = http.createServer((req, res) => {
    const urlPath = decodeURIComponent((req.url ?? '/').split('?')[0]);
    let filePath = path.join(DIST, urlPath);
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(DIST, 'index.html');
    }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(filePath)] ?? 'application/octet-stream',
    });
    res.end(fs.readFileSync(filePath));
  });
  return new Promise((resolve) => server.listen(PORT, '127.0.0.1', () => resolve(server)));
}

const CLICK_IN_PAGE = (needle) => {
  const candidates = [...document.querySelectorAll('div,span,button,a,[role]')].reverse();
  const hit = candidates.find(
    (node) => node.innerText?.trim().includes(needle) && node.innerText.length < 200,
  );
  if (!hit) return false;
  let element = hit;
  for (let depth = 0; depth < 6 && element; depth += 1) {
    const role = element.getAttribute?.('role');
    if (
      role === 'button' ||
      role === 'radio' ||
      role === 'tab' ||
      element.tagName === 'BUTTON' ||
      element.tagName === 'A'
    ) {
      element.click();
      return true;
    }
    element = element.parentElement;
  }
  hit.click();
  return true;
};

async function main() {
  const { chromium } = require('playwright-core');
  const server = await startServer();
  const browser = await chromium.launch({
    executablePath: findChromium(),
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });

  const errors = [];
  const page = await browser.newPage({ viewport: { width: 420, height: 900 } });
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text().slice(0, 400));
  });

  const tap = async (label) => {
    await page.evaluate(CLICK_IN_PAGE, label);
    await page.waitForTimeout(SETTLE_MS);
  };

  await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(SETTLE_MS * 2);

  for (const step of [
    'Começar agora',
    'Vamos começar',
    'Inglês',
    'Continuar',
    'Viajar',
    'Continuar',
    'Do zero',
    'Continuar',
    'Leve',
    'Continuar',
    'Continuar',
    'Ver meu plano',
    'Começar a estudar',
  ]) {
    await tap(step);
  }

  // Espera o debounce de gravação (400 ms) antes de mexer no disco.
  await page.waitForTimeout(1200);

  // ---- Simula o dado legado: matrícula sem `learningMode` ----
  const mutated = await page.evaluate(() => {
    const key = '@lumo/db/enrollments';
    const raw = localStorage.getItem(key);
    if (!raw) return 'sem matrícula gravada';

    const records = JSON.parse(raw);
    for (const record of records) {
      // `delete` é o operador certo aqui e não uma desatenção: o objetivo é a
      // chave ficar *ausente*, exatamente como num documento gravado por uma
      // versão do app que não conhecia o campo. Atribuir `undefined` deixaria
      // a chave presente no objeto em memória e mudaria o que está sendo
      // reproduzido.
      // biome-ignore lint/performance/noDelete: a ausência da chave é o cerne do teste
      delete record.doc.learningMode;
      // biome-ignore lint/performance/noDelete: idem
      delete record.fields.learningMode;
    }
    localStorage.setItem(key, JSON.stringify(records));
    return `${records.length} matrícula(s) rebaixadas para o formato antigo`;
  });
  console.log(`· ${mutated}`);

  errors.length = 0;
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(SETTLE_MS * 2);

  await tap('Perfil');
  await page.waitForTimeout(SETTLE_MS);

  const rootSize = await page.evaluate(
    () => document.getElementById('root')?.innerHTML.length ?? 0,
  );

  console.log(`· #root após abrir o Perfil: ${rootSize}`);
  if (errors.length > 0) {
    console.log('· erros capturados:');
    for (const error of errors.slice(0, 4)) console.log(`    ${error}`);
  }
  console.log(rootSize === 0 ? '\n✗ REPRODUZIDO: tela branca.' : '\n✓ Perfil renderizou.');

  await browser.close();
  server.close();
  process.exitCode = rootSize === 0 ? 1 : 0;
}

main().catch((error) => {
  console.error('falha:', error.message);
  process.exit(1);
});
