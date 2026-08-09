import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../src/generated/prisma/client';

/**
 * Seed de PRODUÇÃO
 * ================
 *
 * Só categorias. Nenhuma conta, nenhum produto, nenhum pedido.
 *
 * ## Por que só isto
 *
 * Categoria é a única coisa que a aplicação genuinamente precisa existir antes
 * do primeiro usuário: sem elas, o formulário de "novo produto" tem um select
 * vazio e ninguém consegue publicar nada. Não é dado de exemplo, é
 * configuração do produto — o equivalente a criar as prateleiras de uma loja
 * antes de abrir, não a colocar mercadoria fingida nelas.
 *
 * Contas, produtos e avaliações fictícios ficam em `prisma/seed-dev.ts`, que
 * roda apenas em ambiente local. Uma conta com senha conhecida e documentada
 * publicamente (a de desenvolvimento) não pode existir num banco que serve
 * usuários reais — é a diferença entre "dado de teste" e "porta destrancada".
 *
 * ## Idempotente
 *
 * `upsert` por `slug`: rodar de novo não duplica.
 */

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const CATEGORIES = [
  {
    slug: 'atendimento',
    name: 'Atendimento e suporte',
    description: 'Agentes de resposta, triagem de tickets e roteamento multicanal.',
    position: 0,
  },
  {
    slug: 'vendas',
    name: 'Vendas e CRM',
    description: 'Qualificação de leads, follow-up automático e enriquecimento de base.',
    position: 1,
  },
  {
    slug: 'financeiro',
    name: 'Financeiro e cobrança',
    description: 'Conciliação, régua de cobrança e emissão de documentos fiscais.',
    position: 2,
  },
  {
    slug: 'marketing',
    name: 'Marketing e conteúdo',
    description: 'Geração de campanhas, SEO programático e produção em escala.',
    position: 3,
  },
  {
    slug: 'operacoes',
    name: 'Operações e back-office',
    description: 'Extração de documentos, entrada de dados e integração entre sistemas.',
    position: 4,
  },
  {
    slug: 'dados',
    name: 'Dados e análise',
    description: 'Pipelines, previsão de churn e relatórios que se escrevem sozinhos.',
    position: 5,
  },
] as const;

async function main() {
  console.log('Semeando categorias de produção…');

  for (const category of CATEGORIES) {
    await prisma.productCategory.upsert({
      where: { slug: category.slug },
      create: category,
      update: { name: category.name, description: category.description, position: category.position },
    });
  }

  console.log(`Pronto: ${CATEGORIES.length} categorias.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
