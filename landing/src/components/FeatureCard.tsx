'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { type LucideIcon } from 'lucide-react';
import GlowCard from './GlowCard';

export interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  badge?: string;
  accentColor: string;
  glowColor: string;
  gradient: string;
  index: number;
}

export default function FeatureCard({
  icon: Icon,
  title,
  description,
  badge,
  accentColor,
  glowColor,
  gradient,
  index,
}: FeatureCardProps) {
  const [iconHovered, setIconHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{
        duration: 0.65,
        delay: index * 0.1,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      <GlowCard glowColor={glowColor} className="h-full">
        <div className="p-6 flex flex-col gap-5 h-full">

          {/* Icon + Badge row */}
          <div className="flex items-start justify-between">
            {/* Animated Icon Box */}
            <motion.div
              className="relative w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              onHoverStart={() => setIconHovered(true)}
              onHoverEnd={() => setIconHovered(false)}
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ duration: 0.25, ease: 'backOut' }}
              style={{
                background: gradient,
                boxShadow: iconHovered ? `0 0 24px ${glowColor}` : 'none',
                transition: 'box-shadow 0.3s ease',
              }}
            >
              <Icon
                className="w-6 h-6"
                style={{ color: 'white' }}
                strokeWidth={1.8}
              />
              {/* Shine overlay on hover */}
              <motion.div
                className="absolute inset-0 rounded-xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: iconHovered ? 1 : 0 }}
                style={{
                  background:
                    'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, transparent 60%)',
                }}
              />
            </motion.div>

            {/* Optional badge */}
            {badge && (
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{
                  background: `${accentColor}18`,
                  border: `1px solid ${accentColor}35`,
                  color: accentColor,
                }}
              >
                {badge}
              </span>
            )}
          </div>

          {/* Text content */}
          <div className="flex flex-col gap-2 flex-1">
            <h3
              className="text-base font-bold leading-snug"
              style={{ color: 'var(--text-primary)' }}
            >
              {title}
            </h3>
            <p
              className="text-sm leading-relaxed"
              style={{ color: 'var(--text-secondary)' }}
            >
              {description}
            </p>
          </div>

          {/* Bottom accent line */}
          <div
            className="h-[2px] rounded-full w-10 transition-all duration-500 group-hover:w-full"
            style={{ background: gradient }}
          />
        </div>
      </GlowCard>
    </motion.div>
  );
}
