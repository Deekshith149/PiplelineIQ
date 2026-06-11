import { auth, signOut } from '@/auth';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import {
  Zap,
  GitBranch,
  CheckCircle2,
  AlertTriangle,
  BrainCircuit,
  LogOut,
  Activity,
  Clock,
  TrendingDown,
  ChevronRight,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Dashboard | PipelineIQ',
  description: 'Your AI-powered CI/CD failure analysis dashboard.',
};

/* ── Mock pipeline runs ── */
const mockRuns = [
  {
    id: 'run-1',
    repo: 'acme/frontend',
    branch: 'main',
    status: 'fixed',
    error: 'Dependency version conflict',
    time: '2 min ago',
    duration: '1m 34s',
    color: '#10b981',
  },
  {
    id: 'run-2',
    repo: 'acme/api-service',
    branch: 'feat/auth',
    status: 'analyzing',
    error: 'Memory limit exceeded in build step',
    time: '8 min ago',
    duration: '3m 12s',
    color: '#a855f7',
  },
  {
    id: 'run-3',
    repo: 'acme/infra',
    branch: 'release/v2.1',
    status: 'failed',
    error: 'Terraform state lock timeout',
    time: '15 min ago',
    duration: '5m 08s',
    color: '#ef4444',
  },
];

const statCards = [
  { label: 'Pipelines Analyzed', value: '247', icon: Activity, color: '#60a5fa' },
  { label: 'Avg. Fix Time', value: '3.2m', icon: Clock, color: '#a855f7' },
  { label: 'MTTR Reduction', value: '62%', icon: TrendingDown, color: '#10b981' },
];

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const { name, email, image } = session.user;
  const initials = name
    ? name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : email?.[0]?.toUpperCase() ?? '?';

  return (
    <main
      className="min-h-screen px-4 py-8"
      style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}
    >
      {/* ── Top ambient glow ── */}
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at top, rgba(99,102,241,0.1) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
        aria-hidden="true"
      />

      <div className="max-w-5xl mx-auto relative z-10">
        {/* ── Header ── */}
        <header className="flex items-center justify-between mb-10">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
            >
              <Zap className="w-4.5 h-4.5 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-lg tracking-tight">
              Pipeline<span style={{
                background: 'linear-gradient(135deg, #60a5fa, #818cf8)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>IQ</span>
            </span>
          </div>

          {/* User info + sign-out */}
          <div className="flex items-center gap-3">
            {/* Avatar */}
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={image}
                alt={name ?? 'User avatar'}
                width={36}
                height={36}
                className="w-9 h-9 rounded-full ring-2 ring-indigo-500/40"
              />
            ) : (
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}
              >
                {initials}
              </div>
            )}

            <div className="hidden sm:block">
              <p className="text-sm font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>
                {name ?? email}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {email}
              </p>
            </div>

            {/* Sign-out form */}
            <form
              action={async () => {
                'use server';
                await signOut({ redirectTo: '/' });
              }}
            >
              <button
                id="dashboard-signout-btn"
                type="submit"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200"
                style={{
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text-muted)',
                  background: 'transparent',
                }}
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </form>
          </div>
        </header>

        {/* ── Welcome banner ── */}
        <div
          className="rounded-2xl p-6 mb-8"
          style={{
            background: 'linear-gradient(135deg, rgba(37,99,235,0.15) 0%, rgba(79,70,229,0.1) 100%)',
            border: '1px solid rgba(99,102,241,0.25)',
          }}
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                Welcome back{name ? `, ${name.split(' ')[0]}` : ''}! 👋
              </h1>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Your AI pipeline analyzer is ready. Connect a repository to get started.
              </p>
            </div>
            <a
              href="#"
              id="dashboard-connect-repo-btn"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #2563eb, #4f46e5)',
                boxShadow: '0 0 24px rgba(79,142,247,0.35)',
              }}
            >
              <GitBranch className="w-4 h-4" />
              Connect Repository
              <ChevronRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {statCards.map(({ label, value, icon: Icon, color }) => (
            <div
              key={label}
              className="rounded-xl p-5"
              style={{
                background: 'var(--glass-bg)',
                backdropFilter: 'blur(16px)',
                border: '1px solid var(--glass-border)',
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  {label}
                </span>
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: `${color}18`, border: `1px solid ${color}30` }}
                >
                  <Icon className="w-4 h-4" style={{ color }} />
                </div>
              </div>
              <p className="text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* ── Recent pipeline runs ── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
              Recent Pipeline Runs
            </h2>
            <span
              className="text-xs px-2.5 py-1 rounded-full font-medium"
              style={{
                background: 'rgba(16,185,129,0.1)',
                border: '1px solid rgba(16,185,129,0.25)',
                color: '#10b981',
              }}
            >
              Live · 3 active
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {mockRuns.map((run) => (
              <div
                key={run.id}
                className="rounded-xl p-4 flex items-center gap-4"
                style={{
                  background: 'var(--glass-bg)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid var(--glass-border)',
                }}
              >
                {/* Status icon */}
                <div
                  className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ background: `${run.color}15`, border: `1px solid ${run.color}30` }}
                >
                  {run.status === 'fixed' && <CheckCircle2 className="w-5 h-5" style={{ color: run.color }} />}
                  {run.status === 'analyzing' && <BrainCircuit className="w-5 h-5" style={{ color: run.color }} />}
                  {run.status === 'failed' && <AlertTriangle className="w-5 h-5" style={{ color: run.color }} />}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                      {run.repo}
                    </span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-mono"
                      style={{
                        background: 'var(--step-number-bg)',
                        color: 'var(--text-muted)',
                        border: '1px solid var(--glass-border)',
                      }}
                    >
                      {run.branch}
                    </span>
                  </div>
                  <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                    {run.error}
                  </p>
                </div>

                {/* Meta */}
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-medium" style={{ color: run.color }}>
                    {run.status === 'fixed' ? 'Fixed' : run.status === 'analyzing' ? 'Analyzing…' : 'Needs attention'}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {run.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Auth proof badge ── */}
        <div className="mt-10 flex items-center justify-center">
          <span
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium"
            style={{
              background: 'rgba(16,185,129,0.08)',
              border: '1px solid rgba(16,185,129,0.2)',
              color: '#10b981',
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Authenticated via OAuth 2.0 · Session active
          </span>
        </div>
      </div>
    </main>
  );
}
