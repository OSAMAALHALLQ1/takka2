import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, Clock, Trash2, Menu, LogOut } from 'lucide-react';
import {
  getTables, saveTables, getNotifications,
  getMenu, getDeptOrders,
  initializeDatabase, clearSession, getSession,
  markAllNotificationsRead, markNotificationRead, deleteNotification,
  deleteNotifications,
  DEFAULT_MENU, authenticateByCode, getEmployees, persist
} from './utils/storage';

import { getAuth, logout as authLogout, getManagerAccount, loginManager, loginEmployeeSession } from './utils/auth-store';
import ManagerLogin from './components/ManagerLogin';
import EmployeeLogin from './components/EmployeeLogin';
import { supabase } from './utils/supabaseClient';

import WaiterView from './components/WaiterView';
import CashierView from './components/CashierView';
import AdminDashboard from './components/AdminDashboard';
import NotificationsToast from './components/NotificationsToast';
import BrandLogo from './components/BrandLogo';
import BottomNavigation from './components/Layout/BottomNavigation';
import CashierBottomNavigation from './components/Layout/CashierBottomNavigation';
import MoreSheet from './components/MoreSheet';
import MobileHeader from './components/Layout/MobileHeader';
import SideDrawer from './components/Layout/SideDrawer';
import { OrderProvider } from './context/OrderContext';
import { NotificationProvider } from './context/NotificationContext';
import KitchenDashboard from './components/Dashboard/KitchenDashboard';
import BarDashboard from './components/Dashboard/BarDashboard';
import ShishaDashboard from './components/Dashboard/ShishaDashboard';
import InstallPrompt from './components/Layout/InstallPrompt';

// ──────────────────────────────────────────────────────
// Dept Screen (Kitchen / Bar / Shisha)
// ──────────────────────────────────────────────────────
function DeptScreen({ user }) {
  return (
    <div style={{ padding: '20px' }}>
      {user.role === 'kitchen' && <KitchenDashboard />}
      {user.role === 'bar' && <BarDashboard />}
      {user.role === 'shisha' && <ShishaDashboard />}
    </div>
  );
}

// ──────────────────────────────────────────────────────
// Notification Bell
// ──────────────────────────────────────────────────────
function NotificationBell({ notifications, onRefresh }) {
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const bellRef = useRef(null);
  const unread = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleClick = (e) => {
      if (!isMobile && bellRef.current && !bellRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isMobile]);

  const handleMarkAll = () => {
    markAllNotificationsRead();
    onRefresh();
  };
  const handleClearAll = async () => {
    if (notifications.length === 0) return;
    if (window.confirm('هل تريد مسح جميع هذه الإشعارات؟')) {
      await deleteNotifications(notifications.map(n => n.id));
      onRefresh();
    }
  };
  const handleDelete = (id) => {
    deleteNotification(id);
    onRefresh();
  };
  const handleMarkRead = (id) => {
    markNotificationRead(id);
    onRefresh();
  };

  const TYPE_COLORS = { success: '#27ae60', danger: '#e74c3c', warning: '#f39c12', info: '#3498db' };

  const bellButton = (
    <button
      onClick={() => setOpen(o => !o)}
      style={{
        position: 'relative',
        background: 'rgba(0,0,0,0.04)',
        border: '1px solid var(--border-light)',
        borderRadius: '10px',
        padding: '8px 12px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        color: 'var(--text-main)',
        fontSize: '1rem',
        height: '40px',
        justifyContent: 'center'
      }}
      aria-label="الإشعارات"
    >
      <Bell size={18} />
      {unread > 0 && (
        <span style={{
          position: 'absolute',
          top: '-4px',
          right: '-4px',
          background: '#dc2626',
          color: '#fff',
          borderRadius: '50%',
          width: '18px',
          height: '18px',
          fontSize: '0.68rem',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Outfit, sans-serif'
        }}>
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </button>
  );

  if (isMobile) {
    return (
      <div ref={bellRef} style={{ display: 'inline-block' }}>
        {bellButton}

        {open && (
          <div className="bottom-sheet-overlay animate-fade-in" onClick={() => setOpen(false)}>
            <div 
              className="bottom-sheet-drawer animate-slide-up" 
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bottom-sheet-handle" />
              <div className="bottom-sheet-header">
                <div className="bottom-sheet-title">
                  <Bell size={18} style={{ color: 'var(--color-primary)' }} />
                  <span>الإشعارات ({notifications.length})</span>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  {unread > 0 && (
                    <button 
                      onClick={handleMarkAll} 
                      style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}
                    >
                      تحديد الكل كمقروء
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button 
                      onClick={handleClearAll} 
                      style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}
                    >
                      مسح الكل
                    </button>
                  )}
                  <button className="bottom-sheet-close" onClick={() => setOpen(false)}>×</button>
                </div>
              </div>
              <div className="bottom-sheet-content">
                {notifications.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                    لا توجد إشعارات حالياً
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {notifications.map(n => (
                      <div 
                        key={n.id} 
                        style={{
                          padding: '16px',
                          border: '1px solid var(--border-light)',
                          borderRadius: '12px',
                          background: n.read ? 'var(--bg-surface)' : 'rgba(220, 38, 38, 0.02)',
                          borderColor: n.read ? 'var(--border-light)' : 'rgba(220, 38, 38, 0.15)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '12px'
                        }}
                      >
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                          <div style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            background: TYPE_COLORS[n.type] || 'var(--text-muted)',
                            marginTop: '5px',
                            flexShrink: 0
                          }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: n.read ? 600 : 800, fontSize: '0.92rem', color: 'var(--text-main)' }}>
                              {n.title}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px', whiteSpace: 'normal', wordBreak: 'break-word' }}>
                              {n.message}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(0,0,0,0.03)', paddingTop: '10px', fontSize: '0.78rem' }}>
                          <span className="num-font" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)' }}>
                            <Clock size={12} /> {n.time}
                          </span>
                          <div style={{ display: 'flex', gap: '14px' }}>
                            {!n.read && (
                              <button 
                                onClick={() => handleMarkRead(n.id)} 
                                style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}
                              >
                                تحديد كمقروء
                              </button>
                            )}
                            <button 
                              onClick={() => handleDelete(n.id)} 
                              style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                              <Trash2 size={12} /> حذف
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={bellRef} style={{ position: 'relative' }}>
      {bellButton}

      {open && (
        <div className="notifications-dropdown" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-lg)' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}><Bell size={16} style={{ color: 'var(--color-primary)' }} /> الإشعارات ({notifications.length})</strong>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              {unread > 0 && (
                <button onClick={handleMarkAll} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>تحديد الكل كمقروء</button>
              )}
              {notifications.length > 0 && (
                <button onClick={handleClearAll} style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>مسح الكل</button>
              )}
            </div>
          </div>
          <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>لا توجد إشعارات</div>
            ) : (
              notifications.slice(0, 10).map(n => (
                <div key={n.id} 
                  style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-light)', background: n.read ? 'transparent' : 'rgba(0,0,0,0.01)', display: 'flex', gap: '10px', flexDirection: 'column' }}
                >
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: n.read ? 'transparent' : TYPE_COLORS[n.type], marginTop: '6px', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: n.read ? 500 : 800, fontSize: '0.88rem', color: n.read ? 'var(--text-muted)' : 'var(--text-main)' }}>{n.title}</div>
                      <div style={{ fontSize: '0.82rem', color: n.read ? 'var(--text-muted)' : 'var(--text-main)', marginTop: '4px', whiteSpace: 'normal', wordBreak: 'break-word' }}>{n.message}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    <span className="num-font" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Clock size={12} /> {n.time}</span>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      {!n.read && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleMarkRead(n.id); }} 
                          style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
                        >
                          ✓ تحديد كمقروء
                        </button>
                      )}
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDelete(n.id); }} 
                        style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Trash2 size={12} /> حذف
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────
// Main App
// ──────────────────────────────────────────────────────
const ROLE_LABELS = { manager: 'المدير', waiter: 'جرسون', cashier: 'محاسب', kitchen: 'مطبخ', bar: 'بار', shisha: 'شيشة' };

function MainApp() {
  const [user, setUser] = useState(null);
  const [authPage, setAuthPage] = useState('login'); // 'login' | 'employee' | 'codes' | 'system'
  const [tables, setTables] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [deptOrders, setDeptOrders] = useState({});
  const [databaseReady, setDatabaseReady] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [toastNotifs, setToastNotifs] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showMoreSheet, setShowMoreSheet] = useState(false);
  const [showSideDrawer, setShowSideDrawer] = useState(false);


  const isMountedRef = useRef(false);
  const prevDeptOrdersRef = useRef(null);
  const audioContextRef = useRef(null);

  // ── Audio ──
  const getAudioContext = () => {
    if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    return audioContextRef.current;
  };

  const playTone = useCallback((freq, dur = 0.16, type = 'sine') => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
      osc.stop(ctx.currentTime + dur + 0.02);
    } catch { /* noop */ }
  }, [soundEnabled]);

  const playNewOrder = useCallback(() => { playTone(440, 0.16, 'triangle'); setTimeout(() => playTone(660, 0.1, 'sine'), 80); }, [playTone]);
  const playReady = useCallback(() => { playTone(880, 0.12, 'square'); setTimeout(() => playTone(760, 0.08, 'triangle'), 90); }, [playTone]);

  // ── Load / sync ──
  const loadStorage = () => {
    setTables(getTables());
    setMenuItems(getMenu().length ? getMenu() : DEFAULT_MENU);
    setDeptOrders(getDeptOrders());
    refreshNotifs();
  };

  const [dismissedNotifs, setDismissedNotifs] = useState(new Set());

  const refreshNotifs = useCallback(() => {
    if (!user) return;
    const all = getNotifications();
    
    // Filter ALL notifications for the logged-in user's bell list
    const filtered = all.filter(n => {
      const role = user.role === 'manager' ? 'admin' : user.role;
      const targetRole = String(n.targetRole || '');
      const targetRoles = Array.isArray(n.targetRoles) ? n.targetRoles : [];
      const targetDepartment = n.targetDepartment || null;

      if (role === 'admin') {
        // Manager only gets bill/invoice request notifications (containing "حساب" or "فاتورة")
        return String(n.title).includes('حساب') || String(n.title).includes('فاتورة');
      }
      if (['kitchen', 'bar', 'shisha'].includes(role)) {
        return targetDepartment === role;
      }
      if (role === 'waiter') {
        return targetRole.includes('waiter') || targetRoles.includes(user.code);
      }
      if (role === 'cashier') {
        return targetRole.includes('cashier');
      }
      return false;
    });
    setNotifications(filtered);

    // Filter toast notifications (unread + younger than 15s + not dismissed)
    const relevant = filtered.filter(n => {
      if (dismissedNotifs.has(n.id)) return false;
      if (Date.now() - n.timestamp > 15000) return false;
      return true;
    }).slice(0, 3);
    setToastNotifs(relevant);
  }, [user, dismissedNotifs]);

  // ── Init ──
  useEffect(() => {
    let cancelled = false;
    initializeDatabase().then(() => {
      if (cancelled) return;
      // Check URL parameters for auto-login
      const params = new URLSearchParams(window.location.search);
      const urlCode = params.get('code');
      const urlUser = params.get('user');

      if (urlCode || urlUser) {
        const targetCode = (urlCode || urlUser).trim();
        const acc = getManagerAccount();
        let managerMatch = false;

        if (acc && acc.active) {
          if (acc.email.trim().toLowerCase() === targetCode.toLowerCase() || targetCode === 'ADMIN') {
            managerMatch = true;
          }
        } else if (targetCode === 'ADMIN') {
          managerMatch = true;
        }

        if (managerMatch) {
          loginManager();
        } else {
          const session = authenticateByCode(targetCode);
          if (session) {
            loginEmployeeSession(session);
          }
        }

        // Clean URL params to avoid saving codes in browser history
        try {
          const newUrl = window.location.origin + window.location.pathname;
          window.history.replaceState({}, document.title, newUrl);
        } catch (e) {
          console.error('Failed to clean URL parameters:', e);
        }
      }

      loadStorage();
      const auth = getAuth();
      if (auth?.kind === 'manager') {
        const session = { id: auth.codeId, role: 'manager', name: auth.label, code: auth.codeId?.slice(0,6) || 'ADM', username: auth.label, sessionToken: auth.sessionToken };
        setUser(session);
        setAuthPage('system');
      } else if (auth?.kind === 'employee') {
        let session = getSession();
        if (!session) {
          const emps = getEmployees();
          const emp = emps.find(e => e.id === auth.codeId);
          if (emp) {
            session = { id: emp.id, role: emp.role, name: emp.name, code: emp.code, username: emp.username, departments: emp.departments };
            persist('session', session);
          }
        }
        if (session) { setUser(session); setAuthPage('system'); }
        else {
          setUser({ id: auth.codeId, role: auth.allowedRoles?.[0] || 'waiter', name: auth.label, code: auth.codeId?.slice(0, 6) || 'EMP', username: auth.label });
          setAuthPage('system');
        }
      }

      setDatabaseReady(true);
    });
    return () => { cancelled = true; };
  }, []);

  // ── Sync events ──
  useEffect(() => {
    const syncHandler = () => {
      setTables(getTables());
      setDeptOrders(getDeptOrders());
      const m = getMenu();
      if (m.length) setMenuItems(m);
      refreshNotifs();
    };
    const authHandler = () => {
      const auth = getAuth();
      if (!auth && user) { clearSession(); setUser(null); setAuthPage('login'); }
    };
    window.addEventListener('storage', syncHandler);
    window.addEventListener('taka_sync', syncHandler);
    window.addEventListener('takah_sync', syncHandler);
    window.addEventListener('takka:auth-update', authHandler);
    return () => {
      window.removeEventListener('storage', syncHandler);
      window.removeEventListener('taka_sync', syncHandler);
      window.removeEventListener('takah_sync', syncHandler);
      window.removeEventListener('takka:auth-update', authHandler);
    };
  }, [user, refreshNotifs]);

  const handleLogout = useCallback(() => {
    clearSession();
    authLogout();
    setUser(null);
    setAuthPage('login');
  }, []);

  // ── Session Heartbeat Check (newer login wins and signs out older devices) ──
  useEffect(() => {
    if (!user || !user.sessionToken) return;

    const heartbeatInterval = setInterval(async () => {
      if (navigator.onLine && supabase) {
        try {
          const { data } = await supabase
            .from('employees')
            .select('phone')
            .eq('id', user.id)
            .single();

          if (data) {
            if (data.phone && data.phone !== user.sessionToken) {
              clearInterval(heartbeatInterval);
              alert('تم تسجيل خروجك لأن الحساب دخل من جهاز آخر.');
              handleLogout();
              return;
            }
          }

          let heartbeatUpdate = supabase
            .from('employees')
            .update({ last_login: Date.now(), phone: user.sessionToken })
            .eq('id', user.id);

          if (data?.phone) {
            heartbeatUpdate = heartbeatUpdate.eq('phone', user.sessionToken);
          }

          await heartbeatUpdate;
        } catch (err) {
          console.warn('Heartbeat error:', err);
        }
      }
    }, 5000);

    return () => clearInterval(heartbeatInterval);
  }, [handleLogout, user]);

  // ── Detect new orders / ready items → play sounds ──
  useEffect(() => {
    if (!isMountedRef.current) { isMountedRef.current = true; prevDeptOrdersRef.current = deptOrders; return; }
    const flatten = (orders) => Object.entries(orders).flatMap(([id, o]) => (o.items || []).map(item => ({ key: `${id}-${item.id}`, status: item.status })));
    const prev = new Map(flatten(prevDeptOrdersRef.current || {}).map(i => [i.key, i.status]));
    const curr = flatten(deptOrders);
    const newOnes = curr.filter(i => i.status === 'new' && !prev.has(i.key));
    const readyOnes = curr.filter(i => i.status === 'ready' && prev.get(i.key) !== 'ready');
    if (newOnes.length) playNewOrder();
    if (readyOnes.length) playReady();
    prevDeptOrdersRef.current = deptOrders;
  }, [deptOrders, playNewOrder, playReady]);



  const handleSaveTables = async (newTables, options = {}) => {
    setTables(newTables);
    return await saveTables(newTables, options);
  };
  const handleManagerLogin = () => {
    const auth = getAuth();
    if (auth?.kind === 'manager') {
        const session = { id: auth.codeId, role: 'manager', name: auth.label, code: auth.codeId?.slice(0,6) || 'ADM', username: auth.label, sessionToken: auth.sessionToken };
        setUser(session);
    }
    setAuthPage('system');
};
  const handleEmployeeLogin = (session) => {
    loginEmployeeSession(session);
    setUser(session);
    setAuthPage('system');
  };
  const dismissToast = useCallback((id) => {
    setDismissedNotifs(prev => {
      const newSet = new Set(prev);
      newSet.add(id);
      return newSet;
    });
  }, [setDismissedNotifs]);

  useEffect(() => {
    refreshNotifs();
  }, [dismissedNotifs, refreshNotifs]);

  const toggleSound = () => setSoundEnabled(p => !p);

  if (!databaseReady) {
    return (
      <div className="initial-loader">
        <div className="loader-card">
          <svg className="loader-logo" viewBox="0 0 1085.6 1146.4" xmlns="http://www.w3.org/2000/svg">
            <circle className="logo-dot" cx="268.6" cy="202.1" r="86.9" />
            <path className="logo-path" d="M1355.19,1139.3c-9.4-12.1-73-98.1-83.69-96.7-24.2,2.7-27.5,37.7-20.8,80.6,7.3,35,16.7,69.2,38.3,122.9l.6,1.3c20.8,48.5,53.1,120.2,69.2,160.6,11.4,30.2,31,95.4,25.6,137.1,20.8,6,16.2-55,9.4-94.1-3.3-18.1-13.5-57.1-17.5-67.9-10.8-28.3-31.6-79.3-40.4-99.4-22.9-54.4-74.6-178.1-70.6-217,1.9-18.1,14.1-9.4,20.8,2.7,26.9,35.6,36.3,69.8,80.6,135.8,20.8,32.9,48.5,81.4,72.5,123.7a467.4,467.4,0,0,0,35,53.7c7.3,8.1,18.8,26.9,29.6,26.9,12.1,1.9,13.5-12.1,9.4-21.5-2.7-13.5-12.7-27.5-26.9-45.8-51.1-69.2-96.8-153.3-134.4-207.7" transform="translate(-987.9 -850.4)" />
            <path className="logo-path" d="M1426.7,1241.5c27.5-8.7,56.4-4,80,25.6l9.4,11.4l9.4,14.1c14.1,22.1,22.9,41,35,59.1,7.3,12.1,15.4,26.9,25.6,37.7,17.5,14.8,26.9,2.7,16.7-22.9-5.4-14.8-23.5-39-26.9-45-35-47.1-58.5-82-90.8-94.8-15.7-8.8-47.1-9.4-60.6,2.1a6.3,6.3,0,0,0-1.5,7.6A30.14,30.14,0,0,0,1426.7,1241.5Z" transform="translate(-987.9 -850.4)" />
            <path className="logo-path" d="M1881,1771.2c7.2-9.6,13.3-19.6,13.3-31.7-2.7-1.3,0-7.3-13.5-32.9-7.3-14.8-33.6-57.1-47.7-61.8l-3.3,1.3c-6.7,0-15.4,0-24.8,2.7,2.7-43.7,14.8-108.9,4.6-186.8-4.6-29.6-9.4-51.1-16.2-65.8-4.6-12.7-9.4-24.2-14.1-31-19.4-33.6-46.4-67.1-69.2-88.1-20.2-17.5-36.9-26.9-61.2-26.2-16.7,0-28.3,6.7-29.6,10-16.2-13.5-36.9-26.2-55.8-30.2-10,0-24.2-4-39,6-4.6,2.7-6,7.3,1.9,6.7h6c49.1,4.6,65.8,22.9,98.9,71.9l18.1,30.2c7.3,11.4,16.2,28.3,29.6,40.4,12.7,12.7,25.6,4,13.5-18.1l-13.5-22.1-20.2-30.2c-6-8.1-20.8-31-34.2-49.1,29.6-5.4,53.7,0,77.3,35,16.7,22.9,35.6,53.7,47.1,82,33.6,96.2,33.6,172.7,34.2,270.8-22.9,5.4-53.1,14.1-73.3,23.5-60.4,26.2-124.3,67.9-166,116.2-26.9-26.9-90-54.4-134.4-86-39-28.3-63.9-57.7-88.7-98.9-13.5-24.8-26.9-52.5-43.7-82.7-13.5-24.8-34.2-51.7-53.1-73.3-11.4-10-28.9-22.1-45.8-32.3,34.2-15.4,74.6,1.3,100.2,20.8,30.2,22.9,54.4,59.8,77.9,87.3,4,4.6,8.7,12.7,13.5,12.7,4.6,0,.6-8.7-.6-10-29.6-39-53.7-86-96.2-114.3-17.5-11.4-40.4-21.5-61.8-21.5-32.9-.6-73.9,18.1-73.3,32.9l2.7,3.3c16.7,12.1,31,22.1,45,36.9,33.6,32.9,59.1,76,81.4,124.3,19.4,36.3,39.6,69.8,69.8,99.4,42.3,41.7,96.8,67.9,131,86,20.2,11.4,38.3,23.5,55.8,42.3l-10,19.4c-1.9,20.2,15.4,49.1,30.2,71.2,19.4,29.6,108,23.6,72.5-31,22.9-22.1,62.5-49.8,86.7-65.2,34.2-22.1,87.3-41,128.3-59.1h1.3c7.5,13.9,16.5,19.9,24.1,22.1A20.61,20.61,0,0,0,1881,1771.2Zm-145.2,7.3c-57.1,26.9-141.8,89.4-163.9,137.7-12.7-13.5-31-55-47.7-69.8,15.4-22.1,47.7-57.1,79.3-79.3,63.9-47.1,120.2-75.2,192.9-100.8l33.6-12.1v-1.3l50.4,85.4C1853.4,1736.8,1799.7,1751.6,1735.8,1778.5Z" transform="translate(-987.9 -850.4)" />
            <path className="logo-path" d="M1786.2,1690.4c-23.5,14.8-12.1,46.4,11.4,43.1C1823.2,1728.1,1817.8,1686.4,1786.2,1690.4Z" transform="translate(-987.9 -850.4)" />
          </svg>
          <div className="loader-text">تكة</div>
          <div className="loader-sub">نظام إدارة المطعم</div>
        </div>
      </div>
    );
  }

  // ── Auth screens ──
  if (!user && authPage !== 'codes') {
    return (
      <div className="app-shell">
      <main className="app-main main-content">
          {authPage === 'employee' ? (
            <EmployeeLogin onSwitch={() => setAuthPage('login')} onLoginSuccess={handleEmployeeLogin} />
          ) : (
            <ManagerLogin onSwitch={() => setAuthPage('employee')} onLogin={handleManagerLogin} />
          )}
        </main>
      </div>
    );
  }

  
  const isDept = ['kitchen', 'bar', 'shisha'].includes(user.role);

    return (
    <div className={`app-shell role-${user.role}`}>
      {/* Mobile header (visible on < 768px) */}
      <MobileHeader user={user} onMenuClick={() => setShowSideDrawer(true)} />

      {/* Desktop header (visible on >= 768px) */}
      <header className="header-bar">
        <div className="brand">
          <span className="brand-logo">
            <BrandLogo type="full" size={28} style={{ marginLeft: '8px' }} />
            <span style={{ fontFamily: "'Cairo', sans-serif", marginRight: '-2px' }}>| تكة</span>
          </span>
          <span className="brand-tag">{ROLE_LABELS[user.role] || user.role}</span>
        </div>

        <div className="user-profile" style={{ gap: '8px' }}>
          {user.role === 'manager' && (
            <button
              className="header-hamburger md:hidden"
              onClick={() => setSidebarOpen(o => !o)}
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid var(--border-light)',
                borderRadius: '10px',
                minWidth: '44px',
                minHeight: '44px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-main)',
                fontSize: '1.3rem'
              }}
            >
              <Menu size={20} />
            </button>
          )}
          <button
            onClick={toggleSound}
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid var(--border-light)',
              borderRadius: '10px',
              minWidth: '44px',
              minHeight: '44px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              transition: 'all 0.15s ease'
            }}
            title={soundEnabled ? 'تعطيل الصوت' : 'تفعيل الصوت'}
          >
            {soundEnabled ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" /></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><line x1="22" y1="9" x2="16" y2="15" /><line x1="16" y1="9" x2="22" y2="15" /></svg>
            )}
          </button>
          <NotificationBell notifications={notifications} onRefresh={refreshNotifs} />
          <div className="user-info">
            <div className="user-name">{user.name}</div>
            <div className="user-role num-font">{user.role === 'manager' ? 'ADMIN' : `#${user.code}`}</div>
          </div>
          
          <button
            className="btn btn-secondary"
            onClick={handleLogout}
            style={{ padding: '8px 12px', fontSize: '0.82rem', display: 'flex', gap: '6px', alignItems: 'center', borderRadius: '8px', height: '40px' }}
            title="خروج"
          >
            <LogOut size={16} />
            <span>خروج</span>
          </button>
        </div>
      </header>

      <SideDrawer
        open={showSideDrawer}
        onClose={() => setShowSideDrawer(false)}
        user={user}
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
        onLogout={handleLogout}
        notifications={notifications}
        unreadCount={notifications.filter(n => !n.read).length}
        onMarkAllRead={() => { markAllNotificationsRead(); refreshNotifs(); }}
      />

      <main className="app-main main-content">
        {user.role === 'manager' && (
          <AdminDashboard user={user} onLogout={handleLogout} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} activeTab={activeTab} setActiveTab={setActiveTab} />
        )}
        {user.role === 'waiter' && (
          <WaiterView tables={tables} onSaveTables={handleSaveTables} employee={user} menuItems={menuItems} activeTab={activeTab} />
        )}
        {user.role === 'cashier' && (
          <CashierView tables={tables} onSaveTables={handleSaveTables} employee={user} activeTab={activeTab} setActiveTab={setActiveTab} />
        )}
        {isDept && (
          <DeptScreen user={user} deptOrders={deptOrders} onUpdateOrders={setDeptOrders} soundEnabled={soundEnabled} toggleSound={toggleSound} />
        )}
      </main>
      
      {user.role === 'manager' && (
        <BottomNavigation
          role={user.role}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onMoreClick={() => setShowMoreSheet(true)}
        />
      )}
      {user.role === 'cashier' && (
        <CashierBottomNavigation
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      )}

      <MoreSheet
        show={showMoreSheet}
        onClose={() => setShowMoreSheet(false)}
        userRole={user.role}
        onLogout={handleLogout}
        onNavigate={(tab) => setActiveTab(tab)}
      />

      {/* Install PWA prompt */}
      <InstallPrompt />

      {/* Toast notifications */}
      {toastNotifs.length > 0 && (
        <NotificationsToast notifications={toastNotifs} onClose={dismissToast} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <NotificationProvider>
      <OrderProvider>
        <MainApp />
      </OrderProvider>
    </NotificationProvider>
  );
}
