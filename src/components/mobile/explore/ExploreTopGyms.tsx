import { useState, useEffect } from 'react';
import { MapPin, User, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';

interface TrendingGym {
  gym_id: string;
  gym_name: string;
  city: string | null;
  total_prs: number;
  top_squat: number;
  top_bench: number;
  top_deadlift: number;
  intensity_score: number;
  member_count: number;
}

export function ExploreTopGyms() {
  const [gyms, setGyms] = useState<TrendingGym[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGyms();
  }, []);

  const loadGyms = async () => {
    setLoading(true);
    const { data } = await supabase.rpc('get_gym_heatmap', { days_back: 7 });
    if (data) setGyms(data as TrendingGym[]);
    setLoading(false);
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  if (gyms.length === 0) return (
    <div className="text-center py-12">
      <MapPin className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
      <p className="text-sm text-muted-foreground">Nenhuma academia ativa esta semana</p>
    </div>
  );

  return (
    <div className="px-4 space-y-3">
      {gyms.map((gym, i) => (
        <motion.div key={gym.gym_id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
          className={cn("rounded-2xl border p-4", i < 3 ? "bg-gradient-to-r from-primary/10 to-card border-primary/20" : "bg-card border-border")}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2">
                {i < 3 && (
                  <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold",
                    i === 0 ? "bg-yellow-500/20 text-yellow-400" : i === 1 ? "bg-gray-400/20 text-gray-400" : "bg-amber-700/20 text-amber-600"
                  )}>#{i + 1}</div>
                )}
                <span className="text-sm font-bold text-foreground">{gym.gym_name}</span>
              </div>
              {gym.city && (
                <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3" /> {gym.city}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <User className="w-3 h-3" /> {gym.member_count}
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'PRs', val: gym.total_prs, emoji: '🏆' },
              { label: 'SQT', val: gym.top_squat > 0 ? `${gym.top_squat}` : '—', emoji: '' },
              { label: 'BNC', val: gym.top_bench > 0 ? `${gym.top_bench}` : '—', emoji: '' },
              { label: 'DL', val: gym.top_deadlift > 0 ? `${gym.top_deadlift}` : '—', emoji: '' },
            ].map(s => (
              <div key={s.label} className="text-center p-1.5 rounded-lg bg-background/50">
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
                <p className="text-sm font-bold text-foreground">{s.emoji}{s.val}</p>
              </div>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
