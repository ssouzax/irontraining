import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Epley formula
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

    // Get last 5 workouts with set logs
    const { data: recentWorkouts } = await supabase
      .from("workout_logs")
      .select("*, set_logs(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    if (!recentWorkouts || recentWorkouts.length === 0) {
      return new Response(JSON.stringify({ adjustments: [], message: "Dados insuficientes para análise" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adjustments: any[] = [];
    const exerciseData: Record<string, SetLog[]> = {};

    // Group set logs by exercise
    for (const workout of recentWorkouts) {
      const sets = (workout as any).set_logs || [];
      for (const set of sets) {
        if (!exerciseData[set.exercise_name]) exerciseData[set.exercise_name] = [];
        exerciseData[set.exercise_name].push(set);
      }
    }

    // Analyze each exercise
    for (const [exercise, sets] of Object.entries(exerciseData)) {
      const topSets = sets.filter(s => s.set_type === "top" && s.actual_weight && s.actual_reps);
      
      if (topSets.length === 0) continue;

      const latestTop = topSets[0];
      const targetRIR = latestTop.target_rir ?? 2;
      const actualRIR = latestTop.actual_rir ?? targetRIR;
      const rirDiff = actualRIR - targetRIR;

      // RIR higher than target = too easy → increase load
      if (rirDiff >= 1 && latestTop.actual_weight) {
        const increase = rirDiff >= 2 ? 5 : 2.5;
        adjustments.push({
          type: "load_increase",
          exercise,
          title: `Aumentar carga: ${exercise}`,
          description: `RIR reportado (${actualRIR}) maior que o alvo (${targetRIR}). Sugere-se aumentar ${increase}kg no top set (${latestTop.actual_weight}kg → ${latestTop.actual_weight + increase}kg).`,
          suggested_change: {
            action: "increase_weight",
            value: `+${increase}kg`,
            newWeight: latestTop.actual_weight + increase,
          },
        });
      }

      // RIR lower than target = too hard → decrease or maintain
      if (rirDiff <= -1 && latestTop.actual_weight) {
        const decrease = rirDiff <= -2 ? 5 : 2.5;
        adjustments.push({
          type: "load_decrease",
          exercise,
          title: `Reduzir carga: ${exercise}`,
          description: `RIR reportado (${actualRIR}) menor que o alvo (${targetRIR}). Sugere-se reduzir ${decrease}kg para manter a qualidade do treino.`,
          suggested_change: {
            action: "decrease_weight",
            value: `-${decrease}kg`,
            newWeight: latestTop.actual_weight - decrease,
          },
        });
      }

      // Check if reps were missed on any set
      const missedReps = sets.filter(s => 
        s.actual_reps !== null && s.target_reps !== null && s.actual_reps < s.target_reps
      );
      if (missedReps.length >= 2) {
        adjustments.push({
          type: "volume_change",
          exercise,
          title: `Reps falhadas: ${exercise}`,
          description: `${missedReps.length} séries com repetições abaixo do alvo. Considere repetir as cargas desta semana ou reduzir o volume.`,
          suggested_change: {
            action: "repeat_week",
            value: "Manter cargas atuais",
          },
        });
      }

      // PR detection
      if (latestTop.actual_weight && latestTop.actual_reps) {
        const e1rm = estimate1RM(latestTop.actual_weight, latestTop.actual_reps);
        const previousTops = topSets.slice(1);
        if (previousTops.length > 0) {
          const prevBest = Math.max(
            ...previousTops.map(s => estimate1RM(s.actual_weight!, s.actual_reps!))
          );
          if (e1rm > prevBest * 1.02) {
            adjustments.push({
              type: "load_increase",
              exercise,
              title: `🏆 Novo PR estimado: ${exercise}`,
              description: `E1RM subiu de ${prevBest}kg para ${e1rm}kg (+${Math.round((e1rm - prevBest) * 10) / 10}kg). Excelente progresso!`,
              suggested_change: {
                action: "new_pr",
                value: `${e1rm}kg E1RM`,
              },
            });
          }
        }
      }
    }

    // Fatigue detection: check last 3 workouts for accumulated high-fatigue signals
    const fatigueWorkouts = recentWorkouts
      .filter((w: any) => w.fatigue && w.fatigue >= 8)
      .length;
    
    if (fatigueWorkouts >= 2) {
      adjustments.push({
        type: "deload",
        exercise: "Geral",
        title: "⚠️ Deload recomendado",
        description: `Fadiga alta detectada em ${fatigueWorkouts} dos últimos treinos. Recomenda-se uma semana de deload com 60% das cargas normais.`,
        suggested_change: {
          action: "deload_week",
          value: "Reduzir cargas em 40%",
        },
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
