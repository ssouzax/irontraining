import { useState } from 'react';
import { Brain, Loader2, TrendingUp, Calendar, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTraining } from '@/contexts/TrainingContext';
import { calculate1RM } from '@/data/defaultProfile';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface Prediction {
  exercise: string;
  current_1rm: number;
  predicted_1rm: number;
  weeks: number;
  confidence: number;
}

export function MobilePredictor() {
  const { user } = useAuth();
  const { profile } = useTraining();
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(false);

  const squat1RM = calculate1RM(profile.currentLifts.squat.weight, profile.currentLifts.squat.reps);
  const bench1RM = calculate1RM(profile.currentLifts.bench.weight, profile.currentLifts.bench.reps);
  const deadlift1RM = calculate1RM(profile.currentLifts.deadlift.weight, profile.currentLifts.deadlift.reps);

  const generatePredictions = async () => {
    if (!user) return;
    setLoading(true);

    // Get recent PR history for trend analysis
    const threeMonthsAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const { data: prs } = await supabase.from('personal_records')
      .select('exercise_name, weight, estimated_1rm, recorded_at')
      .eq('user_id', user.id)
      .gte('recorded_at', threeMonthsAgo)
      .order('recorded_at', { ascending: true });

    // Get recent workout consistency
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { count: workoutCount } = await supabase.from('workout_logs')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id)
      .gte('created_at', thirtyDaysAgo);

    const consistency = Math.min(1, (workoutCount || 0) / 16); // 4x/week = 1.0

    // Simple regression-based prediction per lift
    const lifts = [
      { name: 'Agachamento', current: squat1RM, exercise_filter: ['squat', 'agachamento', 'Squat'] },
      { name: 'Supino', current: bench1RM, exercise_filter: ['bench', 'supino', 'Bench Press'] },
      { name: 'Terra', current: deadlift1RM, exercise_filter: ['deadlift', 'terra', 'Deadlift'] },
    ];

    const newPredictions: Prediction[] = lifts.map(lift => {
      // Filter PRs for this exercise
      const liftPrs = (prs || []).filter(pr =>
        lift.exercise_filter.some(f => pr.exercise_name.toLowerCase().includes(f.toLowerCase()))
      );

      // Calculate weekly rate of improvement
      let weeklyGain = 0;
      if (liftPrs.length >= 2) {
        const first = liftPrs[0];
        const last = liftPrs[liftPrs.length - 1];
        const daysBetween = (new Date(last.recorded_at).getTime() - new Date(first.recorded_at).getTime()) / (1000 * 60 * 60 * 24);
        const weeks = Math.max(1, daysBetween / 7);
        weeklyGain = (last.estimated_1rm - first.estimated_1rm) / weeks;
      } else {
        // Default: ~0.5-1% per week based on training level
        weeklyGain = lift.current * 0.005 * consistency;
      }

      // Adjust for consistency
      weeklyGain *= (0.5 + consistency * 0.5);

      // Predict next meaningful PR (2.5-5% increase)
      const targetIncrease = lift.current * 0.05; // 5% increase
      const weeksToTarget = weeklyGain > 0 ? Math.ceil(targetIncrease / weeklyGain) : 12;
      const clampedWeeks = Math.max(2, Math.min(16, weeksToTarget));
      const predicted = Math.round(lift.current + weeklyGain * clampedWeeks);
      const confidence = Math.min(95, Math.max(40, consistency * 60 + (liftPrs.length > 3 ? 30 : 10)));

      return {
        exercise: lift.name,
        current_1rm: lift.current,
        predicted_1rm: predicted,
        weeks: clampedWeeks,
        confidence: Math.round(confidence),
      };
    });

    setPredictions(newPredictions);
    setLoading(false);
    toast.success('Predições geradas!');
  };

  return (
    <div className="p-4 space-y-5">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" /> Preditor de Força
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">IA prevê seu próximo PR</p>
      </motion.div>

      {/* Current Stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Agachamento', val: squat1RM },
          { label: 'Supino', val: bench1RM },
          { label: 'Terra', val: deadlift1RM },
        ].map(s => (
          <div key={s.label} className="text-center p-3 rounded-xl bg-card border border-border">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
            <p className="text-xl font-extrabold text-foreground">{s.val}<span className="text-xs">kg</span></p>
            <p className="text-[10px] text-muted-foreground">E1RM atual</p>
          </div>
        ))}
      </div>

      <button onClick={generatePredictions} disabled={loading}
        className="w-full bg-primary text-primary-foreground py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
        Gerar Predições com IA
      </button>

      {/* Predictions */}
      {predictions.length > 0 && (
        <div className="space-y-3">
          {predictions.map((pred, i) => (
            <motion.div key={pred.exercise}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15 }}
              className="bg-card rounded-2xl border border-border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" /> {pred.exercise}
                </h3>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                  {pred.confidence}% confiança
                </span>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Atual</span>
                  <span className="text-muted-foreground">Predição</span>
                </div>
                <div className="relative h-8 rounded-lg bg-secondary overflow-hidden">
                  <div className="absolute inset-y-0 left-0 bg-primary/30 rounded-lg transition-all duration-1000"
                    style={{ width: `${(pred.current_1rm / pred.predicted_1rm) * 100}%` }} />
                  <div className="absolute inset-0 flex items-center justify-between px-3">
                    <span className="text-sm font-bold text-foreground">{pred.current_1rm}kg</span>
                    <span className="text-sm font-extrabold text-primary">{pred.predicted_1rm}kg</span>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-1 text-xs text-primary mt-1">
                  <TrendingUp className="w-3 h-3" />
                  <span className="font-medium">+{pred.predicted_1rm - pred.current_1rm}kg</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-1 py-2 rounded-xl bg-primary/5 text-sm">
                <Calendar className="w-4 h-4 text-primary" />
                <span className="font-medium text-foreground">Estimativa: <span className="text-primary">{pred.weeks} semanas</span></span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
