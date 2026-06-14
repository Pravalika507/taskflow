import { useState, useEffect, useRef } from 'react';

export function useCountUp(end, duration = 900) {
  const [val, setVal] = useState(0);
  const endRef = useRef(end);

  useEffect(() => {
    endRef.current = end;
    if (end === 0) { setVal(0); return; }
    let startTime = null;
    let raf;
    const animate = (ts) => {
      if (!startTime) startTime = ts;
      const p = Math.min((ts - startTime) / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(eased * end));
      if (p < 1) raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [end, duration]);

  return val;
}
