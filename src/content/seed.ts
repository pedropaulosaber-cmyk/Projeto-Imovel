/**
 * Semeadura do conteúdo offline.
 *
 * Roda na inicialização e é **idempotente**: compara a versão do conteúdo
 * gravada localmente com a versão do binário e só reescreve quando há
 * novidade. Sem essa guarda, cada abertura do app reescreveria milhares de
 * linhas — I/O puro, bateria queimada e nenhuma mudança visível.
 */

import { getDatabase } from '@/db';
import { COLLECTION, type KeyValueDoc } from '@/db/collections';
import { contentRepository } from '@/db/repositories/content';
import { libraryRepository } from '@/db/repositories/library';
import { type ContentBundle, type LanguageCode, SUPPORTED_LANGUAGES } from '@/domain/types';
import { buildAllContent } from './courses';
import { buildAllIdioms } from './idioms';
import { buildAllWorkbooks } from './workbooks';

/**
 * Incrementar esta constante força a re-semeadura em todos os dispositivos na
 * próxima abertura. Deve subir sempre que o conteúdo gerado mudar.
 */
export const SEED_VERSION = 4;

const SEED_KEY = 'content_seed_version';

export async function seedContentIfNeeded(): Promise<{ seeded: boolean; version: number }> {
  const db = getDatabase();
  const stored = await db.get<KeyValueDoc>(COLLECTION.keyValue, SEED_KEY);
  const currentVersion = stored ? Number(stored.value) : 0;

  if (currentVersion >= SEED_VERSION) {
    return { seeded: false, version: currentVersion };
  }

  const content = buildAllContent([...SUPPORTED_LANGUAGES]);

  // Tudo numa transação: um app que morre no meio da semeadura não pode ficar
  // com metade dos exercícios de uma lição.
  await db.transaction(async () => {
    await contentRepository.saveCourses(content.courses);
    await contentRepository.saveModules(content.modules);
    await contentRepository.saveLessons(content.lessons);
    await contentRepository.saveExercises(content.exercises);
    await contentRepository.saveVocabulary(content.vocabulary);

    // Apostilas e expressões são geradas das mesmas fontes das lições, então
    // nunca saem de sincronia com a trilha.
    await libraryRepository.saveWorkbooks(buildAllWorkbooks([...SUPPORTED_LANGUAGES]));
    await libraryRepository.saveIdioms(buildAllIdioms([...SUPPORTED_LANGUAGES]));

    await db.putMany(COLLECTION.contentBundles, buildBundles());

    await db.put<KeyValueDoc>(COLLECTION.keyValue, {
      id: SEED_KEY,
      value: String(SEED_VERSION),
      updatedAt: Date.now(),
    });
  });

  return { seeded: true, version: SEED_VERSION };
}

/**
 * Catálogo de pacotes baixáveis.
 *
 * Os tamanhos são estimativas de produção (conteúdo + áudio) e existem para
 * que o usuário decida com informação antes de gastar dados móveis. Áudio em
 * alta qualidade pesa ~3× mais que o padrão, e essa escolha é dele.
 */
function buildBundles(): ContentBundle[] {
  const bundles: ContentBundle[] = [];

  for (const language of SUPPORTED_LANGUAGES) {
    bundles.push({
      id: `bundle:${language}:full`,
      language,
      scope: 'language',
      scopeId: null,
      title: 'Idioma completo',
      sizeBytes: { standard: 148 * 1024 * 1024, high: 412 * 1024 * 1024 },
      contentVersion: SEED_VERSION,
    });

    bundles.push({
      id: `bundle:${language}:a1`,
      language,
      scope: 'course',
      scopeId: `course:${language}:A1`,
      title: 'Curso A1 · Fundamentos',
      sizeBytes: { standard: 42 * 1024 * 1024, high: 118 * 1024 * 1024 },
      contentVersion: SEED_VERSION,
    });

    bundles.push({
      id: `bundle:${language}:audio`,
      language,
      scope: 'audio',
      scopeId: null,
      title: 'Somente áudios',
      sizeBytes: { standard: 96 * 1024 * 1024, high: 288 * 1024 * 1024 },
      contentVersion: SEED_VERSION,
    });
  }

  return bundles;
}

/** Força a re-semeadura. Usado no menu de desenvolvedor e após "limpar dados". */
export async function resetSeed(): Promise<void> {
  await getDatabase().delete(COLLECTION.keyValue, SEED_KEY);
}

/** Idiomas que têm conteúdo disponível localmente agora. */
export async function availableLanguages(): Promise<LanguageCode[]> {
  const results = await Promise.all(
    SUPPORTED_LANGUAGES.map(async (language) => {
      const courses = await contentRepository.listCourses(language);
      return courses.length > 0 ? language : null;
    }),
  );
  return results.filter((language): language is LanguageCode => language !== null);
}
