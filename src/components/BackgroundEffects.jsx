import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "../animations/usePrefersReducedMotion";

const rnd = (min, max) => min + Math.random() * (max - min);

export default function BackgroundEffects() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;

    const reduced = prefersReducedMotion();
    const DPR = Math.min(window.devicePixelRatio || 1, 2);

    let width = 0;
    let height = 0;
    let particles = [];
    let raf = 0;

    const COUNT = reduced
      ? 0
      : Math.min(Math.max(Math.floor(window.innerWidth / 36), 22), 54);

    const seed = () => {
      particles = Array.from({ length: COUNT }, () => ({
        x: rnd(0, width),
        y: rnd(0, height),
        r: rnd(0.6, 2.1),
        vx: rnd(-0.14, 0.14),
        vy: rnd(-0.18, -0.04),
        a: rnd(0.14, 0.55),
        tw: rnd(0.006, 0.03),
      }));
    };

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * DPR;
      canvas.height = height * DPR;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      seed();
    };

    const LINK_DIST = 120;
    const draw = (t = 0) => {
      ctx.clearRect(0, 0, width, height);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < -8) {
          p.y = height + 8;
          p.x = rnd(0, width);
        }
        if (p.x < -8) p.x = width + 8;
        if (p.x > width + 8) p.x = -8;

        const flicker = 0.7 + 0.3 * Math.sin(t * p.tw + p.x);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(160, 200, 255, ${(p.a * flicker).toFixed(3)})`;
        ctx.fill();
      }

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < LINK_DIST * LINK_DIST) {
            const alpha = (1 - Math.sqrt(d2) / LINK_DIST) * 0.13;
            ctx.strokeStyle = `rgba(150, 195, 255, ${alpha.toFixed(3)})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
    };

    const loop = (t) => {
      draw(t);
      raf = requestAnimationFrame(loop);
    };

    resize();
    window.addEventListener("resize", resize);

    if (reduced) {
      draw(0);
    } else {
      raf = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="particle-canvas" aria-hidden="true" />;
}