
import { Color } from './types';

export const BALL_RADIUS = 20; 
export const BALL_DIAMETER = BALL_RADIUS * 2;
export const COLORS: Color[] = ['red', 'blue', 'yellow', 'green', 'purple'];

export const COLOR_MAP: Record<Color, string> = {
  red: '#FF4B5C',
  blue: '#00A8FF',
  yellow: '#FFC312',
  green: '#1DD1A1',
  purple: '#A55EEA'
};

export const INITIAL_SPEED = 1.0;
export const PROJECTILE_SPEED = 24;
