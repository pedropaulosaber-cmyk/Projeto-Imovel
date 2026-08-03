#!/usr/bin/env node
/**
 * Matrícula num idioma que saiu do catálogo.
 *
 * Japonês, coreano e mandarim foram removidos. Quem já estudava um deles tem
 * uma matrícula gravada no aparelho apontando para um curso que não existe
 * mais — e esse dado **não some sozinho**: é offline-first, mora no disco do
 * usuário e sobrevive à atualização do app.
 *
 * O modo de falha aqui não é uma exceção, é pior: `listCourses` devolveria
 * lista vazia, a trilha renderizaria em branco e **nenhum erro apareceria**.
 * O aluno abriria o app, veria nada, e não teria como descobrir por quê.
 *
 * Este script faz o onboarding em inglês, reescreve a matrícula gravada para
 * `ja` (exatamente como estaria no aparelho de quem estudava japonês),
 * recarrega e verifica duas coisas na aba Aprender:
 *
 *  1. A árvore React continua montada — nada explodiu.
 *  2. A tela mostra a saída para o aluno, e não um vazio silencioso.
 *
 * O passo 2 é o que importa. O passo 1 já passava antes da correção.
 */

const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const DIST = path.resolve(__dirname, '..', 'dist');
const PORT = Number(process.env.REPRO_PORT ?? 8096);
const SETTLE_MS = 900;

/** Idioma aposentado usado na simulação — ver `RETIRED_LANGUAGES`. */
const RETIRED = 'ja';

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

  const failures = [];
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

  const mutated = await page.evaluate((retired) => {
    const key = '@lumo/db/enrollments';
    const raw = localStorage.getItem(key);
    if (!raw) return 'sem matrícula gravada';

    const records = JSON.parse(raw);
    for (const record of records) {
      record.doc.language = retired;
      record.fields.language = retired;
    }
    localStorage.setItem(key, JSON.stringify(records));
    return `${records.length} matrícula(s) apontando para "${retired}"`;
  }, RETIRED);
  console.log(`· ${mutated}`);

  errors.length = 0;
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(SETTLE_MS * 2);

  await tap('Aprender');
  await page.waitForTimeout(SETTLE_MS);

  const rootSize = await page.evaluate(
    () => document.getElementById('root')?.innerHTML.length ?? 0,
  );
  console.log(`· #root na aba Aprender: ${rootSize}`);
  if (rootSize === 0) failures.push('#root vazio — tela branca.');

  // A saída tem de estar escrita na tela. Sem isto o teste passaria com uma
  // tela que só tem a barra de abas: montada, viva e inútil.
  const text = await page.evaluate(() => document.getElementById('root')?.innerText ?? '');
  if (!text.includes('Escolher idioma')) {
    failures.push('a tela não oferece a saída ("Escolher idioma") — vazio silencioso.');
  }

  for (const error of errors.slice(0, 4)) failures.push(`erro de página: ${error}`);

  if (failures.length > 0) {
    console.error('\n✗ Matrícula em idioma aposentado deixa o aluno preso:\n');
    for (const failure of failures) console.error(`  · ${failure}`);
    process.exitCode = 1;
  } else {
    console.log('\n✓ A trilha explica a situação e oferece a troca de idioma.');
  }

  await browser.close();
  server.close();
}

main().catch((error) => {
  console.error('falha:', error.message);
  process.exit(1);
});
