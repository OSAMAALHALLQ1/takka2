import React, { useState } from 'react';
import { getEmployees, saveEmployees, getBills, resetDailyData, addNotification } from '../utils/storage';
import { Users, BarChart3, Receipt, Plus, Clipboard, Trash2, Key, Link as LinkIcon, RefreshCw, FileSpreadsheet, DollarSign } from 'lucide-react';

export default function ManagerView({ tables, employeeList, onUpdateEmployees }) {
  const [activeSubTab, setActiveSubTab] = useState('dashboard'); // 'dashboard' | 'employees' | 'bills'
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpRole, setNewEmpRole] = useState('waiter'); // 'waiter' | 'cashier'
  const [newEmpPhone, setNewEmpPhone] = useState('');
  const [copySuccess, setCopySuccess] = useState('');

  // Daily Bills & Calculations
  const bills = getBills();
  const totalSalesToday = bills.reduce((sum, b) => sum + b.total, 0);
  const activeTablesCount = tables.filter((t) => t.status !== 'empty').length;

  // Add Employee and generate Code
  const handleAddEmployee = (e) => {
    e.preventDefault();
    if (!newEmpName || !newEmpPhone) return;

    const randomNum = Math.floor(1000 + Math.random() * 9000); // 4 digit code
    const prefix = newEmpRole === 'waiter' ? 'W' : 'C';
    const code = `${prefix}-${randomNum}`;

    const newEmp = {
      id: Date.now().toString(),
      name: newEmpName,
      role: newEmpRole,
      phone: newEmpPhone,
      code
    };

    const updatedEmployees = [...employeeList, newEmp];
    onUpdateEmployees(updatedEmployees);
    saveEmployees(updatedEmployees);

    addNotification(
      'موظف جديد 👥',
      `تمت إضافة الموظف ${newEmpName} بنجاح بكود: ${code}`,
      'info'
    );

    // Reset inputs
    setNewEmpName('');
    setNewEmpPhone('');
  };

  // Delete Employee
  const handleDeleteEmployee = (id, name) => {
    if (confirm(`هل أنت متأكد من حذف الموظف ${name}؟`)) {
      const updatedEmployees = employeeList.filter((emp) => emp.id !== id);
      onUpdateEmployees(updatedEmployees);
      saveEmployees(updatedEmployees);
      addNotification('حذف موظف 👤', `تم حذف الموظف ${name} من النظام`, 'warning');
    }
  };

  // Copy Direct Link
  const copyDirectLink = (code) => {
    const directUrl = `${window.location.origin}${window.location.pathname}?code=${code}`;
    navigator.clipboard.writeText(directUrl).then(() => {
      setCopySuccess(code);
      setTimeout(() => setCopySuccess(''), 2000);
    });
  };

  // Reset System (Clear sales/tables)
  const handleResetSystem = () => {
    if (confirm('تنبيه: هل أنت متأكد من تصفية جميع الطاولات وحذف فواتير اليوم بالكامل؟ لا يمكن التراجع عن هذا الإجراء.')) {
      resetDailyData();
      alert('تم إعادة ضبط النظام وصفر جميع العمليات اليومية بنجاح.');
      window.location.reload();
    }
  };

  return (
    <div>
      {/* Dashboard Nav Tabs */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px', marginBottom: '24px' }}>
        <button
          className={`btn ${activeSubTab === 'dashboard' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveSubTab('dashboard')}
          style={{ padding: '8px 16px', fontSize: '0.85rem' }}
        >
          <BarChart3 size={16} /> لوحة التحكم العامة
        </button>
        <button
          className={`btn ${activeSubTab === 'employees' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveSubTab('employees')}
          style={{ padding: '8px 16px', fontSize: '0.85rem' }}
        >
          <Users size={16} /> إدارة الموظفين والأكواد
        </button>
        <button
          className={`btn ${activeSubTab === 'bills' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveSubTab('bills')}
          style={{ padding: '8px 16px', fontSize: '0.85rem' }}
        >
          <FileSpreadsheet size={16} /> الفواتير اليومية والمبيعات
        </button>
        
        <button
          className="btn btn-danger"
          onClick={handleResetSystem}
          style={{ padding: '8px 16px', fontSize: '0.85rem', marginRight: 'auto' }}
        >
          <RefreshCw size={16} /> تصفية اليومية
        </button>
      </div>

      {/* 1. DASHBOARD OVERVIEW TAB */}
      {activeSubTab === 'dashboard' && (
        <div>
          {/* Stats cards */}
          <div className="stats-row">
            <div className="stat-card glass-card">
              <div className="stat-info">
                <span className="stat-title">مبيعات اليوم الإجمالية</span>
                <span className="stat-value num-font" style={{ color: 'var(--color-primary)' }}>
                  {totalSalesToday.toFixed(2)} د.أ
                </span>
              </div>
              <div className="stat-icon-wrapper">
                <DollarSign size={24} />
              </div>
            </div>

            <div className="stat-card glass-card">
              <div className="stat-info">
                <span className="stat-title">عدد الطاولات المشغولة</span>
                <span className="stat-value num-font">{activeTablesCount} / {tables.length}</span>
              </div>
              <div className="stat-icon-wrapper">
                <Receipt size={24} />
              </div>
            </div>

            <div className="stat-card glass-card">
              <div className="stat-info">
                <span className="stat-title">الموظفون المسجلون</span>
                <span className="stat-value num-font">{employeeList.length} موظفين</span>
              </div>
              <div className="stat-icon-wrapper">
                <Users size={24} />
              </div>
            </div>

            <div className="stat-card glass-card">
              <div className="stat-info">
                <span className="stat-title">فواتير تم تحصيلها</span>
                <span className="stat-value num-font">{bills.length} فاتورة</span>
              </div>
              <div className="stat-icon-wrapper">
                <FileSpreadsheet size={24} />
              </div>
            </div>
          </div>

          {/* Tables Overview Mini Grid */}
          <div className="glass-card" style={{ padding: '24px', marginBottom: '28px' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', fontWeight: '700' }}>مراقبة إشغال الصالة الفوري</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '12px' }}>
              {tables.map((t) => (
                <div
                  key={t.id}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border-light)',
                    borderRight: `4px solid ${
                      t.status === 'empty'
                        ? 'var(--status-empty)'
                        : t.status === 'eating'
                        ? 'var(--status-eating)'
                        : t.status === 'bill_requested'
                        ? 'var(--status-bill-requested)'
                        : 'var(--status-ordering)'
                    }`,
                    textAlign: 'center'
                  }}
                >
                  <div className="num-font" style={{ fontWeight: '700', fontSize: '1.1rem' }}>{t.id}</div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {t.status === 'empty' ? 'فارغة' : t.status === 'eating' ? 'يأكلون' : 'يطلب الحساب'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. EMPLOYEES DIRECTORY & LINK COPIES */}
      {activeSubTab === 'employees' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '24px' }}>
          
          {/* Add Employee Form (Left) */}
          <div className="glass-card" style={{ padding: '24px', height: 'fit-content' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '20px', fontWeight: '700' }}>إضافة موظف جديد</h3>
            
            <form onSubmit={handleAddEmployee}>
              <div className="form-group">
                <label>الاسم الكامل</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="مثال: محمد علي"
                  value={newEmpName}
                  onChange={(e) => setNewEmpName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>نوع الصلاحية / الدور</label>
                <select
                  className="form-input"
                  value={newEmpRole}
                  onChange={(e) => setNewEmpRole(e.target.value)}
                  style={{ background: 'var(--bg-surface)' }}
                >
                  <option value="waiter">نادل صالة (الطلبات والطاولات)</option>
                  <option value="cashier">كاشير محاسب (الفواتير والدفع)</option>
                </select>
              </div>

              <div className="form-group">
                <label>رقم الهاتف</label>
                <input
                  type="text"
                  className="form-input num-font"
                  placeholder="079XXXXXXX"
                  value={newEmpPhone}
                  onChange={(e) => setNewEmpPhone(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '12px' }}>
                <Plus size={16} /> إضافة الموظف وتوليد الكود
              </button>
            </form>
          </div>

          {/* Employees List with Codes (Right) */}
          <div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', fontWeight: '700' }}>الموظفون المسجلون حالياً</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {employeeList.map((emp) => (
                <div key={emp.id} className="glass-card employee-card">
                  <div className="employee-info-box">
                    <div className="employee-avatar">
                      {emp.role === 'waiter' ? '🍽️' : '💵'}
                    </div>
                    <div>
                      <h4 style={{ fontWeight: '700', fontSize: '0.95rem' }}>{emp.name}</h4>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        الدور: {emp.role === 'waiter' ? 'نادل صالة' : 'محاسب كاشير'} | هاتف: <span className="num-font">{emp.phone}</span>
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* Access code badge */}
                    <div
                      className="num-font"
                      style={{
                        padding: '6px 12px',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px dashed var(--border-light)',
                        borderRadius: '6px',
                        fontSize: '0.9rem',
                        fontWeight: '700',
                        color: 'var(--color-primary)'
                      }}
                    >
                      {emp.code}
                    </div>

                    {/* Copy Direct URL Link */}
                    <button
                      className="btn btn-secondary"
                      onClick={() => copyDirectLink(emp.code)}
                      style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                      title="نسخ رابط الدخول المباشر لإرساله للموظف"
                    >
                      {copySuccess === emp.code ? 'تم النسخ! ✅' : <><LinkIcon size={14} /> نسخ الرابط</>}
                    </button>

                    {/* Delete button */}
                    <button
                      className="btn btn-danger"
                      onClick={() => handleDeleteEmployee(emp.id, emp.name)}
                      style={{ padding: '6px 10px' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. DAILY BILLS REPORT */}
      {activeSubTab === 'bills' && (
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>أرشيف الفواتير اليومية المحصلة</h3>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              الإجمالي اليومي: <strong className="num-font" style={{ color: 'var(--color-primary)', fontSize: '1.1rem' }}>{totalSalesToday.toFixed(2)} د.أ</strong>
            </span>
          </div>

          {bills.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 10px', color: 'var(--text-muted)' }}>
              <Receipt size={36} style={{ marginBottom: '12px', opacity: 0.5 }} />
              <p style={{ fontSize: '0.85rem' }}>لا توجد فواتير مدفوعة لليوم بعد.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="takah-table">
                <thead>
                  <tr>
                    <th>رقم الفاتورة</th>
                    <th>الطاولة</th>
                    <th>الوقت</th>
                    <th>الكاشير</th>
                    <th>النادل المبادر</th>
                    <th>الطلبات</th>
                    <th>القيمة الكلية</th>
                  </tr>
                </thead>
                <tbody>
                  {bills.map((bill) => (
                    <tr key={bill.id}>
                      <td className="num-font" style={{ fontWeight: '700' }}>{bill.id}</td>
                      <td>{bill.tableName}</td>
                      <td className="num-font">{bill.timeFormatted}</td>
                      <td>{bill.cashierCode}</td>
                      <td className="num-font">{bill.waiterCode}</td>
                      <td style={{ maxWidth: '240px', fontSize: '0.8rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {bill.items.map((it) => `${it.name} (${it.qty})`).join('، ')}
                      </td>
                      <td className="num-font" style={{ fontWeight: '700', color: 'var(--color-primary)' }}>
                        {bill.total.toFixed(2)} د.أ
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
