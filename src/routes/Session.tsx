import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../state/SessionProvider';
import { Timer } from '../components/Timer';
import { IoClose } from 'react-icons/io5';

export const Session: React.FC = () => {
  const navigate = useNavigate();
  const { protocol, duration } = useSession();

  if (!protocol) {
    navigate('/goals');
    return null;
  }

  const handleComplete = () => {
    navigate('/rate');
  };

  const handleStop = () => {
    navigate('/rate');
  };

  const handleClose = () => {
    navigate('/');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 relative">
      <div className="absolute inset-0 z-0 opacity-20"></div>
      <div className="relative z-10 flex flex-col items-center justify-center text-center w-full max-w-sm">
        <h1 className="text-2xl font-semibold text-text-light dark:text-text-dark mb-4 transition-opacity duration-500">
          {protocol.name}
        </h1>
        
        <Timer 
          duration={duration} 
          cues={protocol.cues}
          onComplete={handleComplete}
        />

        <button 
          onClick={handleStop}
          className="bg-red-500/20 border-2 border-red-500/50 text-red-400 px-8 py-3 rounded-full hover:bg-red-500/30 hover:border-red-500 transition-all font-semibold"
        >
          Stop Session
        </button>
      </div>
      
      <div className="absolute top-4 right-4 z-20">
        <button 
          onClick={handleClose}
          className="text-subtext-light dark:text-subtext-dark hover:text-text-light dark:hover:text-text-dark transition-colors"
          aria-label="Close session"
        >
          <IoClose className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};
