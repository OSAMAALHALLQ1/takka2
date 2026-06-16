import { useState, useEffect, useCallback } from 'react';
import {
  saveDeptOrders, getDeptOrders, addNotification, updateDeptOrderItem,
  updateOngoingItemQty, cancelOngoingItem,
  TAX_RATE, SERVICE_RATE
} from '../utils/storage';

const DEPT_TABS = [
  { id: 'all', label: 'الكل', icon: '📍' },
  { id: 'kitchen', label: 'مطبخ', icon: '🍳' },
  { id: 'bar', label: 'بار', icon: '🍺' },
  { id: 'shisha', label: 'شيشة', icon: '💨' }
];

const STATUS_COLORS = { empty: '#15803d', eating: '#dc2626', bill_requested: '#ca8a04', unavailable: '#8a92a2' };
const STATUS_LABELS_AR = { empty: 'فاضية', eating: 'مشغولة', bill_requested: 'تنتظر دفع', unavailable: 'غير متوفرة' };
const STATUS_BADGE = { empty: 'badge-empty', eating: 'badge-eating', bill_requested: 'badge-bill-requested', unavailable: 'badge-unavailable' };

const renderItemImage = (image, name, isCard = false) => {
  const isUrl = image && (image.startsWith('http') || image.startsWith('data:image/'));
  
  if (isUrl) {
    return (
      <img 
        src={image} 
        alt={name} 
        style={isCard ? { 
          width: '100%', 
          height: '90px', 
          objectFit: 'cover', 
          borderRadius: '6px', 
          marginBottom: '6px', 
          display: 'block' 
        } : { 
          width: '40px', 
          height: '40px', 
          objectFit: 'cover', 
          borderRadius: '6px', 
          display: 'block',
          flexShrink: 0
        }} 
      />
    );
  }

  if (image && image.length <= 4) {
    return (
      <div 
        style={isCard ? {
          width: '100%',
          height: '90px',
          borderRadius: '6px',
          marginBottom: '6px',
          background: 'linear-gradient(135deg, rgba(212,175,55,0.1) 0%, rgba(212,175,55,0.02) 100%)',
          border: '1px dashed rgba(212, 175, 55, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2rem'
        } : {
          width: '40px',
          height: '40px',
          borderRadius: '6px',
          background: 'linear-gradient(135deg, rgba(212,175,55,0.1) 0%, rgba(212,175,55,0.02) 100%)',
          border: '1px dashed rgba(212, 175, 55, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.4rem',
          flexShrink: 0
        }}
      >
        {image}
      </div>
    );
  }

  return (
    <div 
      style={isCard ? {
        width: '100%',
        height: '90px',
        borderRadius: '6px',
        marginBottom: '6px',
        background: 'linear-gradient(135deg, rgba(212,175,55,0.1) 0%, rgba(212,175,55,0.02) 100%)',
        border: '1px dashed rgba(212, 175, 55, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--color-primary)'
      } : {
        width: '40px',
        height: '40px',
        borderRadius: '6px',
        background: 'linear-gradient(135deg, rgba(212,175,55,0.1) 0%, rgba(212,175,55,0.02) 100%)',
        border: '1px dashed rgba(212, 175, 55, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--color-primary)',
        flexShrink: 0
      }}
    >
      <svg width={isCard ? 24 : 16} height={isCard ? 24 : 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v20" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    </div>
  );
};

export default function WaiterView({ tables, onSaveTables, employee, menuItems = [] }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const [view, setView] = useState('tables'); // 'tables' | 'new-order' | 'manage'
  const [selectedTable, setSelectedTable] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [guestsCount, setGuestsCount] = useState(2);
  const [tableNotes, setTableNotes] = useState('');
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [billConfirmOpen, setBillConfirmOpen] = useState(false);
  const [deptOrders, setDeptOrders] = useState(getDeptOrders());

  useEffect(() => {
    const sync = () => setDeptOrders(getDeptOrders());
    window.addEventListener('taka_sync', sync);
    window.addEventListener('takah_sync', sync);
    return () => { window.removeEventListener('taka_sync', sync); window.removeEventListener('takah_sync', sync); };
  }, []);

  // Refresh every 10s for real-time feel
  useEffect(() => {
    const t = setInterval(() => setDeptOrders(getDeptOrders()), 10000);
    return () => clearInterval(t);
  }, []);

  const filteredMenu = menuItems.filter(item => {
    if (!item.available) return false;
    const matchDept = activeCategory === 'all' || item.department === activeCategory;
    const matchSearch = !search || item.name?.includes(search) || item.nameAr?.includes(search);
    return matchDept && matchSearch;
  });

  const addToCart = (item) => {
    addNotification('⚠️ عدم الإضافة', 'الجرسون غير مسموح له بإضافة أصناف مباشرة', 'warning', [employee.role]);
  };

  const removeFromCart = (itemId) => {
    setCart(prev => {
      const ex = prev.find(i => i.id === itemId);
      if (ex?.qty === 1) return prev.filter(i => i.id !== itemId);
      return prev.map(i => i.id === itemId ? { ...i, qty: i.qty - 1 } : i);
    });
  };

  const increaseCart = (itemId) => setCart(prev => prev.map(i => i.id === itemId ? { ...i, qty: i.qty + 1 } : i));
  const updateNote = (itemId, note) => setCart(prev => prev.map(i => i.id === itemId ? { ...i, note } : i));

  const calcTotals = useCallback(() => {
    const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
    const tax = subtotal * TAX_RATE;
    const serviceCharge = subtotal * SERVICE_RATE;
    const total = subtotal + tax + serviceCharge;
    return { subtotal, tax, serviceCharge, total };
  }, [cart]);

  const openTable = (table) => {
    setSelectedTable(table);
    setCart(table.currentOrder?.map(i => ({ ...i })) || []);
    setTableNotes(table.notes || '');
    setGuestsCount(table.guests || 2);
    if (table.status === 'empty') {
      setView('new-order');
    } else {
      setView('manage');
    }
  };

  const handleSendOrder = () => {
    if (cart.length === 0) return;
    const { subtotal, tax, serviceCharge, total } = calcTotals();
    const orderId = `order-${Date.now()}`;
    const itemsWithStatus = cart.map(item => ({ ...item, orderId, status: 'new', orderedAt: Date.now() }));

    const newOrder = {
      id: orderId, tableId: selectedTable.id, tableName: selectedTable.name,
      waiterCode: employee.code, waiterName: employee.name,
      timestamp: Date.now(), items: itemsWithStatus,
      subtotal, tax, serviceCharge, total, status: 'new'
    };

    const existing = getDeptOrders();
    existing[orderId] = newOrder;
    saveDeptOrders(existing);
    setDeptOrders(getDeptOrders());

    const updatedTables = tables.map(t => {
      if (t.id !== selectedTable.id) return t;
      const existingItems = t.currentOrder || [];
      const combined = [...existingItems, ...itemsWithStatus];
      const newSubtotal = combined.reduce((s, i) => s + i.price * i.qty, 0);
      const newTax = newSubtotal * TAX_RATE;
      const newServiceCharge = newSubtotal * SERVICE_RATE;
      return { ...t, status: 'eating', currentOrder: combined, notes: tableNotes, subtotal: newSubtotal, tax: newTax, serviceCharge: newServiceCharge, total: newSubtotal + newTax + newServiceCharge, waiterCode: employee.code, guests: guestsCount, seatedAt: t.seatedAt || Date.now() };
    });
    onSaveTables(updatedTables);

    const deptsInvolved = [...new Set(itemsWithStatus.map(i => i.department))];
    
    deptsInvolved.forEach(dept => {
      const deptItems = itemsWithStatus.filter(i => i.department === dept);
      const itemsStr = deptItems.map(i => `${i.name} × ${i.qty}`).join('، ');
      addNotification(
        `📩 طلب جديد من الطاولة #${selectedTable.id}`,
        `${itemsStr}`,
        'success',
        [dept, employee.code, 'manager']
      );
    });
    
    setOrderSuccess(true);
    setTimeout(() => { setOrderSuccess(false); setView('tables'); setCart([]); }, 2000);
  };

  const handleRequestBill = () => {
    const updatedTables = tables.map(t => t.id === selectedTable.id ? { ...t, status: 'bill_requested' } : t);
    onSaveTables(updatedTables);
    
    // Check if all items are already ready/delivered
    const tableOrders = Object.values(deptOrders).filter(o => o.tableId === selectedTable.id);
    const allItems = tableOrders.flatMap(o => o.items || []);
    const allReady = allItems.length > 0 && allItems.every(i => ['ready', 'delivered'].includes(i.status));
    
    if (allReady) {
      addNotification(
        `✅ فاتورة الطاولة #${selectedTable.id} مكتملة - انتظار الدفع`,
        `جميع الطلبات جاهزة، في انتظار تحصيل المبلغ: ${(selectedTable.total || 0).toFixed(2)} ₪`,
        'success',
        ['cashier', 'manager']
      );
    } else {
      addNotification(
        `💳 فاتورة جديدة من الطاولة #${selectedTable.id}`,
        `${selectedTable.name} تطلب الحساب`,
        'warning',
        ['cashier', 'manager']
      );
    }
    
    setBillConfirmOpen(false);
    setView('tables');
  };

  const handleDeliverItem = (orderId, itemId) => {
    const order = deptOrders[orderId];
    const item = (order?.items || []).find(i => i.id === itemId);
    const dept = item?.department || 'kitchen';
    const itemName = item?.name || 'صنف';
    
    updateDeptOrderItem(orderId, itemId, { status: 'delivered' });
    setDeptOrders(getDeptOrders());
    
    addNotification(
      `✓ تم تسليم طلب الطاولة #${order?.tableId || selectedTable?.id} إلى الجرسون`,
      `صنف ${itemName} تم تسليمه`,
      'success',
      [dept, 'manager']
    );
  };

  // Ready items for this waiter
  const readyItems = Object.entries(deptOrders).flatMap(([orderId, order]) =>
    (order.items || []).filter(item => item.status === 'ready').map(item => ({ ...item, orderId, tableName: order.tableName }))
  );

  const getOrderIdForItem = (itemId) => {
    const orders = getDeptOrders();
    for (const [orderId, order] of Object.entries(orders)) {
      if (order.tableId === selectedTable?.id) {
        const match = (order.items || []).find(i => i.id === itemId && i.status === 'ready');
        if (match) return orderId;
      }
    }
    return null;
  };

  const tableCurrentOrder = selectedTable ? (tables.find(t => t.id === selectedTable.id)?.currentOrder || []) : [];
  const tableData = selectedTable ? tables.find(t => t.id === selectedTable.id) : null;

  const elapsedMin = tableData?.seatedAt ? Math.floor((now - tableData.seatedAt) / 60000) : 0;

  // ── VIEWS ──────────────────────────────────
  if (view === 'new-order' && selectedTable) {
    const { subtotal, tax, serviceCharge, total } = calcTotals();
    return (
      <div className="view-container">
        {orderSuccess && (
          <div className="order-success-banner">✅ تم إرسال الطلب للأقسام بنجاح!</div>
        )}

        <div className="order-header">
          <div>
            <button className="back-btn" onClick={() => { setView('tables'); setCart([]); }}>← رجوع</button>
            <span className="order-table-num">الطاولة #{selectedTable.id}</span>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>عدد الأشخاص:</label>
            <select className="form-input" value={guestsCount} onChange={e => setGuestsCount(parseInt(e.target.value))} style={{ width: '80px' }}>
              {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>

        <div className="order-layout">
          {/* Left: Menu */}
          <div className="menu-col">
            {/* Dept Tabs */}
            <div className="dept-tabs">
              {DEPT_TABS.map(tab => (
                <button key={tab.id} className={`dept-tab ${activeCategory === tab.id ? 'active' : ''}`} onClick={() => setActiveCategory(tab.id)}>
                  <span>{tab.icon}</span> {tab.label}
                </button>
              ))}
            </div>
            {/* Search */}
            <div style={{ position: 'relative', marginBottom: '12px' }}>
              <input className="form-input" placeholder="🔍 بحث..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            {/* Items */}
            <div className="menu-items-grid">
              {filteredMenu.map(item => {
                const inCart = cart.find(c => c.id === item.id);
                return (
                  <div key={item.id} className={`menu-item-card ${inCart ? 'in-cart' : ''}`} onClick={() => addToCart(item)}>
                    {renderItemImage(item.image, item.nameAr || item.name, true)}
                    <div style={{ fontWeight: 600, fontSize: '0.88rem', lineHeight: 1.3 }}>{item.name || item.nameAr}</div>
                    {item.description && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>{item.description}</div>}
                    <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, color: 'var(--color-primary)', marginTop: '8px' }}>{item.price} ₪</div>
                    {inCart && <div className="cart-badge">+{inCart.qty}</div>}
                  </div>
                );
              })}
              {filteredMenu.length === 0 && <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>لا توجد أصناف</div>}
            </div>
          </div>

          {/* Right: Cart */}
          <div className="cart-col">
            <div className="cart-header-bar">
              <span>🛒 الطلب الحالي</span>
              <span className="cart-count">{cart.reduce((s, i) => s + i.qty, 0)} صنف</span>
            </div>

            <div className="cart-items-scroll">
              {cart.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🛒</div>
                  <p>اختر أصنافاً من القائمة</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="cart-item-row">
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{item.name}</div>
                      <div style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--color-primary)', fontSize: '0.82rem' }}>{(item.price * item.qty).toFixed(2)} ₪</div>
                      <input
                        type="text"
                        className="note-input"
                        placeholder="ملاحظة (مثل: بدون بصل)"
                        value={item.note || ''}
                        onChange={e => updateNote(item.id, e.target.value)}
                      />
                    </div>
                    <div className="qty-controls">
                      <button className="qty-btn" onClick={() => removeFromCart(item.id)}>−</button>
                      <span className="qty-num">{item.qty}</span>
                      <button className="qty-btn" onClick={() => increaseCart(item.id)}>+</button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="cart-totals-section">
                <div className="total-row"><span>المجموع الفرعي</span><span>{subtotal.toFixed(2)} ₪</span></div>
                <div className="total-row"><span>ضريبة (15%)</span><span>{tax.toFixed(2)} ₪</span></div>
                <div className="total-row"><span>خدمة (10%)</span><span>{serviceCharge.toFixed(2)} ₪</span></div>
                <div className="total-row grand"><span>الإجمالي</span><span>{total.toFixed(2)} ₪</span></div>
              </div>
            )}

            <div style={{ padding: '12px', borderTop: '1px solid var(--border-light)' }}>
              <input
                className="form-input"
                placeholder="ملاحظة للطاولة..."
                value={tableNotes}
                onChange={e => setTableNotes(e.target.value)}
                style={{ marginBottom: '12px' }}
              />
              <button
                className="send-order-btn"
                onClick={handleSendOrder}
                disabled={cart.length === 0}
              >
                ✅ أرسل الطلب للأقسام
              </button>
              <button className="back-btn" style={{ width: '100%', marginTop: '8px', textAlign: 'center' }} onClick={() => { setView('tables'); setCart([]); }}>
                ← عودة للطاولات
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'manage' && selectedTable && tableData) {
    const ongoingItems = tableCurrentOrder.filter(item => ['new', 'preparing'].includes(item.status));
    const readyItemsList = tableCurrentOrder.filter(item => item.status === 'ready');
    const deliveredItemsList = tableCurrentOrder.filter(item => item.status === 'delivered');

    return (
      <div className="view-container">
        <div className="order-header">
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <button className="back-btn" onClick={() => setView('tables')}>← رجوع</button>
            <div>
              <span className="order-table-num">الطاولة #{selectedTable.id}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginRight: '12px' }}>
                | {tableData.guests || 0} أشخاص | {elapsedMin} دقيقة
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn-add-more" onClick={() => { setCart([]); setView('new-order'); }}>+ إضافة طلب</button>
            {tableData.status !== 'bill_requested' && (
              <button className="btn-request-bill" onClick={() => setBillConfirmOpen(true)}>🧾 طلب الحساب</button>
            )}
          </div>
        </div>

        {/* Ready items alert */}
        {readyItems.filter(ri => {
          const order = Object.values(deptOrders).find(o => o.tableId === selectedTable.id);
          return order && ri.tableName === selectedTable.name;
        }).length > 0 && (
          <div className="ready-alert-banner">
            🔔 طلبات جاهزة للتسليم!
            {readyItems.filter(ri => ri.tableName === selectedTable.name).map((ri, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                <span>{ri.name} × {ri.qty}</span>
                <button className="deliver-btn" onClick={() => handleDeliverItem(ri.orderId, ri.id)}>تسليم ✓</button>
              </div>
            ))}
          </div>
        )}

        {/* Current order items */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className="admin-card">
            <h3 className="card-title">📋 حالة الطلبات</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '12px' }}>
              {tableCurrentOrder.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>لا توجد طلبات لهذه الطاولة</p>
              ) : (
                <>
                  {/* 📌 الطلبات الجارية */}
                  <div>
                    <h4 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: '8px', color: '#f39c12', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      📌 الطلبات الجارية ({ongoingItems.length})
                    </h4>
                    {ongoingItems.length === 0 ? (
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', padding: '6px 12px' }}>لا توجد طلبات قيد التحضير</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {ongoingItems.map((item, i) => {
                          const orderedTime = item.orderedAt || tableData.seatedAt || now;
                          const elapsedSec = Math.floor((now - orderedTime) / 1000);
                          const elapsedMinPart = Math.floor(elapsedSec / 60);
                          const elapsedSecPart = elapsedSec % 60;
                          
                          const expectedPrep = item.prepTime || 15;
                          const expectedPrepSec = expectedPrep * 60;
                          
                          const remainingSec = Math.max(0, expectedPrepSec - elapsedSec);
                          const remainingMinPart = Math.floor(remainingSec / 60);
                          const remainingSecPart = remainingSec % 60;
                          
                          const percent = Math.min(100, Math.floor((elapsedSec / expectedPrepSec) * 100));
                          const statusText = item.status === 'preparing' ? 'يتحضر' : 'جديد';
                          const statusColor = item.status === 'preparing' ? '#ca8a04' : '#dc2626';
                          const statusBg = item.status === 'preparing' ? '#fffbeb' : '#fef2f2';

                          return (
                            <div key={i} style={{ padding: '12px', background: statusBg, borderRadius: '8px', borderRight: `3px solid ${statusColor}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1a1a1a' }}>{item.name} × {item.qty}</span>
                                {item.note && <div style={{ fontSize: '0.75rem', color: '#ca8a04', marginTop: '2px' }}>📝 {item.note}</div>}
                                <div style={{ display: 'flex', gap: '4px', alignItems: 'center', marginTop: '4px' }}>
                                  <button className="qty-btn" onClick={() => updateOngoingItemQty(selectedTable.id, item.orderId, item.id, Math.max(1, item.qty - 1))} disabled={item.qty <= 1}>−</button>
                                  <span>{item.qty}</span>
                                  <button className="qty-btn" onClick={() => updateOngoingItemQty(selectedTable.id, item.orderId, item.id, item.qty + 1)}>+</button>
                                  <button className="qty-btn" onClick={() => cancelOngoingItem(selectedTable.id, item.orderId, item.id)} title="إلغاء الصنف">🗑️</button>
                                </div>
                              </div>
                              <span style={{ fontSize: '0.78rem', color: statusColor, fontWeight: 700 }}>{statusText}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* ✅ الطلبات الجاهزة */}
                  <div>
                    <h4 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: '8px', color: '#15803d', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      ✅ الطلبات الجاهزة للتسليم ({readyItemsList.length})
                    </h4>
                    {readyItemsList.length === 0 ? (
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', padding: '6px 12px' }}>لا توجد طلبات جاهزة</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {readyItemsList.map((item, i) => {
                          const readyDuration = item.readyAt ? Math.floor((now - item.readyAt) / 60000) : 0;
                          const ordId = getOrderIdForItem(item.id);
                          return (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#f0fdf4', borderRight: '3px solid #15803d', borderRadius: '8px' }}>
                              <div>
                                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1a1a1a' }}>{item.name} × {item.qty}</div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                  ⏱ جاهز منذ: {readyDuration} دقائق
                                </div>
                              </div>
                              <button
                                className="deliver-btn"
                                onClick={() => ordId && handleDeliverItem(ordId, item.id)}
                                disabled={!ordId}
                                style={{ padding: '6px 12px', fontSize: '0.78rem', background: '#15803d', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 700 }}
                              >
                                [تم تسليم الطلب ✓]
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* 📦 الطلبات المسلّمة */}
                  {deliveredItemsList.length > 0 && (
                    <div>
                      <h4 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        📦 الطلبات المسلمة ({deliveredItemsList.length})
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {deliveredItemsList.map((item, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.01)', borderRadius: '6px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                            <span>{item.name} × {item.qty}</span>
                            <span>مسلم ✓</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="admin-card">
            <h3 className="card-title">💳 الفاتورة الحالية</h3>
            <div style={{ marginTop: '12px' }}>
              <div className="total-row"><span>المجموع الفرعي</span><span>{(tableData.subtotal || 0).toFixed(2)} ₪</span></div>
              <div className="total-row"><span>الضريبة (15%)</span><span>{(tableData.tax || 0).toFixed(2)} ₪</span></div>
              <div className="total-row"><span>خدمة (10%)</span><span>{(tableData.serviceCharge || 0).toFixed(2)} ₪</span></div>
              <div className="total-row grand"><span>الإجمالي النهائي</span><span>{(tableData.total || 0).toFixed(2)} ₪</span></div>
            </div>

            {tableData.status === 'bill_requested' && (
              <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(243,156,18,0.1)', borderRadius: '8px', border: '1px solid rgba(243,156,18,0.3)', textAlign: 'center' }}>
                <div style={{ color: '#f39c12', fontWeight: 700 }}>🧾 تم إرسال طلب الحساب للمحاسب</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>في انتظار المعالجة</div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // MAIN TABLES VIEW
  return (
    <div className="view-container">
                <button className="deliver-btn" onClick={() => handleDeliverItem(ri.orderId, ri.id)}>✓</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0 }}>مرحباً، {employee.name} 👋</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '4px' }}>اختر طاولة للبدء</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', fontSize: '0.82rem' }}>
          {Object.entries(STATUS_LABELS_AR).slice(0, 3).map(([k, v]) => (
            <div key={k} style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: STATUS_COLORS[k], display: 'inline-block' }} />
              {v}
            </div>
          ))}
        </div>
      </div>

      {/* Tables Grid */}
      <div className="tables-grid">
        {tables.map(t => {
          const elMin = t.seatedAt ? Math.floor((now - t.seatedAt) / 60000) : 0;
          return (
            <div
              key={t.id}
              className={`table-card status-${t.status}`}
              onClick={() => openTable(t)}
            >
              <div className="table-number">{t.id}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>🪑 {t.seats} مقعد</div>
              <span className={`badge ${STATUS_BADGE[t.status] || ''}`}>{STATUS_LABELS_AR[t.status] || t.status}</span>
              {t.status !== 'empty' && t.total > 0 && (
                <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, color: 'var(--color-primary)', fontSize: '0.88rem' }}>{t.total.toFixed(2)} ₪</div>
              )}
              {t.status !== 'empty' && t.seatedAt && (
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>⏱ {elMin} دقيقة</div>
              )}
              {t.status === 'bill_requested' && <div style={{ fontSize: '1.2rem' }}>🧾</div>}
            </div>
          );
        })}
      </div>

      {/* Bill confirm modal */}
      {billConfirmOpen && selectedTable && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setBillConfirmOpen(false); }}>
          <div className="modal-content glass-card" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3 className="modal-title">🧾 طلب الحساب</h3>
              <button className="modal-close" onClick={() => setBillConfirmOpen(false)}>×</button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center' }}>
              <p>هل تريد إرسال طلب الحساب للمحاسب؟</p>
              <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-primary)', margin: '12px 0' }}>
                {tableData ? (tableData.total || 0).toFixed(2) : '0.00'} ₪
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn-request-bill" onClick={handleRequestBill}>✅ نعم، إرسال طلب</button>
              <button className="btn-secondary" onClick={() => setBillConfirmOpen(false)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
