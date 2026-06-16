import { useMemo } from 'react';
import DepartmentOrderCard from '../Orders/DepartmentOrderCard';
import { getDeptOrders, updateDeptOrderItem, addNotification } from '../../utils/storage';

export function BarDashboard({ deptOrders, onUpdateOrders }) {
  const barOrders = useMemo(() => {
    return Object.entries(deptOrders)
      .filter(([, order]) => (order.items || []).some(i => i.department === 'bar'))
      .map(([orderId, order]) => ({
        id: orderId,
        ...order,
        items: (order.items || []).filter(i => i.department === 'bar')
      }));
  }, [deptOrders]);

  const sortedOrders = useMemo(() => {
    return [...barOrders].sort((a, b) => b.createdAt - a.createdAt);
  }, [barOrders]);

  const handleMarkReady = async (orderId, itemId) => {
    await updateDeptOrderItem(orderId, itemId, { status: 'ready' });
    const updated = getDeptOrders();
    onUpdateOrders(updated);
    addNotification(`✓ طلب الطاولة #${updated[orderId].tableNumber} جاهز!`, 'success');
  };

  return (
    <div className="space-y-4 pb-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-primary">🍺 البار</h2>
        <div className="bg-red-100 text-red-700 px-3 py-1 rounded-full font-semibold">{barOrders.length} طلب</div>
      </div>
      {sortedOrders.length === 0 ? (
        <div className="bg-green-100 border border-green-300 rounded-lg p-6 text-center">
          <p className="text-green-700 font-semibold">✓ لا توجد طلبات معلقة</p>
          <p className="text-green-600 text-sm">انتظر الطلبات الجديدة...</p>
        </div>
      ) : (
        sortedOrders.map(order => (
          <DepartmentOrderCard
            key={order.id}
            order={order}
            department="bar"
            onMarkReady={handleMarkReady}
          />
        ))
      )}
    </div>
  );
}
