import { supabase } from '../supabaseClient.js';
import { clone, mapToDB } from './helpers.js';
import { getTenantId } from './tenant.js';
import { 
  DB_NAME, DB_VERSION, STORE_NAME,
  TABLES_KEY, EMPLOYEES_KEY, BILLS_KEY, NOTIFICATIONS_KEY,
  MENU_KEY, DEPT_ORDERS_KEY, SESSION_KEY, DEPARTMENTS_KEY, ARCHIVES_KEY,
  TABLE_FIELD_MAP, MENU_FIELD_MAP, DEPT_ORDER_FIELD_MAP, BILL_FIELD_MAP, EMPLOYEE_FIELD_MAP, DEPARTMENT_FIELD_MAP, NOTIFICATION_FIELD_MAP, ARCHIVE_FIELD_MAP
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
  [DEPARTMENTS_KEY]: [],
  [ARCHIVES_KEY]: []
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

export const getSyncQueue = async () => {
  return await readRecord('sync_queue', []);
};

export const saveSyncQueue = async (queue) => {
  await writeRecord('sync_queue', queue);
  try {
    window.dispatchEvent(new CustomEvent('taka_sync_status', { detail: { pendingCount: queue?.length || 0 } }));
  } catch { /* noop */ }
};

export const enqueueMutation = async (key, action, changedItemOrId = null, value = null) => {
  if (!supabase) return;
  const queue = await getSyncQueue();
  const id = `mut-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  queue.push({
    id,
    key,
    action,
    changedItemOrId: clone(changedItemOrId),
    value: clone(value),
    timestamp: Date.now()
  });
  await saveSyncQueue(queue);
  
  try {
    window.dispatchEvent(new CustomEvent('taka_trigger_sync_queue'));
  } catch { /* noop */ }
};

export const persist = async (key, value, changedItemOrId = null) => {
  cache[key] = clone(value);
  await writeRecord(key, value);
  triggerSync(key);

  if (supabase) {
    const syncableKeys = [
      TABLES_KEY, EMPLOYEES_KEY, BILLS_KEY, NOTIFICATIONS_KEY,
      MENU_KEY, DEPT_ORDERS_KEY, DEPARTMENTS_KEY, ARCHIVES_KEY
    ];
    if (syncableKeys.includes(key)) {
      await enqueueMutation(key, 'upsert', changedItemOrId, value);
    }
  }
};
