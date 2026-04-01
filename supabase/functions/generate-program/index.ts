import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ExerciseTemplate {
  name: string;
  nameDumbell?: string;
  category: "compound" | "accessory";
  muscleGroup: string;
  equipment: "barbell" | "dumbell" | "machine" | "cable" | "bodyweight" | "any";
  level: "beginner" | "intermediate" | "advanced" | "all";
  injured?: string[];
}

interface UserPreferences {
  preferDumbell: boolean;
  equipment: string;
  injuries: string[];
  experience: string;
}

const EQUIPMENT_ALLOWED: Record<string, string[]> = {
  full: ["barbell", "dumbell", "machine", "cable", "bodyweight", "any"],
  limited: ["dumbell", "cable", "bodyweight", "any"],
  home: ["dumbell", "bodyweight", "any"],
};

const LEVEL_ORDER: Record<string, number> = { beginner: 0, intermediate: 1, advanced: 2, all: -1 };

function filterExercise(ex: ExerciseTemplate, prefs: UserPreferences): ExerciseTemplate | null {
  const allowed = EQUIPMENT_ALLOWED[prefs.equipment] || EQUIPMENT_ALLOWED["full"];
  if (!allowed.includes(ex.equipment)) return null;
  if (ex.injured && ex.injured.some((i) => prefs.injuries.includes(i))) return null;
  const userLevel = LEVEL_ORDER[prefs.experience] ?? 1;
  const exLevel = LEVEL_ORDER[ex.level];
  if (exLevel !== -1 && exLevel > userLevel) return null;
  if (prefs.preferDumbell && ex.nameDumbell) return { ...ex, name: ex.nameDumbell, equipment: "dumbell" };
  return ex;
}

function filterPool(pool: ExerciseTemplate[], prefs: UserPreferences): ExerciseTemplate[] {
  return pool.map((ex) => filterExercise(ex, prefs)).filter((ex): ex is ExerciseTemplate => ex !== null);
}

const POOLS: Record<string, { main: ExerciseTemplate[]; compound: ExerciseTemplate[]; accessory: ExerciseTemplate[]; isolation: ExerciseTemplate[] }> = {
  push: {
    main: [
      { name: "Supino reto com barra", nameDumbell: "Supino reto com halteres", category: "compound", muscleGroup: "Peito", equipment: "barbell", level: "all" },
    ],
    compound: [
      { name: "Supino inclinado com halteres", category: "compound", muscleGroup: "Peito", equipment: "dumbell", level: "all" },
      { name: "Desenvolvimento militar com barra", nameDumbell: "Desenvolvimento com halteres", category: "compound", muscleGroup: "Ombros", equipment: "barbell", level: "all" },
      { name: "Supino declinado com barra", nameDumbell: "Supino declinado com halteres", category: "compound", muscleGroup: "Peito", equipment: "barbell", level: "intermediate" },
      { name: "Supino maquina", category: "compound", muscleGroup: "Peito", equipment: "machine", level: "all" },
      { name: "Desenvolvimento Arnold", category: "compound", muscleGroup: "Ombros", equipment: "dumbell", level: "intermediate" },
    ],
    accessory: [
      { name: "Elevacao lateral com halteres", category: "accessory", muscleGroup: "Ombros", equipment: "dumbell", level: "all" },
      { name: "Crucifixo inclinado com halteres", category: "accessory", muscleGroup: "Peito", equipment: "dumbell", level: "all", injured: ["shoulder"] },
      { name: "Crossover no cabo", category: "accessory", muscleGroup: "Peito", equipment: "cable", level: "all" },
      { name: "Elevacao frontal com halteres", category: "accessory", muscleGroup: "Ombros", equipment: "dumbell", level: "all" },
      { name: "Fly na maquina (peck deck)", category: "accessory", muscleGroup: "Peito", equipment: "machine", level: "all" },
      { name: "Elevacao lateral no cabo", category: "accessory", muscleGroup: "Ombros", equipment: "cable", level: "all" },
    ],
    isolation: [
      { name: "Triceps corda no pulley", category: "accessory", muscleGroup: "Triceps", equipment: "cable", level: "all" },
      { name: "Triceps frances com halter", category: "accessory", muscleGroup: "Triceps", equipment: "dumbell", level: "all" },
      { name: "Triceps testa com barra", nameDumbell: "Triceps testa com halteres", category: "accessory", muscleGroup: "Triceps", equipment: "barbell", level: "all", injured: ["wrist"] },
      { name: "Triceps no mergulho (paralelas)", category: "accessory", muscleGroup: "Triceps", equipment: "bodyweight", level: "intermediate", injured: ["shoulder"] },
      { name: "Triceps pulley reto", category: "accessory", muscleGroup: "Triceps", equipment: "cable", level: "all" },
    ],
  },
  pull: {
    main: [
      { name: "Barra fixa", category: "compound", muscleGroup: "Costas", equipment: "bodyweight", level: "intermediate", injured: ["shoulder"] },
      { name: "Puxada frontal no cabo", category: "compound", muscleGroup: "Costas", equipment: "cable", level: "all" },
    ],
    compound: [
      { name: "Remada curvada com barra", nameDumbell: "Remada curvada com halteres", category: "compound", muscleGroup: "Costas", equipment: "barbell", level: "all", injured: ["lower_back"] },
      { name: "Remada unilateral com halter", category: "compound", muscleGroup: "Costas", equipment: "dumbell", level: "all" },
      { name: "Remada baixa no cabo", category: "compound", muscleGroup: "Costas", equipment: "cable", level: "all" },
      { name: "Remada cavaleiro (maquina)", category: "compound", muscleGroup: "Costas", equipment: "machine", level: "all" },
    ],
    accessory: [
      { name: "Face pull no cabo", category: "accessory", muscleGroup: "Ombros", equipment: "cable", level: "all" },
      { name: "Pullover no cabo", category: "accessory", muscleGroup: "Costas", equipment: "cable", level: "all" },
      { name: "Encolhimento com halteres", category: "accessory", muscleGroup: "Trapezio", equipment: "dumbell", level: "all" },
      { name: "Crucifixo inverso com halteres", category: "accessory", muscleGroup: "Ombros", equipment: "dumbell", level: "all" },
    ],
    isolation: [
      { name: "Rosca direta com barra", nameDumbell: "Rosca direta com halteres", category: "accessory", muscleGroup: "Biceps", equipment: "barbell", level: "all" },
      { name: "Rosca alternada com halteres", category: "accessory", muscleGroup: "Biceps", equipment: "dumbell", level: "all" },
      { name: "Rosca martelo com halteres", category: "accessory", muscleGroup: "Biceps", equipment: "dumbell", level: "all" },
      { name: "Rosca scott com barra W", nameDumbell: "Rosca scott com halteres", category: "accessory", muscleGroup: "Biceps", equipment: "barbell", level: "intermediate" },
      { name: "Rosca concentrada com halter", category: "accessory", muscleGroup: "Biceps", equipment: "dumbell", level: "all" },
      { name: "Rosca no cabo (barra reta)", category: "accessory", muscleGroup: "Biceps", equipment: "cable", level: "all" },
    ],
  },
  legs: {
    main: [
      { name: "Agachamento livre com barra", category: "compound", muscleGroup: "Quadriceps", equipment: "barbell", level: "intermediate", injured: ["knee", "lower_back", "hip"] },
      { name: "Leg press 45", category: "compound", muscleGroup: "Quadriceps", equipment: "machine", level: "all" },
    ],
    compound: [
      { name: "Agachamento hack (maquina)", category: "compound", muscleGroup: "Quadriceps", equipment: "machine", level: "all" },
      { name: "Agachamento bulgaro com halteres", category: "compound", muscleGroup: "Quadriceps", equipment: "dumbell", level: "intermediate", injured: ["knee"] },
      { name: "Passada com halteres", category: "compound", muscleGroup: "Quadriceps", equipment: "dumbell", level: "beginner" },
      { name: "Agachamento goblet com halter", category: "compound", muscleGroup: "Quadriceps", equipment: "dumbell", level: "beginner" },
    ],
    accessory: [
      { name: "Cadeira extensora", category: "accessory", muscleGroup: "Quadriceps", equipment: "machine", level: "all", injured: ["knee"] },
      { name: "Cadeira flexora", category: "accessory", muscleGroup: "Posterior", equipment: "machine", level: "all" },
      { name: "Stiff com halteres", category: "accessory", muscleGroup: "Posterior", equipment: "dumbell", level: "all" },
      { name: "Abducao de quadril na maquina", category: "accessory", muscleGroup: "Gluteos", equipment: "machine", level: "all", injured: ["hip"] },
    ],
    isolation: [
      { name: "Panturrilha em pe na maquina", category: "accessory", muscleGroup: "Panturrilha", equipment: "machine", level: "all" },
      { name: "Panturrilha sentado na maquina", category: "accessory", muscleGroup: "Panturrilha", equipment: "machine", level: "all" },
      { name: "Abdominal no cabo", category: "accessory", muscleGroup: "Abdomen", equipment: "cable", level: "all" },
    ],
  },
  posterior: {
    main: [
      { name: "Levantamento terra romeno com barra", nameDumbell: "Levantamento terra romeno com halteres", category: "compound", muscleGroup: "Posterior", equipment: "barbell", level: "intermediate", injured: ["lower_back"] },
    ],
    compound: [
      { name: "Stiff com barra", nameDumbell: "Stiff com halteres", category: "compound", muscleGroup: "Posterior", equipment: "barbell", level: "intermediate", injured: ["lower_back"] },
      { name: "Hip thrust com barra", nameDumbell: "Hip thrust com halteres", category: "compound", muscleGroup: "Gluteos", equipment: "barbell", level: "all" },
      { name: "Agachamento sumo com barra", category: "compound", muscleGroup: "Gluteos", equipment: "barbell", level: "intermediate", injured: ["hip"] },
    ],
    accessory: [
      { name: "Cadeira flexora", category: "accessory", muscleGroup: "Posterior", equipment: "machine", level: "all" },
      { name: "Mesa flexora", category: "accessory", muscleGroup: "Posterior", equipment: "machine", level: "all" },
      { name: "Elevacao pelvica com halter", category: "accessory", muscleGroup: "Gluteos", equipment: "dumbell", level: "all" },
      { name: "Abducao na maquina", category: "accessory", muscleGroup: "Gluteos", equipment: "machine", level: "all" },
    ],
    isolation: [
      { name: "Panturrilha no leg press", category: "accessory", muscleGroup: "Panturrilha", equipment: "machine", level: "all" },
      { name: "Hiperextensao lombar", category: "accessory", muscleGroup: "Lombar", equipment: "bodyweight", level: "all", injured: ["lower_back"] },
      { name: "Abdominal infra", category: "accessory", muscleGroup: "Abdomen", equipment: "bodyweight", level: "all" },
    ],
  },
  upper: {
    main: [
      { name: "Supino reto com barra", nameDumbell: "Supino reto com halteres", category: "compound", muscleGroup: "Peito", equipment: "barbell", level: "all" },
    ],
    compound: [
      { name: "Remada curvada com barra", nameDumbell: "Remada curvada com halteres", category: "compound", muscleGroup: "Costas", equipment: "barbell", level: "all", injured: ["lower_back"] },
      { name: "Desenvolvimento militar com barra", nameDumbell: "Desenvolvimento com halteres", category: "compound", muscleGroup: "Ombros", equipment: "barbell", level: "all" },
      { name: "Puxada frontal no cabo", category: "compound", muscleGroup: "Costas", equipment: "cable", level: "all" },
      { name: "Supino inclinado com halteres", category: "compound", muscleGroup: "Peito", equipment: "dumbell", level: "all" },
    ],
    accessory: [
      { name: "Elevacao lateral com halteres", category: "accessory", muscleGroup: "Ombros", equipment: "dumbell", level: "all" },
      { name: "Face pull no cabo", category: "accessory", muscleGroup: "Ombros", equipment: "cable", level: "all" },
    ],
    isolation: [
      { name: "Rosca direta com halteres", category: "accessory", muscleGroup: "Biceps", equipment: "dumbell", level: "all" },
      { name: "Triceps corda no pulley", category: "accessory", muscleGroup: "Triceps", equipment: "cable", level: "all" },
      { name: "Rosca martelo com halteres", category: "accessory", muscleGroup: "Biceps", equipment: "dumbell", level: "all" },
      { name: "Triceps testa com halteres", category: "accessory", muscleGroup: "Triceps", equipment: "dumbell", level: "all" },
    ],
  },
  fullbody: {
    main: [
      { name: "Agachamento livre com barra", category: "compound", muscleGroup: "Quadriceps", equipment: "barbell", level: "intermediate", injured: ["knee", "lower_back"] },
      { name: "Leg press 45", category: "compound", muscleGroup: "Quadriceps", equipment: "machine", level: "all" },
    ],
    compound: [
      { name: "Supino reto com barra", nameDumbell: "Supino reto com halteres", category: "compound", muscleGroup: "Peito", equipment: "barbell", level: "all" },
      { name: "Remada curvada com barra", nameDumbell: "Remada curvada com halteres", category: "compound", muscleGroup: "Costas", equipment: "barbell", level: "all", injured: ["lower_back"] },
      { name: "Desenvolvimento militar com barra", nameDumbell: "Desenvolvimento com halteres", category: "compound", muscleGroup: "Ombros", equipment: "barbell", level: "all" },
      { name: "Levantamento terra romeno com halteres", category: "compound", muscleGroup: "Posterior", equipment: "dumbell", level: "all" },
    ],
    accessory: [
      { name: "Puxada frontal no cabo", category: "compound", muscleGroup: "Costas", equipment: "cable", level: "all" },
      { name: "Elevacao lateral com halteres", category: "accessory", muscleGroup: "Ombros", equipment: "dumbell", level: "all" },
    ],
    isolation: [
      { name: "Rosca direta com halteres", category: "accessory", muscleGroup: "Biceps", equipment: "dumbell", level: "all" },
      { name: "Triceps corda no pulley", category: "accessory", muscleGroup: "Triceps", equipment: "cable", level: "all" },
      { name: "Panturrilha em pe na maquina", category: "accessory", muscleGroup: "Panturrilha", equipment: "machine", level: "all" },
    ],
  },
  lower: {
    main: [
      { name: "Agachamento livre com barra", category: "compound", muscleGroup: "Quadriceps", equipment: "barbell", level: "intermediate", injured: ["knee", "lower_back"] },
      { name: "Leg press 45", category: "compound", muscleGroup: "Quadriceps", equipment: "machine", level: "all" },
    ],
    compound: [
      { name: "Levantamento terra romeno com barra", nameDumbell: "Levantamento terra romeno com halteres", category: "compound", muscleGroup: "Posterior", equipment: "barbell", level: "intermediate", injured: ["lower_back"] },
      { name: "Hip thrust com barra", category: "compound", muscleGroup: "Gluteos", equipment: "barbell", level: "all" },
      { name: "Agachamento bulgaro com halteres", category: "compound", muscleGroup: "Quadriceps", equipment: "dumbell", level: "intermediate", injured: ["knee"] },
      { name: "Agachamento hack (maquina)", category: "compound", muscleGroup: "Quadriceps", equipment: "machine", level: "all" },
    ],
    accessory: [
      { name: "Cadeira extensora", category: "accessory", muscleGroup: "Quadriceps", equipment: "machine", level: "all", injured: ["knee"] },
      { name: "Cadeira flexora", category: "accessory", muscleGroup: "Posterior", equipment: "machine", level: "all" },
      { name: "Stiff com halteres", category: "accessory", muscleGroup: "Posterior", equipment: "dumbell", level: "all" },
      { name: "Abducao na maquina", category: "accessory", muscleGroup: "Gluteos", equipment: "machine", level: "all" },
    ],
    isolation: [
      { name: "Panturrilha em pe na maquina", category: "accessory", muscleGroup: "Panturrilha", equipment: "machine", level: "all" },
      { name: "Panturrilha sentado na maquina", category: "accessory", muscleGroup: "Panturrilha", equipment: "machine", level: "all" },
      { name: "Abdominal no cabo", category: "accessory", muscleGroup: "Abdomen", equipment: "cable", level: "all" },
    ],
  },
  deadlift: {
    main: [
      { name: "Levantamento terra convencional", category: "compound", muscleGroup: "Posterior", equipment: "barbell", level: "intermediate", injured: ["lower_back"] },
    ],
    compound: [
      { name: "Remada curvada com barra", nameDumbell: "Remada curvada com halteres", category: "compound", muscleGroup: "Costas", equipment: "barbell", level: "all", injured: ["lower_back"] },
      { name: "Hip thrust com barra", category: "compound", muscleGroup: "Gluteos", equipment: "barbell", level: "all" },
    ],
    accessory: [
      { name: "Puxada frontal no cabo", category: "accessory", muscleGroup: "Costas", equipment: "cable", level: "all" },
      { name: "Cadeira flexora", category: "accessory", muscleGroup: "Posterior", equipment: "machine", level: "all" },
      { name: "Face pull no cabo", category: "accessory", muscleGroup: "Ombros", equipment: "cable", level: "all" },
    ],
    isolation: [
      { name: "Rosca direta com halteres", category: "accessory", muscleGroup: "Biceps", equipment: "dumbell", level: "all" },
      { name: "Hiperextensao lombar", category: "accessory", muscleGroup: "Lombar", equipment: "bodyweight", level: "all", injured: ["lower_back"] },
      { name: "Encolhimento com halteres", category: "accessory", muscleGroup: "Trapezio", equipment: "dumbell", level: "all" },
    ],
  },
  shoulders_arms: {
    main: [
      { name: "Desenvolvimento militar com barra", nameDumbell: "Desenvolvimento com halteres", category: "compound", muscleGroup: "Ombros", equipment: "barbell", level: "all" },
    ],
    compound: [
      { name: "Desenvolvimento Arnold", category: "compound", muscleGroup: "Ombros", equipment: "dumbell", level: "intermediate" },
      { name: "Supino fechado com barra", category: "compound", muscleGroup: "Triceps", equipment: "barbell", level: "intermediate", injured: ["wrist", "shoulder"] },
    ],
    accessory: [
      { name: "Elevacao lateral com halteres", category: "accessory", muscleGroup: "Ombros", equipment: "dumbell", level: "all" },
      { name: "Elevacao lateral inclinada com halteres", category: "accessory", muscleGroup: "Ombros", equipment: "dumbell", level: "intermediate" },
      { name: "Crucifixo inverso com halteres", category: "accessory", muscleGroup: "Ombros", equipment: "dumbell", level: "all" },
      { name: "Elevacao lateral no cabo", category: "accessory", muscleGroup: "Ombros", equipment: "cable", level: "all" },
    ],
    isolation: [
      { name: "Rosca direta com barra W", nameDumbell: "Rosca direta com halteres", category: "accessory", muscleGroup: "Biceps", equipment: "barbell", level: "all" },
      { name: "Rosca martelo com halteres", category: "accessory", muscleGroup: "Biceps", equipment: "dumbell", level: "all" },
      { name: "Triceps frances com halter", category: "accessory", muscleGroup: "Triceps", equipment: "dumbell", level: "all" },
      { name: "Triceps corda no pulley", category: "accessory", muscleGroup: "Triceps", equipment: "cable", level: "all" },
    ],
  },
  chest_back: {
    main: [
      { name: "Supino reto com barra", nameDumbell: "Supino reto com halteres", category: "compound", muscleGroup: "Peito", equipment: "barbell", level: "all" },
    ],
    compound: [
      { name: "Barra fixa", category: "compound", muscleGroup: "Costas", equipment: "bodyweight", level: "intermediate", injured: ["shoulder"] },
      { name: "Supino inclinado com halteres", category: "compound", muscleGroup: "Peito", equipment: "dumbell", level: "all" },
      { name: "Remada curvada com barra", nameDumbell: "Remada curvada com halteres", category: "compound", muscleGroup: "Costas", equipment: "barbell", level: "all", injured: ["lower_back"] },
    ],
    accessory: [
      { name: "Crossover no cabo", category: "accessory", muscleGroup: "Peito", equipment: "cable", level: "all" },
      { name: "Remada baixa no cabo", category: "accessory", muscleGroup: "Costas", equipment: "cable", level: "all" },
      { name: "Pullover no cabo", category: "accessory", muscleGroup: "Costas", equipment: "cable", level: "all" },
    ],
    isolation: [
      { name: "Fly na maquina (peck deck)", category: "accessory", muscleGroup: "Peito", equipment: "machine", level: "all" },
      { name: "Face pull no cabo", category: "accessory", muscleGroup: "Ombros", equipment: "cable", level: "all" },
    ],
  },
  recovery: {
    main: [
      { name: "Prancha abdominal", category: "accessory", muscleGroup: "Abdomen", equipment: "bodyweight", level: "all" },
    ],
    compound: [
      { name: "Agachamento corporal", category: "compound", muscleGroup: "Quadriceps", equipment: "bodyweight", level: "all" },
    ],
    accessory: [
      { name: "Abdominal crunch", category: "accessory", muscleGroup: "Abdomen", equipment: "bodyweight", level: "all" },
      { name: "Prancha lateral", category: "accessory", muscleGroup: "Abdomen", equipment: "bodyweight", level: "all" },
      { name: "Elevacao pelvica com peso corporal", category: "accessory", muscleGroup: "Gluteos", equipment: "bodyweight", level: "all" },
    ],
    isolation: [
      { name: "Panturrilha em pe (sem peso)", category: "accessory", muscleGroup: "Panturrilha", equipment: "bodyweight", level: "all" },
    ],
  },
};

interface BlockDef {
  name: string;
  goal: string;
  blockType: string;
  startWeek: number;
  endWeek: number;
  weekConfigs: { sets: number; reps: number; rir: number }[];
}

function buildBlocks(goal: string): BlockDef[] {
  if (goal === "strength") {
    return [
      { name: "Base de Forca", goal: "Adaptacao neuromuscular", blockType: "strength_base", startWeek: 1, endWeek: 3, weekConfigs: [{ sets: 4, reps: 6, rir: 3 }, { sets: 4, reps: 5, rir: 2 }, { sets: 5, reps: 5, rir: 2 }] },
      { name: "Forca Maxima", goal: "Desenvolvimento de 1RM", blockType: "strength", startWeek: 4, endWeek: 9, weekConfigs: [{ sets: 4, reps: 5, rir: 2 }, { sets: 5, reps: 4, rir: 1 }, { sets: 5, reps: 3, rir: 1 }, { sets: 4, reps: 3, rir: 0 }, { sets: 3, reps: 2, rir: 0 }, { sets: 3, reps: 2, rir: 0 }] },
      { name: "Deload", goal: "Recuperacao ativa", blockType: "deload", startWeek: 10, endWeek: 12, weekConfigs: [{ sets: 3, reps: 5, rir: 4 }, { sets: 2, reps: 5, rir: 4 }, { sets: 2, reps: 5, rir: 4 }] },
    ];
  }
  if (goal === "hypertrophy") {
    return [
      { name: "Hipertrofia Base", goal: "Volume e adaptacao", blockType: "hypertrophy", startWeek: 1, endWeek: 4, weekConfigs: [{ sets: 3, reps: 12, rir: 3 }, { sets: 4, reps: 10, rir: 2 }, { sets: 4, reps: 10, rir: 2 }, { sets: 4, reps: 8, rir: 2 }] },
      { name: "Hipertrofia Intensa", goal: "Maximizar crescimento muscular", blockType: "hypertrophy_heavy", startWeek: 5, endWeek: 9, weekConfigs: [{ sets: 4, reps: 10, rir: 2 }, { sets: 4, reps: 8, rir: 1 }, { sets: 5, reps: 8, rir: 1 }, { sets: 5, reps: 6, rir: 1 }, { sets: 4, reps: 6, rir: 0 }] },
      { name: "Deload", goal: "Recuperacao ativa", blockType: "deload", startWeek: 10, endWeek: 12, weekConfigs: [{ sets: 3, reps: 12, rir: 4 }, { sets: 2, reps: 12, rir: 4 }, { sets: 2, reps: 10, rir: 4 }] },
    ];
  }
  return [
    { name: "Base / Hipertrofia", goal: "Adaptacao, volume e hipertrofia", blockType: "hypertrophy", startWeek: 1, endWeek: 3, weekConfigs: [{ sets: 3, reps: 12, rir: 3 }, { sets: 4, reps: 10, rir: 2 }, { sets: 4, reps: 8, rir: 2 }] },
    { name: "Hipertrofia Intensa", goal: "Maximizar crescimento muscular", blockType: "hypertrophy_heavy", startWeek: 4, endWeek: 6, weekConfigs: [{ sets: 4, reps: 10, rir: 2 }, { sets: 4, reps: 8, rir: 1 }, { sets: 5, reps: 6, rir: 1 }] },
    { name: "Forca", goal: "Desenvolvimento de forca maxima", blockType: "strength", startWeek: 7, endWeek: 10, weekConfigs: [{ sets: 4, reps: 6, rir: 2 }, { sets: 5, reps: 5, rir: 1 }, { sets: 5, reps: 4, rir: 1 }, { sets: 4, reps: 3, rir: 0 }] },
    { name: "Deload / Recuperacao", goal: "Recuperacao ativa e reducao de fadiga", blockType: "deload", startWeek: 11, endWeek: 12, weekConfigs: [{ sets: 3, reps: 10, rir: 4 }, { sets: 2, reps: 10, rir: 4 }] },
  ];
}

interface DaySplitDef { name: string; dayOfWeek: string; focus: string; poolKey: string; }

function getDaySplit(frequency: number): DaySplitDef[] {
  const splits: Record<number, DaySplitDef[]> = {
    2: [{ name: "Full Body A", dayOfWeek: "Segunda", focus: "Corpo inteiro - push", poolKey: "fullbody" }, { name: "Full Body B", dayOfWeek: "Quinta", focus: "Corpo inteiro - pull", poolKey: "fullbody" }],
    3: [{ name: "Full Body A", dayOfWeek: "Segunda", focus: "Peito, Costas, Pernas", poolKey: "fullbody" }, { name: "Full Body B", dayOfWeek: "Quarta", focus: "Ombros, Bracos, Pernas", poolKey: "fullbody" }, { name: "Full Body C", dayOfWeek: "Sexta", focus: "Posterior, Peito, Costas", poolKey: "fullbody" }],
    4: [{ name: "Upper A", dayOfWeek: "Segunda", focus: "Peito, Ombros, Triceps", poolKey: "upper" }, { name: "Lower A", dayOfWeek: "Terca", focus: "Quadriceps, Posterior, Panturrilha", poolKey: "lower" }, { name: "Upper B", dayOfWeek: "Quinta", focus: "Costas, Biceps, Ombros", poolKey: "pull" }, { name: "Lower B", dayOfWeek: "Sexta", focus: "Gluteos, Posterior, Quadriceps", poolKey: "posterior" }],
    5: [{ name: "Push", dayOfWeek: "Segunda", focus: "Peito, Ombros, Triceps", poolKey: "push" }, { name: "Legs", dayOfWeek: "Terca", focus: "Quadriceps, Panturrilha, Abdomen", poolKey: "legs" }, { name: "Pull", dayOfWeek: "Quarta", focus: "Costas, Biceps, Antebraco", poolKey: "pull" }, { name: "Posterior", dayOfWeek: "Quinta", focus: "Posterior, Gluteos, Lombar", poolKey: "posterior" }, { name: "Upper", dayOfWeek: "Sexta", focus: "Ombros, Peito, Costas, Bracos", poolKey: "upper" }],
    6: [{ name: "Push A", dayOfWeek: "Segunda", focus: "Peito, Ombros, Triceps", poolKey: "push" }, { name: "Pull A", dayOfWeek: "Terca", focus: "Costas, Biceps, Antebraco", poolKey: "pull" }, { name: "Legs A", dayOfWeek: "Quarta", focus: "Quadriceps, Panturrilha", poolKey: "legs" }, { name: "Push B", dayOfWeek: "Quinta", focus: "Ombros, Peito, Triceps", poolKey: "push" }, { name: "Pull B", dayOfWeek: "Sexta", focus: "Costas, Posterior, Biceps", poolKey: "pull" }, { name: "Legs B", dayOfWeek: "Sabado", focus: "Posterior, Gluteos, Panturrilha", poolKey: "posterior" }],
    7: [{ name: "Push", dayOfWeek: "Segunda", focus: "Peito, Ombros, Triceps", poolKey: "push" }, { name: "Pull", dayOfWeek: "Terca", focus: "Costas, Biceps", poolKey: "pull" }, { name: "Legs", dayOfWeek: "Quarta", focus: "Quadriceps, Panturrilha", poolKey: "legs" }, { name: "Ombros + Bracos", dayOfWeek: "Quinta", focus: "Ombros, Biceps, Triceps", poolKey: "shoulders_arms" }, { name: "Posterior", dayOfWeek: "Sexta", focus: "Posterior, Gluteos, Lombar", poolKey: "posterior" }, { name: "Peito + Costas", dayOfWeek: "Sabado", focus: "Peito, Costas", poolKey: "chest_back" }, { name: "Recuperacao Ativa", dayOfWeek: "Domingo", focus: "Abdomen, Mobilidade", poolKey: "recovery" }],
  };
  return splits[frequency] || splits[5];
}

function selectExercises(poolKey: string, weekNumber: number, dayIndex: number, blockType: string, blockIndex: number, isDeload: boolean, prefs: UserPreferences): ExerciseTemplate[] {
  const rawPool = POOLS[poolKey] || POOLS["fullbody"];
  const pool = {
    main: filterPool(rawPool.main, prefs),
    compound: filterPool(rawPool.compound, prefs),
    accessory: filterPool(rawPool.accessory, prefs),
    isolation: filterPool(rawPool.isolation, prefs),
  };

  const seed = blockIndex * 100 + weekNumber * 7 + dayIndex;
  const targetCount = isDeload ? 5 : (blockType === "strength" || blockType === "strength_base" ? 6 : 7);

  const pick = (arr: ExerciseTemplate[], count: number, offset = 0): ExerciseTemplate[] => {
    if (arr.length === 0) return [];
    const result: ExerciseTemplate[] = [];
    for (let i = 0; i < count && i < arr.length; i++) result.push(arr[(i + offset + seed) % arr.length]);
    return result;
  };

  const exercises: ExerciseTemplate[] = [];
  const mainPick = pick(pool.main, 1);
  if (mainPick.length > 0) exercises.push(...mainPick);
  else if (pool.compound.length > 0) exercises.push(pool.compound[seed % pool.compound.length]);

  exercises.push(...pick(pool.compound, 2, seed));
  const accCount = Math.min(targetCount - 5, pool.accessory.length);
  exercises.push(...pick(pool.accessory, Math.max(accCount, 2), seed + 1));
  exercises.push(...pick(pool.isolation, 2, seed + 2));

  while (exercises.length < 5) {
    const all = [...pool.compound, ...pool.accessory, ...pool.isolation];
    if (all.length === 0) break;
    const fb = all[(exercises.length + seed) % all.length];
    if (!exercises.find((e) => e.name === fb.name)) exercises.push(fb);
    else break;
  }

  const seen = new Set<string>();
  return exercises.filter((e) => { if (seen.has(e.name)) return false; seen.add(e.name); return true; });
}

function buildSets(ex: ExerciseTemplate, exIndex: number, config: { sets: number; reps: number; rir: number }, blockType: string, bench1RM: number, squat1RM: number, deadlift1RM: number) {
  const isMain = exIndex === 0;
  const isCompound = ex.category === "compound";
  let base1RM = 0;
  const name = ex.name.toLowerCase();
  if (name.includes("supino") && !name.includes("inclinado") && !name.includes("declinado")) base1RM = bench1RM;
  else if (name.includes("agachamento") && !name.includes("bulgaro") && !name.includes("goblet") && !name.includes("sumo")) base1RM = squat1RM;
  else if (name.includes("terra")) base1RM = deadlift1RM;

  if (isMain && (blockType === "strength" || blockType === "strength_base")) {
    const topPct = 0.87;
    const backPct = 0.77;
    return [
      { type: "top", targetSets: 1, targetReps: Math.max(config.reps - 2, 1), targetRIR: Math.max(config.rir - 1, 0), targetWeight: base1RM > 0 ? Math.round(base1RM * topPct / 2.5) * 2.5 : undefined, percentage: Math.round(topPct * 100), restSeconds: 180 },
      { type: "backoff", targetSets: config.sets - 1, targetReps: config.reps, targetRIR: config.rir, targetWeight: base1RM > 0 ? Math.round(base1RM * backPct / 2.5) * 2.5 : undefined, percentage: Math.round(backPct * 100), restSeconds: 150 },
    ];
  }

  const pct = isCompound ? 0.72 : 0.65;
  const weight = base1RM > 0 ? Math.round(base1RM * pct / 2.5) * 2.5 : undefined;
  const reps = isCompound ? config.reps : Math.min(config.reps + 4, 15);
  return [{ type: "normal", targetSets: config.sets, targetReps: reps, targetRIR: isCompound ? config.rir : config.rir + 1, targetWeight: weight, restSeconds: isCompound ? 120 : 90 }];
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader || "" } } });
    const { data: { user } } = await supabase.auth.getUser();

    const { squat1RM = 0, bench1RM = 0, deadlift1RM = 0, bodyWeight = 80, goal = "powerbuilding", frequency = 5, experience = "intermediate", equipment = "full", injuries = [], preferDumbell = false, saveToDb } = await req.json();

    const freq = Math.min(Math.max(frequency, 2), 7);
    const prefs: UserPreferences = {
      preferDumbell: preferDumbell === true,
      equipment: equipment || "full",
      injuries: Array.isArray(injuries) ? injuries : [],
      experience: experience || "intermediate",
    };

    const blocks = buildBlocks(goal);
    const daySplit = getDaySplit(freq);
    const programBlocks: any[] = [];

    for (let bIdx = 0; bIdx < blocks.length; bIdx++) {
      const block = blocks[bIdx];
      const weeks: any[] = [];
      for (let w = block.startWeek; w <= block.endWeek; w++) {
        const weekInBlock = w - block.startWeek;
        const config = block.weekConfigs[Math.min(weekInBlock, block.weekConfigs.length - 1)];
        const progressionKg = weekInBlock * 2.5;
        const days = daySplit.map((ds, dIdx) => {
          const exercises = selectExercises(ds.poolKey, w, dIdx, block.blockType, bIdx, block.blockType === "deload", prefs);
          const exercisesWithSets = exercises.map((ex, eIdx) => ({ name: ex.name, category: ex.category, muscleGroup: ex.muscleGroup, sets: buildSets(ex, eIdx, config, block.blockType, bench1RM + progressionKg, squat1RM + progressionKg * 2, deadlift1RM + progressionKg * 2) }));
          return { name: ds.name, dayOfWeek: ds.dayOfWeek, focus: block.blockType === "deload" ? ds.focus + " (Deload)" : ds.focus, exercises: exercisesWithSets };
        });
        weeks.push({ weekNumber: w, days });
      }
      programBlocks.push({ name: block.name, goal: block.goal, weekRange: `Semanas ${block.startWeek}-${block.endWeek}`, blockType: block.blockType, startWeek: block.startWeek, endWeek: block.endWeek, weeks });
    }

    const goalLabel: Record<string, string> = { powerbuilding: "Powerbuilding", strength: "Forca Maxima", hypertrophy: "Hipertrofia", recomp: "Recomposicao", endurance: "Resistencia" };
    const equipLabel = equipment === "home" ? " (Casa)" : equipment === "limited" ? " (Academia Limitada)" : "";
    const program = {
      name: `Iron ${goalLabel[goal] || "Powerbuilding"} 12sem${equipLabel}`,
      description: `Programa 12 semanas | ${freq}x/semana | ${prefs.experience}${prefs.preferDumbell ? " | preferencia por halteres" : ""}${prefs.injuries.length > 0 ? ` | restricoes: ${prefs.injuries.join(", ")}` : ""}`,
      durationWeeks: 12,
      blocks: programBlocks,
    };

    let totalDays = 0, totalExercises = 0;
    for (const b of program.blocks) for (const w of b.weeks) { totalDays += w.days.length; for (const d of w.days) totalExercises += d.exercises.length; }
    console.log(`Generated: ${program.blocks.length} blocks, ${totalDays} days, ${totalExercises} exercises. preferDumbell=${prefs.preferDumbell}, equipment=${prefs.equipment}, injuries=${prefs.injuries}, level=${prefs.experience}`);

    if (user && saveToDb !== false) {
      try {
        await supabase.from("training_programs").update({ is_active: false }).eq("user_id", user.id);
        const { data: dbProgram, error: progErr } = await supabase.from("training_programs").insert({ user_id: user.id, name: program.name, program_type: goal, description: program.description, duration_weeks: 12, days_per_week: freq, is_active: true }).select().single();
        if (progErr) throw progErr;
        for (let bIdx = 0; bIdx < program.blocks.length; bIdx++) {
          const block = program.blocks[bIdx];
          const { data: dbBlock, error: blockErr } = await supabase.from("training_blocks").insert({ program_id: dbProgram.id, name: block.name, block_type: block.blockType, goal: block.goal, start_week: block.startWeek, end_week: block.endWeek, order_index: bIdx }).select().single();
          if (blockErr) throw blockErr;
          for (const week of block.weeks) {
            const { data: dbWeek, error: weekErr } = await supabase.from("training_weeks").insert({ block_id: dbBlock.id, week_number: week.weekNumber }).select().single();
            if (weekErr) throw weekErr;
            for (let dIdx = 0; dIdx < week.days.length; dIdx++) {
              const day = week.days[dIdx];
              const { data: dbDay, error: dayErr } = await supabase.from("training_days").insert({ week_id: dbWeek.id, day_name: day.name, day_of_week: day.dayOfWeek, focus: day.focus, order_index: dIdx }).select().single();
              if (dayErr) throw dayErr;
              for (let eIdx = 0; eIdx < day.exercises.length; eIdx++) {
                const ex = day.exercises[eIdx];
                const { data: dbEx, error: exErr } = await supabase.from("workout_exercises").insert({ day_id: dbDay.id, exercise_name: ex.name, category: ex.category, muscle_group: ex.muscleGroup, order_index: eIdx }).select().single();
                if (exErr) throw exErr;
                for (let sIdx = 0; sIdx < ex.sets.length; sIdx++) {
                  const s = ex.sets[sIdx];
                  await supabase.from("planned_sets").insert({ workout_exercise_id: dbEx.id, set_number: sIdx + 1, target_sets: s.targetSets, target_reps: s.targetReps, target_rir: s.targetRIR, target_weight: s.targetWeight, load_percentage: s.percentage, rest_seconds: s.restSeconds || 120, is_top_set: s.type === "top", is_backoff: s.type === "backoff" });
                }
              }
            }
          }
        }
        return new Response(JSON.stringify({ program, programId: dbProgram.id }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      } catch (dbErr) {
        console.error("DB save error:", dbErr);
        return new Response(JSON.stringify({ program, dbSaveError: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    return new Response(JSON.stringify({ program }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("generate-program error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
