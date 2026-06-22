import { supabase } from '../supabaseClient.js';
import { cache, persist, writeRecord, triggerSync, enqueueMutation } from './core.js';
import { clone } from './helpers.js';
import { BILLS_KEY, MAX_BILLS_KEPT } from './constants.js';

export const getBills = () => clone(cache[BILLS_KEY]);

export const saveBills = async (b) => { 
  if (!Array.isArray(b)) return false; 
  return await persist(BILLS_KEY, b.slice(0, MAX_BILLS_KEPT)); 
};

export const deleteBills = async (ids) => {
  const current = getBills();
  const next = current.filter(b => !ids.includes(b.id));
  cache[BILLS_KEY] = clone(next);
  await writeRecord(BILLS_KEY, next);
  triggerSync(BILLS_KEY);
  if (supabase) {
    await enqueueMutation(BILLS_KEY, 'delete_in', ids);
  }
};

export const deleteAllBills = async () => {
  cache[BILLS_KEY] = [];
  await writeRecord(BILLS_KEY, []);
  triggerSync(BILLS_KEY);
  if (supabase) {
    await enqueueMutation(BILLS_KEY, 'delete_all');
  }
};

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

export const filterBills = ({ startDate, endDate, minTotal } = {}) => {
  const all = getBills();
  return all.filter(b => {
    const dateOk = (!startDate || new Date(b.timestamp) >= new Date(startDate)) && (!endDate || new Date(b.timestamp) <= new Date(endDate));
    const totalOk = minTotal === undefined || b.total >= minTotal;
    return dateOk && totalOk;
  });
};

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
