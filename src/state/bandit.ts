import type { Protocol, Goal } from '../types';
import { getProtocolsByGoal } from '../data/protocols';
import { loadData, saveData } from './storage';
import { betaMean, sampleBeta } from './thompson-sampling';
import { shouldResetDueToDrift } from './drift-detection';
import { ensembleVoting, type EnsembleWeights } from './ensemble-methods';
import { getExplorationRecommendation } from './confidence-based-exploration';

// Configuration Constants
const MIN_TRIALS_FOR_THOMPSON = 2; // Minimal exploration - fast convergence
const EXPLORATION_BONUS = 0.05; // Ultra-minimal - maximum exploitation
const MED_STEP = 15;
const MIN_DURATION = 45;
const MAX_DURATION = 180;
const CLOSE_COMPETITION_THRESHOLD = 0.05;

export const selectProtocol = (goal: Goal): { protocol: Protocol; duration: number} => {
  const candidates = getProtocolsByGoal(goal);
  const data = loadData();
  
  const untried = candidates.filter(p => {
    const model = data.models[p.id];
    return !model || model.trials === 0;
  });
  
  if (untried.length > 0) {
    const protocol = untried[Math.floor(Math.random() * untried.length)];
    console.log(`Exploring untried protocol: ${protocol.name}`);
    return { protocol, duration: protocol.baseSeconds };
  }
  
  const undertried = candidates.filter(p => {
    const model = data.models[p.id];
    
    if (model && model.emaAvg !== undefined && model.emaAvg < -0.3) {
      console.log(`Skipping ${p.name} - consistently negative (EMA: ${model.emaAvg.toFixed(2)})`);
      return false;
    }
    
    return model && model.trials < MIN_TRIALS_FOR_THOMPSON;
  });
  
  if (undertried.length > 0) {
    const protocol = undertried[Math.floor(Math.random() * undertried.length)];
    console.log(`Building data for: ${protocol.name} (${data.models[protocol.id].trials} trials)`);
    return { protocol, duration: protocol.baseSeconds };
  }
  
  const MIN_HOURLY_EXPLORATION = 2;
  const currentHour = new Date().getHours();

  const hourlyUndertried = candidates.filter(protocol => {
    const model = data.models[protocol.id];
    if (!model || model.trials === 0) return false;
    
    if (model.emaAvg !== undefined && model.emaAvg < -0.3) {
      return false;
    }
    
    const hourlyModel = model.hourlyModels?.[currentHour];
    return !hourlyModel || hourlyModel.trials < MIN_HOURLY_EXPLORATION;
  });

  if (hourlyUndertried.length > 0) {
    const protocol = hourlyUndertried[Math.floor(Math.random() * hourlyUndertried.length)];
    console.log(`Hourly exploration: ${protocol.name} at hour ${currentHour} (${data.models[protocol.id].hourlyModels?.[currentHour]?.trials || 0} hourly trials)`);
    return { protocol, duration: protocol.baseSeconds };
  }
  
  for (const protocol of candidates) {
    const model = data.models[protocol.id];
    
    if (model && model.recentVariance !== undefined && model.lastResetTimestamp !== undefined) {
      if (shouldResetDueToDrift(model.recentVariance, model.lastResetTimestamp)) {
        console.log(`Drift detected for ${protocol.id}, resetting model`);
        
        const resetModel = {
          trials: 0,
          avg: 0,
          emaAvg: 0,
          alphaParam: 1.5,
          betaParam: 1.0,
          recentVariance: 0,
          lastResetTimestamp: Date.now(),
          windowScores: []
        };
        
        data.models[protocol.id] = resetModel;
        saveData(data);
      }
    }
  }
  
  const allProtocolStats = candidates
    .map(p => {
      const model = data.models[p.id];
      if (!model || model.trials === 0) return null;
      
      const alpha = model.alphaParam || 1.5;
      const beta = model.betaParam || 1.0;
      const mean = betaMean(alpha, beta);
      const variance = (alpha * beta) / ((alpha + beta) ** 2 * (alpha + beta + 1));
      
      return {
        protocol: p,
        model,
        mean,
        variance,
        trials: model.trials
      };
    })
    .filter((s): s is NonNullable<typeof s> => s !== null)
    .sort((a, b) => b.mean - a.mean);
  
  const isCloseCompetition = 
    allProtocolStats.length >= 2 &&
    allProtocolStats[0].trials >= 20 &&
    allProtocolStats[1].trials >= 20 &&
    (allProtocolStats[0].mean - allProtocolStats[1].mean) < CLOSE_COMPETITION_THRESHOLD;
  
  if (allProtocolStats.length >= 2) {
    console.log(`Close competition check: ${allProtocolStats[0].protocol.name} (${allProtocolStats[0].mean.toFixed(3)}) vs ${allProtocolStats[1].protocol.name} (${allProtocolStats[1].mean.toFixed(3)})`);
  }
  
  if (isCloseCompetition) {
    console.log(`Close competition detected, using ensemble voting`);
    
    const protocolsForEnsemble = candidates.map(protocol => {
      const model = data.models[protocol.id];
      return {
        id: protocol.id,
        name: protocol.name,
        alpha: model?.alphaParam || 1.5,
        beta: model?.betaParam || 1.0,
        trials: model?.trials || 0
      };
    });
    
    const totalTrials = protocolsForEnsemble.reduce((sum, p) => sum + p.trials, 0);
    
    const ensembleWeights: EnsembleWeights = {
      thompson: 0.35,
      ucb: 0.25,
      epsilonGreedy: 0.25,
      softmax: 0.15
    };
    
    const ensembleResult = ensembleVoting(protocolsForEnsemble, totalTrials, ensembleWeights);
    const selectedProtocol = candidates.find(p => p.id === ensembleResult.selectedProtocolId)!;
    
    console.log(`Consensus: ${(ensembleResult.consensusScore * 100).toFixed(0)}% on ${selectedProtocol.name}`);
    
    const currentBestMean = Math.max(...protocolsForEnsemble.map(p => p.alpha / (p.alpha + p.beta)));
    const evpiRecommendation = getExplorationRecommendation(
      protocolsForEnsemble,
      currentBestMean,
      totalTrials
    );
    
    const protocolMeans = protocolsForEnsemble.map(p => p.alpha / (p.alpha + p.beta));
    const bestMean = Math.max(...protocolMeans);
    const worstMean = Math.min(...protocolMeans);
    const isFlatLandscape = (bestMean - worstMean) < 0.10 && totalTrials > 50;
    
    if (!evpiRecommendation.shouldExplore || isFlatLandscape) {
      console.log(`EVPI Analysis: ${evpiRecommendation.justification}`);
      if (isFlatLandscape) {
        console.log(`Flat landscape detected - all protocols similarly effective (range: ${((bestMean - worstMean) * 100).toFixed(1)}%)`);
      }
    }
    
    const bestModel = data.models[selectedProtocol.id];
    const duration = bestModel?.medDuration || selectedProtocol.baseSeconds;
    
    return { protocol: selectedProtocol, duration };
    
  } else {
    console.log(`Standard selection, using Thompson sampling`);
    
    let bestProtocol = candidates[0];
    let bestScore = -Infinity;
    
    for (const protocol of candidates) {
      const model = data.models[protocol.id];
      
      if (!model || model.trials < MIN_TRIALS_FOR_THOMPSON) {
        // Not enough data, give exploration bonus
        const randomScore = Math.random() + EXPLORATION_BONUS;
        if (randomScore > bestScore) {
          bestScore = randomScore;
          bestProtocol = protocol;
        }
        continue;
      }
      
      const alpha = model.alphaParam || 1;
      const beta = model.betaParam || 1;
      const sampledValue = sampleBeta(alpha, beta);
      const contextBonus = 0;
      
      const variance = (alpha * beta) / ((alpha + beta) ** 2 * (alpha + beta + 1));
      const uncertaintyBonus = Math.sqrt(variance) * EXPLORATION_BONUS;
      
      const finalScore = sampledValue + contextBonus + uncertaintyBonus;
      
      if (finalScore > bestScore) {
        bestScore = finalScore;
        bestProtocol = protocol;
      }
    }
    
    const bestModel = data.models[bestProtocol.id];
    const duration = bestModel?.medDuration || bestProtocol.baseSeconds;
    
    const totalTrials = Object.values(data.models).reduce((sum, m) => sum + m.trials, 0);
    const protocolsForEVPI = candidates.map(p => {
      const model = data.models[p.id] || { alphaParam: 1, betaParam: 1, trials: 0, avg: 0 };
      return {
        id: p.id,
        name: p.name,
        alpha: model.alphaParam || 1,
        beta: model.betaParam || 1,
        trials: model.trials
      };
    });
    
    const currentBestMean = Math.max(...protocolsForEVPI.map(p => p.alpha / (p.alpha + p.beta)));
    const evpiRecommendation = getExplorationRecommendation(
      protocolsForEVPI,
      currentBestMean,
      totalTrials
    );
    
    if (!evpiRecommendation.shouldExplore) {
      console.log(`EVPI Analysis: ${evpiRecommendation.justification}`);
    } else if (evpiRecommendation.protocolId && evpiRecommendation.metrics) {
      console.log(`EVPI: Protocol ${evpiRecommendation.protocolName} worth exploring (EVOI: ${evpiRecommendation.metrics.expectedValueOfInformation.toFixed(3)})`);
    }
    
    console.log(`Selected: ${bestProtocol.name} (score: ${bestScore.toFixed(3)})`);
    
    return { protocol: bestProtocol, duration };
  }
};

/**
 * Adaptive Duration Adjustment
 * Reduces duration if user rates session as "better"
 * Increases duration if user rates as "worse"
 */
export const adjustDuration = (_protocolId: string, baseDuration: number, lastDelta: number): number => {
  if (lastDelta === 1) {
    return Math.max(MIN_DURATION, baseDuration - MED_STEP);
  }
  if (lastDelta === -1) {
    return Math.min(MAX_DURATION, baseDuration + MED_STEP);
  }
  return baseDuration;
};

