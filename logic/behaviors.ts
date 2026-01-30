
import { Ball, Projectile } from '../types';
import { BALL_DIAMETER, BALL_RADIUS } from '../constants';
import { getPointAtDistance, getDistance, Path } from './math';

/**
 * 核心逻辑：物理传动（后推前，或前吸后）
 */
export const updateChainMovement = (
  balls: Ball[], 
  speed: number,
  path: Path
): Ball[] => {
  if (balls.length === 0) return [];

  const newBalls = [...balls];
  const lastIdx = newBalls.length - 1;

  // 1. 唯一动力源：起点（最后一个球）受传送带恒力推动
  newBalls[lastIdx].distance += speed;

  // 2. 传动链逻辑：从后往前遍历
  for (let i = lastIdx - 1; i >= 0; i--) {
    const ahead = newBalls[i];
    const behind = newBalls[i + 1];
    
    const pushThreshold = behind.distance + BALL_DIAMETER;

    if (ahead.distance < pushThreshold) {
      // 正常推进碰撞
      ahead.distance = pushThreshold;
    } 
    else if (ahead.distance > pushThreshold + 0.1) {
      // 有间隙，检查磁吸
      if (ahead.color === behind.color) {
        const gap = ahead.distance - pushThreshold;
        // 磁吸速度：模拟电磁吸引
        const suctionSpeed = speed * 12 + (gap * 0.08); 
        ahead.distance -= suctionSpeed;
        if (ahead.distance < pushThreshold) ahead.distance = pushThreshold;
      } else {
        // 不同色，无动力，极慢滑动
        ahead.distance += speed * 0.05; 
      }
    }
  }
  
  return newBalls;
};

/**
 * 局部消除检测：只检查包含 index 的同色连续组
 */
export function findMatchesAt(balls: Ball[], index: number): number[] {
  if (index < 0 || index >= balls.length) return [];
  
  const targetColor = balls[index].color;
  const matches: number[] = [index];

  // 向前找
  for (let i = index - 1; i >= 0; i--) {
    // 物理连接检查：必须颜色相同且距离足够近（视为撞击接触）
    if (balls[i].color === targetColor && Math.abs(balls[i].distance - balls[i+1].distance) <= BALL_DIAMETER + 5) {
      matches.push(i);
    } else {
      break;
    }
  }

  // 向后找
  for (let i = index + 1; i < balls.length; i++) {
    if (balls[i].color === targetColor && Math.abs(balls[i].distance - balls[i-1].distance) <= BALL_DIAMETER + 5) {
      matches.push(i);
    } else {
      break;
    }
  }

  return matches.length >= 3 ? matches.sort((a, b) => a - b) : [];
}

/**
 * 碰撞检测
 */
export const checkCollisions = (
  projectiles: Projectile[], 
  balls: Ball[], 
  path: Path
): { hitProjectileId: string | null, hitBallIndex: number | null, insertBefore: boolean } => {
  for (const p of projectiles) {
    for (let i = 0; i < balls.length; i++) {
      const bPos = getPointAtDistance(path, balls[i].distance);
      const dist = getDistance({ x: p.x, y: p.y }, bPos);
      
      if (dist < BALL_RADIUS * 1.9) {
        const pAhead = getPointAtDistance(path, balls[i].distance + 10);
        const distToAhead = getDistance({ x: p.x, y: p.y }, pAhead);
        const pBehind = getPointAtDistance(path, balls[i].distance - 10);
        const distToBehind = getDistance({ x: p.x, y: p.y }, pBehind);

        return { 
          hitProjectileId: p.id, 
          hitBallIndex: i, 
          insertBefore: distToAhead < distToBehind 
        };
      }
    }
  }
  return { hitProjectileId: null, hitBallIndex: null, insertBefore: false };
};
