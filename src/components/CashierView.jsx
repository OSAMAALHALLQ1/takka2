import React, { useState } from 'react';
import { getBills, saveBills, addNotification } from '../utils/storage';
import { CreditCard, Printer, CheckCircle, RefreshCw, XCircle, ShoppingBag, Receipt } from 'lucide-react';

export default function CashierView({ tables, onSaveTables, employee }) {
  const [activeTable, setActiveTable] = useState(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Get only tables that are eating or have requested a bill
  const activeTables = tables.filter((t) => t.status === 'eating' || t.status === 'bill_requested');

  // Sort tables so those requesting the bill appear first
  const sortedActiveTables = [...activeTables].sort((a, b) => {
    if (a.status === 'bill_requested' && b.status !== 'bill_requested') return -1;
    if (a.status !== 'bill_requested' && b.status === 'bill_requested') return 1;
    return a.id - b.id;
  });

  const selectTable = (table) => {
    setActiveTable(table);
  };

  // Process and finalize payment
  const handleProcessPayment = () => {
    if (!activeTable) return;

    const bills = getBills();
    const newBill = {
      id: `INV-${Date.now().toString().slice(-6)}`,
      tableId: activeTable.id,
      tableName: activeTable.name,
      items: activeTable.currentOrder,
      subtotal: activeTable.subtotal,
      tax: activeTable.tax,
      total: activeTable.total,
      cashierCode: employee.code,
      waiterCode: activeTable.waiterCode,
      notes: activeTable.notes,
      timestamp: new Date().toISOString(),
      timeFormatted: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      dateFormatted: new Date().toLocaleDateString('ar-EG')
    };

    // Save invoice to daily bills
    bills.push(newBill);
    saveBills(bills);

    // Reset Table status
    const updatedTables = tables.map((t) => {
      if (t.id === activeTable.id) {
        return {
          ...t,
          status: 'empty',
          currentOrder: [],
          notes: '',
          subtotal: 0,
          tax: 0,
          total: 0,
          waiterCode: null
        };
      }
      return t;
    });

    onSaveTables(updatedTables);
    addNotification(
      'تم الدفع 💰',
      `تم استلام مبلغ ${activeTable.total.toFixed(2)} د.أ وتصفية ${activeTable.name}`,
      'success'
    );

    setActiveTable(null);
    setShowPrintModal(false);
  };

  const handlePrint = () => {
    // In real browser this triggers windows printing. We will mock it and then print.
    window.print();
  };

  return (
    <div style={{ padding: '20px' }}>
      {/* Cashier Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: '800' }}>مرحباً، {employee.name} (المحاسب) 💵</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>نظام محاسبة الطلبات وطباعة الفواتير اليومية</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '24px' }}>
        {/* Active Tables List (Left Column) */}
        <div>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', fontWeight: '700', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span>الطاولات النشطة</span>
            <span className="badge badge-ordering num-font">{sortedActiveTables.length}</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {sortedActiveTables.length === 0 ? (
              <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <ShoppingBag size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
                <p style={{ fontSize: '0.85rem' }}>لا توجد طاولات نشطة في الصالة حالياً.</p>
              </div>
            ) : (
              sortedActiveTables.map((t) => (
                <div
                  key={t.id}
                  className={`glass-card`}
                  style={{
                    padding: '16px 20px',
                    cursor: 'pointer',
                    borderRight: `4px solid ${t.status === 'bill_requested' ? 'var(--status-bill-requested)' : 'var(--status-eating)'}`,
                    borderColor: activeTable && activeTable.id === t.id ? 'var(--color-primary)' : '',
                    background: activeTable && activeTable.id === t.id ? 'rgba(234,179,8,0.03)' : ''
                  }}
                  onClick={() => selectTable(t)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ fontWeight: '700', fontSize: '1rem' }}>{t.name}</h4>
                      <span className={`badge badge-${t.status.replace('_', '-')}`} style={{ marginTop: '6px' }}>
                        {t.status === 'bill_requested' ? 'يطلب الحساب (عاجل)' : 'يتناول الطعام'}
                      </span>
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <div className="num-font" style={{ fontWeight: '800', color: 'var(--color-primary)', fontSize: '1.1rem' }}>
                        {t.total.toFixed(2)} د.أ
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        كود النادل: {t.waiterCode}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Selected Table Checkout Console (Right Column) */}
        <div>
          {activeTable ? (
            <div className="glass-card" style={{ padding: '24px', position: 'sticky', top: '90px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '16px', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '800' }}>تفاصيل حساب {activeTable.name}</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    طلب بواسطة النادل: <strong className="num-font">{activeTable.waiterCode}</strong>
                  </p>
                </div>
                <span className={`badge badge-${activeTable.status.replace('_', '-')}`} style={{ height: 'fit-content' }}>
                  {activeTable.status === 'bill_requested' ? 'يطلب الحساب' : 'تناول الطعام'}
                </span>
              </div>

              {/* Items Ordered */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px', maxHeight: '260px', overflowY: 'auto', paddingLeft: '4px' }}>
                {activeTable.currentOrder.map((item) => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '8px', borderBottom: '1px dashed rgba(255,255,255,0.04)' }}>
                    <div>
                      <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{item.name}</span>
                      <span className="num-font" style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginRight: '8px' }}>
                        ({item.qty} × {item.price.toFixed(2)})
                      </span>
                      {item.note && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-primary)', marginTop: '4px', background: 'var(--color-primary-glow)', padding: '2px 8px', borderRadius: '4px', width: 'fit-content' }}>
                          💡 {item.note}
                        </div>
                      )}
                    </div>
                    <span className="num-font" style={{ fontWeight: '700' }}>{(item.price * item.qty).toFixed(2)} د.أ</span>
                  </div>
                ))}
              </div>

              {activeTable.notes && (
                <div style={{ marginBottom: '20px', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-light)', fontSize: '0.85rem' }}>
                  <strong>ملاحظات الطاولة:</strong> {activeTable.notes}
                </div>
              )}

              {/* Invoice Totals */}
              <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '16px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifySelf: 'flex-start', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  <span>المجموع الفرعي:</span>
                  <span className="num-font">{activeTable.subtotal.toFixed(2)} د.أ</span>
                </div>
                <div style={{ display: 'flex', justifySelf: 'flex-start', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  <span>الضريبة والخدمة (15%):</span>
                  <span className="num-font">{activeTable.tax.toFixed(2)} د.أ</span>
                </div>
                <div style={{ display: 'flex', justifySelf: 'flex-start', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: '800', color: 'var(--color-primary)', borderTop: '1px dashed var(--border-light)', paddingTop: '8px' }}>
                  <span>المجموع النهائي:</span>
                  <span className="num-font">{activeTable.total.toFixed(2)} دينار</span>
                </div>
              </div>

              {/* Checkout actions */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '12px' }}>
                <button className="btn btn-secondary" onClick={() => setShowPrintModal(true)}>
                  <Printer size={18} /> معاينة الفاتورة
                </button>
                <button className="btn btn-primary" onClick={handleProcessPayment}>
                  <CreditCard size={18} /> تأكيد الدفع وإخلاء الطاولة
                </button>
              </div>
            </div>
          ) : (
            <div className="glass-card" style={{ padding: '60px 40px', textAlign: 'center', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '340px' }}>
              <Receipt size={48} style={{ marginBottom: '16px', color: 'var(--text-muted)', opacity: 0.4 }} />
              <h4 style={{ fontSize: '1.1rem', color: 'var(--text-main)', marginBottom: '6px' }}>شاشة الدفع والتحصيل</h4>
              <p style={{ fontSize: '0.85rem', maxWidth: '320px' }}>اختر طاولة نشطة من القائمة الجانبية لعرض طلباتها وإصدار الفاتورة أو إتمام الدفع المالي.</p>
            </div>
          )}
        </div>
      </div>

      {/* Invoice Print Preview Modal */}
      {showPrintModal && activeTable && (
        <div className="modal-overlay">
          <div className="modal-content glass-card" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 className="modal-title">معاينة الفاتورة قبل الطباعة</h3>
              <button className="modal-close" onClick={() => setShowPrintModal(false)}>&times;</button>
            </div>
            <div className="modal-body" style={{ background: '#f1f5f9', padding: '16px' }}>
              
              {/* Paper Receipt Simulation */}
              <div className="invoice-container">
                <div className="invoice-header">
                  <div className="invoice-title">مطعم ومقهى تكة</div>
                  <div className="invoice-subtitle">سطح المكتب، صالة رقم ١</div>
                  <div className="invoice-subtitle">هاتف: 0791234567</div>
                </div>

                <div className="invoice-details">
                  <div><strong>رقم الفاتورة:</strong> <span className="num-font">INV-{Date.now().toString().slice(-4)}</span></div>
                  <div><strong>الطاولة:</strong> {activeTable.name}</div>
                  <div><strong>التاريخ:</strong> <span className="num-font">{new Date().toLocaleDateString('ar-EG')}</span></div>
                  <div><strong>الوقت:</strong> <span className="num-font">{new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span></div>
                  <div><strong>الكاشير:</strong> {employee.name}</div>
                  <div><strong>النادل:</strong> <span className="num-font">{activeTable.waiterCode}</span></div>
                </div>

                <div className="invoice-items">
                  <div className="invoice-item-row header">
                    <div>الصنف</div>
                    <div style={{ textAlign: 'center' }}>الكمية</div>
                    <div style={{ textAlign: 'left' }}>السعر</div>
                  </div>
                  {activeTable.currentOrder.map((item) => (
                    <div key={item.id} className="invoice-item-row">
                      <div style={{ fontSize: '0.8rem' }}>
                        {item.name}
                        {item.note && <div style={{ fontSize: '0.7rem', color: '#555' }}>* {item.note}</div>}
                      </div>
                      <div className="num-font" style={{ textAlign: 'center' }}>{item.qty}</div>
                      <div className="num-font" style={{ textAlign: 'left' }}>{(item.price * item.qty).toFixed(2)}</div>
                    </div>
                  ))}
                </div>

                <div className="invoice-totals">
                  <div className="invoice-total-row">
                    <span>المجموع الفرعي:</span>
                    <span className="num-font">{activeTable.subtotal.toFixed(2)} د.أ</span>
                  </div>
                  <div className="invoice-total-row">
                    <span>الضريبة (15%):</span>
                    <span className="num-font">{activeTable.tax.toFixed(2)} د.أ</span>
                  </div>
                  <div className="invoice-total-row grand">
                    <span>المجموع الكلي:</span>
                    <span className="num-font">{activeTable.total.toFixed(2)} دينار</span>
                  </div>
                </div>

                <div className="invoice-footer">
                  <p>شكراً لزيارتكم مطعم تكة</p>
                  <p>صحتين وعافية!</p>
                </div>
              </div>

            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowPrintModal(false)}>
                إغلاق
              </button>
              <button className="btn btn-primary" onClick={handlePrint}>
                <Printer size={16} /> طباعة الفاتورة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
