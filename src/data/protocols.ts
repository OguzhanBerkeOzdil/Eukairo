import type { Protocol, Goal } from '../types';

export const protocols: Protocol[] = [
  {
    id: 'physiological-sigh',
    name: 'Physiological Sigh',
    supports: ['calm', 'pre-sleep'],
    baseSeconds: 90,
    cues: [
      'Inhale through your nose…',
      'Top-up inhale (short)…',
      'Slow exhale through your mouth…',
      'Repeat…'
    ]
  },
  {
    id: 'box-breathing',
    name: 'Box Breathing 4-4-4-4',
    supports: ['calm', 'focus', 'pre-sleep'],
    baseSeconds: 120,
    cues: [
      'Inhale… 4',
      'Hold… 4',
      'Exhale… 4',
      'Hold… 4',
      'Repeat…'
    ]
  },
  {
    id: 'eye-break',
    name: '20-20-20 Eye Break',
    supports: ['focus', 'calm'],
    baseSeconds: 60,
    cues: [
      'Gaze far (~6 meters)…',
      'Blink softly and relax…',
      'Continue gazing…'
    ]
  },
  {
    id: '4-7-8-breathing',
    name: '4-7-8 Breathing',
    supports: ['pre-sleep', 'calm'],
    baseSeconds: 120,
    cues: [
      'Inhale through nose… 4',
      'Hold… 7',
      'Exhale through mouth… 8',
      'Repeat…'
    ]
  },
  {
    id: 'alternate-nostril',
    name: 'Alternate Nostril',
    supports: ['calm', 'focus'],
    baseSeconds: 90,
    cues: [
      'Close right nostril, inhale left…',
      'Close left nostril, exhale right…',
      'Inhale right…',
      'Exhale left…',
      'Repeat…'
    ]
  }
];

export const getProtocolsByGoal = (goal: string): Protocol[] => {
  return protocols.filter(p => p.supports.includes(goal as Goal));
};

export const getProtocolById = (id: string): Protocol | undefined => {
  return protocols.find(p => p.id === id);
};
