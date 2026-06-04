'use client';

import { useEffect, useRef } from 'react';

export default function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrameId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Dot grid params
    const spacing = 36;
    let tick = 0;

    const draw = () => {
      tick += 0.008;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const cols = Math.ceil(canvas.width / spacing) + 1;
      const rows = Math.ceil(canvas.height / spacing) + 1;

      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          const x = c * spacing;
          const y = r * spacing;
          const dist = Math.sqrt(
            Math.pow((x - canvas.width / 2) / canvas.width, 2) +
            Math.pow((y - canvas.height / 2) / canvas.height, 2)
          );
          const wave = Math.sin(dist * 8 - tick * 2) * 0.5 + 0.5;
          const alpha = 0.04 + wave * 0.06;
          const radius = 0.8 + wave * 0.7;

          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(99, 102, 241, ${alpha})`;
          ctx.fill();
        }
      }

      animFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <>
      {/* Canvas dot grid */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-0"
        aria-hidden="true"
      />

      {/* Gradient blobs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        {/* Top-left blob */}
        <div
          className="absolute rounded-full blur-[120px]"
          style={{
            width: '600px',
            height: '600px',
            top: '-150px',
            left: '-150px',
            opacity: 'var(--blob-opacity-1)',
            background: 'radial-gradient(circle, #3b82f6 0%, #6366f1 60%, transparent 100%)',
            animation: 'blob-drift 18s ease-in-out infinite',
          }}
        />
        {/* Bottom-right blob */}
        <div
          className="absolute rounded-full blur-[140px]"
          style={{
            width: '700px',
            height: '700px',
            bottom: '-200px',
            right: '-200px',
            opacity: 'var(--blob-opacity-2)',
            background: 'radial-gradient(circle, #6366f1 0%, #a855f7 60%, transparent 100%)',
            animation: 'blob-drift-2 22s ease-in-out infinite',
          }}
        />
        {/* Center subtle glow */}
        <div
          className="absolute rounded-full blur-[180px]"
          style={{
            width: '800px',
            height: '400px',
            top: '30%',
            left: '50%',
            transform: 'translateX(-50%)',
            opacity: 'var(--blob-opacity-3)',
            background: 'radial-gradient(ellipse, #4f8ef7 0%, transparent 70%)',
            animation: 'pulse-glow 8s ease-in-out infinite',
          }}
        />
      </div>
    </>
  );
}
