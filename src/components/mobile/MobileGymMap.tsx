import { useState, useEffect, useRef } from 'react';
import { MapPin, Search, Plus, Loader2, Navigation, X, Trophy, Users, Star, CheckCircle, Zap, Filter, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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

type FilterMode = 'all' | 'nearby' | 'strongest' | 'friends';

// Custom icon factory
const createGymIcon = (gym: AppGym, isMyGym: boolean) => {
  const tier = gym.tier || 'bronze';
  const tierColors: Record<string, string> = {
    bronze: '#cd7f32',
    silver: '#94a3b8',
    gold: '#eab308',
    elite: '#8b5cf6',
    legendary: '#ef4444',
  };
  const color = isMyGym ? 'hsl(217, 91%, 60%)' : (tierColors[tier] || 'hsl(217, 91%, 60%)');
  const size = Math.min(40, 28 + (gym.member_count || 0) * 2);
  const pulseClass = (gym.intensity_score || 0) > 50 ? 'gym-marker-pulse' : '';

  return L.divIcon({
    className: 'custom-gym-marker',
    html: `
      <div class="${pulseClass}" style="position:relative;display:flex;align-items:center;justify-content:center">
        <div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:3px solid rgba(255,255,255,0.9);display:flex;align-items:center;justify-content:center;box-shadow:0 2px 12px ${color}80;font-size:${size * 0.4}px;cursor:pointer">
          🏋️
        </div>
        ${(gym.member_count || 0) > 0 ? `<div style="position:absolute;top:-4px;right:-4px;background:#ef4444;color:white;border-radius:50%;width:18px;height:18px;font-size:9px;font-weight:700;display:flex;align-items:center;justify-content:center;border:2px solid white">${gym.member_count}</div>` : ''}
      </div>
    `,
    iconSize: [size + 8, size + 8],
    iconAnchor: [(size + 8) / 2, (size + 8) / 2],
  });
};

const userIcon = L.divIcon({
  className: 'user-location-marker',
  html: `<div style="width:18px;height:18px;background:#3b82f6;border:3px solid white;border-radius:50%;box-shadow:0 0 12px rgba(59,130,246,0.6)"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

export function MobileGymMap() {
  const { user } = useAuth();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [appGyms, setAppGyms] = useState<AppGym[]>([]);
  const [selectedGym, setSelectedGym] = useState<AppGym | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddManual, setShowAddManual] = useState(false);
  const [newGymName, setNewGymName] = useState('');
  const [newGymCity, setNewGymCity] = useState('');
  const [joining, setJoining] = useState(false);
  const [myGymId, setMyGymId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterMode>('all');
  const [showFilters, setShowFilters] = useState(false);

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
    if (mapInstanceRef.current && appGyms.length > 0) {
      renderMarkers();
    }
  }, [appGyms, filter, myGymId]);

  const getUserLocation = () => {
    if (!navigator.geolocation) {
      setUserLocation({ lat: -23.5505, lng: -46.6333 });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setUserLocation({ lat: -23.5505, lng: -46.6333 }),
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
      zoom: 13,
      zoomControl: false,
      attributionControl: false,
    });

    // Dark tile layer (CartoDB Dark Matter)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map);

    // Attribution (small)
    L.control.attribution({ position: 'bottomright', prefix: false })
      .addAttribution('© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OSM</a> · <a href="https://carto.com/" target="_blank" rel="noopener">CARTO</a>')
      .addTo(map);

    L.control.zoom({ position: 'topright' }).addTo(map);

    // User location marker
    L.marker([userLocation.lat, userLocation.lng], { icon: userIcon }).addTo(map)
      .bindPopup('<b>Você está aqui</b>');

    // Markers layer
    markersLayerRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    await loadAppGyms();
    setLoading(false);
  };

  const loadAppGyms = async () => {
    const { data } = await supabase.rpc('get_gym_heatmap', { days_back: 30 });
    
    // Also load gyms without recent activity
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
    if (!markersLayerRef.current || !mapInstanceRef.current) return;
    markersLayerRef.current.clearLayers();

    let filtered = appGyms.filter(g => g.latitude && g.longitude);

    if (filter === 'nearby' && userLocation) {
      filtered = filtered.filter(g => {
        const dist = getDistance(userLocation.lat, userLocation.lng, g.latitude!, g.longitude!);
        return dist < 5;
      });
    } else if (filter === 'strongest') {
      filtered = [...filtered].sort((a, b) => (b.intensity_score || 0) - (a.intensity_score || 0)).slice(0, 20);
    }

    filtered.forEach(gym => {
      const isMyGym = gym.id === myGymId;
      const marker = L.marker([gym.latitude!, gym.longitude!], {
        icon: createGymIcon(gym, isMyGym),
      });

      const tierEmoji: Record<string, string> = { bronze: '🥉', silver: '🥈', gold: '🥇', elite: '💎', legendary: '🔥' };
      
      marker.bindPopup(`
        <div style="font-family:system-ui;min-width:180px">
          <div style="font-weight:700;font-size:14px;margin-bottom:4px">${gym.name} ${tierEmoji[gym.tier] || ''}</div>
          ${gym.city ? `<div style="font-size:11px;opacity:0.7;margin-bottom:6px">📍 ${gym.city}</div>` : ''}
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;font-size:11px">
            <div>👥 ${gym.member_count || 0} membros</div>
            <div>🏆 ${gym.pr_count || 0} PRs</div>
            <div>⚡ ${gym.total_points} pts</div>
            <div>🔥 ${Math.round(gym.intensity_score || 0)} intensidade</div>
          </div>
          ${isMyGym ? '<div style="margin-top:6px;padding:4px 8px;background:#3b82f6;color:white;border-radius:8px;text-align:center;font-size:11px;font-weight:600">✅ Sua Academia</div>' : ''}
        </div>
      `, { className: 'gym-popup-dark' });

      marker.on('click', () => setSelectedGym(gym));
      marker.addTo(markersLayerRef.current!);
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
      // Use Nominatim for geocoding search
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
    renderMarkers();
  };

  const addManualGym = async () => {
    if (!user || !newGymName.trim() || !userLocation) return;
    setJoining(true);

    // Check duplicates
    const duplicate = appGyms.find(g =>
      g.name.toLowerCase() === newGymName.trim().toLowerCase() &&
      g.latitude && g.longitude &&
      getDistance(userLocation.lat, userLocation.lng, g.latitude, g.longitude) < 0.5
    );
    if (duplicate) {
      toast.error('Já existe uma academia com esse nome próxima!');
      setJoining(false);
      return;
    }

    const { data: newGym, error } = await supabase.from('gyms').insert({
      name: newGymName.trim(),
      city: newGymCity.trim() || null,
      latitude: userLocation.lat,
      longitude: userLocation.lng,
      created_by: user.id,
    }).select().single();

    if (error || !newGym) {
      toast.error('Erro ao criar academia');
      setJoining(false);
      return;
    }

    if (myGymId) {
      await supabase.from('gym_members').delete().eq('user_id', user.id).eq('gym_id', myGymId);
    }

    await supabase.from('gym_members').insert({ user_id: user.id, gym_id: newGym.id });
    await supabase.from('profiles').update({ gym_id: newGym.id }).eq('user_id', user.id);

    setMyGymId(newGym.id);
    setShowAddManual(false);
    setNewGymName('');
    setNewGymCity('');
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
      {/* Search bar */}
      <div className="p-3 bg-background/95 backdrop-blur-md z-10 space-y-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && searchGyms()}
              placeholder="Buscar academia ou cidade..."
              className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <button onClick={searchGyms}
            className="px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium shrink-0">
            Buscar
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
          {filterOptions.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
                filter === f.key ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground"
              )}>
              <f.icon className="w-3 h-3" /> {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Map */}
      <div className="relative flex-1">
        <div ref={mapRef} className="w-full h-full" style={{ background: '#1a1a2e' }} />

        {loading && (
          <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center gap-3 z-[1000]">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Carregando mapa...</p>
          </div>
        )}

        {/* Recenter */}
        <button onClick={recenterMap}
          className="absolute bottom-24 right-3 w-10 h-10 rounded-full bg-card border border-border shadow-lg flex items-center justify-center z-[1000]">
          <Navigation className="w-5 h-5 text-primary" />
        </button>

        {/* Add gym FAB */}
        <button onClick={() => setShowAddManual(true)}
          className="absolute bottom-24 left-3 flex items-center gap-2 px-4 py-2.5 rounded-full bg-primary text-primary-foreground shadow-lg z-[1000] text-sm font-medium">
          <Plus className="w-4 h-4" /> Adicionar Academia
        </button>

        {/* Count badge */}
        <div className="absolute top-3 left-3 px-3 py-1.5 rounded-full bg-card/90 backdrop-blur-sm border border-border text-xs font-medium text-foreground z-[1000]">
          🏋️ {appGyms.filter(g => g.latitude && g.longitude).length} academias no mapa
        </div>
      </div>

      {/* Gym list */}
      <div className="h-48 bg-card border-t border-border overflow-y-auto">
        <div className="p-3 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Academias</p>
          {gymsSorted.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Nenhuma academia cadastrada ainda</p>
          ) : (
            gymsSorted.slice(0, 20).map(gym => {
              const isMyGym = gym.id === myGymId;
              const tierEmoji: Record<string, string> = { bronze: '🥉', silver: '🥈', gold: '🥇', elite: '💎', legendary: '🔥' };

              return (
                <button key={gym.id}
                  onClick={() => {
                    setSelectedGym(gym);
                    if (gym.latitude && gym.longitude && mapInstanceRef.current) {
                      mapInstanceRef.current.flyTo([gym.latitude, gym.longitude], 15, { duration: 0.8 });
                    }
                  }}
                  className={cn("w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-colors",
                    isMyGym ? "bg-primary/10 border-primary/30" : "bg-background border-border hover:border-primary/30"
                  )}>
                  <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-lg",
                    isMyGym ? "bg-primary/20" : "bg-secondary"
                  )}>
                    {tierEmoji[gym.tier] || '🏋️'}
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
                        <Trophy className="w-3 h-3" /> {gym.pr_count || 0} PRs
                      </span>
                    </div>
                  </div>
                  {gym.total_points > 0 && (
                    <div className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10">
                      <Zap className="w-3 h-3 text-primary" />
                      <span className="text-[10px] font-bold text-primary">{gym.total_points}</span>
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Selected Gym Detail Sheet */}
      <AnimatePresence>
        {selectedGym && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] bg-background/80 backdrop-blur-sm flex items-end"
            onClick={() => setSelectedGym(null)}>
            <motion.div
              initial={{ y: 400 }} animate={{ y: 0 }} exit={{ y: 400 }}
              transition={{ type: 'spring', damping: 25 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md mx-auto bg-card rounded-t-2xl border-t border-border p-5 space-y-4">

              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-foreground">{selectedGym.name}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground capitalize">{selectedGym.tier}</span>
                  </div>
                  {selectedGym.city && (
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {selectedGym.city}{selectedGym.country ? `, ${selectedGym.country}` : ''}
                    </p>
                  )}
                </div>
                <button onClick={() => setSelectedGym(null)} className="p-1.5 text-muted-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { icon: Users, label: 'Membros', val: selectedGym.member_count || 0, color: 'text-primary' },
                  { icon: Trophy, label: 'PRs', val: selectedGym.pr_count || 0, color: 'text-yellow-500' },
                  { icon: Zap, label: 'Pontos', val: selectedGym.total_points, color: 'text-primary' },
                  { icon: Flame, label: 'Intens.', val: Math.round(selectedGym.intensity_score || 0), color: 'text-orange-500' },
                ].map(s => (
                  <div key={s.label} className="text-center p-2.5 rounded-xl bg-secondary">
                    <s.icon className={cn("w-4 h-4 mx-auto mb-1", s.color)} />
                    <p className="text-base font-bold text-foreground">{s.val}</p>
                    <p className="text-[9px] text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Top lifts */}
              {((selectedGym.top_squat || 0) > 0 || (selectedGym.top_bench || 0) > 0 || (selectedGym.top_deadlift || 0) > 0) && (
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Top Squat', val: selectedGym.top_squat || 0 },
                    { label: 'Top Bench', val: selectedGym.top_bench || 0 },
                    { label: 'Top Deadlift', val: selectedGym.top_deadlift || 0 },
                  ].map(l => (
                    <div key={l.label} className="text-center p-2 rounded-lg bg-background/50">
                      <p className="text-[10px] text-muted-foreground">{l.label}</p>
                      <p className="text-sm font-bold text-foreground">{l.val > 0 ? `${l.val}kg` : '—'}</p>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => selectGym(selectedGym)}
                disabled={joining || selectedGym.id === myGymId}
                className={cn(
                  "w-full py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors",
                  selectedGym.id === myGymId
                    ? "bg-secondary text-muted-foreground"
                    : "bg-primary text-primary-foreground"
                )}>
                {joining ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : selectedGym.id === myGymId ? (
                  <><CheckCircle className="w-4 h-4" /> Sua Academia Atual</>
                ) : (
                  <><MapPin className="w-4 h-4" /> Selecionar como Minha Academia</>
                )}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Manual Gym Sheet */}
      <AnimatePresence>
        {showAddManual && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] bg-background/80 backdrop-blur-sm flex items-end"
            onClick={() => setShowAddManual(false)}>
            <motion.div
              initial={{ y: 300 }} animate={{ y: 0 }} exit={{ y: 300 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md mx-auto bg-card rounded-t-2xl border-t border-border p-5 space-y-4">
              <h3 className="text-lg font-bold text-foreground">Adicionar Academia</h3>
              <p className="text-xs text-muted-foreground">Não encontrou sua academia? Adicione manualmente.</p>
              <input value={newGymName} onChange={e => setNewGymName(e.target.value)}
                placeholder="Nome da academia *" maxLength={100}
                className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
              <input value={newGymCity} onChange={e => setNewGymCity(e.target.value)}
                placeholder="Cidade (opcional)" maxLength={100}
                className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
              <p className="text-[10px] text-muted-foreground">📍 Localização atual será usada como coordenadas</p>
              <button onClick={addManualGym} disabled={joining || !newGymName.trim()}
                className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-medium text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                {joining ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Criar e Selecionar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
