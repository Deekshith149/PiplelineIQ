'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  RotateCcw,
  Terminal,
  Tags,
  SearchCode,
  Wand2,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ChevronRight,
} from 'lucide-react';

/* ─────────────────────────────────────────────
   Demo data
───────────────────────────────────────────── */
const RAW_LOG = `2026-06-03T08:14:01Z [INFO]  Starting GitHub Actions workflow: ci.yml
2026-06-03T08:14:02Z [INFO]  Checking out repository @ main (a3f9b2c)
2026-06-03T08:14:04Z [INFO]  Setting up Python 3.11 environment
2026-06-03T08:14:06Z [INFO]  Running: pip install -r requirements.txt
2026-06-03T08:14:07Z [ERROR] ERROR: Could not open requirements file:
                             [Errno 2] No such file or directory: 'requirements.txt'
2026-06-03T08:14:07Z [ERROR] Process finished with exit code 1
2026-06-03T08:14:08Z [ERROR] Downstream step 'Run Tests' skipped due to prior failure
2026-06-03T08:14:08Z [ERROR] Downstream step 'Build Docker Image' skipped
2026-06-03T08:14:09Z [FATAL] Workflow failed — 3 steps did not complete`;

const CLASSIFICATION_RESULT = {
  category: 'Dependency Failure',
  confidence: 97.2,
  model: 'DistilBERT',
  alternates: [
    { label: 'Environment Failure', score: 2.1 },
    { label: 'Compilation Failure', score: 0.7 },
  ],
};

const ROOT_CAUSE_RESULT = {
  summary:
    'The pip dependency installation stage failed because `requirements.txt` is absent from the repository root directory. The file was never committed — likely excluded by `.gitignore` or simply forgotten.',
  evidence: [
    "Line 7: ERROR: Could not open requirements file: [Errno 2] No such file or directory: 'requirements.txt'",
    'Line 8: Process finished with exit code 1',
  ],
  agent: 'Gemini 1.5 Pro',
};

const REMEDIATION_RESULT = [
  {
    priority: 'High',
    color: '#ef4444',
    steps: [
      'Verify `requirements.txt` exists in your repo root: `ls requirements.txt`',
      'If missing, generate it: `pip freeze > requirements.txt`',
      'Stage and commit: `git add requirements.txt && git commit -m "fix: add requirements.txt"`',
    ],
  },
  {
    priority: 'Medium',
    color: '#f59e0b',
    steps: [
      'Check your `.gitignore` — ensure `requirements.txt` is not accidentally excluded',
      'Validate the workflow `pip install` step points to the correct path if file is in a subdirectory',
    ],
  },
  {
    priority: 'Low',
    color: '#10b981',
    steps: [
      'Consider pinning dependency versions with `pip-tools` for reproducible builds',
      'Add a CI pre-check step that validates required config files exist before running installs',
    ],
  },
];

/* ─────────────────────────────────────────────
   Demo stages
───────────────────────────────────────────── */
type DemoStage = 'idle' | 'logs' | 'classifying' | 'rootcause' | 'remediation' | 'done';

const STAGE_LABELS: Record<DemoStage, string> = {
  idle: 'Ready',
  logs: 'Parsing Logs...',
  classifying: 'Classifying Failure...',
  rootcause: 'Analyzing Root Cause...',
  remediation: 'Generating Fixes...',
  done: 'Analysis Complete',
};

const STAGE_ORDER: DemoStage[] = ['logs', 'classifying', 'rootcause', 'remediation', 'done'];
const STAGE_DELAYS: Record<DemoStage, number> = {
  idle: 0,
  logs: 1200,
  classifying: 1600,
  rootcause: 2000,
  remediation: 1800,
  done: 0,
};

/* ─────────────────────────────────────────────
   Typewriter hook
───────────────────────────────────────────── */
function useTypewriter(text: string, active: boolean, speed = 12) {
  const [displayed, setDisplayed] = useState('');
  const idxRef = useRef(0);

  useEffect(() => {
    if (!active) { setDisplayed(''); idxRef.current = 0; return; }
    setDisplayed('');
    idxRef.current = 0;
    const iv = setInterval(() => {
      idxRef.current++;
      setDisplayed(text.slice(0, idxRef.current));
      if (idxRef.current >= text.length) clearInterval(iv);
    }, speed);
    return () => clearInterval(iv);
  }, [text, active, speed]);

  return displayed;
}

/* ─────────────────────────────────────────────
   Step tab button
───────────────────────────────────────────── */
function StepTab({
  icon: Icon,
  label,
  active,
  done,
  color,
}: {
  icon: React.ElementType;
  label: string;
  active: boolean;
  done: boolean;
  color: string;
}) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-300"
      style={{
        background: active ? `${color}18` : done ? `${color}0d` : 'transparent',
        border: `1px solid ${active ? color + '50' : done ? color + '30' : 'var(--glass-border)'}`,
        color: active ? color : done ? color + 'bb' : 'var(--text-muted)',
      }}
    >
      {done && !active ? (
        <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color }} />
      ) : (
        <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${active ? 'animate-pulse' : ''}`} />
      )}
      <span className="hidden sm:block">{label}</span>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main Demo Component
───────────────────────────────────────────── */
export default function Demo() {
  const [stage, setStage] = useState<DemoStage>('idle');
  const [running, setRunning] = useState(false);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const logText = useTypewriter(RAW_LOG, stage === 'logs' || stage !== 'idle');
  const rootCauseText = useTypewriter(
    ROOT_CAUSE_RESULT.summary,
    stage === 'rootcause' || stage === 'remediation' || stage === 'done'
  );

  const clearTimeouts = () => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  };

  const runAnalysis = () => {
    if (running) return;
    setRunning(true);
    setStage('idle');
    clearTimeouts();

    let cumulativeDelay = 300;
    STAGE_ORDER.forEach((s) => {
      const t = setTimeout(() => {
        setStage(s);
        if (s === 'done') setRunning(false);
      }, cumulativeDelay);
      timeoutsRef.current.push(t);
      cumulativeDelay += STAGE_DELAYS[s];
    });
  };

  const reset = () => {
    clearTimeouts();
    setStage('idle');
    setRunning(false);
  };

  useEffect(() => () => clearTimeouts(), []);

  const isDone = stage === 'done';
  const passedLogs = ['logs', 'classifying', 'rootcause', 'remediation', 'done'].indexOf(stage) >= 0;
  const passedClass = ['classifying', 'rootcause', 'remediation', 'done'].indexOf(stage) >= 0;
  const passedRoot = ['rootcause', 'remediation', 'done'].indexOf(stage) >= 0;
  const passedRemediation = ['remediation', 'done'].indexOf(stage) >= 0;

  return (
    <section
      id="demo"
      className="relative z-10 py-28 px-4 overflow-hidden"
      aria-labelledby="demo-heading"
    >
      {/* Subtle background */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% 60%, rgba(99,102,241,0.04) 0%, transparent 70%)',
        }}
      />

      <div className="max-w-5xl mx-auto">
        {/* ── Header ── */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="h-px w-8" style={{ background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.6))' }} />
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--indigo-400)' }}>
              Live Playground
            </span>
            <div className="h-px w-8" style={{ background: 'linear-gradient(90deg, rgba(99,102,241,0.6), transparent)' }} />
          </div>
          <h2 id="demo-heading" className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4 leading-[1.1]">
            See the AI in <span className="gradient-text">action</span>
          </h2>
          <p className="text-lg max-w-xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
            Click Analyze and watch the full multi-agent pipeline run on a real failure log.
          </p>
        </motion.div>

        {/* ── Demo Shell ── */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'var(--glass-bg)',
            backdropFilter: 'var(--glass-blur)',
            WebkitBackdropFilter: 'var(--glass-blur)',
            border: '1px solid var(--glass-hover-border)',
            boxShadow: 'var(--shadow-hover)',
          }}
        >
          {/* ── Window chrome ── */}
          <div
            className="flex items-center justify-between px-5 py-3 border-b"
            style={{ borderColor: 'var(--glass-border)' }}
          >
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ background: '#ef4444' }} />
                <div className="w-3 h-3 rounded-full" style={{ background: '#f59e0b' }} />
                <div className="w-3 h-3 rounded-full" style={{ background: '#10b981' }} />
              </div>
              <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                pipelineiq — demo.log
              </span>
            </div>
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
              style={{
                background: isDone ? 'rgba(16,185,129,0.1)' : running ? 'rgba(99,102,241,0.1)' : 'var(--step-number-bg)',
                border: `1px solid ${isDone ? 'rgba(16,185,129,0.35)' : running ? 'rgba(99,102,241,0.3)' : 'var(--glass-border)'}`,
                color: isDone ? '#10b981' : running ? 'var(--indigo-400)' : 'var(--text-muted)',
              }}
            >
              {running && <Loader2 className="w-3 h-3 animate-spin" />}
              {isDone && <CheckCircle2 className="w-3 h-3" />}
              {!running && !isDone && <Terminal className="w-3 h-3" />}
              <span>{STAGE_LABELS[stage]}</span>
            </div>
          </div>

          {/* ── Step tabs ── */}
          <div
            className="flex items-center gap-2 px-5 py-3 border-b overflow-x-auto"
            style={{ borderColor: 'var(--glass-border)' }}
          >
            <StepTab icon={Terminal} label="Raw Logs" active={stage === 'logs'} done={passedLogs && stage !== 'logs'} color="#60a5fa" />
            <ChevronRight className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
            <StepTab icon={Tags} label="Classification" active={stage === 'classifying'} done={passedClass && stage !== 'classifying'} color="#a855f7" />
            <ChevronRight className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
            <StepTab icon={SearchCode} label="Root Cause" active={stage === 'rootcause'} done={passedRoot && stage !== 'rootcause'} color="#22d3ee" />
            <ChevronRight className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
            <StepTab icon={Wand2} label="Fixes" active={stage === 'remediation'} done={passedRemediation && stage !== 'remediation'} color="#10b981" />
          </div>

          {/* ── Content panels ── */}
          <div className="p-5 min-h-[320px] grid md:grid-cols-2 gap-4">

            {/* Left: Raw log terminal */}
            <div
              className="rounded-xl p-4 font-mono text-xs leading-relaxed overflow-auto max-h-[420px]"
              style={{
                background: 'rgba(0,0,0,0.35)',
                border: '1px solid rgba(99,102,241,0.15)',
                color: '#94a3b8',
              }}
            >
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-700">
                <Terminal className="w-3 h-3 text-indigo-400" />
                <span className="text-indigo-400 font-semibold">ci-pipeline.log</span>
              </div>
              <AnimatePresence>
                {(passedLogs || stage !== 'idle') && (
                  <motion.pre
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="whitespace-pre-wrap break-words"
                    style={{ color: '#94a3b8' }}
                  >
                    {logText.split('\n').map((line, i) => {
                      const color = line.includes('[ERROR]') || line.includes('[FATAL]')
                        ? '#f87171'
                        : line.includes('[INFO]')
                        ? '#6ee7b7'
                        : '#94a3b8';
                      return (
                        <span key={i} style={{ color }} className="block">
                          {line}
                        </span>
                      );
                    })}
                  </motion.pre>
                )}
              </AnimatePresence>
              {stage === 'idle' && (
                <p className="text-slate-600 italic">Waiting for analysis to start...</p>
              )}
            </div>

            {/* Right: Analysis results */}
            <div className="flex flex-col gap-3">

              {/* Classification card */}
              <AnimatePresence>
                {passedClass && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="rounded-xl p-4"
                    style={{
                      background: 'rgba(168,85,247,0.06)',
                      border: '1px solid rgba(168,85,247,0.25)',
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Tags className="w-4 h-4" style={{ color: '#a855f7' }} />
                        <span className="text-xs font-bold" style={{ color: '#a855f7' }}>
                          DistilBERT Classification
                        </span>
                      </div>
                      <span
                        className="text-xs font-mono px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(168,85,247,0.15)', color: '#a855f7' }}
                      >
                        {CLASSIFICATION_RESULT.confidence}%
                      </span>
                    </div>
                    <p className="text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                      {CLASSIFICATION_RESULT.category}
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      {CLASSIFICATION_RESULT.alternates.map((alt) => (
                        <span
                          key={alt.label}
                          className="text-[10px] font-mono px-2 py-0.5 rounded"
                          style={{
                            background: 'var(--step-number-bg)',
                            color: 'var(--text-muted)',
                            border: '1px solid var(--glass-border)',
                          }}
                        >
                          {alt.label}: {alt.score}%
                        </span>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Root cause card */}
              <AnimatePresence>
                {passedRoot && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                    className="rounded-xl p-4"
                    style={{
                      background: 'rgba(34,211,238,0.05)',
                      border: '1px solid rgba(34,211,238,0.2)',
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <SearchCode className="w-4 h-4" style={{ color: '#22d3ee' }} />
                      <span className="text-xs font-bold" style={{ color: '#22d3ee' }}>
                        Gemini Root Cause
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      {rootCauseText}
                    </p>
                    {passedRoot && (
                      <div className="mt-2 space-y-1">
                        {ROOT_CAUSE_RESULT.evidence.map((e) => (
                          <div
                            key={e}
                            className="text-[10px] font-mono px-2 py-1 rounded"
                            style={{
                              background: 'rgba(239,68,68,0.08)',
                              border: '1px solid rgba(239,68,68,0.2)',
                              color: '#f87171',
                            }}
                          >
                            ⚠ {e}
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Idle + classifying placeholder */}
              {!passedClass && (
                <div
                  className="flex-1 rounded-xl flex flex-col items-center justify-center gap-3 p-8"
                  style={{ border: '1px dashed var(--glass-border)' }}
                >
                  {running ? (
                    <>
                      <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--indigo-400)' }} />
                      <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                        {STAGE_LABELS[stage]}
                      </p>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-8 h-8" style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        Click <strong>Analyze</strong> to start
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── Remediation panel ── */}
          <AnimatePresence>
            {passedRemediation && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="border-t px-5 py-4"
                style={{ borderColor: 'var(--glass-border)' }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Wand2 className="w-4 h-4" style={{ color: '#10b981' }} />
                  <span className="text-sm font-bold" style={{ color: '#10b981' }}>
                    Gemini Remediation — Actionable Fixes
                  </span>
                </div>
                <div className="grid sm:grid-cols-3 gap-3">
                  {REMEDIATION_RESULT.map((group) => (
                    <motion.div
                      key={group.priority}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                      className="rounded-xl p-3"
                      style={{
                        background: `${group.color}08`,
                        border: `1px solid ${group.color}28`,
                      }}
                    >
                      <span
                        className="inline-block text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full mb-2"
                        style={{ background: `${group.color}18`, color: group.color }}
                      >
                        {group.priority}
                      </span>
                      <ul className="space-y-1.5">
                        {group.steps.map((s, i) => (
                          <li
                            key={i}
                            className="text-xs leading-relaxed flex gap-1.5"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            <span className="mt-0.5 flex-shrink-0" style={{ color: group.color }}>›</span>
                            {s}
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── CTA bar ── */}
          <div
            className="flex items-center justify-between px-5 py-4 border-t"
            style={{ borderColor: 'var(--glass-border)' }}
          >
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {isDone ? '✅ Full analysis complete in ~5 seconds' : 'Real analysis runs on your actual CI/CD logs'}
            </p>
            <div className="flex items-center gap-2">
              {(running || isDone) && (
                <button
                  onClick={reset}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105"
                  style={{
                    border: '1px solid var(--glass-border)',
                    color: 'var(--text-secondary)',
                    background: 'var(--step-number-bg)',
                  }}
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset
                </button>
              )}
              <button
                id="demo-analyze-btn"
                onClick={runAnalysis}
                disabled={running}
                className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white transition-all duration-200 hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
                style={{
                  background: 'linear-gradient(135deg, #2563eb, #4f46e5)',
                  boxShadow: running ? 'none' : '0 0 20px rgba(79,142,247,0.3)',
                }}
              >
                {running ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 fill-current" />
                )}
                {running ? 'Analyzing...' : 'Analyze'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
