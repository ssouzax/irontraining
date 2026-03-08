import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é o PREDITOR IA, especialista em análise de força e progressão para powerbuilding. SEMPRE responda em Português (Brasil).

Você DEVE responder usando a tool predict_strength.

Suas funções:

1. ANALISAR histórico do atleta:
   - Levantamentos máximos, top sets, back-off, RIR reportado
   - Treinos completados, consistência e volume total
   - Lesões ou limitações conhecidas
   - Taxa de progressão recente (ganho semanal de E1RM)

2. PREVER resultados com precisão:
   - Estimar 1RM atual de cada exercício baseado em top sets e reps
   - Projetar ganhos de força em 4, 8 e 12 semanas
   - Identificar plateaus ANTES que aconteçam
   - Calcular intervalo de confiança baseado na consistência

3. COMPARAR progresso:
   - Comparar desempenho com padrões de força por peso corporal (DOTS/Wilks)
   - Classificar nível do atleta (iniciante, intermediário, avançado, elite)
   - Detectar tendência de estagnação

4. RECOMENDAR ajustes:
   - Sugerir carga para próximo top set baseado na tendência
   - Recomendar deloads, variações de volume/intensidade
   - Identificar exercícios com maior potencial de ganho
   - Alertar sobre riscos de overtraining

Para cada exercício analise: tendência de E1RM, taxa semanal de ganho, semanas até próximo PR significativo (+2.5-5%), e nível de confiança da predição.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const authHeader = req.headers.get("Authorization");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader || "" } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { squat1RM, bench1RM, deadlift1RM, bodyWeight } = await req.json();

    // Fetch historical data
    const threeMonthsAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [prsRes, workoutsRes, liftsRes, streakRes, profileRes] = await Promise.all([
      supabase.from("personal_records").select("*").eq("user_id", user.id).gte("recorded_at", threeMonthsAgo).order("recorded_at", { ascending: true }),
      supabase.from("workout_logs").select("id, created_at, fatigue, day_name").eq("user_id", user.id).gte("created_at", threeMonthsAgo).order("created_at", { ascending: true }),
      supabase.from("current_lifts").select("*").eq("user_id", user.id).order("recorded_at", { ascending: false }).limit(30),
      supabase.from("training_streaks").select("*").eq("user_id", user.id).single(),
      supabase.from("profiles").select("body_weight, goals").eq("user_id", user.id).single(),
    ]);

    const context = {
      currentMaxes: { squat: squat1RM, bench: bench1RM, deadlift: deadlift1RM },
      bodyWeight: bodyWeight || profileRes.data?.body_weight || 94,
      goals: profileRes.data?.goals,
      personalRecords: prsRes.data || [],
      recentWorkouts: workoutsRes.data || [],
      recentLifts: liftsRes.data || [],
      streak: streakRes.data,
      workoutsLast30Days: (workoutsRes.data || []).filter(w => w.created_at >= thirtyDaysAgo).length,
    };

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Analise os dados deste atleta e faça predições de força:\n\n${JSON.stringify(context, null, 2)}` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "predict_strength",
            description: "Return strength predictions and analysis",
            parameters: {
              type: "object",
              properties: {
                predictions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      exercise: { type: "string" },
                      current_1rm: { type: "number" },
                      predicted_1rm_4w: { type: "number" },
                      predicted_1rm_8w: { type: "number" },
                      predicted_1rm_12w: { type: "number" },
                      weekly_gain_kg: { type: "number" },
                      weeks_to_next_pr: { type: "number" },
                      confidence: { type: "number" },
                      level: { type: "string", enum: ["iniciante", "intermediario", "avancado", "elite"] },
                      plateau_risk: { type: "string", enum: ["baixo", "medio", "alto"] },
                    },
                    required: ["exercise", "current_1rm", "predicted_1rm_4w", "predicted_1rm_8w", "predicted_1rm_12w", "weekly_gain_kg", "weeks_to_next_pr", "confidence", "level", "plateau_risk"],
                  },
                },
                overall_analysis: { type: "string" },
                recommendations: {
                  type: "array",
                  items: { type: "string" },
                },
                next_top_sets: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      exercise: { type: "string" },
                      suggested_weight: { type: "number" },
                      suggested_reps: { type: "number" },
                      suggested_rir: { type: "number" },
                    },
                    required: ["exercise", "suggested_weight", "suggested_reps", "suggested_rir"],
                  },
                },
              },
              required: ["predictions", "overall_analysis", "recommendations", "next_top_sets"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "predict_strength" } },
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI error:", response.status, t);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Falha na predição" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      return new Response(JSON.stringify({ error: "Nenhuma predição gerada" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("predict error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
