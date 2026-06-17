import { useState, useCallback } from 'react';

export function OptimizedButton({
  onClick,
  disabled = false,
  children,
  className = '',
  loading = false,
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  
  const handleClick = useCallback(async (e) => {
    // منع الضغطات المتكررة
    if (isProcessing || disabled || loading) {
      e.preventDefault();
      return;
    }
    
    setIsProcessing(true);
    
    try {
      await onClick?.(e);
    } finally {
      setIsProcessing(false);
    }
  }, [onClick, isProcessing, disabled, loading]);
  
  return (
    <button
      onClick={handleClick}
      disabled={isProcessing || disabled || loading}
      className={`
        ${className}
        ${(isProcessing || loading) ? 'opacity-60 cursor-not-allowed' : ''}
      `}
    >
      {loading || isProcessing ? (
        <>
          <span className="inline-block animate-spin mr-2">⏳</span>
          جاري...
        </>
      ) : (
        children
      )}
    </button>
  );
}
