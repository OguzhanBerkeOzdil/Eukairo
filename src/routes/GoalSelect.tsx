import { useNavigate } from 'react-router-dom';
import { HiSparkles } from 'react-icons/hi';
import { BsMoonStars } from 'react-icons/bs';
import { TbWaveSine } from 'react-icons/tb';
import type { Goal } from '../types';
import { useSession } from '../state/SessionProvider';
import { selectProtocol } from '../state/bandit';

export const GoalSelect = () => {
  const navigate = useNavigate();
  const { setGoal, setProtocol } = useSession();

  const handleGoalClick = (goal: Goal) => {
    setGoal(goal);
    const { protocol, duration } = selectProtocol(goal);
    setProtocol(protocol, duration);
    navigate('/session');
  };

  const handleKeyDown = (event: React.KeyboardEvent, goal: Goal) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleGoalClick(goal);
    }
  };

  const goals = [
    {
      id: 'calm' as Goal,
      title: 'Calm',
      subtitle: 'Find your center',
      icon: <TbWaveSine className="w-12 h-12" />,
      delay: '0.2s'
    },
    {
      id: 'focus' as Goal,
      title: 'Focus',
      subtitle: 'Sharpen your mind',
      icon: <HiSparkles className="w-12 h-12" />,
      delay: '0.4s'
    },
    {
      id: 'pre-sleep' as Goal,
      title: 'Pre-sleep',
      subtitle: 'Prepare for rest',
      icon: <BsMoonStars className="w-12 h-12" />,
      delay: '0.6s'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 lg:p-8 relative overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-30 dark:opacity-100"></div>
      <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none animate-fade-in" style={{ animationDelay: '0.5s' }}></div>
      
      <div className="relative z-10 flex flex-col items-center w-full max-w-4xl animate-fade-in">
        <header className="text-center mb-16">
          <h1 className="text-3xl lg:text-4xl font-medium text-text-light dark:text-text-dark">
            What do you need right now?
          </h1>
        </header>
        
        <main className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 w-full">
          {goals.map((goal) => (
            <button
              key={goal.id}
              onClick={() => handleGoalClick(goal.id)}
              onKeyDown={(e) => handleKeyDown(e, goal.id)}
              className="group animate-fade-in"
              style={{ animationDelay: goal.delay }}
              tabIndex={0}
            >
              <div className="bg-card-light/50 dark:bg-card-dark/60 backdrop-blur-md rounded-xl p-8 lg:p-10 text-center flex flex-col items-center justify-center h-full transform transition-all duration-300 ease-out hover:scale-105 hover:bg-card-dark/80 shadow-glow-subtle hover:shadow-glow-subtle-hover">
                <div className="mb-4 text-primary opacity-80 group-hover:opacity-100 transition-opacity">
                  {goal.icon}
                </div>
                <h2 className="text-xl lg:text-2xl font-semibold text-text-light dark:text-text-dark mb-2">
                  {goal.title}
                </h2>
                <p className="text-subtext-light dark:text-subtext-dark text-sm">
                  {goal.subtitle}
                </p>
              </div>
            </button>
          ))}
        </main>
      </div>
    </div>
  );
};
