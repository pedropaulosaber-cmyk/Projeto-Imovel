#!/usr/bin/env node
/**
 * Teste de fumaça da build web.
 *
 * Existe por causa de um bug real que passou por typecheck, lint e 169 testes
 * unitários e ainda assim entregou uma **tela branca em produção**:
 * `expo-sqlite` era importado estaticamente e explodia na avaliação do bundle
 * web, antes de qualquer checagem de plataforma.
 *
 * Nenhuma verificação estática pega isso. Só carregar o bundle num navegador de
 * verdade pega. Este script faz exatamente isso:
 *
 *   1. serve `dist/` num servidor HTTP local;
 *   2. abre no Chromium headless;
 *   3. falha se houver erro de página OU se `#root` continuar vazio.
 *
 * Rode sempre depois de `npm run build:web`, e no CI antes de qualquer deploy.
 */

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const DIST = path.resolve(__dirname, '..', 'dist');
const PORT = Number(process.env.VERIFY_PORT ?? 8099);
/** Tempo para o bundle baixar, avaliar e montar a primeira tela. */
const RENDER_WAIT_MS = 5000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ttf': 'font/ttf',
  '.woff2': 'font/woff2',
  '.wasm': 'application/wasm',
};

function findChromium() {
  const explicit = process.env.CHROMIUM_PATH;
  if (explicit && fs.existsSync(explicit)) return explicit;

  const root = process.env.PLAYWRIGHT_BROWSERS_PATH ?? '/opt/pw-browsers';
  if (!fs.existsSync(root)) return null;

  // O diretório vem versionado (chromium-1194), então procuramos por prefixo.
  const dir = fs
    .readdirSync(root)
    .filter((name) => name.startsWith('chromium-'))
    .sort()
    .pop();
  if (!dir) return null;

  const binary = path.join(root, dir, 'chrome-linux', 'chrome');
  return fs.existsSync(binary) ? binary : null;
}

function startServer() {
  const server = http.createServer((req, res) => {
    const urlPath = decodeURIComponent((req.url ?? '/').split('?')[0]);
    let filePath = path.join(DIST, urlPath);

    // SPA: qualquer rota desconhecida cai no index.html, igual ao rewrite
    // configurado em vercel.json.
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(DIST, 'index.html');
    }

    const body = fs.readFileSync(filePath);
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(filePath)] ?? 'application/octet-stream',
    });
    res.end(body);
  });

  return new Promise((resolve) => server.listen(PORT, '127.0.0.1', () => resolve(server)));
}

async function main() {
  if (!fs.existsSync(path.join(DIST, 'index.html'))) {
    console.error('✗ dist/index.html não existe. Rode `npm run build:web` antes.');
    process.exit(1);
  }

  let chromium;
  try {
    ({ chromium } = require('playwright-core'));
  } catch {
    console.warn('⚠ playwright-core não instalado — teste de fumaça pulado.');
    console.warn('  Instale com: npm i -D playwright-core');
    process.exit(0);
  }

  const executablePath = findChromium();
  if (!executablePath) {
    console.warn('⚠ Chromium não encontrado — teste de fumaça pulado.');
    console.warn('  Defina CHROMIUM_PATH ou PLAYWRIGHT_BROWSERS_PATH.');
    process.exit(0);
  }

  const server = await startServer();
  const browser = await chromium.launch({
    executablePath,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });

  const failures = [];

  try {
    const page = await browser.newPage();

    page.on('pageerror', (error) => failures.push(`erro de página: ${error.message}`));
    page.on('console', (message) => {
      if (message.type() === 'error') failures.push(`console.error: ${message.text()}`);
    });

    await page.goto(`http://127.0.0.1:${PORT}/`, {
      waitUntil: 'networkidle',
      timeout: 45_000,
    });
    await page.waitForTimeout(RENDER_WAIT_MS);

    const rootSize = await page.evaluate(
      () => document.getElementById('root')?.innerHTML.length ?? 0,
    );

    // A verificação decisiva: HTML servido não significa app renderizado.
    // Foi exatamente essa distinção que faltou da primeira vez.
    if (rootSize === 0) {
      failures.push('#root ficou vazio — o app não renderizou (tela branca).');
    }

    if (failures.length > 0) {
      console.error('\n✗ Build web com falhas:\n');
      for (const failure of failures) console.error(`  · ${failure}`);
      process.exitCode = 1;
    } else {
      console.log(
        `✓ Build web renderiza (#root com ${rootSize} bytes, nenhum erro de console).`,
      );
    }
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((error) => {
  console.error('✗ Falha ao rodar o teste de fumaça:', error.message);
  process.exit(1);
});
