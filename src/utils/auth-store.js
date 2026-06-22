const KEY_AUTH = 'takka_auth';
const KEY_PW = 'takka_manager_pw_v1';
const KEY_MGR_ACC = 'takka_manager_account';

export const DEFAULT_MANAGER_PASSWORD = 'osamaalhallqst9';
const HASH_SALT = 'takka:salt:v1';

// Lazy imports to avoid any circular dependency at load time
import { getEmployees, saveEmployees } from './storage';

async function hashPassword(plain) {
  if (!window.crypto?.subtle) {
    return `plain:${plain}`;
  }
  const data = new TextEncoder().encode(`${HASH_SALT}:${plain}`);
  const buf = await window.crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function readPwHash() {
  return localStorage.getItem(KEY_PW) ?? '';
}

function writePwHash(h) {
  localStorage.setItem(KEY_PW, h);
}

export async function ensureDefaultPassword() {
  if (!localStorage.getItem(KEY_PW)) {
    writePwHash(await hashPassword(DEFAULT_MANAGER_PASSWORD));
  }
}

export function registerManager(account) {
  // account: { restaurantName, name, email, phone, password }
  const record = {
    ...account,
    active: false,
    id: 'admin-1',
    role: 'manager',
    username: account.email,
    code: 'ADMIN'
  };
  localStorage.setItem(KEY_MGR_ACC, JSON.stringify(record));
}

export function getManagerAccount() {
  try {
    const raw = localStorage.getItem(KEY_MGR_ACC);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function activateManagerAccount() {
  const acc = getManagerAccount();
  if (acc) {
    acc.active = true;
    localStorage.setItem(KEY_MGR_ACC, JSON.stringify(acc));
    
    // Hash password
    const hash = await hashPassword(acc.password);
    writePwHash(hash);
    
    // Update manager in the database
    const emps = getEmployees();
    const manager = {
      id: 'admin-1',
      name: acc.name,
      role: 'manager',
      username: acc.email,
      password: acc.password,
      code: 'ADMIN',
      phone: acc.phone,
      email: acc.email,
      restaurantName: acc.restaurantName,
      active: true,
      lastLogin: null
    };
    const next = [manager, ...emps.filter(e => e.role !== 'manager')];
    saveEmployees(next);
    return true;
  }
  return false;
}

export async function verifyManagerPassword(plain, emailInput = '') {
  const acc = getManagerAccount();
  if (acc) {
    if (emailInput && acc.email.trim().toLowerCase() !== emailInput.trim().toLowerCase()) {
      return false;
    }
    if (!acc.active) return false;
    return acc.password === plain;
  }

  const stored = readPwHash();
  if (!stored) {
    if (plain === DEFAULT_MANAGER_PASSWORD) {
      await ensureDefaultPassword();
      return true;
    }
    return false;
  }
  const candidate = await hashPassword(plain);
  if (candidate === stored) return true;
  if (stored.startsWith('plain:') && stored.slice(6) === plain) return true;
  return false;
}

export async function changeManagerPassword(oldPlain, newPlain) {
  const ok = await verifyManagerPassword(oldPlain);
  if (!ok) return false;
  if (!newPlain || newPlain.length < 4) return false;
  
  writePwHash(await hashPassword(newPlain));
  
  const acc = getManagerAccount();
  if (acc) {
    acc.password = newPlain;
    localStorage.setItem(KEY_MGR_ACC, JSON.stringify(acc));
  }
  return true;
}

function readAuth() {
  try {
    const raw = localStorage.getItem(KEY_AUTH);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeAuth(s) {
  if (s) localStorage.setItem(KEY_AUTH, JSON.stringify(s));
  else localStorage.removeItem(KEY_AUTH);
  window.dispatchEvent(new CustomEvent('takka:auth-update'));
}

export function getAuth() {
  return readAuth();
}

export function loginManager() {
  const acc = getManagerAccount();
  writeAuth({
    kind: 'manager',
    codeId: 'admin-1',
    label: acc?.name || 'خالد',
    name: acc?.name || 'خالد',
    restaurantName: acc?.restaurantName || 'تكة',
    loggedInAt: Date.now()
  });
}

export function loginEmployeeSession(session) {
  writeAuth({
    kind: 'employee',
    codeId: session.id,
    label: session.name,
    allowedRoles: [session.role],
    departments: session.departments || null,
    loggedInAt: Date.now(),
  });
}
export function logout() {
  writeAuth(null);
}

