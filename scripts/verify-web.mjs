#!/usr/bin/env node
/**
 * Verificação da aplicação num navegador de verdade
 * ==================================================
 *
 * Existe porque typecheck, lint e teste unitário passam com folga em cima de
 * uma tela branca. Erro de hidratação, Server Component importado do lado
 * errado, componente que estoura no render — nada disso aparece nas checagens
 * estáticas, e qualquer um deles derruba a página inteira em produção.
 *
 * O script sobe a build de produção, percorre as rotas públicas e o fluxo
 * autenticado num Chromium real, e falha se qualquer página montar vazia,
 * registrar erro de console, deixar passar uma rota protegida ou rolar na
 * horizontal no celular.
 */

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const PORT = Number(process.env.VERIFY_PORT ?? 3210);
const BASE = `http://127.0.0.1:${PORT}`;
const SETTLE = 900;

/*
 * As navegações usam `domcontentloaded`, não `networkidle`.
 *
 * O App Router faz prefetch das rotas visíveis, então uma página com muitos
 * links **nunca** fica com a rede ociosa — `networkidle` estoura o tempo numa
 * página perfeitamente saudável. O que se quer medir aqui é "a página montou e
 * não gritou", e para isso o DOM pronto mais um intervalo de acomodação é a
 * medida certa.
 */

function findChromium() {
  const root = process.env.PLAYWRIGHT_BROWSERS_PATH ?? '/opt/pw-browsers';
  if (!fs.existsSync(root)) return null;
  const dir = fs.readdirSync(root).filter((n) => n.startsWith('chromium-')).sort().pop();
  if (!dir) return null;
  const binary = path.join(root, dir, 'chrome-linux', 'chrome');
  return fs.existsSync(binary) ? binary : null;
}

async function waitForServer(timeoutMs = 90_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${BASE}/api/health`);
      if (response.ok) return true;
    } catch {
      // servidor ainda subindo
    }
    await new Promise((resolve) => setTimeout(resolve, 700));
  }
  return false;
}

const PUBLIC_ROUTES = [
  ['/', 'home'],
  ['/products', 'vitrine'],
  ['/products?q=agente&sort=recent', 'vitrine filtrada'],
  ['/professionals', 'profissionais'],
  ['/demands', 'demandas'],
  ['/sell', 'vender'],
  ['/login', 'entrar'],
  ['/register', 'cadastro'],
  ['/privacy', 'privacidade'],
  ['/terms', 'termos'],
  ['/support', 'suporte'],
  ['/rota-que-nao-existe', '404'],
];

const AUTHENTICATED_ROUTES = [
  ['/dashboard/products', 'painel: produtos'],
  ['/dashboard/orders', 'painel: pedidos'],
  ['/dashboard/earnings', 'painel: receitas'],
  ['/dashboard/customers', 'painel: clientes'],
  ['/dashboard/profile', 'painel: perfil'],
  ['/library', 'biblioteca'],
  ['/favorites', 'favoritos'],
  ['/notifications', 'notificações'],
  ['/demands/new', 'nova demanda'],
  ['/dashboard/products/new', 'novo produto'],
];

async function main() {
  let chromium;
  try {
    ({ chromium } = await import('playwright-core'));
  } catch {
    console.warn('⚠ playwright-core ausente — verificação pulada.');
    process.exit(0);
  }

  const executablePath = findChromium();
  if (!executablePath) {
    console.warn('⚠ Chromium não encontrado — verificação pulada.');
    process.exit(0);
  }

  /*
   * O `output: 'standalone'` copia só o servidor e as dependências; os
   * arquivos estáticos e o `public/` ficam de fora de propósito, porque em
   * produção quem os serve é o CDN.
   *
   * A cópia acontece **aqui**, e não num passo manual, porque um passo manual
   * envelhece: bastou uma vez esquecer de recopiar depois do build para a
   * verificação inteira reprovar por 404 de chunk, apontando para um defeito
   * que não existia.
   */
  fs.rmSync('.next/standalone/.next/static', { recursive: true, force: true });
  fs.cpSync('.next/static', '.next/standalone/.next/static', { recursive: true });
  if (fs.existsSync('public')) {
    fs.cpSync('public', '.next/standalone/public', { recursive: true });
  }

  const server = spawn('node', ['.next/standalone/server.js'], {
    env: { ...process.env, PORT: String(PORT), HOSTNAME: '127.0.0.1' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  const serverLog = [];
  server.stdout.on('data', (chunk) => serverLog.push(String(chunk)));
  server.stderr.on('data', (chunk) => serverLog.push(String(chunk)));

  const failures = [];

  try {
    if (!(await waitForServer())) {
      console.error('✗ O servidor não respondeu.\n', serverLog.join('').slice(-2000));
      process.exit(1);
    }

    const browser = await chromium.launch({
      executablePath,
      args: ['--no-sandbox', '--disable-dev-shm-usage'],
    });

    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();

    let pending = [];
    page.on('pageerror', (error) => pending.push(`erro de página: ${error.message}`));
    page.on('console', (message) => {
      if (message.type() !== 'error') return;
      const text = message.text();
      // Eco do 404 deliberado — a origem já é filtrada no manipulador de
      // resposta abaixo, e aqui a mensagem não traz URL para distinguir.
      if (text.includes('Failed to load resource') && text.includes('404')) return;
      pending.push(`console.error: ${text.slice(0, 240)}`);
    });
    /*
     * Falhas de rede viram falha da verificação — mas só as de **sub-recurso**.
     *
     * O documento principal é ignorado porque a suíte navega de propósito para
     * uma rota inexistente, para conferir que a página 404 renderiza. Tratar
     * esse 404 como defeito faria a verificação reprovar justamente quando o
     * comportamento está certo. O que não pode falhar é o resto: um chunk, uma
     * folha de estilo ou uma fonte que não carrega derruba a página de verdade.
     *
     * O texto do console diz apenas "Failed to load resource"; sem a URL, um
     * 404 de asset vira caça ao tesouro. Daí registrar o endereço.
     */
    page.on('response', (response) => {
      if (response.status() < 400) return;
      if (response.request().resourceType() === 'document') return;
      pending.push(`HTTP ${response.status()} em ${response.url()}`);
    });

    const check = async (label) => {
      const size = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
      if (size < 80) failures.push(`"${label}": página praticamente vazia (${size} caracteres).`);
      for (const problem of pending) failures.push(`"${label}": ${problem}`);
      pending = [];
      console.log(`  ${size < 80 ? '✗' : '·'} ${label.padEnd(24)} texto=${size}`);
    };

    console.log('\nRotas públicas (desktop)');
    for (const [route, label] of PUBLIC_ROUTES) {
      await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded', timeout: 45_000 });
      await page.waitForTimeout(SETTLE);
      await check(label);
    }

    console.log('\nPáginas de detalhe (dado real do catálogo)');
    await page.goto(`${BASE}/products`, { waitUntil: 'domcontentloaded' });
    const firstProduct = await page.evaluate(() => {
      const link = document.querySelector('a[href^="/products/"]');
      return link ? link.getAttribute('href') : null;
    });

    if (!firstProduct) {
      failures.push('a vitrine não listou nenhum produto — o seed rodou?');
    } else {
      await page.goto(`${BASE}${firstProduct}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(SETTLE);
      await check('detalhe do produto');

      const hasStructuredData = await page.evaluate(
        () => document.querySelectorAll('script[type="application/ld+json"]').length > 0,
      );
      if (!hasStructuredData) failures.push('a página de produto não emitiu dado estruturado.');
    }

    await page.goto(`${BASE}/professionals`, { waitUntil: 'domcontentloaded' });
    const firstPro = await page.evaluate(() => {
      const link = document.querySelector('a[href^="/professionals/"]');
      return link ? link.getAttribute('href') : null;
    });
    if (firstPro) {
      await page.goto(`${BASE}${firstPro}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(SETTLE);
      await check('perfil profissional');
    }

    await page.goto(`${BASE}/demands`, { waitUntil: 'domcontentloaded' });
    const firstDemand = await page.evaluate(() => {
      const link = document.querySelector('a[href^="/demands/c"]');
      return link ? link.getAttribute('href') : null;
    });
    if (firstDemand) {
      await page.goto(`${BASE}${firstDemand}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(SETTLE);
      await check('detalhe da demanda');
    }

    console.log('\nProteção de rota');
    await page.goto(`${BASE}/dashboard`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(SETTLE);
    if (!page.url().includes('/login')) {
      failures.push('/dashboard sem sessão NÃO redirecionou para o login.');
    } else {
      console.log('  · /dashboard sem sessão      → redirecionou para o login');
    }
    pending = [];

    console.log('\nFluxo autenticado');
    await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
    await page.fill('input[name="email"]', 'mariana@exemplo.com.br');
    await page.fill('input[name="password"]', 'automatize-dev-2026');
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 30_000 });
    await page.waitForTimeout(SETTLE);
    await check('painel após login');

    for (const [route, label] of AUTHENTICATED_ROUTES) {
      await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(SETTLE);
      await check(label);
    }

    // Conta sem papel de administrador não pode abrir a administração.
    await page.goto(`${BASE}/admin`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(SETTLE);
    const adminText = await page.evaluate(() => document.body.innerText);
    if (adminText.includes('Fila de moderação')) {
      failures.push('conta sem papel ADMIN conseguiu abrir o painel administrativo.');
    } else {
      console.log('  · /admin sem papel de admin  → bloqueado');
    }
    pending = [];

    console.log('\nMobile (390×844)');
    const mobile = await context.newPage();
    await mobile.setViewportSize({ width: 390, height: 844 });

    for (const [route, label] of [
      ['/', 'home'],
      ['/products', 'vitrine'],
      ['/professionals', 'profissionais'],
      ['/sell', 'vender'],
    ]) {
      await mobile.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded' });
      await mobile.waitForTimeout(SETTLE);

      const size = await mobile.evaluate(() => document.body?.innerText?.trim().length ?? 0);

      /*
       * Rolagem horizontal no celular é o defeito de responsividade mais comum
       * e o mais visível: um elemento largo demais empurra a página inteira.
       *
       * A comparação é `scrollWidth` contra `clientWidth`, e não contra
       * `innerWidth`: `innerWidth` inclui a barra de rolagem vertical, o que
       * produz falso positivo em página longa. Quando há estouro, o script diz
       * **qual** elemento estourou — um "overflow=true" sem culpado obriga a
       * caçar o elemento à mão, e é assim que o aviso acaba ignorado.
       */
      const overflow = await mobile.evaluate(() => {
        const root = document.documentElement;
        if (root.scrollWidth <= root.clientWidth + 1) return null;

        // Só o elemento **mais interno** que estoura: o pai sempre estoura
        // junto, e reportar o pai manda quem for corrigir para o lugar errado.
        for (const element of document.querySelectorAll('*')) {
          const box = element.getBoundingClientRect();
          const overflows = box.right > root.clientWidth + 1 || box.left < -1;
          if (!overflows) continue;

          const childOverflows = [...element.children].some((child) => {
            const childBox = child.getBoundingClientRect();
            return childBox.right > root.clientWidth + 1 || childBox.left < -1;
          });
          if (childOverflows) continue;

          /*
           * O elemento que estoura raramente é o que está errado — ele
           * costuma ser esticado por um ancestral cuja largura mínima não
           * cabe. Por isso o relatório sobe a cadeia registrando largura e
           * `display`: é essa sequência que mostra onde a largura foi
           * decidida, e sem ela a correção vira tentativa e erro.
           */
          const chain = [];
          let node = element;
          while (node && node !== document.body && chain.length < 7) {
            const nodeBox = node.getBoundingClientRect();
            const style = getComputedStyle(node);
            chain.push(
              `${node.tagName.toLowerCase()}[${Math.round(nodeBox.width)}px ${style.display}` +
                `${style.gridTemplateColumns !== 'none' ? ` cols=${style.gridTemplateColumns}` : ''}]`,
            );
            node = node.parentElement;
          }

          return (
            `<${element.tagName.toLowerCase()} class="${String(element.className).slice(0, 55)}"> ` +
            `x=${Math.round(box.left)}..${Math.round(box.right)} (viewport ${root.clientWidth})\n` +
            `      cadeia: ${chain.join(' ← ')}`
          );
        }
        return 'elemento não identificado';
      });

      if (size < 80) failures.push(`"mobile ${label}": página vazia.`);
      if (overflow) failures.push(`"mobile ${label}": rola na horizontal por causa de ${overflow}`);
      console.log(
        `  ${overflow || size < 80 ? '✗' : '·'} ${label.padEnd(24)} texto=${size} overflow=${overflow ?? 'não'}`,
      );
    }

    await mobile.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
    await mobile.click('button[aria-controls="menu-mobile"]');
    await mobile.waitForTimeout(400);
    const menuOpen = await mobile.evaluate(() => Boolean(document.getElementById('menu-mobile')));
    if (!menuOpen) failures.push('o menu móvel não abriu.');
    else console.log('  · menu móvel                 → abriu');

    await browser.close();
  } finally {
    server.kill('SIGTERM');
  }

  if (failures.length > 0) {
    console.error('\n✗ Verificação falhou:\n');
    for (const failure of failures) console.error(`  · ${failure}`);
    process.exit(1);
  }

  console.log('\n✓ Rotas renderizam, proteção funciona e o mobile não estoura.');
}

main().catch((error) => {
  console.error('falha:', error);
  process.exit(1);
});
