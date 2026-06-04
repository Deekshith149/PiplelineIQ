'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  GitBranch,
  ScanSearch,
  Tags,
  BrainCircuit,
  Wand2,
  FileBarChart2,
  ArrowDown,
  Cpu,
} from 'lucide-react';

/* ─────────────────────────────────────────────
   Pipeline stage definitions
───────────────────────────────────────────── */
const stages = [
  {
    id: 'ingest',
    step: '01',
    icon: GitBranch,
    title: 'GitHub Log Ingestion',
    description:
      'Connect your GitHub repository via OAuth or PAT. The ingestion agent fetches raw workflow run logs, normalizes character encodings, and queues them for parsing.',
    tech: ['GitHub Actions API', 'OAuth 2.0', 'LangGraph'],
    color: '#60a5fa',
    gradient: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
    glowColor: 'rgba(96, 165, 250, 0.25)',
  },
  {
    id: 'parse',
    step: '02',
    icon: ScanSearch,
    title: 'Regex Parser Agent',
    description:
      'Extracts timestamps, exit status codes, Python/Java/Node stack traces, and segments the log into execution stages. Converts raw noise into structured signal.',
    tech: ['Regex Engine', 'Python', 'FastAPI'],
    color: '#818cf8',
    gradient: 'linear-gradient(135deg, #4338ca, #6366f1)',
    glowColor: 'rgba(129, 140, 248, 0.25)',
  },
  {
    id: 'classify',
    step: '03',
    icon: Tags,
    title: 'DistilBERT Classifier',
    description:
      'Fine-tuned DistilBERT sequence classification model predicts the failure category from 8+ classes: Dependency, Test, Docker, Compilation, Environment, Infrastructure, and more.',
    tech: ['DistilBERT', 'PyTorch', 'Hugging Face'],
    color: '#a855f7',
    gradient: 'linear-gradient(135deg, #7c3aed, #a855f7)',
    glowColor: 'rgba(168, 85, 247, 0.25)',
  },
  {
    id: 'rootcause',
    step: '04',
    icon: BrainCircuit,
    title: 'Gemini Root Cause Agent',
    description:
      'Gemini AI analyzes segmented error blocks to isolate the primary root cause from cascading failures. Pinpoints exact evidence lines — filters downstream noise that masks the real bug.',
    tech: ['Gemini 1.5 Pro', 'LangGraph', 'Prompt Engineering'],
    color: '#22d3ee',
    gradient: 'linear-gradient(135deg, #0891b2, #22d3ee)',
    glowColor: 'rgba(34, 211, 238, 0.25)',
  },
  {
    id: 'remediate',
    step: '05',
    icon: Wand2,
    title: 'Gemini Remediation Agent',
    description:
      'A second Gemini agent generates step-by-step resolution guidelines grouped by priority — High, Medium, Low — with exact commands, config changes, and code snippets.',
    tech: ['Gemini 1.5 Flash', 'LangGraph', 'Structured Output'],
    color: '#10b981',
    gradient: 'linear-gradient(135deg, #059669, #10b981)',
    glowColor: 'rgba(16, 185, 129, 0.25)',
  },
  {
    id: 'report',
    step: '06',
    icon: FileBarChart2,
    title: 'Structured Report',
    description:
      'The Reporting Agent compiles the full diagnostic into a structured JSON report, persists it to SQLite, and surfaces it in the dashboard with confidence scores, badges, and searchable history.',
    tech: ['SQLite', 'FastAPI', 'Dashboard UI'],
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, #d97706, #f59e0b)',
    glowColor: 'rgba(245, 158, 11, 0.25)',
  },
] as const;

/* ─────────────────────────────────────────────
   Individual Stage Card
───────────────────────────────────────────── */
function StageCard({
  stage,
  index,
  isLast,
}: {
  stage: (typeof stages)[number];
  index: number;
  isLast: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const Icon = stage.icon;

  const isEven = index % 2 === 0;

  return (
    <div ref={ref} className="relative flex flex-col items-center">
      {/* ─── Main Card ─── */}
      <motion.div
        initial={{ opacity: 0, x: isEven ? -50 : 50, scale: 0.95 }}
        animate={inView ? { opacity: 1, x: 0, scale: 1 } : {}}
        transition={{ duration: 0.7, delay: index * 0.12, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-2xl relative overflow-hidden rounded-2xl"
        style={{
          background: 'var(--step-bg)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid var(--step-border)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        {/* Shine sweep on reveal */}
        {inView && (
          <div
            className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl"
            aria-hidden="true"
          >
            <div
              className="absolute top-0 bottom-0 w-24 opacity-30"
              style={{
                background: `linear-gradient(90deg, transparent, ${stage.color}30, transparent)`,
                animation: 'shine-sweep 0.9s ease forwards',
                animationDelay: `${index * 0.12}s`,
              }}
            />
          </div>
        )}

        {/* Left accent bar */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
          style={{ background: stage.gradient }}
        />

        <div className="flex items-start gap-5 p-6 pl-7">
          {/* Step number + icon */}
          <div className="flex flex-col items-center gap-2 flex-shrink-0">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{
                background: stage.gradient,
                boxShadow: `0 0 20px ${stage.glowColor}`,
              }}
            >
              <Icon className="w-5 h-5 text-white" strokeWidth={1.8} />
            </div>
            <span
              className="text-[10px] font-bold font-mono tracking-widest"
              style={{ color: 'var(--text-muted)' }}
            >
              {stage.step}
            </span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3
              className="text-lg font-bold mb-2 leading-tight"
              style={{ color: stage.color }}
            >
              {stage.title}
            </h3>
            <p
              className="text-sm leading-relaxed mb-4"
              style={{ color: 'var(--text-secondary)' }}
            >
              {stage.description}
            </p>

            {/* Tech pills */}
            <div className="flex flex-wrap gap-2">
              {stage.tech.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium font-mono"
                  style={{
                    background: `${stage.color}12`,
                    border: `1px solid ${stage.color}28`,
                    color: stage.color,
                  }}
                >
                  <Cpu className="w-2.5 h-2.5" strokeWidth={2} />
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom glow reflection */}
        <div
          className="absolute bottom-0 left-0 right-0 h-px"
          style={{
            background: `linear-gradient(90deg, transparent, ${stage.color}40, transparent)`,
          }}
        />
      </motion.div>

      {/* ─── Animated Connector Arrow ─── */}
      {!isLast && (
        <motion.div
          initial={{ opacity: 0, scaleY: 0 }}
          animate={inView ? { opacity: 1, scaleY: 1 } : {}}
          transition={{ duration: 0.5, delay: index * 0.12 + 0.4, ease: 'easeOut' }}
          className="flex flex-col items-center py-1 origin-top"
        >
          {/* Dashed line */}
          <div
            className="w-px flex flex-col gap-1 items-center"
            style={{ height: '36px' }}
          >
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="w-px rounded-full flex-1"
                style={{ background: 'var(--connector-color)' }}
              />
            ))}
          </div>
          {/* Animated arrow head */}
          <motion.div
            animate={{ y: [0, 4, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ArrowDown
              className="w-5 h-5"
              style={{ color: 'var(--connector-dot)' }}
              strokeWidth={2}
            />
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Workflow Section
───────────────────────────────────────────── */
export default function Workflow() {
  return (
    <section
      id="workflow"
      className="relative z-10 py-28 px-4 overflow-hidden"
      aria-labelledby="workflow-heading"
    >
      {/* Section background */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 50% 40%, rgba(99,102,241,0.04) 0%, transparent 70%)',
        }}
      />

      <div className="max-w-3xl mx-auto">
        {/* ── Section Header ── */}
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
              style={{
                background:
                  'linear-gradient(90deg, transparent, rgba(99,102,241,0.6))',
              }}
            />
            <span
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: 'var(--indigo-400)' }}
            >
              Under the Hood
            </span>
            <div
              className="h-px w-8"
              style={{
                background:
                  'linear-gradient(90deg, rgba(99,102,241,0.6), transparent)',
              }}
            />
          </div>

          <h2
            id="workflow-heading"
            className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-5 leading-[1.1]"
          >
            Six-agent pipeline,{' '}
            <br className="hidden sm:block" />
            <span className="gradient-text">zero manual effort</span>
          </h2>

          <p
            className="text-lg max-w-xl mx-auto leading-relaxed"
            style={{ color: 'var(--text-secondary)' }}
          >
            A LangGraph-orchestrated multi-agent system runs end-to-end — from
            raw log to remediation report — in seconds.
          </p>
        </motion.div>

        {/* ── Pipeline ── */}
        <div className="flex flex-col items-center gap-0">
          {stages.map((stage, index) => (
            <StageCard
              key={stage.id}
              stage={stage}
              index={index}
              isLast={index === stages.length - 1}
            />
          ))}
        </div>

        {/* ── End badge ── */}
        <motion.div
          className="flex justify-center mt-6"
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3, ease: 'backOut' }}
        >
          <div
            className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full text-sm font-semibold"
            style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              color: '#10b981',
            }}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Analysis complete — report ready in dashboard
          </div>
        </motion.div>

        {/* ── LangGraph callout ── */}
        <motion.div
          className="mt-14 rounded-2xl p-6 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          style={{
            background: 'var(--step-bg)',
            backdropFilter: 'blur(20px)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <p
            className="text-sm font-medium mb-1"
            style={{ color: 'var(--text-muted)' }}
          >
            Orchestrated by
          </p>
          <p
            className="text-xl font-extrabold gradient-text"
          >
            LangGraph State Machine
          </p>
          <p
            className="text-sm mt-2 max-w-md mx-auto"
            style={{ color: 'var(--text-secondary)' }}
          >
            Each agent receives typed state, transforms it, and passes it downstream.
            Failures at any stage are captured with full trace context.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
