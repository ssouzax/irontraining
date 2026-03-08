import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Trophy, Crown, Shield, Gem, Star, Zap, Medal, Loader2, RefreshCw, Users, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTraining } from '@/contexts/TrainingContext';
import { calculate1RM } from '@/data/defaultProfile';
import { usePlayerLevel } from '@/hooks/usePlayerLevel';
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

interface PlayerLevelEntry {
  user_id: string;
  player_level: number;
  total_xp: number;
  lifetime_xp: number;
  title: string | null;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  gym_class: string | null;
}

const LEVEL_BADGE_COLORS: Record<string, { bg: string; text: string }> = {
  'Novato': { bg: 'bg-secondary', text: 'text-muted-foreground' },
  'Iniciante': { bg: 'bg-secondary', text: 'text-muted-foreground' },
  'Levantador Dedicado': { bg: 'bg-amber-700/20', text: 'text-amber-600' },
  'Atleta de Ferro': { bg: 'bg-gray-400/20', text: 'text-gray-400' },
  'Guerreiro da Força': { bg: 'bg-blue-500/20', text: 'text-blue-400' },
  'Levantador Elite': { bg: 'bg-purple-500/20', text: 'text-purple-400' },
  'Lenda de Ferro': { bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
  'Titã da Força': { bg: 'bg-primary/20', text: 'text-primary' },
  'Atleta Lendário': { bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
};

const GYM_CLASS_ICONS: Record<string, string> = {
  powerlifter: '🏋️', bodybuilder: '💪', powerbuilder: '⚡', hybrid: '🔥', strength: '🎯',
};

type Tab = 'dots' | 'level';

export default function LeaderboardPage() {
  const { user } = useAuth();
  const { profile } = useTraining();
  const { playerLevel } = usePlayerLevel();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [levelEntries, setLevelEntries] = useState<PlayerLevelEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedClass, setSelectedClass] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [tab, setTab] = useState<Tab>('dots');

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

  useEffect(() => {
    if (tab === 'dots') loadLeaderboard();
    else loadLevelLeaderboard();
  }, [selectedClass, tab]);

  const loadLeaderboard = async () => {
    setLoading(true);
    const wc = WEIGHT_CLASSES[selectedClass];
    const { data } = await supabase.rpc('get_dots_leaderboard', { min_bw: wc.min, max_bw: wc.max });
    if (data) setEntries(data as LeaderboardEntry[]);
    setLoading(false);
  };

  const loadLevelLeaderboard = async () => {
    setLoading(true);
    const { data: levelsData } = await supabase
      .from('player_levels')
      .select('user_id, player_level, total_xp, lifetime_xp, title')
      .order('lifetime_xp', { ascending: false })
      .limit(100);

    if (levelsData && levelsData.length > 0) {
      const userIds = levelsData.map(l => l.user_id);
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, display_name, username, avatar_url, gym_class')
        .in('user_id', userIds);

      const profileMap = new Map((profilesData || []).map(p => [p.user_id, p]));

      const combined: PlayerLevelEntry[] = levelsData.map(l => {
        const p = profileMap.get(l.user_id);
        return {
          ...l,
          display_name: p?.display_name || null,
          username: p?.username || null,
          avatar_url: p?.avatar_url || null,
          gym_class: (p as any)?.gym_class || null,
        };
      });
      setLevelEntries(combined);
    } else {
      setLevelEntries([]);
    }
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

    if (error) toast.error('Erro ao sincronizar');
    else { toast.success('Score atualizado!'); loadLeaderboard(); }
    setSyncing(false);
  };

  const myLeague = getLeagueInfo(getLeagueFromPoints(Math.round(myDots)));
  const MyIcon = myLeague.icon;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Leaderboard</h1>
        <p className="text-muted-foreground mt-1">Rankings globais de força e nível</p>
      </motion.div>

      {/* Tab Toggle */}
      <div className="flex gap-1 bg-secondary/50 rounded-xl p-1">
        <button onClick={() => setTab('dots')}
          className={cn("flex-1 py-2.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5",
            tab === 'dots' ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          )}>
          <Trophy className="w-3.5 h-3.5" /> Ranking DOTS
        </button>
        <button onClick={() => setTab('level')}
          className={cn("flex-1 py-2.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5",
            tab === 'level' ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          )}>
          <TrendingUp className="w-3.5 h-3.5" /> Ranking de Nível
        </button>
      </div>

      {tab === 'dots' ? (
        <>
          {/* My Stats */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl border border-border p-5 card-elevated">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <MyIcon className={cn("w-5 h-5", myLeague.color)} /> {myLeague.label}
              </h3>
              <button onClick={syncMyScore} disabled={syncing}
                className="text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 flex items-center gap-1">
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
              <button key={i} onClick={() => setSelectedClass(i)}
                className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                  selectedClass === i ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                )}>{wc.label}</button>
            ))}
          </div>

          {/* DOTS Leaderboard */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl border border-border card-elevated overflow-hidden">
            <div className="p-4 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Crown className="w-4 h-4 text-yellow-400" /> Ranking Global por DOTS
              </h3>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
            ) : entries.length === 0 ? (
              <div className="p-8 text-center"><p className="text-sm text-muted-foreground">Nenhum atleta registrado ainda.</p></div>
            ) : (
              <div className="divide-y divide-border">
                {entries.map((entry, i) => {
                  const league = getLeagueInfo(entry.league || 'bronze_3');
                  const Icon = league.icon;
                  return (
                    <div key={i} className={cn("flex items-center gap-3 px-4 py-3", i < 3 && "bg-primary/5")}>
                      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                        i === 0 ? "bg-yellow-500/20 text-yellow-400" :
                        i === 1 ? "bg-gray-400/20 text-gray-400" :
                        i === 2 ? "bg-amber-700/20 text-amber-600" :
                        "bg-secondary text-muted-foreground"
                      )}>{i + 1}</div>
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
        </>
      ) : (
        <>
          {/* My Level Card */}
          {playerLevel && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-primary/10 via-card to-card rounded-xl border border-primary/20 p-5 card-elevated">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center">
                  <span className="text-2xl font-extrabold text-primary">{playerLevel.player_level}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-foreground">{playerLevel.title}</p>
                  <p className="text-xs text-muted-foreground">Nível {playerLevel.player_level} • {playerLevel.lifetime_xp.toLocaleString()} XP total</p>
                  <div className="mt-2">
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <motion.div className="h-full bg-primary rounded-full"
                        animate={{ width: `${(playerLevel.xp_in_level / playerLevel.xp_needed) * 100}%` }}
                        transition={{ duration: 0.5 }} />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {playerLevel.xp_in_level} / {playerLevel.xp_needed} XP para próximo nível
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Level Leaderboard */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl border border-border card-elevated overflow-hidden">
            <div className="p-4 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" /> Ranking Global por Nível
              </h3>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
            ) : levelEntries.length === 0 ? (
              <div className="p-8 text-center"><p className="text-sm text-muted-foreground">Nenhum jogador registrado ainda.</p></div>
            ) : (
              <div className="divide-y divide-border">
                {levelEntries.map((entry, i) => {
                  const badgeStyle = LEVEL_BADGE_COLORS[entry.title || 'Novato'] || LEVEL_BADGE_COLORS['Novato'];
                  const isMe = user?.id === entry.user_id;
                  return (
                    <div key={entry.user_id} className={cn("flex items-center gap-3 px-4 py-3",
                      i < 3 && "bg-primary/5",
                      isMe && "bg-primary/10 border-l-2 border-primary"
                    )}>
                      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                        i === 0 ? "bg-yellow-500/20 text-yellow-400" :
                        i === 1 ? "bg-gray-400/20 text-gray-400" :
                        i === 2 ? "bg-amber-700/20 text-amber-600" :
                        "bg-secondary text-muted-foreground"
                      )}>{i + 1}</div>

                      {/* Avatar */}
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0 overflow-hidden">
                        {entry.avatar_url ? (
                          <img src={entry.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs text-muted-foreground font-medium">
                            {(entry.display_name || entry.username || '?')[0].toUpperCase()}
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-medium text-foreground truncate">
                            {entry.display_name || entry.username || 'Atleta'}
                          </p>
                          {entry.gym_class && (
                            <span className="text-xs">{GYM_CLASS_ICONS[entry.gym_class] || ''}</span>
                          )}
                          {isMe && <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-medium">Você</span>}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium", badgeStyle.bg, badgeStyle.text)}>
                            {entry.title || 'Novato'}
                          </span>
                          <span className="text-xs text-muted-foreground">{entry.lifetime_xp.toLocaleString()} XP</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-lg font-bold text-primary">{entry.player_level}</p>
                        <p className="text-[10px] text-muted-foreground">Nível</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </>
      )}

      {/* League Tiers (only for DOTS tab) */}
      {tab === 'dots' && (
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
      )}
    </div>
  );
}
