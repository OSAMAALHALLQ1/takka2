import { useCallback, useState } from 'react';
import { OptimizedButton } from '../Common/OptimizedButton';
import { useOrders } from '../../hooks/useOrders';
import { useNotifications } from '../../hooks/useNotifications';

export function DepartmentOrderCard({ order, department }) {
  const { updateOrderStatus, loading } = useOrders();
  const { addNotification } = useNotifications();
  const [isReady, setIsReady] = useState(false);
  
  // وقت الانتظار المنقضي
  const elapsedTime = Math.floor((Date.now() - order.createdAt) / 1000);
  const minutes = Math.floor(elapsedTime / 60);
  const seconds = elapsedTime % 60;
  
  const handleMarkReady = useCallback(async () => {
    try {
      const success = await updateOrderStatus(order.id, 'ready');
      
      if (success) {
        setIsReady(true);
        addNotification(
          `✓ طلب الطاولة #${order.tableNumber} جاهز!`,
          'success'
        );
      }
    } catch (error) {
      addNotification('حدث خطأ في تحديث الطلب', 'error');
    }
  }, [order.id, order.tableNumber, updateOrderStatus, addNotification]);
  
  const isProcessing = loading[order.id];
  
  return (
    <div className="bg-white rounded-lg border-l-4 border-orange-500 p-4 mb-3 shadow-sm">
      {/* رأس البطاقة */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-bold text-lg text-primary">
            الطاولة #{order.tableNumber}
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            {department === 'kitchen' && '🍳 المطبخ'}
            {department === 'bar' && '🍺 البار'}
            {department === 'shisha' && '💨 الشيشة'}
          </p>
        </div>
        
        {/* حالة الطلب */}
        <span className={`
          px-3 py-1 rounded-full text-sm font-medium
          ${isReady ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
        `}>
          {isReady ? '✓ جاهز' : '⏳ جديد'}
        </span>
      </div>
      
      {/* الأصناف */}
      <div className="space-y-1 mb-4 pb-4 border-b border-gray-100">
        {order.items
          .filter(item => item.department === department)
          .map(item => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-primary font-medium">{item.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">× {item.quantity}</span>
              </div>
            </div>
          ))}
      </div>
      
      {/* الوقت المنقضي */}
      <div className="text-center mb-4 py-2 bg-gray-50 rounded">
        <p className="text-xs text-gray-600">
          ⏱️ وقت الانتظار:
        </p>
        <p className="text-sm font-semibold text-primary">
          {minutes}:{seconds.toString().padStart(2, '0')} دقيقة
        </p>
      </div>
      
      {/* الزر - الخيار الوحيد */}
      {!isReady ? (
        <OptimizedButton
          onClick={handleMarkReady}
          loading={isProcessing}
          className="w-full px-4 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition"
        >
          ✓ جاهز للتسليم
        </OptimizedButton>
      ) : (
        <div className="w-full px-4 py-3 bg-green-100 text-green-700 font-semibold rounded-lg text-center">
          ✓ تم التسليم للجرسون
        </div>
      )}
      
      {/* ملاحظات (إذا وجدت) */}
      {order.notes && (
        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
          📝 ملاحظات: {order.notes}
        </div>
      )}
    </div>
  );
}
