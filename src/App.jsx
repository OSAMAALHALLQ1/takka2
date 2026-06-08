import React, { useState, useEffect, useRef } from 'react';
import {
  getTables,
  saveTables,
  getEmployees,
  getNotifications,
  saveNotifications,
  getManagerCredentials,
  getMenu,
  saveMenu,
  getDeptOrders,
  saveDeptOrders,
  updateDeptOrderItem,
  getBills,
  saveBills,
  addNotification
} from './utils/storage';
import { menuItems as defaultMenuItems } from './data/menu';
import Login from './components/Login';
import WaiterView from './components/WaiterView';
import NotificationsToast from './components/NotificationsToast';
import { Coffee, LogOut, Bell, BellOff, CreditCard, Edit3, Star } from 'lucide-react';

const departmentLabels = {
  kitchen: 'مطبخ',
  bar: 'بار',
  shisha: 'شيشة'
};

const paymentLabels = {
  cash: 'نقداً',
  card: 'بطاقة',
  app: 'تطبيق'
};

export default function App() {
  const [user, setUser] = useState(null);
  const [tables, setTables] = useState([]);
  const [employeeList, setEmployeeList] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [deptOrders, setDeptOrders] = useState({});
  const [bills, setBills] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('cash');
  const [paymentWarning, setPaymentWarning] = useState('');
  const [selectedCashTableId, setSelectedCashTableId] = useState(null);
  const [activeManagerTab, setActiveManagerTab] = useState('overview');
  const [editingPriceId, setEditingPriceId] = useState(null);
  const [priceDraft, setPriceDraft] = useState('');
  const [elapsedTimes, setElapsedTimes] = useState({});

  const isMountedRef = useRef(false);
  const prevDeptOrdersRef = useRef(null);
  const audioContextRef = useRef(null);

  const getAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContextRef.current;
  };

  const playTone = (frequency, duration = 0.16, type = 'sine') => {
    if (!soundEnabled) return;
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    oscillator.start();
    gain.gain.exponentialRampToValueAtTime(0.16, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    oscillator.stop(ctx.currentTime + duration + 0.02);
  };

  const playNewOrderSound = () => {
    playTone(440, 0.16, 'triangle');
    setTimeout(() => playTone(660, 0.1, 'sine'), 80);
  };

  const playReadySound = () => {
    playTone(880, 0.12, 'square');
    setTimeout(() => playTone(760, 0.08, 'triangle'), 90);
  };

  const loadStorage = () => {
    const initTables = getTables();
    const initEmployees = getEmployees();
    const initNotifications = getNotifications();
    const storedMenu = getMenu();
    const initialMenu = storedMenu.length ? storedMenu : defaultMenuItems;
    if (!storedMenu.length) {
      saveMenu(defaultMenuItems);
    }
    const initialDeptOrders = getDeptOrders();
    const initialBills = getBills();

    setTables(initTables);
    setEmployeeList(initEmployees);
    setNotifications(initNotifications.slice(0, 5));
    setMenuItems(initialMenu);
    setDeptOrders(initialDeptOrders);
    setBills(initialBills);
  };

  useEffect(() => {
    loadStorage();

    const params = new URLSearchParams(window.location.search);
    const codeParam = params.get('code');

    if (codeParam) {
      const matched = getEmployees().find(
        (emp) => emp.code.trim().toUpperCase() === codeParam.trim().toUpperCase()
      );
      if (matched) {
        setUser({ role: matched.role, name: matched.name, code: matched.code });
      } else if (codeParam.trim().toUpperCase() === 'ADMIN') {
        const storedManager = getManagerCredentials();
        setUser({
          role: 'manager',
          name: storedManager ? storedManager.name : 'المدير العام',
          code: 'ADMIN'
        });
      }
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }, []);

  useEffect(() => {
    const handleSync = () => {
      setTables(getTables());
      setEmployeeList(getEmployees());
      setNotifications(getNotifications().slice(0, 5));
      setDeptOrders(getDeptOrders());
      setBills(getBills());
      const storedMenu = getMenu();
      if (storedMenu.length) {
        setMenuItems(storedMenu);
      }
    };

    window.addEventListener('storage', handleSync);
    window.addEventListener('takah_sync', handleSync);

    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('takah_sync', handleSync);
    };
  }, []);

  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      prevDeptOrdersRef.current = deptOrders;
      return;
    }

    const flattenOrders = (orders) =>
      Object.entries(orders).flatMap(([orderId, order]) =>
        (order.items || []).map((item) => ({
          key: `${orderId}-${item.id}`,
          status: item.status,
          tableName: order.tableName
        }))
      );

    const prevFlat = flattenOrders(prevDeptOrdersRef.current || {});
    const currFlat = flattenOrders(deptOrders);
    const prevMap = new Map(prevFlat.map((item) => [item.key, item.status]));

    const newOrderChanges = currFlat.filter(
      (item) => item.status === 'new' && prevMap.get(item.key) !== 'new'
    );
    const readyChanges = currFlat.filter(
      (item) => item.status === 'ready' && prevMap.get(item.key) !== 'ready'
    );

    if (newOrderChanges.length) {
      playNewOrderSound();
    }
    if (readyChanges.length) {
      playReadySound();
    }

    prevDeptOrdersRef.current = deptOrders;
  }, [deptOrders, soundEnabled]);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTimes((prev) => {
        const next = { ...prev };
        Object.entries(deptOrders).forEach(([orderId, order]) => {
          const key = `order-${orderId}`;
          if (!next[key]) {
            next[key] = Math.floor((Date.now() - order.timestamp) / 1000);
          } else {
            next[key] = Math.floor((Date.now() - order.timestamp) / 1000);
          }
        });
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [deptOrders]);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
  };

  const printBill = (bill) => {
    const printWindow = window.open('', '', 'height=600,width=400');
    const receipt = `
      <html>
        <head>
          <title>فاتورة - ${bill.tableName}</title>
          <style>
            body { font-family: Arial, sans-serif; direction: rtl; text-align: right; padding: 20px; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
            .restaurant-name { font-size: 24px; font-weight: bold; }
            .details { margin-bottom: 15px; font-size: 12px; }
            .items { margin-bottom: 20px; }
            .item { display: flex; justify-content: space-between; margin-bottom: 8px; border-bottom: 1px dashed #999; }
            .totals { border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 10px 0; margin-bottom: 15px; }
            .total-row { display: flex; justify-content: space-between; font-weight: bold; }
            .payment { text-align: center; margin-top: 20px; font-size: 14px; }
            .thank-you { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="restaurant-name">مطعم تكة</div>
            <div class="restaurant-name">Taka Restaurant</div>
          </div>

          <div class="details">
            <div>الطاولة: ${bill.tableName}</div>
            <div>التاريخ: ${bill.dateFormatted}</div>
            <div>الوقت: ${bill.timeFormatted}</div>
            <div>رقم الفاتورة: ${bill.id}</div>
            <div>المحاسب: ${bill.cashierCode}</div>
            <div>النادل: ${bill.waiterCode}</div>
          </div>

          <div class="items">
            ${(bill.items || [])
              .map(
                (item) =>
                  `<div class="item">
                    <span>${item.name} × ${item.qty}</span>
                    <span>${(item.qty * item.price).toFixed(2)} د.أ</span>
                  </div>`
              )
              .join('')}
          </div>

          <div class="totals">
            <div class="total-row">
              <span>المجموع الفرعي:</span>
              <span>${bill.subtotal.toFixed(2)} د.أ</span>
            </div>
            <div class="total-row" style="margin-top: 8px;">
              <span>الضريبة (15%):</span>
              <span>${bill.tax.toFixed(2)} د.أ</span>
            </div>
            <div class="total-row" style="margin-top: 8px; font-size: 16px;">
              <span>الإجمالي:</span>
              <span>${bill.total.toFixed(2)} د.أ</span>
            </div>
          </div>

          <div class="payment">
            <div>طريقة الدفع: ${paymentLabels[bill.paymentMethod] || 'نقداً'}</div>
          </div>

          <div class="thank-you">
            شكراً لزيارتكم 🙏
            <br/>
            Thank you for your visit
          </div>
        </body>
      </html>
    `;
    printWindow.document.write(receipt);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 250);
  };

  const handleSaveTables = (newTables) => {
    setTables(newTables);
    saveTables(newTables);
  };

  const handleDismissNotification = (id) => {
    const activeNotifs = getNotifications();
    const updated = activeNotifs.filter((n) => n.id !== id);
    saveNotifications(updated);
    setNotifications(updated.slice(0, 5));
  };

  const toggleSound = () => {
    setSoundEnabled((prev) => !prev);
  };

  const formatElapsedTime = (seconds) => {
    if (!seconds || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getRoleBadgeText = (role) => {
    switch (role) {
      case 'manager':
        return 'المدير العام';
      case 'waiter':
        return 'نادل صالة';
      case 'cashier':
        return 'محاسب كاشير';
      case 'kitchen':
        return 'قسم المطبخ';
      case 'bar':
        return 'قسم البار';
      case 'shisha':
        return 'قسم الشيشة';
      default:
        return '';
    }
  };

  const readyAlerts = Object.entries(deptOrders).flatMap(([orderId, order]) =>
    (order.items || [])
      .filter((item) => item.status === 'ready')
      .map((item) => ({ ...item, orderId, tableName: order.tableName }))
  );

  const handleDeliverItem = (orderId, itemId) => {
    updateDeptOrderItem(orderId, itemId, { status: 'delivered' });
    const updated = getDeptOrders();
    setDeptOrders(updated);
    addNotification('تسليم صنف', `تم تسليم الصنف للطاولة ${getDeptOrders()[orderId]?.tableName || ''}`, 'success');
  };

  const handleReadyItem = (orderId, itemId) => {
    updateDeptOrderItem(orderId, itemId, { status: 'ready' });
    const updated = getDeptOrders();
    setDeptOrders(updated);
    addNotification('الصنف جاهز', `الصنف جاهز للطاولة ${getDeptOrders()[orderId]?.tableName || ''}`, 'info');
  };

  const cashierTables = tables.filter((t) => t.status === 'eating' || t.status === 'bill_requested');
  const selectedCashTable = cashierTables.find((t) => t.id === selectedCashTableId) || cashierTables[0] || null;

  const paymentStatsCount = bills.reduce(
    (acc, bill) => {
      const method = bill.paymentMethod || 'cash';
      acc[method] = (acc[method] || 0) + 1;
      return acc;
    },
    { cash: 0, card: 0, app: 0 }
  );

  const paymentStatsAmount = bills.reduce(
    (acc, bill) => {
      const method = bill.paymentMethod || 'cash';
      acc[method] = (acc[method] || 0) + (bill.total || 0);
      return acc;
    },
    { cash: 0, card: 0, app: 0 }
  );

  const handleProcessPayment = () => {
    if (!selectedCashTable) return;

    const pending = (selectedCashTable.currentOrder || []).some(
      (item) => item.status === 'new' || item.status === 'preparing'
    );
    setPaymentWarning(
      pending
        ? 'تحذير: هناك أصناف لم تكتمل بعد، سيتم إغلاق الطاولة مع تسجيل عملية الدفع.'
        : ''
    );

    const invoice = {
      id: `INV-${Date.now().toString().slice(-6)}`,
      tableId: selectedCashTable.id,
      tableName: selectedCashTable.name,
      items: selectedCashTable.currentOrder || [],
      subtotal: selectedCashTable.subtotal || 0,
      tax: selectedCashTable.tax || 0,
      total: selectedCashTable.total || 0,
      cashierCode: user.code,
      waiterCode: selectedCashTable.waiterCode,
      notes: selectedCashTable.notes,
      paymentMethod: selectedPaymentMethod,
      timestamp: Date.now(),
      timeFormatted: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      dateFormatted: new Date().toLocaleDateString('ar-EG')
    };

    const updatedBills = [invoice, ...bills];
    saveBills(updatedBills);
    setBills(updatedBills);

    const updatedTables = tables.map((t) =>
      t.id === selectedCashTable.id
        ? {
            ...t,
            status: 'empty',
            currentOrder: [],
            notes: '',
            subtotal: 0,
            tax: 0,
            total: 0,
            waiterCode: null
          }
        : t
    );
    saveTables(updatedTables);
    setTables(updatedTables);
    addNotification('دفع الطلب', `تم دفع ${selectedCashTable.name} باستخدام ${paymentLabels[selectedPaymentMethod]}`, 'success');
    setSelectedCashTableId(null);
  };

  const servedTablesTodayCount = new Set(bills.map((bill) => bill.tableId)).size;
  const salesByDept = bills.reduce(
    (acc, bill) => {
      (bill.items || []).forEach((item) => {
        const menu = menuItems.find((menuItem) => menuItem.id === item.id);
        const dept = menu?.department || 'other';
        acc[dept] = (acc[dept] || 0) + (item.price || 0) * (item.qty || 0);
      });
      return acc;
    },
    { kitchen: 0, bar: 0, shisha: 0, other: 0 }
  );

  const itemSales = bills.reduce((acc, bill) => {
    (bill.items || []).forEach((item) => {
      acc[item.id] = (acc[item.id] || 0) + (item.qty || 0);
    });
    return acc;
  }, {});

  const topItems = Object.entries(itemSales)
    .map(([id, qty]) => ({ ...menuItems.find((item) => item.id === id), qty }))
    .filter(Boolean)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  const handleStartPriceEdit = (item) => {
    setEditingPriceId(item.id);
    setPriceDraft(item.price.toFixed(2));
  };

  const handleSavePriceEdit = (itemId) => {
    const nextMenu = menuItems.map((item) =>
      item.id === itemId ? { ...item, price: Number(priceDraft) } : item
    );
    setMenuItems(nextMenu);
    saveMenu(nextMenu);
    setEditingPriceId(null);
    setPriceDraft('');
    const updated = nextMenu.find((item) => item.id === itemId);
    addNotification('تم تعديل السعر', `تم تحديث السعر لصنف ${updated?.name}`, 'info');
  };

  const departmentOrdersForRole = Object.entries(deptOrders)
    .map(([orderId, order]) => ({ orderId, ...order }))
    .filter((order) =>
      (order.items || []).some((item) => item.department === user.role && item.status !== 'delivered')
    );

  const renderWaiterScreen = () => (
    <div className="section-shell">
      <div className="section-top">
        <div>
          <h2 className="section-title">شاشة النادل</h2>
          <p className="section-description">البار الأخضر يظهر عند وجود أصناف جاهزة للتسليم.</p>
        </div>
        <button className="sound-toggle" onClick={toggleSound}>
          {soundEnabled ? <Bell size={18} /> : <BellOff size={18} />}
          {soundEnabled ? 'تشغيل الصوت' : 'إيقاف الصوت'}
        </button>
      </div>

      {readyAlerts.length > 0 && (
        <div className="ready-alert-bar">
          {readyAlerts.map((item) => (
            <div key={`${item.orderId}-${item.id}`} className="ready-alert">
              <div>
                <strong>{item.tableName}</strong> · {item.name} · <span className="num-font">{item.qty}</span>
              </div>
              <button className="btn btn-small btn-primary" onClick={() => handleDeliverItem(item.orderId, item.id)}>
                تسليم ✓
              </button>
            </div>
          ))}
        </div>
      )}

      <WaiterView tables={tables} onSaveTables={handleSaveTables} employee={user} />
    </div>
  );

  const renderDepartmentScreen = () => (
    <div className="section-shell">
      <div className="section-top">
        <div>
          <h2 className="section-title">شاشة قسم {departmentLabels[user.role]}</h2>
          <p className="section-description">أوقف/أشر على الطلبات الجاهزة ليصل تنبيه للنادل.</p>
        </div>
        <button className="sound-toggle" onClick={toggleSound}>
          {soundEnabled ? <Bell size={18} /> : <BellOff size={18} />}
          {soundEnabled ? 'تشغيل الصوت' : 'إيقاف الصوت'}
        </button>
      </div>

      {departmentOrdersForRole.length === 0 ? (
        <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Star size={40} style={{ marginBottom: '12px', opacity: 0.35 }} />
          <p style={{ fontSize: '0.95rem' }}>لا توجد طلبات جديدة لقسم {departmentLabels[user.role]} حالياً.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '18px' }}>
          {departmentOrdersForRole
            .sort((a, b) => {
              const statusOrder = { new: 0, preparing: 1, ready: 2 };
              const aStatus = (a.items || []).find((item) => item.department === user.role)?.status || 'new';
              const bStatus = (b.items || []).find((item) => item.department === user.role)?.status || 'new';
              return (statusOrder[aStatus] ?? 3) - (statusOrder[bStatus] ?? 3);
            })
            .map((order) => {
              const elapsed = elapsedTimes[`order-${order.orderId}`] || 0;
              const hasNew = (order.items || []).some((item) => item.status === 'new' && item.department === user.role);
              return (
                <div
                  key={order.orderId}
                  className="dept-ticket"
                  style={{
                    borderLeft: hasNew ? '4px solid #ff6b6b' : '4px solid transparent',
                    animation: hasNew ? 'pulse 1.5s infinite' : 'none'
                  }}
                >
                  <div className="dept-ticket-header">
                    <div>
                      <div className="ticket-title">{order.tableName}</div>
                      <div className="ticket-meta">النادل: <strong>{order.waiterCode}</strong></div>
                      <div className="ticket-meta">الوقت: <strong className="num-font">{formatElapsedTime(elapsed)}</strong></div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <div className="ticket-status">{departmentLabels[user.role]}</div>
                      {hasNew && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ff6b6b', animation: 'pulse 1.5s infinite' }} />}
                    </div>
                  </div>

                  {(order.items || [])
                    .filter((item) => item.department === user.role)
                    .map((item) => {
                      const urgency = elapsed > 300 ? 'urgent' : elapsed > 180 ? 'warning' : 'normal';
                      return (
                        <div
                          key={item.id}
                          className="ticket-item"
                          style={{
                            background: urgency === 'urgent' ? 'rgba(255, 107, 107, 0.1)' : urgency === 'warning' ? 'rgba(255, 193, 7, 0.1)' : 'transparent'
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 700 }}>{item.name}</div>
                            <div className="ticket-meta">الكمية: <span className="num-font">{item.qty}</span></div>
                            {item.notes && <div className="ticket-meta" style={{ color: '#ffc107', fontSize: '0.85rem' }}>📝 {item.notes}</div>}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span className={`ticket-tag ${item.status}`}>{item.status === 'ready' ? '✓ جاهز' : item.status === 'new' ? '🆕 جديد' : '⏳ قيد التجهيز'}</span>
                            {(item.status === 'new' || item.status === 'preparing') && (
                              <button className="btn btn-primary btn-small" onClick={() => handleReadyItem(order.orderId, item.id)}>
                                جاهز
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
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .ticket-tag.new { background: #ff6b6b; color: white; }
        .ticket-tag.preparing { background: #ffc107; color: #333; }
        .ticket-tag.ready { background: #51cf66; color: white; }
      `}</style>
    </div>
  );

  const renderCashierScreen = () => (
    <div className="section-shell">
      <div className="section-top">
        <div>
          <h2 className="section-title">شاشة المحاسب</h2>
          <p className="section-description">اختر طريقة الدفع وحفظ الفاتورة مع تسجيل وسيلة الدفع.</p>
        </div>
        <button className="sound-toggle" onClick={toggleSound}>
          {soundEnabled ? <Bell size={18} /> : <BellOff size={18} />}
          {soundEnabled ? 'تشغيل الصوت' : 'إيقاف الصوت'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '24px' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', fontWeight: '700' }}>الطاولات النشطة</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {cashierTables.length === 0 ? (
              <div className="glass-card" style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Star size={32} style={{ marginBottom: '12px', opacity: 0.45 }} />
                <p style={{ fontSize: '0.9rem' }}>لا توجد طاولات بحاجة للدفع حالياً.</p>
              </div>
            ) : (
              cashierTables.map((table) => (
                <div
                  key={table.id}
                  className="glass-card"
                  style={{
                    padding: '18px 20px',
                    cursor: 'pointer',
                    border: selectedCashTable?.id === table.id ? '2px solid var(--color-primary)' : '1px solid var(--border-light)'
                  }}
                  onClick={() => setSelectedCashTableId(table.id)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{table.name}</div>
                      <div className="ticket-meta">النادل: <span className="num-font">{table.waiterCode}</span></div>
                    </div>
                    <div className="num-font" style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                      {table.total.toFixed(2)} د.أ
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div>
          {selectedCashTable ? (
            <div className="glass-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{selectedCashTable.name}</div>
                  <div className="ticket-meta">النادل: <strong className="num-font">{selectedCashTable.waiterCode}</strong></div>
                  <div className="ticket-meta">الوقت المستغرق: <strong className="num-font">{formatElapsedTime(elapsedTimes[`order-${selectedCashTable.id}`] || 0)}</strong></div>
                </div>
                <span className="ticket-tag" style={{ fontSize: '0.9rem' }}>{selectedCashTable.status === 'bill_requested' ? '🧾 طلب حساب' : '💳 قيد الدفع'}</span>
              </div>

              <div style={{ display: 'grid', gap: '12px', maxHeight: '300px', overflowY: 'auto' }}>
                {(selectedCashTable.currentOrder || []).map((item) => {
                  const isReady = item.status === 'ready' || item.status === 'delivered';
                  const isPending = item.status === 'new' || item.status === 'preparing';
                  return (
                    <div
                      key={item.id}
                      className="ticket-item"
                      style={{
                        background: isPending ? 'rgba(255, 193, 7, 0.1)' : isReady ? 'rgba(81, 207, 102, 0.1)' : 'transparent'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700 }}>{item.name}</div>
                        <div className="ticket-meta">{item.qty} × {item.price.toFixed(2)} = <strong className="num-font">{(item.qty * item.price).toFixed(2)}</strong></div>
                        {item.notes && <div className="ticket-meta" style={{ color: '#ffc107', fontSize: '0.85rem' }}>📝 {item.notes}</div>}
                      </div>
                      <div className="ticket-tag" style={{ minWidth: '80px' }}>
                        {item.status === 'ready' ? '✓ جاهز' : item.status === 'delivered' ? '📦 مسلم' : item.status === 'new' ? '🆕 جديد' : '⏳ تجهيز'}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: '22px', display: 'grid', gap: '10px' }}>
                <div className="ticket-meta">المجموع الفرعي: <strong className="num-font">{selectedCashTable.subtotal.toFixed(2)} د.أ</strong></div>
                <div className="ticket-meta">الضريبة: <strong className="num-font">{selectedCashTable.tax.toFixed(2)} د.أ</strong></div>
                <div className="ticket-meta" style={{ fontSize: '1.05rem', fontWeight: 700 }}>المجموع النهائي: <span className="num-font">{selectedCashTable.total.toFixed(2)} د.أ</span></div>
              </div>

              <div className="payment-methods">
                {['cash', 'card', 'app'].map((method) => (
                  <button
                    key={method}
                    type="button"
                    className={`payment-method ${selectedPaymentMethod === method ? 'active' : ''}`}
                    onClick={() => setSelectedPaymentMethod(method)}
                  >
                    {paymentLabels[method]}
                  </button>
                ))}
              </div>

              {paymentWarning && <div className="payment-warning">{paymentWarning}</div>}

              <button className="btn btn-primary" onClick={handleProcessPayment} style={{ marginTop: '18px', width: '100%' }}>
                <CreditCard size={18} /> دفع وإغلاق
              </button>
            </div>
          ) : (
            <div className="glass-card" style={{ padding: '46px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '10px' }}>اختر طاولة من الجهة اليسرى</div>
              <p style={{ fontSize: '0.9rem' }}>لعرض تفاصيل الطلب وإتمام الدفع</p>
            </div>
          )}

          <div className="glass-card" style={{ padding: '20px', marginTop: '18px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '14px' }}>ملخص طرق الدفع اليوم</h3>
            <div style={{ display: 'grid', gap: '12px' }}>
              {['cash', 'card', 'app'].map((method) => (
                <div key={method} className="ticket-item" style={{ justifyContent: 'space-between' }}>
                  <span>{paymentLabels[method]}</span>
                  <span className="num-font">{paymentStatsCount[method]} دفعات | {paymentStatsAmount[method].toFixed(2)} د.أ</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderManagerScreen = () => {
    const overviewContent = (
      <>
        <div className="stats-grid">
          <div className="stat-card">
            <div style={{ fontSize: '0.9rem', color: 'var(--muted)', marginBottom: '10px' }}>🏪 الطاولات النشطة الآن</div>
            <div className="num-font" style={{ fontSize: '2.5rem', fontWeight: 800, color: '#51cf66' }}>
              {tables.filter((t) => t.status === 'eating' || t.status === 'bill_requested').length}
            </div>
            <div className="ticket-meta" style={{ marginTop: '8px' }}>من أصل {tables.length} طاولة</div>
          </div>

          <div className="stat-card">
            <div style={{ fontSize: '0.9rem', color: 'var(--muted)', marginBottom: '10px' }}>📊 الطلبات الجاهزة</div>
            <div className="num-font" style={{ fontSize: '2.5rem', fontWeight: 800, color: '#ffc107' }}>
              {readyAlerts.length}
            </div>
            <div className="ticket-meta" style={{ marginTop: '8px' }}>بانتظار التسليم</div>
          </div>

          <div className="stat-card">
            <div style={{ fontSize: '0.9rem', color: 'var(--muted)', marginBottom: '10px' }}>🧾 الفواتير اليوم</div>
            <div className="num-font" style={{ fontSize: '2.5rem', fontWeight: 800, color: '#51cf66' }}>{bills.length}</div>
            <div className="ticket-meta" style={{ marginTop: '8px', fontSize: '0.85rem', color: '#ffc107' }}>
              <strong className="num-font">{bills.reduce((sum, b) => sum + (b.total || 0), 0).toFixed(2)} د.أ</strong>
            </div>
          </div>

          <div className="stat-card">
            <div style={{ fontSize: '0.9rem', color: 'var(--muted)', marginBottom: '10px' }}>👥 الطاولات المخدومة</div>
            <div className="num-font" style={{ fontSize: '2.5rem', fontWeight: 800, color: '#ff6b6b' }}>{servedTablesTodayCount}</div>
            <div className="ticket-meta" style={{ marginTop: '8px' }}>طاولة فريدة</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '24px' }}>
          <div className="stat-card">
            <div style={{ fontSize: '0.9rem', color: 'var(--muted)', marginBottom: '14px' }}>🔝 أعلى 5 أصناف مبيعاً</div>
            <div className="bar-chart">
              {topItems.length === 0 ? (
                <div className="ticket-meta">لا توجد بيانات مبيعات بعد.</div>
              ) : (
                topItems.map((item) => {
                  const ratio = Math.min(100, (item.qty / (topItems[0]?.qty || 1)) * 100);
                  return (
                    <div key={item.id} className="bar-row">
                      <span className="bar-label">{item.name}</span>
                      <div className="bar-progress"><span style={{ width: `${ratio}%` }} /></div>
                      <span className="bar-value num-font">{item.qty}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="stat-card">
            <div style={{ fontSize: '0.9rem', color: 'var(--muted)', marginBottom: '14px' }}>📈 المبيعات حسب القسم</div>
            <div className="bar-chart">
              {Object.entries(salesByDept).map(([dept, amount]) => (
                <div key={dept} className="bar-row">
                  <span className="bar-label">{departmentLabels[dept] || 'أخرى'}</span>
                  <div className="bar-progress"><span style={{ width: `${Math.min(100, (amount / (Math.max(...Object.values(salesByDept)) || 1)) * 100)}%`, background: dept === 'kitchen' ? '#ff9800' : dept === 'bar' ? '#2196f3' : '#00c853' }} /></div>
                  <span className="bar-value num-font">{amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </>
    );

    const menuContent = (
      <div className="glass-card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '18px', fontWeight: 700 }}>تعديل أسعار المنيو</h3>
        {(menuItems || []).map((item) => (
          <div key={item.id} className="ticket-item" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
              <div>
                <div style={{ fontWeight: 700 }}>{item.name}</div>
                <div className="ticket-meta">القسم: {departmentLabels[item.department] || 'عام'}</div>
              </div>

              {editingPriceId === item.id ? (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="number"
                    className="form-input"
                    value={priceDraft}
                    onChange={(e) => setPriceDraft(e.target.value)}
                    style={{ width: '100px', padding: '10px' }}
                  />
                  <button className="btn btn-primary" onClick={() => handleSavePriceEdit(item.id)}>
                    حفظ
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div className="num-font" style={{ fontWeight: 700 }}>{item.price.toFixed(2)} د.أ</div>
                  <button className="btn btn-secondary btn-small" onClick={() => handleStartPriceEdit(item)}>
                    <Edit3 size={14} /> تعديل
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );

    const reportsContent = (
      <div style={{ display: 'grid', gap: '20px' }}>
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '18px', fontWeight: 700 }}>📊 ملخص الأداء اليومي</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="ticket-meta">
              إجمالي المبيعات: <strong className="num-font" style={{ fontSize: '1.1rem', color: '#51cf66' }}>
                {bills.reduce((sum, b) => sum + (b.total || 0), 0).toFixed(2)} د.أ
              </strong>
            </div>
            <div className="ticket-meta">
              متوسط الفاتورة: <strong className="num-font" style={{ fontSize: '1.1rem', color: '#2196f3' }}>
                {bills.length > 0 ? (bills.reduce((sum, b) => sum + (b.total || 0), 0) / bills.length).toFixed(2) : '0.00'} د.أ
              </strong>
            </div>
            <div className="ticket-meta">
              أصناف مباعة: <strong className="num-font" style={{ fontSize: '1.1rem', color: '#ff9800' }}>
                {Object.values(itemSales).reduce((sum, qty) => sum + qty, 0)}
              </strong>
            </div>
            <div className="ticket-meta">
              عدد العملاء: <strong className="num-font" style={{ fontSize: '1.1rem', color: '#9c27b0' }}>
                {bills.length}
              </strong>
            </div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '14px', fontWeight: 700 }}>💳 توزيع طرق الدفع</h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            {['cash', 'card', 'app'].map((method) => (
              <div key={method} className="ticket-item" style={{ justifyContent: 'space-between' }}>
                <span>{paymentLabels[method]}</span>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <span className="num-font">{paymentStatsCount[method]} عملية</span>
                  <span className="num-font" style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                    {paymentStatsAmount[method].toFixed(2)} د.أ
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '14px', fontWeight: 700 }}>⏱️ معلومات الطلبات</h3>
          <div style={{ display: 'grid', gap: '10px' }}>
            <div className="ticket-meta">
              إجمالي الطلبات النشطة: <strong className="num-font">{Object.keys(deptOrders).length}</strong>
            </div>
            <div className="ticket-meta">
              الطلبات الجاهزة: <strong className="num-font" style={{ color: '#51cf66' }}>{readyAlerts.length}</strong>
            </div>
            <div className="ticket-meta">
              أطول وقت طلب: <strong className="num-font">
                {Math.max(...Object.entries(deptOrders).map(([id]) => elapsedTimes[`order-${id}`] || 0), 0) > 0
                  ? formatElapsedTime(Math.max(...Object.entries(deptOrders).map(([id]) => elapsedTimes[`order-${id}`] || 0)))
                  : '0:00'}
              </strong>
            </div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '14px', fontWeight: 700 }}>🔝 الأصناف الأكثر طلباً</h3>
          <div style={{ display: 'grid', gap: '10px' }}>
            {topItems.length === 0 ? (
              <div className="ticket-meta">لا توجد بيانات مبيعات بعد.</div>
            ) : (
              topItems.slice(0, 5).map((item, idx) => (
                <div key={item.id} className="ticket-item">
                  <span>{idx + 1}. {item.name}</span>
                  <span className="num-font">{item.qty} طلب</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );

    return (
      <div className="section-shell">
        <div className="section-top">
          <div>
            <h2 className="section-title">لوحة المدير</h2>
            <p className="section-description">إحصائيات المبيعات، تعداد الطاولات، وتعديل أسعار الأصناف.</p>
          </div>
          <button className="sound-toggle" onClick={toggleSound}>
            {soundEnabled ? <Bell size={18} /> : <BellOff size={18} />}
            {soundEnabled ? 'تشغيل الصوت' : 'إيقاف الصوت'}
          </button>
        </div>

        {activeManagerTab === 'overview' && overviewContent}
        {activeManagerTab === 'menu' && menuContent}
        {activeManagerTab === 'reports' && reportsContent}

        {activeManagerTab === 'bills' && (
          <div style={{ display: 'grid', gap: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '12px' }}>📋 الفواتير المسجلة اليوم</h3>
            {bills.length === 0 ? (
              <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Star size={40} style={{ marginBottom: '12px', opacity: 0.35 }} />
                <p style={{ fontSize: '0.95rem' }}>لا توجد فواتير مسجلة بعد.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                {[...bills].reverse().map((bill) => (
                  <div key={bill.id} className="glass-card" style={{ padding: '16px', cursor: 'pointer' }} onClick={() => printBill(bill)}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 700 }}>{bill.tableName}</div>
                        <div className="ticket-meta" style={{ fontSize: '0.85rem' }}>#{bill.id}</div>
                      </div>
                      <div>
                        <div className="ticket-meta">الوقت</div>
                        <div className="num-font" style={{ fontSize: '0.9rem', fontWeight: 700 }}>{bill.timeFormatted}</div>
                      </div>
                      <div>
                        <div className="ticket-meta">العدد</div>
                        <div className="num-font" style={{ fontSize: '0.9rem', fontWeight: 700 }}>{bill.items?.length || 0}</div>
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <div className="ticket-tag" style={{ background: '#51cf66', fontSize: '1rem', fontWeight: 700 }}>
                          <span className="num-font">{bill.total.toFixed(2)} د.أ</span>
                        </div>
                        <div className="ticket-meta" style={{ fontSize: '0.8rem', marginTop: '4px' }}>{paymentLabels[bill.paymentMethod]}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="bottom-navigation">
          {['overview', 'menu', 'reports', 'bills'].map((tab) => (
            <button
              key={tab}
              type="button"
              className={activeManagerTab === tab ? 'active' : ''}
              onClick={() => setActiveManagerTab(tab)}
            >
              <span>
                {tab === 'overview' ? '📊 الرئيسية' : tab === 'menu' ? '🍽️ المنيو' : tab === 'reports' ? '📈 التقارير' : '🧾 الفواتير'}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  if (!user) {
    return (
      <div className="app-shell">
        <main className="app-main">
          <Login onLoginSuccess={handleLoginSuccess} />
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="header-bar">
        <div className="brand">
          <span className="brand-logo">
            <Coffee style={{ marginLeft: '10px', color: 'var(--color-primary)' }} />
            تكة
          </span>
          <span className="brand-tag">لوحة {getRoleBadgeText(user.role)}</span>
        </div>

        <div className="user-profile">
          <div className="user-info">
            <div className="user-name">{user.name}</div>
            <div className="user-role num-font">
              {user.role === 'manager' ? 'ADMIN' : `كود: ${user.code}`}
            </div>
          </div>

          <button className="btn btn-secondary" onClick={handleLogout} style={{ padding: '8px 12px', fontSize: '0.85rem' }}>
            <LogOut size={16} /> تسجيل الخروج
          </button>
        </div>
      </header>

      <main className="app-main">
        {user.role === 'waiter' && renderWaiterScreen()}
        {['kitchen', 'bar', 'shisha'].includes(user.role) && renderDepartmentScreen()}
        {user.role === 'cashier' && renderCashierScreen()}
        {user.role === 'manager' && renderManagerScreen()}
      </main>

      {notifications.length > 0 && (
        <NotificationsToast notifications={notifications} onClose={handleDismissNotification} />
      )}
    </div>
  );
}
