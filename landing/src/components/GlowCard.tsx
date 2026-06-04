'use client';

import { useRef, useState, useCallback, type ReactNode } from 'react';
import { motion } from 'framer-motion';

interface GlowCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: string;
  style?: React.CSSProperties;
}

export default function GlowCard({
  children,
  className = '',
  glowColor = 'rgba(79, 142, 247, 0.15)',
  style,
}: GlowCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [spotlightPos, setSpotlightPos] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setSpotlightPos({ x, y });
  }, []);

  return (
    <motion.div
      ref={cardRef}
      className={`relative overflow-hidden rounded-2xl cursor-default ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ y: -6, scale: 1.01 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      style={{
        /* ── All colours driven by CSS vars → adapts to light/dark ── */
        background: 'var(--glass-bg)',
        backdropFilter: 'var(--glass-blur)',
        WebkitBackdropFilter: 'var(--glass-blur)',
        border: `1px solid ${isHovered ? 'var(--glass-hover-border)' : 'var(--glass-border)'}`,
        boxShadow: isHovered
          ? `var(--shadow-hover), 0 0 40px ${glowColor}`
          : 'var(--shadow-card)',
        transition: 'border-color 0.3s ease, box-shadow 0.3s ease, background 0.3s ease',
        ...style,
      }}
    >
      {/* Spotlight radial gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-300 rounded-2xl"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(280px circle at ${spotlightPos.x}% ${spotlightPos.y}%, ${glowColor}, transparent 70%)`,
        }}
      />

      {/* Top border gradient shine */}
      <div
        className="absolute top-0 left-0 right-0 h-px pointer-events-none rounded-t-2xl transition-opacity duration-300"
        style={{
          opacity: isHovered ? 1 : 0.4,
          background:
            'linear-gradient(90deg, transparent 0%, rgba(99,102,241,0.6) 50%, transparent 100%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}
