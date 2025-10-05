import React from 'react';

export const About: React.FC = () => {
  return (
    <main className="max-w-3xl mx-auto">
      <div className="bg-card-light dark:bg-card-dark p-8 lg:p-12 rounded-xl shadow-lg">
        <h1 className="text-4xl font-bold text-text-light dark:text-text-dark mb-6">
          About & Privacy
        </h1>

        <div className="space-y-6 text-text-light dark:text-text-dark">
          <section>
            <h2 className="text-2xl font-bold mb-3">What is Eukairo?</h2>
            <p className="text-subtext-light dark:text-subtext-dark leading-relaxed">
              Eukairo helps you discover which micro-biohacking protocols work best for you through 
              short, sensor-free experiments. Run 2-minute sessions, rate how you feel, and let the 
              app adapt to your unique responses.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">Privacy First</h2>
            <p className="text-subtext-light dark:text-subtext-dark leading-relaxed mb-2">
              <strong>Your data stays on this device.</strong>
            </p>
            <ul className="list-disc list-inside text-subtext-light dark:text-subtext-dark space-y-2">
              <li>No account required</li>
              <li>No backend servers</li>
              <li>No data collection or tracking</li>
              <li>All learning happens on your device</li>
              <li>You can export your data anytime</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">How It Works</h2>
            <p className="text-subtext-light dark:text-subtext-dark leading-relaxed">
              Eukairo uses a simple learning algorithm (ε-greedy bandit) to test different protocols 
              and adapt based on your ratings. The app adjusts session duration using the Minimum 
              Effective Dose principle, finding the shortest effective time for each protocol.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">Health Disclaimer</h2>
            <p className="text-subtext-light dark:text-subtext-dark leading-relaxed">
              This app is not medical advice. Stop any exercise if you feel discomfort. 
              Consult healthcare professionals for medical concerns.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">Open Source</h2>
            <p className="text-subtext-light dark:text-subtext-dark leading-relaxed">
              Built for HackYeah 2025 Biohacking task.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
};
