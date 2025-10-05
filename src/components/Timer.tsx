import React, { useState, useEffect } from 'react';

interface TimerProps {
  duration: number;
  cues: string[];
  onComplete: () => void;
}

export const Timer: React.FC<TimerProps> = ({ duration, cues, onComplete }) => {
  const [remaining, setRemaining] = useState(duration);
  const [cueIndex, setCueIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    setRemaining(duration);
    setCueIndex(0);
    setIsPaused(false);
  }, [duration]);

  useEffect(() => {
    if (remaining <= 0) {
      onComplete();
      return;
    }

    if (isPaused) return;

    const interval = setInterval(() => {
      setRemaining(prev => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [remaining, onComplete, isPaused]);

  useEffect(() => {
    if (isPaused) return;

    const cueInterval = setInterval(() => {
      setCueIndex((prev) => (prev + 1) % cues.length);
    }, 4000);

    return () => clearInterval(cueInterval);
  }, [cues.length, isPaused]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const circumference = 2 * Math.PI * 45;
  const progress = ((duration - remaining) / duration) * circumference;

  // Get current cue stage (Inhale/Hold/Exhale)
  const getCueStage = (cue: string): string => {
    if (cue.toLowerCase().includes('inhale')) return 'Inhale';
    if (cue.toLowerCase().includes('hold')) return 'Hold';
    if (cue.toLowerCase().includes('exhale')) return 'Exhale';
    if (cue.toLowerCase().includes('release')) return 'Release';
    if (cue.toLowerCase().includes('close')) return 'Prepare';
    return 'Breathe';
  };

  const currentStage = getCueStage(cues[cueIndex]);

  return (
    <>
      <div className="relative w-64 h-64 md:w-80 md:h-80 my-8">
        <svg className="absolute inset-0 w-full h-full" fill="none" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <circle 
            className="text-gray-700/30" 
            cx="50" 
            cy="50" 
            r="45" 
            stroke="currentColor" 
            strokeWidth="3"
          />
          <circle 
            className="text-primary" 
            cx="50" 
            cy="50" 
            r="45" 
            stroke="currentColor" 
            strokeLinecap="round" 
            strokeWidth="5"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            transform="rotate(-90 50 50)"
            style={{
              transition: 'stroke-dashoffset 1s linear',
              animation: isPaused ? 'none' : 'timer-breath 10s ease-in-out infinite',
              transformOrigin: 'center'
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-6xl md:text-7xl font-bold text-text-light dark:text-text-dark tabular-nums mb-2">
            {formatTime(remaining)}
          </span>
          {/* Cue stage indicator */}
          <div className="flex items-center gap-2 mt-2">
            <div className={`w-2 h-2 rounded-full ${currentStage === 'Inhale' ? 'bg-primary' : 'bg-gray-600'}`}></div>
            <div className={`w-2 h-2 rounded-full ${currentStage === 'Hold' ? 'bg-primary' : 'bg-gray-600'}`}></div>
            <div className={`w-2 h-2 rounded-full ${currentStage === 'Exhale' || currentStage === 'Release' ? 'bg-primary' : 'bg-gray-600'}`}></div>
          </div>
        </div>
      </div>
      <p 
        className="text-2xl font-medium text-text-light dark:text-text-dark mb-8 transition-all duration-1000 ease-in-out"
        aria-live="polite"
        aria-atomic="true"
      >
        {currentStage}
      </p>
      <p 
        className="text-base text-subtext-light dark:text-subtext-dark mb-12 transition-all duration-1000 ease-in-out"
      >
        {cues[cueIndex]}
      </p>
      
      {/* Pause/Resume button */}
      <button
        onClick={() => setIsPaused(!isPaused)}
        className="mb-4 px-6 py-2 rounded-full bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 transition-colors"
      >
        {isPaused ? 'Resume' : 'Pause'}
      </button>
    </>
  );
};
