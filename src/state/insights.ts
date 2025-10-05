/**
 * Advanced Insights Module
 * Provides analytics using Thompson Sampling and Contextual Bandits data
 */

import type { AppData, ProtocolModel } from '../types';
import { betaMean, betaCredibleInterval, betaVariance } from './thompson-sampling';
import { getBestHourForProtocol } from './contextual-bandits';

export interface ProtocolInsight {
  protocolId: string;
  protocolName: string;
  trials: number;
  performance: number; // 0-1 scale
  confidence: number; // 0-1 scale (inverse of uncertainty)
  credibleInterval: [number, number];
  bestHour: number | null;
  trend: 'improving' | 'stable' | 'declining';
  recommendation: string;
}

export interface AlgorithmMetrics {
  totalSessions: number;
  uniqueProtocols: number;
  explorationRate: number; // % of recent sessions that explored
  driftDetections: number; // Number of times drift was detected
  averageConfidence: number; // Overall confidence in recommendations
  convergenceStatus: 'exploring' | 'converging' | 'converged';
}

/**
 * Get detailed insights for all protocols
 */
export const getProtocolInsights = (data: AppData, protocolNames: Record<string, string>): ProtocolInsight[] => {
  const insights: ProtocolInsight[] = [];
  
  Object.entries(data.models).forEach(([protocolId, model]) => {
    if (model.trials === 0) return;
    
    const alpha = model.alphaParam || 1;
    const beta = model.betaParam || 1;
    
    const performance = betaMean(alpha, beta);
    const variance = betaVariance(alpha, beta);
    const confidence = 1 - Math.sqrt(variance); // Lower variance = higher confidence
    const [lowerBound, upperBound] = betaCredibleInterval(alpha, beta);
    
    const bestHour = getBestHourForProtocol(model);
    
    // Determine trend based on recent vs overall performance
    const trend = determineTrend(model);
    
    // Generate recommendation
    const recommendation = generateRecommendation(model, performance, confidence);
    
    insights.push({
      protocolId,
      protocolName: protocolNames[protocolId] || protocolId,
      trials: model.trials,
      performance,
      confidence,
      credibleInterval: [lowerBound, upperBound],
      bestHour,
      trend,
      recommendation
    });
  });
  
  // Sort by performance (descending)
  return insights.sort((a, b) => b.performance - a.performance);
};

/**
 * Determine if protocol performance is improving, stable, or declining
 */
const determineTrend = (model: ProtocolModel): 'improving' | 'stable' | 'declining' => {
  if (!model.emaAvg || !model.avg) return 'stable';
  
  // EMA (recent) vs simple average (overall)
  const difference = model.emaAvg - model.avg;
  
  if (difference > 0.2) return 'improving';
  if (difference < -0.2) return 'declining';
  return 'stable';
};

/**
 * Generate actionable recommendation based on model state
 */
const generateRecommendation = (
  model: ProtocolModel,
  performance: number,
  confidence: number
): string => {
  // High performance + high confidence
  if (performance > 0.7 && confidence > 0.8) {
    return '⭐ Excellent protocol - use frequently';
  }
  
  // High performance + low confidence
  if (performance > 0.6 && confidence < 0.6) {
    return '🔍 Promising - needs more data';
  }
  
  // Low performance + high confidence
  if (performance < 0.4 && confidence > 0.7) {
    return '❌ Avoid - consistently underperforms';
  }
  
  // Low performance + low confidence
  if (performance < 0.5 && confidence < 0.6) {
    return '❓ Uncertain - try a few more times';
  }
  
  // Check for drift
  if (model.recentVariance && model.recentVariance > 0.3) {
    return '⚡ Unstable - preferences may be changing';
  }
  
  // Medium performance
  if (performance >= 0.5 && performance <= 0.6) {
    return '✅ Good option - works well';
  }
  
  return '📊 Needs more data';
};

/**
 * Get overall algorithm performance metrics
 */
export const getAlgorithmMetrics = (data: AppData): AlgorithmMetrics => {
  const totalSessions = data.history.length;
  const uniqueProtocols = Object.keys(data.models).length;
  
  // Calculate exploration rate (last 20 sessions)
  const recentSessions = data.history.slice(-20);
  const protocolCounts = new Map<string, number>();
  recentSessions.forEach(s => {
    protocolCounts.set(s.protocolId, (protocolCounts.get(s.protocolId) || 0) + 1);
  });
  const uniqueRecent = protocolCounts.size;
  const explorationRate = recentSessions.length > 0 ? uniqueRecent / Math.min(recentSessions.length, uniqueProtocols) : 0;
  
  // Count drift detections
  const driftDetections = Object.values(data.models).filter(m => m.lastResetTimestamp).length;
  
  // Calculate average confidence
  let totalConfidence = 0;
  let countWithData = 0;
  Object.values(data.models).forEach(model => {
    if (model.trials > 0) {
      const variance = betaVariance(model.alphaParam || 1, model.betaParam || 1);
      totalConfidence += (1 - Math.sqrt(variance));
      countWithData++;
    }
  });
  const averageConfidence = countWithData > 0 ? totalConfidence / countWithData : 0;
  
  // Determine convergence status
  let convergenceStatus: 'exploring' | 'converging' | 'converged';
  if (totalSessions < 10) {
    convergenceStatus = 'exploring';
  } else if (averageConfidence > 0.8) {
    convergenceStatus = 'converged';
  } else {
    convergenceStatus = 'converging';
  }
  
  return {
    totalSessions,
    uniqueProtocols,
    explorationRate,
    driftDetections,
    averageConfidence,
    convergenceStatus
  };
};

/**
 * Get top N recommended protocols based on current understanding
 */
export const getTopRecommendations = (
  data: AppData,
  protocolNames: Record<string, string>,
  n: number = 3
): ProtocolInsight[] => {
  const insights = getProtocolInsights(data, protocolNames);
  
  // Filter to only protocols with enough data
  const qualified = insights.filter(i => i.trials >= 3);
  
  // Sort by performance * confidence (reward certainty)
  qualified.sort((a, b) => {
    const scoreA = a.performance * a.confidence;
    const scoreB = b.performance * b.confidence;
    return scoreB - scoreA;
  });
  
  return qualified.slice(0, n);
};

/**
 * Get contextual recommendations for current time
 */
export const getContextualRecommendations = (
  data: AppData,
  protocolNames: Record<string, string>,
  currentHour: number
): ProtocolInsight[] => {
  const insights = getProtocolInsights(data, protocolNames);
  
  // Filter and score by hour-specific performance
  const contextualScores = insights
    .filter(i => i.trials >= 3)
    .map(insight => {
      const model = data.models[insight.protocolId];
      let hourlyScore = 0;
      
      if (model.hourlyModels && model.hourlyModels[currentHour]) {
        const hourlyModel = model.hourlyModels[currentHour];
        if (hourlyModel.trials >= 2) {
          hourlyScore = betaMean(hourlyModel.alpha, hourlyModel.beta);
        }
      }
      
      // If no hourly data, use global performance
      const score = hourlyScore > 0 ? hourlyScore : insight.performance;
      
      return {
        ...insight,
        contextualScore: score
      };
    })
    .sort((a, b) => b.contextualScore - a.contextualScore);
  
  return contextualScores.slice(0, 3);
};

/**
 * Generate human-readable performance summary
 */
export const generatePerformanceSummary = (data: AppData): string => {
  const metrics = getAlgorithmMetrics(data);
  
  let summary = `📊 Algorithm Performance Summary\n\n`;
  summary += `Total Sessions: ${metrics.totalSessions}\n`;
  summary += `Protocols Tested: ${metrics.uniqueProtocols}\n`;
  summary += `Confidence Level: ${(metrics.averageConfidence * 100).toFixed(1)}%\n`;
  summary += `Status: ${metrics.convergenceStatus.toUpperCase()}\n`;
  
  if (metrics.driftDetections > 0) {
    summary += `\n⚡ Drift Detected: ${metrics.driftDetections} protocol(s) reset due to preference changes\n`;
  }
  
  summary += `\nExploration Rate: ${(metrics.explorationRate * 100).toFixed(1)}% `;
  if (metrics.explorationRate > 0.5) {
    summary += `(Still exploring) 🔍`;
  } else if (metrics.explorationRate > 0.2) {
    summary += `(Balanced) ⚖️`;
  } else {
    summary += `(Mostly exploiting) 🎯`;
  }
  
  return summary;
};
