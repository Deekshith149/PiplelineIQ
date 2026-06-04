'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { X, Check } from 'lucide-react';

/* ─────────────────────────────────────────────
   Comparison rows
───────────────────────────────────────────── */
const rows = [
  {
    category: 'Time to Root Cause',
    traditional: '1–4 hours of manual log review',
    ai: 'Under 60 seconds — automated',
    highlight: true,
  },
  {
    category: 'Failure Detection',
    traditional: 'Alert notifications only',
    ai: 'Deep log parsing with evidence extraction',
    highlight: false,
  },
  {
    category: 'Classification',
    traditional: 'Requires senior engineer intuition',
    ai: 'DistilBERT ML model — 99.2% accuracy',
    highlight: false,
  },
  {
    category: 'Root Cause Quality',
    traditional: 'Guesswork + stack traces',
    ai: 'Gemini AI isolates primary cause from noise',
    highlight: true,
  },
  {
    category: 'Remediation Guidance',
    traditional: 'Google it, trial and error',
    ai: 'Prioritised step-by-step fix with commands',
    highlight: false,
  },
  {
    category: 'Cross-run Pattern Detection',
    traditional: '❌ None',
    ai: '✅ Historical failure cross-referencing',
    highlight: false,
  },
  {
    category: 'Team Knowledge Capture',
    traditional: 'Lost in Slack threads',
    ai: 'Structured reports persisted + searchable',
    highlight: false,
  },
  {
    category: 'Scalability',
    traditional: 'Grows linearly with headcount',
    ai: 'Scales with infrastructure, not people',
    highlight: true,
  },
  {
    category: 'CI/CD Platform Support',
    traditional: 'One platform, custom scripts each',
    ai: 'GitHub Actions, GitLab, Jenkins, Azure, CircleCI',
    highlight: false,
  },
] as const;

/* ─────────────────────────────────────────────
   Comparison Section
───────────────────────────────────────────── */
export default function Comparison() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section
      id="comparison"
      className="relative z-10 py-28 px-4 overflow-hidden"
      aria-labelledby="comparison-heading"
    >
      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% 50%, rgba(99,102,241,0.04) 0%, transparent 70%)',
        }}
      />

      <div className="max-w-5xl mx-auto">
        {/* ── Header ── */}
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="h-px w-8" style={{ background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.6))' }} />
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--indigo-400)' }}>
              Why Switch
            </span>
            <div className="h-px w-8" style={{ background: 'linear-gradient(90deg, rgba(99,102,241,0.6), transparent)' }} />
          </div>

          <h2
            id="comparison-heading"
            className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-5 leading-[1.1]"
          >
            Traditional debugging{' '}
            <span className="gradient-text">vs our platform</span>
          </h2>

          <p
            className="text-lg max-w-xl mx-auto leading-relaxed"
            style={{ color: 'var(--text-secondary)' }}
          >
            See exactly what changes when AI takes over the diagnostic work your
            team currently does by hand.
          </p>
        </motion.div>

        {/* ── Comparison Table ── */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-2xl overflow-hidden"
          style={{
            border: '1px solid var(--glass-border)',
            boxShadow: 'var(--shadow-hover)',
          }}
        >
          {/* Table header */}
          <div
            className="grid grid-cols-[1fr_1fr_1fr] gap-0"
            style={{
              background: 'var(--glass-bg)',
              backdropFilter: 'var(--glass-blur)',
              WebkitBackdropFilter: 'var(--glass-blur)',
              borderBottom: '1px solid var(--glass-border)',
            }}
          >
            {/* Column 1: Category */}
            <div className="px-6 py-4">
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                Capability
              </span>
            </div>

            {/* Column 2: Traditional */}
            <div
              className="px-6 py-4 flex items-center gap-2.5"
              style={{ borderLeft: '1px solid var(--glass-border)' }}
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}
              >
                <X className="w-3.5 h-3.5" style={{ color: '#ef4444' }} strokeWidth={2.5} />
              </div>
              <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                Traditional Debugging
              </span>
            </div>

            {/* Column 3: AI Platform */}
            <div
              className="px-6 py-4 flex items-center gap-2.5 relative"
              style={{
                borderLeft: '1px solid var(--glass-border)',
                background: 'rgba(99,102,241,0.05)',
              }}
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #4f46e5, #6366f1)', boxShadow: '0 0 12px rgba(99,102,241,0.3)' }}
              >
                <Check className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
              </div>
              <span className="text-sm font-bold gradient-text">
                Our AI Platform
              </span>
            </div>
          </div>

          {/* Table rows */}
          {rows.map((row, index) => (
            <motion.div
              key={row.category}
              initial={{ opacity: 0, x: -20 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
              className="grid grid-cols-[1fr_1fr_1fr] gap-0 group"
              style={{
                borderTop: '1px solid var(--glass-border)',
                background: row.highlight
                  ? 'var(--step-number-bg)'
                  : 'var(--glass-bg)',
                backdropFilter: 'var(--glass-blur)',
                WebkitBackdropFilter: 'var(--glass-blur)',
                transition: 'background 0.2s ease',
              }}
            >
              {/* Category */}
              <div className="px-6 py-4 flex items-center">
                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {row.category}
                </span>
              </div>

              {/* Traditional */}
              <div
                className="px-6 py-4 flex items-center gap-2"
                style={{ borderLeft: '1px solid var(--glass-border)' }}
              >
                <X className="w-4 h-4 flex-shrink-0 opacity-50" style={{ color: '#ef4444' }} strokeWidth={2} />
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {row.traditional}
                </span>
              </div>

              {/* AI Platform */}
              <div
                className="px-6 py-4 flex items-center gap-2 relative"
                style={{
                  borderLeft: '1px solid var(--glass-border)',
                  background: row.highlight
                    ? 'rgba(99,102,241,0.08)'
                    : 'rgba(99,102,241,0.03)',
                }}
              >
                <Check className="w-4 h-4 flex-shrink-0" style={{ color: '#6366f1' }} strokeWidth={2.5} />
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {row.ai}
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* ── Bottom CTA nudge ── */}
        <motion.div
          className="mt-10 text-center"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
            Ready to stop debugging manually?
          </p>
          <a
            href="#pricing"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #2563eb, #4f46e5)',
              boxShadow: '0 0 24px rgba(79,142,247,0.3)',
            }}
            onClick={(e) => {
              e.preventDefault();
              document.querySelector('#pricing')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            See our plans →
          </a>
        </motion.div>
      </div>
    </section>
  );
}
