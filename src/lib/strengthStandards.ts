// Strength standards based on bodyweight ratios
export interface StrengthLevel {
  label: string;
  color: string;
  bgColor: string;
  min: number;
}

export const STRENGTH_LEVELS: StrengthLevel[] = [
  { label: 'Iniciante', color: 'text-muted-foreground', bgColor: 'bg-muted', min: 0 },
  { label: 'Novato', color: 'text-blue-400', bgColor: 'bg-blue-500/20', min: 0.5 },
  { label: 'Intermediário', color: 'text-green-400', bgColor: 'bg-green-500/20', min: 1.0 },
  { label: 'Avançado', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20', min: 1.5 },
  { label: 'Elite', color: 'text-red-400', bgColor: 'bg-red-500/20', min: 2.0 },
];

const STANDARDS: Record<string, number[]> = {
  squat:    [0, 0.75, 1.25, 1.75, 2.5],
  bench:    [0, 0.50, 1.00, 1.50, 2.0],
  deadlift: [0, 0.75, 1.50, 2.00, 2.75],
};

export function getStrengthLevel(exercise: 'squat' | 'bench' | 'deadlift', e1rm: number, bodyWeight: number) {
  const ratio = bodyWeight > 0 ? e1rm / bodyWeight : 0;
  const thresholds = STANDARDS[exercise];
  let levelIdx = 0;
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (ratio >= thresholds[i]) { levelIdx = i; break; }
  }
  const level = STRENGTH_LEVELS[levelIdx];
  const nextLevel = levelIdx < STRENGTH_LEVELS.length - 1 ? STRENGTH_LEVELS[levelIdx + 1] : null;
  const nextThreshold = levelIdx < thresholds.length - 1 ? thresholds[levelIdx + 1] : thresholds[thresholds.length - 1];
  const kgToNext = Math.max(0, Math.round((nextThreshold * bodyWeight - e1rm) * 10) / 10);
  return { level, ratio: Math.round(ratio * 100) / 100, nextLevel, kgToNext };
}

export function getOverallLevel(squat1RM: number, bench1RM: number, deadlift1RM: number, bodyWeight: number) {
  const sq = getStrengthLevel('squat', squat1RM, bodyWeight);
  const bn = getStrengthLevel('bench', bench1RM, bodyWeight);
  const dl = getStrengthLevel('deadlift', deadlift1RM, bodyWeight);
  const avgIdx = Math.round((STRENGTH_LEVELS.indexOf(sq.level) + STRENGTH_LEVELS.indexOf(bn.level) + STRENGTH_LEVELS.indexOf(dl.level)) / 3);
  return { squat: sq, bench: bn, deadlift: dl, overall: STRENGTH_LEVELS[avgIdx], total: squat1RM + bench1RM + deadlift1RM };
}

// Legacy ACHIEVEMENT_DEFS kept for backward compat but now we use achievement_levels table
export const ACHIEVEMENT_DEFS = [
  { type: 'squat_100', title: 'Agachamento 100kg', description: 'Agachamento de 100kg', exercise: 'squat', threshold: 100, icon: '💪' },
  { type: 'squat_140', title: 'Agachamento 140kg', description: 'Agachamento de 140kg', exercise: 'squat', threshold: 140, icon: '🔥' },
  { type: 'squat_180', title: 'Agachamento 180kg', description: 'Agachamento de 180kg', exercise: 'squat', threshold: 180, icon: '💎' },
  { type: 'bench_60', title: 'Supino 60kg', description: 'Supino de 60kg', exercise: 'bench', threshold: 60, icon: '💪' },
  { type: 'bench_100', title: 'Supino 100kg', description: 'Supino de 100kg', exercise: 'bench', threshold: 100, icon: '🔥' },
  { type: 'bench_140', title: 'Supino 140kg', description: 'Supino de 140kg', exercise: 'bench', threshold: 140, icon: '💎' },
  { type: 'deadlift_100', title: 'Terra 100kg', description: 'Terra de 100kg', exercise: 'deadlift', threshold: 100, icon: '🏋️' },
  { type: 'deadlift_180', title: 'Terra 180kg', description: 'Terra de 180kg', exercise: 'deadlift', threshold: 180, icon: '🔥' },
  { type: 'deadlift_220', title: 'Terra 220kg', description: 'Terra de 220kg', exercise: 'deadlift', threshold: 220, icon: '💎' },
  { type: 'total_300', title: 'Total 300kg', description: 'Total de 300kg', exercise: 'total', threshold: 300, icon: '⭐' },
  { type: 'total_400', title: 'Total 400kg', description: 'Total de 400kg', exercise: 'total', threshold: 400, icon: '🌟' },
  { type: 'total_500', title: 'Total 500kg', description: 'Total de 500kg', exercise: 'total', threshold: 500, icon: '👑' },
];
