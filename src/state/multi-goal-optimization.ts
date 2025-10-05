/**
 * MULTI-GOAL OPTIMIZATION MODULE
 * Hierarchical Bayesian model that shares information across goals
 * Enables faster learning for new goals through transfer learning
 */

import type { Goal } from '../types';
import { betaMean, updateBetaParams } from './thompson-sampling';

/**
 * Hierarchical model structure
 * Global prior → Goal-specific → Protocol-specific
 */
export interface HierarchicalModel {
  // Global prior (all goals, all protocols)
  globalPrior: {
    alpha: number;
    beta: number;
  };
  
  // Goal-specific priors
  goalPriors: Record<Goal, {
    alpha: number;
    beta: number;
    protocolCount: number;
  }>;
  
  // Protocol-goal pairs
  protocolGoalModels: Record<string, { // key: "protocolId:goal"
    alpha: number;
    beta: number;
    trials: number;
  }>;
}

/**
 * Initialize hierarchical model with weak priors
 */
export const initializeHierarchicalModel = (): HierarchicalModel => {
  return {
    globalPrior: {
      alpha: 1.5, // Slightly optimistic prior (success-biased)
      beta: 1.0
    },
    goalPriors: {
      calm: { alpha: 1.5, beta: 1.0, protocolCount: 0 },
      focus: { alpha: 1.5, beta: 1.0, protocolCount: 0 },
      'pre-sleep': { alpha: 1.5, beta: 1.0, protocolCount: 0 }
    },
    protocolGoalModels: {}
  };
};

/**
 * Get effective prior for a protocol-goal pair
 * Uses hierarchical shrinkage: protocol → goal → global
 */
export const getEffectivePrior = (
  hierarchicalModel: HierarchicalModel,
  protocolId: string,
  goal: Goal
): { alpha: number; beta: number } => {
  const key = `${protocolId}:${goal}`;
  const protocolGoalModel = hierarchicalModel.protocolGoalModels[key];
  
  // If we have protocol-goal specific data, use it with shrinkage
  if (protocolGoalModel && protocolGoalModel.trials >= 3) {
    const goalPrior = hierarchicalModel.goalPriors[goal];
    const shrinkage = Math.min(0.3, 5 / protocolGoalModel.trials); // Shrink less as trials increase
    
    return {
      alpha: protocolGoalModel.alpha * (1 - shrinkage) + goalPrior.alpha * shrinkage,
      beta: protocolGoalModel.beta * (1 - shrinkage) + goalPrior.beta * shrinkage
    };
  }
  
  // If no protocol-goal data, use goal prior
  const goalPrior = hierarchicalModel.goalPriors[goal];
  if (goalPrior.protocolCount > 0) {
    return {
      alpha: goalPrior.alpha,
      beta: goalPrior.beta
    };
  }
  
  // Fall back to global prior
  return hierarchicalModel.globalPrior;
};

/**
 * Update hierarchical model with new observation
 */
export const updateHierarchicalModel = (
  hierarchicalModel: HierarchicalModel,
  protocolId: string,
  goal: Goal,
  reward: number
): HierarchicalModel => {
  const key = `${protocolId}:${goal}`;
  
  // Update protocol-goal specific model
  if (!hierarchicalModel.protocolGoalModels[key]) {
    const prior = getEffectivePrior(hierarchicalModel, protocolId, goal);
    hierarchicalModel.protocolGoalModels[key] = {
      alpha: prior.alpha,
      beta: prior.beta,
      trials: 0
    };
  }
  
  const pgModel = hierarchicalModel.protocolGoalModels[key];
  const updated = updateBetaParams(pgModel.alpha, pgModel.beta, reward);
  pgModel.alpha = updated.alpha;
  pgModel.beta = updated.beta;
  pgModel.trials += 1;
  
  // Update goal prior (pooled across all protocols for this goal)
  const goalPrior = hierarchicalModel.goalPriors[goal];
  const goalUpdated = updateBetaParams(goalPrior.alpha, goalPrior.beta, reward);
  goalPrior.alpha = (goalPrior.alpha * 0.95) + (goalUpdated.alpha * 0.05); // Slow update
  goalPrior.beta = (goalPrior.beta * 0.95) + (goalUpdated.beta * 0.05);
  goalPrior.protocolCount += 1;
  
  // Update global prior (pooled across all goals and protocols)
  const globalUpdated = updateBetaParams(
    hierarchicalModel.globalPrior.alpha,
    hierarchicalModel.globalPrior.beta,
    reward
  );
  hierarchicalModel.globalPrior.alpha = 
    (hierarchicalModel.globalPrior.alpha * 0.98) + (globalUpdated.alpha * 0.02); // Very slow update
  hierarchicalModel.globalPrior.beta = 
    (hierarchicalModel.globalPrior.beta * 0.98) + (globalUpdated.beta * 0.02);
  
  return hierarchicalModel;
};

/**
 * Transfer learning: Get initial estimate for new protocol-goal pair
 */
export const transferLearningPrior = (
  hierarchicalModel: HierarchicalModel,
  newProtocolId: string,
  goal: Goal,
  similarProtocols: string[] // IDs of similar protocols
): { alpha: number; beta: number } => {
  // Collect data from similar protocols
  const similarEstimates: { alpha: number; beta: number }[] = [];
  
  similarProtocols.forEach(similarId => {
    const key = `${similarId}:${goal}`;
    const model = hierarchicalModel.protocolGoalModels[key];
    if (model && model.trials >= 2) {
      similarEstimates.push({ alpha: model.alpha, beta: model.beta });
    }
  });
  
  // If we have similar protocol data, pool it
  if (similarEstimates.length > 0) {
    const pooledAlpha = similarEstimates.reduce((sum, e) => sum + e.alpha, 0) / similarEstimates.length;
    const pooledBeta = similarEstimates.reduce((sum, e) => sum + e.beta, 0) / similarEstimates.length;
    
    // Blend with goal prior
    const goalPrior = hierarchicalModel.goalPriors[goal];
    return {
      alpha: (pooledAlpha * 0.7) + (goalPrior.alpha * 0.3),
      beta: (pooledBeta * 0.7) + (goalPrior.beta * 0.3)
    };
  }
  
  // Otherwise use goal prior
  return getEffectivePrior(hierarchicalModel, newProtocolId, goal);
};

/**
 * Calculate cross-goal similarity score
 * Helps identify if a protocol good for 'calm' might also be good for 'focus'
 */
export const calculateCrossGoalSimilarity = (
  hierarchicalModel: HierarchicalModel,
  protocolId: string
): Record<Goal, number> => {
  const goals: Goal[] = ['calm', 'focus', 'pre-sleep'];
  const similarities: Record<Goal, number> = {} as Record<Goal, number>;
  
  goals.forEach(goal => {
    const key = `${protocolId}:${goal}`;
    const model = hierarchicalModel.protocolGoalModels[key];
    
    if (model && model.trials >= 3) {
      similarities[goal] = betaMean(model.alpha, model.beta);
    } else {
      similarities[goal] = betaMean(
        hierarchicalModel.goalPriors[goal].alpha,
        hierarchicalModel.goalPriors[goal].beta
      );
    }
  });
  
  return similarities;
};

/**
 * Predict performance for unobserved protocol-goal combinations
 */
export const predictPerformance = (
  hierarchicalModel: HierarchicalModel,
  protocolId: string,
  goal: Goal
): {
  expectedPerformance: number;
  uncertainty: number;
  confidence: 'low' | 'medium' | 'high';
} => {
  const key = `${protocolId}:${goal}`;
  const model = hierarchicalModel.protocolGoalModels[key];
  
  if (model && model.trials >= 5) {
    const mean = betaMean(model.alpha, model.beta);
    const variance = (model.alpha * model.beta) / 
      ((model.alpha + model.beta) ** 2 * (model.alpha + model.beta + 1));
    
    return {
      expectedPerformance: mean,
      uncertainty: Math.sqrt(variance),
      confidence: 'high'
    };
  }
  
  const prior = getEffectivePrior(hierarchicalModel, protocolId, goal);
  const mean = betaMean(prior.alpha, prior.beta);
  const variance = (prior.alpha * prior.beta) / 
    ((prior.alpha + prior.beta) ** 2 * (prior.alpha + prior.beta + 1));
  
  return {
    expectedPerformance: mean,
    uncertainty: Math.sqrt(variance),
    confidence: model && model.trials >= 2 ? 'medium' : 'low'
  };
};
