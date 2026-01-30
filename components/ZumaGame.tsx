
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

  const LEVEL_BALL_COUNT = 60;

  useEffect(() => {
    const init = () => {
      if (containerRef.current && canvasRef.current) {
        const w = containerRef.current.clientWidth;
        const h = containerRef.current.clientHeight;
        canvasRef.current.width = w;
        canvasRef.current.height = h;
        pathRef.current = createAdaptivePath(w, h);
      }
    };
    init();
    window.addEventListener('resize', init);
    return () => window.removeEventListener('resize', init);
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
    if (!pathRef.current) return;
    const path = pathRef.current;
    const speed = INITIAL_SPEED + (currentLevelRef.current * 0.1);

    spawnNewBall();

    const prevGaps = ballsRef.current.map((_, i) => 
      i < ballsRef.current.length - 1 ? ballsRef.current[i].distance - ballsRef.current[i+1].distance : 0
    );

    ballsRef.current = updateChainMovement(ballsRef.current, speed, path);

    for (let i = 0; i < ballsRef.current.length - 1; i++) {
        const currGap = ballsRef.current[i].distance - ballsRef.current[i+1].distance;
        const pGap = prevGaps[i];
        if (pGap > BALL_DIAMETER + 1.5 && currGap <= BALL_DIAMETER + 1.5) {
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
  }, [onGameOver, spawnNewBall, handleImpactMatch]);

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

    const end = path.points[path.points.length - 1];
    const holeGrad = ctx.createRadialGradient(end.x, end.y, 0, end.x, end.y, BALL_RADIUS * 4.2);
    holeGrad.addColorStop(0, '#000');
    holeGrad.addColorStop(0.5, '#080a1c');
    holeGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = holeGrad;
    ctx.beginPath();
    ctx.arc(end.x, end.y, BALL_RADIUS * 4.2, 0, Math.PI * 2);
    ctx.fill();

    ballsRef.current.forEach(b => {
      const pos = getPointAtDistance(path, b.distance);
      ctx.beginPath();
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.arc(pos.x, pos.y + 10, BALL_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.fillStyle = COLOR_MAP[b.color];
      ctx.arc(pos.x, pos.y, BALL_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      const highlight = ctx.createRadialGradient(pos.x - 8, pos.y - 8, 1, pos.x - 8, pos.y - 8, 22);
      highlight.addColorStop(0, 'rgba(255,255,255,0.35)');
      highlight.addColorStop(1, 'transparent');
      ctx.fillStyle = highlight;
      ctx.fill();
    });

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(launcherAngleRef.current);
    ctx.beginPath();
    ctx.fillStyle = '#0a0d17';
    ctx.arc(0, 0, 20, 0, Math.PI * 2);
    ctx.fill();
    const barrelL = 140;
    const barrelW = 5;
    ctx.fillStyle = '#1a2038';
    ctx.beginPath();
    ctx.roundRect(0, -barrelW/2, barrelL, barrelW, 2);
    ctx.fill();
    ctx.fillStyle = '#3a4468';
    ctx.beginPath();
    ctx.moveTo(barrelL, -barrelW/2 - 2);
    ctx.lineTo(barrelL + 30, 0);
    ctx.lineTo(barrelL, barrelW/2 + 2);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.fillStyle = COLOR_MAP[activeColorRef.current];
    ctx.shadowBlur = 20;
    ctx.shadowColor = COLOR_MAP[activeColorRef.current];
    ctx.arc(55, 0, BALL_RADIUS * 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
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

  // 统一角度计算逻辑
  const updateAngle = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    launcherAngleRef.current = Math.atan2(clientY - rect.top - canvas.height/2, clientX - rect.left - canvas.width/2);
  };

  const shoot = useCallback(() => {
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
  }, []);

  // 处理触摸事件
  const handleTouch = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    updateAngle(touch.clientX, touch.clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    // 触摸结束时射击
    shoot();
  };

  return (
    <div ref={containerRef} className="relative w-full h-full cursor-crosshair bg-[#010204]">
      <canvas 
        ref={canvasRef} 
        onMouseMove={(e) => updateAngle(e.clientX, e.clientY)}
        onMouseDown={shoot}
        onTouchMove={handleTouch}
        onTouchStart={handleTouch}
        onTouchEnd={handleTouchEnd}
        className="w-full h-full" 
      />
      
      <div className="absolute top-10 left-10 pointer-events-none select-none">
        <div className="flex items-center gap-2 mb-1">
            <div className="w-1 h-5 bg-cyan-500 rounded-full" />
            <p className="text-[9px] text-cyan-400 font-bold uppercase tracking-[0.8em]">Core Data</p>
        </div>
        <p className="text-7xl font-black text-white italic tracking-tighter tabular-nums">
            {uiScore.toLocaleString()}
        </p>
      </div>

      <div className="absolute bottom-10 right-10 flex items-center gap-10 bg-black/90 p-8 rounded-[4rem] border border-white/5 backdrop-blur-3xl shadow-[0_0_80px_rgba(0,0,0,0.8)] select-none">
        <div className="text-right">
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.4em] mb-1">Deployment</p>
          <p className="text-3xl font-black text-white italic">{ballsSpawnedInLevel.current}/{LEVEL_BALL_COUNT}</p>
        </div>
        <div className="w-px h-16 bg-white/10" />
        <div className="flex flex-col items-center">
          <p className="text-[9px] text-cyan-400 font-bold uppercase tracking-[0.4em] mb-4">Next</p>
          <div className="relative">
              <div 
                className="w-10 h-10 rounded-full border-2 border-white/10"
                style={{ 
                    backgroundColor: COLOR_MAP[nextColorUI],
                    boxShadow: `0 0 40px ${COLOR_MAP[nextColorUI]}55`
                }} 
              />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ZumaGame;
