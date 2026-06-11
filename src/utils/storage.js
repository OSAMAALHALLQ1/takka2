const DB_NAME = 'takah_restaurant_db';
const DB_VERSION = 1;
const STORE_NAME = 'records';

const TABLES_KEY = 'tables';
const EMPLOYEES_KEY = 'employees';
const BILLS_KEY = 'bills';
const NOTIFICATIONS_KEY = 'notifications';
const MENU_KEY = 'menu';
const DEPT_ORDERS_KEY = 'department_orders';
const SESSION_KEY = 'session';

export const TAX_RATE = 0.15;
export const MAX_NOTIFICATIONS = 20;
export const MAX_BILLS_KEPT = 1000;
export const RESTAURANT_NAME = 'تكة - Taka Restaurant';

const DEFAULT_TABLES = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  name: `طاولة ${i + 1}`,
  seats: i < 4 ? 4 : i < 8 ? 6 : 8,
  status: 'empty',
  currentOrder: [],
  notes: '',
  subtotal: 0,
  tax: 0,
  total: 0,
  waiterCode: null
}));

const DEFAULT_EMPLOYEES = [
  {
    id: 'admin-1',
    name: 'مدير تكة',
    role: 'manager',
    username: 'admin',
    password: 'admin123',
    code: 'ADMIN',
    phone: '0790000000',
    active: true
  },
  {
    id: 'waiter-1',
    name: 'جرسون الصالة',
    role: 'waiter',
    username: 'waiter1',
    password: '1234',
    code: 'W-1234',
    phone: '0791234567',
    active: true
  },
  {
    id: 'cashier-1',
    name: 'محاسب الكاشير',
    role: 'cashier',
    username: 'cashier1',
    password: '1234',
    code: 'C-5678',
    phone: '0781234567',
    active: true
  },
  {
    id: 'kitchen-1',
    name: 'قسم المطبخ',
    role: 'kitchen',
    username: 'kitchen1',
    password: '1234',
    code: 'K-1111',
    phone: '0771111111',
    active: true
  },
  {
    id: 'bar-1',
    name: 'قسم البار',
    role: 'bar',
    username: 'bar1',
    password: '1234',
    code: 'B-2222',
    phone: '0772222222',
    active: true
  },
  {
    id: 'shisha-1',
    name: 'قسم الشيشة',
    role: 'shisha',
    username: 'shisha1',
    password: '1234',
    code: 'S-3333',
    phone: '0773333333',
    active: true
  }
];

const DEFAULT_MENU = [
  { id: 'k1', category: 'mains', name: 'برغر كلاسيك', price: 8, description: 'برغر لحم مع جبنة وصوص تكة', image: '🍔', department: 'kitchen' },
  { id: 'k2', category: 'mains', name: 'شاورما دجاج', price: 7, description: 'شاورما دجاج بخبز صاج وثومية', image: '🌯', department: 'kitchen' },
  { id: 'k3', category: 'mains', name: 'بيتزا مارغريتا', price: 12, description: 'صلصة طماطم وموزاريلا وريحان', image: '🍕', department: 'kitchen' },
  { id: 'k4', category: 'appetizers', name: 'فريز دجاج', price: 6, description: 'دجاج مقرمش مع بطاطا', image: '🍗', department: 'kitchen' },
  { id: 'b1', category: 'drinks', name: 'كولا', price: 3, description: 'مشروب غازي بارد', image: '🥤', department: 'bar' },
  { id: 'b2', category: 'drinks', name: 'عصير برتقال', price: 4, description: 'عصير طبيعي طازج', image: '🍊', department: 'bar' },
  { id: 'b3', category: 'drinks', name: 'ليموناضة', price: 3.5, description: 'ليمون منعش بالنعنع', image: '🍋', department: 'bar' },
  { id: 'b4', category: 'drinks', name: 'ماء معدني', price: 2, description: 'زجاجة ماء باردة', image: '💧', department: 'bar' },
  { id: 's1', category: 'shisha', name: 'شيشة تفاحتين', price: 15, description: 'نكهة تفاحتين كلاسيكية', image: '💨', department: 'shisha' },
  { id: 's2', category: 'shisha', name: 'شيشة نعناع', price: 15, description: 'نكهة نعناع منعشة', image: '🌿', department: 'shisha' },
  { id: 's3', category: 'shisha', name: 'شيشة كريمة', price: 18, description: 'نكهة كريمة ناعمة', image: '🍦', department: 'shisha' },
  { id: 's4', category: 'shisha', name: 'شيشة فاكهة', price: 20, description: 'خلطة فواكه خاصة', image: '🍓', department: 'shisha' }
];

const cache = {
  [TABLES_KEY]: DEFAULT_TABLES,
  [EMPLOYEES_KEY]: DEFAULT_EMPLOYEES,
  [BILLS_KEY]: [],
  [NOTIFICATIONS_KEY]: [],
  [MENU_KEY]: DEFAULT_MENU,
  [DEPT_ORDERS_KEY]: {},
  [SESSION_KEY]: null
};

let dbPromise = null;
let initialized = false;

const clone = (value) => {
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
};

const logDatabaseError = (operation, error) => {
  console.error(`[Database Error] ${operation}:`, error);
};

const openDatabase = () => {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
};

const readRecord = async (key, fallback) => {
  const db = await openDatabase();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(key);

    request.onsuccess = () => resolve(request.result?.value ?? clone(fallback));
    request.onerror = () => {
      logDatabaseError(`read ${key}`, request.error);
      resolve(clone(fallback));
    };
  });
};

const writeRecord = async (key, value) => {
  const db = await openDatabase();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put({ key, value: clone(value), updatedAt: Date.now() });

    request.onsuccess = () => resolve(true);
    request.onerror = () => {
      logDatabaseError(`write ${key}`, request.error);
      resolve(false);
    };
  });
};

const triggerSync = (key) => {
  try {
    window.dispatchEvent(new CustomEvent('takah_sync', { detail: { key } }));
  } catch (error) {
    logDatabaseError('triggerSync', error);
  }
};

const normalizeEmployee = (employee) => ({
  active: true,
  username: employee.username || employee.code || '',
  password: employee.password || '1234',
  ...employee
});

const seedIfMissing = async (key, fallback) => {
  const value = await readRecord(key, fallback);
  const normalized =
    key === EMPLOYEES_KEY && Array.isArray(value)
      ? value.map(normalizeEmployee)
      : value;
  cache[key] = clone(normalized);
  await writeRecord(key, normalized);
};

export const initializeDatabase = async () => {
  if (initialized) return true;

  await seedIfMissing(TABLES_KEY, DEFAULT_TABLES);
  await seedIfMissing(EMPLOYEES_KEY, DEFAULT_EMPLOYEES);
  await seedIfMissing(BILLS_KEY, []);
  await seedIfMissing(NOTIFICATIONS_KEY, []);
  await seedIfMissing(MENU_KEY, DEFAULT_MENU);
  await seedIfMissing(DEPT_ORDERS_KEY, {});
  await seedIfMissing(SESSION_KEY, null);

  initialized = true;
  return true;
};

export const refreshDatabaseCache = async () => {
  await initializeDatabase();
  cache[TABLES_KEY] = await readRecord(TABLES_KEY, DEFAULT_TABLES);
  cache[EMPLOYEES_KEY] = (await readRecord(EMPLOYEES_KEY, DEFAULT_EMPLOYEES)).map(normalizeEmployee);
  cache[BILLS_KEY] = await readRecord(BILLS_KEY, []);
  cache[NOTIFICATIONS_KEY] = await readRecord(NOTIFICATIONS_KEY, []);
  cache[MENU_KEY] = await readRecord(MENU_KEY, DEFAULT_MENU);
  cache[DEPT_ORDERS_KEY] = await readRecord(DEPT_ORDERS_KEY, {});
  cache[SESSION_KEY] = await readRecord(SESSION_KEY, null);
  return clone(cache);
};

const persist = (key, value) => {
  cache[key] = clone(value);
  writeRecord(key, value).then((success) => {
    if (success) triggerSync(key);
  });
  return true;
};

export const getTables = () => clone(cache[TABLES_KEY]);

export const saveTables = (tables) => {
  if (!Array.isArray(tables)) return false;
  return persist(TABLES_KEY, tables);
};

export const getEmployees = () => clone(cache[EMPLOYEES_KEY]).map(normalizeEmployee);

export const saveEmployees = (employees) => {
  if (!Array.isArray(employees)) return false;
  return persist(EMPLOYEES_KEY, employees.map(normalizeEmployee));
};

export const authenticateUser = (username, password) => {
  const cleanUsername = String(username || '').trim().toLowerCase();
  const cleanPassword = String(password || '');

  const employee = getEmployees().find(
    (item) =>
      item.active !== false &&
      String(item.username || '').trim().toLowerCase() === cleanUsername &&
      String(item.password || '') === cleanPassword
  );

  if (!employee) return null;

  const session = {
    id: employee.id,
    role: employee.role,
    name: employee.name,
    code: employee.code,
    username: employee.username
  };

  persist(SESSION_KEY, session);
  return session;
};

export const getSession = () => clone(cache[SESSION_KEY]);

export const saveSession = (session) => persist(SESSION_KEY, session);

export const clearSession = () => persist(SESSION_KEY, null);

export const getBills = () => clone(cache[BILLS_KEY]);

export const saveBills = (bills) => {
  if (!Array.isArray(bills)) return false;
  return persist(BILLS_KEY, bills.slice(0, MAX_BILLS_KEPT));
};

export const getNotifications = () => clone(cache[NOTIFICATIONS_KEY]);

export const saveNotifications = (notifications) => {
  if (!Array.isArray(notifications)) return false;
  return persist(NOTIFICATIONS_KEY, notifications.slice(0, MAX_NOTIFICATIONS));
};

export const addNotification = (title, message, type = 'info') => {
  if (!title || !message) return null;
  const notifications = getNotifications();
  const newNotification = {
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    title: String(title).slice(0, 120),
    message: String(message).slice(0, 600),
    type: ['info', 'success', 'danger', 'warning'].includes(type) ? type : 'info',
    time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    timestamp: Date.now(),
    read: false
  };

  saveNotifications([newNotification, ...notifications].slice(0, MAX_NOTIFICATIONS));
  return newNotification;
};

export const resetDailyData = (confirmationCode = 'RESET_CONFIRMED') => {
  if (confirmationCode !== 'RESET_CONFIRMED') return false;
  persist(TABLES_KEY, DEFAULT_TABLES);
  persist(BILLS_KEY, []);
  persist(NOTIFICATIONS_KEY, []);
  persist(DEPT_ORDERS_KEY, {});
  triggerSync('reset');
  return true;
};

export const getMenu = () => clone(cache[MENU_KEY]);

export const saveMenu = (menu) => {
  if (!Array.isArray(menu)) return false;
  return persist(MENU_KEY, menu);
};

export const getDeptOrders = () => clone(cache[DEPT_ORDERS_KEY]);

export const saveDeptOrders = (deptOrders) => {
  if (!deptOrders || typeof deptOrders !== 'object') return false;
  return persist(DEPT_ORDERS_KEY, deptOrders);
};

export const updateDeptOrderItem = (orderId, itemId, updates) => {
  if (!orderId || !itemId || !updates || typeof updates !== 'object') return false;
  const deptOrders = getDeptOrders();
  if (!deptOrders[orderId]) return false;

  deptOrders[orderId].items = (deptOrders[orderId].items || []).map((item) =>
    item.id === itemId ? { ...item, ...updates } : item
  );

  return saveDeptOrders(deptOrders);
};

export const getManagerCredentials = () =>
  getEmployees().find((employee) => employee.role === 'manager') || null;

export const saveManagerCredentials = (credentials) => {
  const employees = getEmployees();
  const manager = {
    id: credentials.id || 'admin-1',
    name: credentials.name || 'مدير تكة',
    role: 'manager',
    username: credentials.username || credentials.email || 'admin',
    password: credentials.password || 'admin123',
    code: 'ADMIN',
    phone: credentials.phone || '',
    active: true
  };
  const next = [manager, ...employees.filter((employee) => employee.role !== 'manager')];
  return saveEmployees(next);
};

export const getManagerLoginState = () => Boolean(getSession()?.role === 'manager');

export const saveManagerLoginState = (state) =>
  state ? saveSession(getManagerCredentials()) : clearSession();
