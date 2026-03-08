import { useState, useEffect, useRef } from 'react';
import { MapPin, Search, Plus, Loader2, Navigation, X, Trophy, Users, Star, CheckCircle, Zap, Filter, Flame, Layers, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

// @ts-ignore
import 'leaflet.heat';

interface AppGym {
  id: string;
  name: string;
  city: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  verified: boolean;
  total_points: number;
  tier: string;
  member_count?: number;
  pr_count?: number;
  top_squat?: number;
  top_bench?: number;
  top_deadlift?: number;
  intensity_score?: number;
}

type FilterMode = 'all' | 'nearby' | 'strongest' | 'friends' | 'heatmap';

const tierConfig: Record<string, { color: string; emoji: string; glow: string }> = {
  bronze: { color: '#cd7f32', emoji: '🥉', glow: 'rgba(205,127,50,0.4)' },
  silver: { color: '#94a3b8', emoji: '🥈', glow: 'rgba(148,163,184,0.4)' },
  gold: { color: '#eab308', emoji: '🥇', glow: 'rgba(234,179,8,0.5)' },
  elite: { color: '#8b5cf6', emoji: '💎', glow: 'rgba(139,92,246,0.5)' },
  legendary: { color: '#ef4444', emoji: '🔥', glow: 'rgba(239,68,68,0.5)' },
};

const createGymIcon = (gym: AppGym, isMyGym: boolean, hasFriend: boolean) => {
  const tc = tierConfig[gym.tier] || tierConfig.bronze;
  const color = isMyGym ? '#3b82f6' : tc.color;
  const glow = isMyGym ? 'rgba(59,130,246,0.5)' : tc.glow;
  const members = gym.member_count || 0;
  const points = gym.total_points || 0;
  const intensity = gym.intensity_score || 0;
  const prCount = gym.pr_count || 0;

  // Dynamic size based on activity
  const activityScore = Math.min(1, (points / 500) + (members / 20) + (prCount / 10));
  const size = Math.round(28 + activityScore * 20); // 28-48px

  // Multi-ring animation for high-activity gyms
  const hasRecentPRs = prCount > 0;
  const isHighActivity = intensity > 20 || points > 100;
  const isLegendary = gym.tier === 'legendary' || gym.tier === 'elite';

  let rings = '';
  if (isLegendary) {
    rings = `
      <div style="position:absolute;inset:-8px;border-radius:50%;border:2px solid ${color};opacity:0.6;animation:marker-ping 1.5s cubic-bezier(0,0,0.2,1) infinite"></div>
      <div style="position:absolute;inset:-14px;border-radius:50%;border:1.5px solid ${color};opacity:0.3;animation:marker-ping 1.5s cubic-bezier(0,0,0.2,1) infinite 0.5s"></div>
      <div style="position:absolute;inset:-4px;border-radius:50%;background:${color};opacity:0.08;animation:gym-glow 3s ease-in-out infinite"></div>
    `;
  } else if (isHighActivity) {
    rings = `
      <div style="position:absolute;inset:-6px;border-radius:50%;border:2px solid ${color};opacity:0.4;animation:marker-ping 2s cubic-bezier(0,0,0.2,1) infinite"></div>
    `;
  } else if (hasRecentPRs) {
    rings = `
      <div style="position:absolute;inset:-5px;border-radius:50%;border:1.5px dashed ${color};opacity:0.35;animation:gym-spin 8s linear infinite"></div>
    `;
  }

  // Friend badge
  const friendBadge = hasFriend ? `<div style="position:absolute;top:-6px;left:-4px;background:linear-gradient(135deg,#ec4899,#f43f5e);color:white;border-radius:8px;width:18px;height:18px;font-size:10px;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)">👥</div>` : '';

  // Points badge (for gyms with significant points)
  const pointsBadge = points > 50 ? `<div style="position:absolute;top:-5px;right:-5px;background:linear-gradient(135deg,#f59e0b,#d97706);color:white;border-radius:10px;min-width:20px;height:20px;font-size:9px;font-weight:700;display:flex;align-items:center;justify-content:center;border:2px solid white;padding:0 4px;box-shadow:0 2px 6px rgba(0,0,0,0.3)">${points > 999 ? Math.round(points/1000)+'k' : points}</div>` :
    members > 0 ? `<div style="position:absolute;top:-5px;right:-5px;background:linear-gradient(135deg,#ef4444,#dc2626);color:white;border-radius:10px;min-width:20px;height:20px;font-size:9px;font-weight:700;display:flex;align-items:center;justify-content:center;border:2px solid white;padding:0 4px;box-shadow:0 2px 6px rgba(0,0,0,0.3)">${members}</div>` : '';

  // Bounce animation for very active gyms
  const bounceStyle = isHighActivity ? 'animation:gym-bounce 3s ease-in-out infinite;' : '';

  return L.divIcon({
    className: 'custom-gym-marker',
    html: `
      <div style="position:relative;display:flex;align-items:center;justify-content:center;${bounceStyle}">
        ${rings}
        <div style="width:${size}px;height:${size}px;border-radius:50%;background:radial-gradient(circle at 30% 30%, ${color}, ${color}cc);border:3px solid rgba(255,255,255,0.95);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px ${glow}, 0 0 0 2px ${color}33${isLegendary ? ', 0 0 24px ' + glow : ''};font-size:${size * 0.4}px;cursor:pointer;transition:transform 0.2s">
          ${tc.emoji || '🏋️'}
        </div>
        ${pointsBadge}
        ${friendBadge}
        ${isMyGym ? `<div style="position:absolute;bottom:-3px;left:50%;transform:translateX(-50%);background:#3b82f6;color:white;border-radius:6px;padding:1px 6px;font-size:8px;font-weight:700;white-space:nowrap;border:1.5px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)">MEU</div>` : ''}
      </div>
    `,
    iconSize: [size + 20, size + 20],
    iconAnchor: [(size + 20) / 2, (size + 20) / 2],
  });
};

const userIcon = L.divIcon({
  className: 'user-location-marker',
  html: `
    <div style="position:relative;display:flex;align-items:center;justify-content:center">
      <div style="position:absolute;width:36px;height:36px;border-radius:50%;background:rgba(59,130,246,0.15);animation:user-pulse 2s ease-in-out infinite"></div>
      <div style="width:16px;height:16px;background:linear-gradient(135deg,#3b82f6,#2563eb);border:3px solid white;border-radius:50%;box-shadow:0 0 12px rgba(59,130,246,0.6);z-index:1"></div>
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

export function MobileGymMap() {
  const { user } = useAuth();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);
  const heatLayerRef = useRef<any>(null);

  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [appGyms, setAppGyms] = useState<AppGym[]>([]);
  const [selectedGym, setSelectedGym] = useState<AppGym | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddManual, setShowAddManual] = useState(false);
  const [newGymName, setNewGymName] = useState('');
  const [newGymAddress, setNewGymAddress] = useState('');
  const [newGymCity, setNewGymCity] = useState('');
  const [newGymCoords, setNewGymCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geocoding, setGeocoding] = useState(false);
  const [joining, setJoining] = useState(false);
  const [myGymId, setMyGymId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterMode>('all');

  useEffect(() => {
    getUserLocation();
    loadMyGym();
  }, [user]);

  useEffect(() => {
    if (userLocation && mapRef.current && !mapInstanceRef.current) {
      initMap();
    }
  }, [userLocation]);

  useEffect(() => {
    if (mapInstanceRef.current && appGyms.length >= 0) {
      renderMarkers();
    }
  }, [appGyms, filter, myGymId]);

  const getUserLocation = () => {
    if (!navigator.geolocation) {
      setUserLocation({ lat: -23.2640, lng: -47.2990 }); // Default: Itu, SP
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setUserLocation({ lat: -23.2640, lng: -47.2990 }), // Default: Itu, SP
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const loadMyGym = async () => {
    if (!user) return;
    const { data } = await supabase.from('profiles').select('gym_id').eq('user_id', user.id).single();
    if (data?.gym_id) setMyGymId(data.gym_id);
  };

  const initMap = async () => {
    if (!mapRef.current || !userLocation) return;

    const map = L.map(mapRef.current, {
      center: [userLocation.lat, userLocation.lng],
      zoom: 12,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map);

    L.control.attribution({ position: 'bottomright', prefix: false })
      .addAttribution('© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OSM</a>')
      .addTo(map);

    L.control.zoom({ position: 'topright' }).addTo(map);
    L.marker([userLocation.lat, userLocation.lng], { icon: userIcon }).addTo(map);

    // Cluster group with custom styling
    const clusterGroup = L.markerClusterGroup({
      maxClusterRadius: 60,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount();
        const size = count > 20 ? 56 : count > 10 ? 48 : 40;
        return L.divIcon({
          html: `
            <div style="width:${size}px;height:${size}px;border-radius:50%;background:linear-gradient(135deg,hsl(250,80%,65%),hsl(250,80%,55%));border:3px solid rgba(255,255,255,0.9);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(139,92,246,0.4),0 0 0 4px rgba(139,92,246,0.15);cursor:pointer">
              <div style="text-align:center;line-height:1.1">
                <div style="font-size:${count > 20 ? 16 : 14}px;font-weight:800;color:white">${count}</div>
                <div style="font-size:8px;color:rgba(255,255,255,0.8);font-weight:600">GYMS</div>
              </div>
            </div>
          `,
          className: 'custom-cluster-marker',
          iconSize: [size, size],
        });
      },
    });

    map.addLayer(clusterGroup);
    clusterGroupRef.current = clusterGroup;
    mapInstanceRef.current = map;

    await loadAppGyms();
    setLoading(false);
  };

  const loadAppGyms = async () => {
    const { data } = await supabase.rpc('get_gym_heatmap', { days_back: 30 });
    const { data: allGyms } = await supabase.from('gyms').select('*');
    
    const heatmapMap = new Map((data || []).map((g: any) => [g.gym_id, g]));
    
    const enriched: AppGym[] = await Promise.all(
      (allGyms || []).map(async (g: any) => {
        const hm = heatmapMap.get(g.id) as any;
        const { count: memberCount } = await supabase.from('gym_members').select('id', { count: 'exact', head: true }).eq('gym_id', g.id);
        const { count: prCount } = await supabase.from('gym_points_log').select('id', { count: 'exact', head: true }).eq('gym_id', g.id).eq('reason', 'pr');
        return {
          ...g,
          member_count: memberCount || (hm?.member_count || 0),
          pr_count: prCount || (hm?.total_prs || 0),
          top_squat: hm?.top_squat || 0,
          top_bench: hm?.top_bench || 0,
          top_deadlift: hm?.top_deadlift || 0,
          intensity_score: hm?.intensity_score || 0,
        };
      })
    );
    setAppGyms(enriched);
  };

  const renderMarkers = () => {
    if (!clusterGroupRef.current || !mapInstanceRef.current) return;
    clusterGroupRef.current.clearLayers();

    // Remove heatmap
    if (heatLayerRef.current) {
      mapInstanceRef.current.removeLayer(heatLayerRef.current);
      heatLayerRef.current = null;
    }

    let filtered = appGyms.filter(g => g.latitude && g.longitude);

    if (filter === 'nearby' && userLocation) {
      filtered = filtered.filter(g => getDistance(userLocation.lat, userLocation.lng, g.latitude!, g.longitude!) < 80);
    } else if (filter === 'strongest') {
      filtered = [...filtered].sort((a, b) => (b.intensity_score || 0) - (a.intensity_score || 0)).slice(0, 20);
    }

    // Heatmap mode
    if (filter === 'heatmap') {
      const heatData = filtered
        .filter(g => (g.intensity_score || 0) > 0 || (g.pr_count || 0) > 0)
        .map(g => [g.latitude!, g.longitude!, Math.max((g.intensity_score || 0) / 100, (g.pr_count || 0) / 10, 0.3)]);
      
      if (heatData.length > 0) {
        // @ts-ignore
        heatLayerRef.current = L.heatLayer(heatData, {
          radius: 40,
          blur: 25,
          maxZoom: 16,
          gradient: {
            0.0: '#1e1b4b',
            0.25: '#7c3aed',
            0.5: '#f59e0b',
            0.75: '#ef4444',
            1.0: '#ffffff',
          },
        }).addTo(mapInstanceRef.current);
      }
    }

    // Always add markers to cluster
    filtered.forEach(gym => {
      const isMyGym = gym.id === myGymId;
      const marker = L.marker([gym.latitude!, gym.longitude!], {
        icon: createGymIcon(gym, isMyGym),
      });
      marker.on('click', () => setSelectedGym(gym));
      clusterGroupRef.current!.addLayer(marker);
    });
  };

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const searchGyms = () => {
    if (!searchQuery.trim() || !mapInstanceRef.current) return;
    const query = searchQuery.toLowerCase();
    const match = appGyms.find(g => g.name.toLowerCase().includes(query) || g.city?.toLowerCase().includes(query));
    if (match && match.latitude && match.longitude) {
      mapInstanceRef.current.flyTo([match.latitude, match.longitude], 15, { duration: 1 });
      setSelectedGym(match);
    } else {
      fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery + ' gym')}&format=json&limit=5`)
        .then(r => r.json())
        .then(results => {
          if (results.length > 0) {
            mapInstanceRef.current?.flyTo([parseFloat(results[0].lat), parseFloat(results[0].lon)], 14, { duration: 1 });
          } else {
            toast.error('Nenhum resultado encontrado');
          }
        })
        .catch(() => toast.error('Erro na busca'));
    }
  };

  const selectGym = async (gym: AppGym) => {
    if (!user) return;
    setJoining(true);
    if (myGymId) {
      await supabase.from('gym_members').delete().eq('user_id', user.id).eq('gym_id', myGymId);
    }
    await supabase.from('gym_members').insert({ user_id: user.id, gym_id: gym.id });
    await supabase.from('profiles').update({ gym_id: gym.id }).eq('user_id', user.id);
    setMyGymId(gym.id);
    setSelectedGym(null);
    toast.success(`Entrou na ${gym.name}! 🏋️`);
    setJoining(false);
  };

  const geocodeAddress = async (address: string) => {
    if (address.length < 5) { setNewGymCoords(null); return; }
    setGeocoding(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(address)}&countrycodes=br&limit=1`, {
        headers: { 'User-Agent': 'IronTraining-PWA/1.0' }
      });
      const data = await res.json();
      if (data.length > 0) {
        setNewGymCoords({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
      } else {
        setNewGymCoords(null);
      }
    } catch { setNewGymCoords(null); }
    setGeocoding(false);
  };

  const addManualGym = async () => {
    if (!user || !newGymName.trim()) return;
    setJoining(true);
    const coords = newGymCoords || userLocation;
    if (!coords) { toast.error('Não foi possível determinar a localização'); setJoining(false); return; }
    const duplicate = appGyms.find(g =>
      g.name.toLowerCase() === newGymName.trim().toLowerCase() &&
      g.latitude && g.longitude &&
      getDistance(coords.lat, coords.lng, g.latitude, g.longitude) < 0.5
    );
    if (duplicate) {
      toast.error('Já existe uma academia com esse nome próxima!');
      setJoining(false);
      return;
    }
    const { data: newGym, error } = await supabase.from('gyms').insert({
      name: newGymName.trim(),
      city: newGymCity.trim() || null,
      latitude: coords.lat,
      longitude: coords.lng,
      created_by: user.id,
    }).select().single();
    if (error || !newGym) { toast.error('Erro ao criar academia'); setJoining(false); return; }
    if (myGymId) await supabase.from('gym_members').delete().eq('user_id', user.id).eq('gym_id', myGymId);
    await supabase.from('gym_members').insert({ user_id: user.id, gym_id: newGym.id });
    await supabase.from('profiles').update({ gym_id: newGym.id }).eq('user_id', user.id);
    setMyGymId(newGym.id);
    setShowAddManual(false);
    setNewGymName('');
    setNewGymAddress('');
    setNewGymCity('');
    setNewGymCoords(null);
    toast.success(`${newGymName} criada! 🎉`);
    setJoining(false);
    await loadAppGyms();
  };

  const recenterMap = () => {
    if (userLocation && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([userLocation.lat, userLocation.lng], 13, { duration: 0.8 });
    }
  };

  const filterOptions: { key: FilterMode; label: string; icon: typeof MapPin }[] = [
    { key: 'all', label: 'Todas', icon: MapPin },
    { key: 'nearby', label: 'Próximas', icon: Navigation },
    { key: 'strongest', label: 'Mais Fortes', icon: Flame },
    { key: 'heatmap', label: 'Heatmap', icon: Layers },
  ];

  const gymsSorted = [...appGyms]
    .filter(g => g.latitude && g.longitude)
    .sort((a, b) => {
      if (a.id === myGymId) return -1;
      if (b.id === myGymId) return 1;
      return (b.total_points || 0) - (a.total_points || 0);
    });

  return (
    <div className="flex flex-col h-[calc(100vh-7.5rem)]">
      {/* Search */}
      <div className="p-3 bg-background/95 backdrop-blur-md z-10 space-y-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && searchGyms()}
              placeholder="Buscar academia ou cidade..."
              className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <button onClick={searchGyms}
            className="px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium shrink-0">
            Buscar
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
          {filterOptions.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all",
                filter === f.key ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25" : "bg-card border border-border text-muted-foreground"
              )}>
              <f.icon className="w-3 h-3" /> {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Map */}
      <div className="relative flex-1">
        <div ref={mapRef} className="w-full h-full" style={{ background: '#0f0f23' }} />

        {loading && (
          <div className="absolute inset-0 bg-background/90 flex flex-col items-center justify-center gap-3 z-[1000]">
            <div className="relative">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <div className="absolute inset-0 blur-xl bg-primary/20 rounded-full" />
            </div>
            <p className="text-sm text-muted-foreground font-medium">Carregando mapa...</p>
          </div>
        )}

        <button onClick={recenterMap}
          className="absolute bottom-24 right-3 w-11 h-11 rounded-full bg-card/90 backdrop-blur-sm border border-border shadow-xl flex items-center justify-center z-[1000] active:scale-95 transition-transform">
          <Navigation className="w-5 h-5 text-primary" />
        </button>

        <button onClick={() => setShowAddManual(true)}
          className="absolute bottom-24 left-3 flex items-center gap-2 px-4 py-2.5 rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/25 z-[1000] text-sm font-semibold active:scale-95 transition-transform">
          <Plus className="w-4 h-4" /> Adicionar
        </button>

        <div className="absolute top-3 left-3 px-3 py-1.5 rounded-full bg-card/90 backdrop-blur-sm border border-border text-xs font-semibold text-foreground z-[1000] flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          {appGyms.filter(g => g.latitude && g.longitude).length} academias
        </div>
      </div>

      {/* Gym list */}
      <div className="h-44 bg-card border-t border-border overflow-y-auto">
        <div className="p-3 space-y-2">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Academias</p>
          {gymsSorted.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Nenhuma academia cadastrada</p>
          ) : gymsSorted.slice(0, 20).map((gym, i) => {
            const isMyGym = gym.id === myGymId;
            const tc = tierConfig[gym.tier] || tierConfig.bronze;
            return (
              <motion.button key={gym.id}
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                onClick={() => {
                  setSelectedGym(gym);
                  if (gym.latitude && gym.longitude && mapInstanceRef.current) {
                    mapInstanceRef.current.flyTo([gym.latitude, gym.longitude], 15, { duration: 0.8 });
                  }
                }}
                className={cn("w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all",
                  isMyGym ? "bg-primary/10 border-primary/30 shadow-sm shadow-primary/10" : "bg-background border-border hover:border-primary/30"
                )}>
                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-lg")}
                  style={{ background: `${tc.color}15`, boxShadow: `0 0 12px ${tc.glow}` }}>
                  {tc.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-foreground truncate">{gym.name}</p>
                    {isMyGym && <CheckCircle className="w-3.5 h-3.5 text-primary shrink-0" />}
                  </div>
                  {gym.city && <p className="text-[11px] text-muted-foreground truncate">📍 {gym.city}</p>}
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                      <Users className="w-3 h-3" /> {gym.member_count || 0}
                    </span>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                      <Trophy className="w-3 h-3" /> {gym.pr_count || 0}
                    </span>
                    {(gym.intensity_score || 0) > 0 && (
                      <span className="text-[10px] text-orange-400 flex items-center gap-0.5">
                        <Flame className="w-3 h-3" /> {Math.round(gym.intensity_score!)}
                      </span>
                    )}
                  </div>
                </div>
                {gym.total_points > 0 && (
                  <div className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10">
                    <Zap className="w-3 h-3 text-primary" />
                    <span className="text-[10px] font-bold text-primary">{gym.total_points}</span>
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Selected Gym Sheet */}
      <AnimatePresence>
        {selectedGym && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] bg-background/80 backdrop-blur-sm flex items-end"
            onClick={() => setSelectedGym(null)}>
            <motion.div
              initial={{ y: 500 }} animate={{ y: 0 }} exit={{ y: 500 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md mx-auto bg-card rounded-t-3xl border-t border-border p-5 space-y-4">

              {/* Handle bar */}
              <div className="w-10 h-1 rounded-full bg-border mx-auto -mt-1 mb-2" />

              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-extrabold text-foreground">{selectedGym.name}</h3>
                    <span className="text-lg">{tierConfig[selectedGym.tier]?.emoji || '🏋️'}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {selectedGym.city && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {selectedGym.city}
                      </p>
                    )}
                    <span className="text-[10px] px-2 py-0.5 rounded-full border border-border text-muted-foreground capitalize font-medium">{selectedGym.tier}</span>
                  </div>
                </div>
                <button onClick={() => setSelectedGym(null)} className="p-2 rounded-full bg-secondary text-muted-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[
                  { icon: Users, label: 'Membros', val: selectedGym.member_count || 0, color: 'text-primary' },
                  { icon: Trophy, label: 'PRs', val: selectedGym.pr_count || 0, color: 'text-yellow-500' },
                  { icon: Zap, label: 'Pontos', val: selectedGym.total_points, color: 'text-primary' },
                  { icon: Flame, label: 'Intens.', val: Math.round(selectedGym.intensity_score || 0), color: 'text-orange-500' },
                ].map(s => (
                  <motion.div key={s.label}
                    initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-center p-3 rounded-xl bg-secondary/50 border border-border/50">
                    <s.icon className={cn("w-4 h-4 mx-auto mb-1", s.color)} />
                    <p className="text-lg font-extrabold text-foreground">{s.val}</p>
                    <p className="text-[9px] text-muted-foreground font-medium">{s.label}</p>
                  </motion.div>
                ))}
              </div>

              {((selectedGym.top_squat || 0) > 0 || (selectedGym.top_bench || 0) > 0 || (selectedGym.top_deadlift || 0) > 0) && (
                <div className="p-3 rounded-xl bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/10">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">🏆 Top Lifts</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Squat', val: selectedGym.top_squat || 0 },
                      { label: 'Bench', val: selectedGym.top_bench || 0 },
                      { label: 'Deadlift', val: selectedGym.top_deadlift || 0 },
                    ].map(l => (
                      <div key={l.label} className="text-center">
                        <p className="text-[10px] text-muted-foreground">{l.label}</p>
                        <p className="text-base font-extrabold text-foreground">{l.val > 0 ? `${l.val}kg` : '—'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button onClick={() => selectGym(selectedGym)} disabled={joining || selectedGym.id === myGymId}
                className={cn(
                  "w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all",
                  selectedGym.id === myGymId
                    ? "bg-secondary text-muted-foreground"
                    : "bg-primary text-primary-foreground shadow-lg shadow-primary/25 active:scale-[0.98]"
                )}>
                {joining ? <Loader2 className="w-4 h-4 animate-spin" /> :
                  selectedGym.id === myGymId ? <><CheckCircle className="w-4 h-4" /> Sua Academia Atual</> :
                  <><MapPin className="w-4 h-4" /> Selecionar como Minha Academia</>}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Manual */}
      <AnimatePresence>
        {showAddManual && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] bg-background/80 backdrop-blur-sm flex items-end"
            onClick={() => setShowAddManual(false)}>
            <motion.div initial={{ y: 300 }} animate={{ y: 0 }} exit={{ y: 300 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md mx-auto bg-card rounded-t-3xl border-t border-border p-5 space-y-4">
              <div className="w-10 h-1 rounded-full bg-border mx-auto -mt-1 mb-2" />
              <h3 className="text-lg font-extrabold text-foreground">Adicionar Academia</h3>
              <p className="text-xs text-muted-foreground">Não encontrou? Adicione manualmente.</p>
              <input value={newGymName} onChange={e => setNewGymName(e.target.value)} placeholder="Nome da academia *" maxLength={100}
                className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
              <div className="relative">
                <input value={newGymAddress} onChange={e => { setNewGymAddress(e.target.value); }} placeholder="Endereço completo (ex: Rua X, 123, Itu SP)" maxLength={200}
                  onBlur={() => geocodeAddress(newGymAddress)}
                  className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                {geocoding && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-primary" />}
                {newGymCoords && !geocoding && <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />}
              </div>
              {newGymCoords && (
                <p className="text-[10px] text-green-500 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> Coordenadas: {newGymCoords.lat.toFixed(4)}, {newGymCoords.lng.toFixed(4)}
                </p>
              )}
              <input value={newGymCity} onChange={e => setNewGymCity(e.target.value)} placeholder="Cidade (opcional)" maxLength={100}
                className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
              {!newGymCoords && !geocoding && (
                <p className="text-[10px] text-muted-foreground">📍 Sem endereço, sua localização atual será usada</p>
              )}
              <button onClick={addManualGym} disabled={joining || !newGymName.trim()}
                className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-primary/25">
                {joining ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Criar e Selecionar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
