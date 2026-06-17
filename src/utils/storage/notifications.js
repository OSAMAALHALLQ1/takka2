import { supabase } from '../supabaseClient.js';
import { cache, persist, writeRecord, triggerSync } from './core.js';
import { clone } from './helpers.js';
import { NOTIFICATIONS_KEY, MAX_NOTIFICATIONS } from './constants.js';

export const getNotifications = () => clone(cache[NOTIFICATIONS_KEY]);
export const saveNotifications = async (n) => { 
  if (!Array.isArray(n)) return false; 
  return await persist(NOTIFICATIONS_KEY, n.slice(0, MAX_NOTIFICATIONS)); 
};

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
