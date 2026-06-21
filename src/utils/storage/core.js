import { supabase } from '../supabaseClient.js';
import { clone, mapToDB } from './helpers.js';
import { 
  DB_NAME, DB_VERSION, STORE_NAME,
  TABLES_KEY, EMPLOYEES_KEY, BILLS_KEY, NOTIFICATIONS_KEY,
  MENU_KEY, DEPT_ORDERS_KEY, SESSION_KEY, DEPARTMENTS_KEY,
  TABLE_FIELD_MAP, MENU_FIELD_MAP, DEPT_ORDER_FIELD_MAP, BILL_FIELD_MAP, EMPLOYEE_FIELD_MAP, DEPARTMENT_FIELD_MAP, NOTIFICATION_FIELD_MAP
} from './constants.js';

let dbPromise = null;

export const cache = {
  [TABLES_KEY]: [],
  [EMPLOYEES_KEY]: [],
  [BILLS_KEY]: [],
  [NOTIFICATIONS_KEY]: [],
  [MENU_KEY]: [],
  [DEPT_ORDERS_KEY]: {},
  [SESSION_KEY]: null,
  [DEPARTMENTS_KEY]: []
};

export const openDatabase = () => {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME))
        db.createObjectStore(STORE_NAME, { keyPath: 'key' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
};

export const readRecord = async (key, fallback) => {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(key);
      req.onsuccess = () => resolve(req.result?.value ?? clone(fallback));
      req.onerror = () => resolve(clone(fallback));
    });
  } catch { return clone(fallback); }
};

export const writeRecord = async (key, value) => {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const req = tx.objectStore(STORE_NAME).put({ key, value: clone(value), updatedAt: Date.now() });
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    });
  } catch { return false; }
};

const bc = new BroadcastChannel('taka_channel');
bc.onmessage = (event) => {
  if (event.data && event.data.type === 'sync' && event.data.key) {
    readRecord(event.data.key, cache[event.data.key]).then(val => {
      cache[event.data.key] = val;
      try { window.dispatchEvent(new CustomEvent('taka_sync', { detail: { key: event.data.key } })); } catch { /* noop */ }
    });
  }
};

export const triggerSync = (key) => {
  try { 
    window.dispatchEvent(new CustomEvent('taka_sync', { detail: { key } })); 
    bc.postMessage({ type: 'sync', key });
  } catch { /* noop */ }
};

export const persist = async (key, value, changedItemOrId = null) => {
  cache[key] = clone(value);
  await writeRecord(key, value);
  triggerSync(key);

  if (supabase) {
    try {
      // Lazy load to avoid circular dependency
      const { getTenantId } = await import('./tenant.js');
      const tenantId = getTenantId();
      
      const injectTenant = (item) => {
        item.restaurant_id = item.restaurant_id || tenantId;
        return item;
      };

      if (key === TABLES_KEY && Array.isArray(value)) {
        let itemsToUpsert = value;
        if (changedItemOrId) {
          const id = typeof changedItemOrId === 'object' ? changedItemOrId.id : changedItemOrId;
          const found = value.find(t => t.id === id);
          if (found) itemsToUpsert = [found];
        }
        const mapped = itemsToUpsert.map(t => injectTenant(mapToDB(t, TABLE_FIELD_MAP)));
        await supabase.from('tables').upsert(mapped);
      } else if (key === MENU_KEY && Array.isArray(value)) {
        let itemsToUpsert = value;
        if (changedItemOrId) {
          const id = typeof changedItemOrId === 'object' ? changedItemOrId.id : changedItemOrId;
          const found = value.find(m => m.id === id);
          if (found) itemsToUpsert = [found];
        }
        const mapped = itemsToUpsert.map(m => injectTenant(mapToDB(m, MENU_FIELD_MAP)));
        await supabase.from('menu').upsert(mapped);
      } else if (key === DEPT_ORDERS_KEY) {
        let itemsToUpsert = Object.values(value);
        if (changedItemOrId) {
          const id = typeof changedItemOrId === 'object' ? changedItemOrId.id : changedItemOrId;
          const found = value[id];
          itemsToUpsert = found ? [found] : [];
        }
        const arr = itemsToUpsert.map(o => injectTenant(mapToDB(o, DEPT_ORDER_FIELD_MAP)));
        if (arr.length > 0) await supabase.from('dept_orders').upsert(arr);
      } else if (key === BILLS_KEY && Array.isArray(value)) {
        let itemsToUpsert = value;
        if (changedItemOrId) {
          const id = typeof changedItemOrId === 'object' ? changedItemOrId.id : changedItemOrId;
          const found = value.find(b => b.id === id);
          if (found) itemsToUpsert = [found];
        }
        const mapped = itemsToUpsert.map(b => injectTenant(mapToDB(b, BILL_FIELD_MAP)));
        if (mapped.length > 0) await supabase.from('bills').upsert(mapped);
      } else if (key === EMPLOYEES_KEY && Array.isArray(value)) {
        let itemsToUpsert = value;
        if (changedItemOrId) {
          const id = typeof changedItemOrId === 'object' ? changedItemOrId.id : changedItemOrId;
          const found = value.find(e => e.id === id);
          if (found) itemsToUpsert = [found];
        }
        const mapped = itemsToUpsert.map(e => injectTenant(mapToDB(e, EMPLOYEE_FIELD_MAP)));
        await supabase.from('employees').upsert(mapped);
      } else if (key === DEPARTMENTS_KEY && Array.isArray(value)) {
        let itemsToUpsert = value;
        if (changedItemOrId) {
          const id = typeof changedItemOrId === 'object' ? changedItemOrId.id : changedItemOrId;
          const found = value.find(d => d.id === id);
          if (found) itemsToUpsert = [found];
        }
        const mapped = itemsToUpsert.map(d => injectTenant(mapToDB(d, DEPARTMENT_FIELD_MAP)));
        await supabase.from('departments').upsert(mapped);
      } else if (key === NOTIFICATIONS_KEY && Array.isArray(value)) {
        let itemsToUpsert = value;
        if (changedItemOrId) {
          const id = typeof changedItemOrId === 'object' ? changedItemOrId.id : changedItemOrId;
          const found = value.find(n => n.id === id);
          if (found) itemsToUpsert = [found];
        }
        const mapped = itemsToUpsert.map(n => injectTenant(mapToDB(n, NOTIFICATION_FIELD_MAP)));
        if (mapped.length > 0) await supabase.from('notifications').upsert(mapped);
      }
    } catch (err) {
      console.error('Supabase push error:', err);
    }
  }
};
