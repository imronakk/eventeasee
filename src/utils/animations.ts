
import { useEffect, useState } from 'react';

export const useDelayedRender = (delay: number = 200) => {
  const [isRendered, setIsRendered] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsRendered(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return isRendered;
};

export const useIntersectionObserver = (options: IntersectionObserverInit = {}) => {
  const [ref, setRef] = useState<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!ref) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsVisible(entry.isIntersecting);
    }, options);

    observer.observe(ref);
    return () => observer.disconnect();
  }, [ref, options]);

  return { ref: setRef, isVisible };
};
