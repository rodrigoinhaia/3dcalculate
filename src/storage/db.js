/**
 * Camada de Persistência Local-First (IndexedDB via Dexie + Espelho LocalStorage + Sync Outbox)
 */
import { localDb, migrateFromLocalStorageIfEmpty } from './indexedDb';
import { syncManager } from './syncManager';

const STORAGE_KEYS = {
  PRINTERS: '3dcalc_printers_v1',
  FILAMENTS: '3dcalc_filaments_v1',
  SETTINGS: '3dcalc_settings_v1',
  PRODUCTS: '3dcalc_products_v1',
  PARTNERS: '3dcalc_partners_v1',
  DISPATCHES: '3dcalc_dispatches_v1',
};

const DEFAULT_PRINTERS = [
  {
    id: 'prt-1',
    name: 'Bambu Lab P1S / X1C',
    watts: 300,
    price: 5200,
    lifespanHours: 5000,
    maintenancePerHour: 0.60,
  },
  {
    id: 'prt-2',
    name: 'Creality Ender 3 V3 SE / KE',
    watts: 200,
    price: 1650,
    lifespanHours: 3000,
    maintenancePerHour: 0.40,
  },
  {
    id: 'prt-3',
    name: 'Anycubic Kobra 2 / Elegoo Neptune',
    watts: 250,
    price: 2200,
    lifespanHours: 3500,
    maintenancePerHour: 0.50,
  }
];

const DEFAULT_FILAMENTS = [
  {
    id: 'fil-1',
    name: 'PLA Preto Fosco',
    brand: 'Voolt3D',
    material: 'PLA',
    color: '#1a1a1a',
    spoolWeight: 1000,
    price: 89.90,
  },
  {
    id: 'fil-2',
    name: 'PLA Branco Puro',
    brand: 'Creality',
    material: 'PLA',
    color: '#f8fafc',
    spoolWeight: 1000,
    price: 94.90,
  },
  {
    id: 'fil-3',
    name: 'PETG Translúcido Azul',
    brand: '3D Fila',
    material: 'PETG',
    color: '#0ea5e9',
    spoolWeight: 1000,
    price: 109.00,
  },
  {
    id: 'fil-4',
    name: 'PLA Seda Ouro Imperial (Silk)',
    brand: 'Sunlu',
    material: 'PLA Silk',
    color: '#f59e0b',
    spoolWeight: 1000,
    price: 125.00,
  },
  {
    id: 'fil-5',
    name: 'TPU 95A Flexível Preto',
    brand: 'Esun',
    material: 'TPU',
    color: '#0f172a',
    spoolWeight: 1000,
    price: 145.00,
  }
];

const DEFAULT_SETTINGS = {
  energyKwhRate: 0.85,
  laborHourlyRate: 25.00,
  prepMinutesDefault: 10,
  postMinutesDefault: 15,
  failureMarginDefault: 10,
  markupDefault: 100,
  currencySymbol: 'R$',
};

const DEFAULT_PRODUCTS = [
  {
    id: 'prod-1',
    title: 'Vaso Geométrico Espiral Low-Poly',
    description: 'Vaso moderno decorativo para plantas secas e arranjos.',
    category: 'Decoração',
    imageUrl: 'https://images.unsplash.com/photo-1618220179428-22790b461013?w=500&auto=format&fit=crop&q=80',
    weightGrams: 140,
    printHours: 4,
    printMinutes: 30,
    filamentId: 'fil-1',
    filamentName: 'PLA Preto Fosco',
    printerId: 'prt-1',
    printerName: 'Bambu Lab P1S / X1C',
    cost: 21.80,
    suggestedPrice: 65.00,
    directSalePrice: 65.00,
    stock: 4,
    infill: '15%',
    layerHeight: '0.20mm',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-2',
    title: 'Suporte Articulado Gamer para Headset',
    description: 'Suporte de mesa resistente com gancho para cabos e design ergonômico.',
    category: 'Setup & Games',
    imageUrl: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=500&auto=format&fit=crop&q=80',
    weightGrams: 195,
    printHours: 6,
    printMinutes: 15,
    filamentId: 'fil-3',
    filamentName: 'PETG Translúcido Azul',
    printerId: 'prt-1',
    printerName: 'Bambu Lab P1S / X1C',
    cost: 31.50,
    suggestedPrice: 89.90,
    directSalePrice: 89.90,
    stock: 2,
    infill: '25%',
    layerHeight: '0.24mm',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-3',
    title: 'Dragão Articulado Flexível 45cm',
    description: 'Brinquedo antiestresse articulado em peça única (print-in-place).',
    category: 'Colecionáveis',
    imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=500&auto=format&fit=crop&q=80',
    weightGrams: 90,
    printHours: 5,
    printMinutes: 0,
    filamentId: 'fil-4',
    filamentName: 'PLA Seda Ouro Imperial (Silk)',
    printerId: 'prt-2',
    printerName: 'Creality Ender 3 V3 SE / KE',
    cost: 18.20,
    suggestedPrice: 55.00,
    directSalePrice: 55.00,
    stock: 6,
    infill: '20%',
    layerHeight: '0.16mm',
    createdAt: new Date().toISOString(),
  }
];

const DEFAULT_PARTNERS = [
  {
    id: 'part-1',
    name: 'Geek & Coffee Café Cultural',
    contactPerson: 'Carlos Eduardo',
    phone: '(11) 98888-1122',
    commissionPercent: 25,
    address: 'Av. Paulista, 1000 - Bela Vista',
    notes: 'Acerto mensal no dia 05. Ótima saída para artigos colecionáveis e games.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'part-2',
    name: 'Loja Arte & Design Criativo',
    contactPerson: 'Mariana Siqueira',
    phone: '(11) 97777-3344',
    commissionPercent: 30,
    address: 'Shopping Vila Mall, Loja 42',
    notes: 'Foco em vasos, luminárias e peças de decoração moderna.',
    createdAt: new Date().toISOString(),
  }
];

const DEFAULT_DISPATCHES = [
  {
    id: 'disp-1',
    partnerId: 'part-1',
    productId: 'prod-3',
    quantitySent: 5,
    quantitySold: 2,
    unitRetailPrice: 55.00,
    commissionPercent: 25,
    dateSent: new Date(Date.now() - 15 * 86400000).toISOString(),
    notes: 'Primeira remessa de teste.',
  },
  {
    id: 'disp-2',
    partnerId: 'part-2',
    productId: 'prod-1',
    quantitySent: 4,
    quantitySold: 1,
    unitRetailPrice: 65.00,
    commissionPercent: 30,
    dateSent: new Date(Date.now() - 10 * 86400000).toISOString(),
    notes: 'Exposição na vitrine frontal.',
  }
];

// Helper síncrono para leitura imediata
function getItem(key, fallback) {
  try {
    const item = localStorage.getItem(key);
    if (!item) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(item);
  } catch (e) {
    console.error(`Erro ao ler ${key}:`, e);
    return fallback;
  }
}

// Gravação com espelhamento no Dexie e enfileiramento de sincronização
function setItemAndSync(key, table, data, defaults) {
  try {
    const prev = getItem(key, defaults);
    localStorage.setItem(key, JSON.stringify(data));
    window.dispatchEvent(new Event('3dcalc_storage_updated'));

    // Operação assíncrona no IndexedDB e SyncManager
    (async () => {
      const now = new Date().toISOString();

      if (table === 'settings') {
        await localDb.settings.put({ id: 'global_settings', ...data, updatedAt: now });
        await syncManager.enqueue('settings', 'UPSERT', 'global_settings', data);
        return;
      }

      // Detecta novos/atualizados e removidos
      const currentMap = new Map(data.map(item => [item.id, item]));
      const prevMap = new Map(prev.map(item => [item.id, item]));

      // Itens novos ou alterados
      for (const item of data) {
        await localDb[table].put({ ...item, updatedAt: now, isDeleted: false });
        await syncManager.enqueue(table, 'UPSERT', item.id, item);
      }

      // Itens deletados
      for (const [id] of prevMap) {
        if (!currentMap.has(id)) {
          await localDb[table].delete(id);
          await syncManager.enqueue(table, 'DELETE', id, null);
        }
      }
    })().catch(err => console.error('[Storage] Erro ao sincronizar IndexedDB:', err));
  } catch (e) {
    console.error(`Erro ao gravar ${key}:`, e);
  }
}

// Inicializa migração do localStorage para IndexedDB
if (typeof window !== 'undefined') {
  migrateFromLocalStorageIfEmpty({
    printers: DEFAULT_PRINTERS,
    filaments: DEFAULT_FILAMENTS,
    products: DEFAULT_PRODUCTS,
    partners: DEFAULT_PARTNERS,
    dispatches: DEFAULT_DISPATCHES,
    settings: DEFAULT_SETTINGS,
  });
}

export const db = {
  getPrinters: () => getItem(STORAGE_KEYS.PRINTERS, DEFAULT_PRINTERS),
  savePrinters: (printers) => setItemAndSync(STORAGE_KEYS.PRINTERS, 'printers', printers, DEFAULT_PRINTERS),

  getFilaments: () => getItem(STORAGE_KEYS.FILAMENTS, DEFAULT_FILAMENTS),
  saveFilaments: (filaments) => setItemAndSync(STORAGE_KEYS.FILAMENTS, 'filaments', filaments, DEFAULT_FILAMENTS),

  getSettings: () => getItem(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS),
  saveSettings: (settings) => setItemAndSync(STORAGE_KEYS.SETTINGS, 'settings', settings, DEFAULT_SETTINGS),

  getProducts: () => getItem(STORAGE_KEYS.PRODUCTS, DEFAULT_PRODUCTS),
  saveProducts: (products) => setItemAndSync(STORAGE_KEYS.PRODUCTS, 'products', products, DEFAULT_PRODUCTS),

  getPartners: () => getItem(STORAGE_KEYS.PARTNERS, DEFAULT_PARTNERS),
  savePartners: (partners) => setItemAndSync(STORAGE_KEYS.PARTNERS, 'partners', partners, DEFAULT_PARTNERS),

  getDispatches: () => getItem(STORAGE_KEYS.DISPATCHES, DEFAULT_DISPATCHES),
  saveDispatches: (dispatches) => setItemAndSync(STORAGE_KEYS.DISPATCHES, 'dispatches', dispatches, DEFAULT_DISPATCHES),

  // Exportar todos os dados para JSON
  exportBackup: () => {
    const backup = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      printers: db.getPrinters(),
      filaments: db.getFilaments(),
      settings: db.getSettings(),
      products: db.getProducts(),
      partners: db.getPartners(),
      dispatches: db.getDispatches(),
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `3D_Calc_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  // Importar backup de arquivo JSON
  importBackup: (jsonData) => {
    try {
      const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
      if (data.printers) db.savePrinters(data.printers);
      if (data.filaments) db.saveFilaments(data.filaments);
      if (data.settings) db.saveSettings(data.settings);
      if (data.products) db.saveProducts(data.products);
      if (data.partners) db.savePartners(data.partners);
      if (data.dispatches) db.saveDispatches(data.dispatches);
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  // Restaurar dados originais de demonstração
  resetToDefaults: () => {
    db.savePrinters(DEFAULT_PRINTERS);
    db.saveFilaments(DEFAULT_FILAMENTS);
    db.saveSettings(DEFAULT_SETTINGS);
    db.saveProducts(DEFAULT_PRODUCTS);
    db.savePartners(DEFAULT_PARTNERS);
    db.saveDispatches(DEFAULT_DISPATCHES);
  }
};
