'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { TrendingUp, Clock, Zap, Activity } from 'lucide-react';
import AnimatedCounter from './AnimatedCounter';

/* ─────────────────────────────────────────────
   Metric definitions
───────────────────────────────────────────── */
const metrics = [
  {
    id: 'accuracy',
    icon: Activity,
    target: 99.2,
    decimals: 1,
    suffix: '%',
    label: 'Classification Accuracy',
    description: 'DistilBERT correctly classifies failure types across 8+ categories',
    color: '#6366f1',
    gradient: 'linear-gradient(135deg, #4f46e5, #6366f1)',
    glowColor: 'rgba(99, 102, 241, 0.3)',
    barWidth: '99%',
  },
  {
    id: 'debugging',
    icon: Zap,
    target: 80,
    decimals: 0,
    suffix: '%',
    label: 'Faster Debugging',
    description: 'Engineers resolve pipeline failures in minutes instead of hours',
    color: '#3b82f6',
    gradient: 'linear-gradient(135deg, #2563eb, #3b82f6)',
    glowColor: 'rgba(59, 130, 246, 0.3)',
    barWidth: '80%',
  },
  {
    id: 'mttr',
    icon: Clock,
    target: 60,
    decimals: 0,
    suffix: '%',
    label: 'Reduced MTTR',
    description: 'Mean Time to Recovery drops dramatically with AI-guided fixes',
    color: '#10b981',
    gradient: 'linear-gradient(135deg, #059669, #10b981)',
    glowColor: 'rgba(16, 185, 129, 0.3)',
    barWidth: '60%',
  },
  {
    id: 'logs',
    icon: TrendingUp,
    target: 1200,
    decimals: 0,
    suffix: '+',
    label: 'Logs Processed',
    description: 'Pipeline failure logs analyzed across GitHub Actions, Jenkins, GitLab',
    color: '#a855f7',
    gradient: 'linear-gradient(135deg, #7c3aed, #a855f7)',
    glowColor: 'rgba(168, 85, 247, 0.3)',
    barWidth: '100%',
  },
] as const;

/* ─────────────────────────────────────────────
   Individual Metric Card
───────────────────────────────────────────── */
function MetricCard({
  metric,
  index,
}: {
  metric: (typeof metrics)[number];
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const Icon = metric.icon;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40, scale: 0.96 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.65, delay: index * 0.12, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden rounded-2xl p-6 flex flex-col gap-4 group"
      style={{
        background: 'var(--glass-bg)',
        backdropFilter: 'var(--glass-blur)',
        WebkitBackdropFilter: 'var(--glass-blur)',
        border: '1px solid var(--glass-border)',
        boxShadow: 'var(--shadow-card)',
        transition: 'box-shadow 0.3s ease, border-color 0.3s ease',
      }}
      whileHover={{
        y: -4,
        boxShadow: `var(--shadow-hover), 0 0 40px ${metric.glowColor}`,
        borderColor: metric.color + '40',
      }}
    >
      {/* Background gradient bleed */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at top left, ${metric.glowColor} 0%, transparent 60%)`,
        }}
      />

      {/* Top row: icon + counter */}
      <div className="flex items-start justify-between relative z-10">
        {/* Icon box */}
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center"
          style={{
            background: metric.gradient,
            boxShadow: `0 0 16px ${metric.glowColor}`,
          }}
        >
          <Icon className="w-5 h-5 text-white" strokeWidth={2} />
        </div>

        {/* Animated counter */}
        <div className="text-right">
          <AnimatedCounter
            target={metric.target}
            decimals={metric.decimals}
            suffix={metric.suffix}
            duration={2200}
            className="text-4xl font-black tracking-tight leading-none"
            style={{ color: metric.color }}
          />
        </div>
      </div>

      {/* Label + description */}
      <div className="relative z-10">
        <h3
          className="text-base font-bold mb-1 leading-tight"
          style={{ color: 'var(--text-primary)' }}
        >
          {metric.label}
        </h3>
        <p
          className="text-sm leading-relaxed"
          style={{ color: 'var(--text-secondary)' }}
        >
          {metric.description}
        </p>
      </div>

      {/* Progress bar */}
      <div
        className="relative h-1.5 rounded-full overflow-hidden"
        style={{ background: 'var(--step-number-bg)' }}
      >
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ background: metric.gradient }}
          initial={{ width: '0%' }}
          animate={inView ? { width: metric.barWidth } : { width: '0%' }}
          transition={{ duration: 2, delay: index * 0.12 + 0.3, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>

      {/* Bottom shine line */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `linear-gradient(90deg, transparent, ${metric.color}60, transparent)`,
        }}
      />
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   Metrics Section
───────────────────────────────────────────── */
export default function Metrics() {
  return (
    <section
      id="metrics"
      className="relative z-10 py-28 px-4 overflow-hidden"
      aria-labelledby="metrics-heading"
    >
      {/* Section glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% 50%, rgba(99,102,241,0.05) 0%, transparent 70%)',
        }}
      />

      <div className="max-w-6xl mx-auto">
        {/* ── Header ── */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="inline-flex items-center gap-2 mb-4">
            <div
              className="h-px w-8"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.6))' }}
            />
            <span
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: 'var(--indigo-400)' }}
            >
              Proven Results
            </span>
            <div
              className="h-px w-8"
              style={{ background: 'linear-gradient(90deg, rgba(99,102,241,0.6), transparent)' }}
            />
          </div>

          <h2
            id="metrics-heading"
            className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-5 leading-[1.1]"
          >
            Numbers that{' '}
            <span className="gradient-text">speak for themselves</span>
          </h2>

          <p
            className="text-lg max-w-xl mx-auto leading-relaxed"
            style={{ color: 'var(--text-secondary)' }}
          >
            Real-world performance measured across hundreds of CI/CD failure
            logs on GitHub Actions, Jenkins, and GitLab pipelines.
          </p>
        </motion.div>

        {/* ── Metric Cards Grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {metrics.map((metric, index) => (
            <MetricCard key={metric.id} metric={metric} index={index} />
          ))}
        </div>

        {/* ── Bottom testimonial strip ── */}
        <motion.div
          className="mt-16 rounded-2xl p-8 text-center relative overflow-hidden"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.3 }}
          style={{
            background: 'var(--glass-bg)',
            backdropFilter: 'var(--glass-blur)',
            border: '1px solid var(--glass-border)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          {/* Glow accent */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse 60% 80% at 50% 0%, rgba(99,102,241,0.07) 0%, transparent 70%)',
            }}
          />

          <div className="relative z-10">
            {/* Eyebrow */}
            <p className="text-xs font-bold uppercase tracking-widest mb-5" style={{ color: 'var(--indigo-400)' }}>
              Our Mission
            </p>

            {/* Mission statement */}
            <p
              className="text-xl sm:text-2xl font-bold leading-relaxed mb-8 max-w-3xl mx-auto"
              style={{ color: 'var(--text-primary)' }}
            >
              Most teams spend more time{' '}
              <span className="gradient-text">debugging than building.</span>{' '}
              We built the AI that flips that equation — so every pipeline
              failure becomes a{' '}
              <span className="gradient-text">solved problem in seconds,</span>{' '}
              not hours.
            </p>

            {/* Three differentiator pillars */}
            <div className="grid sm:grid-cols-3 gap-4 mt-6 text-left">
              {[
                {
                  icon: '🧠',
                  title: 'Intelligence, not dashboards',
                  body: 'We don\'t just surface logs — we read them, classify them, and hand you the root cause with a fix attached.',
                },
                {
                  icon: '⚡',
                  title: 'Speed over guesswork',
                  body: 'Traditional debugging is manual and slow. Our multi-agent pipeline goes from raw log to remediation in one automated pass.',
                },
                {
                  icon: '🔒',
                  title: 'Built for scale',
                  body: 'LangGraph state orchestration and containerized deployment mean the platform scales with your team from startup to enterprise.',
                },
              ].map((pillar) => (
                <div
                  key={pillar.title}
                  className="rounded-xl p-4"
                  style={{
                    background: 'var(--step-number-bg)',
                    border: '1px solid var(--glass-border)',
                  }}
                >
                  <div className="text-2xl mb-2">{pillar.icon}</div>
                  <p className="text-sm font-bold mb-1.5" style={{ color: 'var(--text-primary)' }}>
                    {pillar.title}
                  </p>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {pillar.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
