'use client';

import { motion, type Variants } from 'framer-motion';
import {
  GitBranch,
  FileText,
  Tags,
  SearchCode,
  Wand2,
  BarChart3,
} from 'lucide-react';
import FeatureCard from './FeatureCard';

/* ─────────────────────────────────────────────
   Service definitions
───────────────────────────────────────────── */
const features = [
  {
    icon: GitBranch,
    title: 'GitHub Integration',
    description:
      'Connect via OAuth or Personal Access Token. Browse repositories, select workflow runs, and stream live CI/CD logs directly into the analysis engine — no manual copy-paste.',
    badge: 'Native',
    accentColor: '#60a5fa',
    glowColor: 'rgba(96, 165, 250, 0.15)',
    gradient: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
  },
  {
    icon: FileText,
    title: 'Log Parsing',
    description:
      'Advanced regex engine normalizes character encodings, extracts timestamps, captures exit codes, identifies Python/Java/Node stack traces, and segments pipeline execution stages automatically.',
    badge: 'Regex Engine',
    accentColor: '#818cf8',
    glowColor: 'rgba(129, 140, 248, 0.15)',
    gradient: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
  },
  {
    icon: Tags,
    title: 'Failure Classification',
    description:
      'DistilBERT sequence classifier predicts failure categories — Dependency, Test, Docker, Compilation, Environment, Infrastructure — with zero-shot rule fallbacks for edge cases.',
    badge: 'DistilBERT',
    accentColor: '#a855f7',
    glowColor: 'rgba(168, 85, 247, 0.15)',
    gradient: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
  },
  {
    icon: SearchCode,
    title: 'Root Cause Detection',
    description:
      'Gemini AI agent isolates the primary root cause from cascading failures. Pinpoints the exact trace evidence lines, filtering noise from downstream errors that mask the real bug.',
    badge: 'Gemini AI',
    accentColor: '#22d3ee',
    glowColor: 'rgba(34, 211, 238, 0.15)',
    gradient: 'linear-gradient(135deg, #0891b2 0%, #22d3ee 100%)',
  },
  {
    icon: Wand2,
    title: 'AI Remediation',
    description:
      'Gemini Remediation Agent generates step-by-step resolution guidelines grouped by priority — High, Medium, Low — with exact commands and config changes your team can act on immediately.',
    badge: 'Auto-fix',
    accentColor: '#10b981',
    glowColor: 'rgba(16, 185, 129, 0.15)',
    gradient: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
  },
  {
    icon: BarChart3,
    title: 'Deployment Reports',
    description:
      'Structured SQLite-backed history vault stores every analysis run with confidence scores, platform badges, and searchable diagnostics. Export, filter, and track patterns across your pipeline failures over time.',
    badge: 'Analytics',
    accentColor: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.15)',
    gradient: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
  },
] as const;

/* ─────────────────────────────────────────────
   Section header animation
───────────────────────────────────────────── */
const headerVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
};

/* ─────────────────────────────────────────────
   Features Section Component
───────────────────────────────────────────── */
export default function Features() {
  return (
    <section
      id="features"
      className="relative z-10 py-28 px-4 overflow-hidden"
      aria-labelledby="features-heading"
    >
      {/* Section background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% 50%, rgba(99,102,241,0.05) 0%, transparent 70%)',
        }}
      />

      <div className="max-w-6xl mx-auto">

        {/* ── Section Header ── */}
        <motion.div
          className="text-center mb-16"
          variants={headerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
        >
          {/* Eyebrow label */}
          <div className="inline-flex items-center gap-2 mb-4">
            <div
              className="h-px w-8"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.6))' }}
            />
            <span
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: 'var(--indigo-400)' }}
            >
              Platform Capabilities
            </span>
            <div
              className="h-px w-8"
              style={{ background: 'linear-gradient(90deg, rgba(99,102,241,0.6), transparent)' }}
            />
          </div>

          <h2
            id="features-heading"
            className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-5 leading-[1.1]"
          >
            Everything your team needs{' '}
            <br className="hidden sm:block" />
            <span className="gradient-text">to debug faster</span>
          </h2>

          <p
            className="text-lg max-w-2xl mx-auto leading-relaxed"
            style={{ color: 'var(--text-secondary)' }}
          >
            A full multi-agent intelligence stack — from raw log ingestion to
            actionable remediation steps — in a single integrated platform.
          </p>
        </motion.div>

        {/* ── Feature Cards Grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, index) => (
            <FeatureCard key={feature.title} {...feature} index={index} />
          ))}
        </div>

        {/* ── Bottom trust strip ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-16 flex flex-wrap items-center justify-center gap-8"
        >
          {[
            { label: 'GitHub Actions', icon: '🐙' },
            { label: 'GitLab CI/CD', icon: '🦊' },
            { label: 'Jenkins', icon: '☕' },
            { label: 'Azure Pipelines', icon: '☁️' },
            { label: 'CircleCI', icon: '⭕' },
          ].map((platform) => (
            <div
              key={platform.label}
              className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-md"
              style={{
                background: 'var(--glass-bg)',
                border: '1px solid var(--glass-border)',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <span className="text-base">{platform.icon}</span>
              <span
                className="text-sm font-medium"
                style={{ color: 'var(--text-secondary)' }}
              >
                {platform.label}
              </span>
            </div>
          ))}
        </motion.div>

        {/* ── Supported platforms caption ── */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center text-xs mt-4"
          style={{ color: 'var(--text-muted)' }}
        >
          Supports all major CI/CD platforms — with auto-detection
        </motion.p>
      </div>
    </section>
  );
}
