import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an elite Powerbuilding AI Coach performing automated training analysis.
Based on the athlete's recent workout data, generate 2-4 specific recommendations.

You MUST respond using the suggest_adjustments tool. Each recommendation should be one of these types:
- "load_increase": Suggest increasing weight for a specific exercise
- "load_decrease": Suggest decreasing weight due to fatigue or missed reps
- "rir_adjustment": Adjust RIR targets based on performance
- "accessory_change": Recommend modifying accessory work
- "deload": Suggest a deload week
- "volume_change": Adjust training volume

Each recommendation MUST include a specific title, description with exact numbers, the exercise name, and a suggested_change object with action details.`;

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
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch recent data
    const [profileRes, logsRes, liftsRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", user.id).single(),
      supabase.from("workout_logs").select("*, set_logs(*)").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
      supabase.from("current_lifts").select("*").eq("user_id", user.id).order("recorded_at", { ascending: false }).limit(20),
    ]);

    const context = {
      profile: profileRes.data,
      recentWorkouts: logsRes.data,
      recentLifts: liftsRes.data,
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
          { role: "user", content: `Analyze this athlete's recent training data and suggest adjustments:\n\n${JSON.stringify(context, null, 2)}` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "suggest_adjustments",
            description: "Return training adjustment recommendations",
            parameters: {
              type: "object",
              properties: {
                recommendations: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      type: { type: "string", enum: ["load_increase", "load_decrease", "rir_adjustment", "accessory_change", "deload", "volume_change"] },
                      title: { type: "string" },
                      description: { type: "string" },
                      exercise: { type: "string" },
                      suggested_change: {
                        type: "object",
                        properties: {
                          action: { type: "string" },
                          value: { type: "string" },
                        },
                        required: ["action", "value"],
                      },
                    },
                    required: ["type", "title", "description", "exercise", "suggested_change"],
                  },
                },
              },
              required: ["recommendations"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "suggest_adjustments" } },
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      return new Response(JSON.stringify({ recommendations: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = JSON.parse(toolCall.function.arguments);
    const recommendations = parsed.recommendations || [];

    // Store recommendations in DB
    if (recommendations.length > 0) {
      const inserts = recommendations.map((r: any) => ({
        user_id: user.id,
        type: r.type,
        title: r.title,
        description: r.description,
        exercise: r.exercise,
        suggested_change: r.suggested_change,
        status: "pending",
      }));

      await supabase.from("ai_recommendations").insert(inserts);
    }

    return new Response(JSON.stringify({ recommendations }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
