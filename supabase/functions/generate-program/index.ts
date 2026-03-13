import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ═══════════════════════════════════════════════════════════════
// EXERCISE POOLS — 100% deterministic, no AI needed
// ═══════════════════════════════════════════════════════════════

interface ExerciseTemplate {
  name: string;
  category: "compound" | "accessory";
  muscleGroup: string;
}

const POOLS: Record<string, { main: ExerciseTemplate[]; compound: ExerciseTemplate[]; accessory: ExerciseTemplate[]; isolation: ExerciseTemplate[] }> = {
  push: {
    main: [
      { name: "Supino reto com barra", category: "compound", muscleGroup: "Peito" },
    ],
    compound: [
      { name: "Supino inclinado com halteres", category: "compound", muscleGroup: "Peito" },
      { name: "Desenvolvimento militar com barra", category: "compound", muscleGroup: "Ombros" },
      { name: "Supino declinado", category: "compound", muscleGroup: "Peito" },
      { name: "Desenvolvimento com halteres", category: "compound", muscleGroup: "Ombros" },
      { name: "Supino máquina", category: "compound", muscleGroup: "Peito" },
    ],
    accessory: [
      { name: "Elevação lateral", category: "accessory", muscleGroup: "Ombros" },
      { name: "Crucifixo inclinado", category: "accessory", muscleGroup: "Peito" },
      { name: "Crossover", category: "accessory", muscleGroup: "Peito" },
      { name: "Elevação frontal", category: "accessory", muscleGroup: "Ombros" },
      { name: "Fly na máquina (peck deck)", category: "accessory", muscleGroup: "Peito" },
    ],
    isolation: [
      { name: "Tríceps corda", category: "accessory", muscleGroup: "Tríceps" },
      { name: "Tríceps francês", category: "accessory", muscleGroup: "Tríceps" },
      { name: "Tríceps testa", category: "accessory", muscleGroup: "Tríceps" },
      { name: "Tríceps no mergulho", category: "accessory", muscleGroup: "Tríceps" },
      { name: "Tríceps pulley reto", category: "accessory", muscleGroup: "Tríceps" },
    ],
  },
  pull: {
    main: [
      { name: "Barra fixa", category: "compound", muscleGroup: "Costas" },
    ],
    compound: [
      { name: "Remada curvada com barra", category: "compound", muscleGroup: "Costas" },
      { name: "Puxada frontal", category: "compound", muscleGroup: "Costas" },
      { name: "Remada cavaleiro", category: "compound", muscleGroup: "Costas" },
      { name: "Remada unilateral com halter", category: "compound", muscleGroup: "Costas" },
      { name: "Remada baixa no cabo", category: "compound", muscleGroup: "Costas" },
    ],
    accessory: [
      { name: "Face pull", category: "accessory", muscleGroup: "Ombros" },
      { name: "Pullover na polia", category: "accessory", muscleGroup: "Costas" },
      { name: "Encolhimento com barra", category: "accessory", muscleGroup: "Trapézio" },
      { name: "Remada alta", category: "accessory", muscleGroup: "Trapézio" },
    ],
    isolation: [
      { name: "Rosca direta com barra", category: "accessory", muscleGroup: "Bíceps" },
      { name: "Rosca alternada com halteres", category: "accessory", muscleGroup: "Bíceps" },
      { name: "Rosca martelo", category: "accessory", muscleGroup: "Bíceps" },
      { name: "Rosca scott", category: "accessory", muscleGroup: "Bíceps" },
      { name: "Rosca concentrada", category: "accessory", muscleGroup: "Bíceps" },
    ],
  },
  legs: {
    main: [
      { name: "Agachamento livre", category: "compound", muscleGroup: "Quadríceps" },
    ],
    compound: [
      { name: "Leg press 45°", category: "compound", muscleGroup: "Quadríceps" },
      { name: "Agachamento hack", category: "compound", muscleGroup: "Quadríceps" },
      { name: "Agachamento búlgaro", category: "compound", muscleGroup: "Quadríceps" },
      { name: "Passada com halteres", category: "compound", muscleGroup: "Quadríceps" },
    ],
    accessory: [
      { name: "Cadeira extensora", category: "accessory", muscleGroup: "Quadríceps" },
      { name: "Cadeira flexora", category: "accessory", muscleGroup: "Posterior" },
      { name: "Stiff com barra", category: "accessory", muscleGroup: "Posterior" },
      { name: "Abdução de quadril", category: "accessory", muscleGroup: "Glúteos" },
    ],
    isolation: [
      { name: "Panturrilha em pé", category: "accessory", muscleGroup: "Panturrilha" },
      { name: "Panturrilha sentado", category: "accessory", muscleGroup: "Panturrilha" },
      { name: "Abdominal no cabo", category: "accessory", muscleGroup: "Abdômen" },
    ],
  },
  posterior: {
    main: [
      { name: "Levantamento terra romeno", category: "compound", muscleGroup: "Posterior" },
    ],
    compound: [
      { name: "Stiff com barra", category: "compound", muscleGroup: "Posterior" },
      { name: "Hip thrust com barra", category: "compound", muscleGroup: "Glúteos" },
      { name: "Agachamento sumô", category: "compound", muscleGroup: "Glúteos" },
      { name: "Good morning", category: "compound", muscleGroup: "Posterior" },
    ],
    accessory: [
      { name: "Cadeira flexora", category: "accessory", muscleGroup: "Posterior" },
      { name: "Mesa flexora", category: "accessory", muscleGroup: "Posterior" },
      { name: "Elevação pélvica", category: "accessory", muscleGroup: "Glúteos" },
      { name: "Abdução na máquina", category: "accessory", muscleGroup: "Glúteos" },
    ],
    isolation: [
      { name: "Panturrilha no leg press", category: "accessory", muscleGroup: "Panturrilha" },
      { name: "Hiperextensão lombar", category: "accessory", muscleGroup: "Lombar" },
      { name: "Abdominal infra", category: "accessory", muscleGroup: "Abdômen" },
    ],
  },
  upper: {
    main: [
      { name: "Supino reto com barra", category: "compound", muscleGroup: "Peito" },
    ],
    compound: [
      { name: "Remada curvada com barra", category: "compound", muscleGroup: "Costas" },
      { name: "Desenvolvimento militar", category: "compound", muscleGroup: "Ombros" },
      { name: "Puxada frontal", category: "compound", muscleGroup: "Costas" },
      { name: "Supino inclinado com halteres", category: "compound", muscleGroup: "Peito" },
    ],
    accessory: [
      { name: "Elevação lateral", category: "accessory", muscleGroup: "Ombros" },
      { name: "Face pull", category: "accessory", muscleGroup: "Ombros" },
    ],
    isolation: [
      { name: "Rosca direta", category: "accessory", muscleGroup: "Bíceps" },
      { name: "Tríceps corda", category: "accessory", muscleGroup: "Tríceps" },
      { name: "Rosca martelo", category: "accessory", muscleGroup: "Bíceps" },
      { name: "Tríceps testa", category: "accessory", muscleGroup: "Tríceps" },
    ],
  },
  fullbody: {
    main: [
      { name: "Agachamento livre", category: "compound", muscleGroup: "Quadríceps" },
    ],
    compound: [
      { name: "Supino reto com barra", category: "compound", muscleGroup: "Peito" },
      { name: "Remada curvada com barra", category: "compound", muscleGroup: "Costas" },
      { name: "Desenvolvimento militar", category: "compound", muscleGroup: "Ombros" },
      { name: "Levantamento terra romeno", category: "compound", muscleGroup: "Posterior" },
    ],
    accessory: [
      { name: "Leg press 45°", category: "compound", muscleGroup: "Quadríceps" },
      { name: "Puxada frontal", category: "accessory", muscleGroup: "Costas" },
      { name: "Elevação lateral", category: "accessory", muscleGroup: "Ombros" },
    ],
    isolation: [
      { name: "Rosca direta", category: "accessory", muscleGroup: "Bíceps" },
      { name: "Tríceps corda", category: "accessory", muscleGroup: "Tríceps" },
      { name: "Panturrilha em pé", category: "accessory", muscleGroup: "Panturrilha" },
    ],
  },
  lower: {
    main: [
      { name: "Agachamento livre", category: "compound", muscleGroup: "Quadríceps" },
    ],
    compound: [
      { name: "Leg press 45°", category: "compound", muscleGroup: "Quadríceps" },
      { name: "Levantamento terra romeno", category: "compound", muscleGroup: "Posterior" },
      { name: "Hip thrust com barra", category: "compound", muscleGroup: "Glúteos" },
      { name: "Agachamento búlgaro", category: "compound", muscleGroup: "Quadríceps" },
    ],
    accessory: [
      { name: "Cadeira extensora", category: "accessory", muscleGroup: "Quadríceps" },
      { name: "Cadeira flexora", category: "accessory", muscleGroup: "Posterior" },
      { name: "Stiff com halteres", category: "accessory", muscleGroup: "Posterior" },
      { name: "Abdução na máquina", category: "accessory", muscleGroup: "Glúteos" },
    ],
    isolation: [
      { name: "Panturrilha em pé", category: "accessory", muscleGroup: "Panturrilha" },
      { name: "Panturrilha sentado", category: "accessory", muscleGroup: "Panturrilha" },
      { name: "Abdominal no cabo", category: "accessory", muscleGroup: "Abdômen" },
    ],
  },
  deadlift: {
    main: [
      { name: "Levantamento terra convencional", category: "compound", muscleGroup: "Posterior" },
    ],
    compound: [
      { name: "Remada curvada com barra", category: "compound", muscleGroup: "Costas" },
      { name: "Hip thrust com barra", category: "compound", muscleGroup: "Glúteos" },
      { name: "Good morning", category: "compound", muscleGroup: "Posterior" },
    ],
    accessory: [
      { name: "Puxada frontal", category: "accessory", muscleGroup: "Costas" },
      { name: "Cadeira flexora", category: "accessory", muscleGroup: "Posterior" },
      { name: "Face pull", category: "accessory", muscleGroup: "Ombros" },
    ],
    isolation: [
      { name: "Rosca direta", category: "accessory", muscleGroup: "Bíceps" },
      { name: "Hiperextensão lombar", category: "accessory", muscleGroup: "Lombar" },
      { name: "Encolhimento com halteres", category: "accessory", muscleGroup: "Trapézio" },
    ],
  },
  shoulders_arms: {
    main: [
      { name: "Desenvolvimento militar com barra", category: "compound", muscleGroup: "Ombros" },
    ],
    compound: [
      { name: "Desenvolvimento Arnold", category: "compound", muscleGroup: "Ombros" },
      { name: "Supino fechado", category: "compound", muscleGroup: "Tríceps" },
    ],
    accessory: [
      { name: "Elevação lateral", category: "accessory", muscleGroup: "Ombros" },
      { name: "Elevação lateral inclinada", category: "accessory", muscleGroup: "Ombros" },
      { name: "Crucifixo inverso", category: "accessory", muscleGroup: "Ombros" },
    ],
    isolation: [
      { name: "Rosca direta com barra W", category: "accessory", muscleGroup: "Bíceps" },
      { name: "Rosca martelo", category: "accessory", muscleGroup: "Bíceps" },
      { name: "Tríceps francês", category: "accessory", muscleGroup: "Tríceps" },
      { name: "Tríceps corda", category: "accessory", muscleGroup: "Tríceps" },
    ],
  },
  chest_back: {
    main: [
      { name: "Supino reto com barra", category: "compound", muscleGroup: "Peito" },
    ],
    compound: [
      { name: "Barra fixa", category: "compound", muscleGroup: "Costas" },
      { name: "Supino inclinado com halteres", category: "compound", muscleGroup: "Peito" },
      { name: "Remada curvada com barra", category: "compound", muscleGroup: "Costas" },
    ],
    accessory: [
      { name: "Crossover", category: "accessory", muscleGroup: "Peito" },
      { name: "Remada baixa no cabo", category: "accessory", muscleGroup: "Costas" },
      { name: "Pullover na polia", category: "accessory", muscleGroup: "Costas" },
    ],
    isolation: [
      { name: "Fly na máquina (peck deck)", category: "accessory", muscleGroup: "Peito" },
      { name: "Face pull", category: "accessory", muscleGroup: "Ombros" },
    ],
  },
  recovery: {
    main: [
      { name: "Prancha abdominal", category: "accessory", muscleGroup: "Abdômen" },
    ],
    compound: [
      { name: "Agachamento corporal", category: "compound", muscleGroup: "Quadríceps" },
    ],
    accessory: [
      { name: "Abdominal crunch", category: "accessory", muscleGroup: "Abdômen" },
      { name: "Prancha lateral", category: "accessory", muscleGroup: "Abdômen" },
      { name: "Elevação de quadril", category: "accessory", muscleGroup: "Glúteos" },
    ],
    isolation: [
      { name: "Panturrilha em pé", category: "accessory", muscleGroup: "Panturrilha" },
      { name: "Rotação externa de ombro", category: "accessory", muscleGroup: "Ombros" },
    ],
  },
};

// ═══════════════════════════════════════════════════════════════
// BLOCK DEFINITIONS — fixed periodization
// ═══════════════════════════════════════════════════════════════

interface BlockDef {
  name: string;
  goal: string;
  blockType: string;
  startWeek: number;
  endWeek: number;
  weekConfigs: { sets: number; reps: number; rir: number }[];
}

function buildBlocks(): BlockDef[] {
  return [
    {
      name: "Base / Hipertrofia",
      goal: "Adaptação, volume e hipertrofia",
      blockType: "hypertrophy",
      startWeek: 1, endWeek: 3,
      weekConfigs: [
        { sets: 3, reps: 12, rir: 3 },
        { sets: 4, reps: 10, rir: 2 },
        { sets: 4, reps: 8, rir: 2 },
      ],
    },
    {
      name: "Hipertrofia Intensa",
      goal: "Maximizar crescimento muscular",
      blockType: "hypertrophy_heavy",
      startWeek: 4, endWeek: 6,
      weekConfigs: [
        { sets: 4, reps: 10, rir: 2 },
        { sets: 4, reps: 8, rir: 1 },
        { sets: 5, reps: 6, rir: 1 },
      ],
    },
    {
      name: "Força",
      goal: "Desenvolvimento de força máxima",
      blockType: "strength",
      startWeek: 7, endWeek: 10,
      weekConfigs: [
        { sets: 4, reps: 6, rir: 2 },
        { sets: 5, reps: 5, rir: 1 },
        { sets: 5, reps: 4, rir: 1 },
        { sets: 4, reps: 3, rir: 0 }, // top set week
      ],
    },
    {
      name: "Deload / Recuperação",
      goal: "Recuperação ativa e redução de fadiga",
      blockType: "deload",
      startWeek: 11, endWeek: 12,
      weekConfigs: [
        { sets: 3, reps: 10, rir: 4 },
        { sets: 2, reps: 10, rir: 4 },
      ],
    },
  ];
}

// ═══════════════════════════════════════════════════════════════
// DAY SPLITS
// ═══════════════════════════════════════════════════════════════

interface DaySplitDef {
  name: string;
  dayOfWeek: string;
  focus: string;
  poolKey: string;
}

function getDaySplit(frequency: number): DaySplitDef[] {
  const splits: Record<number, DaySplitDef[]> = {
    2: [
      { name: "Full Body A", dayOfWeek: "Segunda", focus: "Corpo inteiro - push", poolKey: "fullbody" },
      { name: "Full Body B", dayOfWeek: "Quinta", focus: "Corpo inteiro - pull", poolKey: "fullbody" },
    ],
    3: [
      { name: "Full Body A", dayOfWeek: "Segunda", focus: "Peito, Costas, Pernas", poolKey: "fullbody" },
      { name: "Full Body B", dayOfWeek: "Quarta", focus: "Ombros, Braços, Pernas", poolKey: "fullbody" },
      { name: "Full Body C", dayOfWeek: "Sexta", focus: "Posterior, Peito, Costas", poolKey: "fullbody" },
    ],
    4: [
      { name: "Upper A", dayOfWeek: "Segunda", focus: "Peito, Ombros, Tríceps", poolKey: "upper" },
      { name: "Lower A", dayOfWeek: "Terça", focus: "Quadríceps, Posterior, Panturrilha", poolKey: "lower" },
      { name: "Upper B", dayOfWeek: "Quinta", focus: "Costas, Bíceps, Ombros", poolKey: "pull" },
      { name: "Lower B", dayOfWeek: "Sexta", focus: "Glúteos, Posterior, Quadríceps", poolKey: "posterior" },
    ],
    5: [
      { name: "Push", dayOfWeek: "Segunda", focus: "Peito, Ombros, Tríceps", poolKey: "push" },
      { name: "Legs", dayOfWeek: "Terça", focus: "Quadríceps, Panturrilha, Abdômen", poolKey: "legs" },
      { name: "Pull", dayOfWeek: "Quarta", focus: "Costas, Bíceps, Antebraço", poolKey: "pull" },
      { name: "Posterior", dayOfWeek: "Quinta", focus: "Posterior, Glúteos, Lombar", poolKey: "posterior" },
      { name: "Upper", dayOfWeek: "Sexta", focus: "Ombros, Peito, Costas, Braços", poolKey: "upper" },
    ],
    6: [
      { name: "Push A", dayOfWeek: "Segunda", focus: "Peito, Ombros, Tríceps", poolKey: "push" },
      { name: "Pull A", dayOfWeek: "Terça", focus: "Costas, Bíceps, Antebraço", poolKey: "pull" },
      { name: "Legs A", dayOfWeek: "Quarta", focus: "Quadríceps, Panturrilha", poolKey: "legs" },
      { name: "Push B", dayOfWeek: "Quinta", focus: "Ombros, Peito, Tríceps", poolKey: "push" },
      { name: "Pull B", dayOfWeek: "Sexta", focus: "Costas, Posterior, Bíceps", poolKey: "pull" },
      { name: "Legs B", dayOfWeek: "Sábado", focus: "Posterior, Glúteos, Panturrilha", poolKey: "posterior" },
    ],
    7: [
      { name: "Push", dayOfWeek: "Segunda", focus: "Peito, Ombros, Tríceps", poolKey: "push" },
      { name: "Pull", dayOfWeek: "Terça", focus: "Costas, Bíceps", poolKey: "pull" },
      { name: "Legs", dayOfWeek: "Quarta", focus: "Quadríceps, Panturrilha", poolKey: "legs" },
      { name: "Ombros + Braços", dayOfWeek: "Quinta", focus: "Ombros, Bíceps, Tríceps", poolKey: "shoulders_arms" },
      { name: "Posterior", dayOfWeek: "Sexta", focus: "Posterior, Glúteos, Lombar", poolKey: "posterior" },
      { name: "Peito + Costas", dayOfWeek: "Sábado", focus: "Peito, Costas", poolKey: "chest_back" },
      { name: "Recuperação Ativa", dayOfWeek: "Domingo", focus: "Abdômen, Mobilidade", poolKey: "recovery" },
    ],
  };
  return splits[frequency] || splits[5];
}

// ═══════════════════════════════════════════════════════════════
// EXERCISE SELECTOR — deterministic with seeded variation
// ═══════════════════════════════════════════════════════════════

function selectExercises(
  poolKey: string,
  weekNumber: number,
  dayIndex: number,
  blockType: string,
  isDeload: boolean,
): ExerciseTemplate[] {
  const pool = POOLS[poolKey] || POOLS["fullbody"];
  const seed = weekNumber * 7 + dayIndex;
  const targetCount = isDeload ? 5 : (blockType === "strength" ? 6 : 7);

  const pick = (arr: ExerciseTemplate[], count: number, offset = 0): ExerciseTemplate[] => {
    if (arr.length === 0) return [];
    const result: ExerciseTemplate[] = [];
    for (let i = 0; i < count && i < arr.length; i++) {
      result.push(arr[(i + offset + seed) % arr.length]);
    }
    return result;
  };

  const exercises: ExerciseTemplate[] = [];
  // 1 main
  exercises.push(...pick(pool.main, 1));
  // 2 compound
  exercises.push(...pick(pool.compound, 2, seed));
  // 2-3 accessory
  const accCount = Math.min(targetCount - 5, pool.accessory.length);
  exercises.push(...pick(pool.accessory, Math.max(accCount, 2), seed + 1));
  // 2 isolation
  exercises.push(...pick(pool.isolation, 2, seed + 2));

  // Ensure minimum 6
  while (exercises.length < 6) {
    const fallback = pool.accessory[(exercises.length + seed) % pool.accessory.length];
    if (fallback && !exercises.find(e => e.name === fallback.name)) {
      exercises.push(fallback);
    } else break;
  }

  // Deduplicate
  const seen = new Set<string>();
  return exercises.filter(e => {
    if (seen.has(e.name)) return false;
    seen.add(e.name);
    return true;
  });
}

// ═══════════════════════════════════════════════════════════════
// BUILD SETS for each exercise
// ═══════════════════════════════════════════════════════════════

function buildSets(
  ex: ExerciseTemplate,
  exIndex: number,
  config: { sets: number; reps: number; rir: number },
  blockType: string,
  bench1RM: number,
  squat1RM: number,
  deadlift1RM: number,
) {
  const isMain = exIndex === 0;
  const isCompound = ex.category === "compound";

  // Estimate weight from 1RM
  let base1RM = 0;
  const name = ex.name.toLowerCase();
  if (name.includes("supino") && !name.includes("inclinado")) base1RM = bench1RM;
  else if (name.includes("agachamento") && !name.includes("búlgaro")) base1RM = squat1RM;
  else if (name.includes("terra") || name.includes("stiff")) base1RM = deadlift1RM;

  if (isMain && blockType === "strength") {
    // Top set + backoff
    const topPct = blockType === "strength" ? 0.87 : 0.80;
    const backPct = topPct - 0.10;
    const topWeight = base1RM > 0 ? Math.round(base1RM * topPct / 2.5) * 2.5 : undefined;
    const backWeight = base1RM > 0 ? Math.round(base1RM * backPct / 2.5) * 2.5 : undefined;

    return [
      {
        type: "top", targetSets: 1, targetReps: Math.max(config.reps - 2, 1),
        targetRIR: Math.max(config.rir - 1, 0), targetWeight: topWeight,
        percentage: Math.round(topPct * 100), restSeconds: 180,
      },
      {
        type: "backoff", targetSets: config.sets - 1, targetReps: config.reps,
        targetRIR: config.rir, targetWeight: backWeight,
        percentage: Math.round(backPct * 100), restSeconds: 150,
      },
    ];
  }

  const pct = isCompound ? 0.72 : 0.65;
  const weight = base1RM > 0 ? Math.round(base1RM * pct / 2.5) * 2.5 : undefined;
  const reps = isCompound ? config.reps : Math.min(config.reps + 4, 15);
  const rest = isCompound ? 120 : 90;

  return [{
    type: "normal",
    targetSets: config.sets,
    targetReps: reps,
    targetRIR: isCompound ? config.rir : config.rir + 1,
    targetWeight: weight,
    restSeconds: rest,
  }];
}

// ═══════════════════════════════════════════════════════════════
// MAIN HANDLER
// ═══════════════════════════════════════════════════════════════

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader || "" } } }
    );

    const { data: { user } } = await supabase.auth.getUser();

    const {
      squat1RM = 0, bench1RM = 0, deadlift1RM = 0, bodyWeight = 80,
      goal = "powerbuilding", frequency = 5, experience = "intermediate",
      saveToDb,
    } = await req.json();

    const freq = Math.min(Math.max(frequency, 2), 7);
    const blocks = buildBlocks();
    const daySplit = getDaySplit(freq);

    // ─── Build complete program deterministically ───
    const programBlocks: any[] = [];

    for (const block of blocks) {
      const weeks: any[] = [];

      for (let w = block.startWeek; w <= block.endWeek; w++) {
        const weekInBlock = w - block.startWeek;
        const config = block.weekConfigs[Math.min(weekInBlock, block.weekConfigs.length - 1)];
        const progressionKg = weekInBlock * 2.5;

        const days = daySplit.map((ds, dIdx) => {
          const exercises = selectExercises(
            ds.poolKey, w, dIdx, block.blockType, block.blockType === "deload"
          );

          const exercisesWithSets = exercises.map((ex, eIdx) => {
            const sets = buildSets(
              ex, eIdx, config, block.blockType,
              bench1RM + progressionKg, squat1RM + progressionKg * 2, deadlift1RM + progressionKg * 2,
            );
            return {
              name: ex.name,
              category: ex.category,
              muscleGroup: ex.muscleGroup,
              sets,
            };
          });

          return {
            name: ds.name,
            dayOfWeek: ds.dayOfWeek,
            focus: block.blockType === "deload" ? ds.focus + " (Deload)" : ds.focus,
            exercises: exercisesWithSets,
          };
        });

        weeks.push({ weekNumber: w, days });
      }

      programBlocks.push({
        name: block.name,
        goal: block.goal,
        weekRange: `Semanas ${block.startWeek}-${block.endWeek}`,
        blockType: block.blockType,
        startWeek: block.startWeek,
        endWeek: block.endWeek,
        weeks,
      });
    }

    const goalLabel: Record<string, string> = {
      powerbuilding: "Powerbuilding",
      strength: "Força Máxima",
      hypertrophy: "Hipertrofia",
      recomp: "Recomposição",
      endurance: "Resistência",
    };

    const program = {
      name: `Iron ${goalLabel[goal] || "Powerbuilding"} 12sem`,
      description: `Programa de 12 semanas focado em ${(goalLabel[goal] || "powerbuilding").toLowerCase()} com ${freq} dias/semana. 4 blocos de periodização.`,
      durationWeeks: 12,
      blocks: programBlocks,
    };

    // ─── VALIDATE ───
    let totalDays = 0;
    let totalExercises = 0;
    for (const b of program.blocks) {
      for (const w of b.weeks) {
        totalDays += w.days.length;
        for (const d of w.days) {
          totalExercises += d.exercises.length;
          if (d.exercises.length < 5) {
            console.warn(`Warning: ${b.name} Week ${w.weekNumber} ${d.name} has only ${d.exercises.length} exercises`);
          }
        }
      }
    }
    console.log(`Program generated: ${program.blocks.length} blocks, ${totalDays} days, ${totalExercises} exercises`);

    // ─── SAVE TO DB ───
    if (user && saveToDb !== false) {
      try {
        await supabase.from("training_programs").update({ is_active: false }).eq("user_id", user.id);

        const { data: dbProgram, error: progErr } = await supabase.from("training_programs").insert({
          user_id: user.id,
          name: program.name,
          program_type: goal,
          description: program.description,
          duration_weeks: 12,
          days_per_week: freq,
          is_active: true,
        }).select().single();

        if (progErr) throw progErr;

        for (let bIdx = 0; bIdx < program.blocks.length; bIdx++) {
          const block = program.blocks[bIdx];
          const { data: dbBlock, error: blockErr } = await supabase.from("training_blocks").insert({
            program_id: dbProgram.id, name: block.name, block_type: block.blockType,
            goal: block.goal, start_week: block.startWeek, end_week: block.endWeek, order_index: bIdx,
          }).select().single();
          if (blockErr) throw blockErr;

          for (const week of block.weeks) {
            const { data: dbWeek, error: weekErr } = await supabase.from("training_weeks").insert({
              block_id: dbBlock.id, week_number: week.weekNumber,
            }).select().single();
            if (weekErr) throw weekErr;

            for (let dIdx = 0; dIdx < week.days.length; dIdx++) {
              const day = week.days[dIdx];
              const { data: dbDay, error: dayErr } = await supabase.from("training_days").insert({
                week_id: dbWeek.id, day_name: day.name, day_of_week: day.dayOfWeek,
                focus: day.focus, order_index: dIdx,
              }).select().single();
              if (dayErr) throw dayErr;

              for (let eIdx = 0; eIdx < day.exercises.length; eIdx++) {
                const ex = day.exercises[eIdx];
                const { data: dbEx, error: exErr } = await supabase.from("workout_exercises").insert({
                  day_id: dbDay.id, exercise_name: ex.name, category: ex.category,
                  muscle_group: ex.muscleGroup, order_index: eIdx,
                }).select().single();
                if (exErr) throw exErr;

                for (let sIdx = 0; sIdx < ex.sets.length; sIdx++) {
                  const s = ex.sets[sIdx];
                  await supabase.from("planned_sets").insert({
                    workout_exercise_id: dbEx.id, set_number: sIdx + 1,
                    target_sets: s.targetSets, target_reps: s.targetReps, target_rir: s.targetRIR,
                    target_weight: s.targetWeight, load_percentage: s.percentage,
                    rest_seconds: s.restSeconds || 120,
                    is_top_set: s.type === "top", is_backoff: s.type === "backoff",
                  });
                }
              }
            }
          }
        }

        console.log("Program saved:", dbProgram.id);
        return new Response(JSON.stringify({ program, programId: dbProgram.id }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (dbErr) {
        console.error("DB save error:", dbErr);
        return new Response(JSON.stringify({ program, dbSaveError: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ program }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-program error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
