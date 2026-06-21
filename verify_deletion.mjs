import { getDeptOrders, saveDeptOrders, deleteDeptOrdersForTable } from './src/utils/storage.js';
(async () => {
  // Add a dummy dept order for tableId 99
  const orders = getDeptOrders();
  const dummyId = 'test-order-99';
  orders[dummyId] = { id: dummyId, tableId: 99, items: [] };
  await saveDeptOrders(orders);
  console.log('Before deletion, orders:', Object.keys(getDeptOrders()));
  const deletedCount = await deleteDeptOrdersForTable(99);
  console.log('Deleted count:', deletedCount);
  console.log('After deletion, orders:', Object.keys(getDeptOrders()));
})();
