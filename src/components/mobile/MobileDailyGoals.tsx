import { useState } from 'react';
import { Target, Plus, Check, Trash2, Flame, Dumbbell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDailyGoals } from '@/hooks/useDailyGoals';
import { usePlayerLevel } from '@/hooks/usePlayerLevel';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';

const GOAL_PRESETS = [
  { label: '5 séries de supino', goal_type: 'exercise_specific', exercise_name: 'Supino Reto', target_value: 5, target_unit: 'sets', xp: 30 },
  { label: '10 séries totais', goal_type: 'sets', exercise_name: null, target_value: 10, target_unit: 'sets', xp: 40 },
  { label: '5000kg de volume', goal_type: 'volume', exercise_name: null, target_value: 5000, target_unit: 'kg', xp: 50 },
  { label: '3 séries de agachamento', goal_type: 'exercise_specific', exercise_name: 'Agachamento', target_value: 3, target_unit: 'sets', xp: 25 },
];

export function MobileDailyGoals() {
  const { goals, loading, addGoal, updateProgress, deleteGoal, completedCount, totalCount } = useDailyGoals();
  const { addXP } = usePlayerLevel();
  const [showPresets, setShowPresets] = useState(false);

  const handleIncrement = async (goalId: string, currentValue: number) => {
    const completed = await updateProgress(goalId, currentValue + 1);
    if (completed) {
      const goal = goals.find(g => g.id === goalId);
      if (goal) {
        addXP(goal.xp_reward, 'daily_goal');
        toast.success(`🎯 Meta concluída! +${goal.xp_reward} XP`);
      }
    }
  };

  const handleAddPreset = async (preset: typeof GOAL_PRESETS[0]) => {
    await addGoal({
      goal_type: preset.goal_type,
      exercise_name: preset.exercise_name || undefined,
      target_value: preset.target_value,
      target_unit: preset.target_unit,
      xp_reward: preset.xp,
    });
    setShowPresets(false);
    toast.success('Meta adicionada!');
  };

  if (loading) return null;

  const overallProgress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="mx-4 mt-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          <span className="text-sm font-bold text-foreground">Metas do Dia</span>
          {totalCount > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
              {completedCount}/{totalCount}
            </span>
          )}
        </div>
        <button
          onClick={() => setShowPresets(!showPresets)}
          className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Overall progress */}
      {totalCount > 0 && (
        <Progress value={overallProgress} className="h-1.5 mb-3" />
      )}

      {/* Preset selector */}
      <AnimatePresence>
        {showPresets && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-3"
          >
            <div className="grid grid-cols-2 gap-2">
              {GOAL_PRESETS.map((preset, i) => (
                <button
                  key={i}
                  onClick={() => handleAddPreset(preset)}
                  className="p-3 rounded-xl bg-card border border-border text-left hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <Dumbbell className="w-3 h-3 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{preset.target_unit}</span>
                  </div>
                  <p className="text-xs font-semibold text-foreground">{preset.label}</p>
                  <p className="text-[10px] text-primary font-medium mt-0.5">+{preset.xp} XP</p>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Goals list */}
      <div className="space-y-2">
        {goals.map((goal) => {
          const progress = Math.min((goal.current_value / goal.target_value) * 100, 100);
          return (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "p-3 rounded-xl border transition-all",
                goal.completed
                  ? "bg-primary/5 border-primary/30"
                  : "bg-card border-border"
              )}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  {goal.completed ? (
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  ) : (
                    <Flame className="w-4 h-4 text-muted-foreground" />
                  )}
                  <span className={cn("text-xs font-semibold", goal.completed ? "text-primary" : "text-foreground")}>
                    {goal.exercise_name || (goal.goal_type === 'volume' ? 'Volume Total' : 'Séries Totais')}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {!goal.completed && (
                    <button
                      onClick={() => handleIncrement(goal.id, goal.current_value)}
                      className="px-2 py-1 rounded-lg bg-primary text-primary-foreground text-[10px] font-bold hover:bg-primary/90"
                    >
                      +1
                    </button>
                  )}
                  <button onClick={() => deleteGoal(goal.id)} className="p-1 text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Progress value={progress} className="h-1 flex-1" />
                <span className="text-[10px] font-bold text-muted-foreground min-w-[40px] text-right">
                  {goal.current_value}/{goal.target_value}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {totalCount === 0 && !showPresets && (
        <button
          onClick={() => setShowPresets(true)}
          className="w-full p-4 rounded-xl border border-dashed border-border text-center hover:border-primary/50 transition-colors"
        >
          <Target className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
          <p className="text-xs text-muted-foreground">Adicione metas para manter o fogo aceso 🔥</p>
        </button>
      )}
    </div>
  );
}
