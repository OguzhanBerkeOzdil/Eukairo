export const sampleBeta = (alpha: number, beta: number): number => {
  const gammaAlpha = sampleGamma(alpha);
  const gammaBeta = sampleGamma(beta);
  return gammaAlpha / (gammaAlpha + gammaBeta);
};

const sampleGamma = (shape: number): number => {
  if (shape < 1) {
    return sampleGamma(shape + 1) * Math.pow(Math.random(), 1 / shape);
  }
  
  const d = shape - 1/3;
  const c = 1 / Math.sqrt(9 * d);
  
  while (true) {
    let x: number;
    let v: number;
    
    do {
      x = randomNormal(0, 1);
      v = 1 + c * x;
    } while (v <= 0);
    
    v = v * v * v;
    const u = Math.random();
    
    if (u < 1 - 0.0331 * x * x * x * x) {
      return d * v;
    }
    
    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) {
      return d * v;
    }
  }
};

const randomNormal = (mean: number, stdDev: number): number => {
  const u1 = Math.random();
  const u2 = Math.random();
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return z0 * stdDev + mean;
};

export const deltaToReward = (delta: -1 | 0 | 1): number => {
  if (delta === 1) return 1.0;
  if (delta === 0) return 0.5;
  return 0.0;
};

export const updateBetaParams = (
  currentAlpha: number,
  currentBeta: number,
  reward: number
): { alpha: number; beta: number } => {
  // reward is in [0, 1]
  // Update: α += reward, β += (1 - reward)
  return {
    alpha: currentAlpha + reward,
    beta: currentBeta + (1 - reward)
  };
};

/**
 * Calculate expected value (mean) of Beta distribution
 */
export const betaMean = (alpha: number, beta: number): number => {
  return alpha / (alpha + beta);
};


export const betaVariance = (alpha: number, beta: number): number => {
  const sum = alpha + beta;
  return (alpha * beta) / (sum * sum * (sum + 1));
};

export const betaCredibleInterval = (alpha: number, beta: number): [number, number] => {
  const mean = betaMean(alpha, beta);
  const variance = betaVariance(alpha, beta);
  const stdDev = Math.sqrt(variance);
  
  return [
    Math.max(0, mean - 1.96 * stdDev),
    Math.min(1, mean + 1.96 * stdDev)
  ];
};
