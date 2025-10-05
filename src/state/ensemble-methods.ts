import { sampleBeta, betaMean } from './thompson-sampling';

export type EnsembleAlgorithm = 'thompson' | 'ucb' | 'epsilonGreedy' | 'softmax';

export interface AlgorithmVote {
  algorithm: EnsembleAlgorithm;
  protocolId: string;
  confidence: number;
  score: number;
  reasoning: string;
}

export interface EnsembleWeights {
  thompson: number;
  ucb: number;
  epsilonGreedy: number;
  softmax: number;
}

const thompsonVote = (
  protocols: Array<{ id: string; alpha: number; beta: number }>
): AlgorithmVote => {
  const samples = protocols.map(p => ({
    id: p.id,
    sample: sampleBeta(p.alpha, p.beta),
    mean: betaMean(p.alpha, p.beta),
    variance: (p.alpha * p.beta) / ((p.alpha + p.beta) ** 2 * (p.alpha + p.beta + 1))
  }));
  
  samples.sort((a, b) => b.sample - a.sample);
  const winner = samples[0];
  
  const gap = samples.length > 1 ? winner.sample - samples[1].sample : 0.5;
  const confidence = Math.min(1, gap * 2) * (1 - Math.sqrt(winner.variance));
  
  return {
    algorithm: 'thompson',
    protocolId: winner.id,
    confidence,
    score: winner.sample,
    reasoning: `Sampled ${winner.sample.toFixed(3)}, gap: ${gap.toFixed(3)}`
  };
};

/**
 * UCB (Upper Confidence Bound) vote
 */
const ucbVote = (
  protocols: Array<{ id: string; alpha: number; beta: number; trials: number }>,
  totalTrials: number
): AlgorithmVote => {
  const scores = protocols.map(p => {
    const mean = betaMean(p.alpha, p.beta);
    const variance = (p.alpha * p.beta) / ((p.alpha + p.beta) ** 2 * (p.alpha + p.beta + 1));
    
    const exploration = Math.sqrt((2 * Math.log(totalTrials + 1)) / (p.trials + 1));
    const ucbScore = mean + exploration + Math.sqrt(variance);
    
    return {
      id: p.id,
      score: ucbScore,
      mean,
      exploration
    };
  });
  
  scores.sort((a, b) => b.score - a.score);
  const winner = scores[0];
  
  const confidence = Math.min(1, winner.mean / (winner.mean + winner.exploration));
  
  return {
    algorithm: 'ucb',
    protocolId: winner.id,
    confidence,
    score: winner.score,
    reasoning: `UCB score: ${winner.score.toFixed(3)} (mean: ${winner.mean.toFixed(3)}, explore: ${winner.exploration.toFixed(3)})`
  };
};

const epsilonGreedyVote = (
  protocols: Array<{ id: string; alpha: number; beta: number; trials: number }>,
  totalTrials: number
): AlgorithmVote => {
  const epsilon = Math.max(0.05, 0.2 * Math.exp(-totalTrials / 30));
  
  if (Math.random() < epsilon) {
    const randomProtocol = protocols[Math.floor(Math.random() * protocols.length)];
    return {
      algorithm: 'epsilonGreedy',
      protocolId: randomProtocol.id,
      confidence: 0.3,
      score: betaMean(randomProtocol.alpha, randomProtocol.beta),
      reasoning: `Random exploration (ε=${epsilon.toFixed(2)})`
    };
  }
  
  const means = protocols.map(p => ({
    id: p.id,
    mean: betaMean(p.alpha, p.beta),
    variance: (p.alpha * p.beta) / ((p.alpha + p.beta) ** 2 * (p.alpha + p.beta + 1))
  }));
  
  means.sort((a, b) => b.mean - a.mean);
  const winner = means[0];
  
  return {
    algorithm: 'epsilonGreedy',
    protocolId: winner.id,
    confidence: 1 - Math.sqrt(winner.variance),
    score: winner.mean,
    reasoning: `Greedy choice: mean=${winner.mean.toFixed(3)}`
  };
};

const softmaxVote = (
  protocols: Array<{ id: string; alpha: number; beta: number }>,
  totalTrials: number
): AlgorithmVote => {
  const temperature = Math.max(0.1, 1.0 * Math.exp(-totalTrials / 40));
  
  const means = protocols.map(p => betaMean(p.alpha, p.beta));
  const expScores = means.map(mean => Math.exp(mean / temperature));
  const sumExp = expScores.reduce((sum, val) => sum + val, 0);
  const probabilities = expScores.map(exp => exp / sumExp);
  
  const rand = Math.random();
  let cumulativeProb = 0;
  let selectedIndex = 0;
  
  for (let i = 0; i < probabilities.length; i++) {
    cumulativeProb += probabilities[i];
    if (rand <= cumulativeProb) {
      selectedIndex = i;
      break;
    }
  }
  
  const winner = protocols[selectedIndex];
  const winnerMean = means[selectedIndex];
  
  return {
    algorithm: 'softmax',
    protocolId: winner.id,
    confidence: probabilities[selectedIndex], // Softmax probability as confidence
    score: winnerMean,
    reasoning: `Softmax prob: ${probabilities[selectedIndex].toFixed(3)} (T=${temperature.toFixed(2)})`
  };
};

/**
 * Combine votes using weighted voting
 */
export const ensembleVoting = (
  protocols: Array<{
    id: string;
    name: string;
    alpha: number;
    beta: number;
    trials: number;
  }>,
  totalTrials: number,
  weights: EnsembleWeights = { thompson: 0.4, ucb: 0.3, epsilonGreedy: 0.15, softmax: 0.15 }
): {
  selectedProtocolId: string;
  selectedProtocolName: string;
  votes: AlgorithmVote[];
  consensusScore: number;
  explanation: string;
} => {
  const votes: AlgorithmVote[] = [
    thompsonVote(protocols),
    ucbVote(protocols, totalTrials),
    epsilonGreedyVote(protocols, totalTrials),
    softmaxVote(protocols, totalTrials)
  ];
  
  const voteCounts: Record<string, number> = {};
  
  votes.forEach(vote => {
    const weight = weights[vote.algorithm];
    const weightedConfidence = weight * vote.confidence;
    
    voteCounts[vote.protocolId] = (voteCounts[vote.protocolId] || 0) + weightedConfidence;
  });
  
  // Find winner
  const winner = Object.entries(voteCounts)
    .sort((a, b) => b[1] - a[1])[0];
  
  const selectedProtocolId = winner[0];
  const selectedProtocol = protocols.find(p => p.id === selectedProtocolId)!;
  
  const agreementCount = votes.filter(v => v.protocolId === selectedProtocolId).length;
  const consensusScore = agreementCount / votes.length;
  
  const winningVotes = votes.filter(v => v.protocolId === selectedProtocolId);
  const explanation = `${agreementCount}/${votes.length} algorithms agree. ` +
    winningVotes.map(v => `${v.algorithm}: ${v.reasoning}`).join('; ');
  
  return {
    selectedProtocolId,
    selectedProtocolName: selectedProtocol.name,
    votes,
    consensusScore,
    explanation
  };
};

/**
 * Adaptive weights: adjust based on recent performance
 */
export const adaptEnsembleWeights = (
  currentWeights: EnsembleWeights,
  recentPerformance: Record<EnsembleAlgorithm, number[]>
): EnsembleWeights => {
  const algorithms: EnsembleAlgorithm[] = ['thompson', 'ucb', 'epsilonGreedy', 'softmax'];
  
  const recentAverages = algorithms.map(alg => {
    const perf = recentPerformance[alg] || [];
    if (perf.length === 0) return { alg, avg: 0.5 };
    
    const avg = perf.reduce((sum, val) => sum + val, 0) / perf.length;
    return { alg, avg };
  });
  
  // Softmax reweighting based on performance
  const temperature = 0.5;
  const expScores = recentAverages.map(ra => Math.exp(ra.avg / temperature));
  const sumExp = expScores.reduce((sum, val) => sum + val, 0);
  
  const newWeights: EnsembleWeights = {
    thompson: expScores[0] / sumExp,
    ucb: expScores[1] / sumExp,
    epsilonGreedy: expScores[2] / sumExp,
    softmax: expScores[3] / sumExp
  };
  
  // Smooth transition (80% old, 20% new)
  return {
    thompson: currentWeights.thompson * 0.8 + newWeights.thompson * 0.2,
    ucb: currentWeights.ucb * 0.8 + newWeights.ucb * 0.2,
    epsilonGreedy: currentWeights.epsilonGreedy * 0.8 + newWeights.epsilonGreedy * 0.2,
    softmax: currentWeights.softmax * 0.8 + newWeights.softmax * 0.2
  };
};

/**
 * Get ensemble performance metrics
 */
export const getEnsembleMetrics = (
  votes: AlgorithmVote[]
): {
  diversity: number;
  averageConfidence: number;
  mostConfidentAlgorithm: EnsembleAlgorithm;
} => {
  const uniqueProtocols = new Set(votes.map(v => v.protocolId)).size;
  const diversity = uniqueProtocols / votes.length;
  
  const avgConfidence = votes.reduce((sum, v) => sum + v.confidence, 0) / votes.length;
  
  const sorted = [...votes].sort((a, b) => b.confidence - a.confidence);
  const mostConfident = sorted[0].algorithm;
  
  return {
    diversity,
    averageConfidence: avgConfidence,
    mostConfidentAlgorithm: mostConfident
  };
};
