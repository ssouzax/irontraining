import { motion } from 'framer-motion';
import { useTraining } from '@/contexts/TrainingContext';
import { useAuth } from '@/contexts/AuthContext';
import { calculate1RM } from '@/data/defaultProfile';
import { TrendingUp, Target, Dumbbell, Activity, Zap, CheckCircle, XCircle, Sparkles } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

const fadeIn = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4 } };

function StatCard({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string; sub?: string }) {
  return (
    <motion.div {...fadeIn} className="bg-card rounded-xl border border-border p-5 card-elevated">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{label}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
        </div>
        <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-primary/10">
          <Icon className="w-5 h-5 text-primary" />
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
  const { profile, program, currentWeek } = useTraining();
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [analyzing, setAnalyzing] = useState(false);

  const squat1RM = calculate1RM(profile.currentLifts.squat.weight, profile.currentLifts.squat.reps);
  const deadlift1RM = calculate1RM(profile.currentLifts.deadlift.weight, profile.currentLifts.deadlift.reps);
  const bench1RM = calculate1RM(profile.currentLifts.bench.weight, profile.currentLifts.bench.reps);

  const currentBlock = program.blocks.find(b => b.weeks.some(w => w.weekNumber === currentWeek)) || program.blocks[0];
  const currentWeekData = currentBlock.weeks.find(w => w.weekNumber === currentWeek) || currentBlock.weeks[0];
  const todayIndex = new Date().getDay();
  const dayMap: Record<number, number> = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4 };
  const todayWorkout = currentWeekData.days[dayMap[todayIndex] ?? 0];

  useEffect(() => {
    if (!user) return;
    supabase
      .from('ai_recommendations')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(5)
      .then(({ data }) => {
        if (data) setRecommendations(data as Recommendation[]);
      });
  }, [user]);

  const handleRecommendation = async (id: string, action: 'accepted' | 'rejected') => {
    await supabase.from('ai_recommendations').update({ status: action }).eq('id', id);
    setRecommendations(prev => prev.filter(r => r.id !== id));
    toast.success(action === 'accepted' ? 'Adjustment accepted!' : 'Recommendation dismissed');
  };

  const runAnalysis = async () => {
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-training');
      if (error) throw error;
      if (data?.recommendations?.length > 0) {
        // Refresh recommendations
        const { data: fresh } = await supabase
          .from('ai_recommendations')
          .select('*')
          .eq('user_id', user!.id)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(5);
        if (fresh) setRecommendations(fresh as Recommendation[]);
        toast.success(`${data.recommendations.length} new recommendations generated!`);
      } else {
        toast.info('No adjustments needed right now.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const progressData = Array.from({ length: Math.min(currentWeek, 12) }, (_, i) => ({
    week: `W${i + 1}`,
    squat: Math.round(squat1RM + i * 2.5 + Math.random() * 2),
    deadlift: Math.round(deadlift1RM + i * 2 + Math.random() * 1.5),
    bench: Math.round(bench1RM + i * 1.2 + Math.random() * 1),
  }));

  const volumeData = [
    { day: 'Mon', sets: 22 }, { day: 'Tue', sets: 19 }, { day: 'Wed', sets: 20 },
    { day: 'Thu', sets: 20 }, { day: 'Fri', sets: 16 },
  ];

  const tooltipStyle = {
    background: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '8px',
    color: 'hsl(var(--foreground))',
  };

  return (
    <div className="space-y-8">
      <motion.div {...fadeIn}>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Week {currentWeek} · {currentBlock.name}</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={TrendingUp} label="Est. Squat 1RM" value={`${squat1RM} kg`} sub={`Target: ${profile.targetProgression.squat}`} />
        <StatCard icon={Target} label="Est. Deadlift 1RM" value={`${deadlift1RM} kg`} sub={`Target: ${profile.targetProgression.deadlift}`} />
        <StatCard icon={Dumbbell} label="Est. Bench 1RM" value={`${bench1RM} kg`} sub={`Target: ${profile.targetProgression.bench}`} />
        <StatCard icon={Activity} label="Body Weight" value={`${profile.bodyWeight} kg`} sub="Current" />
      </div>

      {/* AI Recommendations */}
      <motion.div {...fadeIn} className="bg-card rounded-xl border border-border p-6 card-elevated">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">AI Recommendations</h3>
          </div>
          <button
            onClick={runAnalysis}
            disabled={analyzing}
            className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-lg hover:bg-primary/20 transition-colors disabled:opacity-50 flex items-center gap-1"
          >
            {analyzing ? <div className="w-3 h-3 border border-primary/30 border-t-primary rounded-full animate-spin" /> : <Sparkles className="w-3 h-3" />}
            Analyze Training
          </button>
        </div>
        {recommendations.length === 0 ? (
          <p className="text-sm text-muted-foreground">No pending recommendations. Click "Analyze Training" after logging workouts.</p>
        ) : (
          <div className="space-y-3">
            {recommendations.map(rec => (
              <motion.div
                key={rec.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                className="flex items-start justify-between p-4 rounded-lg bg-secondary/30 border border-border"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-primary/20 text-primary">
                      {rec.type.replace('_', ' ')}
                    </span>
                    {rec.exercise && <span className="text-xs text-muted-foreground">{rec.exercise}</span>}
                  </div>
                  <p className="text-sm font-medium text-foreground">{rec.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{rec.description}</p>
                </div>
                <div className="flex gap-1 ml-3 shrink-0">
                  <button onClick={() => handleRecommendation(rec.id, 'accepted')} className="p-1.5 rounded-lg bg-success/10 text-success hover:bg-success/20 transition-colors">
                    <CheckCircle className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleRecommendation(rec.id, 'rejected')} className="p-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors">
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div {...fadeIn} className="bg-card rounded-xl border border-border p-6 card-elevated">
          <h3 className="text-sm font-semibold text-foreground mb-4">Estimated 1RM Progress</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={progressData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="squat" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={{ r: 3 }} name="Squat" />
              <Line type="monotone" dataKey="deadlift" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={{ r: 3 }} name="Deadlift" />
              <Line type="monotone" dataKey="bench" stroke="hsl(var(--chart-3))" strokeWidth={2} dot={{ r: 3 }} name="Bench" />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div {...fadeIn} className="bg-card rounded-xl border border-border p-6 card-elevated">
          <h3 className="text-sm font-semibold text-foreground mb-4">Weekly Volume (Sets)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={volumeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="sets" stroke="hsl(var(--chart-4))" fill="hsl(var(--chart-4) / 0.2)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Today's Workout */}
      {todayWorkout && (
        <motion.div {...fadeIn} className="bg-card rounded-xl border border-border p-6 card-elevated">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Today's Workout</h3>
              <p className="text-xs text-muted-foreground">{todayWorkout.name} — {todayWorkout.focus}</p>
            </div>
            <Link to="/train" className="text-xs bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-1">
              <Zap className="w-3 h-3" /> Start Training
            </Link>
          </div>
          <div className="space-y-2">
            {todayWorkout.exercises.map(ex => (
              <div key={ex.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-secondary/50">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${ex.category === 'compound' ? 'bg-primary' : 'bg-muted-foreground'}`} />
                  <span className="text-sm text-foreground">{ex.name}</span>
                </div>
                <span className="text-xs text-muted-foreground font-mono">
                  {ex.sets.map(s => `${s.targetSets}×${s.targetReps}`).join(' + ')}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Block Overview */}
      <motion.div {...fadeIn} className="bg-card rounded-xl border border-border p-6 card-elevated">
        <h3 className="text-sm font-semibold text-foreground mb-4">Program Blocks</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {program.blocks.map(block => (
            <div key={block.id} className={`p-4 rounded-lg border transition-all ${block === currentBlock ? 'border-primary bg-primary/5' : 'border-border bg-secondary/30'}`}>
              <p className="text-xs text-muted-foreground">{block.weekRange}</p>
              <p className="text-sm font-medium text-foreground mt-1">{block.name}</p>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{block.goal}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
