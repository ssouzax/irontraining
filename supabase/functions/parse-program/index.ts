import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileContent, fileName, fileType } = await req.json();

    if (!fileContent) {
      throw new Error('No file content provided');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Determine content type description
    let contentDescription = 'text document';
    if (fileType?.includes('pdf')) contentDescription = 'PDF document';
    else if (fileType?.includes('word') || fileType?.includes('docx')) contentDescription = 'Word document';
    else if (fileType?.includes('json')) contentDescription = 'JSON file';
    else if (fileType?.includes('text') || fileType?.includes('txt')) contentDescription = 'text file';
    else if (fileType?.includes('csv')) contentDescription = 'CSV file';

    const systemPrompt = `You are an expert fitness coach that parses training programs from various document formats.
Your task is to extract the training program structure and convert it to a standardized JSON format.

The output MUST be valid JSON with this exact structure:
{
  "name": "Program Name",
  "description": "Brief description",
  "program_type": "powerbuilding" | "strength" | "hypertrophy",
  "duration_weeks": number,
  "days_per_week": number,
  "blocks": [
    {
      "name": "Block Name",
      "block_type": "accumulation" | "intensification" | "realization" | "deload",
      "goal": "Block goal description",
      "start_week": number,
      "end_week": number,
      "weeks": [
        {
          "week_number": number,
          "days": [
            {
              "day_name": "Day A - Upper",
              "focus": "Chest/Back",
              "day_of_week": "Segunda" | "Terça" | etc,
              "exercises": [
                {
                  "exercise_name": "Supino Reto",
                  "category": "compound" | "accessory",
                  "muscle_group": "chest" | "back" | "legs" | "shoulders" | "arms" | "core",
                  "sets": [
                    {
                      "target_sets": 4,
                      "target_reps": 8,
                      "target_rir": 2,
                      "load_percentage": 75,
                      "is_top_set": false,
                      "is_backoff": false,
                      "rest_seconds": 180,
                      "notes": "optional notes"
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}

Important rules:
1. Extract ALL exercises mentioned in the document
2. Infer sets/reps/rest if not explicitly stated based on exercise type
3. Categorize exercises correctly (compound vs accessory)
4. If the program doesn't have explicit blocks, create logical blocks based on weeks
5. Translate exercise names to Portuguese if they're in English
6. Use realistic values for any missing data
7. Return ONLY valid JSON, no markdown, no explanations`;

    const userPrompt = `Parse this ${contentDescription} (${fileName}) and extract the training program structure:

---
${fileContent}
---

Return ONLY the JSON structure, nothing else.`;

    const response = await fetch('https://api.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 8000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No response from AI');
    }

    // Clean up the response - remove markdown code blocks if present
    let jsonString = content.trim();
    if (jsonString.startsWith('```json')) {
      jsonString = jsonString.slice(7);
    } else if (jsonString.startsWith('```')) {
      jsonString = jsonString.slice(3);
    }
    if (jsonString.endsWith('```')) {
      jsonString = jsonString.slice(0, -3);
    }
    jsonString = jsonString.trim();

    // Parse and validate JSON
    const parsedProgram = JSON.parse(jsonString);

    // Basic validation
    if (!parsedProgram.name || !parsedProgram.blocks || !Array.isArray(parsedProgram.blocks)) {
      throw new Error('Invalid program structure returned by AI');
    }

    return new Response(JSON.stringify({ 
      success: true, 
      program: parsedProgram 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error parsing program:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
