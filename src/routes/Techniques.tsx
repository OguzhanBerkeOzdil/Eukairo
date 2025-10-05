import React from 'react';

interface TechniqueCardProps {
  emoji: string;
  name: string;
  goals: string;
  oneLiner: string;
  howTo: string;
  duration: string;
  when: string;
  caution: string;
}

const TechniqueCard: React.FC<TechniqueCardProps> = ({
  emoji,
  name,
  goals,
  oneLiner,
  howTo,
  duration,
  when,
  caution
}) => {
  return (
    <div className="group relative bg-gradient-to-br from-card-light/80 to-card-light dark:from-card-dark/80 dark:to-card-dark p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 border border-primary/10 hover:border-primary/30">
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:to-primary/10 transition-all duration-300"></div>
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-text-light dark:text-text-dark mb-1">
              {name}
            </h3>
            <p className="text-sm text-primary font-medium">{goals}</p>
          </div>
          <span className="text-4xl ml-4">{emoji}</span>
        </div>
        
        <p className="text-subtext-light dark:text-subtext-dark italic mb-4 border-l-2 border-primary/30 pl-3">
          {oneLiner}
        </p>
        
        <div className="space-y-3 text-sm">
          <div>
            <span className="font-semibold text-text-light dark:text-text-dark">How: </span>
            <span className="text-subtext-light dark:text-subtext-dark">{howTo}</span>
          </div>
          
          <div className="flex gap-4">
            <div>
              <span className="font-semibold text-text-light dark:text-text-dark">Duration: </span>
              <span className="text-primary font-mono">{duration}</span>
            </div>
          </div>
          
          <div>
            <span className="font-semibold text-text-light dark:text-text-dark">When: </span>
            <span className="text-subtext-light dark:text-subtext-dark">{when}</span>
          </div>
          
          <div className="pt-2 border-t border-primary/10">
            <span className="font-semibold text-yellow-600 dark:text-yellow-500">⚠️ Caution: </span>
            <span className="text-subtext-light dark:text-subtext-dark">{caution}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Techniques: React.FC = () => {
  const techniques: TechniqueCardProps[] = [
    {
      emoji: '😮‍💨',
      name: 'Physiological Sigh',
      goals: 'Calm, Pre-sleep',
      oneLiner: 'Two inhales, long exhale to downshift.',
      howTo: 'Inhale nose → top-up → long mouth exhale.',
      duration: '90s',
      when: 'Stress spike, pre-sleep restlessness.',
      caution: 'Stop if lightheaded.'
    },
    {
      emoji: '🔲',
      name: 'Box Breathing 4-4-4-4',
      goals: 'Calm, Focus, Pre-sleep',
      oneLiner: 'Even rhythm to steady mind.',
      howTo: 'Inhale 4s → hold 4s → exhale 4s → hold 4s.',
      duration: '120s',
      when: 'Task switch, pre-meeting.',
      caution: "Don't strain; adjust counts."
    },
    {
      emoji: '👀',
      name: '20-20-20 Eye Break',
      goals: 'Focus, Calm',
      oneLiner: 'Rest eyes, reset attention.',
      howTo: 'Gaze ~6m 20s → blink → relax shoulders.',
      duration: '60s',
      when: 'Screen fatigue.',
      caution: 'None specific.'
    },
    {
      emoji: '🌙',
      name: '4-7-8 Breathing',
      goals: 'Pre-sleep, Calm',
      oneLiner: 'Slow rhythm reduces arousal.',
      howTo: 'Inhale 4 → hold 7 → exhale 8.',
      duration: '90s',
      when: 'Wind-down before bed.',
      caution: 'If dizzy, stop; fewer cycles.'
    },
    {
      emoji: '🔁',
      name: 'Alternate Nostril',
      goals: 'Calm, Balance',
      oneLiner: 'Balancing breath through each nostril.',
      howTo: 'Close right, inhale left → switch → exhale right; reverse.',
      duration: '120s',
      when: 'Jittery or scattered.',
      caution: 'Congested nose? Skip.'
    }
  ];

  return (
    <main className="max-w-6xl mx-auto">
      <div className="mb-12">
        <h1 className="text-4xl lg:text-5xl font-bold text-text-light dark:text-text-dark mb-4">
          Breathing Techniques
        </h1>
        <p className="text-lg text-subtext-light dark:text-subtext-dark">
          Ready-made protocols you can use as-is. Each technique targets different states.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {techniques.map((technique, idx) => (
          <TechniqueCard key={idx} {...technique} />
        ))}
      </div>

      <div className="mt-12 p-6 bg-primary/5 rounded-xl border border-primary/20">
        <h2 className="text-xl font-bold text-text-light dark:text-text-dark mb-2">
          How Eukairo Adapts
        </h2>
        <p className="text-subtext-light dark:text-subtext-dark">
          The app learns which protocol works best for your goal (Calm/Focus/Pre-sleep). 
          After each session, it adjusts duration based on your rating. Over time, you'll 
          discover your personal optimal protocol and timing.
        </p>
      </div>
    </main>
  );
};
