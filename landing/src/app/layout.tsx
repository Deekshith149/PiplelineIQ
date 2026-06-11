import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import CursorGlow from '@/components/CursorGlow';
import ScrollProgress from '@/components/ScrollProgress';
import ThemeProvider from '@/components/ThemeProvider';
import AuthProvider from '@/components/AuthProvider';

/* ── Fonts ── */
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800', '900'],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
  weight: ['400', '500', '700'],
});

/* ── SEO Metadata ── */
export const metadata: Metadata = {
  title: {
    default: 'PipelineIQ — Stop Guessing Why Deployments Fail',
    template: '%s | PipelineIQ',
  },
  description:
    'AI agents automatically analyze CI/CD pipeline failures, detect root causes with DistilBERT + Gemini, and generate step-by-step remediation fixes. Reduce MTTR by 60%.',
  keywords: [
    'CI/CD failure analysis',
    'AI DevOps',
    'pipeline debugging',
    'log analysis AI',
    'GitHub Actions',
    'root cause analysis',
    'Gemini AI',
    'SRE tools',
    'platform engineering',
    'DevOps automation',
  ],
  authors: [{ name: 'PipelineIQ Team' }],
  creator: 'PipelineIQ',
  metadataBase: new URL('https://pipelineiq.ai'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://pipelineiq.ai',
    title: 'PipelineIQ — Stop Guessing Why Deployments Fail',
    description:
      'AI-powered platform that analyzes CI/CD failures, detects root causes, and generates remediation fixes in minutes.',
    siteName: 'PipelineIQ',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PipelineIQ',
    description:
      'AI-powered platform that analyzes CI/CD failures, detects root causes, and generates remediation fixes in minutes.',
    creator: '@pipelineiq',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: '#030712',
  colorScheme: 'dark light',
  width: 'device-width',
  initialScale: 1,
};

/* ── Root Layout ── */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full antialiased" style={{ background: 'var(--bg-base)' }}>
        <ThemeProvider>
          <AuthProvider>
            {/* Global UI chrome */}
            <ScrollProgress />
            <CursorGlow />
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
