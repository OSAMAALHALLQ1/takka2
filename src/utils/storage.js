const DB_NAME = 'taka_restaurant_v2';
const DB_VERSION = 1;
const STORE_NAME = 'records';

const TABLES_KEY = 'tables';
const EMPLOYEES_KEY = 'employees';
const BILLS_KEY = 'bills';
const NOTIFICATIONS_KEY = 'notifications';
const MENU_KEY = 'menu';
const DEPT_ORDERS_KEY = 'department_orders';
const SESSION_KEY = 'session';
const DEPARTMENTS_KEY = 'departments';

export const TAX_RATE = 0;
export const SERVICE_RATE = 0;
export const MAX_NOTIFICATIONS = 30;
export const MAX_BILLS_KEPT = 1000;

// Mapping helpers to resolve JS camelCase vs Database snake_case mismatch
const TABLE_FIELD_MAP = {
  id: 'id',
  name: 'name',
  seats: 'seats',
  area: 'area',
  status: 'status',
  currentOrder: 'current_order',
  notes: 'notes',
  subtotal: 'subtotal',
  tax: 'tax',
  serviceCharge: 'service_charge',
  total: 'total',
  waiterCode: 'waiter_code',
  seatedAt: 'seated_at',
  guests: 'guests'
};

const EMPLOYEE_FIELD_MAP = {
  id: 'id',
  name: 'name',
  nameEn: 'name_en',
  role: 'role',
  username: 'username',
  password: 'password',
  code: 'code',
  phone: 'phone',
  email: 'email',
  salary: 'salary',
  active: 'active',
  lastLogin: 'last_login',
  restaurantName: 'restaurant_name'
};

const MENU_FIELD_MAP = {
  id: 'id',
  nameAr: 'name_ar',
  nameEn: 'name_en',
  name: 'name',
  category: 'category',
  price: 'price',
  description: 'description',
  image: 'image',
  department: 'department',
  available: 'available',
  prepTime: 'prep_time'
};

const DEPARTMENT_FIELD_MAP = {
  id: 'id',
  name: 'name',
  nameEn: 'name_en',
  image: 'icon',
  color: 'color',
  description: 'description',
  workHours: 'work_hours',
  activeOrders: 'active_orders',
  lastOrderAt: 'last_order_at'
};

const BILL_FIELD_MAP = {
  id: 'id',
  tableId: 'table_id',
  tableName: 'table_name',
  cashierCode: 'cashier_code',
  cashierName: 'cashier_name',
  timestamp: 'timestamp',
  dateFormatted: 'date_formatted',
  timeFormatted: 'time_formatted',
  items: 'items',
  subtotal: 'subtotal',
  tax: 'tax',
  serviceCharge: 'service_charge',
  total: 'total',
  paymentMethod: 'payment_method',
  notes: 'notes',
  waiterCode: 'waiter_code',
  seatedAt: 'seated_at',
  seatedDuration: 'seated_duration'
};

const NOTIFICATION_FIELD_MAP = {
  id: 'id',
  title: 'title',
  message: 'message',
  type: 'type',
  targetRoles: 'target_roles',
  timestamp: 'timestamp',
  read: 'read'
};

const DEPT_ORDER_FIELD_MAP = {
  id: 'id',
  tableId: 'table_id',
  tableName: 'table_name',
  waiterCode: 'waiter_code',
  waiterName: 'waiter_name',
  timestamp: 'timestamp',
  items: 'items',
  subtotal: 'subtotal',
  tax: 'tax',
  serviceCharge: 'service_charge',
  total: 'total',
  status: 'status'
};

const mapToDB = (obj, map) => {
  if (!obj || typeof obj !== 'object') return obj;
  const dbObj = {};
  for (const [jsKey, dbKey] of Object.entries(map)) {
    if (obj[jsKey] !== undefined) {
      dbObj[dbKey] = obj[jsKey];
    }
  }
  for (const key of Object.keys(obj)) {
    if (map[key] === undefined && !key.startsWith('_')) {
      const autoSnake = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      dbObj[autoSnake] = obj[key];
    }
  }
  return dbObj;
};

const mapFromDB = (dbObj, map) => {
  if (!dbObj || typeof dbObj !== 'object') return dbObj;
  const jsObj = {};
  const reverseMap = Object.fromEntries(Object.entries(map).map(([k, v]) => [v, k]));
  for (const key of Object.keys(dbObj)) {
    const jsKey = reverseMap[key];
    if (jsKey) {
      jsObj[jsKey] = dbObj[key];
    } else {
      const autoCamel = key.replace(/([-_][a-z])/g, group =>
        group.toUpperCase().replace('-', '').replace('_', '')
      );
      jsObj[autoCamel] = dbObj[key];
    }
  }
  return jsObj;
};

export const getRestaurantName = () => {
  try {
    const emps = cache[EMPLOYEES_KEY] || [];
    const mgr = emps.find(e => e.role === 'manager');
    if (mgr && mgr.restaurantName) return mgr.restaurantName;
    const raw = localStorage.getItem('takka_manager_account');
    if (raw) {
      const acc = JSON.parse(raw);
      if (acc && acc.restaurantName) return acc.restaurantName;
    }
  } catch (e) {
    // ignore
  }
  return 'تكة';
};

export const RESTAURANT_NAME = getRestaurantName();

// Default 15 tables
export const DEFAULT_TABLES = Array.from({ length: 15 }, (_, i) => ({
  id: i + 1,
  name: `طاولة ${i + 1}`,
  seats: i < 5 ? 4 : i < 10 ? 6 : 8,
  area: i < 5 ? 'indoor' : i < 10 ? 'outdoor' : 'terrace',
  status: 'empty',
  currentOrder: [],
  notes: '',
  subtotal: 0,
  tax: 0,
  serviceCharge: 0,
  total: 0,
  waiterCode: null,
  seatedAt: null,
  guests: 0
}));

export const DEFAULT_DEPARTMENTS = [
  {
    id: 'kitchen',
    name: 'المطبخ',
    nameEn: 'Kitchen',
    icon: '🍳',
    image: '🍳',
    color: '#e67e22',
    description: 'قسم الطعام الرئيسي والوجبات',
    workHours: '08:00 - 23:00',
    activeOrders: 0,
    lastOrderAt: null
  },
  {
    id: 'bar',
    name: 'البار',
    nameEn: 'Bar',
    icon: '🍺',
    image: '🍺',
    color: '#1abc9c',
    description: 'قسم المشروبات والعصائر',
    workHours: '08:00 - 24:00',
    activeOrders: 0,
    lastOrderAt: null
  },
  {
    id: 'shisha',
    name: 'الشيشة',
    nameEn: 'Shisha',
    icon: '💨',
    image: '💨',
    color: '#27ae60',
    description: 'قسم الشيشة والأرجيلة',
    workHours: '14:00 - 02:00',
    activeOrders: 0,
    lastOrderAt: null
  }
];

// External menu data will be loaded from JSON generated by scraper
import externalMenu from './external_menu.json';
export const DEFAULT_MENU = externalMenu.length ? externalMenu : [];
  // Kitchen items
  { id: 'k1', nameAr: 'برغر كلاسيكي', nameEn: 'Classic Burger', name: 'برغر كلاسيكي', category: 'mains', price: 8, description: 'برغر لحم مع جبنة وصوص تكة', image: '🍔', department: 'kitchen', available: true, prepTime: 15 },
  { id: 'k2', nameAr: 'برغر جبن مضاعف', nameEn: 'Double Cheese Burger', name: 'برغر جبن مضاعف', category: 'mains', price: 10, description: 'برغر بطبقتين جبنة ولحم أصيل', image: '🍔', department: 'kitchen', available: true, prepTime: 18 },
  { id: 'k3', nameAr: 'شاورما دجاج', nameEn: 'Chicken Shawarma', name: 'شاورما دجاج', category: 'mains', price: 7, description: 'شاورما دجاج بخبز صاج وثومية', image: '🌯', department: 'kitchen', available: true, prepTime: 12 },
  { id: 'k4', nameAr: 'شاورما لحم', nameEn: 'Meat Shawarma', name: 'شاورما لحم', category: 'mains', price: 8, description: 'شاورما لحم بهوية وصلصة حارة', image: '🌯', department: 'kitchen', available: true, prepTime: 14 },
  { id: 'k5', nameAr: 'بيتزا مارغريتا', nameEn: 'Margherita Pizza', name: 'بيتزا مارغريتا', category: 'mains', price: 12, description: 'صلصة طماطم وموزاريلا وريحان', image: '🍕', department: 'kitchen', available: true, prepTime: 20 },
  { id: 'k6', nameAr: 'بيتزا ببيروني', nameEn: 'Pepperoni Pizza', name: 'بيتزا ببيروني', category: 'mains', price: 14, description: 'ببيروني فاخر مع موزاريلا طازجة', image: '🍕', department: 'kitchen', available: true, prepTime: 22 },
  { id: 'k7', nameAr: 'فريز دجاج', nameEn: 'Crispy Chicken', name: 'فريز دجاج', category: 'appetizers', price: 6, description: 'دجاج مقرمش مع بطاطا ذهبية', image: '🍗', department: 'kitchen', available: true, prepTime: 15 },
  { id: 'k8', nameAr: 'دجاج مشوي', nameEn: 'Grilled Chicken', name: 'دجاج مشوي', category: 'mains', price: 10, description: 'نصف دجاجة مشوية مع أعشاب', image: '🍗', department: 'kitchen', available: true, prepTime: 25 },
  { id: 'k9', nameAr: 'سلطة خضار', nameEn: 'Garden Salad', name: 'سلطة خضار', category: 'appetizers', price: 5, description: 'سلطة طازجة مع توابل البيت', image: '🥗', department: 'kitchen', available: true, prepTime: 8 },
  // Bar items
  { id: 'b1', nameAr: 'كولا صغير', nameEn: 'Cola Small', name: 'كولا صغير', category: 'drinks', price: 2, description: 'مشروب كولا بارد', image: '🥤', department: 'bar', available: true, prepTime: 2 },
  { id: 'b2', nameAr: 'كولا كبير', nameEn: 'Cola Large', name: 'كولا كبير', category: 'drinks', price: 3, description: 'مشروب كولا بارد حجم كبير', image: '🥤', department: 'bar', available: true, prepTime: 2 },
  { id: 'b3', nameAr: 'عصير برتقال', nameEn: 'Orange Juice', name: 'عصير برتقال', category: 'drinks', price: 4, description: 'عصير برتقال طبيعي طازج', image: '🍊', department: 'bar', available: true, prepTime: 5 },
  { id: 'b4', nameAr: 'عصير ليمون', nameEn: 'Lemon Juice', name: 'عصير ليمون', category: 'drinks', price: 3.5, description: 'عصير ليمون منعش', image: '🍋', department: 'bar', available: true, prepTime: 5 },
  { id: 'b5', nameAr: 'عصير تفاح', nameEn: 'Apple Juice', name: 'عصير تفاح', category: 'drinks', price: 4, description: 'عصير تفاح حلو طازج', image: '🍎', department: 'bar', available: true, prepTime: 4 },
  { id: 'b6', nameAr: 'ليموناضة طازة', nameEn: 'Fresh Lemonade', name: 'ليموناضة طازة', category: 'drinks', price: 4, description: 'ليمون منعش بالنعناع والثلج', image: '🍹', department: 'bar', available: true, prepTime: 6 },
  { id: 'b7', nameAr: 'ماء معدني', nameEn: 'Mineral Water', name: 'ماء معدني', category: 'drinks', price: 2, description: 'زجاجة ماء معدني بارد', image: '💧', department: 'bar', available: true, prepTime: 1 },
  { id: 'b8', nameAr: 'قهوة عربية', nameEn: 'Arabic Coffee', name: 'قهوة عربية', category: 'drinks', price: 3, description: 'قهوة عربية أصيلة بالهيل', image: '☕', department: 'bar', available: true, prepTime: 5 },
  { id: 'b9', nameAr: 'شاي بالنعناع', nameEn: 'Mint Tea', name: 'شاي بالنعناع', category: 'drinks', price: 2.5, description: 'شاي أسود بأوراق النعناع الطازجة', image: '🍵', department: 'bar', available: true, prepTime: 5 },
  // Shisha items
  { id: 's1', nameAr: 'شيشة تفاحتين', nameEn: 'Double Apple Shisha', name: 'شيشة تفاحتين', category: 'shisha', price: 15, description: 'نكهة تفاحتين كلاسيكية', image: '💨', department: 'shisha', available: true, prepTime: 10 },
  { id: 's2', nameAr: 'شيشة نعناع', nameEn: 'Mint Shisha', name: 'شيشة نعناع', category: 'shisha', price: 15, description: 'نكهة نعناع منعشة وباردة', image: '🌿', department: 'shisha', available: true, prepTime: 10 },
  { id: 's3', nameAr: 'شيشة كريمة', nameEn: 'Cream Shisha', name: 'شيشة كريمة', category: 'shisha', price: 18, description: 'نكهة كريمة ناعمة فاخرة', image: '🍦', department: 'shisha', available: true, prepTime: 12 },
  { id: 's4', nameAr: 'شيشة فاكهة مشكلة', nameEn: 'Mixed Fruit Shisha', name: 'شيشة فاكهة مشكلة', category: 'shisha', price: 20, description: 'خلطة فواكه خاصة متنوعة', image: '🍓', department: 'shisha', available: true, prepTime: 12 },
  { id: 's5', nameAr: 'شيشة برتقال', nameEn: 'Orange Shisha', name: 'شيشة برتقال', category: 'shisha', price: 16, description: 'نكهة برتقال طازج وحامض', image: '🍊', department: 'shisha', available: true, prepTime: 10 },
  { id: 's6', nameAr: 'شيشة فراولة', nameEn: 'Strawberry Shisha', name: 'شيشة فراولة', category: 'shisha', price: 17, description: 'نكهة فراولة حلوة ومنعشة', image: '🍓', department: 'shisha', available: true, prepTime: 10 }
];

export const DEFAULT_EMPLOYEES = [
  { id: 'admin-1', name: 'مدير تكة', nameEn: 'Taka Manager', role: 'manager', username: 'admin', password: 'admin123', code: 'ADMIN', phone: '0790000000', email: 'admin@taka.com', salary: 0, active: true, lastLogin: null },
  { id: 'waiter-1', name: 'أحمد الجرسون', nameEn: 'Ahmed Waiter', role: 'waiter', username: 'waiter1', password: '1234', code: 'W-1234', phone: '0791234567', email: 'waiter1@taka.com', salary: 500, active: true, lastLogin: null },
  { id: 'cashier-1', name: 'سارة المحاسبة', nameEn: 'Sara Cashier', role: 'cashier', username: 'cashier1', password: '1234', code: 'C-5678', phone: '0781234567', email: 'cashier1@taka.com', salary: 600, active: true, lastLogin: null },
  { id: 'kitchen-1', name: 'خالد الطباخ', nameEn: 'Khaled Cook', role: 'kitchen', username: 'kitchen1', password: '1234', code: 'K-1111', phone: '0771111111', email: 'kitchen1@taka.com', salary: 550, active: true, lastLogin: null },
  { id: 'bar-1', name: 'محمد البار', nameEn: 'Mohammed Bar', role: 'bar', username: 'bar1', password: '1234', code: 'B-2222', phone: '0772222222', email: 'bar1@taka.com', salary: 480, active: true, lastLogin: null },
  { id: 'shisha-1', name: 'علي الشيشة', nameEn: 'Ali Shisha', role: 'shisha', username: 'shisha1', password: '1234', code: 'S-3333', phone: '0773333333', email: 'shisha1@taka.com', salary: 450, active: true, lastLogin: null }
];

// ───────── IndexedDB core ─────────
let dbPromise = null;
let initialized = false;

const cache = {
  [TABLES_KEY]: DEFAULT_TABLES,
  [EMPLOYEES_KEY]: DEFAULT_EMPLOYEES,
  [BILLS_KEY]: [],
  [NOTIFICATIONS_KEY]: [],
  [MENU_KEY]: DEFAULT_MENU,
  [DEPT_ORDERS_KEY]: {},
  [SESSION_KEY]: null,
  [DEPARTMENTS_KEY]: DEFAULT_DEPARTMENTS
};

const clone = (v) => {
  try { return structuredClone(v); } catch { return JSON.parse(JSON.stringify(v)); }
};

const openDatabase = () => {
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

const readRecord = async (key, fallback) => {
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

const writeRecord = async (key, value) => {
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

const triggerSync = (key) => {
  try { 
    window.dispatchEvent(new CustomEvent('taka_sync', { detail: { key } })); 
    bc.postMessage({ type: 'sync', key });
  } catch { /* noop */ }
};

const normalizeEmployee = (e) => ({
  active: true, salary: 0, email: '', lastLogin: null, ...e
});

const seedIfMissing = async (key, fallback) => {
  const value = await readRecord(key, null);
  // For tables: if existing has fewer than 15 entries, re-seed
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

import { supabase } from './supabaseClient';

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

  // Background Sync from Supabase if configured
  if (supabase) {
    try {
      // 1. Tables
      const { data: tables } = await supabase.from('tables').select('*');
      if (tables && tables.length > 0) {
        const mapped = tables.map(t => mapFromDB(t, TABLE_FIELD_MAP));
        cache[TABLES_KEY] = clone(mapped);
        await writeRecord(TABLES_KEY, mapped);
        triggerSync(TABLES_KEY);
      }
      
      // 2. Menu
      const { data: menu } = await supabase.from('menu').select('*');
      if (menu && menu.length > 0) {
        const mapped = menu.map(m => mapFromDB(m, MENU_FIELD_MAP));
        cache[MENU_KEY] = clone(mapped);
        await writeRecord(MENU_KEY, mapped);
        triggerSync(MENU_KEY);
      }
      
      // 3. Bills
      const { data: bills } = await supabase.from('bills').select('*');
      if (bills && bills.length > 0) {
        const mapped = bills.map(b => mapFromDB(b, BILL_FIELD_MAP));
        cache[BILLS_KEY] = clone(mapped);
        await writeRecord(BILLS_KEY, mapped);
        triggerSync(BILLS_KEY);
      }

      // 4. Employees
      const { data: employees } = await supabase.from('employees').select('*');
      if (employees && employees.length > 0) {
        const mapped = employees.map(e => mapFromDB(e, EMPLOYEE_FIELD_MAP));
        cache[EMPLOYEES_KEY] = clone(mapped);
        await writeRecord(EMPLOYEES_KEY, mapped);
        triggerSync(EMPLOYEES_KEY);
      }

      // 5. Departments
      const { data: depts } = await supabase.from('departments').select('*');
      if (depts && depts.length > 0) {
        const mapped = depts.map(d => mapFromDB(d, DEPARTMENT_FIELD_MAP));
        cache[DEPARTMENTS_KEY] = clone(mapped);
        await writeRecord(DEPARTMENTS_KEY, mapped);
        triggerSync(DEPARTMENTS_KEY);
      }

      // 6. Notifications
      const { data: notifs } = await supabase.from('notifications').select('*');
      if (notifs && notifs.length > 0) {
        const mapped = notifs.map(n => mapFromDB(n, NOTIFICATION_FIELD_MAP));
        cache[NOTIFICATIONS_KEY] = clone(mapped);
        await writeRecord(NOTIFICATIONS_KEY, mapped);
        triggerSync(NOTIFICATIONS_KEY);
      }

      // 7. Dept Orders
      const { data: deptOrders } = await supabase.from('dept_orders').select('*');
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
      
      // Subscribe to real-time changes
      supabase.channel('public:tables').on('postgres_changes', { event: '*', schema: 'public', table: 'tables' }, async (payload) => {
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
      
      supabase.channel('public:dept_orders').on('postgres_changes', { event: '*', schema: 'public', table: 'dept_orders' }, async (payload) => {
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

      supabase.channel('public:bills').on('postgres_changes', { event: '*', schema: 'public', table: 'bills' }, async (payload) => {
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

      supabase.channel('public:menu').on('postgres_changes', { event: '*', schema: 'public', table: 'menu' }, async (payload) => {
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

      supabase.channel('public:employees').on('postgres_changes', { event: '*', schema: 'public', table: 'employees' }, async (payload) => {
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

      supabase.channel('public:departments').on('postgres_changes', { event: '*', schema: 'public', table: 'departments' }, async (payload) => {
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

      supabase.channel('public:notifications').on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, async (payload) => {
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

const persist = async (key, value, changedItemOrId = null) => {
  cache[key] = clone(value);
  await writeRecord(key, value);
  triggerSync(key);

  // Background Push to Supabase if configured
  if (supabase) {
    try {
      if (key === TABLES_KEY && Array.isArray(value)) {
        let itemsToUpsert = value;
        if (changedItemOrId) {
          const id = typeof changedItemOrId === 'object' ? changedItemOrId.id : changedItemOrId;
          const found = value.find(t => t.id === id);
          if (found) itemsToUpsert = [found];
        }
        const mapped = itemsToUpsert.map(t => mapToDB(t, TABLE_FIELD_MAP));
        await supabase.from('tables').upsert(mapped);
      } else if (key === MENU_KEY && Array.isArray(value)) {
        let itemsToUpsert = value;
        if (changedItemOrId) {
          const id = typeof changedItemOrId === 'object' ? changedItemOrId.id : changedItemOrId;
          const found = value.find(m => m.id === id);
          if (found) itemsToUpsert = [found];
        }
        const mapped = itemsToUpsert.map(m => mapToDB(m, MENU_FIELD_MAP));
        await supabase.from('menu').upsert(mapped);
      } else if (key === DEPT_ORDERS_KEY) {
        let itemsToUpsert = Object.values(value);
        if (changedItemOrId) {
          const id = typeof changedItemOrId === 'object' ? changedItemOrId.id : changedItemOrId;
          const found = value[id];
          itemsToUpsert = found ? [found] : [];
        }
        const arr = itemsToUpsert.map(o => mapToDB(o, DEPT_ORDER_FIELD_MAP));
        if (arr.length > 0) await supabase.from('dept_orders').upsert(arr);
      } else if (key === BILLS_KEY && Array.isArray(value)) {
        let itemsToUpsert = value;
        if (changedItemOrId) {
          const id = typeof changedItemOrId === 'object' ? changedItemOrId.id : changedItemOrId;
          const found = value.find(b => b.id === id);
          if (found) itemsToUpsert = [found];
        }
        const mapped = itemsToUpsert.map(b => mapToDB(b, BILL_FIELD_MAP));
        if (mapped.length > 0) await supabase.from('bills').upsert(mapped);
      } else if (key === EMPLOYEES_KEY && Array.isArray(value)) {
        let itemsToUpsert = value;
        if (changedItemOrId) {
          const id = typeof changedItemOrId === 'object' ? changedItemOrId.id : changedItemOrId;
          const found = value.find(e => e.id === id);
          if (found) itemsToUpsert = [found];
        }
        const mapped = itemsToUpsert.map(e => mapToDB(e, EMPLOYEE_FIELD_MAP));
        await supabase.from('employees').upsert(mapped);
      } else if (key === DEPARTMENTS_KEY && Array.isArray(value)) {
        let itemsToUpsert = value;
        if (changedItemOrId) {
          const id = typeof changedItemOrId === 'object' ? changedItemOrId.id : changedItemOrId;
          const found = value.find(d => d.id === id);
          if (found) itemsToUpsert = [found];
        }
        const mapped = itemsToUpsert.map(d => mapToDB(d, DEPARTMENT_FIELD_MAP));
        await supabase.from('departments').upsert(mapped);
      } else if (key === NOTIFICATIONS_KEY && Array.isArray(value)) {
        let itemsToUpsert = value;
        if (changedItemOrId) {
          const id = typeof changedItemOrId === 'object' ? changedItemOrId.id : changedItemOrId;
          const found = value.find(n => n.id === id);
          if (found) itemsToUpsert = [found];
        }
        const mapped = itemsToUpsert.map(n => mapToDB(n, NOTIFICATION_FIELD_MAP));
        if (mapped.length > 0) await supabase.from('notifications').upsert(mapped);
      }
    } catch (err) {
      console.error('Supabase push error:', err);
    }
  }
};

// ───────── Tables ─────────
export const getTables = () => clone(cache[TABLES_KEY]);
export const saveTables = (t) => { if (!Array.isArray(t)) return false; return persist(TABLES_KEY, t); };

// ───────── Employees ─────────
export const getEmployees = () => clone(cache[EMPLOYEES_KEY]).map(normalizeEmployee);
export const saveEmployees = (emps) => {
  if (!Array.isArray(emps)) return false;
  return persist(EMPLOYEES_KEY, emps.map(normalizeEmployee));
};

export const authenticateUser = (username, password) => {
  const u = String(username || '').trim().toLowerCase();
  const p = String(password || '');
  const emp = getEmployees().find(e =>
    e.active !== false &&
    String(e.username || '').trim().toLowerCase() === u &&
    String(e.password || '') === p
  );
  if (!emp) return null;
  const session = { id: emp.id, role: emp.role, name: emp.name, code: emp.code, username: emp.username };
  persist(SESSION_KEY, session);
  // update last login
  const emps = getEmployees().map(e => e.id === emp.id ? { ...e, lastLogin: Date.now() } : e);
  persist(EMPLOYEES_KEY, emps);
  return session;
};

export const authenticateByCode = (inputCode) => {
  const code = String(inputCode || '').trim().toLowerCase();
  const empsList = getEmployees();
  const emp = empsList.find(e =>
    e.active !== false &&
    (String(e.code || '').trim().toLowerCase() === code ||
     String(e.password || '') === code ||
     String(e.username || '').trim().toLowerCase() === code)
  );
  if (!emp) return null;
  
  const isFirstLogin = !emp.lastLogin;
  const session = { id: emp.id, role: emp.role, name: emp.name, code: emp.code, username: emp.username };
  persist(SESSION_KEY, session);
  
  const emps = empsList.map(e => e.id === emp.id ? { ...e, lastLogin: Date.now() } : e);
  persist(EMPLOYEES_KEY, emps);

  if (isFirstLogin) {
    const roleAr = { manager: 'مدير', waiter: 'جرسون', cashier: 'محاسب', kitchen: 'مطبخ', bar: 'بار', shisha: 'شيشة' }[emp.role] || emp.role;
    addNotification(
      `👤 موظف جديد فعّل حسابه: ${emp.name} ${roleAr}`,
      `الموظف قام بتسجيل الدخول لأول مرة وتفعيل الحساب`,
      'success',
      ['manager']
    );
  }

  return session;
};

// ───────── Bills ─────────
export const getBills = () => clone(cache[BILLS_KEY]);
export const saveBills = async (b) => { if (!Array.isArray(b)) return false; return await persist(BILLS_KEY, b.slice(0, MAX_BILLS_KEPT)); };

export const deleteBills = async (ids) => {
  const current = getBills();
  const next = current.filter(b => !ids.includes(b.id));
  cache[BILLS_KEY] = clone(next);
  await writeRecord(BILLS_KEY, next);
  triggerSync(BILLS_KEY);
  if (supabase) {
    try {
      await supabase.from('bills').delete().in('id', ids);
    } catch (err) {
      console.error('Failed to delete bills from Supabase:', err);
    }
  }
};

export const deleteAllBills = async () => {
  cache[BILLS_KEY] = [];
  await writeRecord(BILLS_KEY, []);
  triggerSync(BILLS_KEY);
  if (supabase) {
    try {
      await supabase.from('bills').delete().neq('id', 'dummy');
    } catch (err) {
      console.error('Failed to delete all bills from Supabase:', err);
    }
  }
};

// ───────── Notifications ─────────

// Export bills as JSON string, optionally filtered by ids
export const exportBills = (ids) => {
  const all = getBills();
  const data = ids && Array.isArray(ids) ? all.filter(b => ids.includes(b.id)) : all;
  try {
    return JSON.stringify(data, null, 2);
  } catch (e) {
    console.error('Failed to export bills:', e);
    return '';
  }
};

// ───────── Bill Filtering & Export ─────────
// Filter bills by optional criteria: startDate, endDate, minTotal
export const filterBills = ({ startDate, endDate, minTotal } = {}) => {
  const all = getBills();
  return all.filter(b => {
    const dateOk = (!startDate || new Date(b.timestamp) >= new Date(startDate)) && (!endDate || new Date(b.timestamp) <= new Date(endDate));
    const totalOk = minTotal === undefined || b.total >= minTotal;
    return dateOk && totalOk;
  });
};

// Export filtered bills to CSV and trigger download in browser
export const exportBillsToCSV = (criteria = {}) => {
  const rows = filterBills(criteria);
  if (!rows.length) return;
  const header = ['ID','Table','Waiter','Timestamp','Subtotal','Tax','Service','Total'];
  const csv = [header.join(','), ...rows.map(b => [b.id,b.tableName,b.waiterCode,new Date(b.timestamp).toISOString(),b.subtotal,b.tax,b.serviceCharge,b.total].join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `bills_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
export const getNotifications = () => clone(cache[NOTIFICATIONS_KEY]);
export const saveNotifications = async (n) => { if (!Array.isArray(n)) return false; return await persist(NOTIFICATIONS_KEY, n.slice(0, MAX_NOTIFICATIONS)); };

export const addNotification = (title, message, type = 'info', targetRoles = []) => {
  if (!title || !message) return null;
  const notifs = getNotifications();
  const n = {
    id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: String(title).slice(0, 100),
    message: String(message).slice(0, 400),
    type: ['info', 'success', 'danger', 'warning'].includes(type) ? type : 'info',
    time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    timestamp: Date.now(),
    read: false,
    targetRoles: Array.isArray(targetRoles) ? targetRoles : []
  };
  saveNotifications([n, ...notifs]);
  return n;
};

export const markNotificationRead = (id) => {
  const notifs = getNotifications().map(n => n.id === id ? { ...n, read: true } : n);
  saveNotifications(notifs);
};

export const markAllNotificationsRead = () => {
  const notifs = getNotifications().map(n => ({ ...n, read: true }));
  saveNotifications(notifs);
};

export const deleteNotification = async (id) => {
  const notifs = getNotifications().filter(n => n.id !== id);
  cache[NOTIFICATIONS_KEY] = clone(notifs);
  await writeRecord(NOTIFICATIONS_KEY, notifs);
  triggerSync(NOTIFICATIONS_KEY);
  if (supabase) {
    try {
      await supabase.from('notifications').delete().eq('id', id);
    } catch (err) {
      console.error('Failed to delete notification from Supabase:', err);
    }
  }
};

// ───────── Menu ─────────
export const getMenu = () => clone(cache[MENU_KEY]);
export const saveMenu = async (m) => { if (!Array.isArray(m)) return false; return await persist(MENU_KEY, m); };

// ───────── Dept Orders ─────────
export const getDeptOrders = () => clone(cache[DEPT_ORDERS_KEY]);
export const saveDeptOrders = async (d) => { if (!d || typeof d !== 'object') return false; return await persist(DEPT_ORDERS_KEY, d); };

export const deleteDeptOrder = async (id) => {
  const orders = getDeptOrders();
  if (orders[id]) {
    delete orders[id];
    cache[DEPT_ORDERS_KEY] = clone(orders);
    await writeRecord(DEPT_ORDERS_KEY, orders);
    triggerSync(DEPT_ORDERS_KEY);
    if (supabase) {
      try {
        await supabase.from('dept_orders').delete().eq('id', id);
      } catch (err) {
        console.error('Failed to delete dept order from Supabase:', err);
      }
    }
  }
};

export const deleteDeptOrdersForTable = async (tableId) => {
  const orders = getDeptOrders();
  const toDeleteIds = Object.keys(orders).filter(id => orders[id].tableId === tableId);
  if (toDeleteIds.length > 0) {
    const filtered = Object.fromEntries(Object.entries(orders).filter(([, o]) => o.tableId !== tableId));
    cache[DEPT_ORDERS_KEY] = clone(filtered);
    await writeRecord(DEPT_ORDERS_KEY, filtered);
    triggerSync(DEPT_ORDERS_KEY);
    if (supabase) {
      try {
        await supabase.from('dept_orders').delete().in('id', toDeleteIds);
      } catch (err) {
        console.error('Failed to delete table dept orders from Supabase:', err);
      }
    }
  }
};

export const updateDeptOrderItem = async (orderId, itemId, updates) => {
  const orders = getDeptOrders();
  if (!orders[orderId]) return false;

  const finalUpdates = { ...updates };
  if (updates.status === 'ready' && !updates.readyAt) {
    finalUpdates.readyAt = Date.now();
  }

  orders[orderId].items = (orders[orderId].items || []).map(item =>
    item.id === itemId ? { ...item, ...finalUpdates } : item
  );
  await persist(DEPT_ORDERS_KEY, orders, orderId);

  // Sync item status back to the corresponding table
  const tableId = orders[orderId].tableId;
  if (tableId) {
    const tables = getTables();
    const tableIndex = tables.findIndex(t => t.id === tableId);
    if (tableIndex !== -1) {
      const table = tables[tableIndex];
      let updated = false;
      table.currentOrder = (table.currentOrder || []).map(item => {
        if (item.id === itemId && item.status !== 'delivered') {
          updated = true;
          return { ...item, ...finalUpdates };
        }
        return item;
      });
      // Fallback matching if not already updated
      if (!updated) {
        table.currentOrder = (table.currentOrder || []).map(item => {
          if (item.id === itemId) return { ...item, ...finalUpdates };
          return item;
        });
      }
      await persist(TABLES_KEY, tables, tableId);
    }
  }

  return true;
};

// ───────── Waiter Ongoing Items Operations ─────────
export const updateOngoingItemQty = async (tableId, orderId, itemId, newQty) => {
  if (newQty <= 0) {
    return await cancelOngoingItem(tableId, orderId, itemId);
  }

  // 1. Update the table's currentOrder
  const tables = getTables();
  const tableIdx = tables.findIndex(t => t.id === tableId);
  if (tableIdx === -1) return false;
  
  const table = tables[tableIdx];
  let updatedTable = false;
  table.currentOrder = (table.currentOrder || []).map(item => {
    const matchOrder = !orderId || item.orderId === orderId;
    if (matchOrder && item.id === itemId && ['new', 'preparing'].includes(item.status)) {
      updatedTable = true;
      return { ...item, qty: newQty };
    }
    return item;
  });
  
  if (updatedTable) {
    const sub = table.currentOrder.reduce((s, i) => s + i.price * i.qty, 0);
    table.subtotal = sub;
    table.tax = sub * TAX_RATE;
    table.serviceCharge = sub * SERVICE_RATE;
    table.total = sub + table.tax + table.serviceCharge;
    
    await persist(TABLES_KEY, tables, tableId);
  }

  // 2. Update the corresponding dept order
  if (orderId) {
    const orders = getDeptOrders();
    const order = orders[orderId];
    if (order) {
      order.items = (order.items || []).map(item => {
        if (item.id === itemId && ['new', 'preparing'].includes(item.status)) {
          return { ...item, qty: newQty };
        }
        return item;
      });
      const sub = order.items.reduce((s, i) => s + i.price * i.qty, 0);
      order.subtotal = sub;
      order.tax = sub * TAX_RATE;
      order.serviceCharge = sub * SERVICE_RATE;
      order.total = sub + order.tax + order.serviceCharge;
      
      await persist(DEPT_ORDERS_KEY, orders, orderId);
    }
  }
  return true;
};

export const cancelOngoingItem = async (tableId, orderId, itemId) => {
  // 1. Update table's currentOrder by removing the item
  const tables = getTables();
  const tableIdx = tables.findIndex(t => t.id === tableId);
  if (tableIdx === -1) return false;
  
  const table = tables[tableIdx];
  let updatedTable = false;
  
  table.currentOrder = (table.currentOrder || []).filter(item => {
    const matchOrder = !orderId || item.orderId === orderId;
    const isMatch = matchOrder && item.id === itemId && ['new', 'preparing'].includes(item.status);
    if (isMatch) {
      updatedTable = true;
      return false;
    }
    return true;
  });
  
  if (updatedTable) {
    if (table.currentOrder.length === 0) {
      table.status = 'empty';
      table.notes = '';
      table.subtotal = 0;
      table.tax = 0;
      table.serviceCharge = 0;
      table.total = 0;
      table.waiterCode = null;
      table.seatedAt = null;
      table.guests = 0;
    } else {
      const sub = table.currentOrder.reduce((s, i) => s + i.price * i.qty, 0);
      table.subtotal = sub;
      table.tax = sub * TAX_RATE;
      table.serviceCharge = sub * SERVICE_RATE;
      table.total = sub + table.tax + table.serviceCharge;
    }
    await persist(TABLES_KEY, tables, tableId);
  }

  // 2. Update/remove item from corresponding dept order
  if (orderId) {
    const orders = getDeptOrders();
    const order = orders[orderId];
    if (order) {
      order.items = (order.items || []).filter(item => {
        return !(item.id === itemId && ['new', 'preparing'].includes(item.status));
      });
      
      if (order.items.length === 0) {
        await deleteDeptOrder(orderId);
      } else {
        const sub = order.items.reduce((s, i) => s + i.price * i.qty, 0);
        order.subtotal = sub;
        order.tax = sub * TAX_RATE;
        order.serviceCharge = sub * SERVICE_RATE;
        order.total = sub + order.tax + order.serviceCharge;
        await persist(DEPT_ORDERS_KEY, orders, orderId);
      }
    }
  }
  return true;
};

// ───────── Departments ─────────
export const getDepartments = () => clone(cache[DEPARTMENTS_KEY]);
export const saveDepartments = async (d) => { if (!Array.isArray(d)) return false; return await persist(DEPARTMENTS_KEY, d); };

// ───────── Manager Credentials ─────────
export const handleManagerLogin = () => {
  // After successful manager login, fetch manager auth and go to dashboard
  const auth = getAuth();
  if (auth?.kind === 'manager') {
    const session = { id: auth.codeId, role: 'manager', name: auth.label, code: auth.codeId?.slice(0,6) || 'ADM', username: auth.label };
    setUser(session);
  }
  setAuthPage('system');
};
export const getManagerCredentials = () => getEmployees().find(e => e.role === 'manager') || null;
export const saveManagerCredentials = async (creds) => {
  const emps = getEmployees();
  const manager = {
    id: creds.id || 'admin-1',
    name: creds.name || 'مدير تكة',
    role: 'manager',
    username: creds.username || creds.email || 'admin',
    password: creds.password || 'admin123',
    code: 'ADMIN',
    phone: creds.phone || '',
    email: creds.email || '',
    restaurantName: creds.restaurantName || 'تكة',
    salary: 0, active: true, lastLogin: null
  };
  const next = [manager, ...emps.filter(e => e.role !== 'manager')];
  return await saveEmployees(next);
};

// ───────── Sync (for refreshing from DB) ─────────
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

// ───────── Daily Reset ─────────
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
