/**
 * Top Set Calculation Engine
 * RIR-based autoregulation with fatigue scoring and plateau detection.
 */

// Intensity table: %1RM based on target reps and RIR
const INTENSITY_TABLE: Record<number, Record<number, number>> = {
  // reps -> { rir -> %1RM }
  1:  { 0: 1.00, 1: 0.96, 2: 0.92, 3: 0.89 },
  2:  { 0: 0.96, 1: 0.93, 2: 0.90, 3: 0.87 },
  3:  { 0: 0.93, 1: 0.90, 2: 0.87, 3: 0.84 },
  4:  { 0: 0.90, 1: 0.87, 2: 0.85, 3: 0.82 },
  5:  { 0: 0.87, 1: 0.85, 2: 0.83, 3: 0.80 },
  6:  { 0: 0.85, 1: 0.82, 2: 0.80, 3: 0.77 },
  8:  { 0: 0.80, 1: 0.77, 2: 0.75, 3: 0.72 },
  10: { 0: 0.75, 1: 0.72, 2: 0.70, 3: 0.67 },
  12: { 0: 0.70, 1: 0.67, 2: 0.65, 3: 0.62 },
  15: { 0: 0.65, 1: 0.62, 2: 0.60, 3: 0.57 },
};

/** Look up intensity percentage for given reps/RIR. Interpolates for missing rows. */
export function lookupIntensity(reps: number, rir: number): number {
  const clampedRIR = Math.min(3, Math.max(0, rir));
  
  // Exact match
  if (INTENSITY_TABLE[reps]?.[clampedRIR] !== undefined) {
    return INTENSITY_TABLE[reps][clampedRIR];
  }
  
  // Find nearest rows and interpolate
  const keys = Object.keys(INTENSITY_TABLE).map(Number).sort((a, b) => a - b);
  let lower = keys[0], upper = keys[keys.length - 1];
  
  for (const k of keys) {
    if (k <= reps) lower = k;
    if (k >= reps) { upper = k; break; }
  }
  
  if (lower === upper) return INTENSITY_TABLE[lower][clampedRIR] ?? 0.75;
  
  const lVal = INTENSITY_TABLE[lower][clampedRIR] ?? 0.75;
  const uVal = INTENSITY_TABLE[upper][clampedRIR] ?? 0.75;
  const ratio = (reps - lower) / (upper - lower);
  
  return lVal + (uVal - lVal) * ratio;
}

/** Epley formula for estimated 1RM */
export function estimate1RM(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}

/** Round to nearest plate increment (2.5kg) */
export function roundToPlate(weight: number, increment: number = 2.5): number {
  return Math.round(weight / increment) * increment;
}

/** Autoregulation adjustment based on RIR feedback */
export function getAutoregulationFactor(targetRIR: number, actualRIR: number): number {
  const diff = actualRIR - targetRIR;
  
  if (diff >= 2) return 1.035;   // Way too easy → +3.5%
  if (diff >= 1) return 1.025;   // Too easy → +2.5%
  if (diff === 0) return 1.015;  // On target → +1.5% (normal progression)
  if (diff === -1) return 1.0;   // Slightly hard → maintain
  if (diff <= -2) return 0.97;   // Too hard → -3%
  return 1.0;
}

/** Exercise-specific load increment */
export function getExerciseIncrement(exerciseName: string): number {
  const name = exerciseName.toLowerCase();
  if (name.includes('squat') || name.includes('agachamento')) return 5;
  if (name.includes('deadlift') || name.includes('terra')) return 5;
  if (name.includes('bench') || name.includes('supino')) return 2.5;
  if (name.includes('press') || name.includes('desenvolvimento')) return 2.5;
  return 2.5;
}

export interface SessionData {
  weight: number;
  reps: number;
  rir: number | null;
  targetRIR: number;
  targetReps: number;
}

export interface FatigueInput {
  recentSessions: {
    rirDeviation: number; // actual - target (negative = harder)
    repDropPercent: number; // % drop from first to last backoff set
    volumeLoad: number;
  }[];
  bodyweightChange?: number; // kg change last 7 days
  reportedFatigue?: number; // 1-10 scale
}

/** Calculate fatigue score (0-100) */
export function calculateFatigueScore(input: FatigueInput): number {
  let score = 0;
  
  if (input.recentSessions.length === 0) return 0;
  
  // RIR deviation trend (harder than expected = fatigue)
  const avgRirDev = input.recentSessions.reduce((a, s) => a + s.rirDeviation, 0) / input.recentSessions.length;
  if (avgRirDev < -1) score += 25;
  else if (avgRirDev < 0) score += 15;
  
  // Rep drop in backoff sets
  const avgRepDrop = input.recentSessions.reduce((a, s) => a + s.repDropPercent, 0) / input.recentSessions.length;
  if (avgRepDrop > 20) score += 20;
  else if (avgRepDrop > 10) score += 10;
  
  // Reported fatigue
  if (input.reportedFatigue) {
    score += Math.min(30, (input.reportedFatigue / 10) * 30);
  }
  
  // Consecutive hard sessions
  const hardSessions = input.recentSessions.filter(s => s.rirDeviation < -1).length;
  if (hardSessions >= 3) score += 15;
  else if (hardSessions >= 2) score += 8;
  
  // Bodyweight drop (sign of accumulated stress)
  if (input.bodyweightChange && input.bodyweightChange < -1) score += 10;
  
  return Math.min(100, Math.round(score));
}

/** Get fatigue modifier for top set weight */
export function getFatigueModifier(fatigueScore: number): number {
  if (fatigueScore >= 90) return 0.93; // -7% (deload territory)
  if (fatigueScore >= 75) return 0.97; // -3%
  if (fatigueScore >= 50) return 0.99; // -1%
  return 1.0;
}

export interface PlateauCheckInput {
  e1rmHistory: { date: string; value: number }[];
  rirTrend: number[]; // recent RIR deviations (actual - target)
}

/** Detect plateau: E1RM stagnation + increasing difficulty */
export function detectPlateau(input: PlateauCheckInput): { isPlateau: boolean; weeksStagnat: number } {
  const { e1rmHistory, rirTrend } = input;
  
  if (e1rmHistory.length < 4) return { isPlateau: false, weeksStagnat: 0 };
  
  // Check last 4 data points
  const recent = e1rmHistory.slice(-4);
  const oldest = recent[0].value;
  const newest = recent[recent.length - 1].value;
  const improvement = ((newest - oldest) / oldest) * 100;
  
  // Less than 1% improvement over 4 weeks
  const isStagnant = improvement < 1;
  
  // RIR getting harder (negative deviation trend)
  const avgRirDev = rirTrend.length > 0
    ? rirTrend.reduce((a, b) => a + b, 0) / rirTrend.length
    : 0;
  const isGettingHarder = avgRirDev < -0.5;
  
  const isPlateau = isStagnant && isGettingHarder;
  
  // Count weeks of stagnation
  let weeksStagnat = 0;
  for (let i = e1rmHistory.length - 1; i >= 1; i--) {
    const change = ((e1rmHistory[i].value - e1rmHistory[i - 1].value) / e1rmHistory[i - 1].value) * 100;
    if (change < 0.5) weeksStagnat++;
    else break;
  }
  
  return { isPlateau, weeksStagnat };
}

/** Main top set calculation pipeline */
export function calculateTopSet(params: {
  estimated1RM: number;
  targetReps: number;
  targetRIR: number;
  lastSession?: SessionData;
  fatigueScore?: number;
  exerciseName?: string;
}): {
  weight: number;
  intensity: number;
  autoregFactor: number;
  fatigueFactor: number;
  baseWeight: number;
} {
  const { estimated1RM, targetReps, targetRIR, lastSession, fatigueScore, exerciseName } = params;
  
  // 1. Look up intensity
  const intensity = lookupIntensity(targetReps, targetRIR);
  
  // 2. Base weight
  const baseWeight = estimated1RM * intensity;
  
  // 3. Autoregulation adjustment
  let autoregFactor = 1.0;
  if (lastSession && lastSession.rir !== null) {
    autoregFactor = getAutoregulationFactor(lastSession.targetRIR, lastSession.rir);
  }
  
  // 4. Fatigue adjustment
  const fatigueFactor = getFatigueModifier(fatigueScore ?? 0);
  
  // 5. Calculate and round
  const rawWeight = baseWeight * autoregFactor * fatigueFactor;
  const increment = exerciseName ? getExerciseIncrement(exerciseName) : 2.5;
  const weight = roundToPlate(rawWeight, increment);
  
  return {
    weight,
    intensity,
    autoregFactor,
    fatigueFactor,
    baseWeight: roundToPlate(baseWeight, increment),
  };
}
