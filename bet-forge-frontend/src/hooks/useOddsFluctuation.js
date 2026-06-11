import { useState, useEffect } from 'react';

export function useOddsFluctuation(initialOdd, active = true) {
  const [odd, setOdd] = useState(initialOdd);
  const [direction, setDirection] = useState(null); // 'up' | 'down' | null

  useEffect(() => {
    if (!active) return;
    const interval = setInterval(() => {
      if (Math.random() < 0.3) {
        const delta = (Math.random() - 0.5) * 0.12;
        setOdd(prev => {
          const next = Math.max(1.01, parseFloat((prev + delta).toFixed(2)));
          setDirection(next > prev ? 'up' : 'down');
          setTimeout(() => setDirection(null), 900);
          return next;
        });
      }
    }, 2800);
    return () => clearInterval(interval);
  }, [active]);

  return { odd, direction };
}
