import React, { useState } from 'react';
import { saveEmployees, addNotification } from '../../utils/storage';
import { ROLE_COLORS, ROLE_LABELS } from './constants';
import { Users, Check, X, Pencil, Trash2 } from 'lucide-react';

export default function StaffTab({ employees, setEmployees }) {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const emptyForm = { name: '', username: '', password: '1234', role: 'waiter', phone: '', email: '', salary: '', active: true };
  const [form, setForm] = useState(emptyForm);

  const nonManagers = employees.filter(e => e.role !== 'manager');

  const handleSave = () => {
    if (!form.name.trim()) { alert('يرجى إدخال الاسم الكامل'); return; }

    const cleanPhone = String(form.phone || '').trim();
    if (!cleanPhone) {
      alert('يرجى إدخال رقم الهاتف');
      return;
    }
    const phoneRegex = /^(059|056)\d{7}$/;
    if (!phoneRegex.test(cleanPhone)) {
      alert('رقم الهاتف يجب أن يبدأ بـ 059 أو 056 ويتكون من 10 أرقام');
      return;
    }

    const PREFIXES = { waiter: 'W', cashier: 'C', kitchen: 'K', bar: 'B', shisha: 'S', manager: 'M' };
    const code = editId ? employees.find(e => e.id === editId)?.code : `${PREFIXES[form.role] || 'E'}-${Math.floor(1000 + Math.random() * 9000)}`;
    const username = editId ? (employees.find(e => e.id === editId)?.username || code.toLowerCase()) : code.toLowerCase();

    const emp = {
      id: editId || `emp-${Date.now()}`,
      ...form,
      username,
      code,
      phone: cleanPhone,
      salary: parseFloat(form.salary) || 0,
      lastLogin: null
    };

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
    addNotification('موظف', editId ? `تم تعديل ${form.name}` : `تمت إضافة ${form.name}`, 'success');
  };

  const toggleActive = (emp) => {
    const updated = employees.map(e => e.id === emp.id ? { ...e, active: !e.active } : e);
    saveEmployees(updated);
    setEmployees(updated);
    addNotification('موظف', `${emp.active ? 'تعطيل' : 'تفعيل'} ${emp.name}`, 'info');
  };

  const handleDelete = (emp) => {
    if (!window.confirm(`حذف ${emp.name}؟`)) return;
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
        <h2 className="tab-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users size={24} style={{ color: 'var(--color-primary)' }} />
          إدارة الموظفين
        </h2>
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
              <label className="form-label">رقم الهاتف *</label>
              <input className="form-input" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="059XXXXXXX أو 056XXXXXXX" />
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
                  <td><span className="role-badge" style={{ background: `${ROLE_COLORS[emp.role]}22`, color: ROLE_COLORS[emp.role], border: `1px solid ${ROLE_COLORS[emp.role]}44` }}>{ROLE_LABELS[emp.role]}</span></td>
                  <td><code style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--color-primary)' }}>{emp.code}</code></td>
                  <td>
                    <button onClick={() => toggleActive(emp)} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.78rem', background: emp.active ? '#27ae6022' : '#e74c3c22', color: emp.active ? '#27ae60' : '#e74c3c' }}>
                      {emp.active ? <Check size={12} /> : <X size={12} />}
                      {emp.active ? 'نشط' : 'معطل'}
                    </button>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="icon-btn" onClick={() => handleEdit(emp)}>
                        <Pencil size={14} />
                      </button>
                      <button className="icon-btn danger" onClick={() => handleDelete(emp)}>
                        <Trash2 size={14} />
                      </button>
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
