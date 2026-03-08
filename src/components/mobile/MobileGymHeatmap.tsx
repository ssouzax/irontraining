import { useState, useEffect } from 'react';
import { MapPin, Flame, Trophy, TrendingUp, Loader2, Filter, User, Dumbbell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';

interface HeatmapGym {
  gym_id: string;
  gym_name: string;
  city: string | null;
  country: string | null;
  total_prs: number;
  total_volume: number;
  top_squat: number;
  top_bench: number;
  top_deadlift: number;
  intensity_score: number;
  member_count: number;
}

interface CityMetric {
  city: string;
  country: string | null;
  pr_count: number;
  total_volume: number;
  top_lift: number;
  top_lift_type: string | null;
  intensity_score: number;
}

type HeatFilter = 'all' | 'squat' | 'bench' | 'deadlift';

export function MobileGymHeatmap() {
  const [gyms, setGyms] = useState<HeatmapGym[]>([]);
  const [cities, setCities] = useState<CityMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<HeatFilter>('all');
  const [view, setView] = useState<'gyms' | 'cities'>('gyms');
  const [selectedGym, setSelectedGym] = useState<HeatmapGym | null>(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const [gymsRes, citiesRes] = await Promise.all([
      supabase.rpc('get_gym_heatmap', { days_back: 7 }),
      supabase.from('city_strength_metrics').select('*').gte('date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]).order('intensity_score', { ascending: false }).limit(50),
    ]);
    if (gymsRes.data) setGyms(gymsRes.data as HeatmapGym[]);
    if (citiesRes.data) {
      // Aggregate by city
      const cityMap = new Map<string, CityMetric>();
      (citiesRes.data as any[]).forEach(c => {
        const existing = cityMap.get(c.city);
        if (existing) {
          existing.pr_count += c.pr_count;
          existing.total_volume += c.total_volume;
          if (c.top_lift > existing.top_lift) {
            existing.top_lift = c.top_lift;
            existing.top_lift_type = c.top_lift_type;
          }
          existing.intensity_score = Math.max(existing.intensity_score, c.intensity_score);
        } else {
          cityMap.set(c.city, { ...c });
        }
      });
      setCities(Array.from(cityMap.values()).sort((a, b) => b.intensity_score - a.intensity_score));
    }
    setLoading(false);
  };

  const getHeatColor = (score: number) => {
    if (score >= 80) return 'from-red-500/30 to-orange-500/20 border-red-500/30';
    if (score >= 50) return 'from-orange-500/20 to-yellow-500/15 border-orange-500/25';
    if (score >= 20) return 'from-yellow-500/15 to-green-500/10 border-yellow-500/20';
    return 'from-green-500/10 to-blue-500/10 border-green-500/15';
  };

  const getHeatEmoji = (score: number) => {
    if (score >= 80) return '🔥';
    if (score >= 50) return '💪';
    if (score >= 20) return '⚡';
    return '❄️';
  };

  const filteredGyms = gyms.filter(g => {
    if (filter === 'squat') return g.top_squat > 0;
    if (filter === 'bench') return g.top_bench > 0;
    if (filter === 'deadlift') return g.top_deadlift > 0;
    return true;
  });

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="p-4 space-y-4">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Flame className="w-5 h-5 text-destructive" /> Mapa de Força
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">Onde os lifts mais pesados estão acontecendo</p>
      </motion.div>

      {/* View Toggle */}
      <div className="flex gap-1.5">
        <button onClick={() => setView('gyms')}
          className={cn("flex-1 py-2.5 rounded-xl text-xs font-medium text-center transition-colors",
            view === 'gyms' ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
          )}>
          <MapPin className="w-3.5 h-3.5 inline mr-1" /> Academias
        </button>
        <button onClick={() => setView('cities')}
          className={cn("flex-1 py-2.5 rounded-xl text-xs font-medium text-center transition-colors",
            view === 'cities' ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
          )}>
          <TrendingUp className="w-3.5 h-3.5 inline mr-1" /> Cidades
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {([
          { key: 'all' as HeatFilter, label: 'Todos' },
          { key: 'squat' as HeatFilter, label: 'Agachamento' },
          { key: 'bench' as HeatFilter, label: 'Supino' },
          { key: 'deadlift' as HeatFilter, label: 'Terra' },
        ]).map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={cn("px-3 py-1.5 rounded-full text-[11px] font-medium whitespace-nowrap shrink-0 transition-colors",
              filter === f.key ? "bg-primary/10 text-primary border border-primary/30" : "bg-secondary text-muted-foreground"
            )}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Gyms Heatmap List */}
      {view === 'gyms' && (
        <div className="space-y-3">
          {filteredGyms.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Nenhuma atividade registrada esta semana</p>
            </div>
          ) : filteredGyms.map((gym, i) => (
            <motion.div key={gym.gym_id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              onClick={() => setSelectedGym(selectedGym?.gym_id === gym.gym_id ? null : gym)}
              className={cn("rounded-2xl border p-4 cursor-pointer bg-gradient-to-r transition-all", getHeatColor(gym.intensity_score))}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getHeatEmoji(gym.intensity_score)}</span>
                    <span className="text-sm font-bold text-foreground">{gym.gym_name}</span>
                  </div>
                  {gym.city && (
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5 ml-7">
                      <MapPin className="w-3 h-3" /> {gym.city}{gym.country ? `, ${gym.country}` : ''}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="text-center">
                    <p className="text-xs font-bold text-primary">{gym.total_prs}</p>
                    <p className="text-[9px] text-muted-foreground">PRs</p>
                  </div>
                  <div className="w-px h-6 bg-border" />
                  <div className="text-center">
                    <p className="text-xs font-bold text-foreground">{gym.member_count}</p>
                    <p className="text-[9px] text-muted-foreground">Membros</p>
                  </div>
                </div>
              </div>

              {/* Expanded Detail */}
              {selectedGym?.gym_id === gym.gym_id && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                  className="mt-3 pt-3 border-t border-border/50">
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Top Agachamento', val: gym.top_squat },
                      { label: 'Top Supino', val: gym.top_bench },
                      { label: 'Top Terra', val: gym.top_deadlift },
                    ].map(s => (
                      <div key={s.label} className="text-center p-2 rounded-xl bg-background/50">
                        <p className="text-[9px] text-muted-foreground">{s.label}</p>
                        <p className="text-base font-extrabold text-foreground">{s.val > 0 ? `${s.val}kg` : '—'}</p>
                      </div>
                    ))}
                  </div>
                  {gym.total_volume > 0 && (
                    <p className="text-[11px] text-muted-foreground text-center mt-2">
                      Volume semanal: <span className="font-medium text-foreground">{Math.round(gym.total_volume).toLocaleString()}kg</span>
                    </p>
                  )}
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Cities View */}
      {view === 'cities' && (
        <div className="space-y-3">
          {cities.length === 0 ? (
            <div className="text-center py-12">
              <TrendingUp className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Nenhuma atividade por cidade registrada</p>
            </div>
          ) : cities.map((city, i) => (
            <motion.div key={city.city} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className={cn("rounded-2xl border p-4 bg-gradient-to-r", getHeatColor(city.intensity_score))}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-foreground flex items-center gap-2">
                    <span className="text-lg">{getHeatEmoji(city.intensity_score)}</span>
                    {city.city}
                  </p>
                  {city.country && <p className="text-[11px] text-muted-foreground ml-7">{city.country}</p>}
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-primary">{city.pr_count} PRs</p>
                  {city.top_lift > 0 && (
                    <p className="text-[10px] text-muted-foreground">Top: {city.top_lift}kg {city.top_lift_type || ''}</p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
