import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

/**
 * Vitest.
 *
 * Ambiente `node`: os testes cobrem domínio e servidor, que é onde as regras
 * que importam vivem. Teste de componente com DOM simulado verifica que o
 * React renderiza React; o que decide se o produto está correto é se o preço
 * sai do banco e se o ownership é conferido.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // Os testes de integração compartilham um Postgres real e escrevem nas
    // mesmas tabelas. Em paralelo, um apagaria o dado do outro no meio da
    // asserção — daí a execução em série.
    fileParallelism: false,
    testTimeout: 20_000,
  },
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, 'src'),
      /*
       * `server-only` existe para quebrar o **build** se um módulo de servidor
       * for importado por um Client Component. Fora do bundler do Next ele não
       * tem como saber a diferença e simplesmente lança, o que impediria
       * testar exatamente os módulos que mais precisam de teste.
       *
       * O alias o troca por um módulo vazio nos testes. A proteção real
       * continua onde importa: `next build` roda com o pacote de verdade.
       */
      'server-only': resolve(import.meta.dirname, 'src/test/server-only-stub.ts'),
    },
  },
});
