'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Menu, X, ArrowRight } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'How it Works', href: '#workflow' },
  { label: 'Demo', href: '#demo' },
  { label: 'Why Switch', href: '#comparison' },
  { label: 'Pricing', href: '#pricing' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleNavClick = (href: string) => {
    setMobileOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 left-0 right-0 z-[90] px-4 py-3"
        role="banner"
      >
        <nav
          className="max-w-6xl mx-auto rounded-2xl px-5 py-3 flex items-center justify-between transition-all duration-300"
          style={{
            /* ── All backgrounds use CSS vars — adapts to light/dark ── */
            background: scrolled ? 'var(--navbar-bg-scrolled)' : 'var(--navbar-bg)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: scrolled
              ? '1px solid var(--navbar-border-scrolled)'
              : '1px solid var(--navbar-border)',
            boxShadow: scrolled ? 'var(--shadow-hover)' : 'none',
          }}
          aria-label="Main navigation"
        >
          {/* Logo */}
          <a
            href="#"
            className="flex items-center gap-2.5 select-none group"
            aria-label="CI/CD Analyzer AI — home"
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
            >
              <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            {/* Logo text: uses text-primary so it's dark in light mode, white in dark */}
            <span
              className="font-bold text-base tracking-tight"
              style={{ color: 'var(--text-primary)' }}
            >
              CI/CD<span className="gradient-text-blue"> Analyzer AI</span>
            </span>
          </a>

          {/* Desktop nav links */}
          <ul className="hidden md:flex items-center gap-1" role="list">
            {navLinks.map((link) => (
              <li key={link.label}>
                <button
                  onClick={() => handleNavClick(link.href)}
                  className="px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer"
                  style={{ color: 'var(--text-secondary)' }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)';
                    (e.currentTarget as HTMLElement).style.background = 'var(--step-number-bg)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                  }}
                >
                  {link.label}
                </button>
              </li>
            ))}
          </ul>

          {/* CTA + Theme Toggle + Mobile Toggle */}
          <div className="flex items-center gap-2">
            {/* Theme toggle — always visible */}
            <ThemeToggle />

            <a
              href="#cta"
              onClick={(e) => { e.preventDefault(); handleNavClick('#cta'); }}
              className="hidden md:flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all duration-200 hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #2563eb, #4f46e5)',
                boxShadow: '0 0 20px rgba(79, 142, 247, 0.35)',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = '0 0 32px rgba(79, 142, 247, 0.6)';
                (e.currentTarget as HTMLElement).style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = '0 0 20px rgba(79, 142, 247, 0.35)';
                (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
              }}
            >
              Start Beta
              <ArrowRight className="w-3.5 h-3.5" />
            </a>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen((o) => !o)}
              className="md:hidden w-9 h-9 rounded-lg flex items-center justify-center transition-colors duration-200"
              style={{
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
                background: 'var(--step-number-bg)',
              }}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </nav>

        {/* Mobile menu — fully theme-aware */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="max-w-6xl mx-auto mt-2 rounded-2xl p-4"
              style={{
                background: 'var(--navbar-bg-scrolled)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid var(--navbar-border-scrolled)',
                boxShadow: 'var(--shadow-hover)',
              }}
              role="navigation"
              aria-label="Mobile navigation"
            >
              <ul className="flex flex-col gap-1" role="list">
                {navLinks.map((link) => (
                  <li key={link.label}>
                    <button
                      onClick={() => handleNavClick(link.href)}
                      className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors duration-150"
                      style={{ color: 'var(--text-secondary)' }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background = 'var(--step-number-bg)';
                        (e.currentTarget as HTMLElement).style.color = 'var(--indigo-500)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background = 'transparent';
                        (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
                      }}
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
                <li className="mt-2">
                  <button
                    onClick={() => handleNavClick('#cta')}
                    className="w-full py-3 rounded-xl text-sm font-semibold text-white"
                    style={{ background: 'linear-gradient(135deg, #2563eb, #4f46e5)' }}
                  >
                    Start Beta →
                  </button>
                </li>
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>
    </>
  );
}
