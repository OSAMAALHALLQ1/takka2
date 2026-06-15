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
import ManagerCodes from './components/ManagerCodes';
import WaiterView from './components/WaiterView';
import CashierView from './components/CashierView';
import AdminDashboard from './components/AdminDashboard';
import NotificationsToast from './components/NotificationsToast';
import BrandLogo from './components/BrandLogo';

// ──────────────────────────────────────────────────────
// Dept Screen (Kitchen / Bar / Shisha)
// ──────────────────────────────────────────────────────
function DeptScreen({ user, deptOrders, onUpdateOrders, soundEnabled, toggleSound }) {
  const myRole = user.role; // 'kitchen' | 'bar' | 'shisha'
  const DEPT_ICONS = { kitchen: '🍳', bar: '🍺', shisha: '💨' };
  const DEPT_NAMES = { kitchen: 'المطبخ', bar: 'البار', shisha: 'الشيشة' };
  const STATUS_COLORS = { new: '#e74c3c', preparing: '#f39c12', ready: '#27ae60', delivered: '#7f8c8d' };
  const STATUS_LABELS = { new: 'جديد', preparing: 'يتحضر', ready: 'جاهز', delivered: 'مُسلَّم' };

  const [now, setNow] = useState(() => Date.now());
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const t = setInterval(() => {
      setNow(Date.now());
      setTimeStr(new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  // Filter orders that have items for this dept
  const myOrders = Object.entries(deptOrders)
    .filter(([, order]) => (order.items || []).some(i => i.department === myRole))
    .map(([orderId, order]) => ({
      orderId,
      tableName: order.tableName,
      tableId: order.tableId,
      timestamp: order.timestamp,
      items: (order.items || []).filter(i => i.department === myRole)
    }))
    .filter(o => o.items.length > 0)
    .sort((a, b) => a.timestamp - b.timestamp);

  const activeOrders = myOrders.filter(o => o.items.some(i => ['new', 'preparing'].includes(i.status)));
  const readyOrders = myOrders.filter(o => o.items.every(i => i.status === 'ready' || i.status === 'delivered'));

  const updateStatus = (orderId, itemId, newStatus) => {
    updateDeptOrderItem(orderId, itemId, { status: newStatus });
    const updated = getDeptOrders();
    onUpdateOrders(updated);
    if (newStatus === 'ready') {
      const order = updated[orderId];
      const tableId = order?.tableId || '';
      const wCode = order?.waiterCode;
      const targets = wCode ? [wCode, 'manager'] : ['waiter', 'manager'];
      const deptName = myRole === 'kitchen' ? 'المطبخ' : myRole === 'bar' ? 'البار' : 'الشيشة';

      // Check if all items in this order are now ready or delivered
      const allReady = (order?.items || []).every(i => ['ready', 'delivered'].includes(i.status));

      // Check if this table has requested the bill
      const currentTables = getTables();
      const thisTable = currentTables.find(t => t.id === tableId);

      if (thisTable && thisTable.status === 'bill_requested' && allReady) {
        addNotification(
          `✅ فاتورة الطاولة #${tableId} مكتملة - انتظار الدفع`,
          `جميع الطلبات جاهزة، يرجى تحصيل المبلغ: ${(thisTable.total || 0).toFixed(2)} ₪`,
          'success',
          ['cashier', 'manager']
        );
      } else if (allReady) {
        addNotification(
          `✅ كل طلبات الطاولة #${tableId} جاهزة!`,
          `جميع الأصناف أصبحت جاهزة للتسليم من قسم ${deptName}`,
          'success',
          targets
        );
      } else {
        addNotification(
          `✅ طلب الطاولة #${tableId} جاهز!`,
          `- من ${deptName}`,
          'success',
          targets
        );
      }
    }
  };

  const elapsedMin = (ts) => Math.floor((now - ts) / 60000);
  const isUrgent = (ts) => elapsedMin(ts) >= 10;

  const totalNew = myOrders.reduce((s, o) => s + o.items.filter(i => i.status === 'new').length, 0);
  const totalPrep = myOrders.reduce((s, o) => s + o.items.filter(i => i.status === 'preparing').length, 0);
  const totalReady = myOrders.reduce((s, o) => s + o.items.filter(i => i.status === 'ready').length, 0);

  const handleDelay = (order, item) => {
    addNotification('⏰ تأخير الطلب', `تم تأجيل تحضير صنف ${item.name} لطاولة ${order.tableName} بطلب من قسم ${DEPT_NAMES[myRole]}`, 'warning', ['waiter', 'manager']);
    alert(`تم إرسال إشعار بتأخير الصنف ${item.name} لطاولة ${order.tableName}`);
  };

  const handleAlert = (order, item) => {
    addNotification('⚠️ تنبيه للجرسون', `قسم ${DEPT_NAMES[myRole]} يحتاج لمراجعة جرسون طاولة ${order.tableName} بخصوص صنف ${item.name}`, 'danger', ['waiter', 'manager']);
    alert(`تم إرسال تنبيه للجرسون بخصوص صنف ${item.name} لطاولة ${order.tableName}`);
  };

  return (
    <div className="view-container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0 }}>
            {DEPT_ICONS[myRole]} قسم {DEPT_NAMES[myRole]}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '4px' }}>مرحباً، {user.name} | ⏰ {timeStr || '—'}</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {totalNew > 0 && <span style={{ background: '#e74c3c', width: '12px', height: '12px', borderRadius: '50%', display: 'inline-block', animation: 'pulse 1.5s infinite' }} title="طلبات جديدة" />}
          <button
            onClick={toggleSound}
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid var(--border-light)', borderRadius: '10px', padding: '8px 14px', cursor: 'pointer', fontSize: '0.82rem', display: 'flex', gap: '6px', alignItems: 'center', color: 'var(--text-main)' }}
          >
            {soundEnabled ? '🔊 صوت' : '🔇 صامت'}
          </button>
        </div>
      </div>

      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'جديد 🆕', count: totalNew, color: '#e74c3c' },
          { label: 'يتحضر ⏳', count: totalPrep, color: '#f39c12' },
          { label: 'جاهز ✅', count: totalReady, color: '#27ae60' }
        ].map(s => (
          <div key={s.label} style={{ textAlign: 'center', padding: '16px', background: `${s.color}11`, border: `1px solid ${s.color}33`, borderRadius: '12px' }}>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '2rem', fontWeight: 800, color: s.color }}>{s.count}</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* No orders */}
      {myOrders.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '4rem', marginBottom: '12px' }}>{DEPT_ICONS[myRole]}</div>
          <h3 style={{ marginBottom: '8px', color: 'var(--text-main)' }}>لا توجد طلبات حالياً</h3>
          <p style={{ fontSize: '0.85rem' }}>ستظهر الطلبات هنا بمجرد إرسالها من الجرسون</p>
        </div>
      )}

      {/* Active Orders */}
      {activeOrders.length > 0 && (
        <>
          <h3 style={{ marginBottom: '14px', fontWeight: 700, fontSize: '1rem' }}>📋 الطلبات النشطة ({activeOrders.length})</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            {activeOrders.map(order => {
              const waitMin = elapsedMin(order.timestamp);
              const stars = waitMin >= 10 ? '⭐⭐⭐' : waitMin >= 5 ? '⭐⭐' : '⭐';
              return (
                <div key={order.orderId} className="glass-card" style={{
                  padding: '20px',
                  borderTop: `4px solid ${isUrgent(order.timestamp) ? '#e74c3c' : '#f39c12'}`,
                  position: 'relative'
                }}>
                  {isUrgent(order.timestamp) && (
                    <div style={{ position: 'absolute', top: 8, left: 8, background: '#e74c3c', color: '#fff', fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '10px' }}>
                      ⏰ منذ {waitMin} د
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{order.tableName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        الأولوية: {stars} | ⏱ منذ {waitMin} دقيقة
                      </div>
                    </div>
                  </div>

                  {order.items.map(item => {
                    const elapsedSec = Math.floor((now - (item.orderedAt || order.timestamp)) / 1000);
                    const elapsedMinPart = Math.floor(elapsedSec / 60);
                    const elapsedSecPart = elapsedSec % 60;
                    const prepTime = item.prepTime || 15;
                    const expectedPrepSec = prepTime * 60;
                    const percent = Math.min(95, Math.floor((elapsedSec / expectedPrepSec) * 100));
                    
                    return (
                      <div key={item.id} style={{ marginBottom: '16px', borderBottom: '1px dashed rgba(255,255,255,0.05)', paddingBottom: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <div>
                            <span style={{ fontWeight: 600 }}>{item.name}</span>
                            <span style={{ color: 'var(--text-muted)', marginRight: '6px', fontFamily: 'Outfit, sans-serif' }}> × {item.qty}</span>
                            {item.note && <div style={{ fontSize: '0.72rem', color: '#f39c12' }}>📝 {item.note}</div>}
                          </div>
                          <span style={{ fontSize: '0.78rem', color: STATUS_COLORS[item.status], fontWeight: 600 }}>
                            {STATUS_LABELS[item.status]}
                          </span>
                        </div>

                         {(item.status === 'new' || item.status === 'preparing') && (
                           <div style={{ margin: '8px 0' }}>
                             <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '3px' }}>
                               <span>الوقت المتوقع: {prepTime} د</span>
                               <span>مضى: {elapsedMinPart}:{elapsedSecPart.toString().padStart(2, '0')} د ({percent}%)</span>
                             </div>
                             <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                               <div style={{ width: `${percent}%`, height: '100%', background: item.status === 'preparing' ? '#f39c12' : '#e74c3c', borderRadius: '3px' }}></div>
                             </div>
                           </div>
                         )}

                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                          {item.status === 'new' && (
                            <button
                              onClick={() => updateStatus(order.orderId, item.id, 'preparing')}
                              style={{ padding: '5px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: '#f39c1222', color: '#f39c12', fontWeight: 700, fontSize: '0.78rem' }}
                            >
                              ▶ بدء التحضير
                            </button>
                          )}
                          
                          {(item.status === 'new' || item.status === 'preparing') && (
                            <>
                              <button
                                onClick={() => handleDelay(order, item)}
                                style={{ padding: '5px 10px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', fontSize: '0.75rem' }}
                              >
                                تأجيل
                              </button>
                              <button
                                onClick={() => handleAlert(order, item)}
                                style={{ padding: '5px 10px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: 'rgba(231,76,60,0.1)', color: '#e74c3c', fontSize: '0.75rem' }}
                              >
                                إرسال إنذار
                              </button>
                            </>
                          )}

                          {item.status === 'preparing' && (
                            <button
                              onClick={() => updateStatus(order.orderId, item.id, 'ready')}
                              style={{ padding: '5px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: '#27ae6022', color: '#27ae60', fontWeight: 700, fontSize: '0.78rem' }}
                            >
                              ✅ جاهز
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Ready Orders */}
      {readyOrders.length > 0 && (
        <>
          <h3 style={{ marginBottom: '14px', fontWeight: 700, fontSize: '1rem', color: '#27ae60' }}>✅ جاهز للتسليم ({readyOrders.length})</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
            {readyOrders.map(order => (
              <div key={order.orderId} className="glass-card" style={{ padding: '16px', borderTop: '4px solid #27ae60', opacity: 0.7 }}>
                <div style={{ fontWeight: 700, color: '#27ae60' }}>✅ {order.tableName}</div>
                {order.items.map(item => (
                  <div key={item.id} style={{ fontSize: '0.85rem', marginTop: '6px', color: 'var(--text-muted)' }}>
                    {item.name} × {item.qty}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </>
      )}
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

export default function App() {
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
        setAuthPage('codes');
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
  const handleManagerLogin = () => setAuthPage('codes');
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

  if (authPage === 'codes') {
    return (
      <div className="app-shell">
        <header className="header-bar">
          <div className="brand">
            <span className="brand-logo"><BrandLogo size={28} style={{ marginLeft: '8px' }} /> تكة | TAKA</span>
            <span className="brand-tag">لوحة المدير</span>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="btn-primary-gold"
              onClick={() => { setUser({ id: 'admin-1', role: 'manager', name: 'مدير تكة', code: 'ADMIN', username: 'admin' }); setAuthPage('system'); }}
            >
              📊 لوحة التحكم الكاملة
            </button>
            <button className="btn btn-secondary" onClick={handleLogout} style={{ padding: '8px 14px', fontSize: '0.82rem' }}>
              🚪 خروج
            </button>
          </div>
        </header>
        <main className="app-main" style={{ padding: '20px' }}>
          <ManagerCodes onLogout={handleLogout} />
        </main>
      </div>
    );
  }

  const isDept = ['kitchen', 'bar', 'shisha'].includes(user.role);

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
          <AdminDashboard user={user} onLogout={handleLogout} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
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

      {/* Toast notifications */}
      {toastNotifs.length > 0 && (
        <NotificationsToast notifications={toastNotifs} onClose={dismissToast} />
      )}
    </div>
  );
}
