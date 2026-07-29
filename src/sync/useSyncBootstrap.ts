/**
 * Liga o motor de sincronização ao ciclo de vida do app.
 *
 * Os três momentos que realmente importam para sincronizar — e não um
 * cronômetro agressivo — são: abrir o app, voltar do background e terminar uma
 * sessão de estudo. Este hook cobre os dois primeiros; o terceiro é disparado
 * pela store da lição.
 */

import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { useAppStore } from '@/state/app-store';
import { OfflineOnlyTransport, SyncEngine } from './engine';

export function useSyncBootstrap(): SyncEngine {
  const setSyncStatus = useAppStore((state) => state.setSyncStatus);
  const engineRef = useRef<SyncEngine | null>(null);

  if (!engineRef.current) {
    engineRef.current = new SyncEngine({
      // Sem backend configurado, o transporte nulo mantém tudo funcionando: a
      // outbox acumula e será drenada quando o transporte real for injetado.
      transport: new OfflineOnlyTransport(),
      onStatusChange: setSyncStatus,
    });
  }

  useEffect(() => {
    const engine = engineRef.current!;
    engine.start();

    const subscription = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next === 'active') {
        void engine.sync();
      }
    });

    return () => {
      subscription.remove();
      engine.stop();
    };
  }, []);

  return engineRef.current;
}
