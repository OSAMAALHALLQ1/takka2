import { useState, useEffect, useRef, useCallback } from 'react';
import {
  getTables, saveTables, getNotifications,
  getMenu, getDeptOrders, updateDeptOrderItem,
  addNotification, initializeDatabase, clearSession, getSession,
  markAllNotificationsRead, markNotificationRead, deleteNotification,
  DEFAULT_MENU
} from './utils/storage';
import { getAuth, logout as authLogout } from './utils/auth-store';
import ManagerLogin from './components/ManagerLogin';
import EmployeeLogin from './components/EmployeeLogin';

import WaiterView from './components/WaiterView';
import CashierView from './components/CashierView';
import AdminDashboard from './components/AdminDashboard';
import NotificationsToast from './components/NotificationsToast';
import BrandLogo from './components/BrandLogo';
import BottomNavigation from './components/Layout/BottomNavigation';
import { OrderProvider } from './context/OrderContext';
import { NotificationProvider } from './context/NotificationContext';
import KitchenDashboard from './components/Dashboard/KitchenDashboard';
import BarDashboard from './components/Dashboard/BarDashboard';
import ShishaDashboard from './components/Dashboard/ShishaDashboard';

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
  const bellRef = useRef(null);
  const unread = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handleClick = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleMarkAll = () => {
    markAllNotificationsRead();
    onRefresh();
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

  return (
    <div ref={bellRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ position: 'relative', background: 'rgba(255,255,255,0.08)', border: '1px solid var(--border-light)', borderRadius: '10px', padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-main)', fontSize: '1.2rem' }}
        aria-label="الإشعارات"
      >
        🔔
        {unread > 0 && (
          <span style={{ position: 'absolute', top: '-4px', right: '-4px', background: '#e74c3c', color: '#fff', borderRadius: '50%', width: '18px', height: '18px', fontSize: '0.68rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Outfit, sans-serif' }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="notifications-dropdown">
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ fontSize: '0.9rem' }}>🔔 الإشعارات ({notifications.length})</strong>
            {unread > 0 && <button onClick={handleMarkAll} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>تحديد الكل كمقروء</button>}
          </div>
          <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>لا توجد إشعارات</div>
            ) : (
              notifications.slice(0, 10).map(n => (
                <div key={n.id} 
                  style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-light)', background: n.read ? 'transparent' : 'rgba(255,255,255,0.02)', display: 'flex', gap: '10px', flexDirection: 'column' }}
                >
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: n.read ? 'transparent' : TYPE_COLORS[n.type], marginTop: '6px', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: n.read ? 500 : 800, fontSize: '0.88rem', color: n.read ? 'var(--text-muted)' : 'var(--text-main)' }}>{n.title}</div>
                      <div style={{ fontSize: '0.82rem', color: n.read ? 'var(--text-muted)' : 'var(--text-main)', marginTop: '4px', whiteSpace: 'normal', wordBreak: 'break-word' }}>{n.message}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    <span className="num-font">⏱️ {n.time}</span>
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
                        style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
                      >
                        🗑️ حذف
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
      if (n.targetRoles && n.targetRoles.length > 0) {
        const matchesRole = n.targetRoles.includes(user.role);
        const matchesCode = n.targetRoles.includes(user.code);
        if (user.role === 'manager') return true; // Manager gets everything
        return matchesRole || matchesCode;
      }
      return user.role === 'manager' || user.role === 'waiter' || user.role === 'cashier';
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
      loadStorage();
      const auth = getAuth();
      if (auth?.kind === 'manager') {
        const session = { id: auth.codeId, role: 'manager', name: auth.label, code: auth.codeId?.slice(0,6) || 'ADM', username: auth.label };
        setUser(session);
        setAuthPage('system');
      } else if (auth?.kind === 'employee') {
        const session = getSession();
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

  // Background check for forgotten/delayed orders (10+ minutes) and table duration (2+ hours)
  const alertedDelayedRef = useRef(new Set());
  const alertedTablesRef = useRef(new Set());
  
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      const now = Date.now();
      
      // 1. Check for forgotten orders
      const orders = getDeptOrders();
      Object.entries(orders).forEach(([orderId, order]) => {
        const elapsed = now - order.timestamp;
        if (elapsed >= 10 * 60000) { // 10 minutes
          const pendingItems = (order.items || []).filter(i => ['new', 'preparing'].includes(i.status));
          if (pendingItems.length > 0) {
            const depts = [...new Set(pendingItems.map(i => i.department))];
            depts.forEach(dept => {
              const alertKey = `${orderId}-${dept}-delayed`;
              if (!alertedDelayedRef.current.has(alertKey)) {
                alertedDelayedRef.current.add(alertKey);
                addNotification(
                  `⏰ طلب الطاولة #${order.tableId} منسي! 10 دقائق قيد الانتظار`,
                  `يرجى الاستعجال في تحضير الطلب بقسم ${dept === 'kitchen' ? 'المطبخ' : dept === 'bar' ? 'البار' : 'الشيشة'}`,
                  'warning',
                  [dept, 'manager']
                );
              }
            });
          }
        }
      });
      
      // 2. Check for long-seated tables
      const currentTables = getTables().filter(t => t.status === 'eating' || t.status === 'bill_requested');
      currentTables.forEach(t => {
        if (t.seatedAt) {
          const elapsed = now - t.seatedAt;
          if (elapsed >= 2 * 60 * 60000) { // 2 hours
            const alertKey = `${t.id}-${t.seatedAt}-occupied`;
            if (!alertedTablesRef.current.has(alertKey)) {
              alertedTablesRef.current.add(alertKey);
              const targets = t.waiterCode ? [t.waiterCode, 'manager'] : ['waiter', 'manager'];
              addNotification(
                `⏰ الطاولة #${t.id} مشغولة منذ 2 ساعة - تنبيه!`,
                `${t.name} مشغولة لفترة طويلة تتجاوز الساعتين`,
                'warning',
                targets
              );
            }
          }
        }
      });
    }, 15000); // Check every 15 seconds
    
    return () => clearInterval(interval);
  }, [user]);

  const handleSaveTables = (newTables) => { setTables(newTables); saveTables(newTables); };
  const handleLogout = () => { clearSession(); authLogout(); setUser(null); setAuthPage('login'); };
  const handleManagerLogin = () => {
    const auth = getAuth();
    if (auth?.kind === 'manager') {
        const session = { id: auth.codeId, role: 'manager', name: auth.label, code: auth.codeId?.slice(0,6) || 'ADM', username: auth.label };
        setUser(session);
    }
    setAuthPage('system');
};
  const handleEmployeeLogin = (session) => {
    setUser(session);
    setAuthPage('system');
  };
  const dismissToast = useCallback((id) => {
    setDismissedNotifs(prev => {
      const newSet = new Set(prev);
      newSet.add(id);
      return newSet;
    });
  }, []);

  useEffect(() => {
    refreshNotifs();
  }, [dismissedNotifs, refreshNotifs]);

  const toggleSound = () => setSoundEnabled(p => !p);

  // ── Loading ──
  if (!databaseReady) {
    return (
      <div className="app-shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px', animation: 'spin 1.5s linear infinite', display: 'inline-block' }}>⚙️</div>
          <h2 style={{ fontSize: '1.3rem', marginBottom: '8px' }}>تكة | TAKA</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>جاري تحميل النظام...</p>
        </div>
      </div>
    );
  }

  // ── Auth screens ──
  if (!user && authPage !== 'codes') {
    return (
      <div className="app-shell">
        <main className="app-main">
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
  const [activeTab, setActiveTab] = useState('dashboard');

    return (
    <div className={`app-shell role-${user.role}`}>
      {/* Header */}
      <header className="header-bar">
        <div className="brand">
          <span className="brand-logo">
            <BrandLogo size={28} style={{ marginLeft: '8px' }} />
            تكة | TAKA
          </span>
          <span className="brand-tag">{ROLE_LABELS[user.role] || user.role}</span>
        </div>

        <div className="user-profile">
          {user.role === 'manager' && (
            <button
              className="header-hamburger md:hidden"
              onClick={() => setSidebarOpen(o => !o)}
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid var(--border-light)',
                borderRadius: '10px',
                width: '40px',
                height: '40px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-main)',
                fontSize: '1.4rem'
              }}
            >
              ☰
            </button>
          )}
          <button
            onClick={toggleSound}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid var(--border-light)',
              borderRadius: '10px',
              width: '40px',
              height: '40px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-main)',
              fontSize: '1.2rem',
              transition: 'all 0.2s'
            }}
            title={soundEnabled ? 'تعطيل الصوت' : 'تفعيل الصوت'}
          >
            {soundEnabled ? '🔊' : '🔇'}
          </button>
          <NotificationBell notifications={notifications} onRefresh={refreshNotifs} />
          <div className="user-info">
            <div className="user-name">{user.name}</div>
            <div className="user-role num-font">{user.role === 'manager' ? 'ADMIN' : `#${user.code}`}</div>
          </div>
          <button
            className="btn btn-secondary"
            onClick={handleLogout}
            style={{ padding: '8px 14px', fontSize: '0.82rem', display: 'flex', gap: '6px', alignItems: 'center' }}
          >
            🚪 خروج
          </button>
        </div>
      </header>

      <main className="app-main">
        {user.role === 'manager' && (
          <AdminDashboard user={user} onLogout={handleLogout} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} activeTab={activeTab} setActiveTab={setActiveTab} />
        )}
        {user.role === 'waiter' && (
          <WaiterView tables={tables} onSaveTables={handleSaveTables} employee={user} menuItems={menuItems} />
        )}
        {user.role === 'cashier' && (
          <CashierView tables={tables} onSaveTables={handleSaveTables} employee={user} />
        )}
        {isDept && (
          <DeptScreen user={user} deptOrders={deptOrders} onUpdateOrders={setDeptOrders} soundEnabled={soundEnabled} toggleSound={toggleSound} />
        )}
      </main>
      {user.role === 'manager' && <BottomNavigation activeTab={activeTab} setActiveTab={setActiveTab} />}

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
