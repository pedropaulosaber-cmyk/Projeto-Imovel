import 'dotenv/config';

import { defineConfig } from 'prisma/config';

/**
 * Configuração do Prisma CLI.
 *
 * A partir do Prisma 7 a URL de conexão sai do `schema.prisma` e vem para cá.
 * A separação é boa: o schema passa a descrever só a forma dos dados, e o
 * endereço do banco — que muda entre máquina local, CI, staging e produção —
 * fica num arquivo que nunca é versionado com valor real.
 *
 * ## Por que `process.env` cru e não o helper `env()` do Prisma
 *
 * O helper **lança** quando a variável não existe, e ele é avaliado ao carregar
 * este arquivo — ou seja, em *qualquer* comando do Prisma, inclusive
 * `prisma generate`, que só lê o schema e escreve o cliente sem nunca abrir
 * conexão.
 *
 * Isso quebrou um build de produção de verdade: o Vercel roda
 * `prisma generate` como parte de `npm run build`, e o comando morria com
 * `PrismaConfigEnvError` antes mesmo de compilar uma linha da aplicação. O erro
 * apontava para a configuração do Prisma quando o que faltava era outra coisa.
 *
 * Com `process.env` cru, a ausência é `undefined` e cada comando decide se
 * aquilo é problema: `generate` segue em frente, `migrate` falha com a mensagem
 * do próprio Prisma sobre conexão. A validação séria da variável continua onde
 * ela protege de fato — em `src/config/env.ts`, que roda quando a aplicação
 * sobe.
 */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL,
  },
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
});
