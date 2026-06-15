const KEY_AUTH = 'takka_auth';
const KEY_CODES = 'takka_codes';
const KEY_PW = 'takka_manager_pw_v1';
const KEY_MGR_ACC = 'takka_manager_account';

export const DEFAULT_MANAGER_PASSWORD = 'osamaalhallqst9';
const HASH_SALT = 'takka:salt:v1';
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

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
    name: acc?.name || 'مدير تكة',
    restaurantName: acc?.restaurantName || 'تكة',
    loggedInAt: Date.now()
  });
}

export function loginEmployee(code) {
  writeAuth({
    kind: 'employee',
    codeId: code.id,
    label: code.label,
    allowedRoles: code.allowedRoles,
    departments: code.departments,
    loggedInAt: Date.now(),
  });
  const codes = readCodes();
  const updated = codes.map((c) =>
    c.id === code.id ? { ...c, lastUsedAt: Date.now() } : c,
  );
  writeCodes(updated);
}

export function logout() {
  writeAuth(null);
}

function readCodes() {
  try {
    const raw = localStorage.getItem(KEY_CODES);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function writeCodes(c) {
  localStorage.setItem(KEY_CODES, JSON.stringify(c));
  window.dispatchEvent(new CustomEvent('takka:codes-update'));
}

export function getCodes() {
  return readCodes();
}

function generateCodeString() {
  const bytes = new Uint8Array(8);
  if (window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 8; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  let s = '';
  for (let i = 0; i < 8; i++) {
    s += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return `TAKKA-${s.slice(0, 4)}-${s.slice(4, 8)}`;
}

export function createCode({ label, allowedRoles, departments, expiresAt }) {
  const safeLabel = (label ?? '').trim() || 'Employee';
  const roles = (allowedRoles ?? []).filter((r) => r !== 'manager');
  const code = {
    id: crypto.randomUUID?.() ?? `c-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    code: generateCodeString(),
    label: safeLabel,
    allowedRoles: roles.length ? roles : ['waiter'],
    departments: departments ?? null,
    createdAt: Date.now(),
    expiresAt: expiresAt ?? null,
    revoked: false,
  };
  const codes = readCodes();
  writeCodes([...codes, code]);
  return code;
}

export function revokeCode(id) {
  const codes = readCodes();
  writeCodes(
    codes.map((c) => (c.id === id && !c.revoked ? { ...c, revoked: true } : c)),
  );
}

export function deleteCode(id) {
  const codes = readCodes();
  writeCodes(codes.filter((c) => c.id !== id));
}

export function findActiveCode(rawInput) {
  const target = (rawInput ?? '').trim().toUpperCase();
  if (!target) return null;
  const now = Date.now();
  const codes = readCodes();
  for (const c of codes) {
    if (c.revoked) continue;
    if (c.expiresAt && c.expiresAt <= now) continue;
    if (c.code === target) return c;
  }
  return null;
}

export function registerEmployeeWithCode(codeString, employeeData) {
  const code = findActiveCode(codeString);
  if (!code) return { success: false, error: 'كود الدعوة غير صالح أو منتهي الصلاحية' };

  const emps = getEmployees();
  const taken = emps.some(e => e.username.trim().toLowerCase() === employeeData.username.trim().toLowerCase());
  if (taken) return { success: false, error: 'اسم المستخدم محجوز بالفعل' };

  const newEmp = {
    id: code.id,
    name: employeeData.name,
    role: code.allowedRoles?.[0] || 'waiter',
    username: employeeData.username,
    password: employeeData.password,
    code: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
    phone: '',
    email: employeeData.email || '',
    active: true,
    lastLogin: null,
    departments: code.departments || null
  };

  const next = [...emps, newEmp];
  saveEmployees(next);
  if (code.expiresAt) {
    revokeCode(code.id);
  }

  return { success: true, employee: newEmp };
}

