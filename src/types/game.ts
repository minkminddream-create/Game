export type GameMode = 'camera' | 'mouse';

export type GameState = 'menu' | 'countdown' | 'playing' | 'paused' | 'gameover';

export type TargetType = 'standard' | 'special' | 'bonus';

export interface TargetItem {
  id: string;
  x: number; // percentage 0-100 or screen pixel
  y: number;
  radius: number;
  type: TargetType;
  points: number;
  color: string;
  glowColor: string;
  shape: 'circle' | 'diamond' | 'hexagon' | 'star';
  createdAt: number;
  lifetime: number; // total lifetime in ms
  vx: number;
  vy: number;
  pulsePhase: number;
  isHit: boolean;
  scale: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  shape?: 'circle' | 'star' | 'spark';
}

export interface Shockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
  alpha: number;
}

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  scale: number;
  alpha: number;
  createdAt: number;
  isCombo?: boolean;
}

export interface HandLandmarkPoint {
  x: number;
  y: number;
  z: number;
}

export interface HandTrackingState {
  isSupported: boolean;
  isLoading: boolean;
  isTracking: boolean;
  error: string | null;
  cursorX: number; // normalized 0 to 1
  cursorY: number; // normalized 0 to 1
  isPinching?: boolean;
  landmarks: HandLandmarkPoint[] | null;
  lastDetectedTime: number;
}

export interface GameStats {
  score: number;
  bestScore: number;
  targetsCollected: number;
  maxCombo: number;
  currentCombo: number;
  totalHits: number;
  totalMisses: number;
  hitsByType: {
    standard: number;
    special: number;
    bonus: number;
  };
}
