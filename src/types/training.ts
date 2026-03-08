export interface UserProfile {
  email: string;
  bodyWeight: number;
  currentLifts: {
    squat: { weight: number; reps: number };
    deadlift: { weight: number; reps: number };
    bench: { weight: number; reps: number };
  };
  goals: string;
  targetProgression: {
    squat: string;
    deadlift: string;
    bench: string;
  };
}

export interface TrainingSet {
  id: string;
  type: 'top' | 'backoff' | 'normal';
  targetSets: number;
  targetReps: number;
  targetWeight?: number;
  targetRIR?: number;
  percentage?: number;
  restSeconds?: number;
  notes?: string;
  // Logging
  loggedSets?: LoggedSet[];
  completed?: boolean;
}

export interface LoggedSet {
  setNumber: number;
  weight: number;
  reps: number;
  rir?: number;
  completed: boolean;
}

export interface Exercise {
  id: string;
  name: string;
  category: 'compound' | 'accessory';
  muscleGroup: string;
  sets: TrainingSet[];
}

export interface TrainingDay {
  id: string;
  name: string;
  dayOfWeek: string;
  focus: string;
  exercises: Exercise[];
  completed?: boolean;
  notes?: string;
}

export interface TrainingWeek {
  id: string;
  weekNumber: number;
  days: TrainingDay[];
  completed?: boolean;
}

export interface TrainingBlock {
  id: string;
  name: string;
  goal: string;
  weeks: TrainingWeek[];
  weekRange: string;
}

export interface TrainingProgram {
  id: string;
  name: string;
  description: string;
  durationWeeks: number;
  daysPerWeek: number;
  blocks: TrainingBlock[];
}

export interface WorkoutLog {
  date: string;
  dayId: string;
  exercises: {
    exerciseId: string;
    sets: LoggedSet[];
  }[];
  bodyWeight?: number;
  fatigue?: number;
  notes?: string;
}

export type Estimated1RM = {
  exercise: string;
  weight: number;
  date: string;
};
