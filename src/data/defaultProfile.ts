import { UserProfile } from '@/types/training';

export const defaultProfile: UserProfile = {
  email: 'Samuelsouzapon@gmail.com',
  bodyWeight: 94,
  currentLifts: {
    squat: { weight: 150, reps: 4 },
    deadlift: { weight: 177.5, reps: 1 },
    bench: { weight: 90, reps: 5 }, // 45kg each side
  },
  goals: 'Increase strength while building muscle',
  targetProgression: {
    squat: '180–190 kg',
    deadlift: '185–200 kg',
    bench: '+5–10 kg',
  },
};

// Estimated 1RM using Epley formula: weight * (1 + reps/30)
export function calculate1RM(weight: number, reps: number): number {
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}
