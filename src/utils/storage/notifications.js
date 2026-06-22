import { supabase } from '../supabaseClient.js';
import { cache, persist, writeRecord, triggerSync } from './core.js';
import { clone } from './helpers.js';
import { NOTIFICATIONS_KEY, MAX_NOTIFICATIONS } from './constants.js';

const DEPARTMENT_TARGETS = new Set(['kitchen', 'bar', 'shisha']);
const ROLE_TARGETS = new Set(['admin', 'manager', 'waiter', 'cashier']);
const ALLOWED_KINDS = new Set(['new_order', 'order_ready', 'bill_requested']);
const BLOCKED_TITLES = [
  'إضافة صنف',
  'تعديل صنف',
  'حذف صنف',
  'طاولات',
  'موظف',
  'موظف جديد',
  'حذف موظف',
  'كود دعوة',
  'تم إضافة القسم',
  'تم تعديل القسم',
  'حذف قسم'
];

const inferNotificationKind = (title, targetRoles) => {
  const text = String(title || '');
  const targets = Array.isArray(targetRoles) ? targetRoles : [];
  const hasDepartment = targets.some(target => DEPARTMENT_TARGETS.has(target));
  const hasCashier = targets.includes('cashier');

  if (text.includes('طلب جديد')) return 'new_order';
  if (text.includes('جاهز')) return 'order_ready';
  if (text.includes('طلب حساب') || text.includes('فاتورة') || hasCashier) return 'bill_requested';
  if (hasDepartment) return 'new_order';
  return null;
};

const shouldStoreNotification = (title, targetRoles) => {
  if (BLOCKED_TITLES.some(blocked => String(title || '').includes(blocked))) {
    return false;
  }
  const kind = inferNotificationKind(title, targetRoles);
  return kind ? ALLOWED_KINDS.has(kind) : false;
};

export const getNotifications = () => clone(cache[NOTIFICATIONS_KEY]);
export const saveNotifications = async (n) => {
  if (!Array.isArray(n)) return false;
  return await persist(NOTIFICATIONS_KEY, n.slice(0, MAX_NOTIFICATIONS));
};

export const addNotification = (title, message, type = 'info', targetRoles = []) => {
  if (!title || !message) return null;
  if (!shouldStoreNotification(title, targetRoles)) return null;

  // Extract targetRole and targetDepartment from targetRoles array
  let targetDepartment = null;
  const roles = [];
  const arr = Array.isArray(targetRoles) ? targetRoles : [];

  arr.forEach(r => {
    if (DEPARTMENT_TARGETS.has(r)) {
      targetDepartment = r;
    } else if (ROLE_TARGETS.has(r)) {
      roles.push(r === 'manager' ? 'admin' : r);
    } else if (r.startsWith('W-') || r.startsWith('C-') || r.startsWith('EMP')) {
      if (r.startsWith('W-')) roles.push('waiter');
      if (r.startsWith('C-')) roles.push('cashier');
    }
  });

  const targetRoleStr = roles.length > 0 ? roles.join(',') : null;

  const notifs = getNotifications();
  const n = {
    id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: String(title).slice(0, 100),
    message: String(message).slice(0, 400),
    type: ['info', 'success', 'danger', 'warning'].includes(type) ? type : 'info',
    time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    timestamp: Date.now(),
    read: false,
    targetRoles: arr,
    targetRole: targetRoleStr,
    targetDepartment: targetDepartment
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
