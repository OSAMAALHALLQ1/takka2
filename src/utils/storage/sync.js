import { supabase } from '../supabaseClient.js';
import { cache, persist, writeRecord, readRecord, triggerSync } from './core.js';
import { clone, mapFromDB, mapToDB, normalizeEmployee } from './helpers.js';
import {
  TABLES_KEY, EMPLOYEES_KEY, BILLS_KEY, NOTIFICATIONS_KEY,
  MENU_KEY, DEPT_ORDERS_KEY, SESSION_KEY, DEPARTMENTS_KEY,
  TABLE_FIELD_MAP, MENU_FIELD_MAP, DEPT_ORDER_FIELD_MAP, BILL_FIELD_MAP, EMPLOYEE_FIELD_MAP, DEPARTMENT_FIELD_MAP, NOTIFICATION_FIELD_MAP
} from './constants.js';
import { DEFAULT_TABLES, DEFAULT_MENU, DEFAULT_EMPLOYEES, DEFAULT_DEPARTMENTS } from './defaults.js';

let initialized = false;

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

export const initializeDatabase = async () => {
  if (initialized) return true;
  await seedIfMissing(TABLES_KEY, DEFAULT_TABLES);
  await seedIfMissing(EMPLOYEES_KEY, DEFAULT_EMPLOYEES);
  await seedIfMissing(BILLS_KEY, []);
  await seedIfMissing(NOTIFICATIONS_KEY, []);
  await seedIfMissing(MENU_KEY, DEFAULT_MENU.length ? DEFAULT_MENU : []);
  await seedIfMissing(DEPT_ORDERS_KEY, {});
  await seedIfMissing(SESSION_KEY, null);
  await seedIfMissing(DEPARTMENTS_KEY, DEFAULT_DEPARTMENTS);
  initialized = true;

  if (supabase) {
    try {
      const tenantId = (await import('./tenant.js')).getTenantId();
      
      const { data: tables } = await supabase.from('tables').select('*').eq('restaurant_id', tenantId);
      if (tables && tables.length > 0) {
        const mapped = tables.map(t => mapFromDB(t, TABLE_FIELD_MAP));
        cache[TABLES_KEY] = clone(mapped);
        await writeRecord(TABLES_KEY, mapped);
        triggerSync(TABLES_KEY);
      }
      
      const { data: menu } = await supabase.from('menu').select('*').eq('restaurant_id', tenantId);
      if (menu && menu.length > 0) {
        const mapped = menu.map(m => mapFromDB(m, MENU_FIELD_MAP));
        cache[MENU_KEY] = clone(mapped);
        await writeRecord(MENU_KEY, mapped);
        triggerSync(MENU_KEY);
      }
      
      const { data: bills } = await supabase.from('bills').select('*').eq('restaurant_id', tenantId);
      if (bills && bills.length > 0) {
        const mapped = bills.map(b => mapFromDB(b, BILL_FIELD_MAP));
        cache[BILLS_KEY] = clone(mapped);
        await writeRecord(BILLS_KEY, mapped);
        triggerSync(BILLS_KEY);
      }

      const { data: employees } = await supabase.from('employees').select('*').eq('restaurant_id', tenantId);
      if (employees && employees.length > 0) {
        const mapped = employees.map(e => mapFromDB(e, EMPLOYEE_FIELD_MAP));
        cache[EMPLOYEES_KEY] = clone(mapped);
        await writeRecord(EMPLOYEES_KEY, mapped);
        triggerSync(EMPLOYEES_KEY);
      }

      const { data: depts } = await supabase.from('departments').select('*').eq('restaurant_id', tenantId);
      if (depts && depts.length > 0) {
        const mapped = depts.map(d => mapFromDB(d, DEPARTMENT_FIELD_MAP));
        cache[DEPARTMENTS_KEY] = clone(mapped);
        await writeRecord(DEPARTMENTS_KEY, mapped);
        triggerSync(DEPARTMENTS_KEY);
      }

      const { data: notifs } = await supabase.from('notifications').select('*').eq('restaurant_id', tenantId);
      if (notifs && notifs.length > 0) {
        const mapped = notifs.map(n => mapFromDB(n, NOTIFICATION_FIELD_MAP));
        cache[NOTIFICATIONS_KEY] = clone(mapped);
        await writeRecord(NOTIFICATIONS_KEY, mapped);
        triggerSync(NOTIFICATIONS_KEY);
      }

      const { data: deptOrders } = await supabase.from('dept_orders').select('*').eq('restaurant_id', tenantId);
      if (deptOrders && deptOrders.length > 0) {
        const map = {};
        deptOrders.forEach(d => {
          const jsObj = mapFromDB(d, DEPT_ORDER_FIELD_MAP);
          map[jsObj.id] = jsObj;
        });
        cache[DEPT_ORDERS_KEY] = clone(map);
        await writeRecord(DEPT_ORDERS_KEY, map);
        triggerSync(DEPT_ORDERS_KEY);
      }
      
      const filterConfig = { filter: `restaurant_id=eq.${tenantId}` };

      supabase.channel('public:tables').on('postgres_changes', { event: '*', schema: 'public', table: 'tables', ...filterConfig }, async (payload) => {
        const current = cache[TABLES_KEY] || [];
        let updated = [...current];
        
        if (payload.eventType === 'DELETE') {
          updated = updated.filter(t => t.id !== payload.old.id);
        } else {
          const item = mapFromDB(payload.new, TABLE_FIELD_MAP);
          const idx = updated.findIndex(t => t.id === item.id);
          if (idx !== -1) {
            updated[idx] = item;
          } else {
            updated.push(item);
          }
        }
        
        updated.sort((a, b) => a.id - b.id);
        cache[TABLES_KEY] = clone(updated);
        await writeRecord(TABLES_KEY, updated);
        triggerSync(TABLES_KEY);
      }).subscribe();
      
      supabase.channel('public:dept_orders').on('postgres_changes', { event: '*', schema: 'public', table: 'dept_orders', ...filterConfig }, async (payload) => {
        const current = cache[DEPT_ORDERS_KEY] || {};
        const updated = { ...current };
        
        if (payload.eventType === 'DELETE') {
          delete updated[payload.old.id];
        } else {
          const item = mapFromDB(payload.new, DEPT_ORDER_FIELD_MAP);
          updated[item.id] = item;
        }
        
        cache[DEPT_ORDERS_KEY] = clone(updated);
        await writeRecord(DEPT_ORDERS_KEY, updated);
        triggerSync(DEPT_ORDERS_KEY);
      }).subscribe();

      supabase.channel('public:bills').on('postgres_changes', { event: '*', schema: 'public', table: 'bills', ...filterConfig }, async (payload) => {
        const current = cache[BILLS_KEY] || [];
        let updated = [...current];
        
        if (payload.eventType === 'DELETE') {
          updated = updated.filter(b => b.id !== payload.old.id);
        } else {
          const item = mapFromDB(payload.new, BILL_FIELD_MAP);
          const idx = updated.findIndex(b => b.id === item.id);
          if (idx !== -1) {
            updated[idx] = item;
          } else {
            updated.push(item);
          }
        }
        
        cache[BILLS_KEY] = clone(updated);
        await writeRecord(BILLS_KEY, updated);
        triggerSync(BILLS_KEY);
      }).subscribe();

      supabase.channel('public:menu').on('postgres_changes', { event: '*', schema: 'public', table: 'menu', ...filterConfig }, async (payload) => {
        const current = cache[MENU_KEY] || [];
        let updated = [...current];
        
        if (payload.eventType === 'DELETE') {
          updated = updated.filter(m => m.id !== payload.old.id);
        } else {
          const item = mapFromDB(payload.new, MENU_FIELD_MAP);
          const idx = updated.findIndex(m => m.id === item.id);
          if (idx !== -1) {
            updated[idx] = item;
          } else {
            updated.push(item);
          }
        }
        
        cache[MENU_KEY] = clone(updated);
        await writeRecord(MENU_KEY, updated);
        triggerSync(MENU_KEY);
      }).subscribe();

      supabase.channel('public:employees').on('postgres_changes', { event: '*', schema: 'public', table: 'employees', ...filterConfig }, async (payload) => {
        const current = cache[EMPLOYEES_KEY] || [];
        let updated = [...current];
        
        if (payload.eventType === 'DELETE') {
          updated = updated.filter(e => e.id !== payload.old.id);
        } else {
          const item = mapFromDB(payload.new, EMPLOYEE_FIELD_MAP);
          const idx = updated.findIndex(e => e.id === item.id);
          if (idx !== -1) {
            updated[idx] = item;
          } else {
            updated.push(item);
          }
        }
        
        const normalized = updated.map(normalizeEmployee);
        cache[EMPLOYEES_KEY] = clone(normalized);
        await writeRecord(EMPLOYEES_KEY, normalized);
        triggerSync(EMPLOYEES_KEY);
      }).subscribe();

      supabase.channel('public:departments').on('postgres_changes', { event: '*', schema: 'public', table: 'departments', ...filterConfig }, async (payload) => {
        const current = cache[DEPARTMENTS_KEY] || [];
        let updated = [...current];
        
        if (payload.eventType === 'DELETE') {
          updated = updated.filter(d => d.id !== payload.old.id);
        } else {
          const item = mapFromDB(payload.new, DEPARTMENT_FIELD_MAP);
          const idx = updated.findIndex(d => d.id === item.id);
          if (idx !== -1) {
            updated[idx] = item;
          } else {
            updated.push(item);
          }
        }
        
        cache[DEPARTMENTS_KEY] = clone(updated);
        await writeRecord(DEPARTMENTS_KEY, updated);
        triggerSync(DEPARTMENTS_KEY);
      }).subscribe();

      supabase.channel('public:notifications').on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', ...filterConfig }, async (payload) => {
        const current = cache[NOTIFICATIONS_KEY] || [];
        let updated = [...current];
        
        if (payload.eventType === 'DELETE') {
          updated = updated.filter(n => n.id !== payload.old.id);
        } else {
          const item = mapFromDB(payload.new, NOTIFICATION_FIELD_MAP);
          const idx = updated.findIndex(n => n.id === item.id);
          if (idx !== -1) {
            updated[idx] = item;
          } else {
            updated.push(item);
          }
        }
        
        updated.sort((a, b) => b.timestamp - a.timestamp);
        cache[NOTIFICATIONS_KEY] = clone(updated);
        await writeRecord(NOTIFICATIONS_KEY, updated);
        triggerSync(NOTIFICATIONS_KEY);
      }).subscribe();
    } catch (err) {
      console.error('Supabase sync error:', err);
    }
  }

  return true;
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
