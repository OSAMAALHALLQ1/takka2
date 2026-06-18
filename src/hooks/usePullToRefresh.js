import { useState, useRef, useCallback, useEffect } from 'react';

export default function usePullToRefresh(onRefresh, { threshold = 80, maxPull = 120 } = {}) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startYRef = useRef(0);
  const pullingRef = useRef(false);
  const containerRef = useRef(null);

  const handleTouchStart = useCallback((e) => {
    if (refreshing) return;
    if (containerRef.current && containerRef.current.scrollTop > 0) return;
    startYRef.current = e.touches[0].clientY;
    pullingRef.current = true;
  }, [refreshing]);

  const handleTouchMove = useCallback((e) => {
    if (!pullingRef.current || refreshing) return;
    const diff = e.touches[0].clientY - startYRef.current;
    if (diff <= 0) {
      setPullDistance(0);
      return;
    }
    setPullDistance(Math.min(diff * 0.5, maxPull));
  }, [refreshing, maxPull]);

  const handleTouchEnd = useCallback(() => {
    if (!pullingRef.current || refreshing) return;
    pullingRef.current = false;
    if (pullDistance >= threshold) {
      setRefreshing(true);
      setPullDistance(0);
      Promise.resolve(onRefresh()).finally(() => {
        setRefreshing(false);
      });
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, threshold, refreshing, onRefresh]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchmove', handleTouchMove, { passive: true });
    el.addEventListener('touchend', handleTouchEnd);
    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  const pullIndicator = pullDistance > 0 || refreshing ? (
    <div
      style={{
        height: refreshing ? '56px' : `${pullDistance}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        transition: refreshing ? 'height 0.3s ease' : 'none',
        color: 'var(--color-role-accent)',
        fontSize: '0.82rem',
        fontWeight: 600,
      }}
    >
      {refreshing ? (
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          جاري التحديث...
        </span>
      ) : pullDistance >= threshold ? (
        'أفلت للتحديث'
      ) : (
        'اسحب للتحديث'
      )}
    </div>
  ) : null;

  return { containerRef, pullIndicator, refreshing };
}