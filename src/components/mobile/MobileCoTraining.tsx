import { useState, useEffect } from 'react';
import { Users, Plus, Loader2, Send, Trophy, Dumbbell, UserPlus, X, Activity, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SharedWorkout {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  is_active: boolean;
  created_at: string;
}

interface WorkoutMember {
  user_id: string;
  role: string;
  display_name?: string;
  avatar_url?: string;
}

interface WorkoutActivity {
  id: string;
  user_id: string;
  activity_type: string;
  message: string | null;
  exercise_name: string | null;
  weight: number | null;
  reps: number | null;
  estimated_1rm: number | null;
  created_at: string;
  display_name?: string;
}

export function MobileCoTraining() {
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState<SharedWorkout[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState<string | null>(null);
  const [members, setMembers] = useState<WorkoutMember[]>([]);
  const [activities, setActivities] = useState<WorkoutActivity[]>([]);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [joinId, setJoinId] = useState('');
  const [showJoin, setShowJoin] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => { if (user) loadWorkouts(); }, [user]);

  useEffect(() => {
    if (!selectedWorkout) return;
    loadMembers(selectedWorkout);
    loadActivities(selectedWorkout);

    // Realtime subscription
    const channel = supabase
      .channel(`shared-activity-${selectedWorkout}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'shared_workout_activity',
        filter: `workout_id=eq.${selectedWorkout}`,
      }, () => loadActivities(selectedWorkout))
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedWorkout]);

  const loadWorkouts = async () => {
    if (!user) return;
    // Get workouts where user is member or creator
    const { data: memberOf } = await (supabase as any)
      .from('shared_workout_members')
      .select('workout_id')
      .eq('user_id', user.id);
    
    const workoutIds = ((memberOf as any[]) || []).map(m => m.workout_id);
    
    const { data: created } = await supabase
      .from('shared_workouts')
      .select('*')
      .eq('created_by', user.id);

    const { data: joined } = workoutIds.length > 0 
      ? await supabase.from('shared_workouts').select('*').in('id', workoutIds)
      : { data: [] };

    const all = [...(created || []), ...(joined || [])];
    const unique = Array.from(new Map(all.map(w => [w.id, w])).values());
    setWorkouts(unique as SharedWorkout[]);
    setLoading(false);
  };

  const createWorkout = async () => {
    if (!user || !newName) return;
    setCreating(true);
    const { data, error } = await supabase.from('shared_workouts').insert({
      name: newName,
      description: newDesc || null,
      created_by: user.id,
    }).select().single();

    if (error || !data) { toast.error('Erro ao criar'); setCreating(false); return; }

    // Add creator as member
    await supabase.from('shared_workout_members').insert({
      workout_id: data.id,
      user_id: user.id,
      role: 'owner',
    });

    toast.success('Treino criado!');
    setNewName('');
    setNewDesc('');
    setShowCreate(false);
    setCreating(false);
    loadWorkouts();
  };

  const joinWorkout = async () => {
    if (!user || !joinId.trim()) return;
    const { error } = await supabase.from('shared_workout_members').insert({
      workout_id: joinId.trim(),
      user_id: user.id,
    });
    if (error) toast.error('Erro ao entrar. Verifique o código.');
    else {
      toast.success('Entrou no grupo!');
      setJoinId('');
      setShowJoin(false);
      loadWorkouts();
    }
  };

  const loadMembers = async (workoutId: string) => {
    const { data: membersData } = await supabase
      .from('shared_workout_members')
      .select('user_id, role')
      .eq('workout_id', workoutId);
    
    if (!membersData) return;
    const userIds = membersData.map(m => m.user_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, display_name, avatar_url')
      .in('user_id', userIds);
    
    const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
    setMembers(membersData.map(m => ({
      ...m,
      display_name: profileMap.get(m.user_id)?.display_name || 'Atleta',
      avatar_url: profileMap.get(m.user_id)?.avatar_url || null,
    })));
  };

  const loadActivities = async (workoutId: string) => {
    const { data } = await supabase
      .from('shared_workout_activity')
      .select('*')
      .eq('workout_id', workoutId)
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (!data) return;
    const userIds = [...new Set(data.map(a => a.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, display_name')
      .in('user_id', userIds);
    
    const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
    setActivities(data.map(a => ({
      ...a,
      display_name: profileMap.get(a.user_id)?.display_name || 'Atleta',
    })) as WorkoutActivity[]);
  };

  const sendMessage = async () => {
    if (!user || !selectedWorkout || !message.trim()) return;
    await supabase.from('shared_workout_activity').insert({
      workout_id: selectedWorkout,
      user_id: user.id,
      activity_type: 'message',
      message: message.trim(),
    });
    setMessage('');
  };

  const copyInvite = (id: string) => {
    navigator.clipboard.writeText(id);
    toast.success('Código copiado!');
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  // Detail view
  if (selectedWorkout) {
    const workout = workouts.find(w => w.id === selectedWorkout);
    return (
      <div className="flex flex-col h-[calc(100vh-9rem)]">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <button onClick={() => setSelectedWorkout(null)} className="text-sm text-primary font-medium">← Voltar</button>
            <button onClick={() => copyInvite(selectedWorkout)} className="flex items-center gap-1 text-xs text-muted-foreground">
              <Copy className="w-3 h-3" /> Convidar
            </button>
          </div>
          <h3 className="text-lg font-bold text-foreground mt-2">{workout?.name}</h3>
          {workout?.description && <p className="text-xs text-muted-foreground">{workout.description}</p>}
          
          {/* Members avatars */}
          <div className="flex items-center gap-1 mt-3">
            {members.slice(0, 6).map((m, i) => (
              <div key={m.user_id} className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border-2 border-background -ml-1 first:ml-0">
                {m.avatar_url ? (
                  <img src={m.avatar_url} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span className="text-[10px] font-bold text-primary">{(m.display_name || 'A')[0]}</span>
                )}
              </div>
            ))}
            <span className="text-xs text-muted-foreground ml-2">{members.length} membros</span>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {activities.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Nenhuma atividade ainda</p>
            </div>
          ) : activities.map(act => (
            <motion.div key={act.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className={cn("p-3 rounded-xl",
                act.activity_type === 'message' ? "bg-card border border-border" :
                act.activity_type === 'pr' ? "bg-yellow-500/5 border border-yellow-500/20" :
                "bg-primary/5 border border-primary/20"
              )}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-foreground">{act.display_name}</span>
                <span className="text-[10px] text-muted-foreground">
                  {formatDistanceToNow(new Date(act.created_at), { addSuffix: true, locale: ptBR })}
                </span>
              </div>
              {act.activity_type === 'message' ? (
                <p className="text-sm text-foreground">{act.message}</p>
              ) : (
                <div className="flex items-center gap-2">
                  {act.activity_type === 'pr' && <Trophy className="w-4 h-4 text-yellow-400" />}
                  {act.activity_type === 'workout_log' && <Dumbbell className="w-4 h-4 text-primary" />}
                  <div>
                    {act.exercise_name && <p className="text-sm font-medium text-foreground">{act.exercise_name}</p>}
                    {act.weight && <span className="text-xs text-muted-foreground">{act.weight}kg × {act.reps}</span>}
                    {act.message && <p className="text-xs text-muted-foreground mt-0.5">{act.message}</p>}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Message Input */}
        <div className="p-3 border-t border-border flex gap-2">
          <input value={message} onChange={e => setMessage(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            className="flex-1 px-4 py-2.5 rounded-xl bg-secondary border border-border text-sm text-foreground"
            placeholder="Mensagem para o grupo..." />
          <button onClick={sendMessage} disabled={!message.trim()}
            className="p-2.5 rounded-xl bg-primary text-primary-foreground disabled:opacity-50">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="p-4 space-y-5">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" /> Co-Training
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">Treine com amigos e acompanhe o progresso juntos</p>
      </motion.div>

      <div className="flex gap-2">
        <button onClick={() => setShowCreate(!showCreate)}
          className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium">
          <Plus className="w-4 h-4" /> Criar Grupo
        </button>
        <button onClick={() => setShowJoin(!showJoin)}
          className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-card border border-border text-sm font-medium text-foreground">
          <UserPlus className="w-4 h-4" /> Entrar
        </button>
      </div>

      {/* Create Form */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden">
            <div className="p-4 rounded-2xl bg-card border border-border space-y-3">
              <input value={newName} onChange={e => setNewName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-secondary border border-border text-sm text-foreground"
                placeholder="Nome do grupo" />
              <input value={newDesc} onChange={e => setNewDesc(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-secondary border border-border text-sm text-foreground"
                placeholder="Descrição (opcional)" />
              <button onClick={createWorkout} disabled={creating || !newName}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50">
                {creating ? 'Criando...' : 'Criar'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Join Form */}
      <AnimatePresence>
        {showJoin && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden">
            <div className="p-4 rounded-2xl bg-card border border-border space-y-3">
              <input value={joinId} onChange={e => setJoinId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-secondary border border-border text-sm text-foreground"
                placeholder="Código do grupo" />
              <button onClick={joinWorkout} disabled={!joinId.trim()}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50">
                Entrar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Workouts List */}
      <div className="space-y-3">
        {workouts.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-muted-foreground text-sm">Nenhum grupo ainda.</p>
            <p className="text-muted-foreground text-xs mt-1">Crie ou entre em um grupo de treino</p>
          </div>
        ) : workouts.map((w, i) => (
          <motion.button key={w.id}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            onClick={() => setSelectedWorkout(w.id)}
            className="w-full p-4 rounded-2xl bg-card border border-border text-left hover:border-primary/30 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-foreground">{w.name}</p>
                {w.description && <p className="text-xs text-muted-foreground mt-0.5">{w.description}</p>}
                <p className="text-[10px] text-muted-foreground mt-1">
                  Criado {formatDistanceToNow(new Date(w.created_at), { addSuffix: true, locale: ptBR })}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
