import coreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

/**
 * Regras de lint.
 *
 * As poucas regras adicionadas sobre o preset do Next existem para impedir
 * classes de defeito que já custaram caro em produtos parecidos: `any` que
 * apaga a tipagem exatamente onde ela protegia, promessa não aguardada dentro
 * de Server Action (a ação retorna sucesso antes de a escrita terminar) e
 * `console.log` esquecido derramando dado de usuário no log.
 */
const config = [
  // Config plana nativa do `eslint-config-next`. A ponte `FlatCompat` também
  // funcionaria em teoria, mas o preset do Next tem referência circular entre
  // plugins e ela quebra ao serializar — vale usar o formato nativo.
  ...coreWebVitals,
  ...nextTypescript,
  {
    ignores: ['.next/**', 'node_modules/**', 'src/generated/**', 'next-env.d.ts'],
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'react/no-unescaped-entities': 'off',
      eqeqeq: ['error', 'always'],
      'prefer-const': 'error',
    },
  },
  {
    /*
     * A camada de apresentação não fala com o banco.
     *
     * A regra vale só para `app/`, `components/` e `features/` — os services e
     * a infraestrutura em `server/` **são** quem usa o Prisma, e proibi-los
     * seria proibir a própria camada que a regra existe para proteger.
     *
     * O que ela impede é o atalho tentador: um Server Component consultando o
     * banco direto e, com isso, pulando a checagem de ownership que mora no
     * service. Toda vulnerabilidade de IDOR começa com esse atalho.
     */
    files: ['src/app/**/*.{ts,tsx}', 'src/components/**/*.{ts,tsx}', 'src/features/**/*.{ts,tsx}'],
    ignores: ['src/app/api/**', 'src/app/sitemap.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/server/db/prisma', '**/server/db/prisma'],
              message:
                'A camada de apresentação não consulta o banco direto. Use um service em @/server/services — é lá que ownership e validação são checados.',
            },
          ],
        },
      ],
    },
  },
  {
    // Seed e scripts de verificação **são** ferramentas de linha de comando:
    // a saída no terminal é o produto deles, não um resto de depuração.
    files: ['prisma/**/*.ts', 'scripts/**/*.mjs'],
    rules: { 'no-console': 'off' },
  },
];

export default config;
