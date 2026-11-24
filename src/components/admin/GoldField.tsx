"use client";

import { useEffect, useRef } from "react";

/**
 * Ambient background for the hub: a hexagonal lattice of fine gold dots.
 * A slow diagonal swell of light drifts across it; dots near the cursor
 * brighten and ease aside, then settle back. Kept deliberately quiet.
 * Honors prefers-reduced-motion (static lattice) and pauses when hidden.
 */
export function GoldField({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const GAP = 30; // lattice spacing (px)
    const R = 1.7; // dot radius
    const REACH = 150; // cursor influence radius
    const PUSH = 7; // max displacement near cursor

    type Dot = { x: number; y: number; dx: number; dy: number; a: number };
    let dots: Dot[] = [];
    let w = 0;
    let h = 0;
    let raf = 0;
    const mouse = { x: -9999, y: -9999, tx: -9999, ty: -9999 };

    const layout = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dots = [];
      const rowH = GAP * 0.866;
      for (let r = 0, y = rowH / 2; y < h + GAP; r++, y += rowH) {
        for (let x = r % 2 ? GAP / 2 : 0; x < w + GAP; x += GAP) dots.push({ x, y, dx: 0, dy: 0, a: 0.14 });
      }
    };

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      // ease the tracked cursor toward the real one for a fluid trail
      mouse.x += (mouse.tx - mouse.x) * 0.12;
      mouse.y += (mouse.ty - mouse.y) * 0.12;
      const time = t / 1000;
      const cx = w / 2;
      const cy = h / 2;

      for (const d of dots) {
        // slow diagonal swell plus a faint ripple outward from the center
        const swell = Math.sin((d.x + d.y) * 0.0055 - time * 0.55);
        const ripple = Math.sin(Math.hypot(d.x - cx, d.y - cy) * 0.018 - time * 0.9);
        let alpha = 0.11 + 0.09 * swell + 0.04 * ripple;
        let tx = 0;
        let ty = 0;

        const mx = d.x - mouse.x;
        const my = d.y - mouse.y;
        const dist = Math.hypot(mx, my);
        if (dist < REACH) {
          const k = 1 - dist / REACH;
          const ease = k * k * (3 - 2 * k); // smoothstep
          alpha += 0.55 * ease;
          if (dist > 0.001) {
            tx = (mx / dist) * PUSH * ease;
            ty = (my / dist) * PUSH * ease;
          }
        }

        d.dx += (tx - d.dx) * 0.1;
        d.dy += (ty - d.dy) * 0.1;
        d.a += (alpha - d.a) * 0.15;

        ctx.globalAlpha = Math.max(0.03, Math.min(0.75, d.a));
        ctx.beginPath();
        ctx.arc(d.x + d.dx, d.y + d.dy, R + 0.9 * Math.max(0, d.a - 0.2), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };

    const paintStatic = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.globalAlpha = 0.14;
      for (const d of dots) {
        ctx.beginPath();
        ctx.arc(d.x, d.y, R, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const start = () => {
      ctx.fillStyle = "#B08D4E";
      if (reduce) return paintStatic();
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(draw);
    };

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.tx = e.clientX - rect.left;
      mouse.ty = e.clientY - rect.top;
      if (mouse.x < -1000) {
        mouse.x = mouse.tx;
        mouse.y = mouse.ty;
      }
    };
    const onLeave = () => {
      mouse.tx = mouse.ty = -9999;
    };
    const onVisibility = () => (document.hidden ? cancelAnimationFrame(raf) : start());
    const ro = new ResizeObserver(() => {
      layout();
      start();
    });

    layout();
    start();
    ro.observe(canvas);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return <canvas ref={ref} aria-hidden className={className} />;
}
