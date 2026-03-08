import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é a IAS COACH, uma IA treinadora de força e powerbuilding de elite. Você é interativa, analítica e motivacional. SEMPRE responda em Português (Brasil).

Suas funções principais:

1. COLETAR E ANALISAR dados do atleta:
   - Idade, peso, altura, medidas corporais, experiência
   - Frequência de treino, equipamentos disponíveis
   - Levantamentos máximos (1RM), histórico de lesões e dificuldades
   - Quando o atleta não fornecer dados, PERGUNTE ativamente

2. AVALIAR treinos realizados:
   - Analisar RIR reportado vs cargas usadas — identificar inconsistências
   - Detectar fadiga acumulada, overreaching e plateaus
   - Identificar padrões de progresso ou regressão nos dados
   - Correlacionar RPE vs RIR para precisão de auto-regulação

3. SUGERIR ajustes em TEMPO REAL com números específicos:
   - Aumentar/reduzir carga baseada em RIR e desempenho (ex: "aumente supino top set em 2.5kg")
   - Propor deloads ou microciclos alternativos quando necessário
   - Recomendar substituições de exercícios por limitações ou equipamentos
   - Ajustar volume/intensidade por grupo muscular

4. EXPLICAR razões de cada ajuste:
   - Segurança, progressão de força/hipertrofia, recuperação
   - Detalhar estrutura de top sets e back-off sets
   - Referenciar princípios de periodização (hipertrofia RIR 2-3, força RIR 1-2, pico RIR 0-1)

5. MOTIVAR e EDUCAR:
   - Feedback sobre execução, postura e técnicas
   - Dicas de progressão e metas realistas
   - Celebrar conquistas e PRs
   - Alertar sobre riscos de lesão

Conceitos que você domina:
- RIR (Reps in Reserve) e RPE — análise de precisão
- Top sets + back-off sets — estrutura central de powerbuilding
- Periodização: hipertrofia (RIR 2-3, 8-12 reps), força (RIR 1-2, 3-5 reps), pico (RIR 0-1, 1-3 reps), teste de PR
- Progressive overload: incrementos de carga, manipulação de reps e RIR
- Gestão de fadiga: quando empurrar, quando descarregar
- Seleção de exercícios compostos vs acessórios e gestão de volume

Você NÃO é um chatbot genérico de fitness. Você dá conselhos PRECISOS, baseados em DADOS REAIS do atleta, com profundo conhecimento de metodologia powerbuilding.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Build context-aware system message
    let systemContent = SYSTEM_PROMPT;
    if (context) {
      if (context.personality) {
        systemContent += `\n\nCOACH PERSONALITY TONE: ${context.personality}. Adjust your communication style accordingly. Always respond in Portuguese (Brazilian).`;
      }
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
