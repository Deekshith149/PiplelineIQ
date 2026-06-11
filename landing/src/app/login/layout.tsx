import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In | PipelineIQ',
  description: 'Sign in to PipelineIQ with Google or GitHub to start analyzing your CI/CD failures.',
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
