import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface OnboardingProps {
  onComplete: () => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();

  const steps = [
    {
      title: 'Welcome to Eukairo 🌟',
      content: 'Discover the best mindfulness techniques for you through intelligent, personalized recommendations.',
      action: 'Get Started',
    },
    {
      title: 'Choose Your Goal 🎯',
      content: 'Select what you want to achieve: reduce stress, improve focus, better sleep, or emotional balance.',
      action: 'Next',
    },
    {
      title: 'Complete Sessions 🧘',
      content: 'We\'ll recommend a technique. Follow the guided session and experience the practice.',
      action: 'Next',
    },
    {
      title: 'Rate & Learn 📊',
      content: 'After each session, rate how effective it was. Our AI learns your preferences and improves recommendations over time.',
      action: 'Start Your Journey',
    },
  ];

  const currentStep = steps[step];

  const handleNext = () => {
    if (step === steps.length - 1) {
      onComplete();
      navigate('/goals');
    } else {
      setStep(step + 1);
    }
  };

  const handleSkip = () => {
    onComplete();
    navigate('/goals');
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card-light dark:bg-card-dark rounded-2xl shadow-2xl max-w-md w-full p-8 border border-border-light dark:border-border-dark">
        {/* Progress Dots */}
        <div className="flex justify-center gap-2 mb-8">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all ${
                i === step
                  ? 'w-8 bg-primary'
                  : i < step
                  ? 'w-2 bg-primary/50'
                  : 'w-2 bg-gray-600'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4 text-text-light dark:text-text-dark">
            {currentStep.title}
          </h2>
          <p className="text-lg text-subtext-light dark:text-subtext-dark leading-relaxed">
            {currentStep.content}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          {step < steps.length - 1 && (
            <button
              onClick={handleSkip}
              className="flex-1 px-6 py-3 rounded-lg border border-border-light dark:border-border-dark text-subtext-light dark:text-subtext-dark hover:bg-gray-800/30 transition-colors"
            >
              Skip
            </button>
          )}
          <button
            onClick={handleNext}
            className={`${
              step < steps.length - 1 ? 'flex-1' : 'w-full'
            } px-6 py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98]`}
          >
            {currentStep.action}
          </button>
        </div>

        {/* Step Counter */}
        <div className="text-center mt-6 text-sm text-subtext-light dark:text-subtext-dark">
          Step {step + 1} of {steps.length}
        </div>
      </div>
    </div>
  );
};
