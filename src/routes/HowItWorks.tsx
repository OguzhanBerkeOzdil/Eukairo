import React from 'react';
import { Link } from 'react-router-dom';

export const HowItWorks: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto p-6 lg:p-8">
      <header className="text-center mb-12">
        <h1 className="text-4xl font-bold text-text-light dark:text-text-dark mb-4">
          How It Works
        </h1>
        <p className="text-lg text-subtext-light dark:text-subtext-dark">
          Simple. Scientific. On-device.
        </p>
      </header>

      <main className="space-y-12">
        <section className="bg-card-light dark:bg-card-dark p-8 rounded-xl shadow-lg">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-primary">1</span>
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-text-light dark:text-text-dark mb-2">
                Pick Your Goal
              </h2>
              <p className="text-subtext-light dark:text-subtext-dark">
                Choose what you need right now: Calm, Focus, or Pre-sleep. Eukairo will suggest a micro-protocol.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-card-light dark:bg-card-dark p-8 rounded-xl shadow-lg">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-primary">2</span>
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-text-light dark:text-text-dark mb-2">
                Run the 2-Minute Test
              </h2>
              <p className="text-subtext-light dark:text-subtext-dark">
                Follow simple guided cues—no sensors, no equipment. Just breathing techniques or eye breaks proven by science.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-card-light dark:bg-card-dark p-8 rounded-xl shadow-lg">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-primary">3</span>
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-text-light dark:text-text-dark mb-2">
                Rate Your Experience
              </h2>
              <p className="text-subtext-light dark:text-subtext-dark">
                Tell us how you feel: Worse, Same, or Better. Your rating teaches Eukairo what works best for you.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-card-light dark:bg-card-dark p-8 rounded-xl shadow-lg">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-primary">4</span>
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-text-light dark:text-text-dark mb-2">
                Get Smarter Suggestions
              </h2>
              <p className="text-subtext-light dark:text-subtext-dark mb-4">
                Eukairo uses an on-device learning algorithm (ε-greedy bandit + Minimum Effective Dose) to adapt protocols and durations based on your feedback—no cloud, no account needed.
              </p>
              <p className="text-sm text-subtext-light dark:text-subtext-dark italic">
                The more you use it, the better it gets at finding your optimal biohack.
              </p>
            </div>
          </div>
        </section>

        <section className="text-center pt-8">
          <Link 
            to="/goals"
            className="inline-block bg-primary text-gray-900 font-bold px-12 py-4 rounded-lg text-lg hover:opacity-90 transition-opacity"
          >
            Try It Now
          </Link>
        </section>
      </main>
    </div>
  );
};
