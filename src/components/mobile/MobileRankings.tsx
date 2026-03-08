import { useState, useEffect } from 'react';
import { Trophy, Crown, Shield, Gem, Star, Medal, Loader2, RefreshCw, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTraining } from '@/contexts/TrainingContext';
import { calculate1RM } from '@/data/defaultProfile';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const LEAGUES = [
  { key: 'bronze_3', label: 'Bronze III', icon: Shield, color: 'text-amber-700', bg: 'bg-amber-700/10' },
  { key: 'bronze_2', label: 'Bronze II', icon: Shield, color: 'text-amber-700', bg: 'bg-amber-700/10' },
  { key: 'bronze_1', label: 'Bronze I', icon: Shield, color: 'text-amber-700', bg: 'bg-amber-700/10' },
  { key: 'silver_3', label: 'Prata III', icon: Medal, color: 'text-gray-400', bg: 'bg-gray-400/10' },
  { key: 'silver_2', label: 'Prata II', icon: Medal, color: 'text-gray-400', bg: 'bg-gray-400/10' },
  { key: 'silver_1', label: 'Prata I', icon: Medal, color: 'text-gray-400', bg: 'bg-gray-400/10' },
  { key: 'gold_3', label: 'Ouro III', icon: Trophy, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  { key: 'gold_2', label: 'Ouro II', icon: Trophy, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  { key: 'gold_1', label: 'Ouro I', icon: Trophy, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  { key: 'platinum_3', label: 'Platina III', icon: Gem, color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
  { key: 'platinum_2', label: 'Platina II', icon: Gem, color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
  { key: 'platinum_1', label: 'Platina I', icon: Gem, color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
  { key: 'diamond', label: 'Diamante', icon: Star, color: 'text-blue-400', bg: 'bg-blue-400/10' },
  { key: 'elite', label: 'Elite', icon: Crown, color: 'text-primary', bg: 'bg-primary/10' },
];

function getLeagueInfo(key: string) {
  return LEAGUES.find(l => l.key === key) || LEAGUES[0];
}

function getLeagueFromPoints(points: number): string {
  if (points >= 5000) return 'elite';
  if (points >= 4000) return 'diamond';
  if (points >= 3200) return 'platinum_1';
  if (points >= 2600) return 'platinum_2';
  if (points >= 2000) return 'platinum_3';
  if (points >= 1600) return 'gold_1';
  if (points >= 1200) return 'gold_2';
  if (points >= 900) return 'gold_3';
  if (points >= 650) return 'silver_1';
  if (points >= 400) return 'silver_2';
  if (points >= 200) return 'silver_3';
  if (points >= 100) return 'bronze_1';
  if (points >= 50) return 'bronze_2';
  return 'bronze_3';
}

interface LeaderboardEntry {
  display_name: string;
  username: string | null;
  bodyweight: number;
  squat_pr: number;
  bench_pr: number;
  deadlift_pr: number;
  total: number;
  dots_score: number;
  league: string;
  league_points: number;
}

type RankTab = 'dots' | 'squat' | 'bench' | 'deadlift' | 'total';

export function MobileRankings() {
  const { user } = useAuth();
  const { profile } = useTraining();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [tab, setTab] = useState<RankTab>('dots');

  const squat1RM = calculate1RM(profile.currentLifts.squat.weight, profile.currentLifts.squat.reps);
  const bench1RM = calculate1RM(profile.currentLifts.bench.weight, profile.currentLifts.bench.reps);
  const deadlift1RM = calculate1RM(profile.currentLifts.deadlift.weight, profile.currentLifts.deadlift.reps);
  const myTotal = squat1RM + bench1RM + deadlift1RM;

  const calcDots = (total: number, bw: number) => {
    if (bw <= 0 || total <= 0) return 0;
    const a = -307.75076, b = 24.0900756, c = -0.1918759221, d = 0.0007391293, e = -0.000001093;
    const coeff = 500 / (a + b * bw + c * bw ** 2 + d * bw ** 3 + e * bw ** 4);
    return Math.round(total * coeff * 100) / 100;
  };

  const myDots = calcDots(myTotal, profile.bodyWeight);
  const myLeague = getLeagueInfo(getLeagueFromPoints(Math.round(myDots)));
  const MyIcon = myLeague.icon;

  useEffect(() => { loadLeaderboard(); }, []);

  const loadLeaderboard = async () => {
    setLoading(true);
    const { data } = await supabase.rpc('get_dots_leaderboard', { min_bw: 0, max_bw: 999 });
    if (data) setEntries(data as LeaderboardEntry[]);
    setLoading(false);
  };

  const syncMyScore = async () => {
    if (!user) return;
    setSyncing(true);
    const dots = calcDots(myTotal, profile.bodyWeight);
    const league = getLeagueFromPoints(Math.round(dots));
    await supabase.from('leaderboard_scores').upsert({
      user_id: user.id,
      squat_pr: squat1RM, bench_pr: bench1RM, deadlift_pr: deadlift1RM,
      total: myTotal, bodyweight: profile.bodyWeight,
      dots_score: dots, league, league_points: Math.round(dots),
    }, { onConflict: 'user_id' });
    toast.success('Score atualizado!');
    loadLeaderboard();
    setSyncing(false);
  };

  const sortedEntries = [...entries].sort((a, b) => {
    if (tab === 'squat') return (b.squat_pr || 0) - (a.squat_pr || 0);
    if (tab === 'bench') return (b.bench_pr || 0) - (a.bench_pr || 0);
    if (tab === 'deadlift') return (b.deadlift_pr || 0) - (a.deadlift_pr || 0);
    if (tab === 'total') return (b.total || 0) - (a.total || 0);
    return (b.dots_score || 0) - (a.dots_score || 0);
  });

  const getValueForTab = (entry: LeaderboardEntry) => {
    if (tab === 'squat') return `${entry.squat_pr}kg`;
    if (tab === 'bench') return `${entry.bench_pr}kg`;
    if (tab === 'deadlift') return `${entry.deadlift_pr}kg`;
    if (tab === 'total') return `${entry.total}kg`;
    return `${entry.dots_score}`;
  };

  const getLabel = () => {
    if (tab === 'squat') return 'Agachamento';
    if (tab === 'bench') return 'Supino';
    if (tab === 'deadlift') return 'Terra';
    if (tab === 'total') return 'Total';
    return 'DOTS';
  };

  return (
    <div className="space-y-4 p-4">
      {/* My Stats Card */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-gradient-to-br from-primary/15 via-card to-card border border-primary/20 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MyIcon className={cn("w-5 h-5", myLeague.color)} />
            <span className="text-sm font-bold text-foreground">{myLeague.label}</span>
          </div>
          <button onClick={syncMyScore} disabled={syncing}
            className="text-[11px] px-3 py-1.5 rounded-full bg-primary text-primary-foreground font-medium flex items-center gap-1">
            {syncing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            Sincronizar
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Agachamento', val: squat1RM },
            { label: 'Supino', val: bench1RM },
            { label: 'Terra', val: deadlift1RM },
            { label: 'DOTS', val: myDots },
          ].map(s => (
            <div key={s.label} className="text-center p-2.5 rounded-xl bg-background/50">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
              <p className="text-xl font-extrabold text-foreground mt-0.5">{s.val}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-3 pt-3 border-t border-border/50">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total</p>
          <p className="text-3xl font-extrabold text-foreground">{myTotal}<span className="text-sm font-medium text-muted-foreground ml-0.5">kg</span></p>
        </div>
      </motion.div>

      {/* Tab Filter */}
      <div className="flex gap-1 overflow-x-auto pb-1 -mx-4 px-4">
        {(['dots', 'squat', 'bench', 'deadlift', 'total'] as RankTab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={cn("px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-colors shrink-0",
              tab === t ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
            )}>
            {t === 'dots' ? 'DOTS' : t === 'squat' ? 'Agachamento' : t === 'bench' ? 'Supino' : t === 'deadlift' ? 'Terra' : 'Total'}
          </button>
        ))}
      </div>

      {/* Leaderboard */}
      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <Crown className="w-4 h-4 text-yellow-400" />
          <span className="text-sm font-semibold text-foreground">Ranking — {getLabel()}</span>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        ) : sortedEntries.length === 0 ? (
          <div className="text-center py-16">
            <Flame className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Nenhum atleta registrado</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {sortedEntries.slice(0, 50).map((entry, i) => {
              const league = getLeagueInfo(entry.league || 'bronze_3');
              const Icon = league.icon;
              return (
                <div key={i} className={cn("flex items-center gap-3 px-4 py-3", i < 3 && "bg-primary/5")}>
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0",
                    i === 0 ? "bg-yellow-500/20 text-yellow-400" :
                    i === 1 ? "bg-gray-400/20 text-gray-400" :
                    i === 2 ? "bg-amber-700/20 text-amber-600" :
                    "bg-secondary text-muted-foreground"
                  )}>{i + 1}</div>
                  <Icon className={cn("w-4 h-4 shrink-0", league.color)} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{entry.display_name}</p>
                    <p className="text-[11px] text-muted-foreground">{entry.bodyweight}kg · {league.label}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-base font-extrabold text-primary">{getValueForTab(entry)}</p>
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
