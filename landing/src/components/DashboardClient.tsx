'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Activity,
  TrendingDown,
  Zap,
  CheckCircle2,
  AlertTriangle,
  BrainCircuit,
  Upload,
  X,
  ChevronDown,
  ChevronUp,
  FileText,
  Layers,
} from 'lucide-react';

/* ── Types ── */
interface Fix {
  fix: string;
  priority: string;
  explanation: string;
}

interface AnalysisReport {
  pipeline_platform: string;
  failure_type: string;
  classification_confidence: number;
  root_cause: string;
  evidence: string[];
  recommended_fixes: Fix[];
  summary: string;
  timestamp: string;
}

interface HistoryEntry {
  id: string;
  analyzedAt: string;
  filename: string;
  report: AnalysisReport;
}

/* ── Local storage key per user ── */
const storageKey = (email: string) => `pipelineiq_history_${email}`;

function loadHistory(email: string): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(storageKey(email));
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

function saveHistory(email: string, entries: HistoryEntry[]) {
  try {
    localStorage.setItem(storageKey(email), JSON.stringify(entries));
  } catch {}
}

/* ── Derived stats ── */
function computeStats(history: HistoryEntry[]) {
  const total = history.length;
  const totalFixes = history.reduce((s, e) => s + e.report.recommended_fixes.length, 0);
  // estimate MTTR reduction: each analysis with fixes saves ~30% more per fix capped at 80%
  const mttr =
    total === 0
      ? 0
      : Math.min(Math.round(10 + (totalFixes / Math.max(total, 1)) * 12), 80);
  return { total, totalFixes, mttr };
}

/* ── Status colour helper ── */
function statusColor(failureType: string) {
  const ft = failureType.toLowerCase();
  if (ft.includes('memory') || ft.includes('oom')) return '#f59e0b';
  if (ft.includes('test') || ft.includes('auth')) return '#a855f7';
  if (ft.includes('deploy') || ft.includes('k8s') || ft.includes('crash')) return '#ef4444';
  return '#10b981';
}

/* ── Sample logs ── */
const SAMPLES: Record<string, { label: string; color: string; log: string }> = {
  npm: {
    label: '📦 npm Conflict',
    color: '#ef4444',
    log: `##[group]Run npm install\nnpm ERR! code ERESOLVE\nnpm ERR! ERESOLVE unable to resolve dependency tree\nnpm ERR! Found: react@18.2.0\nnpm ERR! Could not resolve dependency:\nnpm ERR! peer react@"^17.0.2" from react-dnd@14.0.5\nnpm ERR! Fix the upstream dependency conflict, or retry with --legacy-peer-deps\n##[error]Process completed with exit code 1.`,
  },
  docker: {
    label: '🐳 Docker OOM',
    color: '#f59e0b',
    log: `Step 8/14 : RUN npm run build\nKilled\n##[error]The process '/usr/bin/docker' failed with exit code 137\nOOMKilled: true\nMemory limit: 512MB\nMemory used: 589MB`,
  },
  terraform: {
    label: '🏗️ Terraform Lock',
    color: '#a855f7',
    log: `╷\n│ Error: Error acquiring the state lock\n│ Lock Info:\n│   ID: 9b3e4a21-3c2d-4f8e-b1a0-d5e7f9c2a847\n│   Operation: OperationTypePlan\n│   Created: 2024-01-15 09:23:41 +0000 UTC\n╵\nError: exit status 1`,
  },
  k8s: {
    label: '☸️ K8s CrashLoop',
    color: '#ef4444',
    log: `api-service-7d9f8b6c4-xk2pl   0/1     CrashLoopBackOff   4          3m41s\nkubectl logs --previous:\nKeyError: 'DATABASE_URL'\nERROR: Container exited with code 1\nDeployment failed. Rolling back to previous revision...`,
  },
};

/* ── Props ── */
interface DashboardClientProps {
  userName: string | null;
  userEmail: string;
  userImage: string | null;
  initials: string;
}

export default function DashboardClient({
  userName,
  userEmail,
  userImage,
  initials,
}: DashboardClientProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [logText, setLogText] = useState('');
  const [filename, setFilename] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  /* Load history from localStorage on mount */
  useEffect(() => {
    setHistory(loadHistory(userEmail));
  }, [userEmail]);

  /* Drag-and-drop */
  useEffect(() => {
    const zone = dropRef.current;
    if (!zone) return;
    const over = (e: DragEvent) => { e.preventDefault(); zone.classList.add('drag-over'); };
    const leave = () => zone.classList.remove('drag-over');
    const drop = (e: DragEvent) => {
      e.preventDefault();
      zone.classList.remove('drag-over');
      const file = e.dataTransfer?.files[0];
      if (file) readFile(file);
    };
    zone.addEventListener('dragover', over);
    zone.addEventListener('dragleave', leave);
    zone.addEventListener('drop', drop);
    return () => {
      zone.removeEventListener('dragover', over);
      zone.removeEventListener('dragleave', leave);
      zone.removeEventListener('drop', drop);
    };
  }, [showUpload]);

  function readFile(file: File) {
    setFilename(file.name);
    const reader = new FileReader();
    reader.onload = (e) => setLogText((e.target?.result as string) ?? '');
    reader.readAsText(file);
  }

  async function runAnalysis() {
    if (!logText.trim()) { setError('Paste a log or upload a file first.'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/analyze-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ log_text: logText }),
      });
      const data = await res.json();
      if (!res.ok || !data.report) throw new Error(data.error ?? 'Analysis failed');

      const entry: HistoryEntry = {
        id: crypto.randomUUID(),
        analyzedAt: new Date().toISOString(),
        filename: filename || 'pasted-log.txt',
        report: data.report as AnalysisReport,
      };

      const updated = [entry, ...history];
      setHistory(updated);
      saveHistory(userEmail, updated);
      setShowUpload(false);
      setLogText('');
      setFilename('');
      setExpandedId(entry.id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg.includes('502') || msg.includes('unreachable')
        ? '⚠️ Backend not reachable. Make sure the FastAPI server is running: uvicorn src.main:app --reload'
        : msg);
    } finally {
      setLoading(false);
    }
  }

  const stats = computeStats(history);

  return (
    <div className="max-w-5xl mx-auto relative z-10">

      {/* ── Header ── */}
      <header className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)' }}>
            <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-lg tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Pipeline<span style={{ background: 'linear-gradient(135deg,#60a5fa,#818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>IQ</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          {userImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={userImage} alt={userName ?? 'avatar'} width={36} height={36}
              className="w-9 h-9 rounded-full ring-2 ring-indigo-500/40" />
          ) : (
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
              style={{ background: 'linear-gradient(135deg,#6366f1,#a855f7)' }}>{initials}</div>
          )}
          <div className="hidden sm:block">
            <p className="text-sm font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>{userName ?? userEmail}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{userEmail}</p>
          </div>
          <form action="/api/auth/signout" method="POST">
            <input type="hidden" name="callbackUrl" value="/" />
            <button type="button" id="dashboard-signout-btn"
              onClick={() => { document.cookie = 'next-auth.session-token=; Max-Age=0; path=/'; window.location.href = '/'; }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all"
              style={{ border: '1px solid var(--glass-border)', color: 'var(--text-muted)', background: 'transparent', cursor: 'pointer' }}>
              <span>Sign out</span>
            </button>
          </form>
        </div>
      </header>

      {/* ── Welcome + Analyze button ── */}
      <div className="rounded-2xl p-6 mb-8"
        style={{ background: 'linear-gradient(135deg,rgba(37,99,235,0.15),rgba(79,70,229,0.1))', border: '1px solid rgba(99,102,241,0.25)' }}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
              Welcome back{userName ? `, ${userName.split(' ')[0]}` : ''}! 👋
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {stats.total === 0
                ? 'Upload your first CI/CD log to start AI-powered analysis.'
                : `You have analyzed ${stats.total} pipeline${stats.total !== 1 ? 's' : ''}. Keep going!`}
            </p>
          </div>
          <button
            id="dashboard-analyze-btn"
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:scale-105"
            style={{ background: 'linear-gradient(135deg,#2563eb,#4f46e5)', boxShadow: '0 0 24px rgba(79,142,247,0.35)', border: 'none', cursor: 'pointer' }}>
            <Upload className="w-4 h-4" />
            Analyze New Log
          </button>
        </div>
      </div>

      {/* ── Upload modal ── */}
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-2xl rounded-2xl p-6"
            style={{ background: 'var(--bg-base)', border: '1px solid rgba(99,102,241,0.3)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Analyze a CI/CD Log</h2>
              <button onClick={() => { setShowUpload(false); setLogText(''); setFilename(''); setError(''); }}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sample quick-load buttons */}
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>Quick load a sample</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(SAMPLES).map(([key, s]) => (
                  <button key={key} onClick={() => { setLogText(s.log); setFilename(`sample_${key}.log`); }}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                    style={{ background: `${s.color}15`, border: `1px solid ${s.color}30`, color: s.color, cursor: 'pointer' }}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Drop zone */}
            <div ref={dropRef}
              onClick={() => fileRef.current?.click()}
              className="rounded-xl mb-3 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all"
              style={{ border: '2px dashed rgba(99,102,241,0.3)', padding: '24px', background: 'rgba(99,102,241,0.03)' }}>
              <Upload className="w-6 h-6" style={{ color: 'var(--text-muted)' }} />
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {filename || 'Drop a log file or click to browse'}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>.log · .txt · any format</p>
              <input ref={fileRef} type="file" className="hidden"
                onChange={(e) => { if (e.target.files?.[0]) readFile(e.target.files[0]); }} />
            </div>

            {/* Textarea */}
            <textarea
              value={logText}
              onChange={(e) => setLogText(e.target.value)}
              placeholder="Or paste your CI/CD log output here..."
              rows={8}
              className="w-full rounded-xl mb-4 text-xs leading-relaxed"
              style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', fontFamily: 'var(--font-jetbrains-mono, monospace)', padding: '12px', resize: 'vertical', outline: 'none' }}
            />

            {error && (
              <div className="mb-4 rounded-xl px-4 py-3 text-sm"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5' }}>
                {error}
              </div>
            )}

            <button
              id="dashboard-run-analysis-btn"
              onClick={runAnalysis}
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all flex items-center justify-center gap-2"
              style={{ background: loading ? 'rgba(99,102,241,0.5)' : 'linear-gradient(135deg,#3b82f6,#6366f1)', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : '0 0 24px rgba(99,102,241,0.4)' }}>
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Running AI Agents...
                </>
              ) : (
                <><Zap className="w-4 h-4" /> Analyze with AI</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Pipelines Analyzed', value: stats.total.toString(), icon: Activity, color: '#60a5fa', sub: 'by you' },
          { label: 'Fixes Generated', value: stats.totalFixes.toString(), icon: Layers, color: '#a855f7', sub: 'total suggestions' },
          { label: 'Est. MTTR Reduction', value: stats.total === 0 ? '—' : `${stats.mttr}%`, icon: TrendingDown, color: '#10b981', sub: stats.total === 0 ? 'analyze a log to see' : 'from AI remediation' },
        ].map(({ label, value, icon: Icon, color, sub }) => (
          <div key={label} className="rounded-xl p-5"
            style={{ background: 'var(--glass-bg)', backdropFilter: 'blur(16px)', border: '1px solid var(--glass-border)' }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{label}</span>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
            </div>
            <p className="text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>{value}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* ── Analysis history ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Your Analysis History</h2>
          {history.length > 0 && (
            <span className="text-xs px-2.5 py-1 rounded-full font-medium"
              style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', color: '#818cf8' }}>
              {history.length} run{history.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {history.length === 0 ? (
          /* Empty state */
          <div className="rounded-2xl p-12 text-center"
            style={{ background: 'var(--glass-bg)', border: '2px dashed var(--glass-border)' }}>
            <FileText className="w-10 h-10 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>No analyses yet</p>
            <p className="text-xs mb-6" style={{ color: 'var(--text-muted)' }}>
              Upload a CI/CD log file and let the AI find the root cause and generate fixes.
            </p>
            <button onClick={() => setShowUpload(true)}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)', border: 'none', cursor: 'pointer' }}>
              Analyze Your First Log
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {history.map((entry) => {
              const color = statusColor(entry.report.failure_type);
              const isOpen = expandedId === entry.id;
              const conf = entry.report.classification_confidence;
              const timeAgo = (() => {
                const diff = Date.now() - new Date(entry.analyzedAt).getTime();
                const mins = Math.floor(diff / 60000);
                if (mins < 1) return 'just now';
                if (mins < 60) return `${mins}m ago`;
                const hrs = Math.floor(mins / 60);
                if (hrs < 24) return `${hrs}h ago`;
                return `${Math.floor(hrs / 24)}d ago`;
              })();

              return (
                <div key={entry.id} className="rounded-xl overflow-hidden"
                  style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>

                  {/* Row */}
                  <button
                    onClick={() => setExpandedId(isOpen ? null : entry.id)}
                    className="w-full flex items-center gap-4 p-4 text-left transition-all"
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>

                    {/* Status icon */}
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
                      {entry.report.failure_type.toLowerCase().includes('test') || entry.report.failure_type.toLowerCase().includes('auth')
                        ? <BrainCircuit className="w-5 h-5" style={{ color }} />
                        : entry.report.recommended_fixes.length > 0
                          ? <CheckCircle2 className="w-5 h-5" style={{ color }} />
                          : <AlertTriangle className="w-5 h-5" style={{ color }} />}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                          {entry.report.failure_type}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full font-mono"
                          style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)' }}>
                          {entry.report.pipeline_platform}
                        </span>
                        {conf > 0 && (
                          <span className="text-xs px-2 py-0.5 rounded-full"
                            style={{ background: `${color}12`, color, border: `1px solid ${color}25` }}>
                            {Math.round(conf * 100)}% confidence
                          </span>
                        )}
                      </div>
                      <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                        {entry.filename} · {entry.report.recommended_fixes.length} fixes
                      </p>
                    </div>

                    {/* Meta */}
                    <div className="text-right flex-shrink-0 flex items-center gap-3">
                      <div>
                        <p className="text-xs font-medium" style={{ color }}>Analyzed</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{timeAgo}</p>
                      </div>
                      {isOpen
                        ? <ChevronUp className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                        : <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />}
                    </div>
                  </button>

                  {/* Expanded detail */}
                  {isOpen && (
                    <div className="px-4 pb-5 border-t" style={{ borderColor: 'var(--glass-border)' }}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">

                        {/* Root cause */}
                        <div className="rounded-xl p-4"
                          style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)' }}>
                          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>🔬 Root Cause</p>
                          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>{entry.report.root_cause || 'See evidence.'}</p>
                        </div>

                        {/* Evidence */}
                        <div className="rounded-xl p-4"
                          style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)' }}>
                          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>🔴 Key Evidence</p>
                          {entry.report.evidence.slice(0, 3).map((ev, i) => (
                            <p key={i} className="text-xs font-mono mb-1 truncate"
                              style={{ color: '#fca5a5', background: 'rgba(239,68,68,0.06)', borderLeft: '2px solid #ef4444', padding: '4px 8px', borderRadius: '4px' }}>
                              {ev}
                            </p>
                          ))}
                        </div>
                      </div>

                      {/* Fixes */}
                      {entry.report.recommended_fixes.length > 0 && (
                        <div className="mt-4">
                          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>🛠️ AI-Generated Fixes</p>
                          <div className="flex flex-col gap-2">
                            {entry.report.recommended_fixes.map((fix, i) => {
                              const pColor = fix.priority === 'high' ? '#ef4444' : fix.priority === 'medium' ? '#f59e0b' : '#60a5fa';
                              return (
                                <div key={i} className="rounded-xl p-3 flex gap-3"
                                  style={{ background: `${pColor}06`, border: `1px solid ${pColor}20` }}>
                                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                                    style={{ background: `${pColor}18`, color: pColor }}>{i + 1}</div>
                                  <div>
                                    <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{fix.fix}</p>
                                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{fix.explanation}</p>
                                  </div>
                                  <span className="ml-auto flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-full self-start"
                                    style={{ background: `${pColor}15`, color: pColor }}>
                                    {fix.priority}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Footer badge ── */}
      <div className="mt-10 flex items-center justify-center">
        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium"
          style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', color: '#10b981' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Authenticated via OAuth 2.0 · Session active
        </span>
      </div>
    </div>
  );
}
