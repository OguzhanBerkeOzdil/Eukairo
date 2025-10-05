import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSession } from '../state/SessionProvider';
import { loadData } from '../state/storage';
import { selectProtocol } from '../state/bandit';

export const Rate: React.FC = () => {
  const navigate = useNavigate();
  const { saveRating, reset, duration, goal } = useSession();
  const [saved, setSaved] = useState(false);
  const [adjustedDuration, setAdjustedDuration] = useState<number | null>(null);
  const [nextPreview, setNextPreview] = useState<string>('');

  const handleRating = useCallback((delta: -1 | 0 | 1) => {
    saveRating(delta);
    setSaved(true);
    
    let newDuration = duration;
    if (delta === 1) {
      newDuration = Math.max(45, duration - 15);
    } else if (delta === -1) {
      newDuration = Math.min(180, duration + 15);
    }
    setAdjustedDuration(newDuration);
    
    if (goal) {
      const data = loadData();
      const { protocol: nextProtocol, duration: nextDuration } = selectProtocol(goal);
      const model = data.models[nextProtocol.id];
      const reason = model && model.trials > 0 
        ? `(avg: ${model.avg > 0 ? '+' : ''}${model.avg.toFixed(1)})`
        : '(new protocol)';
      setNextPreview(`Next: ${nextProtocol.name} at ${nextDuration}s ${reason}`);
    }
  }, [saveRating, duration, goal]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (saved) return;
      
      if (e.key === '1') {
        e.preventDefault();
        handleRating(-1);
      } else if (e.key === '2') {
        e.preventDefault();
        handleRating(0);
      } else if (e.key === '3') {
        e.preventDefault();
        handleRating(1);
      } else if (e.key === 'Escape') {
        navigate('/');
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [saved, navigate, handleRating]);

  const handleContinue = () => {
    reset();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 lg:p-8 relative overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-30 dark:opacity-100"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-x-1/4 -translate-y-1/4 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl translate-x-1/4 translate-y-1/4 pointer-events-none"></div>
      
      <div className="relative z-10 w-full max-w-2xl text-center">
        <h1 className="text-3xl lg:text-4xl font-medium text-text-light dark:text-text-dark mb-12">
          How do you feel now?
        </h1>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <button 
            onClick={() => handleRating(-1)}
            disabled={saved}
            className="group relative bg-card-light dark:bg-card-dark hover:bg-gray-100 dark:hover:bg-gray-800 border-2 border-border-light dark:border-border-dark hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-light dark:text-text-dark font-semibold py-8 px-6 rounded-xl transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg hover:scale-[1.02] active:scale-95"
          >
            <span className="text-4xl mb-3 block opacity-70">😞</span>
            <span className="text-xl block mb-2">Worse</span>
            <span className="text-xs opacity-50 block">Press 1</span>
          </button>
          <button 
            onClick={() => handleRating(0)}
            disabled={saved}
            className="group relative bg-card-light dark:bg-card-dark hover:bg-gray-100 dark:hover:bg-gray-800 border-2 border-border-light dark:border-border-dark hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-light dark:text-text-dark font-semibold py-8 px-6 rounded-xl transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg hover:scale-[1.02] active:scale-95"
          >
            <span className="text-4xl mb-3 block opacity-70">😐</span>
            <span className="text-xl block mb-2">Same</span>
            <span className="text-xs opacity-50 block">Press 2</span>
          </button>
          <button 
            onClick={() => handleRating(1)}
            disabled={saved}
            className="group relative bg-card-light dark:bg-card-dark hover:bg-gray-100 dark:hover:bg-gray-800 border-2 border-border-light dark:border-border-dark hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-light dark:text-text-dark font-semibold py-8 px-6 rounded-xl transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg hover:scale-[1.02] active:scale-95"
          >
            <span className="text-4xl mb-3 block opacity-70">😊</span>
            <span className="text-xl block mb-2">Better</span>
            <span className="text-xs opacity-50 block">Press 3</span>
          </button>
        </div>
        
        <div className={`h-20 flex flex-col items-center justify-center transition-opacity duration-500 ${saved ? 'opacity-100' : 'opacity-0'}`}>
          <div className="text-center">
            <p className="text-lg text-subtext-light dark:text-subtext-dark">
              Saved — we'll adapt next time.
            </p>
            {adjustedDuration !== null && (
              <p className="text-sm text-primary font-mono mt-1">
                💊 Dose adjusted to {adjustedDuration}s
              </p>
            )}
            {nextPreview && (
              <p className="text-xs text-subtext-light dark:text-subtext-dark mt-2">
                {nextPreview}
              </p>
            )}
          </div>
        </div>
        
        <div className={`transition-opacity duration-500 ${saved ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: saved ? '0.5s' : '0s' }}>
          <button 
            onClick={handleContinue}
            className="inline-block bg-primary text-gray-900 font-bold px-12 py-4 rounded-lg text-lg hover:opacity-90 transition-opacity"
          >
            Continue
          </button>
          <div className="mt-4">
            <Link 
              to="/insights" 
              className="text-sm text-subtext-light dark:text-subtext-dark hover:text-text-light dark:hover:text-text-dark transition-colors"
            >
              See insights
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
