import { localDb } from './indexedDb';

class SyncManager {
  constructor() {
    this.isSyncing = false;
    this.status = 'idle'; // 'idle', 'synced', 'syncing', 'offline', 'error', 'guest'
    this.pendingCount = 0;
    this.listeners = new Set();
    this.initNetworkListeners();
    this.updatePendingCount();
  }

  initNetworkListeners() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        console.log('[SyncManager] Dispositivo voltou a ficar ONLINE.');
        this.sync();
      });

      window.addEventListener('offline', () => {
        console.log('[SyncManager] Dispositivo OFFLINE.');
        this.notifyStatus('offline');
      });
    }
  }

  subscribe(listener) {
    this.listeners.add(listener);
    listener({ status: this.getStatus(), pendingCount: this.pendingCount });
    return () => this.listeners.delete(listener);
  }

  notifyStatus(status) {
    this.status = status;
    this.listeners.forEach(fn => fn({ status: this.getStatus(), pendingCount: this.pendingCount }));
  }

  getStatus() {
    const token = typeof window !== 'undefined' ? localStorage.getItem('3dcalc_auth_token') : null;
    if (!token) return 'guest';
    if (typeof navigator !== 'undefined' && !navigator.onLine) return 'offline';
    return this.status === 'idle' ? 'synced' : this.status;
  }

  async updatePendingCount() {
    try {
      this.pendingCount = await localDb.syncQueue.count();
      this.notifyStatus(this.getStatus());
    } catch {
      this.pendingCount = 0;
    }
  }

  // Enfileira uma mutação offline
  async enqueue(table, action, id, data = null) {
    try {
      await localDb.syncQueue.add({
        table,
        action,
        id,
        data,
        timestamp: new Date().toISOString(),
      });
      await this.updatePendingCount();

      // Dispara sincronização se estiver online e autenticado
      const token = localStorage.getItem('3dcalc_auth_token');
      if (token && navigator.onLine) {
        this.sync();
      }
    } catch (err) {
      console.error('[SyncManager] Erro ao enfileirar mutação:', err);
    }
  }

  // Executa o sincronismo bidirecional
  async sync() {
    const token = typeof window !== 'undefined' ? localStorage.getItem('3dcalc_auth_token') : null;
    if (!token) {
      this.notifyStatus('guest');
      return;
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.notifyStatus('offline');
      return;
    }

    if (this.isSyncing) return;
    this.isSyncing = true;
    this.notifyStatus('syncing');

    try {
      const queueItems = await localDb.syncQueue.toArray();
      const lastSyncedAt = localStorage.getItem('3dcalc_last_synced_at') || null;

      // O espelho do localStorage é o que a tela mostra (e o que o backup exporta).
      // A migração inicial marca o IndexedDB como "synced" sem nunca enviar esses
      // registros, então a fila sozinha deixa a nuvem com um catálogo incompleto.
      const mutations = buildMutations(queueItems, readLocalSnapshot());

      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          lastSyncedAt,
          mutations,
        }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          // Token expirado
          localStorage.removeItem('3dcalc_auth_token');
          localStorage.removeItem('3dcalc_auth_user');
          window.dispatchEvent(new Event('3dcalc_auth_changed'));
        }
        throw new Error(`HTTP ${res.status}`);
      }

      const { serverTimestamp, updates } = await res.json();

      // Limpa as mutações enviadas com sucesso
      if (queueItems.length > 0) {
        const queueIds = queueItems.map(q => q.queueId);
        await localDb.syncQueue.bulkDelete(queueIds);
      }

      // Aplica dados novos ou atualizados vindos do servidor
      if (updates) {
        await this.applyServerUpdates(updates);
      }

      localStorage.setItem('3dcalc_last_synced_at', serverTimestamp);
      await this.updatePendingCount();
      this.notifyStatus('synced');
      window.dispatchEvent(new Event('3dcalc_storage_updated'));
    } catch (err) {
      console.warn('[SyncManager] Falha na sincronização:', err.message);
      this.notifyStatus(navigator.onLine ? 'error' : 'offline');
    } finally {
      this.isSyncing = false;
    }
  }

  async applyServerUpdates(updates) {
    const { printers, filaments, settings, products, partners, dispatches, partnerSales } = updates;

    await localDb.transaction('rw', [localDb.printers, localDb.filaments, localDb.products, localDb.partners, localDb.dispatches, localDb.settings], async () => {
      if (printers && printers.length > 0) {
        for (const p of printers) {
          if (p.isDeleted) await localDb.printers.delete(p.id);
          else await localDb.printers.put({ ...p, syncStatus: 'synced' });
        }
      }

      if (filaments && filaments.length > 0) {
        for (const f of filaments) {
          if (f.isDeleted) await localDb.filaments.delete(f.id);
          else await localDb.filaments.put({ ...f, syncStatus: 'synced' });
        }
      }

      if (products && products.length > 0) {
        for (const prod of products) {
          if (prod.isDeleted) await localDb.products.delete(prod.id);
          else await localDb.products.put({ ...prod, syncStatus: 'synced' });
        }
      }

      if (partners && partners.length > 0) {
        for (const part of partners) {
          if (part.isDeleted) await localDb.partners.delete(part.id);
          else await localDb.partners.put({ ...part, syncStatus: 'synced' });
        }
      }

      if (dispatches && dispatches.length > 0) {
        for (const d of dispatches) {
          if (d.isDeleted) await localDb.dispatches.delete(d.id);
          else await localDb.dispatches.put({ ...d, syncStatus: 'synced' });
        }
      }

      if (settings) {
        await localDb.settings.put({ id: 'global_settings', ...settings });
      }
    });

    // Atualiza o espelho local síncrono para os componentes React
    const allPrinters = await localDb.printers.filter(p => !p.isDeleted).toArray();
    const allFilaments = await localDb.filaments.filter(f => !f.isDeleted).toArray();
    const allProducts = await localDb.products.filter(p => !p.isDeleted).toArray();
    const allPartners = await localDb.partners.filter(p => !p.isDeleted).toArray();
    const allDispatches = await localDb.dispatches.filter(d => !d.isDeleted).toArray();
    const currentSettings = await localDb.settings.get('global_settings');

    localStorage.setItem('3dcalc_printers_v1', JSON.stringify(allPrinters));
    localStorage.setItem('3dcalc_filaments_v1', JSON.stringify(allFilaments));
    localStorage.setItem('3dcalc_products_v1', JSON.stringify(allProducts));
    localStorage.setItem('3dcalc_partners_v1', JSON.stringify(allPartners));
    localStorage.setItem('3dcalc_dispatches_v1', JSON.stringify(allDispatches));
    if (currentSettings) {
      localStorage.setItem('3dcalc_settings_v1', JSON.stringify(currentSettings));
    }

    if (Array.isArray(partnerSales) && partnerSales.length > 0) {
      const previous = readJson('3dcalc_partner_sales_v1', []);
      const merged = new Map(previous.map((sale) => [sale.id, sale]));
      for (const sale of partnerSales) merged.set(sale.id, sale);
      const list = [...merged.values()].sort((a, b) => String(b.soldAt).localeCompare(String(a.soldAt)));
      localStorage.setItem('3dcalc_partner_sales_v1', JSON.stringify(list));
    }
  }
}

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function readLocalSnapshot() {
  return {
    printers: readJson('3dcalc_printers_v1', []),
    filaments: readJson('3dcalc_filaments_v1', []),
    products: readJson('3dcalc_products_v1', []),
    partners: readJson('3dcalc_partners_v1', []),
    dispatches: readJson('3dcalc_dispatches_v1', []),
    settings: readJson('3dcalc_settings_v1', null),
  };
}

function buildMutations(queueItems, snapshot) {
  const byKey = new Map();
  const put = (table, id, mutation) => byKey.set(`${table}:${id}`, mutation);

  const lists = [
    ['printers', snapshot.printers],
    ['filaments', snapshot.filaments],
    ['products', snapshot.products],
    ['partners', snapshot.partners],
    ['dispatches', snapshot.dispatches],
  ];

  for (const [table, items] of lists) {
    if (!Array.isArray(items)) continue;
    for (const item of items) {
      if (!item?.id) continue;
      put(table, item.id, { table, action: 'UPSERT', id: item.id, data: item });
    }
  }

  if (snapshot.settings && typeof snapshot.settings === 'object') {
    put('settings', 'global_settings', {
      table: 'settings',
      action: 'UPSERT',
      id: 'global_settings',
      data: snapshot.settings,
    });
  }

  for (const item of queueItems) {
    put(item.table, item.id, {
      table: item.table,
      action: item.action,
      id: item.id,
      data: item.data,
    });
  }

  return [...byKey.values()];
}

export const syncManager = new SyncManager();
