import React from 'react';
import { getProtocolById } from '../data/protocols';
import type { AppData } from '../types';

interface PersonalRecordsProps {
  data: AppData;
}

export const PersonalRecords: React.FC<PersonalRecordsProps> = ({ data }) => {
  // Calculate best streak
  const calculateBestStreak = () => {
    if (data.history.length === 0) return 0;
    
    const sessionDates = data.history
      .map(s => {
        const date = new Date(s.dateISO);
        date.setHours(0, 0, 0, 0);
        return date.getTime();
      })
      .filter((value, index, self) => self.indexOf(value) === index)
      .sort((a, b) => a - b);
    
    let maxStreak = 1;
    let currentStreak = 1;
    
    for (let i = 1; i < sessionDates.length; i++) {
      if (sessionDates[i] - sessionDates[i - 1] === 24 * 60 * 60 * 1000) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 1;
      }
    }
    
    return maxStreak;
  };

  // Find most productive hour
  const getMostProductiveHour = () => {
    const hourCounts: Record<number, number> = {};
    data.history.forEach(s => {
      const hour = new Date(s.dateISO).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    
    const bestHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0];
    if (!bestHour) return null;
    
    const hour = parseInt(bestHour[0]);
    const count = bestHour[1];
    const timeStr = new Date(0, 0, 0, hour).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      hour12: true 
    });
    
    return { timeStr, count };
  };

  // Find favorite protocol
  const getFavoriteProtocol = () => {
    const protocolCounts: Record<string, number> = {};
    data.history.forEach(s => {
      protocolCounts[s.protocolId] = (protocolCounts[s.protocolId] || 0) + 1;
    });
    
    const favorite = Object.entries(protocolCounts).sort((a, b) => b[1] - a[1])[0];
    if (!favorite) return null;
    
    const protocol = getProtocolById(favorite[0]);
    return { name: protocol?.name || 'Unknown', count: favorite[1] };
  };

  // Find best performing protocol
  const getBestPerformingProtocol = () => {
    const validModels = Object.entries(data.models)
      .filter(([, model]) => model.trials >= 3)
      .sort((a, b) => b[1].avg - a[1].avg);
    
    if (validModels.length === 0) return null;
    
    const [protocolId, model] = validModels[0];
    const protocol = getProtocolById(protocolId);
    
    return { 
      name: protocol?.name || 'Unknown', 
      avg: model.avg.toFixed(2),
      trials: model.trials 
    };
  };

  // Total session time
  const getTotalTime = () => {
    const totalSeconds = data.history.reduce((sum, s) => sum + s.seconds, 0);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return { hours, minutes, totalSeconds };
  };

  const bestStreak = calculateBestStreak();
  const productiveHour = getMostProductiveHour();
  const favorite = getFavoriteProtocol();
  const bestPerforming = getBestPerformingProtocol();
  const totalTime = getTotalTime();

  if (data.history.length === 0) {
    return (
      <div className="text-center py-8 text-subtext-light dark:text-subtext-dark">
        Complete your first session to unlock personal records! 🏆
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Best Streak */}
      <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 p-4 rounded-lg border border-purple-500/20">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🔥</span>
          <div>
            <p className="text-sm text-subtext-light dark:text-subtext-dark">Best Streak</p>
            <p className="text-2xl font-bold text-text-light dark:text-text-dark">
              {bestStreak} {bestStreak === 1 ? 'day' : 'days'}
            </p>
          </div>
        </div>
      </div>

      {/* Total Time */}
      <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 p-4 rounded-lg border border-blue-500/20">
        <div className="flex items-center gap-3">
          <span className="text-3xl">⏱️</span>
          <div>
            <p className="text-sm text-subtext-light dark:text-subtext-dark">Total Practice Time</p>
            <p className="text-2xl font-bold text-text-light dark:text-text-dark">
              {totalTime.hours > 0 ? `${totalTime.hours}h ` : ''}{totalTime.minutes}m
            </p>
          </div>
        </div>
      </div>

      {/* Most Productive Hour */}
      {productiveHour && (
        <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 p-4 rounded-lg border border-yellow-500/20">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🌟</span>
            <div>
              <p className="text-sm text-subtext-light dark:text-subtext-dark">Most Active Hour</p>
              <p className="text-2xl font-bold text-text-light dark:text-text-dark">
                {productiveHour.timeStr}
              </p>
              <p className="text-xs text-subtext-light dark:text-subtext-dark">
                {productiveHour.count} sessions
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Favorite Protocol */}
      {favorite && (
        <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 p-4 rounded-lg border border-green-500/20">
          <div className="flex items-center gap-3">
            <span className="text-3xl">❤️</span>
            <div>
              <p className="text-sm text-subtext-light dark:text-subtext-dark">Favorite Technique</p>
              <p className="text-lg font-bold text-text-light dark:text-text-dark">
                {favorite.name}
              </p>
              <p className="text-xs text-subtext-light dark:text-subtext-dark">
                Used {favorite.count} times
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Best Performing */}
      {bestPerforming && (
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-4 rounded-lg border border-primary/20 md:col-span-2">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🏆</span>
            <div>
              <p className="text-sm text-subtext-light dark:text-subtext-dark">Most Effective Technique</p>
              <p className="text-lg font-bold text-text-light dark:text-text-dark">
                {bestPerforming.name}
              </p>
              <p className="text-xs text-subtext-light dark:text-subtext-dark">
                Average score: {bestPerforming.avg} ({bestPerforming.trials} sessions)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Total Sessions */}
      <div className="bg-gradient-to-br from-pink-500/10 to-pink-600/5 p-4 rounded-lg border border-pink-500/20 md:col-span-2">
        <div className="flex items-center gap-3">
          <span className="text-3xl">📈</span>
          <div className="flex-1">
            <p className="text-sm text-subtext-light dark:text-subtext-dark">Total Sessions Completed</p>
            <p className="text-2xl font-bold text-text-light dark:text-text-dark">
              {data.history.length}
            </p>
            <div className="mt-2 bg-gray-800/30 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-pink-500 to-purple-500 h-full transition-all duration-500"
                style={{ width: `${Math.min(100, (data.history.length / 50) * 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-subtext-light dark:text-subtext-dark mt-1">
              {data.history.length < 50 ? `${50 - data.history.length} to unlock Master badge` : 'Master level achieved! 🎖️'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
