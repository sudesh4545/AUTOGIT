"use client";

import { useEffect, useRef } from "react";

export function ParticleField() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let width = 0;
    let height = 0;
    let frame = 0;
    let animation = 0;
    const points = Array.from({ length: 45 }, (_, index) => ({
      x: (index * 0.61803398875) % 1,
      y: (index * 0.41421356237) % 1,
      radius: index % 8 === 0 ? 1.6 : 0.75,
      speed: (index % 5 + 1) * 0.000045,
    }));
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const draw = () => {
      context.clearRect(0, 0, width, height);
      const locations = points.map(point => ({
        x: point.x * width,
        y: ((point.y + (motion.matches ? 0 : frame * point.speed)) % 1) * height,
        radius: point.radius,
      }));
      for (let index = 0; index < locations.length; index++) {
        const point = locations[index];
        context.beginPath();
        context.arc(point.x, point.y, point.radius, 0, Math.PI * 2);
        context.fillStyle = index % 7 === 0 ? "rgba(255,70,91,.68)" : index % 4 === 0 ? "rgba(89,189,255,.54)" : "rgba(170,65,77,.34)";
        context.fill();
        if (index % 3 === 0) {
          const next = locations[(index + 11) % locations.length];
          const distance = Math.hypot(point.x - next.x, point.y - next.y);
          if (distance < 260) {
            context.beginPath();
            context.moveTo(point.x, point.y);
            context.lineTo(next.x, next.y);
            context.strokeStyle = index % 2 === 0 ? `rgba(255,70,91,${0.09 * (1 - distance / 260)})` : `rgba(89,189,255,${0.09 * (1 - distance / 260)})`;
            context.stroke();
          }
        }
      }
      frame++;
      if (!motion.matches && document.visibilityState === "visible") animation = requestAnimationFrame(draw);
    };
    const onVisibility = () => {
      cancelAnimationFrame(animation);
      if (document.visibilityState === "visible") draw();
    };
    resize();
    draw();
    const onResize = () => { resize(); if (motion.matches) draw(); };
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelAnimationFrame(animation);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);
  return <canvas ref={ref} className="particle-field" aria-hidden="true" />;
}
