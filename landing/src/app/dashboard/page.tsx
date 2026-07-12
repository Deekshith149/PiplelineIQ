import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import DashboardClient from '@/components/DashboardClient';

export const metadata: Metadata = {
  title: 'Dashboard | PipelineIQ',
  description: 'Your AI-powered CI/CD failure analysis dashboard.',
};

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
      {/* Ambient top glow */}
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at top, rgba(99,102,241,0.1) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
        aria-hidden="true"
      />

      <DashboardClient
        userName={name ?? null}
        userEmail={email ?? 'user'}
        userImage={image ?? null}
        initials={initials}
      />
    </main>
  );
}
