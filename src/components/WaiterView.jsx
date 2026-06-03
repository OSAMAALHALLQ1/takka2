import React, { useState } from 'react';
import { saveDeptOrders, getDeptOrders, addNotification } from '../utils/storage';
import { menuCategories, menuItems } from '../data/menu';
import { ShoppingBag, Send, CreditCard, ChevronLeft, Plus, Minus, Search, Trash2, TableProperties } from 'lucide-react';

export default function WaiterView({ tables, onSaveTables, employee }) {
  const [selectedTable, setSelectedTable] = useState(null);
  const [activeCategory, setActiveCategory] = useState('mains');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [tableNotes, setTableNotes] = useState('');

  // Open Order Drawer for a Table
  const openTable = (table) => {
    setSelectedTable(table);
    setCart(table.currentOrder || []);
    setTableNotes(table.notes || '');
  };

  // Close Drawer
  const closeDrawer = () => {
    setSelectedTable(null);
    setCart([]);
    setTableNotes('');
  };

  // Add Item to Table Cart
  const addToCart = (item) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => (i.id === item.id ? { ...i, qty: i.qty + 1 } : i));
      }
      return [...prev, { ...item, qty: 1, note: '' }];
    });
  };

  // Remove / Decrease Item Quantity
  const decreaseQty = (itemId) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === itemId);
      if (existing.qty === 1) {
        return prev.filter((i) => i.id !== itemId);
      }
      return prev.map((i) => (i.id === itemId ? { ...i, qty: i.qty - 1 } : i));
    });
  };

  // Increase Item Quantity
  const increaseQty = (itemId) => {
    setCart((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, qty: i.qty + 1 } : i))
    );
  };

  // Edit Item Special Note
  const updateItemNote = (itemId, note) => {
    setCart((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, note } : i))
    );
  };

  // Calculate Cart Totals
  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const tax = subtotal * 0.15; // 15% VAT
    const total = subtotal + tax;
    return { subtotal, tax, total };
  };

  // Submit Order to Kitchen/Eating
  const handleSubmitOrder = () => {
    if (cart.length === 0) return;

    const { subtotal, tax, total } = calculateTotals();
    const orderId = `order-${Date.now()}`;
    const newOrder = {
      id: orderId,
      tableId: selectedTable.id,
      tableName: selectedTable.name,
      waiterCode: employee.code,
      timestamp: Date.now(),
      items: cart,
      subtotal,
      tax,
      total,
      status: 'new'
    };

    // Save to department orders storage
    const existingDeptOrders = getDeptOrders();
    existingDeptOrders[orderId] = newOrder;
    saveDeptOrders(existingDeptOrders);

    // Also update table status for waiter view
    const updatedTables = tables.map((t) => {
      if (t.id === selectedTable.id) {
        return {
          ...t,
          status: 'eating',
          currentOrder: itemsWithStatus,
          notes: tableNotes,
          subtotal,
          tax,
          total,
          waiterCode: employee.code
        };
      }
      return t;
    });

    onSaveTables(updatedTables);
    addNotification(
      'طلب جديد 🍳',
      `تم إرسال طلب جديد لـ ${selectedTable.name} بواسطة ${employee.name}`,
      'success'
    );
    closeDrawer();
  };

  // Request Bill
  const handleRequestBill = () => {
    const updatedTables = tables.map((t) => {
      if (t.id === selectedTable.id) {
        return {
          ...t,
          status: 'bill_requested'
        };
      }
      return t;
    });

    onSaveTables(updatedTables);
    addNotification(
      'طلب حساب 🧾',
      `تم طلب الحساب لـ ${selectedTable.name} بانتظار المحاسب`,
      'danger'
    );
    closeDrawer();
  };

  // Filter Menu Items
  const filteredMenuItems = menuItems.filter(
    (item) =>
      item.category === activeCategory &&
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTableStatusText = (status) => {
    switch (status) {
      case 'empty':
        return 'فارغة';
      case 'ordering':
        return 'قيد الطلب';
      case 'eating':
        return 'يتناولون الطعام';
      case 'bill_requested':
        return 'طلب الحساب';
      default:
        return '';
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      {/* Waiter Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: '800' }}>مرحباً، {employee.name} 👋</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>شاشة إدارة طاولات الصالة وخدمة الزبائن</p>
        </div>
        <div className="glass-card" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TableProperties size={18} style={{ color: 'var(--color-primary)' }} />
          <span style={{ fontSize: '0.9rem', fontWeight: '700' }}>صالة المطعم</span>
        </div>
      </div>

      {/* Table Status Colors Legend */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '24px', fontSize: '0.85rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--status-empty)' }}></span>
          <span style={{ fontWeight: '600' }}>فارغة</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--status-eating)' }}></span>
          <span style={{ fontWeight: '600' }}>يتناول الطعام</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--status-bill-requested)' }}></span>
          <span style={{ fontWeight: '600' }}>طلب الحساب (أولوية)</span>
        </div>
      </div>

      {/* Tables Grid */}
      <div className="tables-grid">
        {tables.map((t) => (
          <div
            key={t.id}
            className={`glass-card table-card status-${t.status}`}
            onClick={() => openTable(t)}
          >
            <span className="table-number num-font">{t.id}</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t.name}</span>
            <span className={`badge badge-${t.status.replace('_', '-')}`} style={{ marginTop: '4px' }}>
              {getTableStatusText(t.status)}
            </span>
            {t.total > 0 && t.status !== 'empty' && (
              <span className="table-total num-font">{t.total.toFixed(2)} دينار</span>
            )}
          </div>
        ))}
      </div>

      {/* Interactive Order Drawer Modal */}
      {selectedTable && (
        <div className="modal-overlay">
          <div className="modal-content glass-card" style={{ maxWidth: '900px' }}>
            <div className="modal-header">
              <h3 className="modal-title">
                {selectedTable.name} - {getTableStatusText(selectedTable.status)}
              </h3>
              <button className="modal-close" onClick={closeDrawer}>&times;</button>
            </div>

            <div className="modal-body">
              {selectedTable.status === 'bill_requested' ? (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🧾</div>
                  <h4 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>تم تقديم طلب الحساب للمحاسب</h4>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
                    بانتظار معالجة الفاتورة من شاشة الكاشير. إجمالي الطلب: <strong className="num-font" style={{ color: 'var(--color-primary)' }}>{selectedTable.total.toFixed(2)} دينار</strong>
                  </p>
                  <button className="btn btn-secondary" onClick={closeDrawer}>
                    إغلاق المعاينة
                  </button>
                </div>
              ) : (
                <div className="order-builder-layout">
                  {/* Menu Picker (Left) */}
                  <div className="menu-sections">
                    <div className="category-tabs">
                      {menuCategories.map((cat) => (
                        <button
                          key={cat.id}
                          className={`category-tab ${activeCategory === cat.id ? 'active' : ''}`}
                          onClick={() => setActiveCategory(cat.id)}
                        >
                          <span>{cat.icon}</span>
                          <span>{cat.name}</span>
                        </button>
                      ))}
                    </div>

                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="ابحث عن وجبة أو شراب..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ paddingRight: '40px' }}
                      />
                      <Search size={18} style={{ position: 'absolute', right: '14px', top: '15px', color: 'var(--text-muted)' }} />
                    </div>

                    <div className="menu-items-list">
                      {filteredMenuItems.map((item) => (
                        <div key={item.id} className="menu-item-card" onClick={() => addToCart(item)}>
                          <span className="menu-item-image">{item.image}</span>
                          <div className="menu-item-info">
                            <h4 className="menu-item-name">{item.name}</h4>
                            <p className="menu-item-desc">{item.description}</p>
                          </div>
                          <span className="menu-item-price num-font">{item.price.toFixed(2)} د.أ</span>
                          <button className="qty-btn" style={{ marginRight: '10px' }}>
                            <Plus size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Cart / Invoice Builder (Right) */}
                  <div className="cart-section">
                    <div className="cart-header">
                      <span>الطلبات الحالية</span>
                      <span className="num-font" style={{ color: 'var(--color-primary)' }}>
                        {cart.reduce((s, i) => s + i.qty, 0)} عناصر
                      </span>
                    </div>

                    <div className="cart-items-scroll">
                      {cart.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px 10px', color: 'var(--text-muted)' }}>
                          <ShoppingBag size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
                          <p style={{ fontSize: '0.85rem' }}>السلة فارغة. اختر أصنافاً من القائمة لإضافتها.</p>
                        </div>
                      ) : (
                        cart.map((item) => (
                          <div key={item.id} className="cart-item">
                            <div style={{ flex: 1 }}>
                              <span className="cart-item-name">{item.name}</span>
                              <div className="cart-item-price num-font">{(item.price * item.qty).toFixed(2)} د.أ</div>
                              <input
                                type="text"
                                className="form-input"
                                placeholder="ملاحظة (مثال: بدون حد)"
                                value={item.note || ''}
                                onChange={(e) => updateItemNote(item.id, e.target.value)}
                                style={{
                                  padding: '4px 8px',
                                  fontSize: '0.75rem',
                                  marginTop: '6px',
                                  height: '26px'
                                }}
                              />
                            </div>
                            <div className="cart-item-controls">
                              <button className="qty-btn" onClick={() => decreaseQty(item.id)}>
                                <Minus size={12} />
                              </button>
                              <span className="qty-val num-font">{item.qty}</span>
                              <button className="qty-btn" onClick={() => increaseQty(item.id)}>
                                <Plus size={12} />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="form-group" style={{ marginBottom: '12px' }}>
                      <label style={{ fontSize: '0.8rem' }}>ملاحظات عامة للطاولة</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="رقم الطاولة، طلبات خاصة..."
                        value={tableNotes}
                        onChange={(e) => setTableNotes(e.target.value)}
                        style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                      />
                    </div>

                    {cart.length > 0 && (
                      <div className="cart-totals">
                        <div className="cart-total-row">
                          <span>المجموع الفرعي:</span>
                          <span className="num-font">{calculateTotals().subtotal.toFixed(2)} د.أ</span>
                        </div>
                        <div className="cart-total-row">
                          <span>الضريبة (15%):</span>
                          <span className="num-font">{calculateTotals().tax.toFixed(2)} د.أ</span>
                        </div>
                        <div className="cart-total-row grand-total">
                          <span>المجموع النهائي:</span>
                          <span className="num-font">{calculateTotals().total.toFixed(2)} دينار</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeDrawer}>
                إلغاء
              </button>
              {selectedTable.status !== 'bill_requested' && cart.length > 0 && (
                <>
                  {selectedTable.status === 'eating' && (
                    <button className="btn btn-danger" onClick={handleRequestBill}>
                      <CreditCard size={16} /> طلب الحساب
                    </button>
                  )}
                  <button className="btn btn-primary" onClick={handleSubmitOrder}>
                    <Send size={16} /> إرسال الطلب للمطبخ
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
