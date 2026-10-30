import React, { useEffect, useRef } from 'react';

interface CyberBackgroundProps {
  dimmed?: boolean;
}

export const CyberBackground: React.FC<CyberBackgroundProps> = ({ dimmed = false }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Particle nodes
    interface StarNode {
      x: number;
      y: number;
      z: number;
      vx: number;
      vy: number;
      color: string;
      size: number;
    }

    const starCount = 65;
    const stars: StarNode[] = [];
    const colors = ['#06b6d4', '#8b5cf6', '#ec4899', '#3b82f6'];

    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        z: Math.random() * 2 + 0.5,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 2 + 1,
      });
    }

    let gridOffset = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Deep cyber background gradient
      const gradient = ctx.createRadialGradient(
        width / 2,
        height / 2,
        width * 0.1,
        width / 2,
        height / 2,
        width * 0.8
      );
      gradient.addColorStop(0, '#0f172a');
      gradient.addColorStop(0.6, '#090d16');
      gradient.addColorStop(1, '#020617');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Perspective horizon grid
      gridOffset = (gridOffset + 0.4) % 40;
      const horizonY = height * 0.65;

      ctx.strokeStyle = 'rgba(6, 182, 212, 0.12)';
      ctx.lineWidth = 1;

      // Vertical perspective lines
      const vanishingX = width / 2;
      const numLines = 24;
      for (let i = -numLines; i <= numLines; i++) {
        const bottomX = vanishingX + (i * width) / (numLines * 0.7);
        ctx.beginPath();
        ctx.moveTo(vanishingX, horizonY);
        ctx.lineTo(bottomX, height);
        ctx.stroke();
      }

      // Horizontal lines with perspective compression
      for (let y = horizonY; y < height; y += 14) {
        const factor = (y - horizonY) / (height - horizonY);
        const dynamicY = horizonY + Math.pow(factor, 1.8) * (height - horizonY) + (gridOffset * factor * 0.4);
        if (dynamicY <= height) {
          ctx.beginPath();
          ctx.moveTo(0, dynamicY);
          ctx.lineTo(width, dynamicY);
          ctx.strokeStyle = `rgba(168, 85, 247, ${0.05 + factor * 0.15})`;
          ctx.stroke();
        }
      }

      // Floating particles
      stars.forEach((star) => {
        star.x += star.vx;
        star.y += star.vy;

        if (star.x < 0) star.x = width;
        if (star.x > width) star.x = 0;
        if (star.y < 0) star.y = height;
        if (star.y > height) star.y = 0;

        ctx.fillStyle = star.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = star.color;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Digital Vignette
      const vignette = ctx.createRadialGradient(
        width / 2,
        height / 2,
        Math.min(width, height) * 0.4,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.8
      );
      vignette.addColorStop(0, 'rgba(0,0,0,0)');
      vignette.addColorStop(1, 'rgba(2, 6, 23, 0.85)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className={`fixed inset-0 pointer-events-none transition-opacity duration-700 ${dimmed ? 'opacity-40' : 'opacity-100'}`}>
      <canvas ref={canvasRef} className="w-full h-full block" />
      <div className="absolute inset-0 scanlines pointer-events-none opacity-40" />
    </div>
  );
};
