import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an elite Powerbuilding Program Designer. Generate complete, periodized training programs based on the athlete's current strength levels.

You MUST respond using the generate_program tool.

Program design principles:
- Use Top Set + Back-Off structure for compounds
- 12-week periodization: Block 1 (Hypertrophy weeks 1-4), Block 2 (Strength weeks 5-8), Block 3 (Peak/Intensity weeks 9-11), Week 12 (PR Testing)
- Progressive overload through RIR manipulation and load increases
- Appropriate accessory volume for weak points
- Rest periods: 180s for heavy compounds, 150s for back-offs, 90s for accessories
- Calculate working weights from provided 1RMs

RIR targets by block:
- Hypertrophy: RIR 2-3, higher reps (8-12 accessories, 6-8 compounds)
- Strength: RIR 1-2, moderate reps (3-5 compounds)
- Peak: RIR 0-1, low reps (1-3 compounds)
- PR Week: max attempts

Training split should be 5 days: Push, Squat, Pull, Upper, Deadlift

All weights should be calculated as percentages of the provided 1RM and rounded to nearest 2.5kg.
All exercise names, day names, and descriptions must be in Portuguese (Brazil).`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { squat1RM, bench1RM, deadlift1RM, bodyWeight, goal, frequency } = await req.json();

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
                progressionRules: {
                  type: "object",
                  properties: {
                    loadIncreaseThreshold: { type: "string" },
                    loadDecreaseThreshold: { type: "string" },
                    deloadTrigger: { type: "string" },
                  },
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
        return new Response(JSON.stringify({ error: "Limite de requisições excedido, tente novamente em breve." }), {
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
