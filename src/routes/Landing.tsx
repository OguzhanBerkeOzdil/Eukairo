import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { loadData } from '../state/storage';
import { getProtocolById } from '../data/protocols';
import { Onboarding } from '../components/Onboarding';
import { useSession } from '../state/SessionProvider';
import { selectProtocol } from '../state/bandit';

const ONBOARDING_KEY = 'eukairo_onboarding_complete';

export const Landing = () => {
  const navigate = useNavigate();
  const data = loadData();
  const history = data?.history || [];
  const lastSession = history.length ? history[history.length - 1] : null;
  const { setGoal, setProtocol } = useSession();
  
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return !localStorage.getItem(ONBOARDING_KEY);
  });

  const handleOnboardingComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setShowOnboarding(false);
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        navigate('/goals');
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [navigate]);

  // Calculate suggestion
  let suggestedGoal: 'calm' | 'focus' | 'pre-sleep' | null = null;
  let suggestion = 'A 2-minute adaptive test to help you focus or relax.';
  let nextDose = '';
  let whyText = '';
  
  if (lastSession) {
    const protocol = getProtocolById(lastSession.protocolId);
    const model = data.models[lastSession.protocolId];
    const duration = model?.medDuration || protocol?.baseSeconds || 90;
    suggestedGoal = lastSession.goal as 'calm' | 'focus' | 'pre-sleep';
    suggestion = `${protocol?.name || 'a protocol'} for ${lastSession.goal}`;
    nextDose = `${duration}s`;
    
    // Calculate "why" text from recent sessions
    const recentSessions = history.slice(-3).filter(s => s.protocolId === lastSession.protocolId);
    if (recentSessions.length > 0) {
      const avgDelta = recentSessions.reduce((sum, s) => sum + s.delta, 0) / recentSessions.length;
      whyText = `Best of last ${recentSessions.length} (${avgDelta >= 0 ? '+' : ''}${avgDelta.toFixed(1)})`;
    }
  }

  const handleSuggestedClick = () => {
    if (suggestedGoal) {
      // Auto-set goal and navigate to session
      setGoal(suggestedGoal);
      const { protocol: selectedProtocol, duration } = selectProtocol(suggestedGoal);
      setProtocol(selectedProtocol, duration);
      navigate('/session');
    } else {
      // No history yet, go to goals
      navigate('/goals');
    }
  };

  const handleGoalChipClick = (goalName: 'calm' | 'focus' | 'pre-sleep') => {
    setGoal(goalName);
    const { protocol: selectedProtocol, duration } = selectProtocol(goalName);
    setProtocol(selectedProtocol, duration);
    navigate('/session');
  };

  return (
    <main className="max-w-7xl mx-auto w-full grid gap-8 md:grid-cols-[minmax(0,1fr)_420px]">
      <section className="flex flex-col">
        <div className="bg-card-light/5 dark:bg-card-dark/40 backdrop-blur-sm rounded-2xl shadow-lg p-8 lg:p-12">
          <h1 className="text-5xl lg:text-7xl font-bold leading-tight text-text-light dark:text-text-dark mb-6">
            Discover your best micro-biohack in minutes.
          </h1>
          <p className="text-lg lg:text-xl text-subtext-light dark:text-subtext-dark mb-6 max-w-2xl">
            Run 2-minute, sensor-free experiments, and let Eukairo adapt on-device from your ratings.
          </p>

          {/* Goal chips */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => handleGoalChipClick('calm')}
              className="px-4 py-2 rounded-full bg-primary/10 hover:bg-primary/20 border border-primary/30 text-text-light dark:text-text-dark text-sm font-medium transition-colors"
            >
              Calm
            </button>
            <button
              onClick={() => handleGoalChipClick('focus')}
              className="px-4 py-2 rounded-full bg-primary/10 hover:bg-primary/20 border border-primary/30 text-text-light dark:text-text-dark text-sm font-medium transition-colors"
            >
              Focus
            </button>
            <button
              onClick={() => handleGoalChipClick('pre-sleep')}
              className="px-4 py-2 rounded-full bg-primary/10 hover:bg-primary/20 border border-primary/30 text-text-light dark:text-text-dark text-sm font-medium transition-colors"
            >
              Pre-sleep
            </button>
          </div>

          {history.length > 0 && (
            <p className="text-sm text-primary font-mono mb-6">
              Sessions: {history.length}
            </p>
          )}

          <button
            onClick={() => navigate('/goals')}
            className="inline-block bg-primary text-gray-900 font-bold px-12 py-4 rounded-lg text-lg hover:opacity-90 transition-opacity glow-button animate-breathing"
          >
            Start a 2-min experiment
          </button>
        </div>

        <div className="flex items-center flex-wrap gap-3 mt-6">
          <span className="bg-chip-light-bg dark:bg-chip-dark-bg text-chip-light-text dark:text-chip-dark-text text-xs font-medium px-3 py-1 rounded-full border border-gray-300 dark:border-gray-600">
            Offline PWA
          </span>
          <span className="bg-chip-light-bg dark:bg-chip-dark-bg text-chip-light-text dark:text-chip-dark-text text-xs font-medium px-3 py-1 rounded-full border border-gray-300 dark:border-gray-600">
            No account
          </span>
          <span className="bg-chip-light-bg dark:bg-chip-dark-bg text-chip-light-text dark:text-chip-dark-text text-xs font-medium px-3 py-1 rounded-full border border-gray-300 dark:border-gray-600">
            On-device learning
          </span>
        </div>
      </section>

      <aside>
        <div 
          onClick={handleSuggestedClick}
          className="bg-card-light dark:bg-card-dark rounded-2xl shadow-lg p-6 cursor-pointer hover:ring-2 hover:ring-primary transition-all"
        >
          <div className="flex items-start justify-between mb-2">
            <h2 className="font-bold text-lg text-text-light dark:text-text-dark">Suggested next session</h2>
            {nextDose && (
              <span className="text-xs font-mono bg-primary/20 text-primary px-2 py-1 rounded-full">
                {nextDose}
              </span>
            )}
          </div>
          <p className="text-sm text-subtext-light dark:text-subtext-dark mb-2">{suggestion}</p>
          {whyText && (
            <p className="text-xs text-primary mb-4">
              {whyText}
            </p>
          )}

          <div className="aspect-[16/9] bg-gray-200 dark:bg-gray-800/60 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 bg-primary/40 rounded-full animate-pulse-slow"></div>
              <div className="absolute inset-0 bg-primary/60 rounded-full animate-pulse-slow" style={{ animationDelay: '0.5s' }}></div>
              <div className="absolute inset-2 bg-primary rounded-full"></div>
            </div>
          </div>

          <Link
            to="/techniques"
            onClick={(e) => e.stopPropagation()}
            className="text-xs text-primary hover:underline text-center block"
          >
            See all techniques →
          </Link>
        </div>
      </aside>

      {showOnboarding && <Onboarding onComplete={handleOnboardingComplete} />}
    </main>
  );
};
