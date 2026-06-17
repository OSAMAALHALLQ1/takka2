import React from 'react';
import StatCard from './StatCard';

export default function ReportsTab({ bills, menuItems, tables }) {
  const totalRevenue = bills.reduce((s, b) => s + (b.total || 0), 0);
  const avgBill = bills.length > 0 ? totalRevenue / bills.length : 0;
  const itemSales = bills.reduce((acc, b) => {
    (b.items || []).forEach(item => { acc[item.id] = (acc[item.id] || 0) + (item.qty || 0); });
    return acc;
  }, {});
  const topItems = Object.entries(itemSales).map(([id, qty]) => ({ ...menuItems.find(m => m.id === id), qty })).filter(Boolean).sort((a, b) => b.qty - a.qty).slice(0, 7);
  const maxQty = topItems[0]?.qty || 1;

  const salesByDept = bills.reduce((acc, b) => {
    (b.items || []).forEach(item => {
      const m = menuItems.find(x => x.id === item.id);
      const dept = m?.department || 'other';
      acc[dept] = (acc[dept] || 0) + (item.price || 0) * (item.qty || 0);
    });
    return acc;
  }, {});
  const maxSales = Math.max(...Object.values(salesByDept), 1);

  const DEPT_COLORS = { kitchen: '#e67e22', bar: '#1abc9c', shisha: '#27ae60', other: '#7f8c8d' };
  const DEPT_NAMES = { kitchen: 'المطبخ', bar: 'البار', shisha: 'الشيشة', other: 'أخرى' };

  const paymentStats = bills.reduce((acc, b) => {
    const m = b.paymentMethod || 'cash';
    acc[m] = (acc[m] || 0) + (b.total || 0);
    return acc;
  }, {});

  return (
    <div>
      <h2 className="tab-title">📈 التقارير اليومية</h2>

      {/* Summary */}
      <div className="stats-grid-4" style={{ marginBottom: '24px' }}>
        <StatCard icon="🧾" label="إجمالي الفواتير" value={bills.length} color="#3498db" />
        <StatCard icon="💰" label="إجمالي الإيرادات" value={`${totalRevenue.toFixed(1)} ₪`} color="#27ae60" />
        <StatCard icon="📊" label="متوسط الفاتورة" value={`${avgBill.toFixed(1)} ₪`} color="#f39c12" />
        <StatCard icon="🪑" label="الطاولات الكلية" value={tables.length} color="#9b59b6" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Top Items */}
        <div className="admin-card">
          <h3 className="card-title">🔝 أكثر الأصناف طلباً</h3>
          {topItems.length === 0 ? <p style={{ color: 'var(--text-muted)', marginTop: '12px' }}>لا بيانات بعد</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
              {topItems.map((item, i) => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ width: '20px', fontWeight: 700, color: i === 0 ? 'var(--color-primary)' : 'var(--text-muted)', textAlign: 'center' }}>{i + 1}</span>
                  <span style={{ fontSize: '1.2rem' }}>{item.image}</span>
                  <span style={{ flex: 1, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
                  <div style={{ flex: 0, minWidth: '80px' }}>
                    <div style={{ height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.06)' }}>
                      <div style={{ height: '100%', borderRadius: '3px', background: 'var(--color-primary)', width: `${(item.qty / maxQty) * 100}%` }} />
                    </div>
                  </div>
                  <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, color: 'var(--color-primary)', minWidth: '30px', textAlign: 'left' }}>{item.qty}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sales by Dept */}
        <div className="admin-card">
          <h3 className="card-title">📊 المبيعات حسب القسم</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
            {Object.entries(salesByDept).length === 0 ? <p style={{ color: 'var(--text-muted)' }}>لا بيانات بعد</p> :
              Object.entries(salesByDept).map(([dept, amount]) => (
                <div key={dept}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.85rem' }}>
                    <span>{DEPT_NAMES[dept] || dept}</span>
                    <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, color: DEPT_COLORS[dept] }}>{amount.toFixed(1)} ₪</span>
                  </div>
                  <div style={{ height: '8px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)' }}>
                    <div style={{ height: '100%', borderRadius: '4px', background: DEPT_COLORS[dept] || '#555', width: `${(amount / maxSales) * 100}%` }} />
                  </div>
                </div>
              ))
            }
          </div>
        </div>

        {/* Payment Methods */}
        <div className="admin-card">
          <h3 className="card-title">💳 طرق الدفع</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
            {Object.entries(paymentStats).length === 0 ? <p style={{ color: 'var(--text-muted)' }}>لا بيانات بعد</p> :
              Object.entries(paymentStats).map(([method, amount]) => {
                const labels = { cash: 'نقد 💵', card: 'بطاقة 💳', bank: 'تحويل بنكي 🏦', other: 'أخرى' };
                return (
                  <div key={method} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                    <span>{labels[method] || method}</span>
                    <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, color: '#27ae60' }}>{amount.toFixed(2)} ₪</span>
                  </div>
                );
              })
            }
          </div>
        </div>
      </div>
    </div>
  );
}
