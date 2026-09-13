import Dexie from 'dexie';

// Criação da instância Dexie do IndexedDB
export const localDb = new Dexie('3dcalc_local_db');

// Definição do esquema das tabelas locais
localDb.version(1).stores({
  printers: 'id, userId, name, updatedAt, isDeleted, syncStatus',
  filaments: 'id, userId, name, material, updatedAt, isDeleted, syncStatus',
  products: 'id, userId, title, updatedAt, isDeleted, syncStatus',
  partners: 'id, userId, name, updatedAt, isDeleted, syncStatus',
  dispatches: 'id, userId, partnerId, productId, updatedAt, isDeleted, syncStatus',
  settings: 'id, userId, updatedAt',
  syncQueue: '++queueId, table, action, id, timestamp',
});

// Migração transparente de dados do localStorage para IndexedDB
export async function migrateFromLocalStorageIfEmpty(defaults) {
  try {
    const printerCount = await localDb.printers.count();
    if (printerCount === 0) {
      console.log('[IndexedDB] Banco local inicializado. Importando dados...');
      
      const getStored = (key, fallback) => {
        try {
          const item = localStorage.getItem(key);
          return item ? JSON.parse(item) : fallback;
        } catch {
          return fallback;
        }
      };

      const printers = getStored('3dcalc_printers_v1', defaults.printers || []);
      const filaments = getStored('3dcalc_filaments_v1', defaults.filaments || []);
      const products = getStored('3dcalc_products_v1', defaults.products || []);
      const partners = getStored('3dcalc_partners_v1', defaults.partners || []);
      const dispatches = getStored('3dcalc_dispatches_v1', defaults.dispatches || []);
      const settings = getStored('3dcalc_settings_v1', defaults.settings || {});

      const now = new Date().toISOString();

      await localDb.transaction('rw', [localDb.printers, localDb.filaments, localDb.products, localDb.partners, localDb.dispatches, localDb.settings], async () => {
        if (printers.length > 0) {
          await localDb.printers.bulkPut(printers.map(p => ({ ...p, updatedAt: p.updatedAt || now, isDeleted: false, syncStatus: 'synced' })));
        }
        if (filaments.length > 0) {
          await localDb.filaments.bulkPut(filaments.map(f => ({ ...f, updatedAt: f.updatedAt || now, isDeleted: false, syncStatus: 'synced' })));
        }
        if (products.length > 0) {
          await localDb.products.bulkPut(products.map(p => ({ ...p, updatedAt: p.updatedAt || now, isDeleted: false, syncStatus: 'synced' })));
        }
        if (partners.length > 0) {
          await localDb.partners.bulkPut(partners.map(p => ({ ...p, updatedAt: p.updatedAt || now, isDeleted: false, syncStatus: 'synced' })));
        }
        if (dispatches.length > 0) {
          await localDb.dispatches.bulkPut(dispatches.map(d => ({ ...d, updatedAt: d.updatedAt || now, isDeleted: false, syncStatus: 'synced' })));
        }
        await localDb.settings.put({ id: 'global_settings', ...settings, updatedAt: now });
      });

      console.log('[IndexedDB] Migração concluída com sucesso!');
    }
  } catch (err) {
    console.error('[IndexedDB] Erro na migração de dados:', err);
  }
}
