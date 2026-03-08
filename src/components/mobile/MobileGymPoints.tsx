import { useState, useEffect } from 'react';
import { Trophy, Crown, Shield, Star, Gem, Users, Loader2, Zap, MapPin, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const TIERS = [
  { key: 'bronze', label: 'Bronze', icon: Shield, color: 'text-amber-700', bg: 'bg-amber-700/10', min: 0 },
  { key: 'silver', label: 'Prata', icon: Shield, color: 'text-gray-400', bg: 'bg-gray-400/10', min: 500 },
  { key: 'gold', label: 'Ouro', icon: Trophy, color: 'text-yellow-400', bg: 'bg-yellow-400/10', min: 2000 },
  { key: 'platinum', label: 'Platina', icon: Gem, color: 'text-cyan-400', bg: 'bg-cyan-400/10', min: 5000 },
  { key: 'diamond', label: 'Diamante', icon: Star, color: 'text-blue-400', bg: 'bg-blue-400/10', min: 10000 },
  { key: 'elite', label: 'Elite', icon: Crown, color: 'text-primary', bg: 'bg-primary/10', min: 25000 },
  { key: 'legendary', label: 'Lendário', icon: Flame, color: 'text-destructive', bg: 'bg-destructive/10', min: 50000 },
];

function getTierInfo(points: number) {
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (points >= TIERS[i].min) return TIERS[i];
  }
  return TIERS[0];
}

function getNextTier(points: number) {
  for (const tier of TIERS) {
    if (points < tier.min) return tier;
  }
  return null;
}

interface GymRanking {
  gym_id: string;
  gym_name: string;
  city: string | null;
  country: string | null;
  total_points: number;
  tier: string;
  member_count: number;
  pr_count: number;
}

export function MobileGymPoints() {
  const { user } = useAuth();
  const [rankings, setRankings] = useState<GymRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [myGymPoints, setMyGymPoints] = useState(0);
  const [myGymId, setMyGymId] = useState<string | null>(null);

  useEffect(() => { loadRankings(); }, [user]);

  const loadRankings = async () => {
    const { data } = await supabase.rpc('get_gym_rankings', { limit_count: 50 });
    if (data) setRankings(data as GymRanking[]);

    if (user) {
      const { data: profile } = await supabase.from('profiles').select('gym_id').eq('user_id', user.id).single();
      if (profile?.gym_id) {
        setMyGymId(profile.gym_id);
        const { data: points } = await supabase
          .from('gym_points_log').select('points').eq('gym_id', profile.gym_id);
        setMyGymPoints((points || []).reduce((sum, p) => sum + p.points, 0));
      }
    }
    setLoading(false);
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  const myGym = rankings.find(r => r.gym_id === myGymId);
  const myRank = rankings.findIndex(r => r.gym_id === myGymId) + 1;
  const tier = getTierInfo(myGym?.total_points || 0);
  const nextTier = getNextTier(myGym?.total_points || 0);
  const TierIcon = tier.icon;

  return (
    <div className="p-4 space-y-5">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" /> Gym Points
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">Academias competem por pontos de seus atletas</p>
      </motion.div>

      {/* My Gym Card */}
      {myGym && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-gradient-to-br from-primary/15 via-card to-card border border-primary/20 p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-lg font-bold text-foreground">{myGym.gym_name}</p>
              {myGym.city && <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" />{myGym.city}</p>}
            </div>
            <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full", tier.bg)}>
              <TierIcon className={cn("w-4 h-4", tier.color)} />
              <span className={cn("text-xs font-bold", tier.color)}>{tier.label}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-3 rounded-xl bg-background/50">
              <p className="text-[10px] text-muted-foreground uppercase">Rank</p>
              <p className="text-2xl font-extrabold text-foreground">#{myRank}</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-background/50">
              <p className="text-[10px] text-muted-foreground uppercase">Pontos</p>
              <p className="text-2xl font-extrabold text-primary">{myGym.total_points}</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-background/50">
              <p className="text-[10px] text-muted-foreground uppercase">PRs</p>
              <p className="text-2xl font-extrabold text-foreground">{myGym.pr_count}</p>
            </div>
          </div>

          {nextTier && (
            <div className="mt-3">
              <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                <span>{tier.label}</span>
                <span>{nextTier.label} ({nextTier.min} pts)</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${Math.min(100, ((myGym.total_points - tier.min) / (nextTier.min - tier.min)) * 100)}%` }} />
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* How points work */}
      <div className="rounded-xl bg-card border border-border p-4">
        <p className="text-xs font-semibold text-foreground mb-2">Como ganhar pontos:</p>
        <div className="space-y-1.5 text-[11px] text-muted-foreground">
          <p>🏆 Novo PR = <span className="text-foreground font-medium">+10 pts</span></p>
          <p>💪 Lift acima do limiar = <span className="text-foreground font-medium">+5 pts</span></p>
          <p>🔥 Streak semanal = <span className="text-foreground font-medium">+2 pts</span></p>
          <p>⭐ Conquista desbloqueada = <span className="text-foreground font-medium">+3 pts</span></p>
          <p>📈 Treino completo = <span className="text-foreground font-medium">+1 pt</span></p>
        </div>
      </div>

      {/* Global Gym Rankings */}
      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <Crown className="w-4 h-4 text-yellow-400" />
          <span className="text-sm font-semibold text-foreground">Ranking Global de Academias</span>
        </div>
        {rankings.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Nenhuma academia registrada</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {rankings.map((gym, i) => {
              const gymTier = getTierInfo(gym.total_points);
              const GymIcon = gymTier.icon;
              return (
                <div key={gym.gym_id} className={cn("flex items-center gap-3 px-4 py-3",
                  i < 3 && "bg-primary/5",
                  gym.gym_id === myGymId && "ring-1 ring-primary/30"
                )}>
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0",
                    i === 0 ? "bg-yellow-500/20 text-yellow-400" :
                    i === 1 ? "bg-gray-400/20 text-gray-400" :
                    i === 2 ? "bg-amber-700/20 text-amber-600" :
                    "bg-secondary text-muted-foreground"
                  )}>{i + 1}</div>
                  <GymIcon className={cn("w-4 h-4 shrink-0", gymTier.color)} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{gym.gym_name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {gym.city || '—'} · <Users className="w-3 h-3 inline" /> {gym.member_count}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-base font-extrabold text-primary">{gym.total_points}</p>
                    <p className="text-[10px] text-muted-foreground">{gymTier.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
