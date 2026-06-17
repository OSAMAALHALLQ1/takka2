import { cache, persist } from './core.js';
import { clone } from './helpers.js';
import { TABLES_KEY } from './constants.js';

export const getTables = () => clone(cache[TABLES_KEY]);
export const saveTables = (t) => { 
  if (!Array.isArray(t)) return false; 
  return persist(TABLES_KEY, t); 
};
