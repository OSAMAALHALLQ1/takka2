import { useMemo } from 'react';
import { DepartmentOrderCard } from '../Orders/DepartmentOrderCard';
import { useOrders } from '../../hooks/useOrders';

export function BarDashboard() {
  const { orders } = useOrders();
  
  // فلترة الطلبات: فقط التي لم تكتمل بعد
  const barOrders = useMemo(() => {
    return orders.filter(order => {
      const hasBarItems = (order.items || []).some(
        item => item.department === 'bar' && item.status !== 'completed' && item.status !== 'delivered' && item.status !== 'ready'
      );
      return hasBarItems && order.status !== 'completed';
    });
  }, [orders]);
  
  // ترتيب: الأحدث أولاً
  const sortedOrders = useMemo(() => {
    return [...barOrders].sort(
      (a, b) => (b.timestamp || b.createdAt || 0) - (a.timestamp || a.createdAt || 0)
    );
  }, [barOrders]);
  
  return (
    <div className="space-y-4 pb-6">
      {/* رأس الصفحة */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-primary" style={{ margin: 0 }}>
          🍺 البار
        </h2>
        <div className="bg-red-100 text-red-700 px-3 py-1 rounded-full font-semibold">
          {barOrders.length} طلب
        </div>
      </div>
      
      {/* قائمة الطلبات */}
      {sortedOrders.length === 0 ? (
        <div className="bg-green-100 border border-green-300 rounded-lg p-6 text-center">
          <p className="text-green-700 font-semibold" style={{ margin: 0 }}>✓ لا توجد طلبات معلقة</p>
          <p className="text-green-600 text-sm" style={{ margin: '4px 0 0 0' }}>انتظر الطلبات الجديدة...</p>
        </div>
      ) : (
        sortedOrders.map(order => (
          <DepartmentOrderCard
            key={order.id}
            order={order}
            department="bar"
          />
        ))
      )}
    </div>
  );
}

export default BarDashboard;
