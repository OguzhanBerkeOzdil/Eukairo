import type { ProtocolId, Goal, ProtocolModel, SessionRecord, AppData } from '../src/types';
import { betaMean, sampleBeta } from '../src/state/thompson-sampling';
import { ensembleVoting, type EnsembleWeights } from '../src/state/ensemble-methods';
import { shouldResetDueToDrift } from '../src/state/drift-detection';
import { getExplorationRecommendation } from '../src/state/confidence-based-exploration';

interface UserProfile {
  name: string;
  trueScores: Record<ProtocolId, number>;
  hourlyMultiplier?: (hour: number) => number;
  dayOfWeekMultiplier?: (day: number) => number;
  noise: number;
}

const MIN_TRIALS_FOR_THOMPSON = 2;
const EXPLORATION_BONUS = 0.05;
const CLOSE_COMPETITION_THRESHOLD = 0.05;

class AlgorithmSimulator {
  private data: AppData;

  constructor() {
    this.data = {
      history: [],
      models: {},
      streak: 0
    };

    // Initialize all protocols with proper Bayesian priors
    const protocols: ProtocolId[] = [
      'physiological-sigh',
      'box-breathing',
      'eye-break',
      '4-7-8-breathing',
      'alternate-nostril'
    ];

    protocols.forEach(id => {
      this.data.models[id] = {
        trials: 0,
        avg: 0,
        emaAvg: 0,
        alphaParam: 1.5, // Bayesian Beta prior
        betaParam: 1.0,
        medDuration: 120,
        hourlyModels: {}, // Initialize contextual models
        recentVariance: 0,
        lastResetTimestamp: Date.now(),
        windowScores: []
      };
    });
  }

  selectProtocol(_goal: Goal, hour: number, _dayOfWeek: number): { protocolId: ProtocolId, duration: number } {
    const candidates: ProtocolId[] = [
      'physiological-sigh',
      'box-breathing',
      'eye-break',
      '4-7-8-breathing',
      'alternate-nostril'
    ];

    // PHASE 1: Handle untried protocols (pure exploration)
    const untried = candidates.filter(p => {
      const model = this.data.models[p];
      return !model || model.trials === 0;
    });

    if (untried.length > 0) {
      const protocolId = untried[Math.floor(Math.random() * untried.length)];
      return { protocolId, duration: this.data.models[protocolId].medDuration || 120 };
    }

    // PHASE 1.5: Ensure minimum trials for all protocols before heavy exploitation
    // This prevents premature convergence and ensures contextual models can form
    const undertried = candidates.filter(p => {
      const model = this.data.models[p];
      
      // Skip protocols that are consistently harmful (EMA < -0.3)
      // Lowered threshold from -0.5 to stop bad protocols faster
      if (model && model.emaAvg !== undefined && model.emaAvg < -0.3) {
        return false;
      }
      
      return model && model.trials < MIN_TRIALS_FOR_THOMPSON;
    });

    if (undertried.length > 0) {
      const protocolId = undertried[Math.floor(Math.random() * undertried.length)];
      return { protocolId, duration: this.data.models[protocolId].medDuration || 120 };
    }

    // PHASE 1.75: Hourly Exploration - DISABLED (only needed for contextual Thompson Sampling)
    // Contextual learning is not currently implemented in production algorithm
    
    // PHASE 2: Drift detection and reset
    for (const protocolId of candidates) {
      const model = this.data.models[protocolId];

      if (model && model.recentVariance !== undefined && model.lastResetTimestamp !== undefined) {
        if (shouldResetDueToDrift(model.recentVariance, model.lastResetTimestamp)) {
          // Complete model reset (matching production code)
          this.data.models[protocolId] = {
            trials: 0,
            avg: 0,
            emaAvg: 0,
            alphaParam: 1.5,
            betaParam: 1.0,
            medDuration: 120,
            hourlyModels: {},
            recentVariance: 0,
            lastResetTimestamp: Date.now(),
            windowScores: []
          };
        }
      }
    }

    // PHASE 3: Analyze ALL protocols for scenario detection (don't filter by MIN_TRIALS yet)
    const allProtocolStats = candidates
      .map(p => {
        const model = this.data.models[p];
        if (!model || model.trials === 0) return null;

        const alpha = model.alphaParam || 1.5;
        const beta = model.betaParam || 1.0;
        const mean = betaMean(alpha, beta);

        return {
          protocolId: p,
          model,
          mean,
          trials: model.trials
        };
      })
      .filter((s): s is NonNullable<typeof s> => s !== null)
      .sort((a, b) => b.mean - a.mean);

    // PHASE 4: Check for close competition on ALL protocols (not just those ready for Thompson)
    const isCloseCompetition =
      allProtocolStats.length >= 2 &&
      allProtocolStats[0].trials >= 20 &&
      allProtocolStats[1].trials >= 20 &&
      (allProtocolStats[0].mean - allProtocolStats[1].mean) < CLOSE_COMPETITION_THRESHOLD;

    if (isCloseCompetition) {
      // ENSEMBLE VOTING for close competitions
      const protocolsForEnsemble = candidates.map(protocolId => {
        const model = this.data.models[protocolId];
        return {
          id: protocolId,
          name: protocolId,
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
      const selectedProtocolId = ensembleResult.selectedProtocolId as ProtocolId;

      // EVPI check
      const currentBestMean = Math.max(...protocolsForEnsemble.map(p => p.alpha / (p.alpha + p.beta)));
      const evpiRecommendation = getExplorationRecommendation(
        protocolsForEnsemble,
        currentBestMean,
        totalTrials
      );

      if (!evpiRecommendation.shouldExplore) {
        // Flat landscape detected
      }

      const duration = this.data.models[selectedProtocolId].medDuration || 120;
      return { protocolId: selectedProtocolId, duration };

    } else {
      // THOMPSON + CONTEXTUAL for standard cases
      let bestProtocol: ProtocolId = candidates[0];
      let bestScore = -Infinity;

      for (const protocolId of candidates) {
        const model = this.data.models[protocolId];

        if (!model || model.trials < MIN_TRIALS_FOR_THOMPSON) {
          // Not enough data, give exploration bonus
          const randomScore = Math.random() + EXPLORATION_BONUS;
          if (randomScore > bestScore) {
            bestScore = randomScore;
            bestProtocol = protocolId;
          }
          continue;
        }

        // Thompson Sampling: Sample from Beta distribution
        const alpha = model.alphaParam || 1;
        const beta = model.betaParam || 1;
        const sampledValue = sampleBeta(alpha, beta);

        // Uncertainty bonus
        const variance = (alpha * beta) / ((alpha + beta) ** 2 * (alpha + beta + 1));
        const uncertaintyBonus = Math.sqrt(variance) * EXPLORATION_BONUS;

        const finalScore = sampledValue + uncertaintyBonus;

        if (finalScore > bestScore) {
          bestScore = finalScore;
          bestProtocol = protocolId;
        }
      }

      // EVPI check
      const protocolsForEVPI = candidates.map(p => {
        const model = this.data.models[p] || { alphaParam: 1, betaParam: 1, trials: 0, avg: 0 };
        return {
          id: p,
          name: p,
          alpha: model.alphaParam || 1,
          beta: model.betaParam || 1,
          trials: model.trials
        };
      });

      const totalTrials = Object.values(this.data.models).reduce((sum, m) => sum + m.trials, 0);
      const currentBestMean = Math.max(...protocolsForEVPI.map(p => p.alpha / (p.alpha + p.beta)));
      const evpiRecommendation = getExplorationRecommendation(
        protocolsForEVPI,
        currentBestMean,
        totalTrials
      );

      if (!evpiRecommendation.shouldExplore) {
        // Flat landscape detected
      }

      const duration = this.data.models[bestProtocol].medDuration || 120;
      return { protocolId: bestProtocol, duration };
    }
  }

  recordSession(protocolId: ProtocolId, duration: number, rating: -1 | 0 | 1, timestamp: Date, goal: Goal = 'focus') {
    const delta = rating;
    const model = this.data.models[protocolId];

    // Update trials
    model.trials++;
    
    // Calculate running average
    const prevSum = model.avg * (model.trials - 1);
    const newSum = prevSum + delta;
    model.avg = newSum / model.trials;

    // Update EMA (α = 0.2 for recency weighting)
    const emaAlpha = 0.2;
    if (model.trials === 1) {
      model.emaAvg = delta;
    } else {
      model.emaAvg = (model.emaAvg || model.avg) * (1 - emaAlpha) + delta * emaAlpha;
    }

    // Update Bayesian Beta parameters for Thompson Sampling
    if (rating === 1) {
      model.alphaParam = (model.alphaParam || 1.5) + 1.0; // Success
    } else if (rating === -1) {
      model.betaParam = (model.betaParam || 1.0) + 1.0; // Failure
    }
    // Note: Neutral ratings (0) don't update Beta params

    // Initialize hourly models structure (REQUIRED by ProtocolModel interface)
    // But don't use for sampling - just track for storage compatibility
    const hour = timestamp.getHours();
    if (!model.hourlyModels) {
      model.hourlyModels = {};
    }
    if (!model.hourlyModels[hour]) {
      model.hourlyModels[hour] = {
        trials: 0,
        alpha: 1,
        beta: 1,
        avg: 0
      };
    }
    
    // Track hourly stats (for future use, not affecting current algorithm)
    const hourlyModel = model.hourlyModels[hour];
    hourlyModel.trials++;
    const prevHourlySum = hourlyModel.avg * (hourlyModel.trials - 1);
    hourlyModel.avg = (prevHourlySum + delta) / hourlyModel.trials;

    // Update window scores for drift detection
    if (!model.windowScores) {
      model.windowScores = [];
    }
    model.windowScores.push(delta);
    if (model.windowScores.length > 20) {
      model.windowScores.shift(); // Keep last 20 scores
    }
    
    // Calculate recent variance for drift detection
    if (model.windowScores.length >= 10) {
      const mean = model.windowScores.reduce((sum, s) => sum + s, 0) / model.windowScores.length;
      const variance = model.windowScores.reduce((sum, s) => sum + (s - mean) ** 2, 0) / model.windowScores.length;
      model.recentVariance = variance;
    }

    // Adaptive MED step
    const recentSessions = this.data.history
      .filter(s => s.protocolId === protocolId)
      .slice(-3);

    let step = 15; // default
    const consecutiveBetter = recentSessions.slice(-2).every(s => s.delta === 1);
    const hadWorse = recentSessions.some(s => s.delta === -1);

    if (consecutiveBetter) step = 10;
    if (hadWorse) step = 20;

    // Update MED
    const currentMed = model.medDuration || 120;
    if (delta === 1) {
      model.medDuration = Math.min(180, currentMed + step);
    } else if (delta === -1) {
      model.medDuration = Math.max(45, currentMed - step);
    }

    // Record session
    this.data.history.push({
      dateISO: timestamp.toISOString(),
      goal,
      protocolId,
      seconds: duration,
      delta
    });

    // Save updated data for next selection
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('eukairo-data', JSON.stringify(this.data));
    }
  }

  getStats() {
    return {
      totalSessions: this.data.history.length,
      models: this.data.models,
      history: this.data.history
    };
  }
}

// Test scenarios
export function runTests() {
  console.log('🧪 EUKAIRO ALGORITHM TEST SUITE\n');
  console.log('='.repeat(80));

  // Test 1: User with clear best protocol
  console.log('\n📊 TEST 1: Clear Winner Scenario');
  console.log('User has one protocol significantly better than others\n');
  
  const clearWinnerProfile: UserProfile = {
    name: 'Clear Winner',
    trueScores: {
      'box-breathing': 0.8,
      'physiological-sigh': 0.2,
      '4-7-8-breathing': 0.1,
      'eye-break': -0.2,
      'alternate-nostril': 0.1
    },
    noise: 0.2
  };

  const test1Results = simulateUser(clearWinnerProfile, 200);
  analyzeResults('TEST 1', test1Results, clearWinnerProfile);

  // Test 2: Two similar protocols
  console.log('\n' + '='.repeat(80));
  console.log('\n📊 TEST 2: Close Competition');
  console.log('Two protocols nearly equal, algorithm must discriminate\n');

  const closeCompetitionProfile: UserProfile = {
    name: 'Close Competition',
    trueScores: {
      'box-breathing': 0.6,
      'physiological-sigh': 0.58,
      '4-7-8-breathing': 0.1,
      'eye-break': -0.1,
      'alternate-nostril': 0.15
    },
    noise: 0.15
  };

  const test2Results = simulateUser(closeCompetitionProfile, 200);
  analyzeResults('TEST 2', test2Results, closeCompetitionProfile);

  // Test 3: Time-dependent user
  console.log('\n' + '='.repeat(80));
  console.log('\n📊 TEST 3: Time-of-Day Variation');
  console.log('User effectiveness varies by hour (morning vs evening)\n');

  const timeDependentProfile: UserProfile = {
    name: 'Time Dependent',
    trueScores: {
      'box-breathing': 0.5,        // Base 0.5, becomes 0.65 at 8am with +0.15 boost
      '4-7-8-breathing': 0.6,      // Base 0.6, becomes 0.75 at 8pm with +0.15 boost
      'physiological-sigh': -0.5,  // Very negative - will be skipped by early stopping
      'eye-break': -0.5,           // Very negative - will be skipped by early stopping  
      'alternate-nostril': -0.5    // Very negative - will be skipped by early stopping
    },
    hourlyMultiplier: (hour) => {
      // NOTE: Protocol-specific boosts are handled in the simulation loop (lines 598-606)
      // Morning: Box +0.15, Evening: 4-7-8 +0.15
      return 1.0; // Neutral multiplier (not used for Test 3)
    },
    noise: 0.2
  };

  const test3Results = simulateUser(timeDependentProfile, 400, { varyTime: 'alternating' }); // Extended to 400 for better contextual learning (200 at 8am, 200 at 8pm)
  // For Test 3, "best" varies by time: Morning (8am) = Box (0.65), Evening (8pm) = 4-7-8 (0.75)
  // So we measure if algorithm picked contextually-best protocol
  analyzeResults('TEST 3', test3Results, timeDependentProfile, { contextual: true, morningBest: 'box-breathing', eveningBest: '4-7-8-breathing' });

  // Test 4: Noisy user (high variability)
  console.log('\n' + '='.repeat(80));
  console.log('\n📊 TEST 4: High Noise User');
  console.log('User gives inconsistent ratings (high variability)\n');

  const noisyProfile: UserProfile = {
    name: 'Noisy User',
    trueScores: {
      'box-breathing': 0.4,
      'physiological-sigh': 0.3,
      '4-7-8-breathing': 0.35,
      'eye-break': 0.2,
      'alternate-nostril': 0.28
    },
    noise: 0.6 // Very noisy!
  };

  const test4Results = simulateUser(noisyProfile, 200);
  analyzeResults('TEST 4', test4Results, noisyProfile);

  // Test 5: Changing preferences over time
  console.log('\n' + '='.repeat(80));
  console.log('\n📊 TEST 5: Drift Detection');
  console.log('User preferences change halfway through (test EMA adaptation)\n');

  const driftProfile: UserProfile = {
    name: 'Drift User',
    trueScores: {
      'box-breathing': 0.7, // Will flip to -0.2 at session 100
      'physiological-sigh': 0.2, // Will flip to 0.7 at session 100
      '4-7-8-breathing': 0.1,
      'eye-break': 0.0,
      'alternate-nostril': 0.12
    },
    noise: 0.2
  };

  const test5Results = simulateUserWithDrift(driftProfile, 200);
  analyzeResults('TEST 5', test5Results, driftProfile);

  // Test 6: All protocols similar (no clear winner)
  console.log('\n' + '='.repeat(80));
  console.log('\n📊 TEST 6: Flat Landscape');
  console.log('All protocols similar effectiveness (hard to optimize)\n');

  const flatProfile: UserProfile = {
    name: 'Flat User',
    trueScores: {
      'box-breathing': 0.3,
      'physiological-sigh': 0.28,
      '4-7-8-breathing': 0.32,
      'eye-break': 0.29,
      'alternate-nostril': 0.33
    },
    noise: 0.25
  };

  const test6Results = simulateUser(flatProfile, 200);
  analyzeResults('TEST 6', test6Results, flatProfile);

  // Generate summary report
  console.log('\n' + '='.repeat(80));
  console.log('\n📋 SUMMARY & RECOMMENDATIONS\n');
  generateRecommendations([test1Results, test2Results, test3Results, test4Results, test5Results, test6Results]);
}

function simulateUser(
  profile: UserProfile,
  numSessions: number,
  options: { varyTime?: boolean | 'alternating' } = {}
): TestResult {
  const sim = new AlgorithmSimulator();
  const selections: Partial<Record<ProtocolId, number>> = {};
  const rewards: number[] = [];
  const regrets: number[] = [];

  // Find best protocol
  const bestProtocolId = Object.entries(profile.trueScores)
    .sort(([, a], [, b]) => b - a)[0][0] as ProtocolId;
  const bestScore = profile.trueScores[bestProtocolId];

  for (let i = 0; i < numSessions; i++) {
    // Vary time based on option
    let hour: number;
    if (options.varyTime === 'alternating') {
      // Alternate between morning (8am) and evening (20:00 = 8pm)
      hour = i % 2 === 0 ? 8 : 20;
    } else if (options.varyTime) {
      // Random hours (old behavior - not ideal for contextual learning)
      hour = Math.floor(Math.random() * 24);
    } else {
      // Fixed afternoon time
      hour = 14;
    }
    
    const dayOfWeek = Math.floor(Math.random() * 7);
    const timestamp = new Date(2025, 0, 1 + Math.floor(i / 3), hour, 0);

    // Algorithm selects protocol
    const { protocolId, duration } = sim.selectProtocol('focus', hour, dayOfWeek);

    // Track selections
    selections[protocolId] = (selections[protocolId] || 0) + 1;

    // Simulate user rating based on true score + TIME-SPECIFIC variations
    let trueScore = profile.trueScores[protocolId];
    
    // Apply protocol-specific hourly variations for Test 3
    // Morning (8am): Box Breathing works better (+0.15)
    // Evening (20:00): 4-7-8 Breathing works better (+0.15)
    if (profile.hourlyMultiplier && profile.name === 'Time Dependent') {
      if (hour >= 6 && hour <= 12 && protocolId === 'box-breathing') {
        trueScore += 0.15; // Morning boost for Box (0.5 + 0.15 = 0.65)
      } else if (hour >= 19 && hour <= 23 && protocolId === '4-7-8-breathing') {
        trueScore += 0.15; // Evening boost for 4-7-8 (0.6 + 0.15 = 0.75)
      }
    }

    // Add noise
    const noisyScore = trueScore + (Math.random() - 0.5) * profile.noise * 2;

    // Convert to rating (-1, 0, 1)
    let rating: -1 | 0 | 1;
    if (noisyScore > 0.3) rating = 1;
    else if (noisyScore < -0.1) rating = -1;
    else rating = 0;

    // Record session
    sim.recordSession(protocolId, duration, rating, timestamp);

    // Track cumulative reward and regret
    rewards.push(trueScore);
    const regret = bestScore - trueScore;
    regrets.push(regret);
  }

  return {
    profile,
    selections,
    rewards,
    regrets,
    stats: sim.getStats(),
    bestProtocolId
  };
}

function simulateUserWithDrift(profile: UserProfile, numSessions: number): TestResult {
  const sim = new AlgorithmSimulator();
  const selections: Partial<Record<ProtocolId, number>> = {};
  const rewards: number[] = [];
  const regrets: number[] = [];

  // Clone profile to modify
  const currentScores = { ...profile.trueScores };

  for (let i = 0; i < numSessions; i++) {
    // At session 100, flip box-breathing and physiological-sigh
    if (i === 100) {
      currentScores['box-breathing'] = -0.2;
      currentScores['physiological-sigh'] = 0.7;
      console.log(`   🔄 [Session ${i}] Preferences changed! Box: 0.7 → -0.2, Physio Sigh: 0.2 → 0.7`);
    }

    const hour = 14;
    const dayOfWeek = Math.floor(i / 3) % 7;
    const timestamp = new Date(2025, 0, 1 + Math.floor(i / 3), hour, 0);

    const { protocolId, duration } = sim.selectProtocol('focus', hour, dayOfWeek);
    selections[protocolId] = (selections[protocolId] || 0) + 1;

    const trueScore = currentScores[protocolId];
    const noisyScore = trueScore + (Math.random() - 0.5) * profile.noise * 2;

    let rating: -1 | 0 | 1;
    if (noisyScore > 0.3) rating = 1;
    else if (noisyScore < -0.1) rating = -1;
    else rating = 0;

    sim.recordSession(protocolId, duration, rating, timestamp);
    rewards.push(trueScore);

    // Find current best
    const currentBestScore = Math.max(...Object.values(currentScores));
    regrets.push(currentBestScore - trueScore);
  }

  // For drift scenario, the "best" changes at session 100
  // Before: box-breathing (0.7), After: physiological-sigh (0.7)
  // We should measure convergence in the LAST 50 sessions (after drift stabilizes)
  return {
    profile,
    selections,
    rewards,
    regrets,
    stats: sim.getStats(),
    bestProtocolId: 'physiological-sigh' as ProtocolId // Post-drift best (what matters for last 50 sessions)
  };
}

interface TestResult {
  profile: UserProfile;
  selections: Partial<Record<ProtocolId, number>>;
  rewards: number[];
  regrets: number[];
  stats: {
    totalSessions: number;
    models: Record<string, ProtocolModel>;
    history: SessionRecord[];
  };
  bestProtocolId: ProtocolId;
}

function analyzeResults(
  testName: string, 
  result: TestResult, 
  profile: UserProfile,
  options?: { contextual?: boolean; morningBest?: ProtocolId; eveningBest?: ProtocolId }
) {
  const { selections, rewards, regrets, stats, bestProtocolId } = result;

  console.log(`📈 Results for ${profile.name}:\n`);

  // Protocol selection distribution
  console.log('Protocol Selection Distribution:');
  const sortedSelections = Object.entries(selections)
    .sort(([, a], [, b]) => b - a);

  sortedSelections.forEach(([protocolId, count]) => {
    const percentage = ((count / stats.totalSessions) * 100).toFixed(1);
    const trueScore = profile.trueScores[protocolId as ProtocolId];
    const isBest = protocolId === bestProtocolId;
    const bar = '█'.repeat(Math.floor(count / 5));
    const marker = isBest ? '⭐' : '  ';
    console.log(`  ${marker} ${protocolId.padEnd(25)} ${bar} ${count.toString().padStart(3)} (${percentage}%) [True: ${trueScore.toFixed(2)}]`);
  });

  // Learned models
  console.log('\nLearned Model Scores (EMA):');
  const sortedModels = Object.entries(stats.models)
    .map(([id, model]) => ({
      id: id as ProtocolId,
      emaAvg: model.emaAvg || 0,
      avg: model.avg,
      trials: model.trials,
      trueScore: profile.trueScores[id as ProtocolId]
    }))
    .sort((a, b) => b.emaAvg - a.emaAvg);

  sortedModels.forEach(({ id, emaAvg, avg, trials, trueScore }) => {
    const error = Math.abs(emaAvg - trueScore);
    const accuracy = error < 0.2 ? '✓' : error < 0.4 ? '~' : '✗';
    console.log(`  ${accuracy} ${id.padEnd(25)} EMA: ${emaAvg.toFixed(3)} | Avg: ${avg.toFixed(3)} | True: ${trueScore.toFixed(3)} | Trials: ${trials}`);
  });

  // Performance metrics
  const totalReward = rewards.reduce((sum, r) => sum + r, 0);
  const avgReward = totalReward / rewards.length;
  const totalRegret = regrets.reduce((sum, r) => sum + r, 0);
  const avgRegret = totalRegret / regrets.length;

  // Convergence speed (when did it find best protocol?)
  const firstBestSelection = stats.history.findIndex((s) => s.protocolId === bestProtocolId);
  
  // For contextual test (Test 3), measure contextually-correct selections
  let last50Sessions = stats.history.slice(-50);
  let bestInLast50: number;
  
  if (options?.contextual && options.morningBest && options.eveningBest) {
    // Count sessions where algorithm picked contextually-best protocol
    bestInLast50 = last50Sessions.filter((s, i) => {
      const sessionIndex = stats.history.length - 50 + i;
      const isMorning = sessionIndex % 2 === 0; // Alternating pattern
      return isMorning ? s.protocolId === options.morningBest : s.protocolId === options.eveningBest;
    }).length;
    console.log(`\n💡 Contextual Learning: Algorithm should pick ${options.morningBest} in morning, ${options.eveningBest} in evening`);
  } else {
    // Standard: count sessions on globally-best protocol
    bestInLast50 = last50Sessions.filter((s) => s.protocolId === bestProtocolId).length;
  }
  
  const convergenceRate = (bestInLast50 / 50) * 100;

  console.log('\nPerformance Metrics:');
  console.log(`  Total Reward:        ${totalReward.toFixed(2)}`);
  console.log(`  Average Reward:      ${avgReward.toFixed(3)}`);
  console.log(`  Total Regret:        ${totalRegret.toFixed(2)}`);
  console.log(`  Average Regret:      ${avgRegret.toFixed(3)}`);
  console.log(`  First Best Found:    Session ${firstBestSelection + 1}`);
  console.log(`  Convergence Rate:    ${convergenceRate.toFixed(1)}% (last 50 sessions on best)`);

  // Detect flat landscape (all protocols within 0.10)
  const scores = Object.values(profile.trueScores);
  const maxScore = Math.max(...scores);
  const minScore = Math.min(...scores);
  const scoreRange = maxScore - minScore;
  const isFlatLandscape = scoreRange < 0.10;

  // Grade the algorithm
  let grade = 'F';
  
  if (isFlatLandscape) {
    // For flat landscapes, grade by regret (not convergence)
    // All protocols are similar, so picking any is fine
    if (avgRegret < 0.02) grade = 'A+';
    else if (avgRegret < 0.03) grade = 'A';
    else if (avgRegret < 0.05) grade = 'B';
    else if (avgRegret < 0.08) grade = 'C';
    else if (avgRegret < 0.12) grade = 'D';
    
    console.log(`\n  🎯 Flat Landscape Detected: All protocols within ${(scoreRange * 100).toFixed(1)}% range`);
    console.log(`     Grading by regret (${avgRegret.toFixed(3)}) instead of convergence`);
  } else {
    // Normal grading by convergence + regret
    if (convergenceRate > 80 && avgRegret < 0.1) grade = 'A+';
    else if (convergenceRate > 70 && avgRegret < 0.15) grade = 'A';
    else if (convergenceRate > 60 && avgRegret < 0.2) grade = 'B';
    else if (convergenceRate > 50 && avgRegret < 0.3) grade = 'C';
    else if (convergenceRate > 40) grade = 'D';
  }

  console.log(`\n  📊 Algorithm Grade: ${grade}`);
}

function generateRecommendations(results: TestResult[]) {
  console.log('🔍 Analysis Across All Tests:\n');

  // Calculate average convergence
  const avgConvergence = results.map(r => {
    const last50 = r.stats.history.slice(-50);
    const bestInLast50 = last50.filter((s) => s.protocolId === r.bestProtocolId).length;
    return (bestInLast50 / 50) * 100;
  });

  const overallConvergence = avgConvergence.reduce((sum, c) => sum + c, 0) / avgConvergence.length;

  console.log(`Average Convergence Rate: ${overallConvergence.toFixed(1)}%\n`);

  console.log('💡 RECOMMENDATIONS:\n');

  if (overallConvergence > 70) {
    console.log('✅ STRENGTHS:');
    console.log('   - Algorithm converges well on clear winners');
    console.log('   - EMA helps adapt to changing preferences');
    console.log('   - ε-greedy balances exploration/exploitation\n');
  }

  console.log('🔧 POTENTIAL IMPROVEMENTS:\n');

  console.log('1. **Thompson Sampling**');
  console.log('   - Could improve performance in close competitions');
  console.log('   - Better uncertainty quantification\n');

  console.log('2. **Context-Aware Rewards**');
  console.log('   - Currently basic hour-of-day multiplier');
  console.log('   - Could add day-of-week, stress level, sleep quality\n');

  console.log('3. **Adaptive ε Decay**');
  console.log('   - Current: ε = 0.3 * exp(-sessions/50)');
  console.log('   - Could make decay rate user-specific based on consistency\n');

  console.log('4. **Multi-Armed Bandit Variants**');
  console.log('   - UCB already implemented (exploration bonus)');
  console.log('   - Could try UCB1-Tuned or Bayes-UCB\n');

  console.log('5. **Cold Start Optimization**');
  console.log('   - First 10-20 sessions could use structured exploration');
  console.log('   - E.g., force-try each protocol 2-3 times before UCB kicks in\n');

  console.log('6. **Regret Minimization**');
  console.log('   - Track cumulative regret as success metric');
  console.log('   - Alert user when consistently selecting suboptimal\n');

  console.log('🎯 INNOVATION IDEAS:\n');

  console.log('1. **Protocol Combinations**');
  console.log('   - Test 2-protocol sequences (e.g., Box + Physiological Sigh)');
  console.log('   - Combinatorial optimization challenge\n');

  console.log('2. **Personalized MED Learning Rate**');
  console.log('   - Current: ±10s/15s/20s adaptive step');
  console.log('   - Could learn optimal step size per user\n');

  console.log('3. **Contextual Bandits with Neural Nets**');
  console.log('   - Use lightweight on-device model for context→reward prediction');
  console.log('   - Would require TensorFlow.js or similar\n');

  console.log('4. **A/B Test Against Baselines**');
  console.log('   - Compare against: Random, Round-robin, Pure greedy');
  console.log('   - Quantify improvement over naive strategies\n');

  console.log('5. **Causal Inference**');
  console.log('   - Distinguish correlation from causation');
  console.log('   - E.g., "Is Box better, or just happens at better times?"\n');

  console.log('='.repeat(80));
}

// Export for use in other tests
export { AlgorithmSimulator, UserProfile };
