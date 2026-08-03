/**
 * Captura de tela para revisão visual.
 *
 * O `verify:web` responde "quebrou?". Esta ferramenta responde "ficou bom?" —
 * e essa segunda pergunta nenhum `expect` consegue responder. Redesenho sem
 * olhar o resultado é redesenho no escuro.
 *
 * Uso: node scripts/shoot.js [pasta-de-saída]
 */

const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const { chromium } = require('playwright-core');

const PORT = 4319;
const DIST = path.join(__dirname, '..', 'dist');
const OUT = process.argv[2] || path.join(__dirname, '..', '.shots');
const SETTLE = 700;

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
};

/** Roda dentro da página: acha o texto e clica no ancestral que é tocável. */
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

function startServer() {
  const server = http.createServer((req, res) => {
    const url = decodeURIComponent((req.url || '/').split('?')[0]);
    let file = path.join(DIST, url);

    // Export SPA: qualquer rota desconhecida devolve o index.
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      file = path.join(DIST, 'index.html');
    }

    const body = fs.readFileSync(file);
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(file)] || 'application/octet-stream',
    });
    res.end(body);
  });

  return new Promise((resolve) => server.listen(PORT, '127.0.0.1', () => resolve(server)));
}

function findChromium() {
  const root = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';
  if (!fs.existsSync(root)) return null;
  for (const entry of fs.readdirSync(root)) {
    const candidate = path.join(root, entry, 'chrome-linux', 'chrome');
    if (fs.existsSync(candidate)) return candidate;
  }
  const flat = path.join(root, 'chromium');
  return fs.existsSync(flat) ? flat : null;
}

async function main() {
  const executablePath = findChromium();
  if (!executablePath) throw new Error('Chromium não encontrado.');

  fs.mkdirSync(OUT, { recursive: true });
  const server = await startServer();
  const browser = await chromium.launch({ executablePath, args: ['--no-sandbox'] });

  try {
    const page = await browser.newPage({
      viewport: { width: 420, height: 900 },
      deviceScaleFactor: 2,
    });

    const shot = async (name) => {
      await page.waitForTimeout(SETTLE);
      await page.screenshot({ path: path.join(OUT, `${name}.png`) });
      console.log(`  · ${name}.png`);
    };

    // Mesmo mecanismo do verify:web: no React Native Web o nó de texto não é
    // clicável — quem responde ao toque é um ancestral com `role`. Um clique
    // direto no texto não dispara nada.
    const tap = async (label) => {
      const found = await page.evaluate(CLICK_IN_PAGE, label);
      if (!found) throw new Error(`alvo não encontrado: "${label}"`);
      await page.waitForTimeout(SETTLE);
    };

    await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle', timeout: 45_000 });
    await page.waitForTimeout(SETTLE * 2);
    await shot('00-landing');

    // Onboarding, mesmo caminho do verify:web.
    await tap('Começar agora');
    await shot('01-boas-vindas');
    await tap('Vamos começar');
    await tap('Inglês');
    await tap('Continuar');
    await tap('Viajar');
    await tap('Continuar');
    await tap('Do zero');
    await tap('Continuar');
    await tap('Leve');
    await tap('Continuar');
    await tap('Continuar');
    await shot('02-onboarding-nome');
    await tap('Ver meu plano');
    await shot('03-plano');
    await tap('Começar a estudar');
    await shot('04-aprender');

    for (const [tab, name] of [
      ['Praticar', '05-praticar'],
      ['Tutor', '06-tutor'],
      ['Progresso', '07-progresso'],
      ['Perfil', '08-perfil'],
      ['Aprender', '09-aprender'],
    ]) {
      await tap(tab);
      await shot(name);
    }

    // A trilha depois de trocar de idioma: vale ver que a cena e o conteúdo
    // acompanham a troca, e não só o rótulo no topo.
    await tap('Perfil');
    await tap('Alemão');
    await tap('Aprender');
    await shot('10-aprender-alemao');

    console.log(`\n✓ Capturas em ${OUT}`);
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
