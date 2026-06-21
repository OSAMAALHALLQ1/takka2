import { cache, persist } from './core.js';
import { clone } from './helpers.js';
import { MENU_KEY } from './constants.js';

export const getMenu = () => clone(cache[MENU_KEY]);

export const saveMenu = async (m) => { 
  if (!Array.isArray(m)) return false; 
  return await persist(MENU_KEY, m); 
};
