import type { ProtocolModel } from '../types';
import { sampleBeta, betaMean } from './thompson-sampling';

const MIN_HOURLY_TRIALS = 1;

export const getCurrentContext = (): {
  hour: number;
  dayOfWeek: number;
  isWeekend: boolean;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
} => {
  const now = new Date();
  const hour = now.getHours();
  const dayOfWeek = now.getDay();
  
  let timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  if (hour >= 5 && hour < 12) timeOfDay = 'morning';
  else if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
  else if (hour >= 17 && hour < 22) timeOfDay = 'evening';
  else timeOfDay = 'night';
  
  return {
    hour,
    dayOfWeek,
    isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
    timeOfDay
  };
};

export const initializeHourlyModel = (): {
  trials: number;
  alpha: number;
  beta: number;
  avg: number;
} => {
  return {
    trials: 0,
    alpha: 1,
    beta: 1,
    avg: 0
  };
};

export const sampleContextualScore = (
  model: ProtocolModel,
  currentHour: number
): number => {
  if (model.hourlyModels && model.hourlyModels[currentHour]) {
    const hourlyModel = model.hourlyModels[currentHour];
    
    if (hourlyModel.trials >= MIN_HOURLY_TRIALS) {
      return sampleBeta(hourlyModel.alpha, hourlyModel.beta);
    }
  }
  
  const alpha = model.alphaParam || 1;
  const beta = model.betaParam || 1;
  return sampleBeta(alpha, beta);
};

export const getContextualBonus = (
  _model: ProtocolModel,
  _currentHour: number
): number => {
  return 0;
};

export const updateHourlyModel = (
  model: ProtocolModel,
  hour: number,
  reward: number
): ProtocolModel => {
  if (!model.hourlyModels) {
    model.hourlyModels = {};
  }
  
  if (!model.hourlyModels[hour]) {
    model.hourlyModels[hour] = initializeHourlyModel();
  }
  
  const hourlyModel = model.hourlyModels[hour];
  
  hourlyModel.alpha += reward;
  hourlyModel.beta += (1 - reward);
  hourlyModel.trials += 1;
  
  hourlyModel.avg = (hourlyModel.avg * (hourlyModel.trials - 1) + reward) / hourlyModel.trials;
  
  return model;
};

export const getBestHourForProtocol = (model: ProtocolModel): number | null => {
  if (!model.hourlyModels) return null;
  
  let bestHour: number | null = null;
  let bestMean = 0;
  
  Object.entries(model.hourlyModels).forEach(([hour, hourModel]) => {
    if (hourModel.trials >= MIN_HOURLY_TRIALS) {
      const mean = betaMean(hourModel.alpha, hourModel.beta);
      if (mean > bestMean) {
        bestMean = mean;
        bestHour = parseInt(hour);
      }
    }
  });
  
  return bestHour;
};

export const getHourlyPerformanceSummary = (model: ProtocolModel): {
  hour: number;
  performance: number;
  trials: number;
}[] => {
  if (!model.hourlyModels) return [];
  
  return Object.entries(model.hourlyModels)
    .map(([hour, hourModel]) => ({
      hour: parseInt(hour),
      performance: betaMean(hourModel.alpha, hourModel.beta),
      trials: hourModel.trials
    }))
    .filter(item => item.trials >= MIN_HOURLY_TRIALS)
    .sort((a, b) => b.performance - a.performance);
};
