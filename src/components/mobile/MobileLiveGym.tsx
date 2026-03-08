import { useState, useEffect } from 'react';
import { Radio, Trophy, Flame, Zap, Loader2, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

interface LiveActivity {
  id: string;
  gym_id: string;
  user_id: string;
  activity_type: string;
  exercise_name: string;
  weight: number;
  reps: number;
  estimated_1rm: number;
  message: string | null;
  created_at: string;
  profile?: { display_name: string | null; avatar_url: string | null };
  gym?: { name: string | null };
}

export function MobileLiveGym() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<LiveActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [myGymId, setMyGymId] = useState<string | null>(null);
  const [myGymName, setMyGymName] = useState('');
  const [liveCount, setLiveCount] = useState(0);

  useEffect(() => {
    loadInitial();
  }, [user]);

  useEffect(() => {
    // Subscribe to realtime
    const channel = supabase
      .channel('live-gym-activity')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'gym_live_activity',
      }, async (payload) => {
        const newActivity = payload.new as any;
        // Enrich with profile
        const { data: profile } = await supabase
          .from('profiles').select('display_name, avatar_url').eq('user_id', newActivity.user_id).single();
        const { data: gym } = await supabase
          .from('gyms').select('name').eq('id', newActivity.gym_id).single();
        
        const enriched: LiveActivity = {
          ...newActivity,
          profile: profile || { display_name: 'Atleta', avatar_url: null },
          gym: gym || { name: 'Academia' },
        };
        
        setActivities(prev => [enriched, ...prev].slice(0, 50));
        setLiveCount(prev => prev + 1);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const loadInitial = async () => {
    // Get my gym
    if (user) {
      const { data: profile } = await supabase.from('profiles').select('gym_id').eq('user_id', user.id).single();
      if (profile?.gym_id) {
        setMyGymId(profile.gym_id);
        const { data: gym } = await supabase.from('gyms').select('name').eq('id', profile.gym_id).single();
        if (gym) setMyGymName(gym.name);
      }
    }

    // Load recent activity (all gyms)
    const { data } = await supabase
      .from('gym_live_activity')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (data && data.length > 0) {
      const userIds = [...new Set(data.map(a => a.user_id))];
      const gymIds = [...new Set(data.map(a => a.gym_id))];
      
      const { data: profiles } = await supabase
        .from('profiles').select('user_id, display_name, avatar_url').in('user_id', userIds);
      const { data: gyms } = await supabase
        .from('gyms').select('id, name').in('id', gymIds);
      
      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
      const gymMap = new Map((gyms || []).map(g => [g.id, g]));

      setActivities(data.map(a => ({
        ...a,
        profile: profileMap.get(a.user_id) || { display_name: 'Atleta', avatar_url: null },
        gym: gymMap.get(a.gym_id) || { name: 'Academia' },
      })));
    }
    setLoading(false);
  };

  const getActivityIcon = (type: string) => {
    if (type === 'pr') return <Trophy className="w-4 h-4 text-yellow-400" />;
    if (type === 'heavy') return <Flame className="w-4 h-4 text-destructive" />;
    return <Zap className="w-4 h-4 text-primary" />;
  };

  const getActivityLabel = (type: string) => {
    if (type === 'pr') return 'NOVO PR!';
    if (type === 'heavy') return 'LIFT PESADO';
    return 'TREINO';
  };

  const myGymActivities = myGymId ? activities.filter(a => a.gym_id === myGymId) : [];
  const allActivities = activities;

  return (
    <div className="p-4 space-y-5">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Radio className="w-5 h-5 text-destructive animate-pulse" /> Live Gym
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">PRs e lifts acontecendo agora</p>
      </motion.div>

      {/* Live indicator */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-destructive/10 border border-destructive/20">
        <div className="w-3 h-3 rounded-full bg-destructive animate-pulse" />
        <span className="text-sm font-medium text-foreground">
          {activities.length} atividades recentes
        </span>
      </div>

      {/* My Gym Section */}
      {myGymId && (
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" /> {myGymName || 'Minha Academia'}
          </h3>
          {myGymActivities.length === 0 ? (
            <p className="text-xs text-muted-foreground p-3 bg-card rounded-xl border border-border">
              Nenhuma atividade recente na sua academia
            </p>
          ) : (
            <div className="space-y-2">
              <AnimatePresence>
                {myGymActivities.slice(0, 10).map(activity => (
                  <motion.div key={activity.id}
                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                      {activity.profile?.avatar_url ? (
                        <img src={activity.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-bold text-primary">
                          {(activity.profile?.display_name || 'A')[0].toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        {getActivityIcon(activity.activity_type)}
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          {getActivityLabel(activity.activity_type)}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-foreground truncate">
                        {activity.profile?.display_name || 'Atleta'} — {activity.exercise_name}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true, locale: ptBR })}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-extrabold text-primary">{activity.weight}<span className="text-xs">kg</span></p>
                      <p className="text-[10px] text-muted-foreground">×{activity.reps}</p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

      {/* Global Feed */}
      <div className="space-y-2">
        <h3 className="text-sm font-bold text-foreground">🌍 Feed Global</h3>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        ) : allActivities.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-xl border border-border">
            <Radio className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Nenhuma atividade ao vivo ainda</p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {allActivities.map(activity => (
                <motion.div key={activity.id}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className={cn("flex items-center gap-3 p-3 rounded-xl border",
                    activity.activity_type === 'pr'
                      ? "bg-gradient-to-r from-yellow-500/5 to-card border-yellow-500/20"
                      : "bg-card border-border"
                  )}>
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                    {activity.profile?.avatar_url ? (
                      <img src={activity.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold text-primary">
                        {(activity.profile?.display_name || 'A')[0].toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      {getActivityIcon(activity.activity_type)}
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        {getActivityLabel(activity.activity_type)}
                      </span>
                    </div>
                    <p className="text-sm text-foreground truncate">
                      <span className="font-semibold">{activity.profile?.display_name || 'Atleta'}</span>
                      {' '}{activity.exercise_name}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {activity.gym?.name} · {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true, locale: ptBR })}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-extrabold text-primary">{activity.weight}<span className="text-xs">kg</span></p>
                    {activity.estimated_1rm > 0 && (
                      <p className="text-[10px] text-muted-foreground">E1RM {activity.estimated_1rm}kg</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
