import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function estimate1RM(weight: number, reps: number): number {
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}

interface SetLog {
  exercise_name: string;
  set_type: string;
  actual_weight: number | null;
  actual_reps: number | null;
  actual_rir: number | null;
  target_weight: number | null;
  target_reps: number | null;
  target_rir: number | null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader || "" } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get data from both old set_logs and new performed_sets
    const [oldLogsRes, newLogsRes, workoutsRes] = await Promise.all([
      supabase.from("set_logs").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(100),
      supabase.from("performed_sets").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(100),
      supabase.from("workout_logs").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
    ]);

    // Merge both sources into a unified format
    const allSets: SetLog[] = [];
    
    if (oldLogsRes.data) {
      for (const s of oldLogsRes.data) {
        allSets.push({
          exercise_name: s.exercise_name,
          set_type: s.set_type,
          actual_weight: s.actual_weight,
          actual_reps: s.actual_reps,
          actual_rir: s.actual_rir,
          target_weight: s.target_weight,
          target_reps: s.target_reps,
          target_rir: s.target_rir,
        });
      }
    }

    if (newLogsRes.data) {
      for (const s of newLogsRes.data) {
        allSets.push({
          exercise_name: s.exercise_name,
          set_type: "normal",
          actual_weight: s.weight_used,
          actual_reps: s.reps_completed,
          actual_rir: s.rir_reported,
          target_weight: null,
          target_reps: null,
          target_rir: null,
        });
      }
    }

    if (allSets.length === 0) {
      return new Response(JSON.stringify({ adjustments: [], message: "Dados insuficientes para análise" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adjustments: any[] = [];
    const exerciseData: Record<string, SetLog[]> = {};

    for (const set of allSets) {
      if (!exerciseData[set.exercise_name]) exerciseData[set.exercise_name] = [];
      exerciseData[set.exercise_name].push(set);
    }

    // Progression rules per exercise type
    const progressionIncrease: Record<string, number> = {
      "Bench Press": 2.5, "Supino": 2.5, "Supino Reto": 2.5,
      "Back Squat": 5, "Agachamento": 5, "Agachamento Livre": 5,
      "Conventional Deadlift": 5, "Terra": 5, "Levantamento Terra": 5,
    };

    for (const [exercise, sets] of Object.entries(exerciseData)) {
      const topSets = sets.filter(s => (s.set_type === "top" || s.set_type === "normal") && s.actual_weight && s.actual_reps);
      if (topSets.length === 0) continue;

      const latestTop = topSets[0];
      const targetRIR = latestTop.target_rir ?? 2;
      const actualRIR = latestTop.actual_rir ?? targetRIR;
      const rirDiff = actualRIR - targetRIR;

      // Determine increase amount based on exercise
      const defaultIncrease = exercise.toLowerCase().includes("supino") || exercise.toLowerCase().includes("bench") ? 2.5 : 5;
      const increase = progressionIncrease[exercise] || defaultIncrease;

      // TOP SET ANALYSIS: RIR higher than target = too easy
      if (rirDiff >= 1 && latestTop.actual_weight) {
        const incr = rirDiff >= 2 ? increase * 2 : increase;
        adjustments.push({
          type: "load_increase",
          exercise,
          title: `Aumentar carga: ${exercise}`,
          description: `RIR reportado (${actualRIR}) maior que o alvo (${targetRIR}). Sugere-se aumentar ${incr}kg no top set (${latestTop.actual_weight}kg → ${latestTop.actual_weight + incr}kg).`,
          suggested_change: { action: "increase_weight", value: `+${incr}kg`, newWeight: latestTop.actual_weight + incr },
        });
      }

      // TOP SET ANALYSIS: RIR lower than target = too hard
      if (rirDiff <= -1 && latestTop.actual_weight) {
        const decrease = rirDiff <= -2 ? increase * 2 : increase;
        adjustments.push({
          type: "load_decrease",
          exercise,
          title: `Reduzir carga: ${exercise}`,
          description: `RIR reportado (${actualRIR}) menor que o alvo (${targetRIR}). Sugere-se reduzir ${decrease}kg para manter a qualidade do treino.`,
          suggested_change: { action: "decrease_weight", value: `-${decrease}kg`, newWeight: latestTop.actual_weight - decrease },
        });
      }

      // BACK-OFF SET ANALYSIS: Check RIR drop across sets
      const backoffSets = sets.filter(s => s.set_type === "backoff" && s.actual_rir !== null);
      if (backoffSets.length >= 2) {
        const rirValues = backoffSets.map(s => s.actual_rir!);
        const rirDrop = rirValues[0] - rirValues[rirValues.length - 1];
        if (rirDrop >= 3) {
          adjustments.push({
            type: "volume_change",
            exercise,
            title: `Fadiga nas back-off: ${exercise}`,
            description: `RIR caiu de ${rirValues[0]} para ${rirValues[rirValues.length - 1]} durante as back-off sets. Acúmulo de fadiga detectado. Considere reduzir volume acessório ou aumentar descanso.`,
            suggested_change: { action: "reduce_volume", value: "Reduzir 1-2 séries de acessórios" },
          });
        }
      }

      // Check missed reps
      const missedReps = sets.filter(s => s.actual_reps !== null && s.target_reps !== null && s.actual_reps < s.target_reps);
      if (missedReps.length >= 2) {
        adjustments.push({
          type: "volume_change",
          exercise,
          title: `Reps falhadas: ${exercise}`,
          description: `${missedReps.length} séries com repetições abaixo do alvo. Considere repetir as cargas desta semana.`,
          suggested_change: { action: "repeat_week", value: "Manter cargas atuais" },
        });
      }

      // PR detection via E1RM
      if (latestTop.actual_weight && latestTop.actual_reps) {
        const e1rm = estimate1RM(latestTop.actual_weight, latestTop.actual_reps);
        const previousTops = topSets.slice(1);
        if (previousTops.length > 0) {
          const prevBest = Math.max(...previousTops.map(s => estimate1RM(s.actual_weight!, s.actual_reps!)));
          if (e1rm > prevBest * 1.02) {
            adjustments.push({
              type: "load_increase",
              exercise,
              title: `🏆 Novo PR estimado: ${exercise}`,
              description: `E1RM subiu de ${prevBest}kg para ${e1rm}kg (+${Math.round((e1rm - prevBest) * 10) / 10}kg). Excelente progresso!`,
              suggested_change: { action: "new_pr", value: `${e1rm}kg E1RM` },
            });

            // Save PR to personal_records
            await supabase.from("personal_records").insert({
              user_id: user.id,
              exercise_name: exercise,
              weight: latestTop.actual_weight,
              reps: latestTop.actual_reps,
              estimated_1rm: e1rm,
              pr_type: "weight",
            });
          }
        }
      }
    }

    // PLATEAU DETECTION: Check if E1RM stagnated across last 4+ weeks
    const compoundExercises = Object.keys(exerciseData).filter(e => {
      const lower = e.toLowerCase();
      return lower.includes("squat") || lower.includes("agachamento") || lower.includes("bench") || lower.includes("supino") || lower.includes("deadlift") || lower.includes("terra");
    });

    for (const exercise of compoundExercises) {
      const sets = exerciseData[exercise].filter(s => s.actual_weight && s.actual_reps);
      if (sets.length >= 8) {
        const recent4 = sets.slice(0, 4).map(s => estimate1RM(s.actual_weight!, s.actual_reps!));
        const older4 = sets.slice(4, 8).map(s => estimate1RM(s.actual_weight!, s.actual_reps!));
        const recentAvg = recent4.reduce((a, b) => a + b, 0) / recent4.length;
        const olderAvg = older4.reduce((a, b) => a + b, 0) / older4.length;
        
        if (recentAvg <= olderAvg * 1.01) {
          adjustments.push({
            type: "rir_adjustment",
            exercise,
            title: `⚠️ Platô detectado: ${exercise}`,
            description: `E1RM estagnado nas últimas semanas (${Math.round(olderAvg)}kg → ${Math.round(recentAvg)}kg). Considere: ajustar acessórios, reduzir carga temporariamente, ou variar o esquema de reps.`,
            suggested_change: { action: "plateau_break", value: "Variar estímulo" },
          });
        }
      }
    }

    // FATIGUE DETECTION
    const recentWorkouts = workoutsRes.data || [];
    const fatigueWorkouts = recentWorkouts.filter((w: any) => w.fatigue && w.fatigue >= 8).length;
    if (fatigueWorkouts >= 2) {
      adjustments.push({
        type: "deload",
        exercise: "Geral",
        title: "⚠️ Deload recomendado",
        description: `Fadiga alta detectada em ${fatigueWorkouts} dos últimos treinos. Recomenda-se uma semana de deload com 60% das cargas normais.`,
        suggested_change: { action: "deload_week", value: "Reduzir cargas em 40%" },
      });
    }

    // Store recommendations
    if (adjustments.length > 0) {
      const inserts = adjustments.map(a => ({
        user_id: user.id,
        type: a.type,
        title: a.title,
        description: a.description,
        exercise: a.exercise,
        suggested_change: a.suggested_change,
        status: "pending",
      }));
      await supabase.from("ai_recommendations").insert(inserts);
    }

    return new Response(JSON.stringify({ adjustments }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("auto-progression error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
