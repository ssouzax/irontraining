import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building, Search, Plus, MapPin, Trophy, Users, Crown, CheckCircle, Loader2, Star, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTraining } from '@/contexts/TrainingContext';
import { calculate1RM } from '@/data/defaultProfile';
import { toast } from 'sonner';

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

export default function GymPage() {
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
      name: newGymName.trim(), city: newGymCity.trim() || null, created_by: user.id,
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
    const { data } = await supabase.rpc('get_gym_leaderboard', { target_gym_id: gymId, target_exercise: exercise });
    if (data) setLeaderboard(data as GymLeaderboardEntry[]);
  };

  const syncMyStats = async () => {
    if (!user || !myGym) return;
    setSyncing(true);
    const dots = calcDots(total, profile.bodyWeight);
    const exercises = [
      { type: 'squat', weight: squat1RM }, { type: 'bench', weight: bench1RM },
      { type: 'deadlift', weight: deadlift1RM }, { type: 'total', weight: total },
    ];
    for (const ex of exercises) {
      await supabase.from('gym_leaderboards').upsert({
        gym_id: myGym.id, user_id: user.id, exercise_type: ex.type,
        weight_lifted: ex.weight, bodyweight: profile.bodyWeight, estimated_1rm: ex.weight, dots_score: dots,
      }, { onConflict: 'gym_id,user_id,exercise_type' });
    }
    toast.success('Stats sincronizados!');
    loadLeaderboard(myGym.id, leaderboardTab);
    setSyncing(false);
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight flex items-center gap-2">
          <Building className="w-6 h-6 text-primary" /> Minha Academia
        </h1>
        <p className="text-muted-foreground mt-1">Compete com atletas da sua academia</p>
      </motion.div>

      {/* Current Gym */}
      {myGym ? (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl border border-border p-5 card-elevated">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-foreground">{myGym.name}</span>
                {myGym.verified && <CheckCircle className="w-5 h-5 text-primary" />}
              </div>
              {myGym.city && (
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5" /> {myGym.city}{myGym.country ? `, ${myGym.country}` : ''}
                </p>
              )}
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <Users className="w-3.5 h-3.5" /> {memberCount} membros
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={syncMyStats} disabled={syncing}
                className="text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground flex items-center gap-1 disabled:opacity-50">
                {syncing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trophy className="w-3 h-3" />}
                Sincronizar
              </button>
              <button onClick={leaveGym}
                className="text-xs px-3 py-1.5 rounded-lg bg-secondary text-muted-foreground flex items-center gap-1 hover:text-destructive">
                <LogOut className="w-3 h-3" /> Sair
              </button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Agachamento', val: squat1RM, rel: profile.bodyWeight > 0 ? (squat1RM / profile.bodyWeight).toFixed(1) : '—' },
              { label: 'Supino', val: bench1RM, rel: profile.bodyWeight > 0 ? (bench1RM / profile.bodyWeight).toFixed(1) : '—' },
              { label: 'Terra', val: deadlift1RM, rel: profile.bodyWeight > 0 ? (deadlift1RM / profile.bodyWeight).toFixed(1) : '—' },
              { label: 'Total', val: total, rel: `${calcDots(total, profile.bodyWeight)} DOTS` },
            ].map(s => (
              <div key={s.label} className="text-center p-3 rounded-lg bg-secondary/40">
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
                <p className="text-xl font-bold text-foreground">{s.val}kg</p>
                <p className="text-[10px] text-primary font-medium">{s.rel}x</p>
              </div>
            ))}
          </div>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl border border-border p-8 card-elevated text-center">
          <Building className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">Selecione sua academia para competir com outros atletas</p>
        </motion.div>
      )}

      {/* Search */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-xl border border-border p-4 card-elevated space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={searchQuery} onChange={e => searchGyms(e.target.value)}
            placeholder="Buscar academia..." className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>

        {gyms.length > 0 && (
          <div className="space-y-2">
            {gyms.map(gym => (
              <div key={gym.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-foreground">{gym.name}</span>
                    {gym.verified && <CheckCircle className="w-3 h-3 text-primary" />}
                  </div>
                  <span className="text-xs text-muted-foreground">{gym.city || '—'} · {gym.member_count} membros</span>
                </div>
                <button onClick={() => joinGym(gym)} className="text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-medium">Entrar</button>
              </div>
            ))}
          </div>
        )}

        <button onClick={() => setShowCreate(true)}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-dashed border-border text-sm text-muted-foreground hover:text-foreground transition-colors">
          <Plus className="w-4 h-4" /> Criar nova academia
        </button>
      </motion.div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowCreate(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="bg-card border border-border rounded-2xl p-6 w-full max-w-md card-elevated space-y-4">
              <h3 className="font-semibold text-foreground text-lg">Criar Academia</h3>
              <input value={newGymName} onChange={e => setNewGymName(e.target.value)} placeholder="Nome da academia"
                className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
              <input value={newGymCity} onChange={e => setNewGymCity(e.target.value)} placeholder="Cidade (opcional)"
                className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
              <button onClick={createGym} disabled={creating || !newGymName.trim()}
                className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium text-sm disabled:opacity-50 flex items-center justify-center gap-2">
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
          <div className="flex flex-wrap gap-1.5">
            {(['squat', 'bench', 'deadlift', 'total'] as ExerciseTab[]).map(t => (
              <button key={t} onClick={() => { setLeaderboardTab(t); loadLeaderboard(myGym.id, t); }}
                className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                  leaderboardTab === t ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                )}>
                {t === 'squat' ? 'Agachamento' : t === 'bench' ? 'Supino' : t === 'deadlift' ? 'Terra' : 'Total'}
              </button>
            ))}
          </div>

          <div className="bg-card rounded-xl border border-border card-elevated overflow-hidden">
            <div className="p-4 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Crown className="w-4 h-4 text-yellow-400" /> Ranking — {myGym.name}
              </h3>
            </div>
            {leaderboard.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-muted-foreground">Nenhum atleta sincronizou ainda. Seja o primeiro!</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {leaderboard.map((entry, i) => (
                  <div key={entry.user_id} className={cn("flex items-center gap-3 px-4 py-3", i < 3 && "bg-primary/5")}>
                    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
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
                      <p className="text-sm font-medium text-foreground truncate">{entry.display_name}</p>
                      <p className="text-xs text-muted-foreground">{entry.bodyweight}kg · {entry.relative_strength}x BW</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-primary">{entry.weight_lifted}kg</p>
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
