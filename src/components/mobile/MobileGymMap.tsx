import { useState, useEffect, useCallback, useRef } from 'react';
import { MapPin, Search, Plus, Loader2, Navigation, X, Trophy, Users, Star, CheckCircle, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface GoogleGym {
  place_id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  rating: number | null;
  total_ratings: number;
  is_open?: boolean | null;
}

interface AppGym {
  id: string;
  name: string;
  city: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  verified: boolean;
  total_points: number;
  member_count?: number;
  pr_count?: number;
}

export function MobileGymMap() {
  const { user } = useAuth();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [nearbyGoogleGyms, setNearbyGoogleGyms] = useState<GoogleGym[]>([]);
  const [appGyms, setAppGyms] = useState<AppGym[]>([]);
  const [selectedGym, setSelectedGym] = useState<(GoogleGym & { appGym?: AppGym }) | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [showAddManual, setShowAddManual] = useState(false);
  const [newGymName, setNewGymName] = useState('');
  const [newGymCity, setNewGymCity] = useState('');
  const [joining, setJoining] = useState(false);
  const [myGymId, setMyGymId] = useState<string | null>(null);

  // Load Google Maps API
  useEffect(() => {
    loadMapsApi();
    getUserLocation();
    loadMyGym();
  }, [user]);

  const loadMapsApi = async () => {
    if ((window as any).google?.maps) {
      setMapsLoaded(true);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('maps-proxy', {
        body: { action: 'get_api_key' },
      });

      if (error || !data?.key) {
        toast.error('Erro ao carregar mapa');
        setLoading(false);
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${data.key}&libraries=places,marker&v=weekly`;
      script.async = true;
      script.defer = true;
      script.onload = () => setMapsLoaded(true);
      script.onerror = () => { toast.error('Erro ao carregar Google Maps'); setLoading(false); };
      document.head.appendChild(script);
    } catch {
      toast.error('Erro ao carregar mapa');
      setLoading(false);
    }
  };

  const getUserLocation = () => {
    if (!navigator.geolocation) {
      setUserLocation({ lat: -23.5505, lng: -46.6333 }); // São Paulo default
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

  // Initialize map when both API and location are ready
  useEffect(() => {
    if (mapsLoaded && userLocation && mapRef.current && !mapInstanceRef.current) {
      initMap();
    }
  }, [mapsLoaded, userLocation]);

  const initMap = async () => {
    if (!mapRef.current || !userLocation) return;

    const gMaps = (window as any).google.maps;
    const map = new gMaps.Map(mapRef.current, {
      center: userLocation,
      zoom: 14,
      mapId: 'powerbuild-gym-map',
      disableDefaultUI: true,
      zoomControl: true,
      styles: [
        { elementType: 'geometry', stylers: [{ color: '#1a1a2e' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1a2e' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#8892b0' }] },
        { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2d2d44' }] },
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0d1117' }] },
        { featureType: 'poi', stylers: [{ visibility: 'off' }] },
      ],
    });

    mapInstanceRef.current = map;

    // User location marker
    const userMarkerEl = document.createElement('div');
    userMarkerEl.innerHTML = `<div style="width:16px;height:16px;background:#3b82f6;border:3px solid white;border-radius:50%;box-shadow:0 0 10px rgba(59,130,246,0.5)"></div>`;
    new gMaps.marker.AdvancedMarkerElement({ map, position: userLocation, content: userMarkerEl });

    // Load nearby gyms
    await loadNearbyGyms(userLocation);
    await loadAppGyms();
    setLoading(false);
  };

  const loadNearbyGyms = async (location: { lat: number; lng: number }) => {
    try {
      const { data, error } = await supabase.functions.invoke('maps-proxy', {
        body: { action: 'nearby_gyms', lat: location.lat, lng: location.lng, radius: 5000 },
      });
      if (data?.gyms) {
        setNearbyGoogleGyms(data.gyms);
        addGymMarkers(data.gyms);
      }
    } catch {
      console.error('Failed to load nearby gyms');
    }
  };

  const loadAppGyms = async () => {
    const { data } = await supabase.from('gyms').select('*');
    if (data) {
      const enriched = await Promise.all(data.map(async (g: any) => {
        const { count: memberCount } = await supabase.from('gym_members').select('id', { count: 'exact' }).eq('gym_id', g.id);
        const { count: prCount } = await supabase.from('gym_points_log').select('id', { count: 'exact' }).eq('gym_id', g.id).eq('reason', 'pr');
        return { ...g, member_count: memberCount || 0, pr_count: prCount || 0 } as AppGym;
      }));
      setAppGyms(enriched);
    }
  };

  const addGymMarkers = (gyms: GoogleGym[]) => {
    if (!mapInstanceRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(m => (m.map = null));
    markersRef.current = [];

    gyms.forEach(gym => {
      const markerEl = document.createElement('div');
      markerEl.innerHTML = `
        <div style="background:hsl(var(--primary));color:white;padding:6px 10px;border-radius:20px;font-size:11px;font-weight:700;box-shadow:0 2px 8px rgba(0,0,0,0.3);cursor:pointer;white-space:nowrap;display:flex;align-items:center;gap:4px">
          <span style="font-size:14px">📍</span> ${gym.name.length > 20 ? gym.name.slice(0, 20) + '…' : gym.name}
        </div>
      `;

      const marker = new google.maps.marker.AdvancedMarkerElement({
        map: mapInstanceRef.current!,
        position: { lat: gym.latitude, lng: gym.longitude },
        content: markerEl,
        title: gym.name,
      });

      marker.addListener('click', () => {
        const appGym = appGyms.find(ag =>
          ag.name.toLowerCase() === gym.name.toLowerCase() ||
          (ag.latitude && ag.longitude &&
            Math.abs(ag.latitude - gym.latitude) < 0.001 &&
            Math.abs(ag.longitude - gym.longitude) < 0.001)
        );
        setSelectedGym({ ...gym, appGym });
      });

      markersRef.current.push(marker);
    });
  };

  const searchGyms = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const { data } = await supabase.functions.invoke('maps-proxy', {
        body: { action: 'search_gyms', query: searchQuery },
      });
      if (data?.gyms) {
        setNearbyGoogleGyms(data.gyms);
        addGymMarkers(data.gyms);
        if (data.gyms.length > 0 && mapInstanceRef.current) {
          mapInstanceRef.current.panTo({ lat: data.gyms[0].latitude, lng: data.gyms[0].longitude });
          mapInstanceRef.current.setZoom(13);
        }
      }
    } catch {
      toast.error('Erro na busca');
    }
    setSearching(false);
  };

  const selectGym = async (gym: GoogleGym, existingAppGym?: AppGym) => {
    if (!user) return;
    setJoining(true);

    let gymId: string;

    if (existingAppGym) {
      gymId = existingAppGym.id;
    } else {
      // Create gym in our database
      const city = gym.address.split(',').slice(-2, -1)[0]?.trim() || gym.address.split(',')[1]?.trim() || '';
      const country = gym.address.split(',').slice(-1)[0]?.trim() || '';

      const { data: newGym, error } = await supabase.from('gyms').insert({
        name: gym.name,
        city: city || null,
        country: country || null,
        latitude: gym.latitude,
        longitude: gym.longitude,
        created_by: user.id,
      }).select().single();

      if (error || !newGym) {
        toast.error('Erro ao registrar academia');
        setJoining(false);
        return;
      }
      gymId = newGym.id;
    }

    // Leave current gym
    if (myGymId) {
      await supabase.from('gym_members').delete().eq('user_id', user.id).eq('gym_id', myGymId);
    }

    // Join new gym
    await supabase.from('gym_members').insert({ user_id: user.id, gym_id: gymId });
    await supabase.from('profiles').update({ gym_id: gymId }).eq('user_id', user.id);

    setMyGymId(gymId);
    setSelectedGym(null);
    toast.success(`Entrou na ${gym.name}!`);
    setJoining(false);
  };

  const addManualGym = async () => {
    if (!user || !newGymName.trim() || !userLocation) return;
    setJoining(true);

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
    toast.success(`${newGymName} criada e selecionada!`);
    setJoining(false);
  };

  const recenterMap = () => {
    if (userLocation && mapInstanceRef.current) {
      mapInstanceRef.current.panTo(userLocation);
      mapInstanceRef.current.setZoom(14);
    }
  };

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
              placeholder="Buscar academia por nome ou cidade..."
              className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <button onClick={searchGyms} disabled={searching}
            className="px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium shrink-0 disabled:opacity-50">
            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buscar'}
          </button>
        </div>
      </div>

      {/* Map */}
      <div className="relative flex-1">
        <div ref={mapRef} className="w-full h-full" />

        {loading && (
          <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center gap-3 z-10">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Carregando mapa...</p>
          </div>
        )}

        {/* Recenter button */}
        <button onClick={recenterMap}
          className="absolute bottom-24 right-3 w-10 h-10 rounded-full bg-card border border-border shadow-lg flex items-center justify-center z-10">
          <Navigation className="w-5 h-5 text-primary" />
        </button>

        {/* Add gym FAB */}
        <button onClick={() => setShowAddManual(true)}
          className="absolute bottom-24 left-3 flex items-center gap-2 px-4 py-2.5 rounded-full bg-primary text-primary-foreground shadow-lg z-10 text-sm font-medium">
          <Plus className="w-4 h-4" /> Adicionar Academia
        </button>

        {/* Gym count badge */}
        <div className="absolute top-3 left-3 px-3 py-1.5 rounded-full bg-card/90 backdrop-blur-sm border border-border text-xs font-medium text-foreground z-10">
          📍 {nearbyGoogleGyms.length} academias encontradas
        </div>
      </div>

      {/* Gym list (scrollable) */}
      <div className="h-48 bg-card border-t border-border overflow-y-auto">
        <div className="p-3 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Academias próximas</p>
          {nearbyGoogleGyms.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Nenhuma academia encontrada na região</p>
          ) : (
            nearbyGoogleGyms.map(gym => {
              const appGym = appGyms.find(ag =>
                ag.name.toLowerCase() === gym.name.toLowerCase() ||
                (ag.latitude && ag.longitude &&
                  Math.abs(ag.latitude - gym.latitude) < 0.001 &&
                  Math.abs(ag.longitude - gym.longitude) < 0.001)
              );
              const isMyGym = appGym?.id === myGymId;

              return (
                <button key={gym.place_id}
                  onClick={() => setSelectedGym({ ...gym, appGym })}
                  className={cn("w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-colors",
                    isMyGym ? "bg-primary/10 border-primary/30" : "bg-background border-border hover:border-primary/30"
                  )}>
                  <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                    appGym ? "bg-primary/10" : "bg-secondary"
                  )}>
                    <MapPin className={cn("w-5 h-5", appGym ? "text-primary" : "text-muted-foreground")} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold text-foreground truncate">{gym.name}</p>
                      {isMyGym && <CheckCircle className="w-3.5 h-3.5 text-primary shrink-0" />}
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">{gym.address}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {gym.rating && (
                        <span className="text-[10px] text-yellow-500 flex items-center gap-0.5">
                          <Star className="w-3 h-3 fill-yellow-500" /> {gym.rating}
                        </span>
                      )}
                      {appGym && (
                        <span className="text-[10px] text-primary flex items-center gap-0.5">
                          <Users className="w-3 h-3" /> {appGym.member_count} · <Trophy className="w-3 h-3" /> {appGym.pr_count} PRs
                        </span>
                      )}
                    </div>
                  </div>
                  {appGym && appGym.total_points > 0 && (
                    <div className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10">
                      <Zap className="w-3 h-3 text-primary" />
                      <span className="text-[10px] font-bold text-primary">{appGym.total_points}</span>
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
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end"
            onClick={() => setSelectedGym(null)}>
            <motion.div
              initial={{ y: 400 }} animate={{ y: 0 }} exit={{ y: 400 }}
              transition={{ type: 'spring', damping: 25 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md mx-auto bg-card rounded-t-2xl border-t border-border p-5 space-y-4">

              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-foreground">{selectedGym.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {selectedGym.address}
                  </p>
                </div>
                <button onClick={() => setSelectedGym(null)} className="p-1.5 text-muted-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-3 rounded-xl bg-secondary">
                  <Star className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
                  <p className="text-lg font-bold text-foreground">{selectedGym.rating || '—'}</p>
                  <p className="text-[10px] text-muted-foreground">Rating</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-secondary">
                  <Users className="w-4 h-4 text-primary mx-auto mb-1" />
                  <p className="text-lg font-bold text-foreground">{selectedGym.appGym?.member_count || 0}</p>
                  <p className="text-[10px] text-muted-foreground">Membros</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-secondary">
                  <Trophy className="w-4 h-4 text-yellow-500 mx-auto mb-1" />
                  <p className="text-lg font-bold text-foreground">{selectedGym.appGym?.pr_count || 0}</p>
                  <p className="text-[10px] text-muted-foreground">PRs</p>
                </div>
              </div>

              {selectedGym.appGym && selectedGym.appGym.total_points > 0 && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/10 border border-primary/20">
                  <Zap className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm font-bold text-foreground">{selectedGym.appGym.total_points} Gym Points</p>
                    <p className="text-[10px] text-muted-foreground">Pontos acumulados pelos atletas</p>
                  </div>
                </div>
              )}

              <button
                onClick={() => selectGym(selectedGym, selectedGym.appGym)}
                disabled={joining || selectedGym.appGym?.id === myGymId}
                className={cn(
                  "w-full py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors",
                  selectedGym.appGym?.id === myGymId
                    ? "bg-secondary text-muted-foreground"
                    : "bg-primary text-primary-foreground"
                )}>
                {joining ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : selectedGym.appGym?.id === myGymId ? (
                  <>
                    <CheckCircle className="w-4 h-4" /> Sua Academia Atual
                  </>
                ) : (
                  <>
                    <MapPin className="w-4 h-4" /> Selecionar como Minha Academia
                  </>
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
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end"
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
