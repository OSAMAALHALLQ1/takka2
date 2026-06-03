const TABLES_KEY = 'takah_tables';
const EMPLOYEES_KEY = 'takah_employees';
const BILLS_KEY = 'takah_bills';
const NOTIFICATIONS_KEY = 'takah_notifications';
const MANAGER_KEY = 'takah_manager';
const MANAGER_LOGIN_STATE_KEY = 'takah_manager_login_state';
const MENU_KEY = 'takah_menu';
const DEPT_ORDERS_KEY = 'takah_dept_orders';

// Initial default data
const DEFAULT_TABLES = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  name: `طاولة ${i + 1}`,
  status: 'empty', // 'empty' | 'ordering' | 'eating' | 'bill_requested'
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
  window.dispatchEvent(new CustomEvent('takah_sync', { detail: { key } }));
};

export const getTables = () => {
  const data = localStorage.getItem(TABLES_KEY);
  if (!data) {
    localStorage.setItem(TABLES_KEY, JSON.stringify(DEFAULT_TABLES));
    return DEFAULT_TABLES;
  }
  return JSON.parse(data);
};

export const saveTables = (tables) => {
  localStorage.setItem(TABLES_KEY, JSON.stringify(tables));
  triggerSync(TABLES_KEY);
};

export const getEmployees = () => {
  const data = localStorage.getItem(EMPLOYEES_KEY);
  if (!data) {
    localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(DEFAULT_EMPLOYEES));
    return DEFAULT_EMPLOYEES;
  }
  return JSON.parse(data);
};

export const saveEmployees = (employees) => {
  localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(employees));
  triggerSync(EMPLOYEES_KEY);
};

export const getBills = () => {
  const data = localStorage.getItem(BILLS_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveBills = (bills) => {
  localStorage.setItem(BILLS_KEY, JSON.stringify(bills));
  triggerSync(BILLS_KEY);
};

export const getNotifications = () => {
  const data = localStorage.getItem(NOTIFICATIONS_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveNotifications = (notifications) => {
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
  triggerSync(NOTIFICATIONS_KEY);
};

// Add a notification with auto-triggering sync
export const addNotification = (title, message, type = 'info') => {
  const notifications = getNotifications();
  const newNotif = {
    id: Date.now() + Math.random().toString(36).substr(2, 5),
    title,
    message,
    type,
    time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    timestamp: Date.now(),
    read: false
  };
  notifications.unshift(newNotif);
  // Keep only last 20 notifications
  saveNotifications(notifications.slice(0, 20));
  return newNotif;
};

// Clear all data (for reset daily)
export const resetDailyData = () => {
  localStorage.setItem(TABLES_KEY, JSON.stringify(DEFAULT_TABLES));
  localStorage.setItem(BILLS_KEY, JSON.stringify([]));
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify([]));
  triggerSync('reset');
};

export const getManagerCredentials = () => {
  const data = localStorage.getItem(MANAGER_KEY);
  return data ? JSON.parse(data) : null;
};

export const saveManagerCredentials = (credentials) => {
  localStorage.setItem(MANAGER_KEY, JSON.stringify(credentials));
  triggerSync(MANAGER_KEY);
};

// Manager login state (true if logged in)
export const getManagerLoginState = () => {
  const data = localStorage.getItem(MANAGER_LOGIN_STATE_KEY);
  return data === 'true';
};

export const saveManagerLoginState = (state) => {
  localStorage.setItem(MANAGER_LOGIN_STATE_KEY, state ? 'true' : 'false');
  triggerSync(MANAGER_LOGIN_STATE_KEY);
};

// Menu handling (dynamic menu with department field)
export const getMenu = () => {
  const data = localStorage.getItem(MENU_KEY);
  if (!data) {
    // fallback to default static menu if needed
    return [];
  }
  return JSON.parse(data);
};

export const saveMenu = (menu) => {
  localStorage.setItem(MENU_KEY, JSON.stringify(menu));
  triggerSync(MENU_KEY);
};

// Department orders handling
export const getDeptOrders = () => {
  const data = localStorage.getItem(DEPT_ORDERS_KEY);
  return data ? JSON.parse(data) : {};
};

export const saveDeptOrders = (orders) => {
  localStorage.setItem(DEPT_ORDERS_KEY, JSON.stringify(orders));
  triggerSync(DEPT_ORDERS_KEY);
};

export const updateDeptOrderItem = (orderId, itemId, updates) => {
  const orders = getDeptOrders();
  if (!orders[orderId]) return;
  const order = orders[orderId];
  const itemIdx = order.items.findIndex(i => i.itemId === itemId);
  if (itemIdx === -1) return;
  order.items[itemIdx] = { ...order.items[itemIdx], ...updates };
  saveDeptOrders(orders);
};
