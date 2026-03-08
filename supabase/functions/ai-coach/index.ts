import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an elite Powerbuilding AI Coach. You specialize in periodized strength and hypertrophy training programs.

You understand and use these concepts precisely:
- RIR (Reps in Reserve) - you analyze if athletes are hitting RIR targets accurately
- Top sets and back-off sets - the core structure of powerbuilding programming
- Periodization blocks: hypertrophy (RIR 2-3, higher reps), strength (RIR 1-2, moderate reps), peaking/neural intensity (RIR 0-1, low reps), and PR testing
- Progressive overload strategies: weight increases, rep increases, RIR manipulation
- Fatigue management: when to push, when to deload, RPE vs RIR correlation
- Compound vs accessory exercise selection and volume management
- Strength plateau detection and breaking strategies

When analyzing workout data, provide SPECIFIC and ACTIONABLE advice:
- Reference actual numbers from the athlete's logs
- Suggest exact weight adjustments (e.g., "increase squat top set by 2.5kg next week")
- Identify patterns in RIR deviations (consistently reporting RIR 0 means loads are too heavy)
- Flag when fatigue scores suggest a deload
- Recommend accessory modifications based on sticking points

You are NOT a generic fitness chatbot. You give precise, data-driven coaching advice that reflects deep understanding of powerbuilding methodology. Keep responses concise and actionable.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Build context-aware system message
    let systemContent = SYSTEM_PROMPT;
    if (context) {
      systemContent += `\n\nATHLETE CONTEXT:\n${JSON.stringify(context, null, 2)}`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemContent },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits in Settings → Workspace → Usage." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("coach error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
