import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { lat, lon, radius_km = 15, query, action, gyms_to_import } = body;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Search by name using Nominatim
    if (action === 'search' && query) {
      const searchUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query + ' academia brasil')}&format=json&limit=20&addressdetails=1&countrycodes=br`;
      const res = await fetch(searchUrl, {
        headers: { 'User-Agent': 'IronTraining/1.0 (powerlifting-app)' },
      });
      const results = await res.json();

      const gyms = results
        .filter((r: any) => r.display_name)
        .map((r: any) => ({
          osm_id: `osm_${r.osm_id}`,
          name: r.display_name.split(',')[0],
          address: r.display_name,
          city: r.address?.city || r.address?.town || r.address?.village || '',
          state: r.address?.state || '',
          lat: parseFloat(r.lat),
          lon: parseFloat(r.lon),
          source: 'nominatim',
        }));

      return new Response(JSON.stringify({ gyms }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Nearby search using Overpass API
    if (action === 'nearby' && lat && lon) {
      const radiusDeg = radius_km / 111.0;
      const south = lat - radiusDeg;
      const north = lat + radiusDeg;
      const west = lon - radiusDeg;
      const east = lon + radiusDeg;
      const bbox = `${south},${west},${north},${east}`;

      const overpassQuery = `
        [out:json][timeout:25];
        (
          node["leisure"="fitness_centre"](${bbox});
          way["leisure"="fitness_centre"](${bbox});
          node["sport"="fitness"](${bbox});
          way["sport"="fitness"](${bbox});
          node["amenity"="gym"](${bbox});
          way["amenity"="gym"](${bbox});
          node["name"~"[Aa]cademia|[Gg]ym|[Ff]it|[Cc]rossfit|[Mm]uscula"](${bbox});
        );
        out center body;
      `;

      const overpassRes = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: `data=${encodeURIComponent(overpassQuery)}`,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'IronTraining/1.0' },
      });
      const overpassData = await overpassRes.json();

      const seen = new Set<string>();
      const gyms: any[] = [];

      for (const el of overpassData.elements || []) {
        const name = el.tags?.name;
        if (!name) continue;

        const elLat = el.lat || el.center?.lat;
        const elLon = el.lon || el.center?.lon;
        if (!elLat || !elLon) continue;

        const key = `${name.toLowerCase().trim()}_${Math.round(elLat * 1000)}_${Math.round(elLon * 1000)}`;
        if (seen.has(key)) continue;
        seen.add(key);

        const addr = [
          el.tags?.['addr:street'],
          el.tags?.['addr:housenumber'],
          el.tags?.['addr:suburb'],
        ].filter(Boolean).join(', ');

        gyms.push({
          osm_id: `osm_${el.id}`,
          name,
          address: addr || '',
          city: el.tags?.['addr:city'] || '',
          state: el.tags?.['addr:state'] || '',
          lat: elLat,
          lon: elLon,
          source: 'overpass',
        });
      }

      // Auto-import new gyms to database
      if (gyms.length > 0) {
        const { data: existingGyms } = await supabase.from('gyms').select('name, latitude, longitude');
        const existingSet = new Set(
          (existingGyms || []).map((g: any) => 
            `${g.name.toLowerCase().trim()}_${Math.round((g.latitude || 0) * 100)}_${Math.round((g.longitude || 0) * 100)}`
          )
        );

        const newGyms = gyms.filter(g => {
          const k = `${g.name.toLowerCase().trim()}_${Math.round(g.lat * 100)}_${Math.round(g.lon * 100)}`;
          return !existingSet.has(k);
        });

        if (newGyms.length > 0) {
          const rows = newGyms.map(g => ({
            name: g.name,
            city: g.city || null,
            country: 'Brasil',
            latitude: g.lat,
            longitude: g.lon,
            verified: false,
          }));
          await supabase.from('gyms').insert(rows);
        }
      }

      return new Response(JSON.stringify({ gyms, count: gyms.length, source: 'overpass' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Bulk import specific gyms
    if (action === 'import_gyms' && gyms_to_import && Array.isArray(gyms_to_import)) {
      const { data: existingGyms } = await supabase.from('gyms').select('name, latitude, longitude');
      const existingSet = new Set(
        (existingGyms || []).map((g: any) =>
          `${g.name.toLowerCase().trim()}_${Math.round((g.latitude || 0) * 100)}_${Math.round((g.longitude || 0) * 100)}`
        )
      );

      const newGyms = gyms_to_import.filter((g: any) => {
        const k = `${g.name.toLowerCase().trim()}_${Math.round(g.lat * 100)}_${Math.round(g.lon * 100)}`;
        return !existingSet.has(k);
      });

      if (newGyms.length > 0) {
        const rows = newGyms.map((g: any) => ({
          name: g.name,
          city: g.city || null,
          country: g.country || 'Brasil',
          latitude: g.lat,
          longitude: g.lon,
          verified: g.verified || false,
        }));
        const { error } = await supabase.from('gyms').insert(rows);
        if (error) throw error;
      }

      return new Response(JSON.stringify({ 
        imported: newGyms.length, 
        skipped: gyms_to_import.length - newGyms.length,
        total: gyms_to_import.length 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action. Use: search, nearby, import_gyms' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
