import { syncManager } from '../storage/syncManager';

export function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('[ServiceWorker] Registrado com sucesso:', registration.scope);

          // Tenta registrar Background Sync se disponível
          if ('sync' in registration) {
            window.addEventListener('online', () => {
              registration.sync.register('sync-mutations').catch(() => {});
            });
          }
        })
        .catch((error) => {
          console.warn('[ServiceWorker] Falha ao registrar:', error);
        });

      // Escuta mensagens do Service Worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'BACKGROUND_SYNC_TRIGGER') {
          console.log('[ServiceWorker] Gatilho de sincronização recebido em segundo plano.');
          syncManager.sync();
        }
      });
    });
  }
}
