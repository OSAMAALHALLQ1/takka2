import React from 'react';
import StatCard from './StatCard';
import { STATUS_COLORS, STATUS_LABELS } from './constants';

export default function DashboardTab({ tables, bills, occupied, activeOrders, activeStaff, menuItems }) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

  const todayBills = bills.filter(b => b.timestamp >= startOfToday);
  const weekBills = bills.filter(b => b.timestamp >= startOfWeek.getTime());

  const todayRevenue = todayBills.reduce((s, b) => s + (b.total || b.subtotal || 0), 0);

  const itemSales = weekBills.reduce((acc, b) => {
    (b.items || []).forEach(item => { acc[item.id] = (acc[item.id] || 0) + (item.qty || 0); });
    return acc;
  }, {});
  const topItem = Object.entries(itemSales).sort((a, b) => b[1] - a[1])[0];
  const topItemName = topItem ? (menuItems.find(m => m.id === topItem[0])?.name || topItem[0]) : 'لا يوجد';
  const recentBills = [...bills].reverse().slice(0, 5);

  return (
    <div>
      <h2 className="tab-title">📊 لوحة التحكم الرئيسية</h2>

      <div className="stats-grid-4">
        <StatCard icon="🪑" label="الطاولات المشغولة" value={`${occupied} / ${tables.length}`} color="#e74c3c" />
        <StatCard icon="📋" label="الطلبات النشطة" value={activeOrders} color="#f39c12" />
        <StatCard icon="💰" label="إيرادات اليوم" value={`${todayRevenue.toFixed(2)} ₪`} color="#27ae60" />
        <StatCard icon="🔥" label="الأكثر طلباً (أسبوع)" value={topItemName} color="#8e44ad" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '24px' }}>
        {/* Tables Status */}
        <div className="admin-card">
          <h3 className="card-title">🪑 حالة الطاولات</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', marginTop: '12px' }}>
            {tables.map(t => (
              <div key={t.id} style={{
                padding: '8px', borderRadius: '8px', textAlign: 'center',
                background: `${STATUS_COLORS[t.status] || '#555'}22`,
                border: `1px solid ${STATUS_COLORS[t.status] || '#555'}55`
              }}>
                <div style={{ fontWeight: 700, fontSize: '1rem', fontFamily: 'Outfit, sans-serif' }}>{t.id}</div>
                <div style={{ fontSize: '0.65rem', color: STATUS_COLORS[t.status], marginTop: '2px' }}>
                  {STATUS_LABELS[t.status] || t.status}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Bills */}
        <div className="admin-card">
          <h3 className="card-title">🧾 آخر الفواتير</h3>
          {recentBills.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '12px' }}>لا توجد فواتير بعد</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
              {recentBills.map(b => (
                <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.85rem' }}>{b.tableName}</span>
                  <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, color: '#27ae60' }}>{(b.total || 0).toFixed(2)} ₪</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Summary stats */}
      <div className="admin-card" style={{ marginTop: '20px' }}>
        <h3 className="card-title">📈 ملخص إحصائي</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginTop: '12px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-primary)' }}>{bills.length}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>إجمالي الفواتير</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#27ae60' }}>
              {bills.length > 0 ? (todayRevenue / bills.length).toFixed(1) : '0'} ₪
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>متوسط الفاتورة</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#3498db' }}>{topItemName}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>الأكثر طلباً</div>
          </div>
        </div>
      </div>
    </div>
  );
}
