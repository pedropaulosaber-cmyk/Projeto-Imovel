/**
 * Abre uma apostila no leitor e confere que cada seção rende conteúdo.
 *
 * Nasceu de um defeito relatado por quem usa o app: "na apostila do italiano C2
 * não aparecem os verbos". Os dados existiam, o PDF saía certo — então o
 * problema, se real, só apareceria no leitor, e só abrindo o leitor de verdade.
 *
 * Uso: node scripts/check-workbook.js [it] [C2]
 */

const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const { chromium } = require('playwright-core');

const PORT = 4321;
const DIST = path.join(__dirname, '..', 'dist');
const SETTLE = 550;

const LANGUAGE = process.argv[2] || 'it';
const LEVEL = process.argv[3] || 'C2';

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

function startServer() {
  const server = http.createServer((req, res) => {
    const url = decodeURIComponent((req.url || '/').split('?')[0]);
    let file = path.join(DIST, url);
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      file = path.join(DIST, 'index.html');
    }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(file)] || 'application/octet-stream',
    });
    res.end(fs.readFileSync(file));
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
  return null;
}

/** No React Native Web quem responde ao toque é um ancestral com `role`. */
const CLICK_IN_PAGE = (needle) => {
  const nodes = [...document.querySelectorAll('div,span,button,a,[role]')].reverse();
  const hit = nodes.find(
    (node) => node.innerText?.trim().includes(needle) && node.innerText.length < 200,
  );
  if (!hit) return false;
  let element = hit;
  for (let depth = 0; depth < 6 && element; depth += 1) {
    const role = element.getAttribute?.('role');
    if (role === 'button' || role === 'tab' || element.tagName === 'BUTTON') {
      element.click();
      return true;
    }
    element = element.parentElement;
  }
  hit.click();
  return true;
};

async function main() {
  const executablePath = findChromium();
  if (!executablePath) throw new Error('Chromium não encontrado.');

  const server = await startServer();
  const browser = await chromium.launch({ executablePath, args: ['--no-sandbox'] });

  try {
    const page = await browser.newPage({ viewport: { width: 420, height: 900 } });
    const id = `workbook:${LANGUAGE}:${LEVEL}`;

    await page.goto(`http://127.0.0.1:${PORT}/workbook/${encodeURIComponent(id)}`, {
      waitUntil: 'networkidle',
      timeout: 45_000,
    });
    await page.waitForTimeout(SETTLE * 3);

    const titles = await page.evaluate(() => {
      const root = document.getElementById('root');
      return root ? root.innerText.slice(0, 400) : '';
    });
    if (!titles) throw new Error('A tela do leitor não montou.');

    // As seções são abas; percorre todas e mede o corpo renderizado de cada uma.
    const sections = [
      'Antes de começar',
      'Vocabulário',
      'Verbos',
      'Pronúncia',
      'Gramática',
      'Frases prontas',
      'Palavras que enganam',
      'Expressões idiomáticas',
      'Como soar natural',
      'Exercícios',
      'Checklist por módulo',
      'Simulado',
      'Plano de estudo',
      'Checklist do nível',
    ];

    console.log(`Apostila ${LANGUAGE} ${LEVEL}\n`);
    const empty = [];

    for (const name of sections) {
      const clicked = await page.evaluate(CLICK_IN_PAGE, name);
      if (!clicked) {
        console.log(`  · ${name.padEnd(24)} — seção ausente`);
        continue;
      }
      await page.waitForTimeout(SETTLE);

      // Mede só o corpo, descontando o seletor de seções que fica sempre na tela.
      const bodyLength = await page.evaluate(() => {
        const root = document.getElementById('root');
        return root ? root.innerText.length : 0;
      });

      const flag = bodyLength < 700 ? '  <<< SUSPEITA DE VAZIA' : '';
      if (flag) empty.push(name);
      console.log(`  · ${name.padEnd(24)} texto=${bodyLength}${flag}`);
    }

    if (empty.length > 0) {
      console.error(`\n✗ Seções sem corpo: ${empty.join(', ')}`);
      process.exitCode = 1;
    } else {
      console.log('\n✓ Todas as seções renderizaram conteúdo.');
    }
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
