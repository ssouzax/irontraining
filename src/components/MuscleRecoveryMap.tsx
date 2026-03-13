import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';
import { useTraining } from '@/contexts/TrainingContext';
import { cn } from '@/lib/utils';

const MUSCLE_GROUPS = [
  { key: 'Peito', label: 'Peito', emoji: '🫁' },
  { key: 'Costas', label: 'Costas', emoji: '🔙' },
  { key: 'Quadríceps', label: 'Quadríceps', emoji: '🦵' },
  { key: 'Posterior', label: 'Posterior', emoji: '🦿' },
  { key: 'Ombros', label: 'Ombros', emoji: '💪' },
  { key: 'Bíceps', label: 'Bíceps', emoji: '💪' },
  { key: 'Tríceps', label: 'Tríceps', emoji: '💪' },
  { key: 'Glúteos', label: 'Glúteos', emoji: '🍑' },
];

// Recovery estimation: 48-72h full recovery
function getRecoveryPercent(lastTrainedDaysAgo: number | null): number {
  if (lastTrainedDaysAgo === null) return 100;
  if (lastTrainedDaysAgo >= 3) return 100;
  if (lastTrainedDaysAgo <= 0) return 20;
  // Linear: 0 days = 20%, 3 days = 100%
  return Math.round(20 + (lastTrainedDaysAgo / 3) * 80);
}

function getRecoveryColor(pct: number): string {
  if (pct >= 80) return 'bg-green-500';
  if (pct >= 50) return 'bg-yellow-500';
  return 'bg-red-500';
}

function getRecoveryBg(pct: number): string {
  if (pct >= 80) return 'bg-green-500/10';
  if (pct >= 50) return 'bg-yellow-500/10';
  return 'bg-red-500/10';
}

export function MuscleRecoveryMap() {
  const { program, workoutLogs, currentWeek } = useTraining();
  const hasProgram = program.blocks.length > 0;

  if (!hasProgram) return null;

  // Find last trained day for each muscle group based on recent workout data
  const now = new Date();
  const muscleLastTrained: Record<string, number | null> = {};

  MUSCLE_GROUPS.forEach(mg => {
    muscleLastTrained[mg.key] = null;
  });

  // Look at program structure to estimate muscle usage based on day focus
  const currentBlock = program.blocks.find(b => b.weeks.some(w => w.weekNumber === currentWeek)) || program.blocks[0];
  const currentWeekData = currentBlock?.weeks.find(w => w.weekNumber === currentWeek);
  
  if (currentWeekData) {
    const jsDay = new Date().getDay();
    currentWeekData.days.forEach((day, idx) => {
      // Simple heuristic: map day index to days ago
      const dayOfWeekMap: Record<string, number> = {
        'Segunda': 1, 'Terça': 2, 'Quarta': 3, 'Quinta': 4, 'Sexta': 5, 'Sábado': 6, 'Domingo': 0,
      };
      const dayNum = dayOfWeekMap[day.dayOfWeek] ?? idx + 1;
      const daysAgo = ((jsDay - dayNum) + 7) % 7;
      
      if (daysAgo <= 3 && daysAgo >= 0) {
        day.exercises.forEach(ex => {
          const mg = ex.muscleGroup || day.focus.split(',')[0]?.trim() || '';
          MUSCLE_GROUPS.forEach(group => {
            if (mg.toLowerCase().includes(group.key.toLowerCase()) || 
                day.focus.toLowerCase().includes(group.key.toLowerCase())) {
              const current = muscleLastTrained[group.key];
              if (current === null || daysAgo < current) {
                muscleLastTrained[group.key] = daysAgo;
              }
            }
          });
        });
      }
    });
  }

  const recoveryData = MUSCLE_GROUPS.map(mg => ({
    ...mg,
    recovery: getRecoveryPercent(muscleLastTrained[mg.key]),
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl border border-border p-4 sm:p-5 card-elevated"
    >
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Mapa de Recuperação Muscular</h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {recoveryData.map(mg => (
          <div
            key={mg.key}
            className={cn("p-3 rounded-lg border border-border", getRecoveryBg(mg.recovery))}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-foreground">{mg.label}</span>
              <span className="text-lg">{mg.emoji}</span>
            </div>
            <div className="w-full h-2 rounded-full bg-secondary">
              <div
                className={cn("h-full rounded-full transition-all", getRecoveryColor(mg.recovery))}
                style={{ width: `${mg.recovery}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">{mg.recovery}% recuperado</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
