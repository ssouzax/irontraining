import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─── STEP 1: Deterministic structure builders ───

interface BlockDef {
  name: string;
  goal: string;
  blockType: string;
  weekRange: string;
  startWeek: number;
  endWeek: number;
  repRange: string;
  rirRange: string;
  volumeMultiplier: number;
  intensityMultiplier: number;
}

function buildBlocks(durationWeeks: number): BlockDef[] {
  if (durationWeeks <= 4) {
    return [{
      name: "Hipertrofia", goal: "Volume e hipertrofia", blockType: "hypertrophy",
      weekRange: `Semanas 1-${durationWeeks}`, startWeek: 1, endWeek: durationWeeks,
      repRange: "8-12 compostos, 10-15 acessórios", rirRange: "RIR 2-3",
      volumeMultiplier: 1.0, intensityMultiplier: 0.70,
    }];
  }
  if (durationWeeks <= 8) {
    const mid = Math.ceil(durationWeeks / 2);
    return [
      { name: "Hipertrofia", goal: "Volume e base muscular", blockType: "hypertrophy", weekRange: `Semanas 1-${mid}`, startWeek: 1, endWeek: mid, repRange: "8-12 compostos, 10-15 acessórios", rirRange: "RIR 2-3", volumeMultiplier: 1.0, intensityMultiplier: 0.70 },
      { name: "Força", goal: "Ganho de força máxima", blockType: "strength", weekRange: `Semanas ${mid+1}-${durationWeeks}`, startWeek: mid+1, endWeek: durationWeeks, repRange: "4-6 compostos, 8-12 acessórios", rirRange: "RIR 1-2", volumeMultiplier: 0.85, intensityMultiplier: 0.80 },
    ];
  }
  // 12 weeks (default)
  return [
    { name: "Base / Hipertrofia", goal: "Volume, hipertrofia e base muscular", blockType: "hypertrophy", weekRange: "Semanas 1-4", startWeek: 1, endWeek: 4, repRange: "6-10 compostos, 10-15 acessórios", rirRange: "RIR 2-3", volumeMultiplier: 1.0, intensityMultiplier: 0.70 },
    { name: "Força", goal: "Ganho de força com cargas maiores", blockType: "strength", weekRange: "Semanas 5-8", startWeek: 5, endWeek: 8, repRange: "3-6 compostos, 8-12 acessórios", rirRange: "RIR 1-2", volumeMultiplier: 0.85, intensityMultiplier: 0.80 },
    { name: "Intensificação", goal: "Cargas altas e volume reduzido", blockType: "peak", weekRange: "Semanas 9-11", startWeek: 9, endWeek: 11, repRange: "1-4 compostos, 6-10 acessórios", rirRange: "RIR 0-1", volumeMultiplier: 0.70, intensityMultiplier: 0.90 },
    { name: "PR / Deload", goal: "Teste de 1RM ou recuperação ativa", blockType: "testing", weekRange: "Semana 12", startWeek: 12, endWeek: 12, repRange: "1-3 teste ou 8-12 leve", rirRange: "RIR 0 ou 4+", volumeMultiplier: 0.50, intensityMultiplier: 0.95 },
  ];
}

function getDaySplit(frequency: number): { name: string; dayOfWeek: string; focus: string }[] {
  const splits: Record<number, { name: string; dayOfWeek: string; focus: string }[]> = {
    2: [
      { name: "Full Body A", dayOfWeek: "Segunda", focus: "Corpo inteiro - ênfase push" },
      { name: "Full Body B", dayOfWeek: "Quinta", focus: "Corpo inteiro - ênfase pull" },
    ],
    3: [
      { name: "Full Body A", dayOfWeek: "Segunda", focus: "Peito, Costas, Pernas" },
      { name: "Full Body B", dayOfWeek: "Quarta", focus: "Ombros, Braços, Pernas" },
      { name: "Full Body C", dayOfWeek: "Sexta", focus: "Posterior, Peito, Costas" },
    ],
    4: [
      { name: "Upper A", dayOfWeek: "Segunda", focus: "Peito, Ombros, Tríceps" },
      { name: "Lower A", dayOfWeek: "Terça", focus: "Quadríceps, Posterior, Panturrilha" },
      { name: "Upper B", dayOfWeek: "Quinta", focus: "Costas, Bíceps, Ombros" },
      { name: "Lower B", dayOfWeek: "Sexta", focus: "Glúteos, Posterior, Quadríceps" },
    ],
    5: [
      { name: "Push", dayOfWeek: "Segunda", focus: "Peito, Ombros, Tríceps" },
      { name: "Legs", dayOfWeek: "Terça", focus: "Quadríceps, Panturrilha, Abdômen" },
      { name: "Pull", dayOfWeek: "Quarta", focus: "Costas, Bíceps, Antebraço" },
      { name: "Posterior", dayOfWeek: "Quinta", focus: "Posterior, Glúteos, Lombar" },
      { name: "Upper", dayOfWeek: "Sexta", focus: "Ombros, Peito, Costas, Braços" },
    ],
    6: [
      { name: "Push A", dayOfWeek: "Segunda", focus: "Peito, Ombros, Tríceps" },
      { name: "Pull A", dayOfWeek: "Terça", focus: "Costas, Bíceps, Antebraço" },
      { name: "Legs A", dayOfWeek: "Quarta", focus: "Quadríceps, Panturrilha" },
      { name: "Push B", dayOfWeek: "Quinta", focus: "Ombros, Peito, Tríceps" },
      { name: "Pull B", dayOfWeek: "Sexta", focus: "Costas, Posterior, Bíceps" },
      { name: "Legs B", dayOfWeek: "Sábado", focus: "Posterior, Glúteos, Panturrilha" },
    ],
    7: [
      { name: "Push", dayOfWeek: "Segunda", focus: "Peito, Ombros, Tríceps" },
      { name: "Pull", dayOfWeek: "Terça", focus: "Costas, Bíceps" },
      { name: "Legs", dayOfWeek: "Quarta", focus: "Quadríceps, Panturrilha" },
      { name: "Ombros + Braços", dayOfWeek: "Quinta", focus: "Ombros, Bíceps, Tríceps" },
      { name: "Posterior", dayOfWeek: "Sexta", focus: "Posterior, Glúteos, Lombar" },
      { name: "Peito + Costas", dayOfWeek: "Sábado", focus: "Peito, Costas" },
      { name: "Recuperação Ativa", dayOfWeek: "Domingo", focus: "Abdômen, Mobilidade, Cardio leve" },
    ],
  };
  return splits[frequency] || splits[5];
}

// ─── STEP 2: AI call per block to generate day templates ───

const BLOCK_PROMPT = `Você é um treinador profissional de força e hipertrofia. Responda APENAS com a tool generate_block_days.

REGRAS OBRIGATÓRIAS:
1. Cada dia DEVE ter entre 6 e 8 exercícios
2. Estrutura: 1 composto principal + 2 compostos secundários + 3-4 acessórios/isoladores
3. Compostos principais: Top set + Back-off sets
4. Todos os nomes em Português (Brasil)
5. Todos exercícios DEVEM ter séries, repetições, RIR e descanso
6. Descanso: 180s compostos pesados, 120s back-offs, 90s acessórios
7. Pesos arredondados para múltiplo de 2.5kg
8. NUNCA gerar menos de 6 exercícios por dia`;

async function generateBlockDays(
  apiKey: string,
  block: BlockDef,
  daySplit: { name: string; focus: string }[],
  userContext: string,
): Promise<any[]> {
  const dayNames = daySplit.map(d => `"${d.name}" (foco: ${d.focus})`).join(", ");

  const prompt = `Gere os exercícios para o bloco "${block.name}" (${block.goal}).
Fase: ${block.blockType} | Reps: ${block.repRange} | Intensidade: ${block.rirRange}
Multiplicador de volume: ${block.volumeMultiplier} | Intensidade: ${Math.round(block.intensityMultiplier * 100)}% do 1RM

Dias a gerar: ${dayNames}

${userContext}

Gere EXATAMENTE ${daySplit.length} dias, cada um com 6-8 exercícios completos.`;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: BLOCK_PROMPT },
        { role: "user", content: prompt },
      ],
      tools: [{
        type: "function",
        function: {
          name: "generate_block_days",
          description: "Return exercises for each day type in a training block",
          parameters: {
            type: "object",
            properties: {
              days: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
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
                  required: ["name", "focus", "exercises"],
                },
              },
            },
            required: ["days"],
          },
        },
      }],
      tool_choice: { type: "function", function: { name: "generate_block_days" } },
    }),
  });

  if (!response.ok) {
    const t = await response.text();
    console.error(`AI error for block ${block.name}:`, response.status, t);
    throw new Error(`Falha ao gerar bloco ${block.name}: ${response.status}`);
  }

  const aiResult = await response.json();
  const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall) throw new Error(`Nenhum dado retornado para bloco ${block.name}`);

  const parsed = JSON.parse(toolCall.function.arguments);
  return parsed.days || [];
}

// ─── STEP 3: Apply weekly progression to day templates ───

function applyWeekProgression(
  dayTemplate: any,
  weekNumber: number,
  blockStartWeek: number,
  blockType: string,
): any {
  const weekInBlock = weekNumber - blockStartWeek;
  const progressionKg = weekInBlock * 2.5;

  return {
    ...dayTemplate,
    exercises: (dayTemplate.exercises || []).map((ex: any) => ({
      ...ex,
      sets: (ex.sets || []).map((s: any) => {
        let weight = s.targetWeight || 0;
        if (weight > 0) {
          if (ex.category === "compound") {
            weight = Math.round((weight + progressionKg) / 2.5) * 2.5;
          } else if (weekInBlock > 0) {
            weight = Math.round((weight + weekInBlock * 1.25) / 2.5) * 2.5;
          }
        }
        return { ...s, targetWeight: weight > 0 ? weight : undefined };
      }),
    })),
  };
}

// ─── STEP 4: Validate completeness ───

function validateProgram(program: any, frequency: number): string[] {
  const errors: string[] = [];
  if (!program.blocks || program.blocks.length === 0) {
    errors.push("Nenhum bloco gerado");
    return errors;
  }
  for (const block of program.blocks) {
    if (!block.weeks || block.weeks.length === 0) {
      errors.push(`Bloco "${block.name}" sem semanas`);
      continue;
    }
    for (const week of block.weeks) {
      if (!week.days || week.days.length < frequency) {
        errors.push(`Semana ${week.weekNumber}: ${week.days?.length || 0}/${frequency} dias`);
      }
      for (const day of (week.days || [])) {
        if (!day.exercises || day.exercises.length < 5) {
          errors.push(`Semana ${week.weekNumber}, ${day.name}: apenas ${day.exercises?.length || 0} exercícios`);
        }
      }
    }
  }
  return errors;
}

// ─── Main handler ───

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

    const {
      squat1RM, bench1RM, deadlift1RM, bodyWeight, age, height, sex,
      goal, frequency, experience, equipment, sessionTime,
      injuries, muscleFocus, saveToDb, usePredictions,
    } = await req.json();

    const freq = frequency || 5;
    const durationWeeks = 12;

    // Build prediction context
    let predictionContext = '';
    if (usePredictions && user) {
      try {
        const threeMonthsAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
        const [prsRes, liftsRes] = await Promise.all([
          supabase.from("personal_records").select("exercise_name, weight, estimated_1rm").eq("user_id", user.id).gte("recorded_at", threeMonthsAgo).order("recorded_at", { ascending: false }).limit(10),
          supabase.from("current_lifts").select("exercise, weight, reps").eq("user_id", user.id).order("recorded_at", { ascending: false }).limit(10),
        ]);
        if (prsRes.data?.length) predictionContext += `\nPRs recentes: ${JSON.stringify(prsRes.data)}`;
        if (liftsRes.data?.length) predictionContext += `\nLifts recentes: ${JSON.stringify(liftsRes.data)}`;
      } catch (e) { console.error("Prediction fetch error:", e); }
    }

    const injuryCtx = injuries?.length ? `\nLESÕES: ${injuries.join(', ')}. Adapte exercícios.` : '';
    const focusCtx = muscleFocus && muscleFocus !== 'none' ? `\nFOCO MUSCULAR: ${muscleFocus}. Aumente volume desse grupo em 20%.` : '';

    const userContext = `Dados do atleta:
- Agachamento 1RM: ${squat1RM || 0}kg | Supino 1RM: ${bench1RM || 0}kg | Terra 1RM: ${deadlift1RM || 0}kg
- Peso: ${bodyWeight || 80}kg | Idade: ${age || 25} | Sexo: ${sex || 'male'}
- Nível: ${experience || 'intermediate'} | Objetivo: ${goal || 'powerbuilding'}
- Tempo por sessão: ${sessionTime || 60}min | Equipamento: ${equipment || 'full'}${injuryCtx}${focusCtx}${predictionContext}`;

    // ─── STEP 1: Build deterministic structure ───
    const blocks = buildBlocks(durationWeeks);
    const daySplit = getDaySplit(freq);

    // ─── STEP 2: Generate exercises per block via AI ───
    const programBlocks: any[] = [];

    for (const block of blocks) {
      console.log(`Generating block: ${block.name} (weeks ${block.startWeek}-${block.endWeek})`);

      let dayTemplates: any[];
      try {
        dayTemplates = await generateBlockDays(LOVABLE_API_KEY, block, daySplit, userContext);
      } catch (err) {
        console.error(`Failed block ${block.name}, retrying...`, err);
        // Retry once
        dayTemplates = await generateBlockDays(LOVABLE_API_KEY, block, daySplit, userContext);
      }

      // Ensure we have templates for all days
      while (dayTemplates.length < daySplit.length) {
        const missing = daySplit[dayTemplates.length];
        dayTemplates.push({
          name: missing.name,
          focus: missing.focus,
          exercises: dayTemplates[0]?.exercises || [],
        });
      }

      // ─── STEP 3: Replicate across weeks with progression ───
      const weeks: any[] = [];
      for (let w = block.startWeek; w <= block.endWeek; w++) {
        const isDeloadWeek = (w === block.endWeek && block.endWeek - block.startWeek >= 3);
        const days = daySplit.map((ds, idx) => {
          const template = dayTemplates[idx] || dayTemplates[0];
          const progressed = applyWeekProgression(template, w, block.startWeek, block.blockType);

          // Deload: reduce volume
          if (isDeloadWeek) {
            return {
              name: ds.name,
              dayOfWeek: ds.dayOfWeek,
              focus: ds.focus + " (Deload)",
              exercises: (progressed.exercises || []).map((ex: any) => ({
                ...ex,
                sets: (ex.sets || []).map((s: any) => ({
                  ...s,
                  targetSets: Math.max(2, Math.ceil((s.targetSets || 3) * 0.6)),
                  targetRIR: Math.max((s.targetRIR || 2) + 2, 3),
                })),
              })),
            };
          }

          return {
            name: ds.name,
            dayOfWeek: ds.dayOfWeek,
            focus: ds.focus,
            exercises: progressed.exercises,
          };
        });

        weeks.push({ weekNumber: w, days });
      }

      programBlocks.push({
        name: block.name,
        goal: block.goal,
        weekRange: block.weekRange,
        blockType: block.blockType,
        startWeek: block.startWeek,
        endWeek: block.endWeek,
        weeks,
      });
    }

    const goalLabel = {
      powerbuilding: "Powerbuilding",
      strength: "Força Máxima",
      hypertrophy: "Hipertrofia",
      recomp: "Recomposição Corporal",
      endurance: "Resistência Muscular",
    }[goal || "powerbuilding"] || "Powerbuilding";

    const program = {
      name: `Iron ${goalLabel} ${durationWeeks}sem`,
      description: `Programa de ${durationWeeks} semanas focado em ${goalLabel.toLowerCase()} com ${freq} dias/semana. Periodização em ${programBlocks.length} blocos.`,
      durationWeeks,
      blocks: programBlocks,
    };

    // ─── STEP 4: Validate ───
    const errors = validateProgram(program, freq);
    if (errors.length > 0) {
      console.warn("Validation warnings:", errors);
    }

    // ─── STEP 5: Save to DB ───
    if (user && saveToDb !== false) {
      try {
        await supabase.from("training_programs").update({ is_active: false }).eq("user_id", user.id);

        const { data: dbProgram, error: progErr } = await supabase.from("training_programs").insert({
          user_id: user.id,
          name: program.name,
          program_type: goal || "powerbuilding",
          description: program.description,
          duration_weeks: program.durationWeeks,
          days_per_week: freq,
          is_active: true,
        }).select().single();

        if (progErr) throw progErr;

        for (let bIdx = 0; bIdx < program.blocks.length; bIdx++) {
          const block = program.blocks[bIdx];
          const { data: dbBlock, error: blockErr } = await supabase.from("training_blocks").insert({
            program_id: dbProgram.id,
            name: block.name,
            block_type: block.blockType,
            goal: block.goal,
            start_week: block.startWeek,
            end_week: block.endWeek,
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

              for (let eIdx = 0; eIdx < (day.exercises || []).length; eIdx++) {
                const ex = day.exercises[eIdx];
                const { data: dbEx, error: exErr } = await supabase.from("workout_exercises").insert({
                  day_id: dbDay.id, exercise_name: ex.name, category: ex.category, muscle_group: ex.muscleGroup, order_index: eIdx,
                }).select().single();
                if (exErr) throw exErr;

                for (let sIdx = 0; sIdx < (ex.sets || []).length; sIdx++) {
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
