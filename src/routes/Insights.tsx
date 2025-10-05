import React from 'react';
import { Link } from 'react-router-dom';
import { loadData, exportCSV } from '../state/storage';
import { getProtocolById } from '../data/protocols';
import { CalendarHeatmap } from '../components/CalendarHeatmap';
import { Sparkline } from '../components/Sparkline';
import { PersonalRecords } from '../components/PersonalRecords';
import { QuickStats } from '../components/QuickStats';

export const Insights: React.FC = () => {
  const data = loadData();

  const handleExport = () => {
    const csv = exportCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eukairo-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearData = () => {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      try {
        localStorage.removeItem('eukairo.v1');
        window.location.href = '/';
      } catch (error) {
        console.error('Error clearing data:', error);
        alert('Failed to clear data. Please try again.');
      }
    }
  };

  const calculateStreak = () => {
    if (data.history.length === 0) return 0;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const sessionDates = data.history
      .map(s => {
        const date = new Date(s.dateISO);
        date.setHours(0, 0, 0, 0);
        return date.getTime();
      })
      .filter((value, index, self) => self.indexOf(value) === index)
      .sort((a, b) => b - a);
    
    let streak = 0;
    let checkDate = today.getTime();
    
    for (const sessionDate of sessionDates) {
      if (sessionDate === checkDate) {
        streak++;
        checkDate -= 24 * 60 * 60 * 1000;
      } else if (sessionDate === checkDate + 24 * 60 * 60 * 1000) {
        continue;
      } else {
        break;
      }
    }
    
    return streak;
  };

  const currentStreak = calculateStreak();

  const learningCurve = () => {
    if (data.history.length === 0) return { avg: '0.00', sparkline: [] };
    
    const recent = data.history.slice(-10);
    const deltas = recent.map(s => s.delta);
    const sum = deltas.reduce((acc: number, d) => acc + d, 0);
    const avg = (sum / deltas.length).toFixed(2);
    
    const sparkline: number[] = [];
    let runningSum = 0;
    deltas.forEach((delta, i) => {
      runningSum += delta;
      sparkline.push(runningSum / (i + 1));
    });
    
    return { avg, sparkline };
  };

  const { avg: recentAvg, sparkline } = learningCurve();

  const timeOfDayInsight = () => {
    if (data.history.length < 6) return null;
    
    const hourlyScores: Record<number, { sum: number; count: number }> = {};
    
    data.history.forEach(s => {
      const hour = new Date(s.dateISO).getHours();
      if (!hourlyScores[hour]) hourlyScores[hour] = { sum: 0, count: 0 };
      hourlyScores[hour].sum += s.delta;
      hourlyScores[hour].count += 1;
    });
    
    let bestHour = -1;
    let bestAvg = -Infinity;
    
    Object.entries(hourlyScores).forEach(([hour, data]) => {
      const avg = data.sum / data.count;
      if (data.count >= 2 && avg > bestAvg) {
        bestAvg = avg;
        bestHour = parseInt(hour);
      }
    });
    
    if (bestHour === -1 || bestAvg <= 0) return null;
    
    const startHour = bestHour;
    const endHour = (bestHour + 2) % 24;
    const formatHour = (h: number) => h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`;
    
    return `You tend to rate better around ${formatHour(startHour)}–${formatHour(endHour)}`;
  };

  const dayOfWeekInsight = () => {
    if (data.history.length < 10) return null;
    
    const dayScores: Record<number, { sum: number; count: number }> = {};
    
    data.history.forEach(s => {
      const day = new Date(s.dateISO).getDay(); // 0 = Sunday, 6 = Saturday
      if (!dayScores[day]) dayScores[day] = { sum: 0, count: 0 };
      dayScores[day].sum += s.delta;
      dayScores[day].count += 1;
    });
    
    let bestDay = -1;
    let bestAvg = -Infinity;
    
    Object.entries(dayScores).forEach(([day, data]) => {
      const avg = data.sum / data.count;
      if (data.count >= 3 && avg > bestAvg) {
        bestAvg = avg;
        bestDay = parseInt(day);
      }
    });
    
    if (bestDay === -1 || bestAvg <= 0.3) return null;
    
    const dayNames = ['Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays'];
    return `${dayNames[bestDay]} trend better (avg: ${bestAvg >= 0 ? '+' : ''}${bestAvg.toFixed(1)})`;
  };

  const timeInsight = timeOfDayInsight();
  const dayInsight = dayOfWeekInsight();

  const bestByGoal: Record<string, { protocolId: string; avg: number }> = {};
  Object.entries(data.models).forEach(([protocolId, model]) => {
    data.history.forEach(session => {
      if (session.protocolId === protocolId) {
        const key = session.goal;
        if (!bestByGoal[key] || model.avg > bestByGoal[key].avg) {
          bestByGoal[key] = { protocolId, avg: model.avg };
        }
      }
    });
  });

  // Calculate stats for QuickStats
  const totalTimeMinutes = Math.floor(data.history.reduce((sum, s) => sum + s.seconds, 0) / 60);
  const avgEffectiveness = data.history.length > 0 
    ? data.history.reduce((sum, s) => sum + s.delta, 0) / data.history.length 
    : 0;

  return (
    <div className="max-w-2xl mx-auto p-6 lg:p-8">
      <header className="text-center mb-12">
        <h1 className="text-3xl font-bold text-text-light dark:text-text-dark">Insights</h1>
        <p className="text-sm text-subtext-light dark:text-subtext-dark mt-1">On-device only.</p>
      </header>
      
      <main className="space-y-12">
        <QuickStats 
          totalSessions={data.history.length}
          avgEffectiveness={avgEffectiveness}
          currentStreak={currentStreak}
          totalTimeMinutes={totalTimeMinutes}
        />

        <section>
          <h2 className="text-lg font-semibold mb-4 text-text-light dark:text-text-dark">What works best</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {['Calm', 'Focus', 'Pre-sleep'].map((goal) => {
              const best = bestByGoal[goal.toLowerCase()];
              const protocol = best ? getProtocolById(best.protocolId) : null;
              const avgScore = best ? best.avg.toFixed(1) : '0.0';
              
              return (
                <div key={goal} className="bg-card-light dark:bg-card-dark p-4 rounded-lg border border-border-light dark:border-border-dark">
                  <p className="text-sm font-medium text-subtext-light dark:text-subtext-dark">{goal}</p>
                  <p className="text-base font-semibold text-text-light dark:text-text-dark mt-2">
                    {protocol?.name || 'No data yet'} {best && <span className="text-primary font-mono text-sm">+{avgScore}</span>}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-4 text-text-light dark:text-text-dark">Learning Curve</h2>
          <div className="bg-card-light dark:bg-card-dark p-6 rounded-lg border border-border-light dark:border-border-dark">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-subtext-light dark:text-subtext-dark">Recent effectiveness (last 10)</p>
                <p className="text-3xl font-bold text-primary mt-1">{Number(recentAvg) >= 0 ? '+' : ''}{recentAvg}</p>
              </div>
              {sparkline.length > 0 && <Sparkline data={sparkline} />}
            </div>
            <p className="text-xs text-subtext-light dark:text-subtext-dark">
              {Number(recentAvg) > 0 
                ? '📈 Protocols are working better for you' 
                : Number(recentAvg) < 0 
                  ? '📉 Keep experimenting to find what works'
                  : '➡️ Steady performance across sessions'}
            </p>
          </div>
        </section>

        {timeInsight && (
          <section>
            <div className="bg-primary/10 border border-primary/30 p-4 rounded-lg">
              <p className="text-sm text-text-light dark:text-text-dark">
                🕐 <strong>Time pattern:</strong> {timeInsight}
              </p>
            </div>
          </section>
        )}

        {dayInsight && (
          <section>
            <div className="bg-primary/10 border border-primary/30 p-4 rounded-lg">
              <p className="text-sm text-text-light dark:text-text-dark">
                📅 <strong>Day pattern:</strong> {dayInsight}
              </p>
            </div>
          </section>
        )}

        <section>
          <h2 className="text-lg font-semibold mb-4 text-text-light dark:text-text-dark">Personal Records 🏆</h2>
          <div className="bg-card-light dark:bg-card-dark p-6 rounded-lg border border-border-light dark:border-border-dark">
            <PersonalRecords data={data} />
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-4 text-text-light dark:text-text-dark">Activity Calendar</h2>
          <div className="bg-card-light dark:bg-card-dark p-6 rounded-lg border border-border-light dark:border-border-dark">
            <CalendarHeatmap history={data.history} />
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-4 text-text-light dark:text-text-dark">Streak</h2>
          <div className="bg-card-light dark:bg-card-dark p-6 rounded-lg border border-border-light dark:border-border-dark">
            <div className="text-center mb-4">
              <p className="text-4xl font-bold text-primary">{currentStreak}</p>
              <p className="text-sm text-subtext-light dark:text-subtext-dark mt-1">
                {currentStreak === 1 ? 'day' : 'days'} in a row
              </p>
            </div>
            <div className="flex justify-center space-x-2">
              {Array.from({ length: 7 }).map((_, i) => {
                const daysAgo = 6 - i;
                const checkDate = new Date();
                checkDate.setHours(0, 0, 0, 0);
                checkDate.setDate(checkDate.getDate() - daysAgo);
                
                const hasSession = data.history.some(s => {
                  const sessionDate = new Date(s.dateISO);
                  sessionDate.setHours(0, 0, 0, 0);
                  return sessionDate.getTime() === checkDate.getTime();
                });
                
                return (
                  <span
                    key={i}
                    className={`w-3 h-3 rounded-full ${
                      hasSession ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                    title={checkDate.toLocaleDateString()}
                  ></span>
                );
              })}
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-4 text-text-light dark:text-text-dark">History</h2>
          <div className="bg-card-light dark:bg-card-dark p-4 rounded-lg border border-border-light dark:border-border-dark">
            {data.history.length === 0 ? (
              <p className="text-sm text-subtext-light dark:text-subtext-dark text-center">
                No sessions yet. Start your first experiment!
              </p>
            ) : (
              <ul className="space-y-3 text-sm">
                {data.history.slice(-10).reverse().map((session, idx) => {
                  const protocol = getProtocolById(session.protocolId);
                  const date = new Date(session.dateISO).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  const arrow = session.delta === 1 ? '↑' : session.delta === 0 ? '→' : '↓';
                  const arrowColor = session.delta === 1 ? 'text-green-500' : session.delta === 0 ? 'text-gray-500' : 'text-red-500';
                  
                  return (
                    <li key={idx} className="flex justify-between items-center text-subtext-light dark:text-subtext-dark">
                      <span>{date} · {session.goal.charAt(0).toUpperCase() + session.goal.slice(1)} · {protocol?.name}</span>
                      <span className={`font-bold text-lg ${arrowColor}`}>{arrow}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>

        <section className="border-t border-border-light dark:border-border-dark pt-8 mt-12">
          <div className="flex justify-center space-x-6">
            <button 
              onClick={handleExport}
              disabled={data.history.length === 0}
              className="text-sm text-subtext-light dark:text-subtext-dark hover:text-text-light dark:hover:text-text-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Export CSV
            </button>
            <button 
              onClick={handleClearData}
              className="text-sm text-red-500 hover:text-red-400 transition-colors"
            >
              Clear Data
            </button>
          </div>
        </section>
      </main>

      <footer className="text-center mt-16">
        <Link 
          to="/" 
          className="text-sm text-subtext-light dark:text-subtext-dark hover:text-primary transition-colors inline-flex items-center justify-center"
        >
          <span className="mr-1">←</span>
          Back to Home
        </Link>
      </footer>
    </div>
  );
};
