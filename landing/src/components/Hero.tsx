'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, type Variants } from 'framer-motion';
import {
  GitCommit,
  Hammer,
  Rocket,
  AlertTriangle,
  BrainCircuit,
  CheckCircle2,
  ArrowDown,
  ChevronRight,
  Play,
} from 'lucide-react';

/* ─────────────────────────────────────────────
   Pipeline step definitions
───────────────────────────────────────────── */
const pipelineSteps = [
  {
    id: 'commit',
    icon: GitCommit,
    label: 'GitHub Commit',
    sublabel: 'main @ a3f9b2c',
    color: '#60a5fa',
    glowColor: 'rgba(96, 165, 250, 0.3)',
    variant: 'default',
  },
  {
    id: 'build',
    icon: Hammer,
    label: 'Build',
    sublabel: 'npm install → compile',
    color: '#818cf8',
    glowColor: 'rgba(129, 140, 248, 0.3)',
    variant: 'default',
  },
  {
    id: 'deploy',
    icon: Rocket,
    label: 'Deploy',
    sublabel: 'Pushing to production',
    color: '#22d3ee',
    glowColor: 'rgba(34, 211, 238, 0.3)',
    variant: 'default',
  },
  {
    id: 'failure',
    icon: AlertTriangle,
    label: 'Failure Detected',
    sublabel: 'Exit code 1 — dependency error',
    color: '#ef4444',
    glowColor: 'rgba(239, 68, 68, 0.35)',
    variant: 'error',
  },
  {
    id: 'ai',
    icon: BrainCircuit,
    label: 'AI Analysis',
    sublabel: 'DistilBERT + Gemini agent',
    color: '#a855f7',
    glowColor: 'rgba(168, 85, 247, 0.35)',
    variant: 'ai',
  },
  {
    id: 'fix',
    icon: CheckCircle2,
    label: 'Fix Suggestion',
    sublabel: '3 remediation steps generated',
    color: '#10b981',
    glowColor: 'rgba(16, 185, 129, 0.35)',
    variant: 'success',
  },
] as const;

/* ─────────────────────────────────────────────
   Animation variants
───────────────────────────────────────────── */
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.3 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
};

const badgeVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: 'backOut' },
  },
};

/* ─────────────────────────────────────────────
   Pipeline Step Card Component
───────────────────────────────────────────── */
function PipelineStepCard({
  step,
  isActive,
  index,
}: {
  step: (typeof pipelineSteps)[number];
  isActive: boolean;
  index: number;
}) {
  const Icon = step.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-500 cursor-default select-none"
      style={{
        background: isActive
          ? `rgba(${step.variant === 'error' ? '239,68,68' : step.variant === 'success' ? '16,185,129' : step.variant === 'ai' ? '168,85,247' : '79,142,247'}, 0.1)`
          : 'var(--glass-bg)',
        border: `1px solid ${isActive ? step.color + '60' : 'var(--glass-border)'}`,
        boxShadow: isActive ? `0 0 24px ${step.glowColor}, inset 0 0 12px ${step.glowColor}30` : 'none',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      {/* Icon circle */}
      <div
        className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-500"
        style={{
          background: isActive ? `${step.color}20` : 'var(--step-number-bg)',
          border: `1px solid ${isActive ? step.color + '40' : 'var(--glass-border)'}`,
        }}
      >
        <Icon
          className="w-4 h-4 transition-all duration-500"
          style={{ color: isActive ? step.color : 'var(--text-muted)' }}
          strokeWidth={2}
        />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-semibold transition-colors duration-500 leading-tight"
          style={{ color: isActive ? step.color : 'var(--text-secondary)' }}
        >
          {step.label}
        </p>
        <p
          className="text-xs mt-0.5 truncate transition-colors duration-500"
          style={{ color: isActive ? 'var(--text-muted)' : 'var(--text-muted)' }}
        >
          {step.sublabel}
        </p>
      </div>

      {/* Active pulse dot */}
      {isActive && (
        <div className="flex-shrink-0 relative">
          <div
            className="w-2 h-2 rounded-full"
            style={{ background: step.color }}
          />
          <div
            className="absolute inset-0 rounded-full animate-ping"
            style={{ background: step.color, opacity: 0.5 }}
          />
        </div>
      )}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   Main Hero Component
───────────────────────────────────────────── */
export default function Hero() {
  const [activeStep, setActiveStep] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* Cycle through pipeline steps */
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % pipelineSteps.length);
    }, 1400);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24 pb-16 px-4"
      aria-label="Hero section"
    >
      <div className="relative z-10 max-w-6xl mx-auto w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* ── LEFT: Text Content ── */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col"
          >
            {/* Badge */}
            <motion.div variants={badgeVariants} className="mb-6">
              <span
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold"
                style={{
                  background: 'rgba(79, 142, 247, 0.1)',
                  border: '1px solid rgba(79, 142, 247, 0.3)',
                  color: '#60a5fa',
                  animation: 'float-badge 3s ease-in-out infinite',
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ background: '#10b981' }}
                />
                Now in Public Beta
                <ChevronRight className="w-3 h-3 opacity-60" />
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={itemVariants}
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.08] tracking-tight mb-6"
            >
              Stop Guessing{' '}
              <br className="hidden sm:block" />
              <span className="gradient-text">Why Deployments</span>
              <br />
              Fail
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              variants={itemVariants}
              className="text-lg leading-relaxed mb-8 max-w-lg"
              style={{ color: 'var(--text-secondary)' }}
            >
              AI agents analyze logs, detect root causes, generate fixes,
              and help teams recover{' '}
              <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                in minutes
              </span>{' '}
              — not hours.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-3"
            >
              <a
                href="/login"
                id="hero-start-beta"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-white text-base transition-all duration-200 hover:scale-105 hover:-translate-y-0.5"
                style={{
                  background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
                  boxShadow: '0 0 32px rgba(79, 142, 247, 0.35), 0 4px 16px rgba(0,0,0,0.3)',
                }}
              >
                <Rocket className="w-4 h-4" />
                Start Beta — Free
              </a>

              <a
                href="#demo"
                id="hero-watch-demo"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                  color: 'var(--text-primary)',
                  background: 'rgba(99, 102, 241, 0.06)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,0.5)';
                  (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.12)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,0.25)';
                  (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.06)';
                }}
              >
                <Play className="w-4 h-4 fill-current" />
                Watch Demo
              </a>
            </motion.div>

            {/* Social proof */}
            <motion.div
              variants={itemVariants}
              className="mt-8 flex items-center gap-4"
            >
              <div className="flex -space-x-2">
                {['#3b82f6', '#6366f1', '#a855f7', '#22d3ee'].map((c, i) => (
                  <div
                    key={i}
                    className="w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold text-white"
                    style={{ borderColor: 'var(--bg-base)', background: c }}
                  >
                    {['D', 'S', 'A', 'R'][i]}
                  </div>
                ))}
              </div>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>500+</span>{' '}
                engineers already signed up
              </p>
            </motion.div>
          </motion.div>

          {/* ── RIGHT: Interactive Pipeline ── */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
            aria-label="Interactive CI/CD pipeline visualization"
          >
            {/* Outer glow card */}
            <div
              className="relative rounded-2xl p-5 overflow-hidden"
              style={{
                background: 'var(--glass-bg)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid var(--glass-hover-border)',
                boxShadow: 'var(--shadow-hover)',
              }}
            >
              {/* Header bar */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full" style={{ background: '#ef4444' }} />
                    <div className="w-3 h-3 rounded-full" style={{ background: '#f59e0b' }} />
                    <div className="w-3 h-3 rounded-full" style={{ background: '#10b981' }} />
                  </div>
                  <span className="text-xs font-mono ml-2" style={{ color: 'var(--text-muted)' }}>
                    ci-pipeline.yml
                  </span>
                </div>
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                  style={{
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    color: '#10b981',
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Analysis
                </div>
              </div>

              {/* Pipeline steps */}
              <div className="flex flex-col gap-2">
                {pipelineSteps.map((step, index) => (
                  <div key={step.id}>
                    <PipelineStepCard
                      step={step}
                      isActive={activeStep === index}
                      index={index}
                    />
                    {/* Connector arrow */}
                    {index < pipelineSteps.length - 1 && (
                      <div className="flex justify-center py-0.5">
                        <ArrowDown
                          className="w-3.5 h-3.5 transition-colors duration-500"
                          style={{
                            color:
                              activeStep === index
                                ? pipelineSteps[index].color + 'aa'
                                : 'rgba(99,102,241,0.2)',
                          }}
                          strokeWidth={2}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Progress bar at bottom */}
              <div
                className="mt-5 h-1 rounded-full overflow-hidden"
                style={{ background: 'var(--step-number-bg)' }}
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: 'linear-gradient(90deg, #3b82f6, #6366f1, #a855f7)',
                  }}
                  animate={{
                    width: `${((activeStep + 1) / pipelineSteps.length) * 100}%`,
                  }}
                  transition={{ duration: 1.2, ease: 'easeInOut' }}
                />
              </div>
              <div className="flex justify-between mt-1.5">
                <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                  Step {activeStep + 1}/{pipelineSteps.length}
                </span>
                <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                  {Math.round(((activeStep + 1) / pipelineSteps.length) * 100)}% complete
                </span>
              </div>
            </div>

            {/* Decorative glow behind card */}
            <div
              className="absolute -inset-4 rounded-3xl -z-10 opacity-30 blur-2xl"
              style={{
                background: 'radial-gradient(ellipse at center, rgba(79,142,247,0.3) 0%, rgba(99,102,241,0.2) 50%, transparent 100%)',
              }}
            />
          </motion.div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, transparent, var(--bg-base))',
        }}
      />
    </section>
  );
}
