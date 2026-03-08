import { useState, useEffect } from 'react';
import { Swords, Loader2, UserPlus, Trophy, TrendingUp, X, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface RivalData {
  user_id: string;
  display_name: string;
  username: string | null;
  avatar_url: string | null;
  bodyweight: number;
  dots_score: number;
  squat_pr: number;
  bench_pr: number;
  deadlift_pr: number;
  total: number;
}

interface ActiveRival {
  id: string;
  rival_user_id: string;
  created_at: string;
  profile?: RivalData;
}

export function MobileRivals() {
  const { user } = useAuth();
  const [rivals, setRivals] = useState<ActiveRival[]>([]);
  const [potentialRivals, setPotentialRivals] = useState<RivalData[]>([]);
  const [myStats, setMyStats] = useState<RivalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [selectedRival, setSelectedRival] = useState<ActiveRival | null>(null);

  useEffect(() => { if (user) loadData(); }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);

    // Load my stats
    const { data: myLs } = await supabase.from('leaderboard_scores').select('*').eq('user_id', user.id).single();
    const { data: myProfile } = await supabase.from('profiles').select('display_name, username, avatar_url').eq('user_id', user.id).single();
    if (myLs && myProfile) {
      setMyStats({
        user_id: user.id,
        display_name: myProfile.display_name || '',
        username: myProfile.username,
        avatar_url: myProfile.avatar_url,
        bodyweight: myLs.bodyweight || 0,
        dots_score: myLs.dots_score || 0,
        squat_pr: myLs.squat_pr || 0,
        bench_pr: myLs.bench_pr || 0,
        deadlift_pr: myLs.deadlift_pr || 0,
        total: myLs.total || 0,
      });
    }

    // Load active rivals
    const { data: rivalRows } = await supabase.from('rivals').select('*').eq('user_id', user.id).eq('active', true);
    if (rivalRows && rivalRows.length > 0) {
      const enriched = await Promise.all(rivalRows.map(async (r: any) => {
        const { data: ls } = await supabase.from('leaderboard_scores').select('*').eq('user_id', r.rival_user_id).single();
        const { data: p } = await supabase.from('profiles').select('display_name, username, avatar_url').eq('user_id', r.rival_user_id).single();
        return {
          ...r,
          profile: ls && p ? {
            user_id: r.rival_user_id,
            display_name: p.display_name || '',
            username: p.username,
            avatar_url: p.avatar_url,
            bodyweight: ls.bodyweight || 0,
            dots_score: ls.dots_score || 0,
            squat_pr: ls.squat_pr || 0,
            bench_pr: ls.bench_pr || 0,
            deadlift_pr: ls.deadlift_pr || 0,
            total: ls.total || 0,
          } : null,
        } as ActiveRival;
      }));
      setRivals(enriched);
    }
    setLoading(false);
  };

  const findRivals = async () => {
    if (!user) return;
    setSearching(true);
    const { data } = await supabase.rpc('find_potential_rivals', { target_user_id: user.id });
    if (data) setPotentialRivals(data as RivalData[]);
    setSearching(false);
  };

  const addRival = async (rivalUserId: string) => {
    if (!user) return;
    const { error } = await supabase.from('rivals').insert({ user_id: user.id, rival_user_id: rivalUserId });
    if (error) { toast.error('Erro ao adicionar rival'); return; }
    toast.success('Rival adicionado! 🥊');
    setPotentialRivals(p => p.filter(r => r.user_id !== rivalUserId));
    loadData();
  };

  const removeRival = async (rivalId: string) => {
    await supabase.from('rivals').delete().eq('id', rivalId);
    setRivals(r => r.filter(rv => rv.id !== rivalId));
    setSelectedRival(null);
    toast.success('Rival removido');
  };

  const compareStat = (mine: number, theirs: number) => {
    if (mine > theirs) return 'text-emerald-400';
    if (mine < theirs) return 'text-rose-400';
    return 'text-muted-foreground';
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="p-4 space-y-5">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Swords className="w-5 h-5 text-primary" /> Rivais de Força
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">Enfrente atletas do seu nível</p>
      </motion.div>

      {/* Active Rivals */}
      {rivals.length > 0 ? (
        <div className="space-y-3">
          {rivals.map((rival, i) => rival.profile && (
            <motion.div key={rival.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              onClick={() => setSelectedRival(rival)}
              className="bg-card rounded-2xl border border-border p-4 active:scale-[0.98] transition-transform cursor-pointer">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                  {rival.profile.avatar_url ? (
                    <img src={rival.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{rival.profile.display_name || 'Atleta'}</p>
                  <p className="text-xs text-muted-foreground">{rival.profile.bodyweight}kg · DOTS {rival.profile.dots_score}</p>
                </div>
                <Swords className="w-4 h-4 text-primary shrink-0" />
              </div>
              {myStats && (
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'SQT', mine: myStats.squat_pr, theirs: rival.profile.squat_pr },
                    { label: 'BNC', mine: myStats.bench_pr, theirs: rival.profile.bench_pr },
                    { label: 'DL', mine: myStats.deadlift_pr, theirs: rival.profile.deadlift_pr },
                  ].map(s => (
                    <div key={s.label} className="text-center p-2 rounded-xl bg-secondary/50">
                      <p className="text-[10px] text-muted-foreground uppercase">{s.label}</p>
                      <div className="flex items-center justify-center gap-1.5 mt-0.5">
                        <span className={cn("text-sm font-bold", compareStat(s.mine, s.theirs))}>{s.mine}</span>
                        <span className="text-[10px] text-muted-foreground">vs</span>
                        <span className={cn("text-sm font-bold", compareStat(s.theirs, s.mine))}>{s.theirs}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border p-6 text-center">
          <Swords className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Nenhum rival ainda</p>
          <p className="text-xs text-muted-foreground mt-1">Busque atletas do seu nível!</p>
        </div>
      )}

      {/* Find Rivals */}
      <button onClick={findRivals} disabled={searching}
        className="w-full bg-primary text-primary-foreground py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">
        {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
        Buscar Rivais Compatíveis
      </button>

      {/* Potential Rivals */}
      {potentialRivals.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Rivais em potencial</p>
          {potentialRivals.map(rival => (
            <div key={rival.user_id} className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                {rival.avatar_url ? (
                  <img src={rival.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-4 h-4 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{rival.display_name || 'Atleta'}</p>
                <p className="text-[11px] text-muted-foreground">{rival.bodyweight}kg · DOTS {rival.dots_score} · Total {rival.total}kg</p>
              </div>
              <button onClick={() => addRival(rival.user_id)}
                className="px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-medium flex items-center gap-1">
                <UserPlus className="w-3 h-3" /> Rivalizar
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Rival Detail Modal */}
      <AnimatePresence>
        {selectedRival?.profile && myStats && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end justify-center"
            onClick={() => setSelectedRival(null)}>
            <motion.div initial={{ y: 400 }} animate={{ y: 0 }} exit={{ y: 400 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md bg-card border-t border-border rounded-t-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Swords className="w-5 h-5 text-primary" /> Duelo
                </h3>
                <button onClick={() => setSelectedRival(null)} className="p-1 text-muted-foreground"><X className="w-5 h-5" /></button>
              </div>

              {/* Head to Head */}
              <div className="flex items-center justify-between px-4">
                <div className="text-center">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-1 overflow-hidden">
                    {myStats.avatar_url ? <img src={myStats.avatar_url} className="w-full h-full object-cover" /> : <User className="w-7 h-7 text-primary" />}
                  </div>
                  <p className="text-xs font-medium text-foreground">Você</p>
                </div>
                <span className="text-2xl font-extrabold text-primary">VS</span>
                <div className="text-center">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-1 overflow-hidden">
                    {selectedRival.profile.avatar_url ? <img src={selectedRival.profile.avatar_url} className="w-full h-full object-cover" /> : <User className="w-7 h-7 text-primary" />}
                  </div>
                  <p className="text-xs font-medium text-foreground truncate max-w-[80px]">{selectedRival.profile.display_name}</p>
                </div>
              </div>

              {/* Stats Comparison */}
              <div className="space-y-2">
                {[
                  { label: 'Agachamento', mine: myStats.squat_pr, theirs: selectedRival.profile.squat_pr },
                  { label: 'Supino', mine: myStats.bench_pr, theirs: selectedRival.profile.bench_pr },
                  { label: 'Terra', mine: myStats.deadlift_pr, theirs: selectedRival.profile.deadlift_pr },
                  { label: 'Total', mine: myStats.total, theirs: selectedRival.profile.total },
                  { label: 'DOTS', mine: myStats.dots_score, theirs: selectedRival.profile.dots_score },
                ].map(s => {
                  const total = s.mine + s.theirs;
                  const myPct = total > 0 ? (s.mine / total * 100) : 50;
                  return (
                    <div key={s.label} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className={cn("font-bold", compareStat(s.mine, s.theirs))}>{s.mine}kg</span>
                        <span className="text-muted-foreground">{s.label}</span>
                        <span className={cn("font-bold", compareStat(s.theirs, s.mine))}>{s.theirs}kg</span>
                      </div>
                      <div className="h-2 rounded-full bg-secondary overflow-hidden flex">
                        <div className="h-full bg-emerald-500/70 rounded-l-full transition-all" style={{ width: `${myPct}%` }} />
                        <div className="h-full bg-rose-500/70 rounded-r-full transition-all" style={{ width: `${100 - myPct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              <button onClick={() => removeRival(selectedRival.id)}
                className="w-full py-2.5 rounded-xl border border-destructive/30 text-destructive text-sm font-medium">
                Remover Rival
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
