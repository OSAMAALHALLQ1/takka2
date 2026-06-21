import { useCallback, useRef } from 'react';

// Hook لمنع التحديثات المتكررة والتعامل مع Race Conditions
export function useOptimisticUpdate(updateFunction) {
  const requestIdRef = useRef(0);
  const lastUpdateRef = useRef({});
  
  const optimisticUpdate = useCallback(async (id, newData) => {
    // منع التحديثات المتكررة للـ ID نفسه
    if (lastUpdateRef.current[id] === JSON.stringify(newData)) {
      return;
    }
    
    const currentRequestId = ++requestIdRef.current;
    lastUpdateRef.current[id] = JSON.stringify(newData);
    
    try {
      // تحديث متفائل فوري
      await updateFunction(id, newData);
      
      // تجاهل النتائج من requests قديمة
      if (currentRequestId === requestIdRef.current) {
        return true;
      }
    } catch (error) {
      console.error('Update failed:', error);
      delete lastUpdateRef.current[id];
      return false;
    }
  }, [updateFunction]);
  
  return optimisticUpdate;
}
