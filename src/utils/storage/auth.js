import { cache, persist, writeRecord, triggerSync } from './core.js';
import { clone, normalizeEmployee } from './helpers.js';
import { EMPLOYEES_KEY, SESSION_KEY } from './constants.js';
import { addNotification } from './notifications.js';

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

export const getSession = () => clone(cache[SESSION_KEY]);
export const clearSession = async () => {
  cache[SESSION_KEY] = null;
  await writeRecord(SESSION_KEY, null);
  triggerSync(SESSION_KEY);
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
