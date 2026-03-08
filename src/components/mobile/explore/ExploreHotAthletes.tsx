import { useState, useEffect } from 'react';
import { TrendingUp, User, Loader2, Zap, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';

interface HotAthlete {
  user_id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  power_score: number;
  pr_count: number;
}

export function ExploreHotAthletes() {
  const [athletes, setAthletes] = useState<HotAthlete[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAthletes();
  }, []);

  const loadAthletes = async () => {
    setLoading(true);

    const { data: scores } = await supabase
      .from('power_scores')
      .select('user_id, power_score')
      .order('power_score', { ascending: false })
      .limit(30);

    if (scores && scores.length > 0) {
      const userIds = scores.map(s => s.user_id);
      const [profilesRes, prsRes] = await Promise.all([
        supabase.from('profiles').select('user_id, display_name, username, avatar_url').in('user_id', userIds),
        supabase.from('personal_records').select('user_id').in('user_id', userIds),
      ]);

      const profileMap = new Map((profilesRes.data || []).map(p => [p.user_id, p]));
      const prCountMap = new Map<string, number>();
      (prsRes.data || []).forEach((pr: any) => {
        prCountMap.set(pr.user_id, (prCountMap.get(pr.user_id) || 0) + 1);
      });

      setAthletes(scores.map(s => ({
        user_id: s.user_id,
        power_score: s.power_score,
        pr_count: prCountMap.get(s.user_id) || 0,
        ...(profileMap.get(s.user_id) || { display_name: null, username: null, avatar_url: null }),
      })));
    }
    setLoading(false);
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  if (athletes.length === 0) return (
    <div className="text-center py-12 px-4">
      <TrendingUp className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
      <p className="text-sm text-muted-foreground">Nenhum atleta ativo ainda</p>
    </div>
  );

  return (
    <div className="px-4 space-y-2">
      <div className="flex items-center gap-2 pb-1">
        <TrendingUp className="w-4 h-4 text-primary" />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Top Power Score</span>
      </div>
      {athletes.map((a, i) => (
        <motion.div
          key={a.user_id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04 }}
          className={cn(
            "rounded-2xl border p-3 flex items-center gap-3",
            i < 3 ? "bg-gradient-to-r from-primary/10 to-card border-primary/20" : "bg-card border-border"
          )}
        >
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
            i === 0 ? "bg-yellow-500/20 text-yellow-400" :
            i === 1 ? "bg-gray-400/20 text-gray-400" :
            i === 2 ? "bg-amber-700/20 text-amber-600" :
            "bg-secondary text-muted-foreground"
          )}>
            {i < 3 ? `#${i + 1}` : i + 1}
          </div>

          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
            {a.avatar_url ? (
              <img src={a.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <User className="w-4 h-4 text-primary" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{a.display_name || 'Atleta'}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[11px] text-muted-foreground flex items-center gap-0.5">
                <Trophy className="w-3 h-3" /> {a.pr_count} PRs
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-lg font-extrabold text-foreground">{Math.round(a.power_score)}</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
