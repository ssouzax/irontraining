import { useState, useEffect } from 'react';
import { Trophy, User, Loader2, Dumbbell, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';

interface DayPR {
  id: string;
  user_id: string;
  exercise_name: string;
  weight: number;
  reps: number;
  estimated_1rm: number;
  recorded_at: string;
  profile?: { display_name: string | null; username: string | null; avatar_url: string | null };
}

export function ExplorePRsOfDay() {
  const [prs, setPrs] = useState<DayPR[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPRs();
  }, []);

  const loadPRs = async () => {
    setLoading(true);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data } = await supabase
      .from('personal_records')
      .select('*')
      .gte('recorded_at', today.toISOString())
      .order('estimated_1rm', { ascending: false })
      .limit(50);

    if (data && data.length > 0) {
      const userIds = [...new Set(data.map(p => p.user_id))];
      const { data: profiles } = await supabase.from('profiles').select('user_id, display_name, username, avatar_url').in('user_id', userIds);
      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
      setPrs(data.map(p => ({ ...p, profile: profileMap.get(p.user_id) })));
    } else {
      setPrs([]);
    }
    setLoading(false);
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  if (prs.length === 0) return (
    <div className="text-center py-12 px-4">
      <Trophy className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
      <p className="text-sm text-muted-foreground">Nenhum PR registrado hoje ainda</p>
      <p className="text-xs text-muted-foreground/60 mt-1">Seja o primeiro a bater um recorde! 💪</p>
    </div>
  );

  return (
    <div className="px-4 space-y-2">
      <div className="flex items-center gap-2 pb-1">
        <Flame className="w-4 h-4 text-destructive" />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{prs.length} PRs hoje</span>
      </div>
      {prs.map((pr, i) => (
        <motion.div
          key={pr.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04 }}
          className={cn(
            "rounded-2xl border p-3 flex items-center gap-3",
            i < 3 ? "bg-gradient-to-r from-primary/10 to-card border-primary/20" : "bg-card border-border"
          )}
        >
          {i < 3 && (
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
              i === 0 ? "bg-yellow-500/20 text-yellow-400" : i === 1 ? "bg-gray-400/20 text-gray-400" : "bg-amber-700/20 text-amber-600"
            )}>
              #{i + 1}
            </div>
          )}
          {i >= 3 && (
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-medium text-muted-foreground shrink-0">
              {i + 1}
            </div>
          )}

          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
            {pr.profile?.avatar_url ? (
              <img src={pr.profile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <User className="w-3.5 h-3.5 text-primary" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{pr.profile?.display_name || 'Atleta'}</p>
            <p className="text-[11px] text-muted-foreground truncate">{pr.exercise_name}</p>
          </div>

          <div className="text-right shrink-0">
            <p className="text-base font-extrabold text-foreground">{pr.weight}<span className="text-[10px] text-muted-foreground">kg</span></p>
            <p className="text-[10px] text-primary font-medium">E1RM {pr.estimated_1rm}kg</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
