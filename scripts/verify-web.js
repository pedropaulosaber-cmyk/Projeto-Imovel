#!/usr/bin/env node
/**
 * Teste de fumaça da build web.
 *
 * Existe por causa de dois bugs reais que passaram por typecheck, lint e a
 * suíte inteira de testes unitários e ainda assim entregaram **tela branca**:
 *
 *  1. `expo-sqlite` importado estaticamente, explodindo na avaliação do bundle.
 *  2. Um seletor de Zustand que devolvia objeto novo a cada chamada, causando
 *     "Maximum update depth exceeded" ao abrir a aba Progresso.
 *
 * O primeiro morria na primeira tela; o segundo só aparecia **depois de quatro
 * telas de onboarding e um clique numa aba específica**. Por isso este script
 * não se contenta em carregar a home: ele percorre o onboarding completo e
 * visita todas as abas, verificando a cada passo que a árvore React continua
 * viva.
 *
 * Rode sempre depois de `npm run build:web`, e no CI antes de qualquer deploy.
 */

const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const DIST = path.resolve(__dirname, '..', 'dist');
const PORT = Number(process.env.VERIFY_PORT ?? 8099);
/** Tempo para o bundle avaliar e a tela montar depois de cada interação. */
const SETTLE_MS = 900;

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

    // SPA: rota desconhecida cai no index.html, igual ao rewrite do vercel.json.
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

/**
 * Clica no elemento cujo texto contém `needle`.
 *
 * O `react-native-web` renderiza o rótulo dentro do card, não no elemento que
 * recebe o toque, então subimos pelos ancestrais até achar algo com papel
 * clicável. Sem isso, um clique no texto puro não dispara nada.
 */
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
  if (!fs.existsSync(path.join(DIST, 'index.html'))) {
    console.error('✗ dist/index.html não existe. Rode `npm run build:web` antes.');
    process.exit(1);
  }

  let chromium;
  try {
    ({ chromium } = require('playwright-core'));
  } catch {
    console.warn('⚠ playwright-core não instalado — teste de fumaça pulado.');
    process.exit(0);
  }

  const executablePath = findChromium();
  if (!executablePath) {
    console.warn('⚠ Chromium não encontrado — teste de fumaça pulado.');
    process.exit(0);
  }

  const server = await startServer();
  const browser = await chromium.launch({
    executablePath,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });

  const failures = [];
  let pending = [];

  try {
    const page = await browser.newPage({ viewport: { width: 420, height: 900 } });

    page.on('pageerror', (error) => pending.push(`erro de página: ${error.message}`));
    page.on('console', (message) => {
      if (message.type() === 'error')
        pending.push(`console.error: ${message.text().slice(0, 300)}`);
    });

    const tap = async (label) => {
      const found = await page.evaluate(CLICK_IN_PAGE, label);
      if (!found) failures.push(`não encontrou o alvo "${label}" — o fluxo mudou?`);
      await page.waitForTimeout(SETTLE_MS);
    };

    /** Verifica que a árvore React continua montada depois de cada passo. */
    const assertAlive = async (screen) => {
      const rootSize = await page.evaluate(
        () => document.getElementById('root')?.innerHTML.length ?? 0,
      );

      if (rootSize === 0) {
        failures.push(`"${screen}": #root vazio — tela branca.`);
      }
      for (const problem of pending) {
        failures.push(`"${screen}": ${problem}`);
      }
      pending = [];

      console.log(`  ${rootSize === 0 ? '✗' : '·'} ${screen.padEnd(22)} root=${rootSize}`);
    };

    await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle', timeout: 45_000 });
    await page.waitForTimeout(SETTLE_MS * 2);
    await assertAlive('landing');

    // Onboarding completo — é o caminho por onde todo usuário novo passa.
    await tap('Começar agora');
    await assertAlive('boas-vindas');

    await tap('Vamos começar');
    await assertAlive('setup: idioma');

    await tap('Inglês');
    await tap('Continuar');
    await assertAlive('setup: objetivo');

    await tap('Viajar');
    await tap('Continuar');
    await assertAlive('setup: nível');

    await tap('Do zero');
    await tap('Continuar');
    await assertAlive('setup: tempo');

    await tap('Leve');
    await tap('Continuar');
    await assertAlive('setup: dias');

    await tap('Continuar');
    await assertAlive('setup: nome');

    await tap('Ver meu plano');
    await assertAlive('plano gerado');

    await tap('Começar a estudar');
    await assertAlive('trilha');

    // Todas as abas. O bug do seletor só aparecia aqui.
    for (const tab of ['Praticar', 'Tutor', 'Progresso', 'Perfil', 'Aprender']) {
      await tap(tab);
      await assertAlive(`aba ${tab}`);
    }

    /**
     * Telas empilhadas, alcançadas a partir de uma aba.
     *
     * Cada uma abre de uma aba, precisa montar e precisa voltar sem derrubar a
     * árvore. Voltar importa tanto quanto abrir: o `router.back()` desmonta a
     * tela e é onde um efeito mal encerrado explode.
     */
    const visitFromTab = async (tab, label, screen) => {
      await tap(tab);
      await tap(label);
      await assertAlive(screen);
      await page.goBack();
      await page.waitForTimeout(SETTLE_MS);
      await assertAlive(`${screen} → voltar`);
    };

    await visitFromTab('Praticar', 'Expressões idiomáticas', 'expressões');
    await visitFromTab('Perfil', 'Meu nível', 'nível do curso');
    await visitFromTab('Perfil', 'Modo de aprendizado', 'modo de aprendizado');

    // Apostilas vai um nível mais fundo: a lista abre o leitor, que é rota
    // dinâmica (`workbook/[id]`) e carrega o documento do banco local.
    await tap('Praticar');
    await tap('Apostilas');
    await assertAlive('apostilas');
    await tap('Abrir');
    await assertAlive('leitor de apostila');
    await page.goBack();
    await page.waitForTimeout(SETTLE_MS);
    await assertAlive('leitor → voltar');

    if (failures.length > 0) {
      console.error('\n✗ Build web com falhas:\n');
      for (const failure of failures) console.error(`  · ${failure}`);
      process.exitCode = 1;
    } else {
      console.log('\n✓ Onboarding e todas as abas renderizam sem erro.');
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
