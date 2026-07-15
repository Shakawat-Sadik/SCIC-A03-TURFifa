'use client';

import React, { useEffect, useRef } from 'react';
import { ReactLenis, useLenis } from 'lenis/react';
import { frame, cancelFrame } from 'framer-motion';

interface SmoothScrollProps {
  children: React.ReactNode;
}

export const SmoothScroll: React.FC<SmoothScrollProps> = ({ children }) => {
  const lenisRef = useRef<any>(null);

  useEffect(() => {
    // Connect Lenis's RequestAnimationFrame (RAF) tick directly 
    // into Framer Motion's high-performance frame updater loop.
    // This prevents scroll-lag on animations or laggy rendering.
    function update(data: { timestamp: number }) {
      lenisRef.current?.lenis?.raf(data.timestamp);
    }

    frame.update(update, true);

    return () => {
      cancelFrame(update);
    };
  }, []);

  return (
    <ReactLenis
      root
      ref={lenisRef}
      options={{
        duration: 1.2,          // Speed of the smooth inertia
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Silky physics curve
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 1,     // Scroll speed multiplier
        touchMultiplier: 1.5,   // Mobile touch responsiveness
      }}
    >
      {children}
    </ReactLenis>
  );
};