import React, { useState } from 'react';
import { saveMenu, addNotification } from '../../utils/storage';
import { CATEGORY_LABELS } from './constants';
import { renderItemImage } from './utils';
import { UtensilsCrossed, Search, FolderOpen, Check, X, Pencil, Trash2 } from 'lucide-react';

export default function MenuTab({ menuItems, setMenuItems, departments }) {
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('all');
  const [filterCat, setFilterCat] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const emptyForm = { nameAr: '', nameEn: '', description: '', price: '', category: 'mains', department: 'kitchen', image: 'utensils', available: true, prepTime: 15 };
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
    setForm({ nameAr: item.nameAr || item.name, nameEn: item.nameEn || '', description: item.description || '', price: item.price.toString(), category: item.category, department: item.department, image: item.image || 'utensils', available: item.available !== false, prepTime: item.prepTime || 15 });
    setEditId(item.id);
    setShowForm(true);
  };

  const handleDelete = (item) => {
    if (!window.confirm(`حذف "${item.name || item.nameAr}"؟`)) return;
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
        <h2 className="tab-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <UtensilsCrossed size={24} style={{ color: 'var(--color-primary)' }} />
          إدارة المنيو
        </h2>
        <button className="btn-primary-gold" onClick={() => { setForm(emptyForm); setEditId(null); setShowForm(true); }}>+ إضافة صنف</button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="input-with-icon" style={{ flex: 1, minWidth: '200px', display: 'flex', alignItems: 'center', background: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: '8px', padding: '0 10px' }}>
          <Search size={16} style={{ color: 'var(--text-muted)' }} />
          <input className="form-input" placeholder="بحث عن صنف..." value={search} onChange={e => setSearch(e.target.value)} style={{ border: 'none', background: 'transparent', flex: 1, outline: 'none' }} />
        </div>
        <select className="form-input" value={filterDept} onChange={e => setFilterDept(e.target.value)} style={{ flex: '0 0 auto', width: 'auto' }}>
          <option value="all">كل الأقسام</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select className="form-input" value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{ flex: '0 0 auto', width: 'auto' }}>
          <option value="all">كل الفئات</option>
          {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {showForm && (
        <div className="admin-card" style={{ marginBottom: '24px', borderColor: 'var(--color-primary)' }}>
          <h3 className="card-title">{editId ? 'تعديل الصنف' : 'صنف جديد'}</h3>
          <div className="responsive-grid-2" style={{ marginTop: '16px' }}>
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
                <input className="form-input" value={form.image} onChange={e => setForm(p => ({ ...p, image: e.target.value }))} placeholder="رابط صورة الصنف (URL) أو رمز الأيقونة..." style={{ flex: 1 }} />
                <label className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', padding: '0 12px', borderRadius: '8px', fontSize: '0.85rem' }}>
                  <FolderOpen size={14} />
                  <span>رفع</span>
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
                    <button onClick={() => toggleAvailable(item.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', background: item.available ? '#27ae6022' : '#e74c3c22', color: item.available ? '#27ae60' : '#e74c3c' }}>
                      {item.available ? <Check size={12} /> : <X size={12} />}
                      {item.available ? 'متوفر' : 'غير متوفر'}
                    </button>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="icon-btn" onClick={() => handleEdit(item)}>
                        <Pencil size={14} />
                      </button>
                      <button className="icon-btn danger" onClick={() => handleDelete(item)}>
                        <Trash2 size={14} />
                      </button>
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
