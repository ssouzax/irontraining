import { useState, useMemo } from 'react';
import { Brain, TrendingUp, Target, Zap, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTraining } from '@/contexts/TrainingContext';
import { calculate1RM } from '@/data/defaultProfile';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

type Exercise = 'squat' | 'bench' | 'deadlift';

const EXERCISE_LABELS: Record<Exercise, string> = {
  squat: 'Agachamento',
  bench: 'Supino',
  deadlift: 'Levantamento Terra',
};

const EXERCISE_ICONS: Record<Exercise, string> = {
  squat: '🦵',
  bench: '💪',
  deadlift: '🏋️',
};

// Simplified progression model based on training level
function simulateProgression(current1RM: number, bodyweight: number, weeks: number): number[] {
  const strengthRatio = current1RM / Math.max(bodyweight, 60);
  // Novice: ~2% / week, intermediate: ~0.75%, advanced: ~0.25%
  const weeklyRate = strengthRatio < 1.5 ? 0.02 : strengthRatio < 2.0 ? 0.0075 : 0.0025;
  
  const projections: number[] = [current1RM];
  let projected = current1RM;
  for (let i = 1; i <= weeks; i++) {
    // Add slight randomness to simulate real progression with deloads
    const isDeload = i % 4 === 0;
    const factor = isDeload ? -0.005 : weeklyRate;
    projected = projected * (1 + factor);
    projections.push(Math.round(projected * 10) / 10);
  }
  return projections;
}

export function MobilePRSimulator() {
  const { profile } = useTraining();
  const [selectedExercise, setSelectedExercise] = useState<Exercise>('squat');
  const [weeks, setWeeks] = useState(12);
  
  const bodyweight = profile.bodyWeight || 85;
  
  const current1RMs = {
    squat: calculate1RM(profile.currentLifts.squat.weight, profile.currentLifts.squat.reps),
    bench: calculate1RM(profile.currentLifts.bench.weight, profile.currentLifts.bench.reps),
    deadlift: calculate1RM(profile.currentLifts.deadlift.weight, profile.currentLifts.deadlift.reps),
  };

  const projection = useMemo(() => 
    simulateProgression(current1RMs[selectedExercise], bodyweight, weeks),
    [selectedExercise, weeks, current1RMs[selectedExercise], bodyweight]
  );

  const chartData = projection.map((val, i) => ({
    week: `S${i}`,
    '1RM': val,
    atual: i === 0 ? val : undefined,
  }));

  const predicted1RM = projection[projection.length - 1];
  const gain = predicted1RM - current1RMs[selectedExercise];
  const gainPct = ((gain / current1RMs[selectedExercise]) * 100);

  const strengthLevel = (e1rm: number) => {
    const ratio = e1rm / bodyweight;
    if (ratio < 1.0) return { label: 'Iniciante', color: 'text-muted-foreground' };
    if (ratio < 1.5) return { label: 'Intermediário', color: 'text-blue-400' };
    if (ratio < 2.0) return { label: 'Avançado', color: 'text-purple-400' };
    return { label: 'Elite', color: 'text-yellow-400' };
  };

  const currentLevel = strengthLevel(current1RMs[selectedExercise]);
  const projectedLevel = strengthLevel(predicted1RM);

  return (
    <div className="p-4 space-y-5">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" /> Simulador de PR
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">Projeção de força com base no seu histórico</p>
      </motion.div>

      {/* Exercise Selector */}
      <div className="flex gap-2">
        {(['squat', 'bench', 'deadlift'] as Exercise[]).map(ex => (
          <button key={ex} onClick={() => setSelectedExercise(ex)}
            className={cn("flex-1 flex flex-col items-center gap-1 p-3 rounded-2xl border transition-all",
              selectedExercise === ex 
                ? "bg-primary/10 border-primary/30 shadow-sm shadow-primary/10" 
                : "bg-card border-border"
            )}>
            <span className="text-xl">{EXERCISE_ICONS[ex]}</span>
            <span className="text-[10px] font-bold text-muted-foreground uppercase">{EXERCISE_LABELS[ex].split(' ')[0]}</span>
            <span className="text-sm font-extrabold text-foreground">{Math.round(current1RMs[ex])}kg</span>
          </button>
        ))}
      </div>

      {/* Weeks Slider */}
      <div className="p-4 rounded-2xl bg-card border border-border">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Horizonte</span>
          <span className="text-sm font-extrabold text-primary">{weeks} semanas</span>
        </div>
        <input type="range" min="4" max="52" step="4" value={weeks} onChange={e => setWeeks(Number(e.target.value))}
          className="w-full accent-primary" />
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
          <span>4 sem</span><span>6 meses</span><span>1 ano</span>
        </div>
      </div>

      {/* Projection Summary */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-primary" />
            <span className="text-[10px] uppercase tracking-widest text-primary font-bold">Projeção</span>
          </div>
          <p className="text-3xl font-extrabold text-foreground">{Math.round(predicted1RM)}<span className="text-sm font-medium text-muted-foreground ml-1">kg</span></p>
          <div className="flex items-center gap-1 mt-1.5">
            <TrendingUp className="w-3 h-3 text-emerald-400" />
            <span className="text-xs font-semibold text-emerald-400">+{gain.toFixed(1)}kg ({gainPct.toFixed(1)}%)</span>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="p-4 rounded-2xl bg-card border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-accent" />
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Nível</span>
          </div>
          <p className={cn("text-lg font-extrabold", currentLevel.color)}>{currentLevel.label}</p>
          {currentLevel.label !== projectedLevel.label && (
            <div className="flex items-center gap-1 mt-1.5">
              <ChevronRight className="w-3 h-3 text-muted-foreground" />
              <span className={cn("text-xs font-semibold", projectedLevel.color)}>{projectedLevel.label}</span>
            </div>
          )}
        </motion.div>
      </div>

      {/* Projection Chart */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        className="p-4 rounded-2xl bg-card border border-border">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">
          Projeção {EXERCISE_LABELS[selectedExercise]}
        </p>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="week" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} interval={Math.floor(weeks / 6)} />
            <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
            <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 12 }} />
            <ReferenceLine y={current1RMs[selectedExercise]} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" label={{ value: 'Atual', fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
            <Line type="monotone" dataKey="1RM" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Milestones */}
      <div className="p-4 rounded-2xl bg-card border border-border space-y-3">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Marcos Projetados</p>
        {[4, 8, 12, Math.min(weeks, 24)].filter((w, i, arr) => w <= weeks && arr.indexOf(w) === i).map(w => {
          const val = projection[Math.min(w, projection.length - 1)];
          return (
            <div key={w} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xs font-extrabold text-primary">{w}</span>
                </div>
                <span className="text-sm text-muted-foreground">Semana {w}</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-extrabold text-foreground">{Math.round(val)}kg</span>
                <span className="text-[10px] text-emerald-400 ml-1.5">+{(val - current1RMs[selectedExercise]).toFixed(1)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
