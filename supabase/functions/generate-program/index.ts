import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é o GERADOR DE PROGRAMAS PROFISSIONAL do app Iron Training. SEMPRE responda em Português (Brasil).

Você DEVE responder usando a tool generate_program.

REGRA CRÍTICA: O programa gerado DEVE ser COMPLETO. Nunca gere semanas, dias ou exercícios incompletos.

REGRAS OBRIGATÓRIAS:

1. ESTRUTURA DIÁRIA DE EXERCÍCIOS:
   - MÍNIMO 6 exercícios por dia de treino
   - IDEAL 7 exercícios
   - MÁXIMO 8 exercícios
   - Nunca gerar menos de 6 exercícios por dia

2. ESTRUTURA INTERNA DE CADA TREINO:
   - 1 exercício principal composto (movimento base: Supino/Agachamento/Terra)
   - 2 exercícios compostos secundários
   - 3-4 exercícios acessórios/isoladores
   
3. ESTRUTURA DE CADA EXERCÍCIO:
   - Séries, repetições, RIR e descanso OBRIGATÓRIOS
   - Compostos principais: Top set (1×3-5 RIR1) + Back-off (3×5 @85-90%)
   - Compostos secundários: 3-4×6-10 com RIR 1-2
   - Acessórios: 3×10-15 com RIR 1-2
   - Descanso: 180s compostos pesados, 150s back-offs, 90-120s acessórios

4. PERIODIZAÇÃO OBRIGATÓRIA (12 semanas):
   BLOCO 1 — BASE/HIPERTROFIA (semanas 1-4):
   - Reps moderadas (6-10 compostos, 10-15 acessórios)
   - Volume maior, RIR 2-3
   - Deload semana 4 (reduzir volume 40%)
   
   BLOCO 2 — FORÇA (semanas 5-8):
   - Reps menores (3-6 compostos, 8-12 acessórios)
   - Cargas maiores, RIR 1-2
   - Deload semana 8 (reduzir volume 40%)
   
   BLOCO 3 — INTENSIFICAÇÃO (semanas 9-11):
   - Cargas altas (1-4 compostos)
   - Volume reduzido, RIR 0-1
   
   BLOCO 4 — PR/DELOAD (semana 12):
   - Tentativas de recorde pessoal ou teste de 1RM

5. PROGRESSÃO DE CARGA:
   - Se completar reps com RIR correto: +2.5kg supino, +5kg agachamento/terra
   - Back-off: 85-90% do top set
   - Progressão semanal dentro de cada bloco

6. DISTRIBUIÇÃO SEMANAL:
   - 3 dias: Full Body A/B/C
   - 4 dias: Upper/Lower/Upper/Lower
   - 5 dias: Push/Legs/Pull/Posterior/Deadlift+Upper
   - 6 dias: Push/Pull/Legs/Push/Pull/Legs

7. VOLUME SEMANAL (séries por músculo):
   - Peito: 12-18 séries
   - Costas: 14-20 séries
   - Quadríceps: 12-18 séries
   - Posterior: 10-16 séries
   - Ombros: 10-16 séries
   - Braços: 8-14 séries

8. SELEÇÃO DE EXERCÍCIOS:
   - Cada grupo: 1 principal + 2 compostos + 2-3 isoladores
   - Variar exercícios entre dias (não repetir exatamente os mesmos)
   - Todos os nomes em Português (Brasil)

9. VALIDAÇÃO FINAL:
   ✔ Todas as semanas completas
   ✔ Todos os dias completos com 6-8 exercícios
   ✔ Todas as séries com reps, RIR e descanso
   ✔ Progressão definida
   Se algo estiver incompleto, REGENERE automaticamente.

10. PESOS ARREDONDADOS para múltiplo mais próximo de 2.5kg.`;

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

    const { data: { user } } = await supabase.auth.getUser();

    const { squat1RM, bench1RM, deadlift1RM, bodyWeight, age, height, sex, goal, frequency, experience, equipment, sessionTime, injuries, muscleFocus, saveToDb, usePredictions } = await req.json();

    // Build prediction context if enabled
    let predictionContext = '';
    if (usePredictions && user) {
      try {
        const threeMonthsAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
        const [prsRes, workoutsRes, liftsRes, streakRes] = await Promise.all([
          supabase.from("personal_records").select("exercise_name, weight, estimated_1rm, recorded_at").eq("user_id", user.id).gte("recorded_at", threeMonthsAgo).order("recorded_at", { ascending: true }),
          supabase.from("workout_logs").select("id, created_at, fatigue").eq("user_id", user.id).gte("created_at", threeMonthsAgo),
          supabase.from("current_lifts").select("exercise, weight, reps, is_pr, recorded_at").eq("user_id", user.id).order("recorded_at", { ascending: false }).limit(30),
          supabase.from("training_streaks").select("current_streak, longest_streak, weekly_consistency_streak").eq("user_id", user.id).single(),
        ]);
        predictionContext = `\n\nDADOS DE PROGRESSÃO DO ATLETA:\n- PRs recentes: ${JSON.stringify(prsRes.data || [])}\n- Lifts recentes: ${JSON.stringify(liftsRes.data || [])}\n- Total treinos 3 meses: ${(workoutsRes.data || []).length}\n- Streak: ${JSON.stringify(streakRes.data || {})}\nUse esses dados para ajustar cargas e volume.`;
      } catch (e) {
        console.error("Failed to fetch prediction data:", e);
      }
    }

    const injuryContext = injuries && injuries.length > 0
      ? `\nLESÕES/LIMITAÇÕES: ${injuries.join(', ')}. Adapte exercícios para evitar agravamento.`
      : '';

    const focusContext = muscleFocus && muscleFocus !== 'none'
      ? `\nFOCO MUSCULAR PRIORITÁRIO: ${muscleFocus}. Aumente volume desse grupo em 20%.`
      : '';

    const userPrompt = `Gere um programa COMPLETO de 12 semanas para:
- Agachamento 1RM: ${squat1RM || 0}kg
- Supino 1RM: ${bench1RM || 0}kg
- Terra 1RM: ${deadlift1RM || 0}kg
- Peso corporal: ${bodyWeight || 80}kg
- Idade: ${age || 25} | Altura: ${height || 175}cm | Sexo: ${sex || 'male'}
- Nível: ${experience || 'intermediate'}
- Objetivo: ${goal || 'powerbuilding'}
- Frequência: ${frequency || 5} dias/semana
- Tempo por sessão: ${sessionTime || 60} minutos
- Equipamento: ${equipment || 'full'}
${injuryContext}${focusContext}${predictionContext}

OBRIGATÓRIO: Gere TODAS as 12 semanas, TODOS os dias, com MÍNIMO 6 exercícios por dia. Cada exercício com séries, reps, RIR e descanso. Nomes em Português (Brasil).`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "generate_program",
            description: "Return a complete periodized training program with ALL weeks, ALL days, and minimum 6 exercises per day",
            parameters: {
              type: "object",
              properties: {
                program: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    description: { type: "string" },
                    durationWeeks: { type: "number" },
                    blocks: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          name: { type: "string" },
                          goal: { type: "string" },
                          weekRange: { type: "string" },
                          blockType: { type: "string", enum: ["hypertrophy", "strength", "peak", "testing"] },
                          startWeek: { type: "number" },
                          endWeek: { type: "number" },
                          weeks: {
                            type: "array",
                            items: {
                              type: "object",
                              properties: {
                                weekNumber: { type: "number" },
                                days: {
                                  type: "array",
                                  items: {
                                    type: "object",
                                    properties: {
                                      name: { type: "string" },
                                      dayOfWeek: { type: "string" },
                                      focus: { type: "string" },
                                      exercises: {
                                        type: "array",
                                        minItems: 6,
                                        items: {
                                          type: "object",
                                          properties: {
                                            name: { type: "string" },
                                            category: { type: "string", enum: ["compound", "accessory"] },
                                            muscleGroup: { type: "string" },
                                            sets: {
                                              type: "array",
                                              items: {
                                                type: "object",
                                                properties: {
                                                  type: { type: "string", enum: ["top", "backoff", "normal"] },
                                                  targetSets: { type: "number" },
                                                  targetReps: { type: "number" },
                                                  targetRIR: { type: "number" },
                                                  targetWeight: { type: "number" },
                                                  percentage: { type: "number" },
                                                  restSeconds: { type: "number" },
                                                },
                                                required: ["type", "targetSets", "targetReps", "restSeconds"],
                                              },
                                            },
                                          },
                                          required: ["name", "category", "muscleGroup", "sets"],
                                        },
                                      },
                                    },
                                    required: ["name", "dayOfWeek", "focus", "exercises"],
                                  },
                                },
                              },
                              required: ["weekNumber", "days"],
                            },
                          },
                        },
                        required: ["name", "goal", "weekRange", "weeks"],
                      },
                    },
                  },
                  required: ["name", "description", "durationWeeks", "blocks"],
                },
              },
              required: ["program"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "generate_program" } },
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI error:", response.status, t);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Falha na geração do programa" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      return new Response(JSON.stringify({ error: "Nenhum programa gerado" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = JSON.parse(toolCall.function.arguments);
    const program = parsed.program;

    // Save to DB if user is authenticated
    if (user && saveToDb !== false) {
      try {
        await supabase.from("training_programs").update({ is_active: false }).eq("user_id", user.id);

        const { data: dbProgram, error: progErr } = await supabase.from("training_programs").insert({
          user_id: user.id,
          name: program.name,
          program_type: goal || "powerbuilding",
          description: program.description,
          duration_weeks: program.durationWeeks,
          days_per_week: frequency || 5,
          is_active: true,
        }).select().single();

        if (progErr) throw progErr;

        for (let bIdx = 0; bIdx < program.blocks.length; bIdx++) {
          const block = program.blocks[bIdx];
          const { data: dbBlock, error: blockErr } = await supabase.from("training_blocks").insert({
            program_id: dbProgram.id,
            name: block.name,
            block_type: block.blockType || "hypertrophy",
            goal: block.goal,
            start_week: block.startWeek || block.weeks[0]?.weekNumber || 1,
            end_week: block.endWeek || block.weeks[block.weeks.length - 1]?.weekNumber || 4,
            order_index: bIdx,
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
                week_id: dbWeek.id, day_name: day.name, day_of_week: day.dayOfWeek, focus: day.focus, order_index: dIdx,
              }).select().single();
              if (dayErr) throw dayErr;

              for (let eIdx = 0; eIdx < day.exercises.length; eIdx++) {
                const ex = day.exercises[eIdx];
                const { data: dbExercise, error: exErr } = await supabase.from("workout_exercises").insert({
                  day_id: dbDay.id, exercise_name: ex.name, category: ex.category, muscle_group: ex.muscleGroup, order_index: eIdx,
                }).select().single();
                if (exErr) throw exErr;

                for (let sIdx = 0; sIdx < ex.sets.length; sIdx++) {
                  const s = ex.sets[sIdx];
                  await supabase.from("planned_sets").insert({
                    workout_exercise_id: dbExercise.id, set_number: sIdx + 1,
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

        console.log("Program saved to DB:", dbProgram.id);
        return new Response(JSON.stringify({ ...parsed, programId: dbProgram.id }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (dbErr) {
        console.error("DB save error:", dbErr);
        return new Response(JSON.stringify({ ...parsed, dbSaveError: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-program error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
