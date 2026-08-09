import 'dotenv/config';

import { defineConfig, env } from 'prisma/config';

/**
 * Configuração do Prisma CLI.
 *
 * A partir do Prisma 7 a URL de conexão sai do `schema.prisma` e vem para cá.
 * A separação é boa: o schema passa a descrever só a forma dos dados, e o
 * endereço do banco — que muda entre máquina local, CI, staging e produção —
 * fica num arquivo que nunca é versionado com valor real.
 */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: env('DATABASE_URL'),
  },
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
});
