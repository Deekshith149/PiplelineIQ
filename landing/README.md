# PipelineIQ — Landing Page

Premium Next.js SaaS landing page for [PipelineIQ](https://github.com/Deekshith149/pipelineiq) — the AI-powered CI/CD failure intelligence platform.

## Tech Stack

- **Next.js 16** with App Router
- **Tailwind CSS v4** (`@theme` syntax)
- **Framer Motion** — scroll animations, staggered reveals, animated counters
- **next-themes** — dark / light mode toggle
- **lucide-react** — icon set

## Sections

| Section | Component |
|---|---|
| Hero | `Hero.tsx` — animated pipeline cycling display |
| Features | `Features.tsx` — 6 glassmorphic feature cards |
| How it Works | `Workflow.tsx` — 6-stage LangGraph agent pipeline |
| Live Demo | `Demo.tsx` — interactive multi-stage log analysis |
| Metrics | `Metrics.tsx` — animated counters + mission statement |
| Comparison | `Comparison.tsx` — Traditional vs AI platform table |
| Plans | `Pricing.tsx` — 3 tiers, contact-based (no prices) |
| CTA + Footer | `CTAFooter.tsx` — email capture + glassmorphic footer |

## Development

```bash
npm install
npm run dev
# → http://localhost:3000
```

## Production Build

```bash
npm run build
npm run start
```

## Deployment

Deployed via Vercel with Root Directory set to `landing`.  
Auto-deploys on every push to `main`.
