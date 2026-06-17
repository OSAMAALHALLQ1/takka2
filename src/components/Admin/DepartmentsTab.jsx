import React, { useState, useRef } from 'react';
import { saveDepartments, addNotification } from '../../utils/storage';
import { renderItemImage } from './utils';

export default function DepartmentsTab({ departments, setDepartments, employees, deptOrders }) {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: '', nameEn: '', image: '', color: '#e67e22', description: '', workHours: '' });
  const fileInputRef = useRef(null);

  const getDeptEmployeeCount = (deptId) => employees.filter(e => e.role === deptId).length;
  const getDeptActiveOrders = (deptId) => Object.values(deptOrders).filter(o =>
    (o.items || []).some(i => i.department === deptId && i.status !== 'delivered')
  ).length;

  const resetForm = () => { setForm({ name: '', nameEn: '', image: '', color: '#e67e22', description: '', workHours: '' }); setEditId(null); };

  const handleSave = () => {
    if (!form.name.trim()) return;
    let updated;
    const finalForm = { ...form, icon: form.image };
    if (editId) {
      updated = departments.map(d => d.id === editId ? { ...d, ...finalForm } : d);
    } else {
      updated = [...departments, { ...finalForm, id: `dept-${Date.now()}`, activeOrders: 0, lastOrderAt: null }];
    }
    saveDepartments(updated);
    setDepartments(updated);
    setShowForm(false);
    resetForm();
    addNotification(editId ? 'تم تعديل القسم' : 'تم إضافة القسم', `القسم ${form.name} تم ${editId ? 'تعديله' : 'إضافته'} بنجاح`, 'success');
  };

  const handleEdit = (dept) => {
    setForm({ name: dept.name, nameEn: dept.nameEn || '', image: dept.image || dept.icon || '', color: dept.color, description: dept.description || '', workHours: dept.workHours || '' });
    setEditId(dept.id);
    setShowForm(true);
  };

  const handleDelete = (dept) => {
    if (!window.confirm(`حذف قسم "${dept.name}"؟`)) return;
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
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  📁 إرفاق صورة
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={e => {
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
                  }}
                />
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
            <button className="btn btn-primary" onClick={handleSave}>{editId ? 'حفظ التعديلات' : 'إضافة القسم'}</button>
            <button className="btn btn-secondary" onClick={() => { setShowForm(false); resetForm(); }}>إلغاء</button>
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
