import { useState, useEffect } from 'react';
import { Zap, Loader2, RefreshCw, Crown, User, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface PowerScoreEntry {
  user_id: string;
  display_name: string;
  username: string | null;
  avatar_url: string | null;
  power_score: number;
  last_updated: string;
}

export function MobilePowerScore() {
  const { user } = useAuth();
  const [myScore, setMyScore] = useState<{ power_score: number; dots: number; pr_freq: number; consistency: number; volume: number } | null>(null);
  const [leaderboard, setLeaderboard] = useState<PowerScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => { if (user) loadData(); }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    const [scoreRes, lbRes] = await Promise.all([
      supabase.from('power_scores').select('*').eq('user_id', user.id).single(),
      supabase.rpc('get_power_score_leaderboard'),
    ]);
    if (scoreRes.data) {
      const d = scoreRes.data as any;
      setMyScore({
        power_score: d.power_score,
        dots: d.dots_component,
        pr_freq: d.pr_frequency_component,
        consistency: d.consistency_component,
        volume: d.volume_component,
      });
    }
    if (lbRes.data) setLeaderboard(lbRes.data as PowerScoreEntry[]);
    setLoading(false);
  };

  const calculateScore = async () => {
    if (!user) return;
    setCalculating(true);

    // Get DOTS from leaderboard_scores
    const { data: ls } = await supabase.from('leaderboard_scores').select('dots_score').eq('user_id', user.id).single();
    const dotsScore = ls?.dots_score || 0;

    // PR frequency: count PRs in last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { count: prCount } = await supabase.from('personal_records').select('id', { count: 'exact' }).eq('user_id', user.id).gte('recorded_at', thirtyDaysAgo);

    // Consistency: workouts in last 30 days / expected (assume 4/week = ~17)
    const { count: workoutCount } = await supabase.from('workout_logs').select('id', { count: 'exact' }).eq('user_id', user.id).gte('created_at', thirtyDaysAgo);

    // Volume: total weight from performed_sets in last 30 days
    const { data: sets } = await supabase.from('performed_sets').select('weight_used, reps_completed').eq('user_id', user.id).gte('created_at', thirtyDaysAgo).eq('completed', true);
    const totalVolume = (sets || []).reduce((acc, s) => acc + ((s.weight_used || 0) * (s.reps_completed || 0)), 0);

    // Normalize components (0-100 scale)
    const dotsComponent = Math.min(100, dotsScore / 5); // 500 DOTS = 100
    const prFreqComponent = Math.min(100, (prCount || 0) * 10); // 10 PRs = 100
    const consistencyComponent = Math.min(100, ((workoutCount || 0) / 17) * 100);
    const volumeComponent = Math.min(100, totalVolume / 500000 * 100); // 500k volume = 100

    // Weighted score
    const powerScore = Math.round(
      dotsComponent * 0.4 +
      prFreqComponent * 0.2 +
      consistencyComponent * 0.2 +
      volumeComponent * 0.2
    );

    await supabase.from('power_scores').upsert({
      user_id: user.id,
      power_score: powerScore,
      dots_component: Math.round(dotsComponent),
      pr_frequency_component: Math.round(prFreqComponent),
      consistency_component: Math.round(consistencyComponent),
      volume_component: Math.round(volumeComponent),
    }, { onConflict: 'user_id' });

    toast.success(`Power Score atualizado: ${powerScore}`);
    loadData();
    setCalculating(false);
  };

  const myRank = leaderboard.findIndex(e => e.user_id === user?.id) + 1;

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="p-4 space-y-5">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" /> Power Score
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">Seu rating dinâmico de força</p>
      </motion.div>

      {/* Score Display */}
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-primary/15 via-card to-card rounded-2xl border border-primary/20 p-6 text-center">
        <div className="relative inline-flex items-center justify-center w-28 h-28 mb-3">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--secondary))" strokeWidth="6" />
            <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--primary))" strokeWidth="6"
              strokeDasharray={`${(myScore?.power_score || 0) / 100 * 264} 264`}
              strokeLinecap="round" className="transition-all duration-1000" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-extrabold text-foreground">{myScore?.power_score || 0}</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Score</span>
          </div>
        </div>
        {myRank > 0 && (
          <p className="text-sm text-primary font-medium">🏅 Rank #{myRank} Global</p>
        )}

        {/* Components */}
        {myScore && (
          <div className="grid grid-cols-2 gap-2 mt-4">
            {[
              { label: 'DOTS (40%)', val: myScore.dots, icon: '💪' },
              { label: 'PRs (20%)', val: myScore.pr_freq, icon: '🏆' },
              { label: 'Consistência (20%)', val: myScore.consistency, icon: '📅' },
              { label: 'Volume (20%)', val: myScore.volume, icon: '📊' },
            ].map(c => (
              <div key={c.label} className="p-2.5 rounded-xl bg-background/50 text-center">
                <p className="text-lg mb-0.5">{c.icon}</p>
                <p className="text-lg font-extrabold text-foreground">{c.val}</p>
                <p className="text-[10px] text-muted-foreground">{c.label}</p>
              </div>
            ))}
          </div>
        )}

        <button onClick={calculateScore} disabled={calculating}
          className="mt-4 w-full bg-primary text-primary-foreground py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">
          {calculating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Recalcular Power Score
        </button>
      </motion.div>

      {/* Leaderboard */}
      {leaderboard.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <Crown className="w-4 h-4 text-yellow-400" /> Ranking Power Score
          </h3>
          <div className="rounded-2xl bg-card border border-border overflow-hidden divide-y divide-border">
            {leaderboard.slice(0, 20).map((entry, i) => (
              <div key={entry.user_id} className={cn("flex items-center gap-3 px-4 py-3", i < 3 && "bg-primary/5")}>
                <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                  i === 0 ? "bg-yellow-500/20 text-yellow-400" :
                  i === 1 ? "bg-gray-400/20 text-gray-400" :
                  i === 2 ? "bg-amber-700/20 text-amber-600" :
                  "bg-secondary text-muted-foreground"
                )}>{i + 1}</div>
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                  {entry.avatar_url ? <img src={entry.avatar_url} className="w-full h-full object-cover" /> : <User className="w-4 h-4 text-primary" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{entry.display_name}</p>
                </div>
                <div className="flex items-center gap-1 text-primary font-extrabold text-sm">
                  <Zap className="w-3.5 h-3.5" /> {entry.power_score}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
