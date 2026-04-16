import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

export function AnimatedBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        setMousePosition({ x, y });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const getParallaxOffset = (depth: number) => ({
    x: mousePosition.x * depth * 30,
    y: mousePosition.y * depth * 30,
  });

  return (
    <div ref={containerRef} className="fixed inset-0 overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Layer 1 - Large circles with deep parallax */}
      <motion.div
        animate={getParallaxOffset(0.3)}
        transition={{ type: 'spring', stiffness: 100, damping: 30 }}
        className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-gradient-to-br from-blue-600/20 to-cyan-500/10 blur-3xl"
      />

      <motion.div
        animate={getParallaxOffset(0.25)}
        transition={{ type: 'spring', stiffness: 100, damping: 30 }}
        className="absolute top-1/3 -left-32 w-72 h-72 rounded-full bg-gradient-to-br from-purple-600/15 to-blue-500/10 blur-3xl"
      />

      {/* Layer 2 - Animated triangles */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        style={{
          top: '20%',
          right: '10%',
          width: '200px',
          height: '200px',
          position: 'absolute',
          opacity: 0.1,
        }}
      >
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <polygon points="100,20 180,180 20,180" fill="url(#triangleGradient)" />
          <defs>
            <linearGradient id="triangleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>

      {/* Layer 3 - Hexagons with parallax */}
      <motion.div
        animate={{
          rotate: -360,
          ...getParallaxOffset(0.2),
        }}
        transition={{
          rotate: { duration: 25, repeat: Infinity, ease: 'linear' },
          x: { type: 'spring', stiffness: 100, damping: 30 },
          y: { type: 'spring', stiffness: 100, damping: 30 },
        }}
        style={{
          bottom: '15%',
          left: '5%',
          width: '250px',
          height: '250px',
          position: 'absolute',
          opacity: 0.08,
        }}
      >
        <svg viewBox="0 0 250 250" className="w-full h-full">
          <polygon
            points="125,25 212,75 212,175 125,225 38,175 38,75"
            stroke="#0ea5e9"
            strokeWidth="2"
            fill="none"
          />
        </svg>
      </motion.div>

      {/* Layer 4 - Small geometric elements */}
      <motion.div
        animate={{
          y: [0, -20, 0],
          ...getParallaxOffset(0.35),
        }}
        transition={{
          y: { duration: 6, repeat: Infinity, ease: 'easeInOut' },
          x: { type: 'spring', stiffness: 100, damping: 30 },
        }}
        className="absolute top-1/4 right-1/4 w-24 h-24 bg-gradient-to-br from-cyan-500/20 to-blue-600/10 rounded-lg transform rotate-45 blur-xl"
      />

      <motion.div
        animate={{
          y: [0, 20, 0],
          ...getParallaxOffset(0.18),
        }}
        transition={{
          y: { duration: 8, repeat: Infinity, ease: 'easeInOut' },
          x: { type: 'spring', stiffness: 100, damping: 30 },
        }}
        className="absolute bottom-1/3 left-1/4 w-32 h-32 bg-gradient-to-br from-blue-500/15 to-purple-600/10 rounded-full blur-2xl"
      />

      {/* Layer 5 - Rotating squares */}
      <motion.div
        animate={{
          rotate: 360,
          ...getParallaxOffset(0.15),
        }}
        transition={{
          rotate: { duration: 30, repeat: Infinity, ease: 'linear' },
          x: { type: 'spring', stiffness: 100, damping: 30 },
          y: { type: 'spring', stiffness: 100, damping: 30 },
        }}
        style={{
          top: '60%',
          right: '8%',
          width: '150px',
          height: '150px',
          position: 'absolute',
          opacity: 0.12,
        }}
      >
        <svg viewBox="0 0 150 150" className="w-full h-full">
          <rect x="30" y="30" width="90" height="90" fill="none" stroke="#06b6d4" strokeWidth="2" />
          <rect x="45" y="45" width="60" height="60" fill="none" stroke="#3b82f6" strokeWidth="1.5" />
        </svg>
      </motion.div>

      {/* Gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/30 to-slate-900/60 pointer-events-none" />

      {/* Light ray effect */}
      <motion.div
        animate={{
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/5 to-transparent pointer-events-none"
      />
    </div>
  );
}
