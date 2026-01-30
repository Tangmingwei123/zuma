
export type Color = 'red' | 'blue' | 'yellow' | 'green' | 'purple';

export interface Point {
  x: number;
  y: number;
}

export interface Ball {
  id: string;
  color: Color;
  distance: number; // distance along path
  status: 'active' | 'exploding' | 'inserted';
  scale: number;
}

export interface Projectile {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: Color;
}

export interface GameState {
  score: number;
  lives: number;
  isGameOver: boolean;
  isPaused: boolean;
  level: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}
