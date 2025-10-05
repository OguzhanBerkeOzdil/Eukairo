# Eukairo# Eukairo



Eukairo (eu-KAI-roh) — from Greek *eu* (good) + *kairos* (the opportune moment). Quick biohacking experiments that learn what works for you.



The right moment for a small shift toward better wellbeing.## What is this?



## What It DoesEukairo helps you figure out which breathing exercises and micro-protocols actually work for **you**. No sensors, no account needed. Just run 2-minute sessions, rate how you feel, and watch it adapt.



Eukairo helps users discover which breathing exercises work best for them through intelligent experimentation. Instead of prescribing one-size-fits-all solutions, it:Works offline. Your data never leaves your device.



- Tracks which protocols users find most effective## How it works

- Adapts recommendations based on individual feedback

- Balances exploration of new techniques with exploitation of proven favorites1. Pick a goal (calm down, focus, or prep for sleep)

- Handles noisy feedback and changing preferences over time2. Do a quick protocol (breathing, eye rest, etc.)

3. Rate how you feel

## Key Features4. Repeat when you want



**Adaptive Learning**: Uses Thompson Sampling to balance trying new breathing protocols against recommending proven favorites.The app learns from your ratings using a simple bandit algorithm. Over time, it figures out which protocols work best for different goals and even adjusts the duration to match what helps you most.



**Personalized**: Every user gets different recommendations based on their unique responses and preferences.## Run it



**Scientifically Grounded**: Implements Bayesian inference, ensemble methods, and drift detection to make statistically sound decisions.```bash

npm install

**Handles Real-World Complexity**: Robust to noisy user ratings, preference changes, and close competitions between similar protocols.npm run dev

```

## Technical Approach

Build for production:

The system implements a multi-armed bandit framework with:```bash

npm run build

- **Thompson Sampling** for probabilistic protocol selectionnpm run preview

- **Ensemble Voting** for discriminating between similarly-performing options```

- **Drift Detection** to adapt when user preferences change

- **EVPI-based Early Stopping** to avoid wasting time on clearly inferior protocols## Stack



## Getting Started- React + TypeScript

- Vite

```bash- TailwindCSS v4

npm install- PWA with offline support

npm run dev- Local storage only (no backend)

```

## Features

Build for production:

```bash- 5 micro-protocols (breathing exercises, eye breaks)

npm run build- On-device learning (ε-greedy bandit + MED adaptation)

npm run preview- Per-goal personalization

```- Time-of-day insights

- Streak tracking

## Testing- CSV export for nerds

- Fully accessible (keyboard nav + screen reader)

The algorithm is validated against six scientifically designed test scenarios:

---

```bash

cd testsMade by Oğuzhan Berke Özdil for HackYeah 2025

npx tsx run-tests.ts

```

Test scenarios include clear winners, close competitions, high noise, preference drift, and flat landscapes.

## Architecture

- `src/state/bandit.ts` - Core recommendation algorithm
- `src/state/thompson-sampling.ts` - Bayesian inference engine
- `src/state/ensemble-methods.ts` - Multi-algorithm voting
- `src/state/drift-detection.ts` - Preference change detection
- `src/data/protocols.ts` - Breathing protocol definitions

## Why This Matters

Traditional wellness apps guess what works. Eukairo learns what works for you. By treating each user as a unique experiment, we find the opportune moment for each person to discover their most effective breathing practice.

---

Built with TypeScript, React, and Bayesian statistics.
