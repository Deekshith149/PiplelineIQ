import AnimatedBackground from '@/components/AnimatedBackground';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Features from '@/components/Features';
import Workflow from '@/components/Workflow';
import Demo from '@/components/Demo';
import Metrics from '@/components/Metrics';
import Comparison from '@/components/Comparison';
import Pricing from '@/components/Pricing';
import CTAFooter from '@/components/CTAFooter';

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden">
      {/* Fixed animated background (z-0) */}
      <AnimatedBackground />

      {/* Floating navbar */}
      <Navbar />

      {/* Phase 1: Hero */}
      <Hero />

      {/* Phase 2: Features */}
      <Features />

      {/* Phase 3: How it Works — 6-agent pipeline */}
      <Workflow />

      {/* Phase 4: Interactive Demo */}
      <Demo />

      {/* Phase 5: Metrics + Mission statement */}
      <Metrics />

      {/* Phase 6: Comparison — Traditional vs AI */}
      <Comparison />

      {/* Phase 7: Plans — contact-based pricing */}
      <Pricing />

      {/* Phase 8: Beta CTA + Footer */}
      <CTAFooter />
    </main>
  );
}
