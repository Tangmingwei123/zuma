
import { Ball, Projectile, Color, Particle } from '../types';
import { 
  BALL_RADIUS, 
  BALL_DIAMETER,
  COLORS, 
  COLOR_MAP, 
  INITIAL_SPEED, 
  PROJECTILE_SPEED 
} from '../constants';
import { createAdaptivePath, getPointAtDistance, Path } from '../logic/math';
import { updateChainMovement, checkCollisions, findMatchesAt } from '../logic/behaviors';
import React, { useRef, useEffect, useState, useCallback } from 'react';

const ZumaGame: React.FC<{ onGameOver: (score: number) => void }> = ({ onGameOver }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const ballsRef = useRef<Ball[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const pathRef = useRef<Path | null>(null);
  const launcherAngleRef = useRef<number>(0);

  const activeColorRef = useRef<Color>(COLORS[Math.floor(Math.random() * COLORS.length)]);
  const nextColorRef = useRef<Color>(COLORS[Math.floor(Math.random() * COLORS.length)]);
  
  const scoreRef = useRef(0);
  const ballsSpawnedInLevel = useRef(0);
  const currentLevelRef = useRef(1);
  const requestRef = useRef<number>(0);
  
  const [uiScore, setUiScore] = useState(0);
  const [nextColorUI, setNextColorUI] = useState<Color>(nextColorRef.current);
  const [isReady, setIsReady] = useState(false);

  const LEVEL_BALL_COUNT = 60;

  // 初始化逻辑：使用 ResizeObserver 代替定时器，更优雅且省电
  useEffect(() => {
    const handleInit = () => {
      const w = containerRef.current?.clientWidth || window.innerWidth;
      const h = containerRef.current?.clientHeight || window.innerHeight;
      
      if (w > 20 && h > 20 && canvasRef.current) {
        canvasRef.current.width = w;
        canvasRef.current.height = h;
        pathRef.current = createAdaptivePath(w, h);
        setIsReady(true);
      }
    };

    const resizeObserver = new ResizeObserver(handleInit);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    handleInit();
    window.addEventListener('resize', handleInit);

    return () => {
      window.removeEventListener('resize', handleInit);
      resizeObserver.disconnect();
    };
  }, []);

  const spawnNewBall = useCallback(() => {
    if (!pathRef.current || ballsSpawnedInLevel.current >= LEVEL_BALL_COUNT) return;
    const isSpawnClear = ballsRef.current.length === 0 || 
                         ballsRef.current[ballsRef.current.length - 1].distance > BALL_DIAMETER;
    if (isSpawnClear) {
      ballsRef.current.push({
        id: Math.random().toString(36),
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        distance: 0, status: 'active', scale: 1
      });
      ballsSpawnedInLevel.current++;
    }
  }, []);

  const handleImpactMatch = useCallback((index: number, path: Path) => {
    if (index < 0 || index >= ballsRef.current.length) return false;
    const matches = findMatchesAt(ballsRef.current, index);
    if (matches.length >= 3) {
      scoreRef.current += matches.length * 50;
      setUiScore(scoreRef.current);
      matches.forEach(idx => {
        const b = ballsRef.current[idx];
        const pos = getPointAtDistance(path, b.distance);
        for (let k = 0; k < 12; k++) {
          particlesRef.current.push({
            x: pos.x, y: pos.y,
            vx: (Math.random() - 0.5) * 20, vy: (Math.random() - 0.5) * 20,
            life: 1.0, color: COLOR_MAP[b.color]
          });
        }
      });
      ballsRef.current = ballsRef.current.filter((_, idx) => !matches.includes(idx));
      return true;
    }
    return false;
  }, []);

  const update = useCallback(() => {
    if (!pathRef.current || !isReady) {
      requestRef.current = requestAnimationFrame(update);
      return;
    }

    const path = pathRef.current;
    const speed = INITIAL_SPEED + (currentLevelRef.current * 0.1);

    spawnNewBall();

    const prevGaps = ballsRef.current.map((_, i) => 
      i < ballsRef.current.length - 1 ? ballsRef.current[i].distance - ballsRef.current[i+1].distance : 0
    );

    ballsRef.current = updateChainMovement(ballsRef.current, speed, path);

    for (let i = 0; i < ballsRef.current.length - 1; i++) {
        const currGap = ballsRef.current[i].distance - ballsRef.current[i+1].distance;
        if (prevGaps[i] > BALL_DIAMETER + 1 && currGap <= BALL_DIAMETER + 1) {
            if (ballsRef.current[i].color === ballsRef.current[i+1].color) {
                handleImpactMatch(i, path);
            }
        }
    }

    projectilesRef.current.forEach(p => { p.x += p.vx; p.y += p.vy; });
    projectilesRef.current = projectilesRef.current.filter(p => 
      p.x > -50 && p.x < (canvasRef.current?.width || 0) + 50 &&
      p.y > -50 && p.y < (canvasRef.current?.height || 0) + 50
    );

    const { hitProjectileId, hitBallIndex, insertBefore } = checkCollisions(
      projectilesRef.current, ballsRef.current, path
    );

    if (hitProjectileId !== null && hitBallIndex !== null) {
      const p = projectilesRef.current.find(proj => proj.id === hitProjectileId);
      if (p) {
        const hitBall = ballsRef.current[hitBallIndex];
        const insertIdx = insertBefore ? hitBallIndex : hitBallIndex + 1;
        const targetDist = insertBefore ? hitBall.distance + BALL_DIAMETER : hitBall.distance - BALL_DIAMETER;

        ballsRef.current.splice(insertIdx, 0, {
          id: Math.random().toString(36),
          color: p.color, distance: targetDist,
          status: 'active', scale: 1
        });
        
        if (!insertBefore) {
          for (let i = insertIdx + 1; i < ballsRef.current.length; i++) ballsRef.current[i].distance -= BALL_DIAMETER;
        } else {
          for (let i = 0; i < insertIdx; i++) ballsRef.current[i].distance += BALL_DIAMETER;
        }

        projectilesRef.current = projectilesRef.current.filter(proj => proj.id !== hitProjectileId);
        handleImpactMatch(insertIdx, path);
      }
    }

    particlesRef.current.forEach(p => { p.life -= 0.04; p.x += p.vx; p.y += p.vy; });
    particlesRef.current = particlesRef.current.filter(p => p.life > 0);

    if (ballsRef.current.some(b => b.distance >= path.totalLength - 10)) {
      onGameOver(scoreRef.current);
      return;
    }
    if (ballsSpawnedInLevel.current >= LEVEL_BALL_COUNT && ballsRef.current.length === 0) {
      currentLevelRef.current++;
      ballsSpawnedInLevel.current = 0;
    }

    draw();
    requestRef.current = requestAnimationFrame(update);
  }, [onGameOver, spawnNewBall, handleImpactMatch, isReady]);

  const draw = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const path = pathRef.current;
    if (!ctx || !canvas || !path) return;

    ctx.fillStyle = '#010204';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.beginPath();
    ctx.strokeStyle = '#060810';
    ctx.lineWidth = BALL_DIAMETER + 30;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    path.points.forEach((p, i) => { if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
    ctx.stroke();

    ballsRef.current.forEach(b => {
      const pos = getPointAtDistance(path, b.distance);
      ctx.beginPath();
      ctx.fillStyle = COLOR_MAP[b.color];
      ctx.arc(pos.x, pos.y, BALL_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      const highlight = ctx.createRadialGradient(pos.x - 8, pos.y - 8, 1, pos.x - 8, pos.y - 8, 22);
      highlight.addColorStop(0, 'rgba(255,255,255,0.3)');
      highlight.addColorStop(1, 'transparent');
      ctx.fillStyle = highlight;
      ctx.fill();
    });

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(launcherAngleRef.current);
    ctx.fillStyle = '#1a2038';
    ctx.fillRect(0, -5, 140, 10);
    ctx.beginPath();
    ctx.fillStyle = COLOR_MAP[activeColorRef.current];
    ctx.arc(55, 0, BALL_RADIUS * 0.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    projectilesRef.current.forEach(p => {
      ctx.beginPath();
      ctx.fillStyle = COLOR_MAP[p.color];
      ctx.arc(p.x, p.y, BALL_RADIUS, 0, Math.PI * 2);
      ctx.fill();
    });

    particlesRef.current.forEach(p => {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 8 * p.life, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(update);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [update]);

  const updateAngle = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    launcherAngleRef.current = Math.atan2(clientY - rect.top - canvas.height/2, clientX - rect.left - canvas.width/2);
  };

  const shoot = useCallback(() => {
    if (!isReady) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const angle = launcherAngleRef.current;
    projectilesRef.current.push({
      id: Math.random().toString(36),
      x: canvas.width / 2 + Math.cos(angle) * 90,
      y: canvas.height / 2 + Math.sin(angle) * 90,
      vx: Math.cos(angle) * PROJECTILE_SPEED,
      vy: Math.sin(angle) * PROJECTILE_SPEED,
      color: activeColorRef.current
    });
    activeColorRef.current = nextColorRef.current;
    nextColorRef.current = COLORS[Math.floor(Math.random() * COLORS.length)];
    setNextColorUI(nextColorRef.current);
  }, [isReady]);

  return (
    <div ref={containerRef} className="relative w-full h-full cursor-crosshair bg-[#010204]">
      <canvas 
        ref={canvasRef} 
        onMouseMove={(e) => updateAngle(e.clientX, e.clientY)}
        onMouseDown={shoot}
        onTouchMove={(e) => updateAngle(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchStart={(e) => updateAngle(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchEnd={shoot}
        className={`w-full h-full ${!isReady ? 'opacity-0' : 'opacity-100'} transition-opacity duration-500`} 
      />
      
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#010204]">
           <div className="text-cyan-500 animate-pulse font-mono text-sm tracking-widest uppercase">INITIALIZING_ENGINE...</div>
        </div>
      )}

      {isReady && (
        <div className="absolute top-8 left-8 pointer-events-none select-none">
            <p className="text-4xl md:text-6xl font-black text-white italic tracking-tighter tabular-nums">
                {uiScore.toLocaleString()}
            </p>
        </div>
      )}
    </div>
  );
};

export default ZumaGame;
