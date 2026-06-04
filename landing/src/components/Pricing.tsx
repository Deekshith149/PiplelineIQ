'use client';

import { motion } from 'framer-motion';
import { Check, Mail, ArrowRight, Sparkles } from 'lucide-react';

/* ─────────────────────────────────────────────
   Plan definitions — no prices shown
───────────────────────────────────────────── */
const plans = [
  {
    id: 'starter',
    name: 'Starter',
    tagline: 'Perfect for individual engineers and small teams exploring AI-powered debugging.',
    badge: null,
    accentColor: '#3b82f6',
    gradient: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
    glowColor: 'rgba(59,130,246,0.2)',
    features: [
      'Up to 50 log analyses / month',
      'GitHub Actions integration',
      'DistilBERT failure classification',
      'Gemini root cause analysis',
      'Basic remediation suggestions',
      'Dashboard with report history',
      'Community support',
    ],
    cta: 'Get Started Free',
    ctaVariant: 'secondary' as const,
    highlight: false,
  },
  {
    id: 'professional',
    name: 'Professional',
    tagline: 'For growing engineering teams that need deeper insights and broader integrations.',
    badge: 'Most Popular',
    accentColor: '#6366f1',
    gradient: 'linear-gradient(135deg, #4f46e5, #6366f1)',
    glowColor: 'rgba(99,102,241,0.3)',
    features: [
      'Unlimited log analyses',
      'All CI/CD platforms (GitHub, GitLab, Jenkins, Azure, CircleCI)',
      'Advanced DistilBERT classification',
      'Gemini 1.5 Pro root cause + remediation',
      'Cross-run pattern detection',
      'Priority-ranked fix suggestions',
      'Team workspace & shared reports',
      'REST API access',
      'Priority email support',
    ],
    cta: 'Contact for Pricing',
    ctaVariant: 'primary' as const,
    highlight: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    tagline: 'For large organisations requiring custom deployment, SLAs, and dedicated support.',
    badge: null,
    accentColor: '#a855f7',
    gradient: 'linear-gradient(135deg, #7c3aed, #a855f7)',
    glowColor: 'rgba(168,85,247,0.2)',
    features: [
      'Everything in Professional',
      'Self-hosted / on-premise deployment',
      'Custom Gemini model fine-tuning',
      'SSO & SAML authentication',
      'Role-based access control',
      'Advanced analytics & audit logs',
      'Custom CI/CD integrations',
      'Dedicated SLA + uptime guarantee',
      'Dedicated customer success manager',
    ],
    cta: 'Talk to Sales',
    ctaVariant: 'secondary' as const,
    highlight: false,
  },
] as const;

/* ─────────────────────────────────────────────
   Plan Card
───────────────────────────────────────────── */
function PlanCard({
  plan,
  index,
}: {
  plan: (typeof plans)[number];
  index: number;
}) {
  const isPrimary = plan.ctaVariant === 'primary';

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.65, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
      className="relative flex flex-col rounded-2xl overflow-hidden"
      style={{
        background: 'var(--glass-bg)',
        backdropFilter: 'var(--glass-blur)',
        WebkitBackdropFilter: 'var(--glass-blur)',
        border: plan.highlight
          ? `1px solid ${plan.accentColor}50`
          : '1px solid var(--glass-border)',
        boxShadow: plan.highlight
          ? `var(--shadow-hover), 0 0 50px ${plan.glowColor}`
          : 'var(--shadow-card)',
      }}
    >
      {/* Top accent bar */}
      <div
        className="h-1 w-full"
        style={{ background: plan.gradient }}
      />

      {/* Popular badge */}
      {plan.badge && (
        <div className="absolute top-4 right-4">
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold text-white"
            style={{
              background: plan.gradient,
              boxShadow: `0 0 16px ${plan.glowColor}`,
            }}
          >
            <Sparkles className="w-3 h-3" />
            {plan.badge}
          </span>
        </div>
      )}

      <div className="p-7 flex flex-col flex-1 gap-6">
        {/* Plan name + tagline */}
        <div>
          <h3
            className="text-xl font-extrabold mb-2"
            style={{ color: plan.accentColor }}
          >
            {plan.name}
          </h3>
          <p
            className="text-sm leading-relaxed"
            style={{ color: 'var(--text-secondary)' }}
          >
            {plan.tagline}
          </p>
        </div>

        {/* "Price" area — replaced with contact CTA message */}
        <div
          className="rounded-xl p-4 text-center"
          style={{
            background: `${plan.accentColor}0d`,
            border: `1px solid ${plan.accentColor}25`,
          }}
        >
          <div className="flex items-center justify-center gap-2 mb-1">
            <Mail className="w-4 h-4" style={{ color: plan.accentColor }} />
            <span
              className="text-sm font-semibold"
              style={{ color: plan.accentColor }}
            >
              Reach out for pricing
            </span>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            We tailor plans to your team size and usage needs.
          </p>
        </div>

        {/* Feature list */}
        <ul className="flex flex-col gap-2.5 flex-1">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2.5">
              <div
                className="mt-0.5 w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                style={{
                  background: `${plan.accentColor}18`,
                }}
              >
                <Check
                  className="w-2.5 h-2.5"
                  style={{ color: plan.accentColor }}
                  strokeWidth={3}
                />
              </div>
              <span
                className="text-sm leading-snug"
                style={{ color: 'var(--text-secondary)' }}
              >
                {feature}
              </span>
            </li>
          ))}
        </ul>

        {/* CTA button */}
        <a
          href="#cta"
          onClick={(e) => {
            e.preventDefault();
            document.querySelector('#cta')?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-[1.02] hover:-translate-y-0.5 group"
          style={
            isPrimary
              ? {
                  background: plan.gradient,
                  color: 'white',
                  boxShadow: `0 0 24px ${plan.glowColor}`,
                }
              : {
                  background: 'transparent',
                  color: plan.accentColor,
                  border: `1px solid ${plan.accentColor}40`,
                }
          }
          onMouseEnter={(e) => {
            if (!isPrimary) {
              (e.currentTarget as HTMLElement).style.background = `${plan.accentColor}12`;
              (e.currentTarget as HTMLElement).style.borderColor = `${plan.accentColor}70`;
            }
          }}
          onMouseLeave={(e) => {
            if (!isPrimary) {
              (e.currentTarget as HTMLElement).style.background = 'transparent';
              (e.currentTarget as HTMLElement).style.borderColor = `${plan.accentColor}40`;
            }
          }}
        >
          {plan.cta}
          <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
        </a>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   Pricing Section
───────────────────────────────────────────── */
export default function Pricing() {
  return (
    <section
      id="pricing"
      className="relative z-10 py-28 px-4 overflow-hidden"
      aria-labelledby="pricing-heading"
    >
      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% 50%, rgba(99,102,241,0.04) 0%, transparent 70%)',
        }}
      />

      <div className="max-w-6xl mx-auto">
        {/* ── Header ── */}
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="h-px w-8" style={{ background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.6))' }} />
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--indigo-400)' }}>
              Plans
            </span>
            <div className="h-px w-8" style={{ background: 'linear-gradient(90deg, rgba(99,102,241,0.6), transparent)' }} />
          </div>

          <h2
            id="pricing-heading"
            className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-5 leading-[1.1]"
          >
            Built for every{' '}
            <span className="gradient-text">engineering team</span>
          </h2>

          <p
            className="text-lg max-w-xl mx-auto leading-relaxed mb-6"
            style={{ color: 'var(--text-secondary)' }}
          >
            We don&apos;t believe in one-size-fits-all pricing. Tell us about your
            team and we&apos;ll craft a plan that works for you.
          </p>

          {/* Contact nudge banner */}
          <motion.div
            className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full text-sm font-medium"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            style={{
              background: 'rgba(99,102,241,0.08)',
              border: '1px solid rgba(99,102,241,0.25)',
              color: 'var(--indigo-400)',
            }}
          >
            <Mail className="w-4 h-4" />
            Reach out to learn more — no commitment required
          </motion.div>
        </motion.div>

        {/* ── Plan Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {plans.map((plan, index) => (
            <PlanCard key={plan.id} plan={plan} index={index} />
          ))}
        </div>

        {/* ── Bottom FAQ-style strip ── */}
        <motion.div
          className="mt-14 grid sm:grid-cols-3 gap-5"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          {[
            {
              q: 'What counts as a log analysis?',
              a: 'Each CI/CD workflow run processed through the full pipeline — parse → classify → root cause → remediation — counts as one analysis.',
            },
            {
              q: 'Can I switch plans later?',
              a: 'Absolutely. Plans scale up or down as your team grows. Contact us at any time to adjust.',
            },
            {
              q: 'Is there a free trial?',
              a: 'Yes — the Starter plan is free to begin with. Reach out to us to explore Professional or Enterprise with a guided trial.',
            },
          ].map((item) => (
            <div
              key={item.q}
              className="rounded-xl p-5"
              style={{
                background: 'var(--glass-bg)',
                border: '1px solid var(--glass-border)',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <p className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                {item.q}
              </p>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {item.a}
              </p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
