import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Trophy, Crown, Shield, Gem, Star, Zap, Medal, Loader2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTraining } from '@/contexts/TrainingContext';
import { calculate1RM } from '@/data/defaultProfile';
import { toast } from 'sonner';

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

const WEIGHT_CLASSES = [
  { label: 'Todos', min: 0, max: 999 },
  { label: '-66kg', min: 0, max: 66 },
  { label: '-74kg', min: 66, max: 74 },
  { label: '-83kg', min: 74, max: 83 },
  { label: '-93kg', min: 83, max: 93 },
  { label: '-105kg', min: 93, max: 105 },
  { label: '+105kg', min: 105, max: 999 },
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

export default function LeaderboardPage() {
  const { user } = useAuth();
  const { profile } = useTraining();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedClass, setSelectedClass] = useState(0);
  const [syncing, setSyncing] = useState(false);

  const squat1RM = calculate1RM(profile.currentLifts.squat.weight, profile.currentLifts.squat.reps);
  const bench1RM = calculate1RM(profile.currentLifts.bench.weight, profile.currentLifts.bench.reps);
  const deadlift1RM = calculate1RM(profile.currentLifts.deadlift.weight, profile.currentLifts.deadlift.reps);
  const myTotal = squat1RM + bench1RM + deadlift1RM;

  // Simple client-side DOTS approximation (male)
  const calcDots = (total: number, bw: number) => {
    if (bw <= 0 || total <= 0) return 0;
    const a = -307.75076, b = 24.0900756, c = -0.1918759221, d = 0.0007391293, e = -0.000001093;
    const coeff = 500 / (a + b * bw + c * bw ** 2 + d * bw ** 3 + e * bw ** 4);
    return Math.round(total * coeff * 100) / 100;
  };

  const myDots = calcDots(myTotal, profile.bodyWeight);

  useEffect(() => { loadLeaderboard(); }, [selectedClass]);

  const loadLeaderboard = async () => {
    setLoading(true);
    const wc = WEIGHT_CLASSES[selectedClass];
    const { data } = await supabase.rpc('get_dots_leaderboard', {
      min_bw: wc.min,
      max_bw: wc.max,
    });
    if (data) setEntries(data as LeaderboardEntry[]);
    setLoading(false);
  };

  const syncMyScore = async () => {
    if (!user) return;
    setSyncing(true);
    const dots = calcDots(myTotal, profile.bodyWeight);
    const league = getLeagueFromPoints(Math.round(dots));
    
    const { error } = await supabase.from('leaderboard_scores').upsert({
      user_id: user.id,
      squat_pr: squat1RM,
      bench_pr: bench1RM,
      deadlift_pr: deadlift1RM,
      total: myTotal,
      bodyweight: profile.bodyWeight,
      dots_score: dots,
      league,
      league_points: Math.round(dots),
    }, { onConflict: 'user_id' });

    if (error) {
      toast.error('Erro ao sincronizar');
    } else {
      toast.success('Score atualizado!');
      loadLeaderboard();
    }
    setSyncing(false);
  };

  const myLeague = getLeagueInfo(getLeagueFromPoints(Math.round(myDots)));
  const MyIcon = myLeague.icon;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Ranking DOTS</h1>
        <p className="text-muted-foreground mt-1">Ranking por força relativa</p>
      </motion.div>

      {/* My Stats */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-xl border border-border p-5 card-elevated">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <MyIcon className={cn("w-5 h-5", myLeague.color)} />
            {myLeague.label}
          </h3>
          <button
            onClick={syncMyScore}
            disabled={syncing}
            className="text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 flex items-center gap-1"
          >
            {syncing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            Sincronizar
          </button>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Agachamento', val: squat1RM },
            { label: 'Supino', val: bench1RM },
            { label: 'Terra', val: deadlift1RM },
            { label: 'Total', val: myTotal },
          ].map(s => (
            <div key={s.label} className="text-center p-2 rounded-lg bg-secondary/40">
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
              <p className="text-lg font-bold text-foreground">{s.val}<span className="text-xs text-muted-foreground">kg</span></p>
            </div>
          ))}
        </div>

        <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
          <p className="text-xs text-muted-foreground">DOTS Score</p>
          <p className="text-xl font-bold text-primary">{myDots}</p>
        </div>
      </motion.div>

      {/* Filters */}
      <div className="flex flex-wrap gap-1.5">
        {WEIGHT_CLASSES.map((wc, i) => (
          <button
            key={i}
            onClick={() => setSelectedClass(i)}
            className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
              selectedClass === i ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
            )}
          >{wc.label}</button>
        ))}
      </div>

      {/* Leaderboard */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-xl border border-border card-elevated overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Crown className="w-4 h-4 text-yellow-400" />
            Ranking Global por DOTS
          </h3>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        ) : entries.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-muted-foreground">Nenhum atleta registrado ainda. Clique "Sincronizar" para ser o primeiro!</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {entries.map((entry, i) => {
              const league = getLeagueInfo(entry.league || 'bronze_3');
              const Icon = league.icon;
              return (
                <div key={i} className={cn("flex items-center gap-3 px-4 py-3", i < 3 && "bg-primary/5")}>
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                    i === 0 ? "bg-yellow-500/20 text-yellow-400" :
                    i === 1 ? "bg-gray-400/20 text-gray-400" :
                    i === 2 ? "bg-amber-700/20 text-amber-600" :
                    "bg-secondary text-muted-foreground"
                  )}>
                    {i + 1}
                  </div>
                  <Icon className={cn("w-4 h-4 shrink-0", league.color)} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{entry.display_name}</p>
                    <p className="text-xs text-muted-foreground">{entry.bodyweight}kg · Total {entry.total}kg</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-primary">{entry.dots_score}</p>
                    <p className="text-[10px] text-muted-foreground">DOTS</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* League Tiers */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-xl border border-border p-4 card-elevated">
        <h3 className="text-sm font-semibold text-foreground mb-3">Ligas</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {LEAGUES.filter((_, i) => i % 3 === 0 || i >= 12).map(l => {
            const Icon = l.icon;
            return (
              <div key={l.key} className={cn("flex items-center gap-2 p-2 rounded-lg", l.bg)}>
                <Icon className={cn("w-4 h-4", l.color)} />
                <span className="text-xs font-medium text-foreground">{l.label}</span>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
