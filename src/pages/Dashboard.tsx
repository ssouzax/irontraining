import { motion } from 'framer-motion';
import { useTraining } from '@/contexts/TrainingContext';
import { useAuth } from '@/contexts/AuthContext';
import { useUserPRs } from '@/hooks/useUserPRs';
import { TrendingUp, Target, Dumbbell, CheckCircle, XCircle, Sparkles, Trophy } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { TodayWorkoutCard } from '@/components/TodayWorkoutCard';
import { MuscleRecoveryMap } from '@/components/MuscleRecoveryMap';
import { StreakCard } from '@/components/dashboard/StreakCard';
import { PlayerLevelCard } from '@/components/dashboard/PlayerLevelCard';
import { WeeklyProgressCard } from '@/components/dashboard/WeeklyProgressCard';

const fadeIn = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4 } };

function StatCard({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string; sub?: string }) {
  return (
    <motion.div {...fadeIn} className="bg-card rounded-xl border border-border p-4 sm:p-5 card-elevated">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs sm:text-sm text-muted-foreground mb-1">{label}</p>
          <p className="text-xl sm:text-2xl font-bold text-foreground">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
        </div>
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center bg-primary/10">
          <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
        </div>
      </div>
    </motion.div>
  );
}

interface Recommendation {
  id: string;
  type: string;
  title: string;
  description: string;
  exercise: string | null;
  status: string;
}

export default function Dashboard() {
  const { program, currentWeek } = useTraining();
  const { user } = useAuth();
  const { prs, total, loading: prsLoading } = useUserPRs();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [analyzing, setAnalyzing] = useState(false);

  const hasPRs = prs.length > 0 && prs.some(p => p.estimated_1rm > 0);
  const hasProgram = program.blocks.length > 0;
  const currentBlock = hasProgram ? (program.blocks.find(b => b.weeks.some(w => w.weekNumber === currentWeek)) || program.blocks[0]) : null;

  useEffect(() => {
    if (!user) return;
    supabase
      .from('ai_recommendations')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data }) => {
        if (data) setRecommendations(data as Recommendation[]);
      });
  }, [user]);

  const handleRecommendation = async (id: string, action: 'accepted' | 'rejected') => {
    await supabase.from('ai_recommendations').update({ status: action }).eq('id', id);
    setRecommendations(prev => prev.filter(r => r.id !== id));
    toast.success(action === 'accepted' ? 'Ajuste aceito!' : 'Recomendação descartada');
  };

  const runAnalysis = async () => {
    setAnalyzing(true);
    try {
      const [analysisRes, progressionRes] = await Promise.allSettled([
        supabase.functions.invoke('analyze-training'),
        supabase.functions.invoke('auto-progression'),
      ]);
      let totalRecs = 0;
      if (analysisRes.status === 'fulfilled' && analysisRes.value.data?.recommendations?.length > 0) totalRecs += analysisRes.value.data.recommendations.length;
      if (progressionRes.status === 'fulfilled' && progressionRes.value.data?.adjustments?.length > 0) totalRecs += progressionRes.value.data.adjustments.length;

      if (totalRecs > 0) {
        const { data: fresh } = await supabase.from('ai_recommendations').select('*').eq('user_id', user!.id).eq('status', 'pending').order('created_at', { ascending: false }).limit(10);
        if (fresh) setRecommendations(fresh as Recommendation[]);
        toast.success(`${totalRecs} novas recomendações geradas!`);
      } else {
        toast.info('Nenhum ajuste necessário no momento.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Falha na análise');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <motion.div {...fadeIn}>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Painel</h1>
        <p className="text-muted-foreground mt-1">
          {hasProgram ? `Semana ${currentWeek} · ${currentBlock?.name}` : 'Bem-vindo ao Iron Training'}
        </p>
      </motion.div>

      {/* Card 1 — Today's Workout (priority) */}
      <TodayWorkoutCard />

      {/* Card 2 & 3 — Streak + Player Level side by side */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StreakCard />
        <PlayerLevelCard />
      </div>

      {/* Card 4 — Weekly Progress */}
      <WeeklyProgressCard />

      {/* Card 5 — Muscle Recovery Map */}
      <MuscleRecoveryMap />

      {/* PR Stats */}
      {!prsLoading && !hasPRs && (
        <motion.div {...fadeIn} className="bg-card rounded-xl border border-border p-6 sm:p-8 card-elevated text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Dumbbell className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Configure seus PRs</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
            Vá ao perfil e adicione seus exercícios de PR personalizados para desbloquear análises de força e rankings.
          </p>
          <Link to="/profile" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium">
            <Target className="w-4 h-4" /> Configurar PRs
          </Link>
        </motion.div>
      )}

      {hasPRs && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {prs.filter(p => p.estimated_1rm > 0).slice(0, 3).map(pr => (
            <StatCard key={pr.id} icon={TrendingUp} label={pr.exercise_name} value={`${pr.estimated_1rm} kg`} sub={`${pr.weight}kg × ${pr.reps}`} />
          ))}
          <StatCard icon={Trophy} label="Total E1RM" value={`${Math.round(total)} kg`} sub={`${prs.filter(p => p.estimated_1rm > 0).length} exercícios`} />
        </div>
      )}

      {/* AI Recommendations */}
      <motion.div {...fadeIn} className="bg-card rounded-xl border border-border p-4 sm:p-6 card-elevated">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Recomendações IA</h3>
          </div>
          <button onClick={runAnalysis} disabled={analyzing}
            className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-lg hover:bg-primary/20 transition-colors disabled:opacity-50 flex items-center gap-1">
            {analyzing ? <div className="w-3 h-3 border border-primary/30 border-t-primary rounded-full animate-spin" /> : <Sparkles className="w-3 h-3" />}
            Analisar Treino
          </button>
        </div>
        {recommendations.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem recomendações pendentes. Clique "Analisar Treino" após registrar seus treinos.</p>
        ) : (
          <div className="space-y-3">
            {recommendations.map(rec => (
              <motion.div key={rec.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                className="flex flex-col sm:flex-row items-start justify-between gap-2 p-3 sm:p-4 rounded-lg bg-secondary/30 border border-border">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-primary/20 text-primary">{rec.type.replace('_', ' ')}</span>
                    {rec.exercise && <span className="text-xs text-muted-foreground">{rec.exercise}</span>}
                  </div>
                  <p className="text-sm font-medium text-foreground">{rec.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{rec.description}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => handleRecommendation(rec.id, 'accepted')} className="p-1.5 rounded-lg bg-success/10 text-success hover:bg-success/20 transition-colors"><CheckCircle className="w-4 h-4" /></button>
                  <button onClick={() => handleRecommendation(rec.id, 'rejected')} className="p-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"><XCircle className="w-4 h-4" /></button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Block Overview */}
      {hasProgram && (
        <motion.div {...fadeIn} className="bg-card rounded-xl border border-border p-4 sm:p-6 card-elevated">
          <h3 className="text-sm font-semibold text-foreground mb-4">Blocos do Programa</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {program.blocks.map(block => (
              <div key={block.id} className={`p-3 sm:p-4 rounded-lg border transition-all ${block === currentBlock ? 'border-primary bg-primary/5' : 'border-border bg-secondary/30'}`}>
                <p className="text-xs text-muted-foreground">{block.weekRange}</p>
                <p className="text-xs sm:text-sm font-medium text-foreground mt-1">{block.name}</p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{block.goal}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
