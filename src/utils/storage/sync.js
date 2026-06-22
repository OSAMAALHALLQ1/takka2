import { supabase } from '../supabaseClient.js';
import { cache, writeRecord, readRecord, triggerSync, getSyncQueue, saveSyncQueue } from './core.js';
import { clone, mapFromDB, mapToDB, normalizeEmployee } from './helpers.js';
import {
  TABLES_KEY, EMPLOYEES_KEY, BILLS_KEY, NOTIFICATIONS_KEY,
  MENU_KEY, DEPT_ORDERS_KEY, SESSION_KEY, DEPARTMENTS_KEY,
  TABLE_FIELD_MAP, MENU_FIELD_MAP, DEPT_ORDER_FIELD_MAP, BILL_FIELD_MAP, EMPLOYEE_FIELD_MAP, DEPARTMENT_FIELD_MAP, NOTIFICATION_FIELD_MAP
} from './constants.js';
import { DEFAULT_TABLES, DEFAULT_MENU, DEFAULT_EMPLOYEES, DEFAULT_DEPARTMENTS } from './defaults.js';

let initPromise = null;
let isConnected = true;
let networkListenersAttached = false;
let triggerReconnect = null;

export const isRealtimeConnected = () => isConnected;

const dispatchConnectionStatus = (connected) => {
  isConnected = connected;
  try {
    window.dispatchEvent(new CustomEvent('taka_connection_status', { detail: { connected } }));
  } catch {
    // ignore
  }
};

const seedIfMissing = async (key, fallback) => {
  const value = await readRecord(key, null);
  if (key === TABLES_KEY && Array.isArray(value) && value.length < 15) {
    const merged = [...value];
    for (let i = value.length; i < 15; i++) {
      merged.push({
        id: i + 1, name: `طاولة ${i + 1}`,
        seats: i < 5 ? 4 : i < 10 ? 6 : 8,
        area: i < 5 ? 'indoor' : i < 10 ? 'outdoor' : 'terrace',
        status: 'empty', currentOrder: [], notes: '',
        subtotal: 0, tax: 0, serviceCharge: 0, total: 0,
        waiterCode: null, seatedAt: null, guests: 0
      });
    }
    cache[key] = clone(merged);
    await writeRecord(key, merged);
    return;
  }
  if (value === null) {
    cache[key] = clone(fallback);
    await writeRecord(key, fallback);
  } else {
    const normalized = key === EMPLOYEES_KEY && Array.isArray(value)
      ? value.map(normalizeEmployee) : value;
    cache[key] = clone(normalized);
    await writeRecord(key, normalized);
  }
};

// Helper to check if a specific item has a pending mutation in the queue
export const isItemInSyncQueue = (queue, key, itemId) => {
  if (!queue || queue.length === 0) return false;
  return queue.some(m => {
    if (m.key !== key) return false;
    if (m.changedItemOrId === null) return true; // Full table/key is locked
    
    // If it's a delete_in/delete action, changedItemOrId might be an ID or an array of IDs
    if (Array.isArray(m.changedItemOrId)) {
      return m.changedItemOrId.some(id => String(id) === String(itemId));
    }
    
    const id = typeof m.changedItemOrId === 'object' ? m.changedItemOrId.id : m.changedItemOrId;
    return String(id) === String(itemId);
  });
};

// Merge fetched remote data with local cache data, respecting the sync queue
export const mergeFetchedData = (key, fetchedData, localData, queue, idField = 'id') => {
  if (!fetchedData) return localData;

  if (key === DEPT_ORDERS_KEY) {
    const updated = { ...(localData || {}) };
    const fetchedIds = new Set();
    
    fetchedData.forEach(d => {
      const jsObj = mapFromDB(d, DEPT_ORDER_FIELD_MAP);
      fetchedIds.add(String(jsObj.id));
      if (!isItemInSyncQueue(queue, DEPT_ORDERS_KEY, jsObj.id)) {
        updated[jsObj.id] = jsObj;
      }
    });
    
    // Clean up local items that were deleted on server and are not pending in queue
    Object.keys(updated).forEach(id => {
      if (!fetchedIds.has(String(id)) && !isItemInSyncQueue(queue, DEPT_ORDERS_KEY, id)) {
        delete updated[id];
      }
    });
    return updated;
  }
  
  if (Array.isArray(fetchedData)) {
    let mappedFetched = [];
    if (key === TABLES_KEY) mappedFetched = fetchedData.map(t => mapFromDB(t, TABLE_FIELD_MAP));
    else if (key === MENU_KEY) mappedFetched = fetchedData.map(m => mapFromDB(m, MENU_FIELD_MAP));
    else if (key === BILLS_KEY) mappedFetched = fetchedData.map(b => mapFromDB(b, BILL_FIELD_MAP));
    else if (key === EMPLOYEES_KEY) mappedFetched = fetchedData.map(e => mapFromDB(e, EMPLOYEE_FIELD_MAP));
    else if (key === DEPARTMENTS_KEY) mappedFetched = fetchedData.map(d => mapFromDB(d, DEPARTMENT_FIELD_MAP));
    else if (key === NOTIFICATIONS_KEY) mappedFetched = fetchedData.map(n => mapFromDB(n, NOTIFICATION_FIELD_MAP));
    else mappedFetched = fetchedData;

    const localArray = Array.isArray(localData) ? localData : [];
    const updatedArray = [...localArray];

    mappedFetched.forEach(remoteItem => {
      const remoteId = remoteItem[idField];
      const idx = updatedArray.findIndex(item => item[idField] === remoteId);
      if (idx !== -1) {
        if (!isItemInSyncQueue(queue, key, remoteId)) {
          updatedArray[idx] = remoteItem;
        }
      } else {
        updatedArray.push(remoteItem);
      }
    });

    if (fetchedData.length > 0 && [TABLES_KEY, MENU_KEY, EMPLOYEES_KEY, DEPARTMENTS_KEY].includes(key)) {
      const remoteIds = new Set(mappedFetched.map(item => String(item[idField])));
      return updatedArray.filter(item => {
        return remoteIds.has(String(item[idField])) || isItemInSyncQueue(queue, key, item[idField]);
      });
    }

    return updatedArray;
  }
  
  return fetchedData;
};

let isProcessingQueue = false;

export const processSyncQueue = async () => {
  if (isProcessingQueue || !supabase) return;
  
  if (typeof window !== 'undefined' && window.navigator && window.navigator.onLine === false) {
    return;
  }

  isProcessingQueue = true;

  try {
    const { getTenantId } = await import('./tenant.js');
    const tenantId = getTenantId();
    const injectTenant = (item) => {
      item.restaurant_id = item.restaurant_id || tenantId;
      return item;
    };

    while (true) {
      const queue = await getSyncQueue();
      if (queue.length === 0) break;

      const mutation = queue[0];
      const { key, action, changedItemOrId, value } = mutation;
      let success = false;

      try {
        if (action === 'upsert') {
          if (key === TABLES_KEY && Array.isArray(value)) {
            let itemsToUpsert = value;
            if (changedItemOrId) {
              const id = typeof changedItemOrId === 'object' ? changedItemOrId.id : changedItemOrId;
              const found = value.find(t => t.id === id);
              if (found) itemsToUpsert = [found];
            }
            const mapped = itemsToUpsert.map(t => injectTenant(mapToDB(t, TABLE_FIELD_MAP)));
            const { error } = await supabase.from('tables').upsert(mapped);
            if (error) throw error;
            success = true;
          } else if (key === MENU_KEY && Array.isArray(value)) {
            let itemsToUpsert = value;
            if (changedItemOrId) {
              const id = typeof changedItemOrId === 'object' ? changedItemOrId.id : changedItemOrId;
              const found = value.find(m => m.id === id);
              if (found) itemsToUpsert = [found];
            }
            const mapped = itemsToUpsert.map(m => injectTenant(mapToDB(m, MENU_FIELD_MAP)));
            const { error } = await supabase.from('menu').upsert(mapped);
            if (error) throw error;
            success = true;
          } else if (key === DEPT_ORDERS_KEY) {
            let itemsToUpsert = Object.values(value);
            if (changedItemOrId) {
              const id = typeof changedItemOrId === 'object' ? changedItemOrId.id : changedItemOrId;
              const found = value[id];
              itemsToUpsert = found ? [found] : [];
            }
            const arr = itemsToUpsert.map(o => injectTenant(mapToDB(o, DEPT_ORDER_FIELD_MAP)));
            if (arr.length > 0) {
              const { error } = await supabase.from('dept_orders').upsert(arr);
              if (error) throw error;
            }
            success = true;
          } else if (key === BILLS_KEY && Array.isArray(value)) {
            let itemsToUpsert = value;
            if (changedItemOrId) {
              const id = typeof changedItemOrId === 'object' ? changedItemOrId.id : changedItemOrId;
              const found = value.find(b => b.id === id);
              if (found) itemsToUpsert = [found];
            }
            const mapped = itemsToUpsert.map(b => injectTenant(mapToDB(b, BILL_FIELD_MAP)));
            if (mapped.length > 0) {
              const { error } = await supabase.from('bills').upsert(mapped);
              if (error) throw error;
            }
            success = true;
          } else if (key === EMPLOYEES_KEY && Array.isArray(value)) {
            let itemsToUpsert = value;
            if (changedItemOrId) {
              const id = typeof changedItemOrId === 'object' ? changedItemOrId.id : changedItemOrId;
              const found = value.find(e => e.id === id);
              if (found) itemsToUpsert = [found];
            }
            const mapped = itemsToUpsert.map(e => injectTenant(mapToDB(e, EMPLOYEE_FIELD_MAP)));
            const { error } = await supabase.from('employees').upsert(mapped);
            if (error) throw error;
            success = true;
          } else if (key === DEPARTMENTS_KEY && Array.isArray(value)) {
            let itemsToUpsert = value;
            if (changedItemOrId) {
              const id = typeof changedItemOrId === 'object' ? changedItemOrId.id : changedItemOrId;
              const found = value.find(d => d.id === id);
              if (found) itemsToUpsert = [found];
            }
            const mapped = itemsToUpsert.map(d => injectTenant(mapToDB(d, DEPARTMENT_FIELD_MAP)));
            const { error } = await supabase.from('departments').upsert(mapped);
            if (error) throw error;
            success = true;
          } else if (key === NOTIFICATIONS_KEY && Array.isArray(value)) {
            let itemsToUpsert = value;
            if (changedItemOrId) {
              const id = typeof changedItemOrId === 'object' ? changedItemOrId.id : changedItemOrId;
              const found = value.find(n => n.id === id);
              if (found) itemsToUpsert = [found];
            }
            const mapped = itemsToUpsert.map(n => injectTenant(mapToDB(n, NOTIFICATION_FIELD_MAP)));
            if (mapped.length > 0) {
              const { error } = await supabase.from('notifications').upsert(mapped);
              if (error) throw error;
            }
            success = true;
          }
        } else if (action === 'delete') {
          const dbTable = key === DEPT_ORDERS_KEY ? 'dept_orders' : key;
          const { error } = await supabase.from(dbTable).delete().eq('id', changedItemOrId);
          if (error) throw error;
          success = true;
        } else if (action === 'delete_in') {
          const dbTable = key === DEPT_ORDERS_KEY ? 'dept_orders' : key;
          const { error } = await supabase.from(dbTable).delete().in('id', changedItemOrId);
          if (error) throw error;
          success = true;
        } else if (action === 'delete_all') {
          const dbTable = key === DEPT_ORDERS_KEY ? 'dept_orders' : key;
          const { error } = await supabase.from(dbTable).delete().neq('id', 'dummy');
          if (error) throw error;
          success = true;
        }
      } catch (err) {
        console.error(`Failed to process mutation ${mutation.id}:`, err);
        break; // Keep mutation in queue and retry on next heartbeat/trigger
      }

      if (success) {
        const currentQueue = await getSyncQueue();
        const updatedQueue = currentQueue.filter(m => m.id !== mutation.id);
        await saveSyncQueue(updatedQueue);
      } else {
        break;
      }
    }
  } catch (globalErr) {
    console.error('Global sync queue processor error:', globalErr);
  } finally {
    isProcessingQueue = false;
  }
};

if (typeof window !== 'undefined') {
  window.addEventListener('taka_trigger_sync_queue', () => {
    processSyncQueue();
  });
  setInterval(() => {
    processSyncQueue();
  }, 10000);
}

const recoverMissedData = async (supabaseClient) => {
  try {
    const tenantId = (await import('./tenant.js')).getTenantId();
    const queue = await getSyncQueue();

    // 1. Recover active dept orders
    const { data: latestOrders } = await supabaseClient
      .from('dept_orders')
      .select('id, table_id, table_name, waiter_code, waiter_name, timestamp, items, subtotal, tax, service_charge, total, status, restaurant_id')
      .eq('restaurant_id', tenantId);

    if (latestOrders) {
      const localData = await readRecord(DEPT_ORDERS_KEY, {});
      const merged = mergeFetchedData(DEPT_ORDERS_KEY, latestOrders, localData, queue);
      cache[DEPT_ORDERS_KEY] = clone(merged);
      await writeRecord(DEPT_ORDERS_KEY, merged);
      triggerSync(DEPT_ORDERS_KEY);
    }

    // 2. Recover tables
    const { data: latestTables } = await supabaseClient
      .from('tables')
      .select('id, name, seats, area, status, current_order, notes, subtotal, tax, service_charge, total, waiter_code, seated_at, guests, restaurant_id')
      .eq('restaurant_id', tenantId);
    if (latestTables) {
      const localData = await readRecord(TABLES_KEY, []);
      const merged = mergeFetchedData(TABLES_KEY, latestTables, localData, queue);
      cache[TABLES_KEY] = clone(merged);
      await writeRecord(TABLES_KEY, merged);
      triggerSync(TABLES_KEY);
    }

    // 3. Recover recent bills (last 24 hours)
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const { data: latestBills } = await supabaseClient
      .from('bills')
      .select('id, table_id, table_name, cashier_code, cashier_name, timestamp, date_formatted, time_formatted, items, subtotal, tax, service_charge, total, payment_method, notes, restaurant_id')
      .eq('restaurant_id', tenantId)
      .gt('timestamp', oneDayAgo);
    if (latestBills) {
      const localData = await readRecord(BILLS_KEY, []);
      const merged = mergeFetchedData(BILLS_KEY, latestBills, localData, queue);
      cache[BILLS_KEY] = clone(merged);
      await writeRecord(BILLS_KEY, merged);
      triggerSync(BILLS_KEY);
    }

    // 4. Recover notifications
    const { data: latestNotifs } = await supabaseClient
      .from('notifications')
      .select('id, title, message, type, target_roles, target_role, target_department, timestamp, read, restaurant_id')
      .eq('restaurant_id', tenantId)
      .order('timestamp', { ascending: false })
      .limit(30);
    if (latestNotifs) {
      const localData = await readRecord(NOTIFICATIONS_KEY, []);
      const merged = mergeFetchedData(NOTIFICATIONS_KEY, latestNotifs, localData, queue);
      merged.sort((a, b) => b.timestamp - a.timestamp);
      cache[NOTIFICATIONS_KEY] = clone(merged);
      await writeRecord(NOTIFICATIONS_KEY, merged);
      triggerSync(NOTIFICATIONS_KEY);
    }
  } catch (err) {
    console.error('Failed to recover missed data:', err);
  }
};

export const initializeDatabase = async () => {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    if (!networkListenersAttached && typeof window !== 'undefined') {
      networkListenersAttached = true;
      dispatchConnectionStatus(window.navigator?.onLine !== false);
      window.addEventListener('online', () => {
        dispatchConnectionStatus(true);
        if (triggerReconnect) triggerReconnect();
        processSyncQueue();
      });
      window.addEventListener('offline', () => dispatchConnectionStatus(false));
    }

    await seedIfMissing(TABLES_KEY, DEFAULT_TABLES);
    await seedIfMissing(EMPLOYEES_KEY, DEFAULT_EMPLOYEES);
    await seedIfMissing(BILLS_KEY, []);
    await seedIfMissing(NOTIFICATIONS_KEY, []);
    await seedIfMissing(MENU_KEY, DEFAULT_MENU.length ? DEFAULT_MENU : []);
    await seedIfMissing(DEPT_ORDERS_KEY, {});
    await seedIfMissing(SESSION_KEY, null);
    await seedIfMissing(DEPARTMENTS_KEY, DEFAULT_DEPARTMENTS);

    if (supabase) {
      try {
        const tenantId = (await import('./tenant.js')).getTenantId();
        const queue = await getSyncQueue();

        // 1. Initial Tables fetch
        const { data: tables } = await supabase
          .from('tables')
          .select('id, name, seats, area, status, current_order, notes, subtotal, tax, service_charge, total, waiter_code, seated_at, guests, restaurant_id')
          .eq('restaurant_id', tenantId);
        if (tables && tables.length > 0) {
          const localData = await readRecord(TABLES_KEY, []);
          const merged = mergeFetchedData(TABLES_KEY, tables, localData, queue);
          cache[TABLES_KEY] = clone(merged);
          await writeRecord(TABLES_KEY, merged);
          triggerSync(TABLES_KEY);
        }

        // 2. Initial Menu fetch
        const { data: menu } = await supabase
          .from('menu')
          .select('id, name_ar, name_en, name, category, price, description, image, department, available, prep_time, restaurant_id')
          .eq('restaurant_id', tenantId);
        if (menu && menu.length > 0) {
          const localData = await readRecord(MENU_KEY, []);
          const merged = mergeFetchedData(MENU_KEY, menu, localData, queue);
          cache[MENU_KEY] = clone(merged);
          await writeRecord(MENU_KEY, merged);
          triggerSync(MENU_KEY);
        }

        // 3. Initial Bills fetch (only last 24 hours of bills)
        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
        const { data: bills } = await supabase
          .from('bills')
          .select('id, table_id, table_name, cashier_code, cashier_name, timestamp, date_formatted, time_formatted, items, subtotal, tax, service_charge, total, payment_method, notes, restaurant_id')
          .eq('restaurant_id', tenantId)
          .gt('timestamp', oneDayAgo);
        if (bills && bills.length > 0) {
          const localData = await readRecord(BILLS_KEY, []);
          const merged = mergeFetchedData(BILLS_KEY, bills, localData, queue);
          cache[BILLS_KEY] = clone(merged);
          await writeRecord(BILLS_KEY, merged);
          triggerSync(BILLS_KEY);
        }

        // 4. Initial Employees fetch
        const { data: employees } = await supabase
          .from('employees')
          .select('id, name, name_en, role, username, password, code, phone, email, salary, active, last_login, restaurant_id')
          .eq('restaurant_id', tenantId);
        if (employees && employees.length > 0) {
          const localData = await readRecord(EMPLOYEES_KEY, []);
          const merged = mergeFetchedData(EMPLOYEES_KEY, employees, localData, queue);
          cache[EMPLOYEES_KEY] = clone(merged);
          await writeRecord(EMPLOYEES_KEY, merged);
          triggerSync(EMPLOYEES_KEY);
        }

        // 5. Initial Departments fetch
        const { data: depts } = await supabase
          .from('departments')
          .select('id, name, name_en, icon, color, description, work_hours, active_orders, last_order_at, restaurant_id')
          .eq('restaurant_id', tenantId);
        if (depts && depts.length > 0) {
          const localData = await readRecord(DEPARTMENTS_KEY, []);
          const merged = mergeFetchedData(DEPARTMENTS_KEY, depts, localData, queue);
          cache[DEPARTMENTS_KEY] = clone(merged);
          await writeRecord(DEPARTMENTS_KEY, merged);
          triggerSync(DEPARTMENTS_KEY);
        }

        // 6. Initial Notifications fetch (only top 30)
        const { data: notifs } = await supabase
          .from('notifications')
          .select('id, title, message, type, target_roles, target_role, target_department, timestamp, read, restaurant_id')
          .eq('restaurant_id', tenantId)
          .order('timestamp', { ascending: false })
          .limit(30);
        if (notifs && notifs.length > 0) {
          const localData = await readRecord(NOTIFICATIONS_KEY, []);
          const merged = mergeFetchedData(NOTIFICATIONS_KEY, notifs, localData, queue);
          merged.sort((a, b) => b.timestamp - a.timestamp);
          cache[NOTIFICATIONS_KEY] = clone(merged);
          await writeRecord(NOTIFICATIONS_KEY, merged);
          triggerSync(NOTIFICATIONS_KEY);
        }

        // 7. Initial Dept Orders fetch
        const { data: deptOrders } = await supabase
          .from('dept_orders')
          .select('id, table_id, table_name, waiter_code, waiter_name, timestamp, items, subtotal, tax, service_charge, total, status, restaurant_id')
          .eq('restaurant_id', tenantId);
        if (deptOrders && deptOrders.length > 0) {
          const localData = await readRecord(DEPT_ORDERS_KEY, {});
          const merged = mergeFetchedData(DEPT_ORDERS_KEY, deptOrders, localData, queue);
          cache[DEPT_ORDERS_KEY] = clone(merged);
          await writeRecord(DEPT_ORDERS_KEY, merged);
          triggerSync(DEPT_ORDERS_KEY);
        }

        // Process any mutations left in the queue upon startup
        processSyncQueue();

        const filterConfig = { filter: `restaurant_id=eq.${tenantId}` };
        let retryCount = 0;
        const MAX_RETRIES = 10;
        let channel = null;

        const setupRealtimeChannel = () => {
          if (channel) {
            try {
              supabase.removeChannel(channel);
            } catch {
              // ignore
            }
          }

          channel = supabase.channel('taka_main_channel');

          channel
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tables', ...filterConfig }, async (payload) => {
              const queue = await getSyncQueue();
              const current = cache[TABLES_KEY] || [];
              let updated = [...current];

              if (payload.eventType === 'DELETE') {
                if (!isItemInSyncQueue(queue, TABLES_KEY, payload.old.id)) {
                  updated = updated.filter(t => t.id !== payload.old.id);
                }
              } else {
                const item = mapFromDB(payload.new, TABLE_FIELD_MAP);
                if (!isItemInSyncQueue(queue, TABLES_KEY, item.id)) {
                  const idx = updated.findIndex(t => t.id === item.id);
                  if (idx !== -1) {
                    updated[idx] = item;
                  } else {
                    updated.push(item);
                  }
                }
              }

              updated.sort((a, b) => a.id - b.id);
              cache[TABLES_KEY] = clone(updated);
              await writeRecord(TABLES_KEY, updated);
              triggerSync(TABLES_KEY);
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'dept_orders', ...filterConfig }, async (payload) => {
              const queue = await getSyncQueue();
              const current = cache[DEPT_ORDERS_KEY] || {};
              const updated = { ...current };

              if (payload.eventType === 'DELETE') {
                if (!isItemInSyncQueue(queue, DEPT_ORDERS_KEY, payload.old.id)) {
                  delete updated[payload.old.id];
                }
              } else {
                const item = mapFromDB(payload.new, DEPT_ORDER_FIELD_MAP);
                if (!isItemInSyncQueue(queue, DEPT_ORDERS_KEY, item.id)) {
                  updated[item.id] = item;
                }
              }

              cache[DEPT_ORDERS_KEY] = clone(updated);
              await writeRecord(DEPT_ORDERS_KEY, updated);
              triggerSync(DEPT_ORDERS_KEY);
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'bills', ...filterConfig }, async (payload) => {
              const queue = await getSyncQueue();
              const current = cache[BILLS_KEY] || [];
              let updated = [...current];

              if (payload.eventType === 'DELETE') {
                if (!isItemInSyncQueue(queue, BILLS_KEY, payload.old.id)) {
                  updated = updated.filter(b => b.id !== payload.old.id);
                }
              } else {
                const item = mapFromDB(payload.new, BILL_FIELD_MAP);
                if (!isItemInSyncQueue(queue, BILLS_KEY, item.id)) {
                  const idx = updated.findIndex(b => b.id === item.id);
                  if (idx !== -1) {
                    updated[idx] = item;
                  } else {
                    updated.push(item);
                  }
                }
              }

              cache[BILLS_KEY] = clone(updated);
              await writeRecord(BILLS_KEY, updated);
              triggerSync(BILLS_KEY);
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'menu', ...filterConfig }, async (payload) => {
              const queue = await getSyncQueue();
              const current = cache[MENU_KEY] || [];
              let updated = [...current];

              if (payload.eventType === 'DELETE') {
                if (!isItemInSyncQueue(queue, MENU_KEY, payload.old.id)) {
                  updated = updated.filter(m => m.id !== payload.old.id);
                }
              } else {
                const item = mapFromDB(payload.new, MENU_FIELD_MAP);
                if (!isItemInSyncQueue(queue, MENU_KEY, item.id)) {
                  const idx = updated.findIndex(m => m.id === item.id);
                  if (idx !== -1) {
                    updated[idx] = item;
                  } else {
                    updated.push(item);
                  }
                }
              }

              cache[MENU_KEY] = clone(updated);
              await writeRecord(MENU_KEY, updated);
              triggerSync(MENU_KEY);
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'employees', ...filterConfig }, async (payload) => {
              const queue = await getSyncQueue();
              const current = cache[EMPLOYEES_KEY] || [];
              let updated = [...current];

              if (payload.eventType === 'DELETE') {
                if (!isItemInSyncQueue(queue, EMPLOYEES_KEY, payload.old.id)) {
                  updated = updated.filter(e => e.id !== payload.old.id);
                }
              } else {
                const item = mapFromDB(payload.new, EMPLOYEE_FIELD_MAP);
                if (!isItemInSyncQueue(queue, EMPLOYEES_KEY, item.id)) {
                  const idx = updated.findIndex(e => e.id === item.id);
                  if (idx !== -1) {
                    updated[idx] = item;
                  } else {
                    updated.push(item);
                  }
                }
              }

              const normalized = updated.map(normalizeEmployee);
              cache[EMPLOYEES_KEY] = clone(normalized);
              await writeRecord(EMPLOYEES_KEY, normalized);
              triggerSync(EMPLOYEES_KEY);
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'departments', ...filterConfig }, async (payload) => {
              const queue = await getSyncQueue();
              const current = cache[DEPARTMENTS_KEY] || [];
              let updated = [...current];

              if (payload.eventType === 'DELETE') {
                if (!isItemInSyncQueue(queue, DEPARTMENTS_KEY, payload.old.id)) {
                  updated = updated.filter(d => d.id !== payload.old.id);
                }
              } else {
                const item = mapFromDB(payload.new, DEPARTMENT_FIELD_MAP);
                if (!isItemInSyncQueue(queue, DEPARTMENTS_KEY, item.id)) {
                  const idx = updated.findIndex(d => d.id === item.id);
                  if (idx !== -1) {
                    updated[idx] = item;
                  } else {
                    updated.push(item);
                  }
                }
              }

              cache[DEPARTMENTS_KEY] = clone(updated);
              await writeRecord(DEPARTMENTS_KEY, updated);
              triggerSync(DEPARTMENTS_KEY);
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', ...filterConfig }, async (payload) => {
              const queue = await getSyncQueue();
              const current = cache[NOTIFICATIONS_KEY] || [];
              let updated = [...current];

              if (payload.eventType === 'DELETE') {
                if (!isItemInSyncQueue(queue, NOTIFICATIONS_KEY, payload.old.id)) {
                  updated = updated.filter(n => n.id !== payload.old.id);
                }
              } else {
                const item = mapFromDB(payload.new, NOTIFICATION_FIELD_MAP);
                if (!isItemInSyncQueue(queue, NOTIFICATIONS_KEY, item.id)) {
                  const idx = updated.findIndex(n => n.id === item.id);
                  if (idx !== -1) {
                    updated[idx] = item;
                  } else {
                    updated.push(item);
                  }
                }
              }

              updated.sort((a, b) => b.timestamp - a.timestamp);
              cache[NOTIFICATIONS_KEY] = clone(updated);
              await writeRecord(NOTIFICATIONS_KEY, updated);
              triggerSync(NOTIFICATIONS_KEY);
            })
            .subscribe(async (status) => {
              if (status === 'SUBSCRIBED') {
                retryCount = 0;
                dispatchConnectionStatus(true);
                await recoverMissedData(supabase);
              }
              if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
                dispatchConnectionStatus(false);
                if (retryCount < MAX_RETRIES) {
                  retryCount++;
                  const delay = Math.min(1000 * retryCount, 10000);
                  setTimeout(() => setupRealtimeChannel(), delay);
                }
              }
            });
        };

        triggerReconnect = () => {
          retryCount = 0;
          setupRealtimeChannel();
        };

        setupRealtimeChannel();

      } catch (err) {
        console.error('Supabase sync error:', err);
      }
    }
    return true;
  })();
  return initPromise;
};

export const refreshCache = async () => {
  cache[TABLES_KEY] = await readRecord(TABLES_KEY, DEFAULT_TABLES);
  cache[EMPLOYEES_KEY] = (await readRecord(EMPLOYEES_KEY, DEFAULT_EMPLOYEES)).map(normalizeEmployee);
  cache[BILLS_KEY] = await readRecord(BILLS_KEY, []);
  cache[NOTIFICATIONS_KEY] = await readRecord(NOTIFICATIONS_KEY, []);
  cache[MENU_KEY] = await readRecord(MENU_KEY, DEFAULT_MENU);
  cache[DEPT_ORDERS_KEY] = await readRecord(DEPT_ORDERS_KEY, {});
  cache[SESSION_KEY] = await readRecord(SESSION_KEY, null);
  cache[DEPARTMENTS_KEY] = await readRecord(DEPARTMENTS_KEY, DEFAULT_DEPARTMENTS);
};

export const resetDailyData = async () => {
  cache[TABLES_KEY] = clone(DEFAULT_TABLES);
  cache[BILLS_KEY] = [];
  cache[NOTIFICATIONS_KEY] = [];
  cache[DEPT_ORDERS_KEY] = {};

  await writeRecord(TABLES_KEY, DEFAULT_TABLES);
  await writeRecord(BILLS_KEY, []);
  await writeRecord(NOTIFICATIONS_KEY, []);
  await writeRecord(DEPT_ORDERS_KEY, {});

  triggerSync(TABLES_KEY);
  triggerSync(BILLS_KEY);
  triggerSync(NOTIFICATIONS_KEY);
  triggerSync(DEPT_ORDERS_KEY);
  triggerSync('reset');

  if (supabase) {
    try {
      const mappedTables = DEFAULT_TABLES.map(t => mapToDB(t, TABLE_FIELD_MAP));
      await supabase.from('tables').upsert(mappedTables);
      await supabase.from('bills').delete().neq('id', 'dummy');
      await supabase.from('notifications').delete().neq('id', 'dummy');
      await supabase.from('dept_orders').delete().neq('id', 'dummy');
    } catch (err) {
      console.error('Supabase reset error:', err);
    }
  }
  return true;
};
