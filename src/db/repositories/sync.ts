/**
 * Fila de saída da sincronização (outbox pattern).
 *
 * Toda escrita do usuário grava no banco local **e** enfileira uma operação
 * aqui, na mesma transação. O motor de sincronização drena a fila quando há
 * rede. Isso dá três garantias:
 *
 *  1. **Durabilidade** — a intenção sobrevive a fechar o app, ficar sem
 *     bateria ou passar uma semana offline.
 *  2. **Ordem** — o relógio lógico monotônico preserva a ordem causal das
 *     mutações mesmo quando enviadas em lote muito depois.
 *  3. **Idempotência** — cada operação carrega o id do registro, então
 *     reenviar é um upsert, não uma duplicata.
 */

import type { ID, SyncOperation } from '@/domain/types';
import { ulid } from '@/lib/id';
import { COLLECTION, type KeyValueDoc } from '../collections';
import { getDatabase } from '../index';

const CLOCK_KEY = 'sync_clock';
const LAST_SYNC_KEY = 'sync_last_at';

/** Cache do relógio para não ler o disco a cada enfileiramento. */
let cachedClock: number | null = null;

async function nextClock(): Promise<number> {
  if (cachedClock === null) {
    const doc = await getDatabase().get<KeyValueDoc>(COLLECTION.keyValue, CLOCK_KEY);
    cachedClock = doc ? Number(doc.value) || 0 : 0;
  }

  cachedClock += 1;
  await getDatabase().put<KeyValueDoc>(COLLECTION.keyValue, {
    id: CLOCK_KEY,
    value: String(cachedClock),
    updatedAt: Date.now(),
  });

  return cachedClock;
}

export const syncRepository = {
  /**
   * Enfileira uma mutação.
   *
   * **Coalescência**: se já existe uma operação pendente para o mesmo
   * (entidade, id), ela é substituída em vez de acumulada. Sem isso, uma
   * sessão de revisão de 80 itens geraria 80 operações para o mesmo registro
   * de estatística diária — e o servidor receberia 79 estados intermediários
   * que ninguém precisa.
   */
  async enqueue(
    entity: string,
    entityId: ID,
    op: SyncOperation['op'],
    payload: unknown,
  ): Promise<void> {
    const db = getDatabase();

    const existing = await db.first<SyncOperation>(COLLECTION.syncQueue, {
      where: [
        { field: 'entity', op: '=', value: entity },
        { field: 'entityId', op: '=', value: entityId },
      ],
    });

    const operation: SyncOperation = {
      id: existing?.id ?? ulid(),
      entity,
      entityId,
      op,
      payload: JSON.stringify(payload),
      clock: await nextClock(),
      createdAt: existing?.createdAt ?? Date.now(),
      attempts: 0,
      lastError: null,
    };

    await db.put(COLLECTION.syncQueue, operation);
  },

  /** Próximo lote a enviar, em ordem causal. */
  async nextBatch(limit = 50): Promise<SyncOperation[]> {
    return getDatabase().query<SyncOperation>(COLLECTION.syncQueue, {
      orderBy: [{ field: 'clock', direction: 'asc' }],
      limit,
    });
  },

  async pendingCount(): Promise<number> {
    return getDatabase().count(COLLECTION.syncQueue);
  },

  /** Remove operações confirmadas pelo servidor. */
  async acknowledge(operationIds: ID[]): Promise<void> {
    if (operationIds.length === 0) return;
    const db = getDatabase();

    await db.transaction(async () => {
      for (const id of operationIds) {
        await db.delete(COLLECTION.syncQueue, id);
      }
    });
  },

  /**
   * Marca falha e incrementa a contagem de tentativas.
   *
   * Após 10 tentativas a operação é descartada. Manter para sempre uma
   * operação que o servidor rejeita (registro apagado, payload inválido de
   * uma versão antiga) só faria a fila crescer sem fim e bloquear as
   * operações seguintes.
   */
  async markFailed(operationId: ID, error: string): Promise<void> {
    const db = getDatabase();
    const operation = await db.get<SyncOperation>(COLLECTION.syncQueue, operationId);
    if (!operation) return;

    const attempts = operation.attempts + 1;

    if (attempts >= 10) {
      console.warn(
        `[lumo/sync] Descartando operação ${operation.entity}/${operation.entityId} após ${attempts} falhas: ${error}`,
      );
      await db.delete(COLLECTION.syncQueue, operationId);
      return;
    }

    await db.put(COLLECTION.syncQueue, { ...operation, attempts, lastError: error });
  },

  async getLastSyncAt(): Promise<number | null> {
    const doc = await getDatabase().get<KeyValueDoc>(COLLECTION.keyValue, LAST_SYNC_KEY);
    return doc ? Number(doc.value) || null : null;
  },

  async setLastSyncAt(timestamp: number): Promise<void> {
    await getDatabase().put<KeyValueDoc>(COLLECTION.keyValue, {
      id: LAST_SYNC_KEY,
      value: String(timestamp),
      updatedAt: Date.now(),
    });
  },

  /** Limpa a fila inteira. Usado ao sair da conta. */
  async clear(): Promise<void> {
    await getDatabase().clear(COLLECTION.syncQueue);
    cachedClock = null;
  },
};
