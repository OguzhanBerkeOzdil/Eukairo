import React from 'react';

interface CalendarHeatmapProps {
  history: Array<{ dateISO: string; delta: number }>;
}

export const CalendarHeatmap: React.FC<CalendarHeatmapProps> = ({ history }) => {
  const getLast30Days = () => {
    const days = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      days.push(date);
    }
    return days;
  };

  const getSessionsForDay = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return history.filter(s => s.dateISO.startsWith(dateStr));
  };

  const getHeatmapColor = (sessions: Array<{ dateISO: string; delta: number }>) => {
    if (sessions.length === 0) return 'bg-gray-800/30';
    
    const avgDelta = sessions.reduce((sum, s) => sum + s.delta, 0) / sessions.length;
    const count = sessions.length;
    
    if (avgDelta > 0.5) {
      if (count >= 3) return 'bg-green-500';
      if (count >= 2) return 'bg-green-400';
      return 'bg-green-300';
    } else if (avgDelta >= -0.5) {
      if (count >= 3) return 'bg-yellow-500';
      if (count >= 2) return 'bg-yellow-400';
      return 'bg-yellow-300';
    } else {
      if (count >= 3) return 'bg-red-500';
      if (count >= 2) return 'bg-red-400';
      return 'bg-red-300';
    }
  };

  const last30Days = getLast30Days();

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-subtext-light dark:text-subtext-dark">
        Activity (Last 30 Days)
      </h3>
      <div className="grid grid-cols-10 gap-1">
        {last30Days.map((day, i) => {
          const sessions = getSessionsForDay(day);
          const color = getHeatmapColor(sessions);
          const dateStr = day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          
          return (
            <div
              key={i}
              className={`h-8 w-full rounded-sm ${color} hover:ring-2 hover:ring-primary transition-all cursor-pointer`}
              title={`${dateStr}: ${sessions.length} session${sessions.length !== 1 ? 's' : ''}`}
            />
          );
        })}
      </div>
      <div className="flex items-center justify-between text-xs text-subtext-light dark:text-subtext-dark">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="h-3 w-3 rounded-sm bg-gray-800/30"></div>
          <div className="h-3 w-3 rounded-sm bg-green-300"></div>
          <div className="h-3 w-3 rounded-sm bg-green-400"></div>
          <div className="h-3 w-3 rounded-sm bg-green-500"></div>
        </div>
        <span>More</span>
      </div>
    </div>
  );
};
