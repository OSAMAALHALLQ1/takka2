import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, Clock, Trash2, Menu, LogOut } from 'lucide-react';
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
            {unread > 0 && <button onClick={handleMarkAll} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>تحديد الكل كمقروء</button>}
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

      if (role === 'admin') return true;
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

  // Background check for forgotten/delayed orders (10+ minutes)
  const alertedDelayedRef = useRef(new Set());
  
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
                    `طلب الطاولة #${order.tableId} منسي! 10 دقائق قيد الانتظار`,
                    `يرجى الاستعجال في تحضير الطلب بقسم ${dept === 'kitchen' ? 'المطبخ' : dept === 'bar' ? 'البار' : 'الشيشة'}`,
                    'warning',
                    ['manager']
                  );
                }
              });
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

  if (!databaseReady) {
    return (
      <div className="app-shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-surface)' }}>
        <div style={{ textAlign: 'center', animation: 'fadeInUp 0.5s ease' }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: '20px',
            background: 'var(--color-primary-glow)',
            border: '2px solid var(--color-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
            color: 'var(--color-primary)',
            fontWeight: 800, fontSize: '1.8rem',
          }}>
            تكة
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '8px', color: 'var(--text-main)' }}>تكة</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '24px' }}>نظام إدارة المطعم</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <div className="skeleton-pulse" style={{ width: '8px', height: '8px', borderRadius: '50%', animationDelay: '0s' }} />
            <div className="skeleton-pulse" style={{ width: '8px', height: '8px', borderRadius: '50%', animationDelay: '0.2s' }} />
            <div className="skeleton-pulse" style={{ width: '8px', height: '8px', borderRadius: '50%', animationDelay: '0.4s' }} />
          </div>
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
            <BrandLogo size={28} style={{ marginLeft: '8px' }} />
            تكة | TAKA
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
