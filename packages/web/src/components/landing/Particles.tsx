"use client";

import { useEffect, useRef } from "react";

export function Particles({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf: number;
    const dots: { x: number; y: number; vx: number; vy: number; r: number }[] = [];

    const updateSize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      
      // Re-initialize dots on resize to distribute them correctly
      dots.length = 0;
      const numDots = Math.floor((canvas.width * canvas.height) / 15000); // Responsive dot count
      for (let i = 0; i < Math.min(numDots, 100); i++) {
        dots.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          r: Math.random() * 1.2 + 0.3,
        });
      }
    };
    
    updateSize();
    window.addEventListener("resize", updateSize);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      for (const d of dots) {
        d.x += d.vx;
        d.y += d.vy;
        
        // Bounce off edges
        if (d.x < 0 || d.x > canvas.width) d.vx *= -1;
        if (d.y < 0 || d.y > canvas.height) d.vy *= -1;
        
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(120,120,255,0.25)";
        ctx.fill();
      }
      
      // Connect dots
      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const dx = dots[i]!.x - dots[j]!.x;
          const dy = dots[i]!.y - dots[j]!.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(dots[i]!.x, dots[i]!.y);
            ctx.lineTo(dots[j]!.x, dots[j]!.y);
            ctx.strokeStyle = `rgba(120,120,255,${0.08 * (1 - dist / 100)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };
    
    draw();
    
    return () => {
      window.removeEventListener("resize", updateSize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
    />
  );
}
