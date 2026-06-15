import { useState, useEffect } from 'react';
import {
  getTables, saveTables, getEmployees, saveEmployees,
  getMenu, saveMenu, getBills, getDepartments, saveDepartments,
  addNotification, getDeptOrders
} from '../utils/storage';
import { getCodes, createCode, revokeCode, deleteCode } from '../utils/auth-store';

const ROLE_COLORS = {
  manager: '#e74c3c', waiter: '#3498db', cashier: '#9b59b6',
  kitchen: '#e67e22', bar: '#1abc9c', shisha: '#27ae60'
};
const ROLE_LABELS = {
  manager: 'مدير', waiter: 'جرسون', cashier: 'محاسب',
  kitchen: 'مطبخ', bar: 'بار', shisha: 'شيشة'
};
const STATUS_LABELS = { empty: 'فاضية', eating: 'مشغولة', bill_requested: 'تنتظر دفع', unavailable: 'غير متوفرة' };
const STATUS_COLORS = { empty: '#27ae60', eating: '#e74c3c', bill_requested: '#f39c12', unavailable: '#555' };
const CATEGORY_LABELS = { mains: 'أطباق رئيسية', appetizers: 'مقبلات', drinks: 'مشروبات', shisha: 'شيشة', desserts: 'حلويات' };
const AREA_LABELS = { indoor: 'داخلي', outdoor: 'خارجي', terrace: 'شرفة' };

const PERMISSIONS = [
  { key: 'add_table', label: 'إضافة طاولة', manager: true, waiter: false, cashier: false, kitchen: false, bar: false, shisha: false },
  { key: 'add_order', label: 'إضافة طلب', manager: true, waiter: true, cashier: false, kitchen: false, bar: false, shisha: false },
  { key: 'view_order', label: 'عرض الطلبات', manager: true, waiter: true, cashier: true, kitchen: true, bar: true, shisha: true },
  { key: 'edit_order', label: 'تعديل طلب', manager: true, waiter: true, cashier: false, kitchen: false, bar: false, shisha: false },
  { key: 'update_status', label: 'تحديث حالة طلب', manager: true, waiter: false, cashier: false, kitchen: true, bar: true, shisha: true },
  { key: 'view_bill', label: 'عرض فاتورة', manager: true, waiter: true, cashier: true, kitchen: false, bar: false, shisha: false },
  { key: 'close_bill', label: 'إغلاق فاتورة', manager: true, waiter: false, cashier: true, kitchen: false, bar: false, shisha: false },
  { key: 'add_menu', label: 'إضافة منيو', manager: true, waiter: false, cashier: false, kitchen: false, bar: false, shisha: false },
  { key: 'reports', label: 'عرض التقارير', manager: true, waiter: false, cashier: false, kitchen: false, bar: false, shisha: false },
];

export default function AdminDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tables, setTables] = useState(getTables());
  const [employees, setEmployees] = useState(getEmployees());
  const [menuItems, setMenuItems] = useState(getMenu());
  const [bills, setBills] = useState(getBills());
  const [departments, setDepartments] = useState(getDepartments());
  const [codes, setCodes] = useState(getCodes());
  const [deptOrders, setDeptOrders] = useState(getDeptOrders());

  // Refresh on sync
  useEffect(() => {
    const sync = () => {
      setTables(getTables());
      setEmployees(getEmployees());
      setMenuItems(getMenu());
      setBills(getBills());
      setDepartments(getDepartments());
      setCodes(getCodes());
      setDeptOrders(getDeptOrders());
    };
    window.addEventListener('taka_sync', sync);
    window.addEventListener('takah_sync', sync);
    return () => { window.removeEventListener('taka_sync', sync); window.removeEventListener('takah_sync', sync); };
  }, []);

  const TABS = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: '📊' },
    { id: 'departments', label: 'الأقسام', icon: '🏢' },
    { id: 'menu', label: 'المنيو', icon: '🍽️' },
    { id: 'tables', label: 'الطاولات', icon: '🪑' },
    { id: 'staff', label: 'الموظفون', icon: '👥' },
    { id: 'codes', label: 'أكواد الدعوة', icon: '🔑' },
    { id: 'permissions', label: 'الصلاحيات', icon: '🔐' },
    { id: 'reports', label: 'التقارير', icon: '📈' },
    { id: 'bills', label: 'الفواتير', icon: '🧾' },
  ];

  const occupied = tables.filter(t => t.status !== 'empty').length;
  const todayRevenue = bills.reduce((s, b) => s + (b.total || 0), 0);
  const activeOrders = Object.keys(deptOrders).length;
  const activeStaff = employees.filter(e => e.active && e.role !== 'manager').length;

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 65px)' }}>
      {/* Mobile Toggle Button */}
      <button 
        className="admin-mobile-toggle"
        onClick={() => setSidebarOpen(o => !o)}
      >
        {sidebarOpen ? '✕ إغلاق' : '☰ قائمة الخيارات'}
      </button>

      {/* Sidebar Backdrop overlay on mobile */}
      {sidebarOpen && (
        <div className="admin-sidebar-backdrop" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-user">
          <div className="admin-avatar">{user.name?.charAt(0) || 'م'}</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{user.name}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>مدير النظام</div>
          </div>
        </div>
        <nav className="admin-nav">
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`admin-nav-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => { setActiveTab(tab.id); setSidebarOpen(false); }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
        <button className="admin-logout-btn" onClick={() => { setSidebarOpen(false); onLogout(); }}>
          🚪 تسجيل خروج
        </button>
      </aside>

      {/* Main content */}
      <main className="admin-main">
        {activeTab === 'dashboard' && <DashboardTab tables={tables} bills={bills} occupied={occupied} todayRevenue={todayRevenue} activeOrders={activeOrders} activeStaff={activeStaff} menuItems={menuItems} />}
        {activeTab === 'departments' && <DepartmentsTab departments={departments} setDepartments={setDepartments} employees={employees} deptOrders={deptOrders} />}
        {activeTab === 'menu' && <MenuTab menuItems={menuItems} setMenuItems={setMenuItems} departments={departments} />}
        {activeTab === 'tables' && <TablesTab tables={tables} setTables={setTables} />}
        {activeTab === 'staff' && <StaffTab employees={employees} setEmployees={setEmployees} />}
        {activeTab === 'codes' && <CodesTab codes={codes} setCodes={setCodes} />}
        {activeTab === 'permissions' && <PermissionsTab />}
        {activeTab === 'reports' && <ReportsTab bills={bills} menuItems={menuItems} tables={tables} />}
        {activeTab === 'bills' && <BillsTab bills={bills} menuItems={menuItems} />}
      </main>
    </div>
  );
}

// ──────────────────────────────────────────────────────
// DASHBOARD TAB
// ──────────────────────────────────────────────────────
function DashboardTab({ tables, bills, occupied, activeOrders, activeStaff, menuItems }) {
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

function StatCard({ icon, label, value, color }) {
  return (
    <div className="admin-card" style={{ borderTop: `3px solid ${color}` }}>
      <div style={{ fontSize: '2rem', marginBottom: '8px' }}>{icon}</div>
      <div style={{ fontSize: '1.8rem', fontWeight: 800, color, fontFamily: 'Outfit, sans-serif' }}>{value}</div>
      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>{label}</div>
    </div>
  );
}

// ──────────────────────────────────────────────────────
// DEPARTMENTS TAB
// ──────────────────────────────────────────────────────
function DepartmentsTab({ departments, setDepartments, employees, deptOrders }) {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: '', nameEn: '', image: '', color: '#e67e22', description: '', workHours: '' });

  const getDeptEmployeeCount = (deptId) => employees.filter(e => e.role === deptId).length;
  const getDeptActiveOrders = (deptId) => Object.values(deptOrders).filter(o =>
    (o.items || []).some(i => i.department === deptId && i.status !== 'delivered')
  ).length;

  const resetForm = () => { setForm({ name: '', nameEn: '', image: '', color: '#e67e22', description: '', workHours: '' }); setEditId(null); };

  const handleSave = () => {
    if (!form.name.trim()) return;
    let updated;
    if (editId) {
      updated = departments.map(d => d.id === editId ? { ...d, ...form } : d);
    } else {
      updated = [...departments, { ...form, id: `dept-${Date.now()}`, activeOrders: 0, lastOrderAt: null }];
    }
    saveDepartments(updated);
    setDepartments(updated);
    setShowForm(false);
    resetForm();
    addNotification(editId ? 'تم تعديل القسم' : 'تم إضافة القسم', `القسم ${form.name} تم ${editId ? 'تعديله' : 'إضافته'} بنجاح`, 'success');
  };

  const handleEdit = (dept) => {
    setForm({ name: dept.name, nameEn: dept.nameEn || '', image: dept.image || '', color: dept.color, description: dept.description || '', workHours: dept.workHours || '' });
    setEditId(dept.id);
    setShowForm(true);
  };

  const handleDelete = (dept) => {
    if (!confirm(`حذف قسم "${dept.name}"؟`)) return;
    const updated = departments.filter(d => d.id !== dept.id);
    saveDepartments(updated);
    setDepartments(updated);
    addNotification('حذف قسم', `تم حذف قسم ${dept.name}`, 'warning');
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 className="tab-title" style={{ margin: 0 }}>🏢 إدارة الأقسام</h2>
        <button className="btn-primary-gold" onClick={() => { resetForm(); setShowForm(true); }}>+ إضافة قسم</button>
      </div>

      {showForm && (
        <div className="admin-card" style={{ marginBottom: '24px', borderColor: 'var(--color-primary)' }}>
          <h3 className="card-title">{editId ? 'تعديل القسم' : 'قسم جديد'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
            <div className="form-group">
              <label className="form-label">اسم القسم (عربي)</label>
              <input className="form-input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="مثال: المطبخ" />
            </div>
            <div className="form-group">
              <label className="form-label">اسم القسم (إنجليزي)</label>
              <input className="form-input" value={form.nameEn} onChange={e => setForm(p => ({ ...p, nameEn: e.target.value }))} placeholder="Kitchen" />
            </div>
            <div className="form-group">
              <label className="form-label">صورة القسم (رابط أو ملف حتى 20 ميجا)</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input className="form-input" value={form.image} onChange={e => setForm(p => ({ ...p, image: e.target.value }))} placeholder="رابط صورة القسم (URL)" style={{ flex: 1 }} />
                <label className="btn-secondary" style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '0 12px', borderRadius: '8px', fontSize: '0.85rem' }}>
                  <span>📁 رفع</span>
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
                    const file = e.target.files[0];
                    if (!file) return;
                    if (file.size > 20 * 1024 * 1024) {
                      alert('حجم الصورة يجب أن لا يتجاوز 20 ميجابايت');
                      return;
                    }
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      setForm(p => ({ ...p, image: ev.target.result }));
                    };
                    reader.readAsDataURL(file);
                  }} />
                </label>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">اللون</label>
              <input type="color" value={form.color} onChange={e => setForm(p => ({ ...p, color: e.target.value }))} style={{ width: '100%', height: '44px', borderRadius: '10px', border: '1px solid var(--border-light)', cursor: 'pointer' }} />
            </div>
            <div className="form-group">
              <label className="form-label">وصف القسم</label>
              <input className="form-input" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="وصف اختياري" />
            </div>
            <div className="form-group">
              <label className="form-label">ساعات العمل</label>
              <input className="form-input" value={form.workHours} onChange={e => setForm(p => ({ ...p, workHours: e.target.value }))} placeholder="08:00 - 23:00" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            <button className="btn-primary-gold" onClick={handleSave}>{editId ? 'حفظ التعديلات' : 'إضافة القسم'}</button>
            <button className="btn-secondary" onClick={() => { setShowForm(false); resetForm(); }}>إلغاء</button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
        {departments.map(dept => (
          <div key={dept.id} className="admin-card dept-card" style={{ borderTop: `4px solid ${dept.color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                {renderItemImage(dept.image, dept.name, false, 'dept')}
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{dept.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{dept.nameEn}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button className="icon-btn" onClick={() => handleEdit(dept)} title="تعديل">✏️</button>
                <button className="icon-btn danger" onClick={() => handleDelete(dept)} title="حذف">🗑️</button>
              </div>
            </div>
            {dept.description && <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '12px' }}>{dept.description}</p>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '12px' }}>
              <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
                <div style={{ fontWeight: 700, color: dept.color }}>{getDeptEmployeeCount(dept.id)}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>موظفين</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
                <div style={{ fontWeight: 700, color: '#f39c12' }}>{getDeptActiveOrders(dept.id)}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>طلبات نشطة</div>
              </div>
            </div>
            {dept.workHours && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '8px' }}>⏰ {dept.workHours}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

const renderItemImage = (image, name, isCard = false, placeholderType = 'money') => {
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
      {placeholderType === 'dept' ? (
        <svg width={isCard ? 24 : 16} height={isCard ? 24 : 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
          <line x1="9" y1="22" x2="9" y2="16" />
          <line x1="15" y1="22" x2="15" y2="16" />
          <line x1="9" y1="16" x2="15" y2="16" />
        </svg>
      ) : (
        <svg width={isCard ? 24 : 16} height={isCard ? 24 : 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v20" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      )}
    </div>
  );
};

// ──────────────────────────────────────────────────────
// MENU TAB
// ──────────────────────────────────────────────────────
function MenuTab({ menuItems, setMenuItems, departments }) {
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('all');
  const [filterCat, setFilterCat] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const emptyForm = { nameAr: '', nameEn: '', description: '', price: '', category: 'mains', department: 'kitchen', image: '', available: true, prepTime: 15 };
  const [form, setForm] = useState(emptyForm);

  const filtered = menuItems.filter(item => {
    const matchSearch = item.name?.includes(search) || item.nameAr?.includes(search) || item.nameEn?.toLowerCase().includes(search.toLowerCase());
    const matchDept = filterDept === 'all' || item.department === filterDept;
    const matchCat = filterCat === 'all' || item.category === filterCat;
    return matchSearch && matchDept && matchCat;
  });

  const handleSave = () => {
    if (!form.nameAr || !form.price) return;
    const item = {
      ...form,
      name: form.nameAr,
      price: parseFloat(form.price) || 0,
      id: editId || `item-${Date.now()}`
    };
    let updated;
    if (editId) {
      updated = menuItems.map(m => m.id === editId ? item : m);
    } else {
      updated = [...menuItems, item];
    }
    saveMenu(updated);
    setMenuItems(updated);
    setShowForm(false);
    setEditId(null);
    setForm(emptyForm);
    addNotification(editId ? 'تعديل صنف' : 'إضافة صنف', `تم ${editId ? 'تعديل' : 'إضافة'} ${form.nameAr}`, 'success');
  };

  const handleEdit = (item) => {
    setForm({ nameAr: item.nameAr || item.name, nameEn: item.nameEn || '', description: item.description || '', price: item.price.toString(), category: item.category, department: item.department, image: item.image || '🍽️', available: item.available !== false, prepTime: item.prepTime || 15 });
    setEditId(item.id);
    setShowForm(true);
  };

  const handleDelete = (item) => {
    if (!confirm(`حذف "${item.name || item.nameAr}"؟`)) return;
    const updated = menuItems.filter(m => m.id !== item.id);
    saveMenu(updated);
    setMenuItems(updated);
    addNotification('حذف صنف', `تم حذف ${item.name}`, 'warning');
  };

  const toggleAvailable = (itemId) => {
    const updated = menuItems.map(m => m.id === itemId ? { ...m, available: !m.available } : m);
    saveMenu(updated);
    setMenuItems(updated);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 className="tab-title" style={{ margin: 0 }}>🍽️ إدارة المنيو</h2>
        <button className="btn-primary-gold" onClick={() => { setForm(emptyForm); setEditId(null); setShowForm(true); }}>+ إضافة صنف</button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <input className="form-input" placeholder="🔍 بحث..." value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, minWidth: '200px' }} />
        <select className="form-input" value={filterDept} onChange={e => setFilterDept(e.target.value)} style={{ flex: '0 0 auto' }}>
          <option value="all">كل الأقسام</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select className="form-input" value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{ flex: '0 0 auto' }}>
          <option value="all">كل الفئات</option>
          {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {showForm && (
        <div className="admin-card" style={{ marginBottom: '24px', borderColor: 'var(--color-primary)' }}>
          <h3 className="card-title">{editId ? 'تعديل الصنف' : 'صنف جديد'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
            <div className="form-group">
              <label className="form-label">الاسم (عربي) *</label>
              <input className="form-input" value={form.nameAr} onChange={e => setForm(p => ({ ...p, nameAr: e.target.value }))} placeholder="برغر كلاسيكي" />
            </div>
            <div className="form-group">
              <label className="form-label">الاسم (إنجليزي)</label>
              <input className="form-input" value={form.nameEn} onChange={e => setForm(p => ({ ...p, nameEn: e.target.value }))} placeholder="Classic Burger" />
            </div>
            <div className="form-group">
              <label className="form-label">السعر (₪) *</label>
              <input type="number" className="form-input" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} placeholder="8" />
            </div>
            <div className="form-group">
              <label className="form-label">القسم</label>
              <select className="form-input" value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))}>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">الفئة</label>
              <select className="form-input" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">صورة الصنف (رابط أو ملف حتى 20 ميجا)</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input className="form-input" value={form.image} onChange={e => setForm(p => ({ ...p, image: e.target.value }))} placeholder="رابط صورة الصنف (URL)" style={{ flex: 1 }} />
                <label className="btn-secondary" style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '0 12px', borderRadius: '8px', fontSize: '0.85rem' }}>
                  <span>📁 رفع</span>
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
                    const file = e.target.files[0];
                    if (!file) return;
                    if (file.size > 20 * 1024 * 1024) {
                      alert('حجم الصورة يجب أن لا يتجاوز 20 ميجابايت');
                      return;
                    }
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      setForm(p => ({ ...p, image: ev.target.result }));
                    };
                    reader.readAsDataURL(file);
                  }} />
                </label>
              </div>
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">وصف الصنف</label>
              <input className="form-input" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="وصف مختصر للصنف" />
            </div>
            <div className="form-group">
              <label className="form-label">وقت التحضير (دقيقة)</label>
              <input type="number" className="form-input" value={form.prepTime} onChange={e => setForm(p => ({ ...p, prepTime: parseInt(e.target.value) || 15 }))} />
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingTop: '24px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                <input type="checkbox" checked={form.available} onChange={e => setForm(p => ({ ...p, available: e.target.checked }))} style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)' }} />
                متوفر للطلب
              </label>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            <button className="btn-primary-gold" onClick={handleSave}>{editId ? 'حفظ' : 'إضافة'}</button>
            <button className="btn-secondary" onClick={() => { setShowForm(false); setEditId(null); }}>إلغاء</button>
          </div>
        </div>
      )}

      {/* Menu table */}
      <div className="admin-card">
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>الصنف</th>
                <th>السعر</th>
                <th>القسم</th>
                <th>الفئة</th>
                <th>الحالة</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item.id}>
                  <td>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      {renderItemImage(item.image, item.nameAr || item.name, false)}
                      <div>
                        <div style={{ fontWeight: 600 }}>{item.nameAr || item.name}</div>
                        {item.nameEn && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.nameEn}</div>}
                      </div>
                    </div>
                  </td>
                  <td><span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, color: 'var(--color-primary)' }}>{item.price} ₪</span></td>
                  <td><span className="role-badge" style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)' }}>{departments.find(d => d.id === item.department)?.name || item.department}</span></td>
                  <td>{CATEGORY_LABELS[item.category] || item.category}</td>
                  <td>
                    <button onClick={() => toggleAvailable(item.id)} style={{ padding: '4px 10px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', background: item.available ? '#27ae6022' : '#e74c3c22', color: item.available ? '#27ae60' : '#e74c3c' }}>
                      {item.available ? '✅ متوفر' : '❌ غير متوفر'}
                    </button>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="icon-btn" onClick={() => handleEdit(item)}>✏️</button>
                      <button className="icon-btn danger" onClick={() => handleDelete(item)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>لا توجد أصناف مطابقة للبحث</div>}
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────
// TABLES TAB
// ──────────────────────────────────────────────────────
function TablesTab({ tables, setTables }) {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const emptyForm = { number: '', seats: 4, area: 'indoor', description: '' };
  const [form, setForm] = useState(emptyForm);
  const [selected, setSelected] = useState(null);

  const handleSave = () => {
    const num = parseInt(form.number);
    if (!num) return;
    if (!editId && tables.find(t => t.id === num)) { alert('رقم الطاولة موجود مسبقاً'); return; }
    let updated;
    if (editId) {
      updated = tables.map(t => t.id === editId ? { ...t, seats: form.seats, area: form.area, description: form.description } : t);
    } else {
      updated = [...tables, { id: num, name: `طاولة ${num}`, seats: form.seats, area: form.area, description: form.description, status: 'empty', currentOrder: [], notes: '', subtotal: 0, tax: 0, serviceCharge: 0, total: 0, waiterCode: null, seatedAt: null, guests: 0 }];
      updated.sort((a, b) => a.id - b.id);
    }
    saveTables(updated);
    setTables(updated);
    setShowForm(false);
    setEditId(null);
    setForm(emptyForm);
    addNotification('طاولات', editId ? `تم تعديل طاولة ${editId}` : `تمت إضافة طاولة ${num}`, 'success');
  };

  const handleDelete = (t) => {
    if (t.status !== 'empty') { alert('لا يمكن حذف طاولة مشغولة'); return; }
    if (!confirm(`حذف ${t.name}؟`)) return;
    const updated = tables.filter(tt => tt.id !== t.id);
    saveTables(updated);
    setTables(updated);
    addNotification('طاولات', `تم حذف ${t.name}`, 'warning');
  };

  const handleStatusChange = (tableId, newStatus) => {
    const updated = tables.map(t => t.id === tableId ? { ...t, status: newStatus } : t);
    saveTables(updated);
    setTables(updated);
    if (newStatus === 'unavailable') {
      addNotification(
        `⚠️ الطاولة #${tableId} معطوبة - لا تقبل طلبات`,
        `تم تحويل حالة الطاولة إلى غير متوفرة`,
        'danger',
        ['manager', 'waiter']
      );
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 className="tab-title" style={{ margin: 0 }}>🪑 إدارة الطاولات</h2>
        <button className="btn-primary-gold" onClick={() => { setForm(emptyForm); setEditId(null); setShowForm(true); }}>+ إضافة طاولة</button>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {Object.entries(STATUS_LABELS).map(([k, v]) => (
          <div key={k} style={{ display: 'flex', gap: '6px', alignItems: 'center', fontSize: '0.82rem' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: STATUS_COLORS[k], display: 'inline-block' }} />
            {v}
          </div>
        ))}
      </div>

      {showForm && (
        <div className="admin-card" style={{ marginBottom: '24px', borderColor: 'var(--color-primary)' }}>
          <h3 className="card-title">{editId ? `تعديل طاولة ${editId}` : 'طاولة جديدة'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginTop: '16px' }}>
            {!editId && (
              <div className="form-group">
                <label className="form-label">رقم الطاولة *</label>
                <input type="number" className="form-input" value={form.number} onChange={e => setForm(p => ({ ...p, number: e.target.value }))} placeholder="16" />
              </div>
            )}
            <div className="form-group">
              <label className="form-label">عدد المقاعد</label>
              <select className="form-input" value={form.seats} onChange={e => setForm(p => ({ ...p, seats: parseInt(e.target.value) }))}>
                {[2, 4, 6, 8, 10, 12].map(n => <option key={n} value={n}>{n} مقاعد</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">المنطقة</label>
              <select className="form-input" value={form.area} onChange={e => setForm(p => ({ ...p, area: e.target.value }))}>
                {Object.entries(AREA_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            <button className="btn-primary-gold" onClick={handleSave}>{editId ? 'حفظ' : 'إضافة'}</button>
            <button className="btn-secondary" onClick={() => { setShowForm(false); setEditId(null); }}>إلغاء</button>
          </div>
        </div>
      )}

      {/* Tables grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px' }}>
        {tables.map(t => (
          <div key={t.id} onClick={() => setSelected(selected?.id === t.id ? null : t)}
            className="table-card-admin"
            style={{ borderTop: `4px solid ${STATUS_COLORS[t.status] || '#555'}`, cursor: 'pointer', background: selected?.id === t.id ? 'rgba(212,175,55,0.08)' : 'var(--bg-surface-glass)' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, fontFamily: 'Outfit, sans-serif' }}>{t.id}</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{t.name}</div>
            <div style={{ fontSize: '0.75rem', color: STATUS_COLORS[t.status], fontWeight: 600, marginTop: '4px' }}>{STATUS_LABELS[t.status]}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>🪑 {t.seats} | {AREA_LABELS[t.area]}</div>
            {t.total > 0 && <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, color: 'var(--color-primary)', fontSize: '0.85rem', marginTop: '4px' }}>{t.total.toFixed(2)} ₪</div>}
          </div>
        ))}
      </div>

      {/* Selected table details */}
      {selected && (
        <div className="admin-card" style={{ marginTop: '24px', borderColor: 'var(--color-primary)' }}>
          <h3 className="card-title">{selected.name} - تفاصيل</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '12px', fontSize: '0.85rem' }}>
            <div><span style={{ color: 'var(--text-muted)' }}>الحالة: </span><strong>{STATUS_LABELS[selected.status]}</strong></div>
            <div><span style={{ color: 'var(--text-muted)' }}>المقاعد: </span><strong>{selected.seats}</strong></div>
            <div><span style={{ color: 'var(--text-muted)' }}>المنطقة: </span><strong>{AREA_LABELS[selected.area]}</strong></div>
            {selected.waiterCode && <div><span style={{ color: 'var(--text-muted)' }}>الجرسون: </span><strong>{selected.waiterCode}</strong></div>}
            {selected.total > 0 && <div><span style={{ color: 'var(--text-muted)' }}>الإجمالي: </span><strong style={{ color: 'var(--color-primary)' }}>{selected.total.toFixed(2)} ₪</strong></div>}
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
            <button className="icon-btn" onClick={() => { setForm({ number: selected.id, seats: selected.seats, area: selected.area, description: selected.description || '' }); setEditId(selected.id); setShowForm(true); setSelected(null); }}>✏️ تعديل</button>
            {selected.status === 'empty' && <button className="icon-btn danger" onClick={() => handleDelete(selected)}>🗑️ حذف</button>}
            <select className="form-input" style={{ flex: '0 0 auto' }} value={selected.status} onChange={e => { handleStatusChange(selected.id, e.target.value); setSelected(p => ({ ...p, status: e.target.value })); }}>
              {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────
// STAFF TAB
// ──────────────────────────────────────────────────────
function StaffTab({ employees, setEmployees }) {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const emptyForm = { name: '', username: '', password: '1234', role: 'waiter', phone: '', email: '', salary: '', active: true };
  const [form, setForm] = useState(emptyForm);

  const nonManagers = employees.filter(e => e.role !== 'manager');

  const handleSave = () => {
    if (!form.name || !form.username) return;
    if (!editId && employees.find(e => e.username === form.username)) { alert('اسم المستخدم موجود مسبقاً'); return; }
    const PREFIXES = { waiter: 'W', cashier: 'C', kitchen: 'K', bar: 'B', shisha: 'S', manager: 'M' };
    const code = editId ? employees.find(e => e.id === editId)?.code : `${PREFIXES[form.role] || 'E'}-${Math.floor(1000 + Math.random() * 9000)}`;
    const emp = { id: editId || `emp-${Date.now()}`, ...form, code, salary: parseFloat(form.salary) || 0, lastLogin: null };
    let updated;
    if (editId) {
      updated = employees.map(e => e.id === editId ? { ...e, ...emp } : e);
    } else {
      updated = [...employees, emp];
    }
    saveEmployees(updated);
    setEmployees(updated);
    setShowForm(false);
    setEditId(null);
    setForm(emptyForm);
    addNotification('موظف', editId ? `تم تعديل ${form.name}` : `تمت إضافة ${form.name} (${form.username})`, 'success');
  };

  const toggleActive = (emp) => {
    const updated = employees.map(e => e.id === emp.id ? { ...e, active: !e.active } : e);
    saveEmployees(updated);
    setEmployees(updated);
    addNotification('موظف', `${emp.active ? 'تعطيل' : 'تفعيل'} ${emp.name}`, 'info');
  };

  const handleDelete = (emp) => {
    if (!confirm(`حذف ${emp.name}؟`)) return;
    const updated = employees.filter(e => e.id !== emp.id);
    saveEmployees(updated);
    setEmployees(updated);
    addNotification('موظف', `تم حذف ${emp.name}`, 'warning');
  };

  const handleEdit = (emp) => {
    setForm({ name: emp.name, username: emp.username, password: emp.password, role: emp.role, phone: emp.phone || '', email: emp.email || '', salary: emp.salary?.toString() || '', active: emp.active });
    setEditId(emp.id);
    setShowForm(true);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 className="tab-title" style={{ margin: 0 }}>👥 إدارة الموظفين</h2>
        <button className="btn-primary-gold" onClick={() => { setForm(emptyForm); setEditId(null); setShowForm(true); }}>+ موظف جديد</button>
      </div>

      {showForm && (
        <div className="admin-card" style={{ marginBottom: '24px', borderColor: 'var(--color-primary)' }}>
          <h3 className="card-title">{editId ? 'تعديل موظف' : 'موظف جديد'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
            <div className="form-group">
              <label className="form-label">الاسم الكامل *</label>
              <input className="form-input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="محمد علي" />
            </div>
            <div className="form-group">
              <label className="form-label">اسم المستخدم *</label>
              <input className="form-input" value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))} placeholder="waiter2" />
            </div>
            <div className="form-group">
              <label className="form-label">كلمة المرور</label>
              <input className="form-input" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="1234" />
            </div>
            <div className="form-group">
              <label className="form-label">الدور</label>
              <select className="form-input" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                <option value="waiter">جرسون</option>
                <option value="cashier">محاسب</option>
                <option value="kitchen">مطبخ</option>
                <option value="bar">بار</option>
                <option value="shisha">شيشة</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">رقم الهاتف</label>
              <input className="form-input" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="079XXXXXXX" />
            </div>
            <div className="form-group">
              <label className="form-label">البريد الإلكتروني</label>
              <input type="email" className="form-input" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="emp@taka.com" />
            </div>
            <div className="form-group">
              <label className="form-label">الراتب (₪)</label>
              <input type="number" className="form-input" value={form.salary} onChange={e => setForm(p => ({ ...p, salary: e.target.value }))} placeholder="500" />
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingTop: '24px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                <input type="checkbox" checked={form.active} onChange={e => setForm(p => ({ ...p, active: e.target.checked }))} style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)' }} />
                نشط
              </label>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            <button className="btn-primary-gold" onClick={handleSave}>{editId ? 'حفظ' : 'إضافة'}</button>
            <button className="btn-secondary" onClick={() => { setShowForm(false); setEditId(null); }}>إلغاء</button>
          </div>
        </div>
      )}

      <div className="admin-card">
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>الموظف</th>
                <th>اسم المستخدم</th>
                <th>الدور</th>
                <th>كود الدخول</th>
                <th>الحالة</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {nonManagers.map(emp => (
                <tr key={emp.id}>
                  <td>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: `${ROLE_COLORS[emp.role]}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: ROLE_COLORS[emp.role] }}>{emp.name?.charAt(0)}</div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{emp.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{emp.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td><code style={{ fontSize: '0.85rem', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px' }}>{emp.username}</code></td>
                  <td><span className="role-badge" style={{ background: `${ROLE_COLORS[emp.role]}22`, color: ROLE_COLORS[emp.role], border: `1px solid ${ROLE_COLORS[emp.role]}44` }}>{ROLE_LABELS[emp.role]}</span></td>
                  <td><code style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--color-primary)' }}>{emp.code}</code></td>
                  <td>
                    <button onClick={() => toggleActive(emp)} style={{ padding: '4px 10px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.78rem', background: emp.active ? '#27ae6022' : '#e74c3c22', color: emp.active ? '#27ae60' : '#e74c3c' }}>
                      {emp.active ? '✅ نشط' : '❌ معطل'}
                    </button>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="icon-btn" onClick={() => handleEdit(emp)}>✏️</button>
                      <button className="icon-btn danger" onClick={() => handleDelete(emp)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────
// INVITE CODES TAB
// ──────────────────────────────────────────────────────
function CodesTab({ codes, setCodes }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(t);
  }, []);

  const [newRole, setNewRole] = useState('waiter');
  const [newLabel, setNewLabel] = useState('');
  const [generatedCode, setGeneratedCode] = useState(null);
  const [copySuccess, setCopySuccess] = useState('');
  const [expireDays, setExpireDays] = useState(null); // default to null (permanent)

  const handleGenerate = () => {
    if (!newLabel.trim()) { alert('أدخل اسم للموظف'); return; }
    const expiresAt = expireDays ? (Date.now() + expireDays * 24 * 60 * 60 * 1000) : null;
    const code = createCode({ label: newLabel.trim(), allowedRoles: [newRole], expiresAt });
    setCodes(getCodes());
    setGeneratedCode(code);
    addNotification('كود دعوة', `تم إنشاء كود لـ ${newLabel} (${ROLE_LABELS[newRole]})`, 'success');
    setNewLabel('');
  };

  const handleRevoke = (codeId) => {
    revokeCode(codeId);
    setCodes(getCodes());
    addNotification('كود دعوة', 'تم إلغاء الكود', 'warning');
  };

  const handleDelete = (codeId) => {
    if (!confirm('حذف الكود نهائياً؟')) return;
    deleteCode(codeId);
    setCodes(getCodes());
  };

  const copyCode = (codeStr) => {
    navigator.clipboard.writeText(codeStr).then(() => {
      setCopySuccess(codeStr);
      setTimeout(() => setCopySuccess(''), 2000);
    });
  };

  const isExpired = (code) => code.expiresAt && code.expiresAt < now;
  const daysLeft = (code) => {
    if (!code.expiresAt) return '∞';
    const ms = code.expiresAt - now;
    if (ms <= 0) return 'منتهي';
    return `${Math.ceil(ms / 86400000)} يوم`;
  };

  return (
    <div>
      <h2 className="tab-title">🔑 أكواد الدعوة للموظفين</h2>

      {/* Generate form */}
      <div className="admin-card" style={{ marginBottom: '24px' }}>
        <h3 className="card-title">إنشاء كود دعوة جديد</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr) auto', gap: '12px', alignItems: 'end', marginTop: '16px' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">اسم الموظف</label>
            <input className="form-input" value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="محمد جرسون" />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">الدور</label>
            <select className="form-input" value={newRole} onChange={e => setNewRole(e.target.value)}>
              <option value="waiter">جرسون</option>
              <option value="cashier">محاسب</option>
              <option value="kitchen">مطبخ</option>
              <option value="bar">بار</option>
              <option value="shisha">شيشة</option>
            </select>
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">الصلاحية</label>
            <select className="form-input" value={expireDays || ''} onChange={e => setExpireDays(e.target.value ? parseInt(e.target.value) : null)}>
              <option value="">دائم (لا تنتهي)</option>
              <option value={1}>يوم واحد</option>
              <option value={3}>3 أيام</option>
              <option value={7}>7 أيام</option>
              <option value={30}>30 يوم</option>
            </select>
          </div>
          <button className="btn-primary-gold" onClick={handleGenerate} style={{ height: '44px' }}>+ إنشاء كود</button>
        </div>

        {generatedCode && (
          <div style={{ marginTop: '20px', padding: '20px', background: 'rgba(39,174,96,0.08)', border: '1px solid rgba(39,174,96,0.3)', borderRadius: '12px' }}>
            <div style={{ color: '#27ae60', fontWeight: 700, marginBottom: '12px' }}>✅ تم إنشاء الكود بنجاح!</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <code style={{ fontSize: '1.4rem', fontFamily: 'Outfit, sans-serif', letterSpacing: '3px', color: 'var(--color-primary)', background: 'rgba(0,0,0,0.2)', padding: '8px 16px', borderRadius: '8px', direction: 'ltr' }}>{generatedCode.code}</code>
              <button className="btn-primary-gold" onClick={() => copyCode(generatedCode.code)}>{copySuccess === generatedCode.code ? '✅ تم النسخ' : '📋 نسخ'}</button>
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              للموظف: <strong>{generatedCode.label}</strong> | الدور: <strong>{ROLE_LABELS[generatedCode.allowedRoles?.[0]]}</strong> | الصلاحية: <strong>{daysLeft(generatedCode)}</strong>
            </div>
          </div>
        )}
      </div>

      {/* Codes list */}
      <div className="admin-card">
        <h3 className="card-title">الأكواد المنشأة ({codes.length})</h3>
        {codes.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', marginTop: '12px' }}>لم يتم إنشاء أكواد بعد</p>
        ) : (
          <div style={{ display: 'grid', gap: '12px', marginTop: '16px' }}>
            {codes.map(code => (
              <div key={code.id} className="admin-card" style={{ padding: '16px', borderRight: `3px solid ${code.revoked || isExpired(code) ? '#e74c3c' : '#27ae60'}`, opacity: code.revoked || isExpired(code) ? 0.65 : 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <div style={{ fontWeight: 700, marginBottom: '4px' }}>{code.label}</div>
                    <code style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.1rem', letterSpacing: '2px', color: 'var(--color-primary)', direction: 'ltr', display: 'block' }}>{code.code}</code>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      الدور: <span style={{ color: ROLE_COLORS[code.allowedRoles?.[0]] }}>{ROLE_LABELS[code.allowedRoles?.[0]] || code.allowedRoles?.[0]}</span>
                      {' | '}صلاحية: <strong>{daysLeft(code)}</strong>
                      {code.revoked && <span style={{ color: '#e74c3c' }}> | ملغى</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {!code.revoked && !isExpired(code) && (
                      <button className="icon-btn" onClick={() => copyCode(code.code)} title="نسخ الكود">{copySuccess === code.code ? '✅' : '📋'}</button>
                    )}
                    {!code.revoked && !isExpired(code) && (
                      <button className="icon-btn" onClick={() => handleRevoke(code.id)} title="إلغاء الكود">🚫</button>
                    )}
                    <button className="icon-btn danger" onClick={() => handleDelete(code.id)} title="حذف">🗑️</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────
// PERMISSIONS TAB
// ──────────────────────────────────────────────────────
function PermissionsTab() {
  const roles = ['manager', 'waiter', 'cashier', 'kitchen', 'bar', 'shisha'];
  return (
    <div>
      <h2 className="tab-title">🔐 جدول الصلاحيات</h2>
      <div className="admin-card">
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table permissions-table">
            <thead>
              <tr>
                <th>الصلاحية</th>
                {roles.map(r => (
                  <th key={r}>
                    <span className="role-badge" style={{ background: `${ROLE_COLORS[r]}22`, color: ROLE_COLORS[r], border: `1px solid ${ROLE_COLORS[r]}44` }}>{ROLE_LABELS[r]}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMISSIONS.map(perm => (
                <tr key={perm.key}>
                  <td style={{ fontWeight: 600 }}>{perm.label}</td>
                  {roles.map(r => (
                    <td key={r} style={{ textAlign: 'center' }}>
                      <span style={{ fontSize: '1.2rem' }}>{perm[r] ? '✅' : '❌'}</span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────
// REPORTS TAB
// ──────────────────────────────────────────────────────
function ReportsTab({ bills, menuItems, tables }) {
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

// ──────────────────────────────────────────────────────
// BILLS TAB
// ──────────────────────────────────────────────────────
function BillsTab({ bills }) {
  const [selected, setSelected] = useState(null);

  const printBill = (bill) => {
    const w = window.open('', '', 'width=400,height=600');
    w.document.write(`<html><head><title>فاتورة - ${bill.tableName}</title>
    <style>body{font-family:Arial;direction:rtl;padding:20px;text-align:right}
    h2{text-align:center}.row{display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px dashed #ccc}
    .total{font-weight:bold;font-size:1.2em;border-top:2px solid #000;margin-top:8px;padding-top:8px}
    </style></head><body>
    <h2>🍽️ تكة | TAKA</h2>
    <p style="text-align:center">${bill.tableName} | ${bill.timeFormatted} | ${bill.dateFormatted}</p>
    <hr>
    ${(bill.items || []).map(item => `<div class="row"><span>${item.name} × ${item.qty}</span><span>${(item.price * item.qty).toFixed(2)} ₪</span></div>`).join('')}
    <div class="row total"><span>الإجمالي النهائي:</span><span>${(bill.total || 0).toFixed(2)} ₪</span></div>
    <p style="text-align:center;margin-top:20px">شكراً لزيارتكم 🙏</p>
    </body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 300);
  };

  const PAYMENT_LABELS = { cash: 'نقد', card: 'بطاقة', bank: 'تحويل بنكي', other: 'أخرى' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 className="tab-title" style={{ margin: 0 }}>🧾 الفواتير المكتملة ({bills.length})</h2>
        <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, color: '#27ae60', fontSize: '1.1rem' }}>
          الإجمالي: {bills.reduce((s, b) => s + (b.total || 0), 0).toFixed(2)} ₪
        </div>
      </div>

      <div className="admin-card">
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>رقم الفاتورة</th>
                <th>الطاولة</th>
                <th>الإجمالي</th>
                <th>طريقة الدفع</th>
                <th>الوقت</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {[...bills].reverse().map(bill => (
                <tr key={bill.id}>
                  <td><code style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--color-primary)' }}>{bill.id}</code></td>
                  <td>{bill.tableName}</td>
                  <td><strong style={{ color: '#27ae60', fontFamily: 'Outfit, sans-serif' }}>{(bill.total || 0).toFixed(2)} ₪</strong></td>
                  <td>{PAYMENT_LABELS[bill.paymentMethod] || bill.paymentMethod || 'نقد'}</td>
                  <td style={{ fontFamily: 'Outfit, sans-serif', fontSize: '0.85rem' }}>{bill.timeFormatted}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="icon-btn" onClick={() => setSelected(bill)} title="تفاصيل">👁️</button>
                      <button className="icon-btn" onClick={() => printBill(bill)} title="طباعة">🖨️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {bills.length === 0 && <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>لا توجد فواتير مكتملة بعد</div>}
        </div>
      </div>

      {/* Bill detail modal */}
      {selected && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setSelected(null); }}>
          <div className="modal-content glass-card">
            <div className="modal-header">
              <h3 className="modal-title">فاتورة {selected.tableName}</h3>
              <button className="modal-close" onClick={() => setSelected(null)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.85rem', marginBottom: '16px' }}>
                <div>رقم: <strong style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--color-primary)' }}>{selected.id}</strong></div>
                <div>الوقت: <strong>{selected.timeFormatted}</strong></div>
                <div>الجرسون: <strong>{selected.waiterCode}</strong></div>
                <div>الكاشير: <strong>{selected.cashierCode}</strong></div>
              </div>
              {(selected.items || []).map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-light)' }}>
                  <span>{item.name} × {item.qty}</span>
                  <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600 }}>{(item.price * item.qty).toFixed(2)} ₪</span>
                </div>
              ))}
              <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.9rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>المجموع الفرعي</span><span>{(selected.subtotal || 0).toFixed(2)} ₪</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>الضريبة (15%)</span><span>{(selected.tax || 0).toFixed(2)} ₪</span></div>
                {selected.serviceCharge > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>خدمة (10%)</span><span>{(selected.serviceCharge || 0).toFixed(2)} ₪</span></div>}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.1rem', color: '#27ae60', borderTop: '1px solid var(--border-light)', paddingTop: '8px', marginTop: '4px' }}>
                  <span>الإجمالي النهائي</span>
                  <span style={{ fontFamily: 'Outfit, sans-serif' }}>{(selected.total || 0).toFixed(2)} ₪</span>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-primary-gold" onClick={() => printBill(selected)}>🖨️ طباعة</button>
              <button className="btn-secondary" onClick={() => setSelected(null)}>إغلاق</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
