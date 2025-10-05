export type Goal = 'calm' | 'focus' | 'pre-sleep';

export type ProtocolId = 'physiological-sigh' | 'box-breathing' | 'eye-break' | '4-7-8-breathing' | 'alternate-nostril';

export interface Protocol {
  id: ProtocolId;
  name: string;
  supports: Goal[];
  baseSeconds: number;
  cues: string[];
}

export interface ProtocolModel {
  trials: number;
  avg: number;
  lastUsedISO?: string;
  lastDelta?: -1 | 0 | 1;
  medDuration?: number;
  hourlyPerformance?: Record<number, { sum: number; count: number }>;
  emaAvg?: number;
  
  alphaParam?: number;
  betaParam?: number;
  
  hourlyModels?: Record<number, {
    trials: number;
    alpha: number;
    beta: number;
    avg: number;
  }>;
  
  recentVariance?: number;
  lastResetTimestamp?: number;
  windowScores?: number[];
}

export interface SessionRecord {
  dateISO: string;
  goal: Goal;
  protocolId: ProtocolId;
  seconds: number;
  delta: -1 | 0 | 1;
}

export interface AppData {
  models: Record<string, ProtocolModel>;
  history: SessionRecord[];
  streak: number;
}

export interface SessionContext {
  goal: Goal | null;
  protocol: Protocol | null;
  duration: number;
  setGoal: (goal: Goal) => void;
  setProtocol: (protocol: Protocol, duration: number) => void;
  saveRating: (delta: -1 | 0 | 1) => void;
  reset: () => void;
}
