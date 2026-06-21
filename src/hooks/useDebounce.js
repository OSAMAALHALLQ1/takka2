import { useCallback, useRef } from 'react';

export function useDebounce(callback, delay = 300) {
  const timeoutRef = useRef(null);
  
  return useCallback((...args) => {
    clearTimeout(timeoutRef.current);
    
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);
}

export function useThrottle(callback, delay = 300) {
  const lastRunRef = useRef(Date.now());
  
  return useCallback((...args) => {
    const now = Date.now();
    
    if (now - lastRunRef.current >= delay) {
      callback(...args);
      lastRunRef.current = now;
    }
  }, [callback, delay]);
}
