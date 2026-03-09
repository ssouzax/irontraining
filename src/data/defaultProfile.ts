import { UserProfile, TrainingProgram } from '@/types/training';
import { defaultProgram } from '@/data/program';

// Empty profile for new users
export const defaultProfile: UserProfile = {
  email: '',
  bodyWeight: 0,
  currentLifts: {
    squat: { weight: 0, reps: 0 },
    deadlift: { weight: 0, reps: 0 },
    bench: { weight: 0, reps: 0 },
  },
  goals: '',
  targetProgression: {
    squat: '',
    deadlift: '',
    bench: '',
  },
};

// Profile with data only for the owner account
export const ownerProfile: UserProfile = {
  email: 'Samuelsouzapon@gmail.com',
  bodyWeight: 94,
  currentLifts: {
    squat: { weight: 150, reps: 4 },
    deadlift: { weight: 177.5, reps: 1 },
    bench: { weight: 90, reps: 5 },
  },
  goals: 'Increase strength while building muscle',
  targetProgression: {
    squat: '180–190 kg',
    deadlift: '185–200 kg',
    bench: '+5–10 kg',
  },
};

export function getProfileForUser(email: string | undefined): UserProfile {
  if (email?.toLowerCase() === 'samuelsouzapon@gmail.com') {
    return ownerProfile;
  }
  return defaultProfile;
}

// Estimated 1RM using Epley formula: weight * (1 + reps/30)
export function calculate1RM(weight: number, reps: number): number {
  if (reps === 1) return weight;
  if (reps === 0 || weight === 0) return 0;
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}
