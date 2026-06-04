'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Zap,
  ArrowRight,
  Mail,
  GitBranch,
  Globe,
  Share2,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

/* ─────────────────────────────────────────────
   Footer links
───────────────────────────────────────────── */
const footerLinks = {
  Product: [
    { label: 'Features', href: '#features' },
    { label: 'How it Works', href: '#workflow' },
    { label: 'Live Demo', href: '#demo' },
    { label: 'Metrics', href: '#metrics' },
  ],
  Company: [
    { label: 'About Us', href: '#' },
    { label: 'Blog', href: '#' },
    { label: 'Careers', href: '#' },
    { label: 'Contact', href: '#cta' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
    { label: 'Security', href: '#' },
    { label: 'Cookie Policy', href: '#' },
  ],
};

const socialLinks = [
  { icon: GitBranch, href: '#', label: 'GitHub' },
  { icon: Globe,     href: '#', label: 'Website' },
  { icon: Share2,    href: '#', label: 'Social' },
  { icon: Mail,      href: 'mailto:hello@pipelineiq.ai', label: 'Email' },
];

/* ─────────────────────────────────────────────
   CTA + Footer component
───────────────────────────────────────────── */
export default function CTAFooter() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || status === 'loading') return;
    setStatus('loading');
    // Simulate API call
    await new Promise((r) => setTimeout(r, 1200));
    setStatus('done');
  };

  const scrollTo = (href: string) => {
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      {/* ═══════════════════════════════════════
          BETA CTA SECTION
      ═══════════════════════════════════════ */}
      <section
        id="cta"
        className="relative z-10 py-28 px-4 overflow-hidden"
        aria-labelledby="cta-heading"
      >
        {/* Radial gradient backdrop */}
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden="true"
          style={{
            background:
              'radial-gradient(ellipse 70% 80% at 50% 50%, rgba(99,102,241,0.1) 0%, transparent 70%)',
          }}
        />

        {/* Decorative ring */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
          aria-hidden="true"
          style={{
            border: '1px solid rgba(99,102,241,0.08)',
            animation: 'spin-slow 40s linear infinite',
          }}
        />
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full pointer-events-none"
          aria-hidden="true"
          style={{
            border: '1px solid rgba(99,102,241,0.12)',
            animation: 'spin-slow 30s linear infinite reverse',
          }}
        />

        <div className="max-w-3xl mx-auto text-center relative z-10">
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6"
              style={{
                background: 'rgba(79,142,247,0.1)',
                border: '1px solid rgba(79,142,247,0.3)',
                color: 'var(--blue-400)',
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: '#10b981' }}
              />
              Now in Public Beta — Join Free
            </span>
          </motion.div>

          <motion.h2
            id="cta-heading"
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 leading-[1.07]"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.08 }}
          >
            Stop debugging.{' '}
            <br className="hidden sm:block" />
            <span className="gradient-text">Start shipping.</span>
          </motion.h2>

          <motion.p
            className="text-lg leading-relaxed mb-10 max-w-xl mx-auto"
            style={{ color: 'var(--text-secondary)' }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.16 }}
          >
            Connect your first repository and get your first AI-powered CI/CD failure
            analysis in under 2 minutes. No credit card. No setup complexity.
          </motion.p>

          {/* Email signup form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.24 }}
          >
            {status === 'done' ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl text-base font-semibold"
                style={{
                  background: 'rgba(16,185,129,0.1)',
                  border: '1px solid rgba(16,185,129,0.35)',
                  color: '#10b981',
                }}
              >
                <CheckCircle2 className="w-5 h-5" />
                You&apos;re on the list! We&apos;ll be in touch soon.
              </motion.div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto"
              >
                <input
                  id="cta-email-input"
                  type="email"
                  required
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 px-5 py-3.5 rounded-xl text-sm font-medium outline-none transition-all duration-200"
                  style={{
                    background: 'var(--glass-bg)',
                    border: '1px solid var(--glass-border)',
                    color: 'var(--text-primary)',
                  }}
                  onFocus={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,0.5)';
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)';
                  }}
                  onBlur={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--glass-border)';
                    (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                  }}
                />
                <button
                  id="cta-submit-btn"
                  type="submit"
                  disabled={status === 'loading'}
                  className="flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:scale-105 hover:-translate-y-0.5 disabled:opacity-70 disabled:scale-100 whitespace-nowrap"
                  style={{
                    background: 'linear-gradient(135deg, #2563eb, #4f46e5)',
                    boxShadow: '0 0 28px rgba(79,142,247,0.4)',
                  }}
                >
                  {status === 'loading' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Get Early Access
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Trust indicators */}
            <div className="flex flex-wrap items-center justify-center gap-5 mt-6">
              {[
                'No credit card required',
                'Cancel anytime',
                '500+ engineers joined',
              ].map((item) => (
                <span
                  key={item}
                  className="flex items-center gap-1.5 text-xs"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#10b981' }} />
                  {item}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════ */}
      <footer
        className="relative z-10 px-4 pb-8"
        aria-label="Site footer"
      >
        <div
          className="max-w-6xl mx-auto rounded-2xl overflow-hidden"
          style={{
            background: 'var(--glass-bg)',
            backdropFilter: 'var(--glass-blur)',
            WebkitBackdropFilter: 'var(--glass-blur)',
            border: '1px solid var(--glass-border)',
          }}
        >
          {/* Top footer bar */}
          <div
            className="px-8 py-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 border-b"
            style={{ borderColor: 'var(--glass-border)' }}
          >
            {/* Brand column */}
            <div className="lg:col-span-2">
              {/* Logo */}
              <div className="flex items-center gap-2.5 mb-4">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
                >
                  <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
                </div>
                <span
                  className="font-bold text-base tracking-tight"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Pipeline<span className="gradient-text-blue">IQ</span>
                </span>
              </div>

              <p
                className="text-sm leading-relaxed mb-5 max-w-xs"
                style={{ color: 'var(--text-secondary)' }}
              >
                AI-powered CI/CD failure analysis — from raw log to root cause
                and remediation in seconds, not hours.
              </p>

              {/* Social links */}
              <div className="flex items-center gap-2">
                {socialLinks.map(({ icon: Icon, href, label }) => (
                  <a
                    key={label}
                    href={href}
                    aria-label={label}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200"
                    style={{
                      border: '1px solid var(--glass-border)',
                      color: 'var(--text-muted)',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,0.4)';
                      (e.currentTarget as HTMLElement).style.color = 'var(--indigo-400)';
                      (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.08)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = 'var(--glass-border)';
                      (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)';
                      (e.currentTarget as HTMLElement).style.background = 'transparent';
                    }}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </a>
                ))}
              </div>
            </div>

            {/* Link columns */}
            {Object.entries(footerLinks).map(([category, links]) => (
              <div key={category}>
                <p
                  className="text-xs font-bold uppercase tracking-widest mb-4"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {category}
                </p>
                <ul className="flex flex-col gap-2.5">
                  {links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-sm transition-colors duration-200"
                        style={{ color: 'var(--text-secondary)' }}
                        onClick={(e) => {
                          if (link.href.startsWith('#')) {
                            e.preventDefault();
                            scrollTo(link.href);
                          }
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.color = 'var(--indigo-400)';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
                        }}
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div
            className="px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3"
          >
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              © {new Date().getFullYear()} PipelineIQ. Built with{' '}
              <span style={{ color: 'var(--indigo-400)' }}>♥</span> for engineering teams worldwide.
            </p>

            <div className="flex items-center gap-2">
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                style={{
                  background: 'rgba(16,185,129,0.08)',
                  border: '1px solid rgba(16,185,129,0.2)',
                  color: '#10b981',
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                All systems operational
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
