import { useState, useEffect, useCallback } from 'react';
import { getBills, saveBills, addNotification, getDeptOrders, saveDeptOrders, getRestaurantName } from '../utils/storage';

const PAYMENT_METHODS = [
  { id: 'cash', label: 'نقد', icon: '💵' },
  { id: 'card', label: 'بطاقة', icon: '💳' },
  { id: 'bank', label: 'تحويل بنكي', icon: '🏦' },
  { id: 'other', label: 'أخرى', icon: '🔄' }
];
const PAYMENT_LABELS = { cash: 'نقد', card: 'بطاقة', bank: 'تحويل بنكي', other: 'أخرى' };

export default function CashierView({ tables, onSaveTables, employee }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const [lastUpdated, setLastUpdated] = useState(() => new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'bills' | 'reports'
  const [selectedTable, setSelectedTable] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [cashierNote, setCashierNote] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(null); // holds the just-closed bill
  const [bills, setBills] = useState(getBills());
  const [deptOrders, setDeptOrders] = useState(getDeptOrders());
  const [selectedBill, setSelectedBill] = useState(null);

  useEffect(() => {
    const sync = () => {
      setBills(getBills());
      setDeptOrders(getDeptOrders());
      setLastUpdated(new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    window.addEventListener('taka_sync', sync);
    window.addEventListener('takah_sync', sync);
    return () => { window.removeEventListener('taka_sync', sync); window.removeEventListener('takah_sync', sync); };
  }, []);

  const activeTables = tables.filter(t => t.status === 'eating' || t.status === 'bill_requested');
  const sortedTables = [...activeTables].sort((a, b) => {
    if (a.status === 'bill_requested' && b.status !== 'bill_requested') return -1;
    if (a.status !== 'bill_requested' && b.status === 'bill_requested') return 1;
    return a.id - b.id;
  });

  const getOrderStatus = useCallback((table) => {
    const tableOrders = Object.values(deptOrders).filter(o => o.tableId === table.id);
    let total = 0, ready = 0;
    tableOrders.forEach(order => {
      (order.items || []).forEach(item => { total++; if (['ready', 'delivered'].includes(item.status)) ready++; });
    });
    return { total, ready, pending: total - ready };
  }, [deptOrders]);

  const handleConfirmPayment = () => {
    if (!selectedTable) return;
    const billId = `INV-${Date.now().toString().slice(-6)}`;
    const newBill = {
      id: billId, tableId: selectedTable.id, tableName: selectedTable.name,
      items: selectedTable.currentOrder || [],
      subtotal: selectedTable.subtotal || 0,
      tax: selectedTable.tax || 0,
      serviceCharge: selectedTable.serviceCharge || 0,
      total: selectedTable.total || 0,
      paymentMethod,
      cashierCode: employee.code, cashierName: employee.name,
      waiterCode: selectedTable.waiterCode,
      notes: cashierNote || selectedTable.notes || '',
      timestamp: Date.now(),
      timeFormatted: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      dateFormatted: new Date().toLocaleDateString('ar-EG'),
      seatedAt: selectedTable.seatedAt,
      seatedDuration: selectedTable.seatedAt ? Math.floor((Date.now() - selectedTable.seatedAt) / 60000) : 0
    };

    // Save bill
    const allBills = getBills();
    allBills.push(newBill);
    saveBills(allBills);
    setBills(allBills);

    // Reset table
    const updatedTables = tables.map(t => {
      if (t.id !== selectedTable.id) return t;
      return { ...t, status: 'empty', currentOrder: [], notes: '', subtotal: 0, tax: 0, serviceCharge: 0, total: 0, waiterCode: null, seatedAt: null, guests: 0 };
    });
    onSaveTables(updatedTables);

    // Remove dept orders for this table
    const orders = getDeptOrders();
    const filtered = Object.fromEntries(Object.entries(orders).filter(([, o]) => o.tableId !== selectedTable.id));
    saveDeptOrders(filtered);
    setDeptOrders(filtered);

    // Calculate total daily revenue including this new invoice
    const newTotalRevenue = allBills.reduce((s, b) => s + (b.total || 0), 0);

    // Notify waiter & cashier & manager
    addNotification(
      `🟢 الطاولة #${selectedTable.id} أصبحت فاضية (دفع مكتمل)`,
      `الطاولة جاهزة للتنظيف والتعقيم`,
      'success',
      ['waiter', 'manager']
    );
    addNotification(
      `💸 الطاولة #${selectedTable.id} تم الدفع - المبلغ: ${(selectedTable.total || 0).toFixed(0)}₪`,
      `طريقة الدفع: ${PAYMENT_LABELS[paymentMethod] || paymentMethod}`,
      'info',
      ['cashier', 'manager', 'waiter']
    );
    addNotification(
      `📊 إجمالي الإيرادات اليوم: ${newTotalRevenue.toFixed(0)}₪`,
      `تم تحديث إجمالي الإيرادات بعد تحصيل فاتورة الطاولة #${selectedTable.id}`,
      'info',
      ['manager']
    );

    setShowConfirmModal(false);
    setShowSuccessModal(newBill);
    setSelectedTable(null);
    setCashierNote('');
  };

  const elapsedTime = (table) => {
    if (!table?.seatedAt) return '—';
    const min = Math.floor((now - table.seatedAt) / 60000);
    if (min < 60) return `${min} دقيقة`;
    return `${Math.floor(min / 60)} س ${min % 60} د`;
  };

  const printBill = (bill) => {
    const w = window.open('', '', 'width=420,height=700');
    const itemRows = (bill.items || []).map(item =>
      `<div class="row"><span>${item.image || ''} ${item.name} × ${item.qty}</span><span>${(item.price * item.qty).toFixed(2)} ₪</span></div>`
    ).join('');
    w.document.write(`<!DOCTYPE html><html dir="rtl"><head><title>فاتورة ${bill.id}</title>
    <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;padding:24px;max-width:380px;margin:0 auto}
    h1{text-align:center;font-size:1.4rem;margin-bottom:4px}h2{text-align:center;font-size:1rem;font-weight:400;color:#555;margin-bottom:16px}
    .divider{border:none;border-top:1px dashed #ccc;margin:12px 0}
    .row{display:flex;justify-content:space-between;padding:5px 0;font-size:0.9rem}
    .row.bold{font-weight:700;font-size:1rem}.row.big{font-weight:800;font-size:1.2rem;border-top:2px solid #000;margin-top:8px;padding-top:8px}
    .info{font-size:0.8rem;color:#555;margin:3px 0}.footer{text-align:center;margin-top:20px;font-size:0.85rem;color:#777}
    </style></head><body>
    <h1>🍽️ ${getRestaurantName()}</h1>
    <div class="info">رقم الفاتورة: <b>${bill.id}</b></div>
    <div class="info">الطاولة: <b>${bill.tableName}</b></div>
    <div class="info">التاريخ: ${bill.dateFormatted} | الوقت: ${bill.timeFormatted}</div>
    ${bill.notes ? `<div class="info">ملاحظة: ${bill.notes}</div>` : ''}
    <hr class="divider">
    ${itemRows}
    <hr class="divider">
    <div class="row big"><span>الإجمالي النهائي:</span><span>${(bill.total || bill.subtotal || 0).toFixed(2)} ₪</span></div>
    <div class="row" style="margin-top:4px"><span>طريقة الدفع:</span><span>${PAYMENT_LABELS[bill.paymentMethod] || bill.paymentMethod}</span></div>
    <div class="footer"><p>شكراً لزيارتكم ${getRestaurantName()}</p><p>صحتين وعافية! 🙏</p></div>
    </body></html>`);
    w.document.close();
    setTimeout(() => { w.print(); }, 400);
  };

  // ── REPORTS DATA ─────────────────────────
  const totalRevenue = bills.reduce((s, b) => s + (b.total || 0), 0);
  const avgBill = bills.length > 0 ? totalRevenue / bills.length : 0;
  const paymentBreakdown = bills.reduce((acc, b) => {
    const m = b.paymentMethod || 'cash';
    acc[m] = { count: (acc[m]?.count || 0) + 1, amount: (acc[m]?.amount || 0) + (b.total || 0) };
    return acc;
  }, {});
  const itemSales = bills.reduce((acc, b) => {
    (b.items || []).forEach(i => { acc[i.id] = { name: i.name, qty: (acc[i.id]?.qty || 0) + (i.qty || 0) }; });
    return acc;
  }, {});
  const topItems = Object.values(itemSales).sort((a, b) => b.qty - a.qty).slice(0, 5);

  const TABS = [
    { id: 'active', label: '1️⃣ الفواتير النشطة (Active Invoices)', shortLabel: '🪑 النشطة', icon: '🪑' },
    { id: 'bills', label: '2️⃣ الفواتير المكتملة (Completed Invoices)', shortLabel: '🧾 المكتملة', icon: '🧾' },
    { id: 'reports', label: '3️⃣ التقارير اليومية (Daily Reports)', shortLabel: '📊 التقارير', icon: '📊' }
  ];

  const topItemName = topItems[0] ? topItems[0].name : 'لا يوجد';
  const getPeakHours = () => {
    if (bills.length === 0) return 'لا يوجد بيانات';
    const hourCounts = Array(24).fill(0);
    bills.forEach(b => {
      const date = new Date(b.timestamp);
      const hour = date.getHours();
      hourCounts[hour]++;
    });
    let maxHour = 13;
    let maxCount = 0;
    for (let i = 0; i < 24; i++) {
      if (hourCounts[i] > maxCount) {
        maxCount = hourCounts[i];
        maxHour = i;
      }
    }
    return `${maxHour}:00 - ${(maxHour + 1) % 24}:00`;
  };

  return (
    <div className="cashier-view-container">
      {/* Header */}
      <div className="cashier-header-container">
        <div className="cashier-header-info">
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.2rem', boxShadow: '0 4px 12px var(--color-primary-glow)' }}>
            {employee.name?.charAt(0) || 'C'}
          </div>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>{employee.name}</h2>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '4px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              <span>موظف: المحاسب 💵</span>
              <span>•</span>
              <span>آخر تحديث: {lastUpdated} ⏱️</span>
            </div>
          </div>
        </div>
        
        <div className="cashier-header-stats">
          <div style={{ textAlign: 'center', background: 'rgba(39,174,96,0.08)', border: '1px solid rgba(39,174,96,0.2)', borderRadius: '12px', padding: '10px 20px', minWidth: '120px' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>الفواتير المكتملة</div>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.6rem', color: '#27ae60' }}>{bills.length}</div>
          </div>
          <div style={{ textAlign: 'center', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '12px', padding: '10px 20px', minWidth: '140px' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>إجمالي الإيرادات لليوم</div>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.6rem', color: 'var(--color-primary)' }}>{totalRevenue.toFixed(2)} ₪</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bottom-navigation" style={{ position: 'static', marginBottom: '24px', borderRadius: '12px' }}>
        {TABS.map(tab => (
          <button key={tab.id} className={activeTab === tab.id ? 'active' : ''} onClick={() => setActiveTab(tab.id)}>
            <span className="show-on-desktop">{tab.label}</span>
            <span className="show-on-mobile-inline">{tab.shortLabel}</span>
          </button>
        ))}
      </div>

      {/* ACTIVE TABLES TAB */}
      {activeTab === 'active' && (
        <div className={`cashier-active-layout ${selectedTable ? 'has-selected' : ''}`}>
          {/* Tables list */}
          <div className="cashier-tables-column">
            <h3 style={{ marginBottom: '14px', fontSize: '1rem', fontWeight: 700 }}>
              الطاولات النشطة <span className="badge badge-ordering">{sortedTables.length}</span>
            </h3>
            {sortedTables.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '2.5rem' }}>🪑</div>
                <p style={{ marginTop: '8px', fontSize: '0.85rem' }}>لا توجد طاولات نشطة</p>
              </div>
            ) : (
              sortedTables.map(t => {
                const { total: oTotal, ready, pending } = getOrderStatus(t);
                return (
                  <div key={t.id}
                    className="cashier-table-item"
                    style={{ borderRight: `4px solid ${t.status === 'bill_requested' ? '#f39c12' : '#e74c3c'}`, background: selectedTable?.id === t.id ? 'rgba(212,175,55,0.08)' : '' }}
                    onClick={() => setSelectedTable(t)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '1rem' }}>{t.name}</div>
                        <span className={`badge badge-${t.status.replace('_', '-')}`} style={{ fontSize: '0.72rem', marginTop: '4px' }}>
                          {t.status === 'bill_requested' ? '🧾 يطلب الحساب' : '🍽️ يتناول'}
                        </span>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>⏱ {elapsedTime(t)}</div>
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, color: 'var(--color-primary)', fontSize: '1rem' }}>{(t.total || 0).toFixed(2)} ₪</div>
                        {oTotal > 0 && <div style={{ fontSize: '0.72rem', color: pending === 0 ? '#27ae60' : '#f39c12', marginTop: '2px' }}>✅ {ready}/{oTotal}</div>}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Invoice detail */}
          <div className="cashier-invoice-column">
            {selectedTable ? (
              <div className="glass-card" style={{ padding: '24px' }}>
                {/* Back button for mobile view */}
                <button className="btn-back-tables" onClick={() => setSelectedTable(null)} style={{ width: '100%', padding: '10px', fontSize: '0.88rem', background: 'rgba(255,255,255,0.08)', border: '1px solid var(--border-light)', borderRadius: '10px', cursor: 'pointer', color: 'var(--text-main)', marginBottom: '16px', fontWeight: 700 }}>
                  ← عودة لقائمة الطاولات
                </button>
                {/* Title */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--border-light)' }}>
                  <div>
                    <h3 style={{ fontWeight: 800, fontSize: '1.2rem', margin: 0 }}>💳 فاتورة {selectedTable.name}</h3>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {selectedTable.guests || 0} أشخاص | {elapsedTime(selectedTable)} | النادل: {selectedTable.waiterCode}
                    </div>
                  </div>
                  <span className={`badge badge-${selectedTable.status.replace('_', '-')}`}>
                    {selectedTable.status === 'bill_requested' ? 'يطلب الحساب' : 'يتناول'}
                  </span>
                </div>

                {/* Order status summary */}
                {(() => {
                  const { total: oTotal, ready, pending } = getOrderStatus(selectedTable);
                  return oTotal > 0 ? (
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                      <div style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', background: 'rgba(39,174,96,0.08)', border: '1px solid rgba(39,174,96,0.2)', textAlign: 'center' }}>
                        <div style={{ fontWeight: 700, color: '#27ae60' }}>✅ {ready}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>جاهز</div>
                      </div>
                      <div style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', background: pending > 0 ? 'rgba(243,156,18,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${pending > 0 ? 'rgba(243,156,18,0.3)' : 'var(--border-light)'}`, textAlign: 'center' }}>
                        <div style={{ fontWeight: 700, color: pending > 0 ? '#f39c12' : 'var(--text-muted)' }}>⏳ {pending}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>قيد التحضير</div>
                      </div>
                    </div>
                  ) : null;
                })()}

                {/* Items list */}
                <div style={{ maxHeight: '240px', overflowY: 'auto', marginBottom: '16px' }}>
                  {(selectedTable.currentOrder || []).map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px dashed rgba(255,255,255,0.05)' }}>
                      <div>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.name}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginRight: '8px' }}> × {item.qty}</span>
                        {item.note && <div style={{ fontSize: '0.72rem', color: '#f39c12' }}>📝 {item.note}</div>}
                      </div>
                      <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700 }}>{(item.price * item.qty).toFixed(2)} ₪</span>
                    </div>
                  ))}
                </div>

                {selectedTable.notes && (
                  <div style={{ marginBottom: '16px', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', fontSize: '0.82rem', color: '#f39c12' }}>
                    📝 {selectedTable.notes}
                  </div>
                )}

                {/* Totals */}
                <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '14px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                    <span>المجموع الفرعي</span>
                    <span style={{ fontFamily: 'Outfit, sans-serif' }}>{(selectedTable.subtotal || 0).toFixed(2)} ₪</span>
                  </div>
                  <div style={{ marginTop: '16px', background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.2rem', marginTop: '12px', paddingTop: '12px', borderTop: '2px solid rgba(255,255,255,0.1)', color: 'var(--color-primary)' }}>
                      <span>الإجمالي المطلوب</span>
                      <span>{(selectedTable.total || selectedTable.subtotal || 0).toFixed(2)} ₪</span>
                    </div>
                  </div>
                </div>

                {/* Payment methods */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '10px' }}>طريقة الدفع:</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                    {PAYMENT_METHODS.map(pm => (
                      <button
                        key={pm.id}
                        onClick={() => setPaymentMethod(pm.id)}
                        style={{
                          padding: '10px 6px', borderRadius: '10px', border: `2px solid ${paymentMethod === pm.id ? 'var(--color-primary)' : 'var(--border-light)'}`,
                          background: paymentMethod === pm.id ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.03)',
                          cursor: 'pointer', color: paymentMethod === pm.id ? 'var(--color-primary)' : 'var(--text-main)',
                          fontSize: '0.78rem', fontWeight: 600, textAlign: 'center', transition: 'all 0.2s'
                        }}
                      >
                        <div style={{ fontSize: '1.3rem', marginBottom: '3px' }}>{pm.icon}</div>
                        {pm.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Note field */}
                <input
                  className="form-input"
                  placeholder="ملاحظة إضافية للفاتورة (اختياري)"
                  value={cashierNote}
                  onChange={e => setCashierNote(e.target.value)}
                  style={{ marginBottom: '16px' }}
                />

                {/* Action buttons */}
                {(() => {
                  const { pending: oPending } = getOrderStatus(selectedTable);
                  const isPendingOrders = oPending > 0;
                  return (
                    <>
                      {isPendingOrders && (
                        <div style={{ 
                          marginBottom: '16px', 
                          padding: '10px 14px', 
                          background: 'rgba(231, 76, 60, 0.1)', 
                          border: '1px solid rgba(231, 76, 60, 0.3)', 
                          borderRadius: '8px', 
                          fontSize: '0.82rem', 
                          color: '#e74c3c',
                          fontWeight: 600,
                          textAlign: 'center'
                        }}>
                          ⚠️ لا يمكن إغلاق الفاتورة لوجود {oPending} طلبات قيد التحضير في الأقسام
                        </div>
                      )}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '10px' }}>
                        <button className="btn-secondary" onClick={() => printBill({ ...selectedTable, id: 'PREVIEW', tableName: selectedTable.name, items: selectedTable.currentOrder, paymentMethod, cashierCode: employee.code, timeFormatted: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }), dateFormatted: new Date().toLocaleDateString('ar-EG') })}>
                          🖨️ معاينة الفاتورة
                        </button>
                        <button 
                          className="send-order-btn" 
                          onClick={() => {
                            if (isPendingOrders) {
                              alert('تنبيه: لا يمكن إغلاق الفاتورة لأن هناك طلبات لم تجهز بعد من الأقسام.');
                              return;
                            }
                            setShowConfirmModal(true);
                          }}
                          disabled={isPendingOrders}
                          style={{
                            opacity: isPendingOrders ? 0.5 : 1,
                            cursor: isPendingOrders ? 'not-allowed' : 'pointer',
                            background: isPendingOrders ? '#7f8c8d' : ''
                          }}
                        >
                          🔥 إغلاق الفاتورة والدفع
                        </button>
                      </div>
                    </>
                  );
                })()}
              </div>
            ) : (
              <div className="glass-card" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>💳</div>
                <h4 style={{ color: 'var(--text-main)', marginBottom: '8px' }}>شاشة الدفع والتحصيل</h4>
                <p style={{ fontSize: '0.85rem' }}>اختر طاولة نشطة من القائمة لعرض الفاتورة</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* BILLS TAB */}
      {activeTab === 'bills' && (
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontWeight: 700, fontSize: '1.1rem' }}>الفواتير المكتملة ({bills.length})</h3>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, color: '#27ae60' }}>الإجمالي: {totalRevenue.toFixed(2)} ₪</div>
          </div>
          {bills.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🧾</div>
              <p>لا توجد فواتير مكتملة بعد</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>رقم الفاتورة</th>
                    <th>الطاولة</th>
                    <th>الأصناف</th>
                    <th>الإجمالي</th>
                    <th>طريقة الدفع</th>
                    <th>الوقت</th>
                    <th>مدة الجلوس</th>
                    <th>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {[...bills].reverse().map(bill => (
                    <tr key={bill.id}>
                      <td><code style={{ color: 'var(--color-primary)', fontFamily: 'Outfit, sans-serif' }}>{bill.id}</code></td>
                      <td>{bill.tableName}</td>
                      <td style={{ fontFamily: 'Outfit, sans-serif' }}>{(bill.items || []).reduce((s, i) => s + i.qty, 0)} صنف</td>
                      <td><strong style={{ color: '#27ae60', fontFamily: 'Outfit, sans-serif' }}>{(bill.total || 0).toFixed(2)} ₪</strong></td>
                      <td><span style={{ fontSize: '0.85rem' }}>{PAYMENT_LABELS[bill.paymentMethod] || 'نقد'}</span></td>
                      <td style={{ fontFamily: 'Outfit, sans-serif', fontSize: '0.85rem' }}>{bill.timeFormatted}</td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        {bill.seatedDuration ? `${bill.seatedDuration} د` : '—'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button className="icon-btn" onClick={() => setSelectedBill(bill)} title="تفاصيل">👁️</button>
                          <button className="icon-btn" onClick={() => printBill(bill)} title="طباعة">🖨️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* REPORTS TAB */}
      {activeTab === 'reports' && (
        <div style={{ display: 'grid', gap: '20px' }}>
          <div className="cashier-reports-grid">
            <div className="glass-card" style={{ padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem', marginBottom: '4px' }}>🧾</div>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.6rem', fontWeight: 800, color: '#3498db' }}>{bills.length}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>إجمالي الفواتير</div>
            </div>
            <div className="glass-card" style={{ padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem', marginBottom: '4px' }}>💰</div>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.6rem', fontWeight: 800, color: '#27ae60' }}>{totalRevenue.toFixed(1)} ₪</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>إجمالي الإيرادات</div>
            </div>
            <div className="glass-card" style={{ padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem', marginBottom: '4px' }}>📊</div>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.6rem', fontWeight: 800, color: '#f39c12' }}>{avgBill.toFixed(1)} ₪</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>متوسط الفاتورة</div>
            </div>
            <div className="glass-card" style={{ padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem', marginBottom: '4px' }}>🔥</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', direction: 'rtl', marginTop: '6px' }} title={topItemName}>{topItemName}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>أكثر الأصناف مبيعاً</div>
            </div>
            <div className="glass-card" style={{ padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem', marginBottom: '4px' }}>⏱️</div>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.1rem', fontWeight: 800, color: '#9b59b6', marginTop: '4px' }}>{getPeakHours()}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>أوقات الذروة</div>
            </div>
          </div>

          <div className="cashier-reports-bottom-grid">
            <div className="glass-card" style={{ padding: '20px' }}>
              <h3 style={{ fontWeight: 700, marginBottom: '14px' }}>💳 طرق الدفع</h3>
              {Object.entries(paymentBreakdown).length === 0 ? <p style={{ color: 'var(--text-muted)' }}>لا بيانات</p> :
                Object.entries(paymentBreakdown).map(([method, data]) => (
                  <div key={method} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.88rem' }}>{PAYMENT_METHODS.find(p => p.id === method)?.icon} {PAYMENT_LABELS[method] || method}</span>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, color: '#27ae60' }}>{data.amount.toFixed(2)} ₪</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{data.count} فاتورة</div>
                    </div>
                  </div>
                ))
              }
            </div>

            <div className="glass-card" style={{ padding: '20px' }}>
              <h3 style={{ fontWeight: 700, marginBottom: '14px' }}>🔝 أكثر الأصناف طلباً</h3>
              {topItems.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>لا بيانات</p> :
                topItems.map((item, i) => (
                  <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontSize: '0.88rem' }}><strong style={{ color: i === 0 ? 'var(--color-primary)' : 'var(--text-muted)' }}>{i + 1}.</strong> {item.name}</span>
                    <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, color: '#3498db' }}>{item.qty} ✕</span>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM PAYMENT MODAL */}
      {showConfirmModal && selectedTable && (
        <div className="modal-overlay">
          <div className="modal-content glass-card" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 className="modal-title">تأكيد إغلاق الفاتورة</h3>
              <button className="modal-close" onClick={() => setShowConfirmModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px', fontSize: '0.88rem' }}>
                <div><span style={{ color: 'var(--text-muted)' }}>الطاولة: </span><strong>{selectedTable.name}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>الأصناف: </span><strong>{(selectedTable.currentOrder || []).reduce((s, i) => s + i.qty, 0)}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>مدة الجلوس: </span><strong>{elapsedTime(selectedTable)}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>طريقة الدفع: </span><strong>{PAYMENT_LABELS[paymentMethod]}</strong></div>
              </div>

              <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '12px', padding: '16px', marginBottom: '20px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>الإجمالي النهائي</div>
                <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '2rem', fontWeight: 800, color: 'var(--color-primary)' }}>{(selectedTable.total || 0).toFixed(2)} ₪</div>
              </div>

              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                ✅ سيتم تصفير الطاولة وإرسال إشعار للجرسون بعد التأكيد
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowConfirmModal(false)}>إلغاء</button>
              <button className="send-order-btn" style={{ flex: 1 }} onClick={handleConfirmPayment}>
                ✅ تأكيد الدفع وإغلاق الفاتورة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS MODAL */}
      {showSuccessModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-card" style={{ maxWidth: '400px', textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: '12px' }}>✅</div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#27ae60', marginBottom: '8px' }}>تم إغلاق الفاتورة بنجاح!</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>
              {showSuccessModal.tableName} - تم استلام {(showSuccessModal.total || 0).toFixed(2)} ₪ ({PAYMENT_LABELS[showSuccessModal.paymentMethod]})
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button className="btn-primary-gold" onClick={() => { printBill(showSuccessModal); setShowSuccessModal(null); }}>🖨️ طباعة الفاتورة</button>
              <button className="btn-secondary" onClick={() => setShowSuccessModal(null)}>إغلاق</button>
            </div>
          </div>
        </div>
      )}

      {/* BILL DETAIL MODAL */}
      {selectedBill && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setSelectedBill(null); }}>
          <div className="modal-content glass-card" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 className="modal-title">فاتورة {selectedBill.tableName}</h3>
              <button className="modal-close" onClick={() => setSelectedBill(null)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.85rem', marginBottom: '16px' }}>
                <div>رقم: <strong style={{ color: 'var(--color-primary)', fontFamily: 'Outfit, sans-serif' }}>{selectedBill.id}</strong></div>
                <div>الوقت: <strong>{selectedBill.timeFormatted}</strong></div>
                <div>النادل: <strong>{selectedBill.waiterCode}</strong></div>
                <div>الكاشير: <strong>{selectedBill.cashierCode}</strong></div>
                <div>الدفع: <strong>{PAYMENT_LABELS[selectedBill.paymentMethod]}</strong></div>
                <div>المدة: <strong>{selectedBill.seatedDuration ? `${selectedBill.seatedDuration} دقيقة` : '—'}</strong></div>
              </div>
              {(selectedBill.items || []).map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px dashed rgba(255,255,255,0.06)' }}>
                  <span style={{ fontSize: '0.88rem' }}>{item.name} × {item.qty}</span>
                  <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600 }}>{(item.price * item.qty).toFixed(2)} ₪</span>
                </div>
              ))}
              <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.1rem', color: '#27ae60', borderTop: '1px solid var(--border-light)', paddingTop: '8px' }}>
                  <span>الإجمالي النهائي</span>
                  <span style={{ fontFamily: 'Outfit, sans-serif' }}>{(selectedBill.total || selectedBill.subtotal || 0).toFixed(2)} ₪</span>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-primary-gold" onClick={() => printBill(selectedBill)}>🖨️ طباعة</button>
              <button className="btn-secondary" onClick={() => setSelectedBill(null)}>إغلاق</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
