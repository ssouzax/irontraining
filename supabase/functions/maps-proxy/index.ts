import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GOOGLE_MAPS_API_KEY = Deno.env.get("GOOGLE_MAPS_API_KEY");
    if (!GOOGLE_MAPS_API_KEY) {
      throw new Error("GOOGLE_MAPS_API_KEY is not configured");
    }

    const { action, lat, lng, query, radius } = await req.json();

    if (action === "nearby_gyms") {
      // Search for gyms near a location using Places API (New)
      const searchRadius = radius || 5000;
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${searchRadius}&type=gym&key=${GOOGLE_MAPS_API_KEY}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
        throw new Error(`Google Places API error: ${data.status} - ${data.error_message || ''}`);
      }

      const gyms = (data.results || []).map((place: any) => ({
        place_id: place.place_id,
        name: place.name,
        address: place.vicinity || place.formatted_address || '',
        latitude: place.geometry?.location?.lat,
        longitude: place.geometry?.location?.lng,
        rating: place.rating || null,
        total_ratings: place.user_ratings_total || 0,
        is_open: place.opening_hours?.open_now ?? null,
        photo_ref: place.photos?.[0]?.photo_reference || null,
      }));

      return new Response(JSON.stringify({ gyms }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "search_gyms") {
      // Text search for gyms
      const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query + ' gym')}&type=gym&key=${GOOGLE_MAPS_API_KEY}`;
      
      const response = await fetch(url);
      const data = await response.json();

      const gyms = (data.results || []).map((place: any) => ({
        place_id: place.place_id,
        name: place.name,
        address: place.formatted_address || '',
        latitude: place.geometry?.location?.lat,
        longitude: place.geometry?.location?.lng,
        rating: place.rating || null,
        total_ratings: place.user_ratings_total || 0,
      }));

      return new Response(JSON.stringify({ gyms }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "get_api_key") {
      // Return API key for client-side Maps JS API
      return new Response(JSON.stringify({ key: GOOGLE_MAPS_API_KEY }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Maps function error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
