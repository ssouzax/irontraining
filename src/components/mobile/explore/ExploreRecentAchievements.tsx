import { useState, useEffect } from 'react';
import { Award, User, Loader2, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';

interface RecentAchievement {
  id: string;
  user_id: string;
  title: string;
  description: string;
  icon: string | null;
  type: string;
  unlocked_at: string;
  profile?: { display_name: string | null; avatar_url: string | null };
}

export function ExploreRecentAchievements() {
  const [achievements, setAchievements] = useState<RecentAchievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    setLoading(true);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const { data } = await supabase
      .from('achievements')
      .select('*')
      .gte('unlocked_at', weekAgo.toISOString())
      .order('unlocked_at', { ascending: false })
      .limit(40);

    if (data && data.length > 0) {
      const userIds = [...new Set(data.map(a => a.user_id))];
      const { data: profiles } = await supabase.from('profiles').select('user_id, display_name, avatar_url').in('user_id', userIds);
      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
      setAchievements(data.map(a => ({ ...a, profile: profileMap.get(a.user_id) })));
    }
    setLoading(false);
  };

  const iconMap: Record<string, string> = {
    trophy: '🏆', medal: '🥇', fire: '🔥', star: '⭐', crown: '👑',
    zap: '⚡', target: '🎯', gem: '💎', rocket: '🚀', muscle: '💪',
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  if (achievements.length === 0) return (
    <div className="text-center py-12 px-4">
      <Award className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
      <p className="text-sm text-muted-foreground">Nenhuma conquista desbloqueada esta semana</p>
    </div>
  );

  return (
    <div className="px-4 space-y-2">
      <div className="flex items-center gap-2 pb-1">
        <Star className="w-4 h-4 text-warning" />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{achievements.length} conquistas esta semana</span>
      </div>
      {achievements.map((ach, i) => (
        <motion.div
          key={ach.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.03 }}
          className="rounded-2xl border border-border bg-card p-3 flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center text-lg shrink-0">
            {iconMap[ach.icon || 'trophy'] || '🏆'}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{ach.title}</p>
            <p className="text-[11px] text-muted-foreground truncate">{ach.description}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                {ach.profile?.avatar_url ? (
                  <img src={ach.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-2.5 h-2.5 text-primary" />
                )}
              </div>
              <span className="text-[10px] text-muted-foreground">{ach.profile?.display_name || 'Atleta'}</span>
              <span className="text-[10px] text-muted-foreground/60">
                {formatDistanceToNow(new Date(ach.unlocked_at), { addSuffix: true, locale: ptBR })}
              </span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
