import { useMemo } from 'react';
import { DepartmentOrderCard } from '../Orders/DepartmentOrderCard';
import { useOrders } from '../../hooks/useOrders';

export function KitchenDashboard() {
  const { orders } = useOrders();
  const kitchenOrders = useMemo(() => {
    return orders.filter(order => {
      const hasKitchenItems = order.items.some(
        item => item.department === 'kitchen' && item.status !== 'completed'
      );
      return hasKitchenItems && order.status !== 'completed';
    });
  }, [orders]);

  const sortedOrders = useMemo(() => {
    return [...kitchenOrders].sort((a, b) => b.createdAt - a.createdAt);
  }, [kitchenOrders]);

  return (
    <div className="space-y-4 pb-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-primary">🍳 المطبخ</h2>
        <div className="bg-red-100 text-red-700 px-3 py-1 rounded-full font-semibold">
          {kitchenOrders.length} طلب
        </div>
      </div>
      {sortedOrders.length === 0 ? (
        <div className="bg-green-100 border border-green-300 rounded-lg p-6 text-center">
          <p className="text-green-700 font-semibold">✓ لا توجد طلبات معلقة</p>
          <p className="text-green-600 text-sm">انتظر الطلبات الجديدة...</p>
        </div>
      ) : (
        sortedOrders.map(order => (
          <DepartmentOrderCard key={order.id} order={order} department="kitchen" />
        ))
      )}
    </div>
  );
}
