import React, { useEffect, useState } from 'react';

interface QuickStatsProps {
  totalSessions: number;
  avgEffectiveness: number;
  currentStreak: number;
  totalTimeMinutes: number;
}

const AnimatedNumber: React.FC<{ value: number; decimals?: number; suffix?: string }> = ({ 
  value, 
  decimals = 0, 
  suffix = '' 
}) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 1000; // 1 second animation
    const steps = 30;
    const increment = value / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current += increment;
      if (step >= steps) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(current);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <span>
      {displayValue.toFixed(decimals)}
      {suffix}
    </span>
  );
};

export const QuickStats: React.FC<QuickStatsProps> = ({ 
  totalSessions, 
  avgEffectiveness, 
  currentStreak, 
  totalTimeMinutes 
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-gradient-to-br from-primary/20 to-primary/5 p-4 rounded-lg border border-primary/30">
        <p className="text-xs text-subtext-light dark:text-subtext-dark mb-1">Total Sessions</p>
        <p className="text-3xl font-bold text-text-light dark:text-text-dark">
          <AnimatedNumber value={totalSessions} />
        </p>
      </div>

      <div className="bg-gradient-to-br from-green-500/20 to-green-500/5 p-4 rounded-lg border border-green-500/30">
        <p className="text-xs text-subtext-light dark:text-subtext-dark mb-1">Avg Effectiveness</p>
        <p className="text-3xl font-bold text-text-light dark:text-text-dark">
          {avgEffectiveness >= 0 ? '+' : ''}
          <AnimatedNumber value={avgEffectiveness} decimals={2} />
        </p>
      </div>

      <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 p-4 rounded-lg border border-yellow-500/30">
        <p className="text-xs text-subtext-light dark:text-subtext-dark mb-1">Current Streak</p>
        <p className="text-3xl font-bold text-text-light dark:text-text-dark">
          <AnimatedNumber value={currentStreak} />
          <span className="text-lg ml-1">🔥</span>
        </p>
      </div>

      <div className="bg-gradient-to-br from-blue-500/20 to-blue-500/5 p-4 rounded-lg border border-blue-500/30">
        <p className="text-xs text-subtext-light dark:text-subtext-dark mb-1">Total Time</p>
        <p className="text-3xl font-bold text-text-light dark:text-text-dark">
          <AnimatedNumber value={totalTimeMinutes} />
          <span className="text-lg">m</span>
        </p>
      </div>
    </div>
  );
};
