import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é o GERADOR DE PROGRAMAS, uma IA especializada em criar treinos powerbuilding completos e progressivos. SEMPRE responda em Português (Brasil).

Você DEVE responder usando a tool generate_program.

Suas funções:

1. RECEBER dados do atleta:
   - Levantamentos máximos (1RM), peso corporal, experiência, objetivos
   - Frequência semanal e disponibilidade de equipamentos

2. CRIAR treinos completos:
   - Dividir por dias (Push/Squat/Pull/Upper/Deadlift ou variações conforme frequência)
   - Selecionar exercícios compostos principais, secundários e isoladores
   - Especificar séries, reps, RIR e carga sugerida calculada dos 1RMs
   - Aplicar estrutura Top Set + Back-Off para todos compostos

3. PERIODIZAÇÃO inteligente (12 semanas):
   - Bloco 1 (Hipertrofia, semanas 1-4): RIR 2-3, reps mais altas (6-8 compostos, 8-12 acessórios)
   - Bloco 2 (Força, semanas 5-8): RIR 1-2, reps moderadas (3-5 compostos)
   - Bloco 3 (Pico/Intensidade Neural, semanas 9-11): RIR 0-1, reps baixas (1-3 compostos)
   - Semana 12: Teste de PR — tentativas máximas
   - Incluir deloads automáticos (semana 4 e 8 mais leves)

4. REGRAS de progressão automática:
   - Se atleta atingir topo da faixa de reps com RIR target → aumentar 2.5-5kg
   - Back-off calculado automaticamente: 85-90% do top set
   - Progressão semanal de carga dentro de cada bloco
   - Evitar overtraining: monitorar volume total por grupo muscular

5. DETALHES técnicos:
   - Rest: 180s compostos pesados, 150s back-offs, 90-120s acessórios
   - Notas técnicas para exercícios com risco (joelhos no agachamento, ombros no supino)
   - Alertas de fadiga e risco de plateau
   - Todos os pesos arredondados para múltiplo mais próximo de 2.5kg

Todos os nomes de exercícios, dias e descrições devem ser em Português (Brasil).`;

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

    const { squat1RM, bench1RM, deadlift1RM, bodyWeight, goal, frequency, saveToDb } = await req.json();

    const userPrompt = `Generate a complete 12-week powerbuilding program for an athlete with:
- Squat 1RM: ${squat1RM}kg
- Bench 1RM: ${bench1RM}kg  
- Deadlift 1RM: ${deadlift1RM}kg
- Body Weight: ${bodyWeight}kg
- Goal: ${goal || 'powerbuilding'}
- Training frequency: ${frequency || 5} days/week

Generate all 4 blocks with specific exercises, sets, reps, RIR targets, and working weights calculated from the 1RMs. Names in Portuguese.`;

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
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "generate_program",
            description: "Return a complete periodized training program",
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
                                                required: ["type", "targetSets", "targetReps"],
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
        return new Response(JSON.stringify({ error: "Limite de requisições excedido." }), {
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

    // Save to DB if user is authenticated and saveToDb is true
    if (user && saveToDb !== false) {
      try {
        // Deactivate existing programs
        await supabase.from("training_programs").update({ is_active: false }).eq("user_id", user.id);

        // Create program
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
              block_id: dbBlock.id,
              week_number: week.weekNumber,
            }).select().single();

            if (weekErr) throw weekErr;

            for (let dIdx = 0; dIdx < week.days.length; dIdx++) {
              const day = week.days[dIdx];
              const { data: dbDay, error: dayErr } = await supabase.from("training_days").insert({
                week_id: dbWeek.id,
                day_name: day.name,
                day_of_week: day.dayOfWeek,
                focus: day.focus,
                order_index: dIdx,
              }).select().single();

              if (dayErr) throw dayErr;

              for (let eIdx = 0; eIdx < day.exercises.length; eIdx++) {
                const ex = day.exercises[eIdx];
                const { data: dbExercise, error: exErr } = await supabase.from("workout_exercises").insert({
                  day_id: dbDay.id,
                  exercise_name: ex.name,
                  category: ex.category,
                  muscle_group: ex.muscleGroup,
                  order_index: eIdx,
                }).select().single();

                if (exErr) throw exErr;

                for (let sIdx = 0; sIdx < ex.sets.length; sIdx++) {
                  const s = ex.sets[sIdx];
                  await supabase.from("planned_sets").insert({
                    workout_exercise_id: dbExercise.id,
                    set_number: sIdx + 1,
                    target_sets: s.targetSets,
                    target_reps: s.targetReps,
                    target_rir: s.targetRIR,
                    target_weight: s.targetWeight,
                    load_percentage: s.percentage,
                    rest_seconds: s.restSeconds || 120,
                    is_top_set: s.type === "top",
                    is_backoff: s.type === "backoff",
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
        // Return program even if DB save fails
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
