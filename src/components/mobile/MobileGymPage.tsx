import { useState, useEffect } from 'react';
import { MapPin, Search, Plus, Trophy, Users, Loader2, Crown, Star, CheckCircle, LogOut as LeaveIcon, Building, Clock, Flame, Zap, Calendar, TrendingUp, Award, Swords } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTraining } from '@/contexts/TrainingContext';
import { calculate1RM } from '@/data/defaultProfile';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { useGymWeeklyChallenge } from '@/hooks/useGymWeeklyChallenge';
import { useCheckinAchievements } from '@/hooks/useCheckinAchievements';

interface Gym {
  id: string;
  name: string;
  city: string | null;
  country: string | null;
  verified: boolean;
  member_count?: number;
}

interface GymLeaderboardEntry {
  user_id: string;
  display_name: string;
  username: string | null;
  avatar_url: string | null;
  exercise_type: string;
  weight_lifted: number;
  bodyweight: number;
  relative_strength: number;
  estimated_1rm: number;
  dots_score: number;
}

interface DailyPR {
  id: string;
  user_id: string;
  exercise_name: string;
  weight: number;
  reps: number;
  estimated_1rm: number;
  recorded_at: string;
  display_name?: string;
  avatar_url?: string;
}

interface CheckinInfo {
  total_checkins: number;
  streak: number;
  last_checkin: string | null;
  can_checkin: boolean;
  today_count: number;
}

type ExerciseTab = 'squat' | 'bench' | 'deadlift' | 'total';
type ViewTab = 'ranking' | 'prs' | 'checkins' | 'challenge';

const EXERCISE_OPTIONS = [
  { key: 'squat', label: 'Agachamento', emoji: '🦵' },
  { key: 'bench', label: 'Supino', emoji: '💪' },
  { key: 'deadlift', label: 'Terra', emoji: '🏋️' },
  { key: 'total', label: 'Total', emoji: '⚡' },
];

export function MobileGymPage() {
  const { user } = useAuth();
  const { profile } = useTraining();
  const [myGym, setMyGym] = useState<Gym | null>(null);
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<GymLeaderboardEntry[]>([]);
  const [leaderboardTab, setLeaderboardTab] = useState<ExerciseTab>('squat');
  const [showCreate, setShowCreate] = useState(false);
  const [newGymName, setNewGymName] = useState('');
  const [newGymCity, setNewGymCity] = useState('');
  const [creating, setCreating] = useState(false);
  const [memberCount, setMemberCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [viewTab, setViewTab] = useState<ViewTab>('ranking');
  const [dailyPRs, setDailyPRs] = useState<DailyPR[]>([]);
  const [checkinInfo, setCheckinInfo] = useState<CheckinInfo>({ total_checkins: 0, streak: 0, last_checkin: null, can_checkin: true, today_count: 0 });
  const [checkinLoading, setCheckinLoading] = useState(false);
  const [topCheckinUsers, setTopCheckinUsers] = useState<{ display_name: string; avatar_url: string | null; count: number }[]>([]);
  const [prExerciseFilter, setPrExerciseFilter] = useState<string>('all');

  const { rankings: challengeRankings, myGymRank, loading: challengeLoading, weekLabel } = useGymWeeklyChallenge(myGym?.id || null);
  const { checkAndUnlock } = useCheckinAchievements();

  const squat1RM = calculate1RM(profile.currentLifts.squat.weight, profile.currentLifts.squat.reps);
  const bench1RM = calculate1RM(profile.currentLifts.bench.weight, profile.currentLifts.bench.reps);
  const deadlift1RM = calculate1RM(profile.currentLifts.deadlift.weight, profile.currentLifts.deadlift.reps);
  const total = squat1RM + bench1RM + deadlift1RM;

  const calcDots = (t: number, bw: number) => {
    if (bw <= 0 || t <= 0) return 0;
    const a = -307.75076, b = 24.0900756, c = -0.1918759221, d = 0.0007391293, e = -0.000001093;
    return Math.round(t * (500 / (a + b * bw + c * bw ** 2 + d * bw ** 3 + e * bw ** 4)) * 100) / 100;
  };

  useEffect(() => { loadMyGym(); }, [user]);

  useEffect(() => {
    if (myGym && viewTab === 'prs') loadDailyPRs(myGym.id);
    if (myGym && viewTab === 'checkins') { loadCheckinInfo(); loadTopCheckins(myGym.id); }
  }, [myGym, viewTab]);

  const loadMyGym = async () => {
    if (!user) return;
    setLoading(true);
    const { data: profileData } = await supabase.from('profiles').select('gym_id').eq('user_id', user.id).single();
    if (profileData?.gym_id) {
      const { data: gymData } = await supabase.from('gyms').select('*').eq('id', profileData.gym_id).single();
      if (gymData) {
        setMyGym(gymData as Gym);
        const { count } = await supabase.from('gym_members').select('id', { count: 'exact' }).eq('gym_id', gymData.id);
        setMemberCount(count || 0);
        loadLeaderboard(gymData.id, leaderboardTab);
        loadCheckinInfo();
      }
    }
    setLoading(false);
  };

  const loadDailyPRs = async (gymId: string) => {
    // Get members of gym
    const { data: members } = await supabase.from('gym_members').select('user_id').eq('gym_id', gymId);
    if (!members || members.length === 0) { setDailyPRs([]); return; }
    const memberIds = members.map(m => m.user_id);

    // Get today's PRs from personal_records
    const today = new Date().toISOString().split('T')[0];
    let query = supabase.from('personal_records')
      .select('*')
      .in('user_id', memberIds)
      .gte('recorded_at', `${today}T00:00:00`)
      .order('estimated_1rm', { ascending: false });

    if (prExerciseFilter !== 'all') {
      const exerciseMap: Record<string, string[]> = {
        squat: ['squat', 'agachamento', 'back squat', 'front squat'],
        bench: ['bench', 'supino', 'bench press'],
        deadlift: ['deadlift', 'terra', 'levantamento terra'],
      };
      const keywords = exerciseMap[prExerciseFilter] || [prExerciseFilter];
      // Filter by exercise name containing keyword
      query = query.or(keywords.map(k => `exercise_name.ilike.%${k}%`).join(','));
    }

    const { data: prs } = await query.limit(30);
    if (!prs || prs.length === 0) { setDailyPRs([]); return; }

    // Get profiles for display names
    const prUserIds = [...new Set(prs.map(p => p.user_id))];
    const { data: profiles } = await supabase.from('profiles').select('user_id, display_name, avatar_url').in('user_id', prUserIds);
    const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));

    setDailyPRs(prs.map(pr => ({
      ...pr,
      display_name: profileMap.get(pr.user_id)?.display_name || 'Atleta',
      avatar_url: profileMap.get(pr.user_id)?.avatar_url || null,
    })));
  };

  const loadCheckinInfo = async () => {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];

    // Today's checkin count
    const { data: todayCheckins } = await supabase
      .from('gym_checkins')
      .select('id')
      .eq('user_id', user.id)
      .gte('checked_in_at', `${today}T00:00:00`)
      .lte('checked_in_at', `${today}T23:59:59`);

    // Total checkins
    const { count: totalCount } = await supabase
      .from('gym_checkins')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id);

    // Last checkin streak
    const { data: lastCheckins } = await supabase
      .from('gym_checkins')
      .select('streak_day, checked_in_at')
      .eq('user_id', user.id)
      .order('checked_in_at', { ascending: false })
      .limit(1);

    setCheckinInfo({
      total_checkins: totalCount || 0,
      streak: lastCheckins?.[0]?.streak_day || 0,
      last_checkin: lastCheckins?.[0]?.checked_in_at || null,
      can_checkin: !todayCheckins || todayCheckins.length === 0,
      today_count: todayCheckins?.length || 0,
    });
  };

  const loadTopCheckins = async (gymId: string) => {
    // Get checkin counts per user for this gym (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
    const { data: checkins } = await supabase
      .from('gym_checkins')
      .select('user_id')
      .eq('gym_id', gymId)
      .gte('checked_in_at', thirtyDaysAgo);

    if (!checkins || checkins.length === 0) { setTopCheckinUsers([]); return; }

    // Count per user
    const counts = new Map<string, number>();
    checkins.forEach(c => counts.set(c.user_id, (counts.get(c.user_id) || 0) + 1));
    const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);

    // Get profiles
    const userIds = sorted.map(s => s[0]);
    const { data: profiles } = await supabase.from('profiles').select('user_id, display_name, avatar_url').in('user_id', userIds);
    const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));

    setTopCheckinUsers(sorted.map(([uid, count]) => ({
      display_name: profileMap.get(uid)?.display_name || 'Atleta',
      avatar_url: profileMap.get(uid)?.avatar_url || null,
      count,
    })));
  };

  const handleCheckin = async () => {
    if (!user || !myGym) return;
    setCheckinLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data: existing } = await supabase
        .from('gym_checkins')
        .select('id')
        .eq('user_id', user.id)
        .gte('checked_in_at', `${today}T00:00:00`)
        .lte('checked_in_at', `${today}T23:59:59`);

      if (existing && existing.length > 0) {
        toast.info('Você já fez check-in hoje! 💪');
        setCheckinLoading(false);
        return;
      }

      // Calculate streak
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      const { data: yesterdayCheckin } = await supabase
        .from('gym_checkins')
        .select('streak_day')
        .eq('user_id', user.id)
        .gte('checked_in_at', `${yesterday}T00:00:00`)
        .lte('checked_in_at', `${yesterday}T23:59:59`)
        .order('checked_in_at', { ascending: false })
        .limit(1);

      const streakDay = (yesterdayCheckin && yesterdayCheckin.length > 0)
        ? (yesterdayCheckin[0].streak_day + 1)
        : 1;

      const baseXp = 15;
      const streakBonus = Math.min(streakDay * 2, 30);
      const totalXp = baseXp + streakBonus;

      await supabase.from('gym_checkins').insert({
        user_id: user.id,
        gym_id: myGym.id,
        xp_awarded: totalXp,
        streak_day: streakDay,
      });

      // Award XP
      const { data: playerLevel } = await supabase.from('player_levels').select('*').eq('user_id', user.id).single();
      if (playerLevel) {
        await supabase.from('player_levels').update({
          total_xp: playerLevel.total_xp + totalXp,
          lifetime_xp: playerLevel.lifetime_xp + totalXp,
          daily_xp: playerLevel.daily_xp + totalXp,
        }).eq('user_id', user.id);
      }

      // Gym points
      await supabase.from('gym_points_log').insert({
        user_id: user.id,
        gym_id: myGym.id,
        points: 5,
        reason: 'checkin',
      });

      toast.success(`Check-in! +${totalXp} XP 🔥 (Streak: ${streakDay} dias)`);
      loadCheckinInfo();
      loadTopCheckins(myGym.id);
    } catch (e) {
      console.error(e);
      toast.error('Erro ao fazer check-in');
    }
    setCheckinLoading(false);
  };

  const searchGyms = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) { setGyms([]); return; }
    const { data } = await supabase.from('gyms').select('*').ilike('name', `%${query}%`).limit(20);
    if (data) {
      const enriched = await Promise.all(data.map(async (g) => {
        const { count } = await supabase.from('gym_members').select('id', { count: 'exact' }).eq('gym_id', g.id);
        return { ...g, member_count: count || 0 } as Gym;
      }));
      setGyms(enriched);
    }
  };

  const joinGym = async (gym: Gym) => {
    if (!user) return;
    if (myGym) {
      await supabase.from('gym_members').delete().eq('user_id', user.id).eq('gym_id', myGym.id);
    }
    await supabase.from('gym_members').insert({ user_id: user.id, gym_id: gym.id });
    await supabase.from('profiles').update({ gym_id: gym.id }).eq('user_id', user.id);
    setMyGym(gym);
    setSearchQuery('');
    setGyms([]);
    toast.success(`Entrou na ${gym.name}!`);
    const { count } = await supabase.from('gym_members').select('id', { count: 'exact' }).eq('gym_id', gym.id);
    setMemberCount(count || 0);
    loadLeaderboard(gym.id, leaderboardTab);
  };

  const leaveGym = async () => {
    if (!user || !myGym) return;
    await supabase.from('gym_members').delete().eq('user_id', user.id).eq('gym_id', myGym.id);
    await supabase.from('profiles').update({ gym_id: null }).eq('user_id', user.id);
    await supabase.from('gym_leaderboards').delete().eq('user_id', user.id).eq('gym_id', myGym.id);
    setMyGym(null);
    setLeaderboard([]);
    toast.success('Saiu da academia');
  };

  const createGym = async () => {
    if (!user || !newGymName.trim()) return;
    setCreating(true);
    const { data, error } = await supabase.from('gyms').insert({
      name: newGymName.trim(),
      city: newGymCity.trim() || null,
      created_by: user.id,
    }).select().single();
    if (data && !error) {
      await joinGym(data as Gym);
      setShowCreate(false);
      setNewGymName('');
      setNewGymCity('');
    }
    setCreating(false);
  };

  const loadLeaderboard = async (gymId: string, exercise: ExerciseTab) => {
    const { data } = await supabase.rpc('get_gym_leaderboard', {
      target_gym_id: gymId,
      target_exercise: exercise,
    });
    if (data) setLeaderboard(data as GymLeaderboardEntry[]);
  };

  const syncMyStats = async () => {
    if (!user || !myGym) return;
    setSyncing(true);
    const dots = calcDots(total, profile.bodyWeight);
    const exercises = [
      { type: 'squat', weight: squat1RM, e1rm: squat1RM },
      { type: 'bench', weight: bench1RM, e1rm: bench1RM },
      { type: 'deadlift', weight: deadlift1RM, e1rm: deadlift1RM },
      { type: 'total', weight: total, e1rm: total },
    ];
    for (const ex of exercises) {
      await supabase.from('gym_leaderboards').upsert({
        gym_id: myGym.id,
        user_id: user.id,
        exercise_type: ex.type,
        weight_lifted: ex.weight,
        bodyweight: profile.bodyWeight,
        estimated_1rm: ex.e1rm,
        dots_score: dots,
      }, { onConflict: 'gym_id,user_id,exercise_type' });
    }
    toast.success('Stats sincronizados!');
    loadLeaderboard(myGym.id, leaderboardTab);
    setSyncing(false);
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="p-4 space-y-5 pb-28">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Building className="w-5 h-5 text-primary" /> Minha Academia
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">Compete com atletas da sua academia</p>
      </motion.div>

      {/* Current Gym Card */}
      {myGym ? (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-gradient-to-br from-primary/15 via-card to-card border border-primary/20 p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-foreground">{myGym.name}</span>
                {myGym.verified && <CheckCircle className="w-4 h-4 text-primary" />}
              </div>
              {myGym.city && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3" /> {myGym.city}{myGym.country ? `, ${myGym.country}` : ''}
                </p>
              )}
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <Users className="w-3 h-3" /> {memberCount} membros
              </p>
            </div>
            <button onClick={leaveGym} className="text-[11px] px-3 py-1.5 rounded-full border border-border text-muted-foreground flex items-center gap-1">
              <LeaveIcon className="w-3 h-3" /> Sair
            </button>
          </div>

          {/* My stats */}
          <div className="grid grid-cols-4 gap-2 mt-4">
            {[
              { label: 'SQT', val: `${squat1RM}`, sub: `${profile.bodyWeight > 0 ? (squat1RM / profile.bodyWeight).toFixed(1) : '—'}x` },
              { label: 'BNC', val: `${bench1RM}`, sub: `${profile.bodyWeight > 0 ? (bench1RM / profile.bodyWeight).toFixed(1) : '—'}x` },
              { label: 'DL', val: `${deadlift1RM}`, sub: `${profile.bodyWeight > 0 ? (deadlift1RM / profile.bodyWeight).toFixed(1) : '—'}x` },
              { label: 'Total', val: `${total}`, sub: `${calcDots(total, profile.bodyWeight)} DOTS` },
            ].map(s => (
              <div key={s.label} className="text-center p-2 rounded-xl bg-background/50">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
                <p className="text-lg font-extrabold text-foreground">{s.val}</p>
                <p className="text-[10px] text-primary font-medium">{s.sub}</p>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 mt-3">
            <button onClick={syncMyStats} disabled={syncing}
              className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">
              {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trophy className="w-4 h-4" />}
              Sincronizar
            </button>
            <button onClick={handleCheckin} disabled={checkinLoading || !checkinInfo.can_checkin}
              className={cn(
                "flex-1 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all",
                checkinInfo.can_checkin
                  ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/20 active:scale-[0.98]"
                  : "bg-secondary text-muted-foreground"
              )}>
              {checkinLoading ? <Loader2 className="w-4 h-4 animate-spin" /> :
                checkinInfo.can_checkin ? <><Clock className="w-4 h-4" /> Check-in</> :
                <><CheckCircle className="w-4 h-4" /> Feito ✓</>}
            </button>
          </div>

          {/* Checkin streak info */}
          {checkinInfo.total_checkins > 0 && (
            <div className="flex items-center gap-3 mt-3 px-1">
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Flame className="w-3 h-3 text-orange-400" /> Streak: <strong className="text-foreground">{checkinInfo.streak} dias</strong>
              </span>
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Total: <strong className="text-foreground">{checkinInfo.total_checkins}</strong>
              </span>
            </div>
          )}
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-card border border-border p-6 text-center">
          <Building className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-4">Selecione sua academia para competir com outros atletas</p>
        </motion.div>
      )}

      {/* Search / Join Gym */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={searchQuery} onChange={e => searchGyms(e.target.value)}
            placeholder="Buscar academia..."
            className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
        </div>

        {gyms.length > 0 && (
          <div className="space-y-2">
            {gyms.map(gym => (
              <div key={gym.id} className="flex items-center justify-between p-3 bg-card rounded-xl border border-border">
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-foreground">{gym.name}</p>
                    {gym.verified && <CheckCircle className="w-3.5 h-3.5 text-primary" />}
                  </div>
                  <p className="text-[11px] text-muted-foreground">{gym.city || 'Local não especificado'} · {gym.member_count} membros</p>
                </div>
                <button onClick={() => joinGym(gym)}
                  className="text-xs px-3 py-1.5 rounded-full bg-primary text-primary-foreground font-medium">Entrar</button>
              </div>
            ))}
          </div>
        )}

        {searchQuery.length >= 2 && gyms.length === 0 && (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-3">Nenhuma academia encontrada</p>
            <button onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium">
              <Plus className="w-4 h-4" /> Criar Academia
            </button>
          </div>
        )}

        {!myGym && searchQuery.length < 2 && (
          <button onClick={() => setShowCreate(true)}
            className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors">
            <Plus className="w-4 h-4" /> Criar nova academia
          </button>
        )}
      </div>

      {/* Create Gym Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end justify-center"
            onClick={() => setShowCreate(false)}>
            <motion.div initial={{ y: 300 }} animate={{ y: 0 }} exit={{ y: 300 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md bg-card border-t border-border rounded-t-2xl p-5 space-y-4">
              <h3 className="text-lg font-bold text-foreground">Criar Academia</h3>
              <input value={newGymName} onChange={e => setNewGymName(e.target.value)}
                placeholder="Nome da academia"
                className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
              <input value={newGymCity} onChange={e => setNewGymCity(e.target.value)}
                placeholder="Cidade (opcional)"
                className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
              <button onClick={createGym} disabled={creating || !newGymName.trim()}
                className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-medium text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Criar e Entrar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Tabs: Ranking / PRs / Check-ins */}
      {myGym && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          <div className="flex gap-1 bg-secondary/50 rounded-xl p-1">
            {([
              { key: 'ranking' as ViewTab, label: 'Ranking', icon: Crown },
              { key: 'prs' as ViewTab, label: 'PRs do Dia', icon: TrendingUp },
              { key: 'checkins' as ViewTab, label: 'Frequência', icon: Calendar },
            ]).map(tab => (
              <button key={tab.key} onClick={() => setViewTab(tab.key)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold transition-all",
                  viewTab === tab.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                )}>
                <tab.icon className="w-3.5 h-3.5" /> {tab.label}
              </button>
            ))}
          </div>

          {/* ==================== RANKING TAB ==================== */}
          {viewTab === 'ranking' && (
            <>
              <div className="flex gap-1 overflow-x-auto pb-1 -mx-4 px-4">
                {EXERCISE_OPTIONS.map(t => (
                  <button key={t.key} onClick={() => { setLeaderboardTab(t.key as ExerciseTab); loadLeaderboard(myGym.id, t.key as ExerciseTab); }}
                    className={cn("px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap shrink-0 transition-colors",
                      leaderboardTab === t.key ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                    )}>
                    {t.emoji} {t.label}
                  </button>
                ))}
              </div>

              <div className="rounded-2xl bg-card border border-border overflow-hidden">
                {leaderboard.length === 0 ? (
                  <div className="text-center py-12">
                    <Trophy className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Nenhum atleta sincronizou ainda</p>
                    <p className="text-xs text-muted-foreground mt-1">Seja o primeiro!</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {leaderboard.map((entry, i) => (
                      <motion.div key={entry.user_id}
                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                        className={cn("flex items-center gap-3 px-4 py-3", i < 3 && "bg-primary/5")}>
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0",
                          i === 0 ? "bg-yellow-500/20 text-yellow-400" :
                          i === 1 ? "bg-gray-400/20 text-gray-400" :
                          i === 2 ? "bg-amber-700/20 text-amber-600" :
                          "bg-secondary text-muted-foreground"
                        )}>
                          {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                        </div>
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                          {entry.avatar_url ? (
                            <img src={entry.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xs font-bold text-primary">{entry.display_name[0]?.toUpperCase()}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{entry.display_name}</p>
                          <p className="text-[11px] text-muted-foreground">{entry.bodyweight}kg · {entry.dots_score} DOTS</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-base font-extrabold text-primary">{entry.weight_lifted}<span className="text-xs font-medium">kg</span></p>
                          <p className="text-[10px] text-muted-foreground">{entry.relative_strength ? `${entry.relative_strength}x BW` : ''}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ==================== PRs DO DIA TAB ==================== */}
          {viewTab === 'prs' && (
            <>
              <div className="flex gap-1 overflow-x-auto pb-1 -mx-4 px-4">
                {[{ key: 'all', label: 'Todos', emoji: '🔥' }, ...EXERCISE_OPTIONS.filter(e => e.key !== 'total')].map(t => (
                  <button key={t.key} onClick={() => { setPrExerciseFilter(t.key); if (myGym) setTimeout(() => loadDailyPRs(myGym.id), 50); }}
                    className={cn("px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap shrink-0 transition-colors",
                      prExerciseFilter === t.key ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                    )}>
                    {t.emoji} {t.label}
                  </button>
                ))}
              </div>

              <div className="rounded-2xl bg-card border border-border overflow-hidden">
                {dailyPRs.length === 0 ? (
                  <div className="text-center py-12">
                    <TrendingUp className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Nenhum PR registrado hoje</p>
                    <p className="text-xs text-muted-foreground mt-1">Quebre um recorde para aparecer aqui!</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {dailyPRs.map((pr, i) => (
                      <motion.div key={pr.id}
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                        className="flex items-center gap-3 px-4 py-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                          {pr.avatar_url ? (
                            <img src={pr.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xs font-bold text-primary">{(pr.display_name || 'A')[0]?.toUpperCase()}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{pr.display_name}</p>
                          <p className="text-[11px] text-muted-foreground capitalize">{pr.exercise_name}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="flex items-center gap-1">
                            <Award className="w-3 h-3 text-yellow-400" />
                            <p className="text-base font-extrabold text-foreground">{pr.weight}<span className="text-xs font-medium text-muted-foreground">kg</span></p>
                          </div>
                          <p className="text-[10px] text-muted-foreground">{pr.reps > 1 ? `${pr.reps} reps · ` : ''}E1RM {Math.round(pr.estimated_1rm)}kg</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ==================== CHECK-INS / FREQUÊNCIA TAB ==================== */}
          {viewTab === 'checkins' && (
            <>
              {/* My checkin stats */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { icon: Flame, label: 'Streak', val: `${checkinInfo.streak}d`, color: 'text-orange-400' },
                  { icon: Calendar, label: 'Total', val: `${checkinInfo.total_checkins}`, color: 'text-primary' },
                  { icon: Zap, label: 'Hoje', val: checkinInfo.can_checkin ? 'Pendente' : 'Feito ✓', color: checkinInfo.can_checkin ? 'text-muted-foreground' : 'text-green-400' },
                ].map(s => (
                  <div key={s.label} className="text-center p-3 rounded-xl bg-card border border-border">
                    <s.icon className={cn("w-4 h-4 mx-auto mb-1", s.color)} />
                    <p className="text-lg font-extrabold text-foreground">{s.val}</p>
                    <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Top check-in users (30 days) */}
              <div className="rounded-2xl bg-card border border-border overflow-hidden">
                <div className="px-4 py-3 border-b border-border">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                    <Star className="w-3 h-3 text-yellow-400" /> Mais Frequentes (30 dias)
                  </p>
                </div>
                {topCheckinUsers.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Nenhum check-in registrado</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {topCheckinUsers.map((u, i) => (
                      <motion.div key={i}
                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                        className={cn("flex items-center gap-3 px-4 py-3", i < 3 && "bg-primary/5")}>
                        <div className={cn(
                          "w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0",
                          i === 0 ? "bg-yellow-500/20 text-yellow-400" :
                          i === 1 ? "bg-gray-400/20 text-gray-400" :
                          i === 2 ? "bg-amber-700/20 text-amber-600" :
                          "bg-secondary text-muted-foreground"
                        )}>
                          {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                        </div>
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                          {u.avatar_url ? (
                            <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[10px] font-bold text-primary">{u.display_name[0]?.toUpperCase()}</span>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-foreground flex-1 truncate">{u.display_name}</p>
                        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10">
                          <Clock className="w-3 h-3 text-primary" />
                          <span className="text-xs font-bold text-primary">{u.count}x</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </motion.div>
      )}
    </div>
  );
}
