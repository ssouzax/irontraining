import { TrainingProgram } from '@/types/training';

const uid = () => crypto.randomUUID();

function makeExercise(name: string, category: 'compound' | 'accessory', muscleGroup: string, sets: any[]) {
  return { id: uid(), name, category, muscleGroup, sets };
}

function topSet(reps: number, rir: number, weight?: number) {
  return { id: uid(), type: 'top' as const, targetSets: 1, targetReps: reps, targetRIR: rir, targetWeight: weight, restSeconds: 180 };
}
function backoffSet(sets: number, reps: number, percentage?: number) {
  return { id: uid(), type: 'backoff' as const, targetSets: sets, targetReps: reps, percentage, restSeconds: 150 };
}
function normalSet(sets: number, reps: number, rir?: number) {
  return { id: uid(), type: 'normal' as const, targetSets: sets, targetReps: reps, targetRIR: rir, restSeconds: 90 };
}

// BLOCK 1 — Hypertrophy (weeks 1-4)
function block1Days() {
  return [
    { id: uid(), name: 'Push Day', dayOfWeek: 'Monday', focus: 'Push', exercises: [
      makeExercise('Bench Press', 'compound', 'Chest', [topSet(6, 2), backoffSet(4, 6, 90)]),
      makeExercise('Overhead Press', 'compound', 'Shoulders', [normalSet(4, 8, 2)]),
      makeExercise('Incline Dumbbell Press', 'accessory', 'Chest', [normalSet(3, 10, 2)]),
      makeExercise('Lateral Raises', 'accessory', 'Shoulders', [normalSet(4, 15, 2)]),
      makeExercise('Tricep Pushdowns', 'accessory', 'Triceps', [normalSet(3, 12, 2)]),
      makeExercise('Overhead Tricep Extension', 'accessory', 'Triceps', [normalSet(3, 12, 2)]),
    ]},
    { id: uid(), name: 'Squat Day', dayOfWeek: 'Tuesday', focus: 'Squat', exercises: [
      makeExercise('Back Squat', 'compound', 'Quads', [topSet(6, 2), backoffSet(4, 6)]),
      makeExercise('Leg Press', 'accessory', 'Quads', [normalSet(4, 10, 2)]),
      makeExercise('Walking Lunges', 'accessory', 'Quads', [normalSet(3, 12, 2)]),
      makeExercise('Leg Extensions', 'accessory', 'Quads', [normalSet(3, 15, 2)]),
      makeExercise('Calf Raises', 'accessory', 'Calves', [normalSet(4, 15, 2)]),
    ]},
    { id: uid(), name: 'Pull Day', dayOfWeek: 'Wednesday', focus: 'Pull', exercises: [
      makeExercise('Barbell Row', 'compound', 'Back', [normalSet(4, 8, 2)]),
      makeExercise('Weighted Pull-ups', 'compound', 'Back', [normalSet(4, 8, 2)]),
      makeExercise('Cable Row', 'accessory', 'Back', [normalSet(3, 10, 2)]),
      makeExercise('Face Pulls', 'accessory', 'Rear Delts', [normalSet(3, 15, 2)]),
      makeExercise('Barbell Curl', 'accessory', 'Biceps', [normalSet(3, 10, 2)]),
      makeExercise('Hammer Curls', 'accessory', 'Biceps', [normalSet(3, 12, 2)]),
    ]},
    { id: uid(), name: 'Posterior + Chest', dayOfWeek: 'Thursday', focus: 'Posterior + Chest', exercises: [
      makeExercise('Romanian Deadlift', 'compound', 'Hamstrings', [normalSet(4, 8, 2)]),
      makeExercise('Dumbbell Bench Press', 'compound', 'Chest', [normalSet(4, 10, 2)]),
      makeExercise('Leg Curl', 'accessory', 'Hamstrings', [normalSet(3, 12, 2)]),
      makeExercise('Cable Flyes', 'accessory', 'Chest', [normalSet(3, 12, 2)]),
      makeExercise('Hip Thrust', 'accessory', 'Glutes', [normalSet(3, 10, 2)]),
      makeExercise('Ab Rollouts', 'accessory', 'Core', [normalSet(3, 12)]),
    ]},
    { id: uid(), name: 'Deadlift Day', dayOfWeek: 'Friday', focus: 'Deadlift', exercises: [
      makeExercise('Conventional Deadlift', 'compound', 'Back/Hams', [topSet(5, 2), backoffSet(4, 5)]),
      makeExercise('Front Squat', 'compound', 'Quads', [normalSet(3, 6, 2)]),
      makeExercise('Good Mornings', 'accessory', 'Lower Back', [normalSet(3, 10, 2)]),
      makeExercise('Pendlay Row', 'accessory', 'Back', [normalSet(3, 8, 2)]),
      makeExercise('Farmer Walks', 'accessory', 'Grip/Core', [normalSet(3, 1)]),
    ]},
  ];
}

// BLOCK 2 — Strength (weeks 5-8)
function block2Days() {
  return [
    { id: uid(), name: 'Push Day', dayOfWeek: 'Monday', focus: 'Push', exercises: [
      makeExercise('Bench Press', 'compound', 'Chest', [topSet(4, 1), backoffSet(4, 4, 90)]),
      makeExercise('Overhead Press', 'compound', 'Shoulders', [normalSet(4, 6, 2)]),
      makeExercise('Close Grip Bench', 'accessory', 'Triceps', [normalSet(3, 8, 2)]),
      makeExercise('Lateral Raises', 'accessory', 'Shoulders', [normalSet(3, 10, 2)]),
      makeExercise('Dips', 'accessory', 'Chest/Triceps', [normalSet(3, 8, 2)]),
    ]},
    { id: uid(), name: 'Squat Day', dayOfWeek: 'Tuesday', focus: 'Squat', exercises: [
      makeExercise('Back Squat', 'compound', 'Quads', [topSet(4, 1), backoffSet(4, 4)]),
      makeExercise('Pause Squat', 'compound', 'Quads', [normalSet(3, 4, 2)]),
      makeExercise('Leg Press', 'accessory', 'Quads', [normalSet(3, 8, 2)]),
      makeExercise('Leg Extensions', 'accessory', 'Quads', [normalSet(3, 10, 2)]),
      makeExercise('Calf Raises', 'accessory', 'Calves', [normalSet(4, 12, 2)]),
    ]},
    { id: uid(), name: 'Pull Day', dayOfWeek: 'Wednesday', focus: 'Pull', exercises: [
      makeExercise('Barbell Row', 'compound', 'Back', [normalSet(4, 6, 2)]),
      makeExercise('Weighted Pull-ups', 'compound', 'Back', [normalSet(4, 6, 2)]),
      makeExercise('T-Bar Row', 'accessory', 'Back', [normalSet(3, 8, 2)]),
      makeExercise('Face Pulls', 'accessory', 'Rear Delts', [normalSet(3, 12, 2)]),
      makeExercise('Barbell Curl', 'accessory', 'Biceps', [normalSet(3, 8, 2)]),
    ]},
    { id: uid(), name: 'Posterior + Chest', dayOfWeek: 'Thursday', focus: 'Posterior + Chest', exercises: [
      makeExercise('Romanian Deadlift', 'compound', 'Hamstrings', [normalSet(4, 6, 2)]),
      makeExercise('Incline Bench Press', 'compound', 'Chest', [normalSet(4, 6, 2)]),
      makeExercise('Leg Curl', 'accessory', 'Hamstrings', [normalSet(3, 10, 2)]),
      makeExercise('Cable Flyes', 'accessory', 'Chest', [normalSet(3, 10, 2)]),
      makeExercise('Hip Thrust', 'accessory', 'Glutes', [normalSet(3, 8, 2)]),
    ]},
    { id: uid(), name: 'Deadlift Day', dayOfWeek: 'Friday', focus: 'Deadlift', exercises: [
      makeExercise('Conventional Deadlift', 'compound', 'Back/Hams', [topSet(3, 1), backoffSet(4, 3)]),
      makeExercise('Deficit Deadlift', 'compound', 'Back/Hams', [normalSet(3, 4, 2)]),
      makeExercise('Front Squat', 'compound', 'Quads', [normalSet(3, 4, 2)]),
      makeExercise('Pendlay Row', 'accessory', 'Back', [normalSet(3, 6, 2)]),
    ]},
  ];
}

// BLOCK 3 — Peaking (weeks 9-11)
function block3Days() {
  return [
    { id: uid(), name: 'Push Day', dayOfWeek: 'Monday', focus: 'Push', exercises: [
      makeExercise('Bench Press', 'compound', 'Chest', [topSet(2, 1), backoffSet(3, 3, 90)]),
      makeExercise('Overhead Press', 'compound', 'Shoulders', [normalSet(3, 5, 1)]),
      makeExercise('Close Grip Bench', 'accessory', 'Triceps', [normalSet(3, 6, 2)]),
      makeExercise('Lateral Raises', 'accessory', 'Shoulders', [normalSet(3, 10, 2)]),
    ]},
    { id: uid(), name: 'Squat Day', dayOfWeek: 'Tuesday', focus: 'Squat', exercises: [
      makeExercise('Back Squat', 'compound', 'Quads', [topSet(2, 1), backoffSet(3, 3)]),
      makeExercise('Pause Squat', 'compound', 'Quads', [normalSet(2, 3, 1)]),
      makeExercise('Leg Press', 'accessory', 'Quads', [normalSet(3, 6, 2)]),
      makeExercise('Calf Raises', 'accessory', 'Calves', [normalSet(3, 12, 2)]),
    ]},
    { id: uid(), name: 'Pull Day', dayOfWeek: 'Wednesday', focus: 'Pull', exercises: [
      makeExercise('Barbell Row', 'compound', 'Back', [normalSet(3, 5, 2)]),
      makeExercise('Weighted Pull-ups', 'compound', 'Back', [normalSet(3, 5, 2)]),
      makeExercise('Face Pulls', 'accessory', 'Rear Delts', [normalSet(3, 12, 2)]),
      makeExercise('Barbell Curl', 'accessory', 'Biceps', [normalSet(3, 8, 2)]),
    ]},
    { id: uid(), name: 'Posterior + Chest', dayOfWeek: 'Thursday', focus: 'Posterior + Chest', exercises: [
      makeExercise('Romanian Deadlift', 'compound', 'Hamstrings', [normalSet(3, 5, 2)]),
      makeExercise('Incline Bench Press', 'compound', 'Chest', [normalSet(3, 5, 2)]),
      makeExercise('Leg Curl', 'accessory', 'Hamstrings', [normalSet(3, 8, 2)]),
      makeExercise('Ab Rollouts', 'accessory', 'Core', [normalSet(3, 10)]),
    ]},
    { id: uid(), name: 'Deadlift Day', dayOfWeek: 'Friday', focus: 'Deadlift', exercises: [
      makeExercise('Conventional Deadlift', 'compound', 'Back/Hams', [topSet(1, 0), backoffSet(3, 2)]),
      makeExercise('Front Squat', 'compound', 'Quads', [normalSet(2, 3, 2)]),
      makeExercise('Pendlay Row', 'accessory', 'Back', [normalSet(3, 5, 2)]),
    ]},
  ];
}

// WEEK 12 — PR Testing
function prTestingDays() {
  return [
    { id: uid(), name: 'Bench PR Test', dayOfWeek: 'Monday', focus: 'Bench PR', exercises: [
      makeExercise('Bench Press - PR Test', 'compound', 'Chest', [
        { id: uid(), type: 'normal' as const, targetSets: 1, targetReps: 5, notes: 'Warm-up: light', restSeconds: 120 },
        { id: uid(), type: 'normal' as const, targetSets: 1, targetReps: 3, notes: 'Warm-up: moderate', restSeconds: 150 },
        { id: uid(), type: 'normal' as const, targetSets: 1, targetReps: 1, notes: 'Heavy single', restSeconds: 180 },
        { id: uid(), type: 'top' as const, targetSets: 1, targetReps: 1, targetRIR: 0, notes: 'PR Attempt', restSeconds: 300 },
      ]),
    ]},
    { id: uid(), name: 'Squat PR Test', dayOfWeek: 'Tuesday', focus: 'Squat PR', exercises: [
      makeExercise('Back Squat - PR Test', 'compound', 'Quads', [
        { id: uid(), type: 'normal' as const, targetSets: 1, targetReps: 5, notes: 'Warm-up: 70kg', restSeconds: 120 },
        { id: uid(), type: 'normal' as const, targetSets: 1, targetReps: 3, notes: 'Warm-up: 110kg', restSeconds: 150 },
        { id: uid(), type: 'normal' as const, targetSets: 1, targetReps: 2, notes: 'Warm-up: 140kg', restSeconds: 180 },
        { id: uid(), type: 'normal' as const, targetSets: 1, targetReps: 1, notes: '160kg', restSeconds: 240 },
        { id: uid(), type: 'top' as const, targetSets: 1, targetReps: 1, targetRIR: 0, notes: 'PR Attempt: 180-190kg', restSeconds: 300 },
      ]),
    ]},
    { id: uid(), name: 'Rest', dayOfWeek: 'Wednesday', focus: 'Recovery', exercises: [] },
    { id: uid(), name: 'Deadlift PR Test', dayOfWeek: 'Thursday', focus: 'Deadlift PR', exercises: [
      makeExercise('Conventional Deadlift - PR Test', 'compound', 'Back/Hams', [
        { id: uid(), type: 'normal' as const, targetSets: 1, targetReps: 5, notes: 'Warm-up: 70kg', restSeconds: 120 },
        { id: uid(), type: 'normal' as const, targetSets: 1, targetReps: 3, notes: 'Warm-up: 110kg', restSeconds: 150 },
        { id: uid(), type: 'normal' as const, targetSets: 1, targetReps: 2, notes: '140kg', restSeconds: 180 },
        { id: uid(), type: 'normal' as const, targetSets: 1, targetReps: 1, notes: '160kg', restSeconds: 240 },
        { id: uid(), type: 'normal' as const, targetSets: 1, targetReps: 1, notes: '170kg', restSeconds: 240 },
        { id: uid(), type: 'top' as const, targetSets: 1, targetReps: 1, targetRIR: 0, notes: 'PR Attempt: 185-200kg', restSeconds: 300 },
      ]),
    ]},
    { id: uid(), name: 'Rest', dayOfWeek: 'Friday', focus: 'Recovery', exercises: [] },
  ];
}

function makeWeeks(blockNum: number, startWeek: number, endWeek: number, daysFn: () => any[]) {
  const weeks = [];
  for (let w = startWeek; w <= endWeek; w++) {
    weeks.push({
      id: uid(),
      weekNumber: w,
      days: daysFn(),
    });
  }
  return weeks;
}

export const defaultProgram: TrainingProgram = {
  id: uid(),
  name: '12-Week Powerbuilding Program',
  description: 'Periodized program combining hypertrophy and strength phases, culminating in PR testing.',
  durationWeeks: 12,
  daysPerWeek: 5,
  blocks: [
    {
      id: uid(),
      name: 'Block 1 — Hypertrophy',
      goal: 'Hypertrophy and technical volume. Top sets at RIR 2.',
      weekRange: 'Weeks 1–4',
      weeks: makeWeeks(1, 1, 4, block1Days),
    },
    {
      id: uid(),
      name: 'Block 2 — Strength',
      goal: 'Strength development. Top sets at RIR 1–2.',
      weekRange: 'Weeks 5–8',
      weeks: makeWeeks(2, 5, 8, block2Days),
    },
    {
      id: uid(),
      name: 'Block 3 — Peaking',
      goal: 'Neural intensity and peaking. Low reps, high intensity.',
      weekRange: 'Weeks 9–11',
      weeks: makeWeeks(3, 9, 11, block3Days),
    },
    {
      id: uid(),
      name: 'Block 4 — PR Testing',
      goal: 'Max attempt week. Test your new PRs.',
      weekRange: 'Week 12',
      weeks: [{
        id: uid(),
        weekNumber: 12,
        days: prTestingDays(),
      }],
    },
  ],
};
