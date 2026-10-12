import React, { useEffect, useRef } from 'react';

interface StaticStar {
  x: number;
  y: number;
  radius: number;
  baseOpacity: number;
  twinkleSpeed: number;
  twinklePhase: number;
}

interface ShootingStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  length: number;
  radius: number;
  headColor: string;
  tailColor: string;
  glowColor: string;
  opacity: number;
  maxOpacity: number;
  distanceTraveled: number;
  totalDistance: number;
}

export const ShootingStars: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let lastTime = performance.now();
    let nextSpawnTime = performance.now() + 800;
    let isTabVisible = !document.hidden;

    // Check reduced motion preference
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let prefersReducedMotion = motionQuery.matches;

    const handleMotionChange = (e: MediaQueryListEvent) => {
      prefersReducedMotion = e.matches;
    };
    motionQuery.addEventListener('change', handleMotionChange);

    // Dynamic dimensions
    let width = window.innerWidth;
    let height = window.innerHeight;
    let isMobile = width < 640;

    const staticStars: StaticStar[] = [];
    let shootingStars: ShootingStar[] = [];

    // Initialize static background starfield
    const initStaticStars = () => {
      staticStars.length = 0;
      const count = isMobile ? 40 : 85;

      for (let i = 0; i < count; i++) {
        staticStars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: 0.5 + Math.random() * 0.7, // 0.5px to 1.2px
          baseOpacity: 0.2 + Math.random() * 0.3,
          twinkleSpeed: 0.8 + Math.random() * 1.8,
          twinklePhase: Math.random() * Math.PI * 2,
        });
      }
    };

    // Canvas size adjustment with DPR (capped at 2)
    const resizeCanvas = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      isMobile = width < 640;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      initStaticStars();
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Color choices matching Launchpad theme
    const STAR_COLOR_PALETTES = [
      // Pure White (60%)
      {
        head: 'rgba(255, 255, 255, 0.85)',
        tail: 'rgba(255, 255, 255, 0.35)',
        glow: 'rgba(255, 255, 255, 0.75)',
      },
      {
        head: 'rgba(255, 255, 255, 0.80)',
        tail: 'rgba(255, 255, 255, 0.30)',
        glow: 'rgba(255, 255, 255, 0.70)',
      },
      // Lavender Tint #c4b5fd (25%)
      {
        head: 'rgba(216, 180, 254, 0.85)',
        tail: 'rgba(196, 181, 253, 0.35)',
        glow: 'rgba(196, 181, 253, 0.80)',
      },
      // Violet Tint #8b5cf6 (15%)
      {
        head: 'rgba(192, 132, 252, 0.85)',
        tail: 'rgba(139, 92, 246, 0.35)',
        glow: 'rgba(139, 92, 246, 0.80)',
      },
    ];

    // Spawn a shooting star traveling diagonally down-left (35° to 45°)
    const spawnShootingStar = () => {
      const maxConcurrent = isMobile ? 3 : 6;
      if (shootingStars.length >= maxConcurrent) return;

      // Angle: 35 to 45 degrees towards the bottom-left
      // Horizontal left: -cos(angle), Vertical down: +sin(angle)
      const angleDeg = 36 + Math.random() * 8; // 36° to 44°
      const angleRad = (angleDeg * Math.PI) / 180;

      // Speed: 6 to 11 px per normalized 60fps frame
      const speed = 6.5 + Math.random() * 4.5;
      const vx = -Math.cos(angleRad) * speed;
      const vy = Math.sin(angleRad) * speed;

      // Start position: top area or right edge
      let startX: number;
      let startY: number;

      if (Math.random() < 0.6) {
        // Starts along top edge, biased toward upper right
        startX = width * 0.25 + Math.random() * (width * 0.95);
        startY = -30 - Math.random() * 50;
      } else {
        // Starts along right edge
        startX = width + 20 + Math.random() * 40;
        startY = -20 + Math.random() * (height * 0.65);
      }

      const length = 130 + Math.random() * 120; // Tail length 130 to 250px
      const palette = STAR_COLOR_PALETTES[Math.floor(Math.random() * STAR_COLOR_PALETTES.length)];

      shootingStars.push({
        x: startX,
        y: startY,
        vx,
        vy,
        length,
        radius: 1.1 + Math.random() * 0.7,
        headColor: palette.head,
        tailColor: palette.tail,
        glowColor: palette.glow,
        opacity: 0,
        maxOpacity: 0.7 + Math.random() * 0.15, // Max opacity ~0.8
        distanceTraveled: 0,
        totalDistance: Math.hypot(width + 200, height + 200),
      });
    };

    // Pause when tab is inactive to save CPU
    const handleVisibilityChange = () => {
      isTabVisible = !document.hidden;
      if (isTabVisible) {
        lastTime = performance.now();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Animation Loop
    const animate = (currentTime: number) => {
      animationFrameId = requestAnimationFrame(animate);

      if (!isTabVisible) return;

      const deltaMs = Math.min(currentTime - lastTime, 64); // Cap delta to prevent leaps
      lastTime = currentTime;
      const timeScale = deltaMs / 16.667; // Normalized to 60 FPS

      ctx.clearRect(0, 0, width, height);

      const secTime = currentTime * 0.001;

      // 1. Draw static starfield
      for (let i = 0; i < staticStars.length; i++) {
        const star = staticStars[i];
        let opacity = star.baseOpacity;

        if (!prefersReducedMotion) {
          // Slow twinkle oscillation between 0.15 and 0.6
          const osc = Math.sin(secTime * star.twinkleSpeed + star.twinklePhase);
          opacity = Math.max(0.12, Math.min(0.58, star.baseOpacity + osc * 0.2));
        }

        ctx.fillStyle = `rgba(255, 255, 255, ${opacity.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // If reduced motion is preferred, don't spawn or animate shooting stars
      if (prefersReducedMotion) return;

      // 2. Spawn new shooting stars randomly between 0.8s and 2.4s
      if (currentTime >= nextSpawnTime) {
        spawnShootingStar();
        const nextInterval = isMobile
          ? 1400 + Math.random() * 1800 // Slower on mobile
          : 800 + Math.random() * 1600; // 0.8s to 2.4s on desktop
        nextSpawnTime = currentTime + nextInterval;
      }

      // 3. Update & render shooting stars
      const remainingStars: ShootingStar[] = [];

      for (let i = 0; i < shootingStars.length; i++) {
        const star = shootingStars[i];

        // Move head position scaled by delta time
        star.x += star.vx * timeScale;
        star.y += star.vy * timeScale;

        const stepDist = Math.hypot(star.vx * timeScale, star.vy * timeScale);
        star.distanceTraveled += stepDist;

        // Fade in quickly over first 120px, fade out as it approaches exit
        const fadeInDist = 120;
        if (star.distanceTraveled < fadeInDist) {
          star.opacity = (star.distanceTraveled / fadeInDist) * star.maxOpacity;
        } else {
          star.opacity = star.maxOpacity;
        }

        // Tail vector extends in opposite direction of travel
        const travelSpeed = Math.hypot(star.vx, star.vy);
        const dirX = star.vx / travelSpeed;
        const dirY = star.vy / travelSpeed;

        const tailX = star.x - dirX * star.length;
        const tailY = star.y - dirY * star.length;

        // Render Tail Gradient: transparent at tail -> visible at head
        const gradient = ctx.createLinearGradient(tailX, tailY, star.x, star.y);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
        gradient.addColorStop(0.65, star.tailColor.replace('0.35', `${(0.18 * star.opacity).toFixed(3)}`));
        gradient.addColorStop(1, star.headColor.replace('0.85', `${star.opacity.toFixed(3)}`));

        ctx.save();
        ctx.strokeStyle = gradient;
        ctx.lineWidth = star.radius * 1.25;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(star.x, star.y);
        ctx.stroke();

        // Render Head Glowing Dot
        ctx.shadowColor = star.glowColor;
        ctx.shadowBlur = 8;
        ctx.fillStyle = star.headColor.replace('0.85', `${star.opacity.toFixed(3)}`);
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Check if star has traveled completely off-screen (with buffer for tail)
        const isOffScreen =
          star.x < -star.length && star.y > height + star.length;

        if (!isOffScreen) {
          remainingStars.push(star);
        }
      }

      shootingStars = remainingStars;
    };

    animationFrameId = requestAnimationFrame(animate);

    // Initial spawn
    spawnShootingStar();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      motionQuery.removeEventListener('change', handleMotionChange);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 z-0 pointer-events-none overflow-hidden"
    />
  );
};
