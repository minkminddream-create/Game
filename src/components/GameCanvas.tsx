import React, { useEffect, useRef, useCallback } from 'react';
import {
  GameMode,
  TargetItem,
  TargetType,
  Particle,
  Shockwave,
  FloatingText,
  HandLandmarkPoint,
} from '../types/game';
import { HAND_CONNECTIONS } from '../services/handTracking';
import { sound } from '../utils/audio';

interface GameCanvasProps {
  mode: GameMode;
  isPlaying: boolean;
  timeLeft: number;
  onTargetHit: (points: number, type: TargetType) => void;
  onTargetMiss?: () => void;
  cursorPos: { x: number; y: number }; // normalized 0 to 1
  isHandDetected: boolean;
  landmarks: HandLandmarkPoint[] | null;
  videoElement: HTMLVideoElement | null;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  mode,
  isPlaying,
  timeLeft,
  onTargetHit,
  onTargetMiss,
  cursorPos,
  isHandDetected,
  landmarks,
  videoElement,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Game entities refs for high performance 60fps canvas loop
  const targetsRef = useRef<TargetItem[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const shockwavesRef = useRef<Shockwave[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const trailsRef = useRef<{ x: number; y: number; alpha: number; color: string }[]>([]);
  const lastSpawnTimeRef = useRef<number>(0);
  const targetIdCounterRef = useRef<number>(0);

  // Debounce hit tracker to guarantee no double-counting
  const recentlyHitTargetsRef = useRef<Set<string>>(new Set());

  // Mouse / Pointer position
  const mousePosRef = useRef<{ x: number; y: number; active: boolean }>({
    x: -100,
    y: -100,
    active: false,
  });

  // Spawn a new target
  const spawnTarget = useCallback((canvasWidth: number, canvasHeight: number) => {
    // Avoid HUD header (top 110px) and bottom edge (bottom 60px)
    const paddingX = 70;
    const paddingTop = 120;
    const paddingBottom = 80;

    const availWidth = Math.max(canvasWidth - paddingX * 2, 200);
    const availHeight = Math.max(canvasHeight - paddingTop - paddingBottom, 200);

    const x = paddingX + Math.random() * availWidth;
    const y = paddingTop + Math.random() * availHeight;

    // Difficulty weighting based on elapsed time (60 -> 0)
    // As timeLeft decreases, chance of special and bonus increases
    const elapsed = 60 - timeLeft;
    const rand = Math.random();

    let type: TargetType = 'standard';
    let points = 10;
    let radius = 38;
    let color = '#06b6d4'; // Cyan
    let glowColor = 'rgba(6, 182, 212, 0.9)';
    let shape: 'circle' | 'diamond' | 'hexagon' | 'star' = 'circle';
    let lifetime = 4800; // ms

    if (rand > 0.82 || (elapsed > 30 && rand > 0.72)) {
      // Bonus Target (+50)
      type = 'bonus';
      points = 50;
      radius = 48;
      color = '#eab308'; // Amber/Gold
      glowColor = 'rgba(234, 179, 8, 0.95)';
      shape = 'star';
      lifetime = 3600; // Faster, high reward!
    } else if (rand > 0.55 || (elapsed > 20 && rand > 0.45)) {
      // Special Target (+25)
      type = 'special';
      points = 25;
      radius = 42;
      color = '#ec4899'; // Pink/Purple
      glowColor = 'rgba(236, 72, 153, 0.9)';
      shape = 'hexagon';
      lifetime = 4200;
    } else {
      // Standard Target (+10)
      type = 'standard';
      points = 10;
      radius = 38;
      color = '#06b6d4';
      glowColor = 'rgba(6, 182, 212, 0.85)';
      shape = Math.random() > 0.5 ? 'circle' : 'diamond';
      lifetime = 4800;
    }

    // Gentle velocity for movement
    const speed = type === 'bonus' ? 1.2 : type === 'special' ? 0.8 : 0.4;
    const angle = Math.random() * Math.PI * 2;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;

    targetIdCounterRef.current += 1;
    const newTarget: TargetItem = {
      id: `target_${targetIdCounterRef.current}_${Date.now()}`,
      x,
      y,
      radius,
      type,
      points,
      color,
      glowColor,
      shape,
      createdAt: performance.now(),
      lifetime,
      vx,
      vy,
      pulsePhase: Math.random() * Math.PI * 2,
      isHit: false,
      scale: 0.1, // will animate to 1
    };

    targetsRef.current.push(newTarget);
  }, [timeLeft]);

  // Create explosion particles and floating text on hit
  const triggerHitEffects = useCallback((target: TargetItem) => {
    // 1. Sound
    if (target.type === 'bonus') {
      sound.playHitBonus();
    } else if (target.type === 'special') {
      sound.playHitSpecial();
    } else {
      sound.playHitStandard();
    }

    // 2. Shockwave ring
    shockwavesRef.current.push({
      x: target.x,
      y: target.y,
      radius: target.radius * 0.5,
      maxRadius: target.radius * 2.8,
      color: target.color,
      alpha: 1.0,
    });

    // 3. Floating Score Text
    floatingTextsRef.current.push({
      id: `float_${Date.now()}_${Math.random()}`,
      x: target.x,
      y: target.y - 10,
      text: `+${target.points}`,
      color: target.color,
      scale: target.type === 'bonus' ? 1.4 : target.type === 'special' ? 1.2 : 1.0,
      alpha: 1.0,
      createdAt: performance.now(),
    });

    // 4. Burst Particles
    const particleCount = target.type === 'bonus' ? 28 : target.type === 'special' ? 20 : 14;
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.4;
      const speed = Math.random() * 5 + 3;
      particlesRef.current.push({
        x: target.x,
        y: target.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 4 + 2,
        color: target.color,
        alpha: 1.0,
        life: 0,
        maxLife: Math.random() * 25 + 30, // frames
        shape: Math.random() > 0.4 ? 'spark' : 'circle',
      });
    }
  }, []);

  // Check collision with fingertip or mouse
  const checkHit = useCallback(
    (hitX: number, hitY: number) => {
      if (!isPlaying) return false;

      let hitDetected = false;
      const now = performance.now();

      for (let i = targetsRef.current.length - 1; i >= 0; i--) {
        const target = targetsRef.current[i];
        if (target.isHit || recentlyHitTargetsRef.current.has(target.id)) continue;

        const dx = hitX - target.x;
        const dy = hitY - target.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Generous touch radius for natural interaction (finger or click)
        const hitRadius = target.radius + (mode === 'camera' ? 24 : 14);

        if (dist <= hitRadius) {
          target.isHit = true;
          recentlyHitTargetsRef.current.add(target.id);
          triggerHitEffects(target);
          onTargetHit(target.points, target.type);
          hitDetected = true;
          break; // hit one target per touch event
        }
      }

      // Cleanup recently hit cache after 1.5 seconds
      if (recentlyHitTargetsRef.current.size > 20) {
        recentlyHitTargetsRef.current.clear();
      }

      return hitDetected;
    },
    [isPlaying, mode, onTargetHit, triggerHitEffects]
  );

  // Mouse / Pointer Event Listeners
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isPlaying) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    mousePosRef.current = { x, y, active: true };

    const hit = checkHit(x, y);
    if (!hit && onTargetMiss) {
      onTargetMiss();
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    mousePosRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      active: true,
    };
  };

  // Main 60fps Game Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      const now = performance.now();

      // 1. If in Camera mode and video is available, draw video mirrored
      if (mode === 'camera' && videoElement && videoElement.readyState >= 2) {
        ctx.save();
        ctx.translate(width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(videoElement, 0, 0, width, height);
        ctx.restore();

        // Dark cyber overlay so targets and neon elements pop with high contrast
        ctx.fillStyle = 'rgba(2, 6, 23, 0.45)';
        ctx.fillRect(0, 0, width, height);

        // Futuristic HUD corner brackets
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
        ctx.lineWidth = 2;
        const cornerSize = 40;
        // Top-left
        ctx.beginPath();
        ctx.moveTo(20, 20 + cornerSize);
        ctx.lineTo(20, 20);
        ctx.lineTo(20 + cornerSize, 20);
        ctx.stroke();
        // Top-right
        ctx.beginPath();
        ctx.moveTo(width - 20 - cornerSize, 20);
        ctx.lineTo(width - 20, 20);
        ctx.lineTo(width - 20, 20 + cornerSize);
        ctx.stroke();
        // Bottom-left
        ctx.beginPath();
        ctx.moveTo(20, height - 20 - cornerSize);
        ctx.lineTo(20, height - 20);
        ctx.lineTo(20 + cornerSize, height - 20);
        ctx.stroke();
        // Bottom-right
        ctx.beginPath();
        ctx.moveTo(width - 20 - cornerSize, height - 20);
        ctx.lineTo(width - 20, height - 20);
        ctx.lineTo(width - 20, height - 20 - cornerSize);
        ctx.stroke();
      }

      // 2. Draw Hand Landmark Skeleton if detected in Camera mode
      if (mode === 'camera' && isHandDetected && landmarks && landmarks.length >= 21) {
        ctx.save();
        // Draw bones/connections
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.5)';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 8;

        HAND_CONNECTIONS.forEach(([startIdx, endIdx]) => {
          const start = landmarks[startIdx];
          const end = landmarks[endIdx];
          if (start && end) {
            ctx.beginPath();
            ctx.moveTo(start.x * width, start.y * height);
            ctx.lineTo(end.x * width, end.y * height);
            ctx.stroke();
          }
        });

        // Draw joint nodes
        landmarks.forEach((lm, idx) => {
          const px = lm.x * width;
          const py = lm.y * height;
          ctx.beginPath();
          if (idx === 8) {
            // Index fingertip is highlighted prominently
            ctx.fillStyle = '#22d3ee';
            ctx.arc(px, py, 7, 0, Math.PI * 2);
          } else {
            ctx.fillStyle = 'rgba(168, 85, 247, 0.8)';
            ctx.arc(px, py, 4, 0, Math.PI * 2);
          }
          ctx.fill();
        });
        ctx.restore();
      }

      // 3. Spawning Logic (only when actively playing)
      if (isPlaying) {
        const elapsed = 60 - timeLeft;
        // Max concurrent targets: scales from 4 up to 8
        const maxTargets = Math.min(4 + Math.floor(elapsed / 12), 8);
        // Spawn interval: scales from 1200ms down to 600ms
        const spawnInterval = Math.max(1200 - elapsed * 10, 600);

        if (
          targetsRef.current.length < maxTargets &&
          now - lastSpawnTimeRef.current > spawnInterval
        ) {
          spawnTarget(width, height);
          lastSpawnTimeRef.current = now;
        }

        // Camera mode: check collision with tracked finger
        if (mode === 'camera' && isHandDetected) {
          const fingerX = cursorPos.x * width;
          const fingerY = cursorPos.y * height;
          checkHit(fingerX, fingerY);
        }
      }

      // 4. Update and Render Targets
      const remainingTargets: TargetItem[] = [];
      const safePadding = 50;

      for (let i = 0; i < targetsRef.current.length; i++) {
        const target = targetsRef.current[i];
        const age = now - target.createdAt;

        // Skip if hit or expired
        if (target.isHit) continue;
        if (age >= target.lifetime) continue;

        // Animate entrance scale (0 to 1)
        if (target.scale < 1.0) {
          target.scale = Math.min(1.0, target.scale + 0.08);
        }

        // Movement with screen boundary bounce
        target.x += target.vx;
        target.y += target.vy;
        if (target.x < safePadding || target.x > width - safePadding) target.vx *= -1;
        if (target.y < 120 || target.y > height - safePadding) target.vy *= -1;

        // Pulse phase
        target.pulsePhase += 0.05;
        const pulse = Math.sin(target.pulsePhase) * 3;
        const currentRadius = (target.radius + pulse) * target.scale;

        // Lifetime percentage for circular gauge
        const lifePercent = 1 - age / target.lifetime;

        ctx.save();
        ctx.translate(target.x, target.y);

        // Outer glow
        ctx.shadowColor = target.glowColor;
        ctx.shadowBlur = 18;

        // Draw remaining lifetime ring
        ctx.beginPath();
        ctx.arc(0, 0, currentRadius + 8, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * lifePercent);
        ctx.strokeStyle = lifePercent > 0.3 ? target.color : '#f43f5e';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Target Body Shape
        if (target.shape === 'star') {
          // Bonus Star Shape
          ctx.fillStyle = target.color;
          ctx.beginPath();
          const spikes = 5;
          const outerRadius = currentRadius;
          const innerRadius = currentRadius * 0.5;
          let rot = (Math.PI / 2) * 3 + target.pulsePhase * 0.5;
          let step = Math.PI / spikes;

          ctx.moveTo(0, -outerRadius);
          for (let s = 0; s < spikes; s++) {
            let sx = Math.cos(rot) * outerRadius;
            let sy = Math.sin(rot) * outerRadius;
            ctx.lineTo(sx, sy);
            rot += step;

            sx = Math.cos(rot) * innerRadius;
            sy = Math.sin(rot) * innerRadius;
            ctx.lineTo(sx, sy);
            rot += step;
          }
          ctx.lineTo(0, -outerRadius);
          ctx.closePath();
          ctx.fill();

          // Rotating outer cyber ring
          ctx.beginPath();
          ctx.arc(0, 0, currentRadius * 1.25, target.pulsePhase, target.pulsePhase + Math.PI * 1.4);
          ctx.strokeStyle = '#fef08a';
          ctx.lineWidth = 2;
          ctx.stroke();
        } else if (target.shape === 'hexagon') {
          // Special Hexagon Shape
          ctx.fillStyle = target.color;
          ctx.beginPath();
          for (let h = 0; h < 6; h++) {
            const hAngle = (Math.PI / 3) * h + target.pulsePhase * 0.3;
            const hx = Math.cos(hAngle) * currentRadius;
            const hy = Math.sin(hAngle) * currentRadius;
            if (h === 0) ctx.moveTo(hx, hy);
            else ctx.lineTo(hx, hy);
          }
          ctx.closePath();
          ctx.fill();

          // Inner glowing core
          ctx.beginPath();
          ctx.arc(0, 0, currentRadius * 0.45, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
        } else if (target.shape === 'diamond') {
          // Diamond Shape
          ctx.fillStyle = target.color;
          ctx.beginPath();
          ctx.moveTo(0, -currentRadius);
          ctx.lineTo(currentRadius, 0);
          ctx.lineTo(0, currentRadius);
          ctx.lineTo(-currentRadius, 0);
          ctx.closePath();
          ctx.fill();

          // Inner diamond
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.moveTo(0, -currentRadius * 0.4);
          ctx.lineTo(currentRadius * 0.4, 0);
          ctx.lineTo(0, currentRadius * 0.4);
          ctx.lineTo(-currentRadius * 0.4, 0);
          ctx.closePath();
          ctx.fill();
        } else {
          // Glowing Neon Circle
          const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, currentRadius);
          grad.addColorStop(0, '#ffffff');
          grad.addColorStop(0.3, target.color);
          grad.addColorStop(1, 'rgba(6, 182, 212, 0.4)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(0, 0, currentRadius, 0, Math.PI * 2);
          ctx.fill();

          // Core dot
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(0, 0, currentRadius * 0.35, 0, Math.PI * 2);
          ctx.fill();
        }

        // Points label inside or below
        ctx.shadowBlur = 6;
        ctx.shadowColor = '#000000';
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 13px Orbitron, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`+${target.points}`, 0, 0);

        ctx.restore();
        remainingTargets.push(target);
      }
      targetsRef.current = remainingTargets;

      // 5. Update and Render Shockwaves
      shockwavesRef.current = shockwavesRef.current.filter((sw) => {
        sw.radius += 3.8;
        sw.alpha -= 0.045;
        if (sw.alpha <= 0) return false;

        ctx.save();
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
        ctx.strokeStyle = sw.color;
        ctx.globalAlpha = Math.max(0, sw.alpha);
        ctx.lineWidth = 3;
        ctx.shadowColor = sw.color;
        ctx.shadowBlur = 15;
        ctx.stroke();
        ctx.restore();
        return true;
      });

      // 6. Update and Render Particles
      particlesRef.current = particlesRef.current.filter((p) => {
        p.life += 1;
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.94; // friction
        p.vy *= 0.94;
        p.alpha = 1 - p.life / p.maxLife;

        if (p.life >= p.maxLife || p.alpha <= 0) return false;

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        return true;
      });

      // 7. Update and Render Floating Score Texts
      floatingTextsRef.current = floatingTextsRef.current.filter((ft) => {
        const age = now - ft.createdAt;
        if (age > 900) return false;

        ft.y -= 1.6; // rise upwards
        ft.alpha = Math.max(0, 1 - age / 900);

        ctx.save();
        ctx.globalAlpha = ft.alpha;
        ctx.font = `bold ${Math.round(22 * ft.scale)}px Orbitron, sans-serif`;
        ctx.fillStyle = ft.color;
        ctx.shadowColor = ft.color;
        ctx.shadowBlur = 12;
        ctx.textAlign = 'center';
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
        return true;
      });

      // 8. Render Cursor Reticle
      // Determine active cursor position
      let activeX = -100;
      let activeY = -100;
      let isCursorVisible = false;
      let cursorColor = '#06b6d4';

      if (mode === 'camera') {
        if (isHandDetected) {
          activeX = cursorPos.x * width;
          activeY = cursorPos.y * height;
          isCursorVisible = true;
          cursorColor = '#22d3ee'; // Neon Cyan
        }
      } else {
        if (mousePosRef.current.active) {
          activeX = mousePosRef.current.x;
          activeY = mousePosRef.current.y;
          isCursorVisible = true;
          cursorColor = '#ec4899'; // Neon Pink
        }
      }

      if (isCursorVisible && activeX > 0 && activeY > 0) {
        // Add light trail point
        trailsRef.current.push({
          x: activeX,
          y: activeY,
          alpha: 0.8,
          color: cursorColor,
        });

        // Draw light trails
        trailsRef.current = trailsRef.current.filter((tr) => {
          tr.alpha -= 0.08;
          if (tr.alpha <= 0) return false;
          ctx.save();
          ctx.globalAlpha = tr.alpha;
          ctx.fillStyle = tr.color;
          ctx.beginPath();
          ctx.arc(tr.x, tr.y, 4 * tr.alpha, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          return true;
        });

        // Draw Futuristic Cyber Reticle
        ctx.save();
        ctx.translate(activeX, activeY);
        const spin = (now / 400) % (Math.PI * 2);

        // Outer rotating brackets
        ctx.strokeStyle = cursorColor;
        ctx.lineWidth = 2.5;
        ctx.shadowColor = cursorColor;
        ctx.shadowBlur = 14;

        // 3 bracket arcs
        for (let b = 0; b < 3; b++) {
          const arcStart = spin + (b * Math.PI * 2) / 3;
          ctx.beginPath();
          ctx.arc(0, 0, 22, arcStart, arcStart + Math.PI * 0.45);
          ctx.stroke();
        }

        // Inner glowing core
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        // Crosshairs
        ctx.lineWidth = 1.5;
        const crossSize = 7;
        ctx.beginPath();
        ctx.moveTo(-crossSize, 0);
        ctx.lineTo(crossSize, 0);
        ctx.moveTo(0, -crossSize);
        ctx.lineTo(0, crossSize);
        ctx.stroke();

        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [
    mode,
    isPlaying,
    timeLeft,
    cursorPos,
    isHandDetected,
    landmarks,
    videoElement,
    spawnTarget,
    checkHit,
  ]);

  return (
    <canvas
      ref={canvasRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      className={`fixed inset-0 w-full h-full z-20 ${
        mode === 'mouse' ? 'cursor-crosshair' : 'cursor-none'
      }`}
    />
  );
};
