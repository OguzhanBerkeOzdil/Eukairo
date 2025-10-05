import { betaMean, betaVariance, betaCredibleInterval } from './thompson-sampling';

export interface ExplorationBudget {
  totalBudget: number;
  spent: number;
  perProtocolLimit: number;
}

export interface InformationGainMetrics {
  expectedValueOfInformation: number;
  regretBound: number;
  uncertaintyReduction: number;
  opportunityCost: number;
}

export const initializeExplorationBudget = (totalTrials: number): ExplorationBudget => {
  const baseBudget = 100;
  const decayedBudget = baseBudget * Math.exp(-totalTrials / 50);
  
  return {
    totalBudget: Math.max(10, decayedBudget),
    spent: 0,
    perProtocolLimit: Math.max(3, decayedBudget / 5)
  };
};

export const calculateEVPI = (
  protocolAlpha: number,
  protocolBeta: number,
  currentBestMean: number
): number => {
  const mean = betaMean(protocolAlpha, protocolBeta);
  const variance = betaVariance(protocolAlpha, protocolBeta);
  const [lowerBound, upperBound] = betaCredibleInterval(protocolAlpha, protocolBeta);
  
  if (upperBound < currentBestMean - 0.05) {
    return 0;
  }
  
  if (lowerBound > currentBestMean + 0.05) {
    return (lowerBound - currentBestMean) * 10;
  }
  
  // Otherwise, value proportional to uncertainty and potential gain
  const potentialGain = Math.max(0, mean - currentBestMean);
  const uncertaintyValue = Math.sqrt(variance) * 5;
  
  return potentialGain + uncertaintyValue;
};

/**
 * Calculate information gain metrics for a protocol
 */
export const calculateInformationGain = (
  protocolAlpha: number,
  protocolBeta: number,
  _protocolTrials: number,
  currentBestMean: number
): InformationGainMetrics => {
  const mean = betaMean(protocolAlpha, protocolBeta);
  const variance = betaVariance(protocolAlpha, protocolBeta);
  const [, upperBound] = betaCredibleInterval(protocolAlpha, protocolBeta);
  
  const evoi = calculateEVPI(protocolAlpha, protocolBeta, currentBestMean);
  
  const regretBound = Math.max(0, upperBound - currentBestMean);
  
  const currentUncertainty = Math.sqrt(variance);
  const futureVariance = betaVariance(protocolAlpha + 0.5, protocolBeta + 0.5);
  const uncertaintyReduction = currentUncertainty - Math.sqrt(futureVariance);
  
  const opportunityCost = Math.max(0, currentBestMean - mean);
  
  return {
    expectedValueOfInformation: evoi,
    regretBound,
    uncertaintyReduction,
    opportunityCost
  };
};

export const shouldExploreProtocol = (
  protocolAlpha: number,
  protocolBeta: number,
  protocolTrials: number,
  currentBestMean: number,
  budget: ExplorationBudget
): {
  shouldExplore: boolean;
  reason: string;
  cost: number;
} => {
  const metrics = calculateInformationGain(
    protocolAlpha,
    protocolBeta,
    protocolTrials,
    currentBestMean
  );
  
  const baseCost = 1;
  const trialPenalty = Math.sqrt(protocolTrials + 1);
  const cost = baseCost * trialPenalty;
  
  if (budget.spent + cost > budget.totalBudget) {
    return {
      shouldExplore: false,
      reason: 'Budget exhausted',
      cost
    };
  }
  
  // Don't explore if we've hit per-protocol limit
  if (protocolTrials > budget.perProtocolLimit) {
    return {
      shouldExplore: false,
      reason: 'Per-protocol limit reached',
      cost
    };
  }
  
  // High value of information → explore
  if (metrics.expectedValueOfInformation > 0.5) {
    return {
      shouldExplore: true,
      reason: `High EVOI: ${metrics.expectedValueOfInformation.toFixed(2)}`,
      cost
    };
  }
  
  // High uncertainty and low opportunity cost → explore
  if (metrics.uncertaintyReduction > 0.1 && metrics.opportunityCost < 0.2) {
    return {
      shouldExplore: true,
      reason: 'High uncertainty, low cost',
      cost
    };
  }
  
  // Small regret bound → explore (might be optimal)
  if (metrics.regretBound < 0.1 && protocolTrials < 3) {
    return {
      shouldExplore: true,
      reason: 'Possibly optimal, needs more data',
      cost
    };
  }
  
  // Otherwise, don't waste exploration budget
  return {
    shouldExplore: false,
    reason: `Low value: EVOI=${metrics.expectedValueOfInformation.toFixed(2)}`,
    cost
  };
};

/**
 * Update exploration budget after a trial
 */
export const updateExplorationBudget = (
  budget: ExplorationBudget,
  cost: number
): ExplorationBudget => {
  return {
    ...budget,
    spent: budget.spent + cost
  };
};

/**
 * Get exploration recommendation with justification
 */
export const getExplorationRecommendation = (
  protocols: Array<{
    id: string;
    name: string;
    alpha: number;
    beta: number;
    trials: number;
  }>,
  currentBestMean: number,
  totalTrialsSoFar: number
): {
  protocolId: string | null;
  protocolName: string | null;
  shouldExplore: boolean;
  justification: string;
  metrics: InformationGainMetrics | null;
} => {
  const budget = initializeExplorationBudget(totalTrialsSoFar);
  
  // Score each protocol for exploration value
  const scoredProtocols = protocols.map(p => {
    const decision = shouldExploreProtocol(
      p.alpha,
      p.beta,
      p.trials,
      currentBestMean,
      budget
    );
    
    const metrics = calculateInformationGain(
      p.alpha,
      p.beta,
      p.trials,
      currentBestMean
    );
    
    return {
      ...p,
      decision,
      metrics,
      explorationScore: decision.shouldExplore ? metrics.expectedValueOfInformation : -1
    };
  }).filter(p => p.decision.shouldExplore);
  
  // No protocols worth exploring
  if (scoredProtocols.length === 0) {
    return {
      protocolId: null,
      protocolName: null,
      shouldExplore: false,
      justification: 'No protocols worth exploring (low EVOI, budget constraints)',
      metrics: null
    };
  }
  
  // Pick protocol with highest exploration value
  scoredProtocols.sort((a, b) => b.explorationScore - a.explorationScore);
  const best = scoredProtocols[0];
  
  return {
    protocolId: best.id,
    protocolName: best.name,
    shouldExplore: true,
    justification: best.decision.reason,
    metrics: best.metrics
  };
};

/**
 * Calculate exploration efficiency
 * Ratio of valuable explorations to total explorations
 */
export const calculateExplorationEfficiency = (
  explorationHistory: Array<{
    protocolId: string;
    preMean: number;
    postMean: number;
    informationGain: number;
  }>
): number => {
  if (explorationHistory.length === 0) return 0;
  
  const valuableExplorations = explorationHistory.filter(
    e => e.informationGain > 0.1
  ).length;
  
  return valuableExplorations / explorationHistory.length;
};
