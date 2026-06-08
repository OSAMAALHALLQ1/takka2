const TABLES_KEY = 'takah_tables';
const EMPLOYEES_KEY = 'takah_employees';
const BILLS_KEY = 'takah_bills';
const NOTIFICATIONS_KEY = 'takah_notifications';
const MANAGER_KEY = 'takah_manager';
const MANAGER_LOGIN_STATE_KEY = 'takah_manager_login_state';
const MENU_KEY = 'takah_menu';
const DEPT_ORDERS_KEY = 'takah_dept_orders';

// Configuration constants
export const TAX_RATE = 0.15;
export const MAX_NOTIFICATIONS = 20;
export const MAX_BILLS_KEPT = 1000;
export const RESTAURANT_NAME = 'تكة - Takah Restaurant';

// Error logger utility
const logStorageError = (operation, error) => {
  console.error(`[Storage Error] ${operation}:`, error.message);
};

// Safe localStorage wrapper with error handling
const safeGetItem = (key) => {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    logStorageError(`getItem(${key})`, error);
    return null;
  }
};

const safeSetItem = (key, value) => {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    logStorageError(`setItem(${key})`, error);
    return false;
  }
};

const safeParse = (jsonString, defaultValue = null) => {
  try {
    return jsonString ? JSON.parse(jsonString) : defaultValue;
  } catch (error) {
    logStorageError('JSON.parse()', error);
    return defaultValue;
  }
};

// Input validation
const validateString = (str, maxLen = 1000) => {
  if (typeof str !== 'string') return '';
  return str.substring(0, maxLen).trim();
};

const validateArray = (arr) => {
  return Array.isArray(arr) ? arr : [];
};

// Initial default data
const DEFAULT_TABLES = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  name: `طاولة ${i + 1}`,
  status: 'empty',
  currentOrder: [],
  notes: '',
  subtotal: 0,
  tax: 0,
  total: 0,
  waiterCode: null
}));

const DEFAULT_EMPLOYEES = [
  { id: '1', name: 'أحمد سعيد (نادل)', role: 'waiter', code: 'W-1234', phone: '0791234567' },
  { id: '2', name: 'رائد خالد (محاسب)', role: 'cashier', code: 'C-5678', phone: '0781234567' },
  { id: '3', name: 'محمود علي (مطبخ)', role: 'kitchen', code: 'K-1111', phone: '0771111111' },
  { id: '4', name: 'سارة بن علي (بار)', role: 'bar', code: 'B-2222', phone: '0772222222' },
  { id: '5', name: 'يوسف إبراهيم (شيشة)', role: 'shisha', code: 'S-3333', phone: '0773333333' }
];

// Helper to trigger custom storage sync event
const triggerSync = (key) => {
  try {
    window.dispatchEvent(new CustomEvent('takah_sync', { detail: { key } }));
  } catch (error) {
    logStorageError('triggerSync', error);
  }
};

// === TABLES ===
export const getTables = () => {
  const data = safeGetItem(TABLES_KEY);
  const tables = safeParse(data, DEFAULT_TABLES);
  if (!validateArray(tables).length) {
    safeSetItem(TABLES_KEY, JSON.stringify(DEFAULT_TABLES));
    return DEFAULT_TABLES;
  }
  return tables;
};

export const saveTables = (tables) => {
  if (!validateArray(tables).length) {
    console.warn('[Storage] saveTables: Invalid input - expected non-empty array');
    return false;
  }
  const success = safeSetItem(TABLES_KEY, JSON.stringify(tables));
  if (success) triggerSync(TABLES_KEY);
  return success;
};

// === EMPLOYEES ===
export const getEmployees = () => {
  const data = safeGetItem(EMPLOYEES_KEY);
  const employees = safeParse(data, DEFAULT_EMPLOYEES);
  if (!validateArray(employees).length) {
    safeSetItem(EMPLOYEES_KEY, JSON.stringify(DEFAULT_EMPLOYEES));
    return DEFAULT_EMPLOYEES;
  }
  return employees;
};

export const saveEmployees = (employees) => {
  if (!validateArray(employees).length) {
    console.warn('[Storage] saveEmployees: Invalid input - expected non-empty array');
    return false;
  }
  const success = safeSetItem(EMPLOYEES_KEY, JSON.stringify(employees));
  if (success) triggerSync(EMPLOYEES_KEY);
  return success;
};

// === BILLS ===
export const getBills = () => {
  const data = safeGetItem(BILLS_KEY);
  const bills = safeParse(data, []);
  return validateArray(bills);
};

export const saveBills = (bills) => {
  if (!validateArray(bills)) {
    console.warn('[Storage] saveBills: Invalid input - expected array');
    return false;
  }
  // Keep only most recent bills to prevent storage quota issues
  const trimmed = bills.slice(0, MAX_BILLS_KEPT);
  const success = safeSetItem(BILLS_KEY, JSON.stringify(trimmed));
  if (success) triggerSync(BILLS_KEY);
  return success;
};

// === NOTIFICATIONS ===
export const getNotifications = () => {
  const data = safeGetItem(NOTIFICATIONS_KEY);
  const notifs = safeParse(data, []);
  return validateArray(notifs);
};

export const saveNotifications = (notifications) => {
  if (!validateArray(notifications)) {
    console.warn('[Storage] saveNotifications: Invalid input - expected array');
    return false;
  }
  const trimmed = notifications.slice(0, MAX_NOTIFICATIONS);
  const success = safeSetItem(NOTIFICATIONS_KEY, JSON.stringify(trimmed));
  if (success) triggerSync(NOTIFICATIONS_KEY);
  return success;
};

export const addNotification = (title, message, type = 'info') => {
  if (!title || !message) {
    console.warn('[Storage] addNotification: Title and message are required');
    return null;
  }
  const notifications = getNotifications();
  const newNotif = {
    id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title: validateString(String(title), 100),
    message: validateString(String(message), 500),
    type: ['info', 'success', 'danger', 'warning'].includes(type) ? type : 'info',
    time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    timestamp: Date.now(),
    read: false
  };
  notifications.unshift(newNotif);
  const trimmed = notifications.slice(0, MAX_NOTIFICATIONS);
  saveNotifications(trimmed);
  return newNotif;
};

// === DATA RESET ===
export const resetDailyData = (confirmationCode) => {
  if (confirmationCode !== 'RESET_CONFIRMED') {
    console.warn('[Storage] resetDailyData: Invalid confirmation code');
    return false;
  }
  try {
    safeSetItem(TABLES_KEY, JSON.stringify(DEFAULT_TABLES));
    safeSetItem(BILLS_KEY, JSON.stringify([]));
    safeSetItem(NOTIFICATIONS_KEY, JSON.stringify([]));
    safeSetItem(DEPT_ORDERS_KEY, JSON.stringify({}));
    triggerSync('reset');
    return true;
  } catch (error) {
    logStorageError('resetDailyData', error);
    return false;
  }
};

// === MANAGER CREDENTIALS (DEPRECATED - DO NOT USE) ===
export const getManagerCredentials = () => {
  const data = safeGetItem(MANAGER_KEY);
  return safeParse(data, null);
};

export const saveManagerCredentials = (credentials) => {
  console.warn('[Storage] saveManagerCredentials: Storing sensitive data in localStorage is deprecated. Use secure session management instead.');
  if (!credentials || typeof credentials !== 'object') {
    console.warn('[Storage] saveManagerCredentials: Invalid credentials object');
    return false;
  }
  const success = safeSetItem(MANAGER_KEY, JSON.stringify(credentials));
  if (success) triggerSync(MANAGER_KEY);
  return success;
};

// === MANAGER LOGIN STATE ===
export const getManagerLoginState = () => {
  const data = safeGetItem(MANAGER_LOGIN_STATE_KEY);
  return data === 'true';
};

export const saveManagerLoginState = (state) => {
  const success = safeSetItem(MANAGER_LOGIN_STATE_KEY, state ? 'true' : 'false');
  if (success) triggerSync(MANAGER_LOGIN_STATE_KEY);
  return success;
};

// === MENU ===
export const getMenu = () => {
  const data = safeGetItem(MENU_KEY);
  const menu = safeParse(data, []);
  return validateArray(menu);
};

export const saveMenu = (menu) => {
  if (!validateArray(menu)) {
    console.warn('[Storage] saveMenu: Invalid input - expected array');
    return false;
  }
  const success = safeSetItem(MENU_KEY, JSON.stringify(menu));
  if (success) triggerSync(MENU_KEY);
  return success;
};

// === DEPARTMENT ORDERS ===
export const getDeptOrders = () => {
  const data = safeGetItem(DEPT_ORDERS_KEY);
  const orders = safeParse(data, {});
  return typeof orders === 'object' && orders !== null ? orders : {};
};

export const saveDeptOrders = (deptOrders) => {
  if (typeof deptOrders !== 'object' || deptOrders === null) {
    console.warn('[Storage] saveDeptOrders: Invalid input - expected object');
    return false;
  }
  const success = safeSetItem(DEPT_ORDERS_KEY, JSON.stringify(deptOrders));
  if (success) triggerSync(DEPT_ORDERS_KEY);
  return success;
};

export const updateDeptOrderItem = (orderId, itemId, updates) => {
  if (!orderId || !itemId || typeof updates !== 'object') {
    console.warn('[Storage] updateDeptOrderItem: Invalid parameters');
    return false;
  }
  const deptOrders = getDeptOrders();
  if (!deptOrders[orderId]) {
    console.warn('[Storage] updateDeptOrderItem: Order not found', orderId);
    return false;
  }
  deptOrders[orderId].items = deptOrders[orderId].items.map((item) =>
    item.id === itemId ? { ...item, ...updates } : item
  );
  return saveDeptOrders(deptOrders);
};
