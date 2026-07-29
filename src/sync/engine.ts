/**
 * Lumo — Motor de sincronização
 * ==============================
 *
 * Drena a outbox para o servidor e traz as mudanças remotas, em background,
 * sem jamais bloquear a interface.
 *
 * Este módulo cuida apenas da **orquestração** (fila, lotes, reentrância,
 * ciclo de vida). As regras de resolução de conflito são funções puras e
 * vivem em `./merge.ts`, separadas de propósito: são a parte em que um bug
 * apaga estudo real do usuário, e precisam ser testáveis sem banco nem rede.
 * Elas são reexportadas aqui para manter um ponto de entrada único.
 */

import { syncRepository } from '@/db/repositories/sync';
import type { SyncOperation, SyncStatus } from '@/domain/types';

// As políticas de merge vivem em `merge.ts` — funções puras, sem infraestrutura.
// Reexportadas aqui para manter um ponto de entrada único da sincronização.
export {
  ENTITY_POLICY,
  mergeDailyStat,
  mergeLessonProgress,
  mergeReviewState,
  mergeStreak,
  type MergePolicy,
} from './merge';

/* ------------------------------------------------------------------ *
 * Transporte
 * ------------------------------------------------------------------ */

/**
 * Contrato do transporte de sincronização.
 *
 * Abstrair aqui permite trocar Supabase por qualquer outro backend — ou rodar
 * testes com um transporte falso — sem tocar no motor.
 */
export interface SyncTransport {
  /** Envia um lote e devolve os ids aceitos. */
  push(
    operations: SyncOperation[],
  ): Promise<{ acceptedIds: string[]; rejected: { id: string; error: string }[] }>;

  /** Busca mudanças remotas desde o último cursor. */
  pull(since: number | null): Promise<{ changes: RemoteChange[]; cursor: number }>;

  /** Testa a conectividade — barato e rápido. */
  isReachable(): Promise<boolean>;
}

export type RemoteChange = {
  entity: string;
  entityId: string;
  op: 'upsert' | 'delete';
  payload: unknown;
  updatedAt: number;
};

/**
 * Transporte nulo: usado enquanto não há backend configurado.
 *
 * Fundamental para o desenvolvimento e para a build web da vitrine: o app
 * funciona por completo, a fila enche normalmente e nada quebra. Quando o
 * backend entrar, basta injetar o transporte real — a fila acumulada é
 * enviada de uma vez.
 */
export class OfflineOnlyTransport implements SyncTransport {
  async push(): Promise<{ acceptedIds: string[]; rejected: { id: string; error: string }[] }> {
    return { acceptedIds: [], rejected: [] };
  }

  async pull(): Promise<{ changes: RemoteChange[]; cursor: number }> {
    return { changes: [], cursor: 0 };
  }

  async isReachable(): Promise<boolean> {
    return false;
  }
}

/* ------------------------------------------------------------------ *
 * Motor
 * ------------------------------------------------------------------ */

export type SyncEngineOptions = {
  transport: SyncTransport;
  /** Tamanho do lote enviado por vez. */
  batchSize?: number;
  /** Callback de mudança de estado, para a UI mostrar o indicador. */
  onStatusChange?: (status: SyncStatus) => void;
  /** Aplica uma mudança remota ao banco local. */
  applyRemoteChange?: (change: RemoteChange) => Promise<void>;
};

export class SyncEngine {
  private status: SyncStatus = {
    lastSyncAt: null,
    pendingOperations: 0,
    syncing: false,
    online: false,
    lastError: null,
  };

  private running = false;
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly options: SyncEngineOptions) {}

  getStatus(): SyncStatus {
    return { ...this.status };
  }

  private emit(patch: Partial<SyncStatus>): void {
    this.status = { ...this.status, ...patch };
    this.options.onStatusChange?.(this.getStatus());
  }

  /**
   * Executa um ciclo completo: push, depois pull.
   *
   * Push primeiro é deliberado — as mutações locais são a fonte de verdade
   * mais recente do usuário, e enviá-las antes evita que um pull sobrescreva
   * trabalho que ainda não subiu.
   *
   * Reentrância é bloqueada: dois ciclos simultâneos enviariam o mesmo lote
   * duas vezes.
   */
  async sync(): Promise<SyncStatus> {
    if (this.running) return this.getStatus();

    this.running = true;
    this.emit({ syncing: true, lastError: null });

    try {
      const reachable = await this.options.transport.isReachable();
      this.emit({ online: reachable });

      if (!reachable) {
        const pending = await syncRepository.pendingCount();
        this.emit({ syncing: false, pendingOperations: pending });
        return this.getStatus();
      }

      await this.push();
      await this.pull();

      const now = Date.now();
      await syncRepository.setLastSyncAt(now);

      this.emit({
        syncing: false,
        lastSyncAt: now,
        pendingOperations: await syncRepository.pendingCount(),
      });
    } catch (error) {
      // Falha de sincronização nunca é fatal: o usuário continua estudando e
      // tentamos de novo no próximo ciclo.
      this.emit({
        syncing: false,
        lastError: error instanceof Error ? error.message : 'Falha ao sincronizar',
      });
    } finally {
      this.running = false;
    }

    return this.getStatus();
  }

  /** Drena a fila em lotes até esvaziar ou até um lote falhar por completo. */
  private async push(): Promise<void> {
    const batchSize = this.options.batchSize ?? 50;

    for (;;) {
      const batch = await syncRepository.nextBatch(batchSize);
      if (batch.length === 0) return;

      const { acceptedIds, rejected } = await this.options.transport.push(batch);

      await syncRepository.acknowledge(acceptedIds);
      for (const failure of rejected) {
        await syncRepository.markFailed(failure.id, failure.error);
      }

      // Nada progrediu: para para não girar em falso e gastar bateria.
      if (acceptedIds.length === 0) return;
      // Lote incompleto significa fila esvaziada.
      if (batch.length < batchSize) return;
    }
  }

  private async pull(): Promise<void> {
    const since = await syncRepository.getLastSyncAt();
    const { changes } = await this.options.transport.pull(since);

    for (const change of changes) {
      await this.options.applyRemoteChange?.(change);
    }
  }

  /**
   * Sincronização periódica em background.
   *
   * Intervalo generoso (5 min) de propósito: sincronizar com frequência num
   * app cuja verdade está no dispositivo só consome rádio e bateria. O que
   * realmente importa é sincronizar ao abrir o app, ao voltar do background e
   * ao terminar uma sessão — todos disparados explicitamente.
   */
  start(intervalMs = 5 * 60 * 1000): void {
    if (this.timer) return;
    this.timer = setInterval(() => void this.sync(), intervalMs);
    void this.sync();
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
