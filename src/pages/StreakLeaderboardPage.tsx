import { useState, useEffect } from 'react';
import { Flame, Trophy, Crown, Medal, MapPin, Filter, Loader2, ChevronLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface StreakEntry {
  user_id: string;
  display_name: string;
  username: string | null;
  avatar_url: string | null;
  current_streak: number;
  longest_streak: number;
  weekly_consistency_streak: number;
  gym_name: string | null;
  gym_id: string | null;
}

export default function StreakLeaderboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [entries, setEntries] = useState<StreakEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'global' | 'gym'>('global');
  const [userGymId, setUserGymId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('gym_id').eq('user_id', user.id).single()
      .then(({ data }) => setUserGymId(data?.gym_id || null));
  }, [user]);

  useEffect(() => {
    loadLeaderboard();
  }, [filter, userGymId]);

  const loadLeaderboard = async () => {
    setLoading(true);
    const gymId = filter === 'gym' ? userGymId : null;
    const { data } = await supabase.rpc('get_streak_leaderboard', {
      target_gym_id: gymId,
    });
    setEntries((data as StreakEntry[]) || []);
    setLoading(false);
  };

  const getStreakIcon = (streak: number) => {
    if (streak >= 100) return '🔥🔥🔥';
    if (streak >= 30) return '🔥🔥';
    if (streak >= 7) return '🔥';
    return '⚡';
  };

  const getStreakBadge = (streak: number) => {
    if (streak >= 200) return { label: 'Imortal', color: 'bg-gradient-to-r from-yellow-400 to-amber-600 text-black' };
    if (streak >= 100) return { label: 'Lenda', color: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' };
    if (streak >= 50) return { label: 'Titã', color: 'bg-gradient-to-r from-red-500 to-orange-500 text-white' };
    if (streak >= 30) return { label: 'Máquina', color: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white' };
    if (streak >= 15) return { label: 'Consistente', color: 'bg-primary text-primary-foreground' };
    if (streak >= 7) return { label: 'Dedicado', color: 'bg-secondary text-secondary-foreground' };
    return null;
  };

  const myRank = entries.findIndex(e => e.user_id === user?.id) + 1;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-full hover:bg-secondary">
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Flame className="w-5 h-5 text-destructive" /> Ranking de Streaks
            </h1>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mt-3">
          {(['global', 'gym'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              disabled={f === 'gym' && !userGymId}
              className={cn(
                "flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5",
                filter === f
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-secondary text-muted-foreground",
                f === 'gym' && !userGymId && "opacity-40"
              )}
            >
              {f === 'global' ? <Trophy className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}
              {f === 'global' ? 'Global' : 'Minha Academia'}
            </button>
          ))}
        </div>
      </div>

      {/* My position */}
      {myRank > 0 && (
        <div className="mx-4 mt-4 p-3 rounded-2xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium">Sua posição</span>
              <span className="text-2xl font-black text-primary">#{myRank}</span>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-foreground">
                {getStreakIcon(entries[myRank - 1]?.current_streak || 0)} {entries[myRank - 1]?.current_streak || 0} dias
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard */}
      <div className="px-4 mt-4 space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-16">
            <Flame className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Nenhum streak ativo ainda</p>
            <p className="text-muted-foreground/60 text-xs mt-1">Treine para aparecer no ranking!</p>
          </div>
        ) : (
          <AnimatePresence>
            {entries.map((entry, idx) => {
              const badge = getStreakBadge(entry.current_streak);
              const isMe = entry.user_id === user?.id;
              return (
                <motion.div
                  key={entry.user_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  onClick={() => navigate(`/athlete/${entry.user_id}`)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all",
                    isMe ? "bg-primary/10 border border-primary/20" : "bg-card border border-border hover:border-primary/20"
                  )}
                >
                  {/* Rank */}
                  <div className="w-8 text-center shrink-0">
                    {idx === 0 ? <Crown className="w-6 h-6 text-primary mx-auto" /> :
                     idx === 1 ? <Medal className="w-5 h-5 text-muted-foreground mx-auto" /> :
                     idx === 2 ? <Medal className="w-5 h-5 text-accent-foreground mx-auto" /> :
                     <span className="text-sm font-bold text-muted-foreground">{idx + 1}</span>}
                  </div>

                  {/* Avatar */}
                  <Avatar className="w-10 h-10 border-2 border-border">
                    <AvatarImage src={entry.avatar_url || ''} />
                    <AvatarFallback className="bg-secondary text-foreground text-xs font-bold">
                      {(entry.display_name || '?').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-bold text-foreground truncate">
                        {entry.display_name || entry.username || 'Atleta'}
                      </p>
                      {badge && (
                        <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full font-bold", badge.color)}>
                          {badge.label}
                        </span>
                      )}
                    </div>
                    {entry.gym_name && filter === 'global' && (
                      <p className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <MapPin className="w-2.5 h-2.5" /> {entry.gym_name}
                      </p>
                    )}
                    <p className="text-[10px] text-muted-foreground">
                      Recorde: {entry.longest_streak} dias · {entry.weekly_consistency_streak} semanas
                    </p>
                  </div>

                  {/* Streak count */}
                  <div className="text-right shrink-0">
                    <p className="text-lg font-black text-foreground">{entry.current_streak}</p>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wider">
                      {getStreakIcon(entry.current_streak)} dias
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
