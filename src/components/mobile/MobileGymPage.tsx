import { useState, useEffect } from 'react';
import { MapPin, Search, Plus, Trophy, Users, Loader2, Crown, Star, CheckCircle, LogOut as LeaveIcon, Building } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTraining } from '@/contexts/TrainingContext';
import { calculate1RM } from '@/data/defaultProfile';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

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

type ExerciseTab = 'squat' | 'bench' | 'deadlift' | 'total';

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
      }
    }
    setLoading(false);
  };

  const searchGyms = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) { setGyms([]); return; }
    const { data } = await supabase.from('gyms').select('*').ilike('name', `%${query}%`).limit(20);
    if (data) {
      // Get member counts
      const gymIds = data.map(g => g.id);
      const enriched = await Promise.all(data.map(async (g) => {
        const { count } = await supabase.from('gym_members').select('id', { count: 'exact' }).eq('gym_id', g.id);
        return { ...g, member_count: count || 0 } as Gym;
      }));
      setGyms(enriched);
    }
  };

  const joinGym = async (gym: Gym) => {
    if (!user) return;
    // Leave current gym first
    if (myGym) {
      await supabase.from('gym_members').delete().eq('user_id', user.id).eq('gym_id', myGym.id);
    }
    // Join new gym
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
    // Clean leaderboard entries
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
    <div className="p-4 space-y-5">
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

          {/* My stats in gym */}
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

          <button onClick={syncMyStats} disabled={syncing}
            className="w-full mt-3 bg-primary text-primary-foreground py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">
            {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trophy className="w-4 h-4" />}
            Sincronizar Ranking
          </button>
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
          <input
            value={searchQuery}
            onChange={e => searchGyms(e.target.value)}
            placeholder="Buscar academia..."
            className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
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
                  <p className="text-[11px] text-muted-foreground">
                    {gym.city || 'Local não especificado'} · {gym.member_count} membros
                  </p>
                </div>
                <button onClick={() => joinGym(gym)}
                  className="text-xs px-3 py-1.5 rounded-full bg-primary text-primary-foreground font-medium">
                  Entrar
                </button>
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
            <motion.div
              initial={{ y: 300 }} animate={{ y: 0 }} exit={{ y: 300 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md bg-card border-t border-border rounded-t-2xl p-5 space-y-4">
              <h3 className="text-lg font-bold text-foreground">Criar Academia</h3>
              <input value={newGymName} onChange={e => setNewGymName(e.target.value)}
                placeholder="Nome da academia" className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
              <input value={newGymCity} onChange={e => setNewGymCity(e.target.value)}
                placeholder="Cidade (opcional)" className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
              <button onClick={createGym} disabled={creating || !newGymName.trim()}
                className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-medium text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Criar e Entrar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gym Leaderboard */}
      {myGym && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <Crown className="w-4 h-4 text-yellow-400" /> Ranking da Academia
          </h3>

          <div className="flex gap-1 overflow-x-auto pb-1 -mx-4 px-4">
            {(['squat', 'bench', 'deadlift', 'total'] as ExerciseTab[]).map(t => (
              <button key={t} onClick={() => { setLeaderboardTab(t); loadLeaderboard(myGym.id, t); }}
                className={cn("px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap shrink-0 transition-colors",
                  leaderboardTab === t ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                )}>
                {t === 'squat' ? 'Agachamento' : t === 'bench' ? 'Supino' : t === 'deadlift' ? 'Terra' : 'Total'}
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
                  <div key={entry.user_id} className={cn("flex items-center gap-3 px-4 py-3", i < 3 && "bg-primary/5")}>
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0",
                      i === 0 ? "bg-yellow-500/20 text-yellow-400" :
                      i === 1 ? "bg-gray-400/20 text-gray-400" :
                      i === 2 ? "bg-amber-700/20 text-amber-600" :
                      "bg-secondary text-muted-foreground"
                    )}>{i + 1}</div>
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                      {entry.avatar_url ? (
                        <img src={entry.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-bold text-primary">{entry.display_name[0]?.toUpperCase()}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{entry.display_name}</p>
                      <p className="text-[11px] text-muted-foreground">{entry.bodyweight}kg PC · {entry.relative_strength}x BW</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-base font-extrabold text-primary">{entry.weight_lifted}<span className="text-xs font-medium">kg</span></p>
                      <p className="text-[10px] text-muted-foreground">E1RM {entry.estimated_1rm}kg</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
