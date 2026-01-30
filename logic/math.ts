
import { Point } from '../types';

export interface Path {
  points: Point[];
  distances: number[]; // 存储每个点到起点的累积距离
  totalLength: number;
}

/**
 * 创建自适应路径：在矩形区域内生成一个宽阔的“S”型或螺旋
 */
export function createAdaptivePath(width: number, height: number): Path {
  const points: Point[] = [];
  const padding = 60;
  const w = width - padding * 2;
  const h = height - padding * 2;
  const centerX = width / 2;
  const centerY = height / 2;

  // 生成一个简单的环绕式路径，根据宽高比自动调整
  const steps = 1000;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    // 采用更平缓的椭圆螺旋
    const loops = 2.5;
    const angle = t * Math.PI * 2 * loops;
    const shrink = 1 - t * 0.8;
    const rx = (w / 2) * shrink;
    const ry = (h / 2) * shrink;
    
    // 偏移中心，避免直接撞上发射器
    const x = centerX + Math.cos(angle) * rx;
    const y = centerY + Math.sin(angle) * ry;
    points.push({ x, y });
  }

  // 计算累积距离，确保匀速运动
  const cumulativeDistances: number[] = [0];
  let totalLength = 0;
  for (let i = 1; i < points.length; i++) {
    const d = Math.sqrt(
      Math.pow(points[i].x - points[i - 1].x, 2) +
      Math.pow(points[i].y - points[i - 1].y, 2)
    );
    totalLength += d;
    cumulativeDistances.push(totalLength);
  }

  return { points, distances: cumulativeDistances, totalLength };
}

/**
 * 根据物理距离获取路径上的精确坐标
 */
export function getPointAtDistance(path: Path, distance: number): Point {
  if (distance <= 0) return path.points[0];
  if (distance >= path.totalLength) return path.points[path.points.length - 1];

  // 二分查找
  let low = 0;
  let high = path.distances.length - 1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (path.distances[mid] < distance) low = mid + 1;
    else high = mid - 1;
  }
  
  const idx = low;
  const d1 = path.distances[idx - 1];
  const d2 = path.distances[idx];
  const ratio = (distance - d1) / (d2 - d1);
  
  const p1 = path.points[idx - 1];
  const p2 = path.points[idx];
  
  return {
    x: p1.x + (p2.x - p1.x) * ratio,
    y: p1.y + (p2.y - p1.y) * ratio
  };
}

export function getDistance(p1: Point, p2: Point): number {
  return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
}
