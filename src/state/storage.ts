import type { AppData, SessionRecord } from '../types';
import { deltaToReward, updateBetaParams } from './thompson-sampling';
import { updateHourlyModel } from './contextual-bandits';
import { calculateRecentVariance, updateScoreWindow, softResetBetaParams, shouldResetDueToDrift } from './drift-detection';

const STORAGE_KEY = 'eukairo.v1';

const defaultData: AppData = {
  models: {},
  history: [],
  streak: 0
};

export const loadData = (): AppData => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultData;
    return JSON.parse(raw);
  } catch {
    return defaultData;
  }
};

export const saveData = (data: AppData): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save data:', e);
  }
};

export const addSession = (record: SessionRecord): void => {
  const data = loadData();
  data.history.push(record);
  saveData(data);
};

export const updateModel = (protocolId: string, delta: number, currentDuration: number): void => {
  const data = loadData();
  const model = data.models[protocolId] || { 
    trials: 0, 
    avg: 0, 
    hourlyPerformance: {}, 
    emaAvg: 0,
    alphaParam: 1, // Beta(1,1) prior = Uniform distribution
    betaParam: 1,
    hourlyModels: {},
    windowScores: [],
    recentVariance: 0
  };
  
  const hour = new Date().getHours();
  const reward = deltaToReward(delta as -1 | 0 | 1);
  
  if (model.trials === 0) {
    model.avg = delta;
    model.emaAvg = delta;
  } else {
    model.avg = (model.avg * model.trials + delta) / (model.trials + 1);
    const alpha = 0.2;
    model.emaAvg = (model.emaAvg || model.avg) * (1 - alpha) + delta * alpha;
  }
  
  model.trials = model.trials + 1;
  model.lastUsedISO = new Date().toISOString();
  model.lastDelta = delta as -1 | 0 | 1;
  
  const betaUpdate = updateBetaParams(
    model.alphaParam || 1,
    model.betaParam || 1,
    reward
  );
  model.alphaParam = betaUpdate.alpha;
  model.betaParam = betaUpdate.beta;
  
  updateHourlyModel(model, hour, reward);
  
  model.windowScores = updateScoreWindow(model.windowScores || [], delta);
  model.recentVariance = calculateRecentVariance(model.windowScores);
  
  if (shouldResetDueToDrift(model.recentVariance, model.lastResetTimestamp)) {
    console.log(`Drift detected for ${protocolId}, soft resetting model...`);
    const resetParams = softResetBetaParams(model.alphaParam, model.betaParam);
    model.alphaParam = resetParams.alpha;
    model.betaParam = resetParams.beta;
    model.emaAvg = 0;
    model.avg = 0;
    model.lastResetTimestamp = Date.now();
    model.windowScores = [];
  }
  
  if (!model.hourlyPerformance) model.hourlyPerformance = {};
  if (!model.hourlyPerformance[hour]) {
    model.hourlyPerformance[hour] = { sum: 0, count: 0 };
  }
  model.hourlyPerformance[hour].sum += delta;
  model.hourlyPerformance[hour].count += 1;
  
  let step = 15;
  const recentSessions = data.history.filter(s => s.protocolId === protocolId).slice(-3);
  const consecutiveBetter = recentSessions.length >= 2 && recentSessions.slice(-2).every(s => s.delta === 1);
  const hadWorse = recentSessions.some(s => s.delta === -1);
  
  if (consecutiveBetter) step = 10;
  if (hadWorse) step = 20;
  
  if (delta === 1) {
    model.medDuration = Math.max(45, currentDuration - step);
  } else if (delta === -1) {
    model.medDuration = Math.min(180, currentDuration + step);
  } else {
    model.medDuration = currentDuration;
  }
  
  data.models[protocolId] = model;
  saveData(data);
  
  console.log(`📊 Model updated for ${protocolId}:`, {
    trials: model.trials,
    avg: model.avg.toFixed(2),
    beta: `α=${model.alphaParam.toFixed(1)}, β=${model.betaParam.toFixed(1)}`,
    variance: model.recentVariance.toFixed(3)
  });
};

export const exportCSV = (): string => {
  const data = loadData();
  
  // Title section
  const title = '=== EUKAIRO SESSION EXPORT ===\n';
  const exportDate = `Export Date:,${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}\n`;
  const totalSessions = `Total Sessions:,${data.history.length}\n`;
  const blankLine = '\n';
  
  const headers = [
    'Session #',
    'Date',
    'Time',
    'Day',
    'Goal',
    'Protocol',
    'Duration (sec)',
    'Rating',
    'Score',
    'Notes'
  ].join(',') + '\n';
  
  const rows = data.history.map((r, index) => {
    const date = new Date(r.dateISO);
    
    const sessionNum = (index + 1).toString();
    const dateStr = date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
    const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' });
    
    const protocolName = r.protocolId
      .split('-')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    
    let ratingText: string;
    if (r.delta === 1) ratingText = 'Better';
    else if (r.delta === 0) ratingText = 'Same';
    else ratingText = 'Worse';
    
    const goalFormatted = r.goal.charAt(0).toUpperCase() + r.goal.slice(1);
    const notes = '';
    
    return [
      sessionNum,
      `"${dateStr}"`,
      `"${timeStr}"`,
      dayOfWeek,
      `"${goalFormatted}"`,
      `"${protocolName}"`,
      r.seconds,
      `"${ratingText}"`,
      r.delta,
      `"${notes}"`
    ].join(',');
  }).join('\n');
  
  return title + exportDate + totalSessions + blankLine + headers + rows;
};

export const clearData = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};
