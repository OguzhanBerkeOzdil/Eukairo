import type { SessionRecord } from '../types';

const DRIFT_WINDOW_SIZE = 5;
const DRIFT_VARIANCE_THRESHOLD = 0.30;
const DRIFT_COOLDOWN_MS = 3600000;

export const calculateRecentVariance = (recentScores: number[]): number => {
  if (recentScores.length < 3) return 0;
  
  const mean = recentScores.reduce((sum, val) => sum + val, 0) / recentScores.length;
  const squaredDiffs = recentScores.map(val => Math.pow(val - mean, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / recentScores.length;
  
  return variance;
};

export const updateScoreWindow = (
  currentWindow: number[] = [],
  newScore: number
): number[] => {
  const updated = [...currentWindow, newScore];
  
  if (updated.length > DRIFT_WINDOW_SIZE) {
    return updated.slice(-DRIFT_WINDOW_SIZE);
  }
  
  return updated;
};

export const shouldResetDueToDrift = (
  recentVariance: number,
  lastResetTimestamp: number | undefined
): boolean => {
  if (recentVariance < DRIFT_VARIANCE_THRESHOLD) {
    return false;
  }
  
  if (lastResetTimestamp) {
    const timeSinceReset = Date.now() - lastResetTimestamp;
    if (timeSinceReset < DRIFT_COOLDOWN_MS) {
      return false;
    }
  }
  
  return true;
};

export const softResetBetaParams = (
  currentAlpha: number,
  currentBeta: number
): { alpha: number; beta: number } => {
  const totalTrials = currentAlpha + currentBeta - 2;
  const keepRatio = 0.25;
  
  const mean = currentAlpha / (currentAlpha + currentBeta);
  const keptTrials = Math.floor(totalTrials * keepRatio);
  
  return {
    alpha: 1 + mean * keptTrials,
    beta: 1 + (1 - mean) * keptTrials
  };
};

export const analyzeSessionHistory = (
  protocolId: string,
  history: SessionRecord[]
): {
  hasRecency: boolean;
  recentAvg: number;
  previousAvg: number;
  significantChange: boolean;
} => {
  const protocolSessions = history.filter(s => s.protocolId === protocolId);
  
  if (protocolSessions.length < 20) {
    return {
      hasRecency: false,
      recentAvg: 0,
      previousAvg: 0,
      significantChange: false
    };
  }
  
  const recent = protocolSessions.slice(-10);
  const previous = protocolSessions.slice(-20, -10);
  
  const recentAvg = recent.reduce((sum, s) => sum + s.delta, 0) / recent.length;
  const previousAvg = previous.reduce((sum, s) => sum + s.delta, 0) / previous.length;
  
  const significantChange = Math.abs(recentAvg - previousAvg) > 0.5;
  
  return {
    hasRecency: true,
    recentAvg,
    previousAvg,
    significantChange
  };
};
