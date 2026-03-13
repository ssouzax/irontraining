import { motion } from 'framer-motion';
import { Flame, Zap, CheckCircle, AlertTriangle, Dumbbell, Clock, ChevronRight, Plus } from 'lucide-react';
import { useTraining } from '@/contexts/TrainingContext';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

const DAY_MAP: Record<number, number[]> = {
  2: [1, 4],         // Mon, Thu
  3: [1, 3, 5],      // Mon, Wed, Fri
  4: [1, 2, 4, 5],   // Mon, Tue, Thu, Fri
  5: [1, 2, 3, 4, 5],
  6: [1, 2, 3, 4, 5, 6],
  7: [0, 1, 2, 3, 4, 5, 6],
};

function getTodayDayIndex(daysPerWeek: number): number {
  const jsDay = new Date().getDay(); // 0=Sun, 1=Mon...
  const trainingDays = DAY_MAP[daysPerWeek] || DAY_MAP[5];
  const idx = trainingDays.indexOf(jsDay);
  return idx; // -1 means rest day
}

function getCurrentProgramWeek(programStartDate?: string): number {
  if (!programStartDate) return 1;
  const start = new Date(programStartDate).getTime();
  const now = Date.now();
  const diffDays = Math.floor((now - start) / (1000 * 60 * 60 * 24));
  return Math.max(1, Math.min(12, Math.floor(diffDays / 7) + 1));
}

export function TodayWorkoutCard() {
  const { program, currentWeek, workoutLogs } = useTraining();
  const hasProgram = program.blocks.length > 0;

  if (!hasProgram) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-xl border border-border p-6 card-elevated"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Dumbbell className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Sem programa ativo</h3>
            <p className="text-sm text-muted-foreground">Crie seu primeiro programa de treino</p>
          </div>
        </div>
        <Link
          to="/programs"
          className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> GERAR TREINO
        </Link>
      </motion.div>
    );
  }

  const daysPerWeek = program.daysPerWeek || 5;
  const todayIndex = getTodayDayIndex(daysPerWeek);
  const isRestDay = todayIndex === -1;

  // Find current block and week
  const currentBlock = program.blocks.find(b =>
    b.weeks.some(w => w.weekNumber === currentWeek)
  ) || program.blocks[0];
  const currentWeekData = currentBlock?.weeks.find(w => w.weekNumber === currentWeek) || currentBlock?.weeks[0];

  // Find pending (first uncompleted day) or today's workout
  const todayWorkout = currentWeekData?.days[todayIndex >= 0 ? todayIndex : 0];
  
  // Check if today's workout is completed
  const today = new Date().toISOString().split('T')[0];
  const isCompleted = todayWorkout && workoutLogs.some(
    l => l.date === today && l.dayId === todayWorkout.id
  );

  // Find first uncompleted day in the week (pending logic)
  const pendingDay = currentWeekData?.days.find((d, idx) => {
    const dayDate = today; // simplified
    return !workoutLogs.some(l => l.dayId === d.id && l.date.startsWith(today.substring(0, 7)));
  });

  const workoutToShow = isRestDay ? pendingDay : todayWorkout;
  const isPending = isRestDay && pendingDay;

  if (isRestDay && !pendingDay) {
    // Rest day, nothing pending
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-xl border border-border p-6 card-elevated"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-green-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Dia de Descanso</h3>
            <p className="text-sm text-muted-foreground">Semana {currentWeek} · {currentBlock?.name}</p>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <div className="flex-1 p-3 rounded-lg bg-secondary/50 text-center">
            <p className="text-xs text-muted-foreground">Sugestão</p>
            <p className="text-sm font-medium text-foreground mt-1">🧘 Mobilidade</p>
          </div>
          <div className="flex-1 p-3 rounded-lg bg-secondary/50 text-center">
            <p className="text-xs text-muted-foreground">Ou</p>
            <p className="text-sm font-medium text-foreground mt-1">🚶 Cardio leve</p>
          </div>
          <div className="flex-1 p-3 rounded-lg bg-secondary/50 text-center">
            <p className="text-xs text-muted-foreground">Ou</p>
            <p className="text-sm font-medium text-foreground mt-1">😴 Descanso</p>
          </div>
        </div>
      </motion.div>
    );
  }

  if (isCompleted && !isRestDay) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-xl border border-border p-6 card-elevated"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-green-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">✅ Treino Concluído!</h3>
            <p className="text-sm text-muted-foreground">{todayWorkout?.name} — {todayWorkout?.focus}</p>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <div className="flex-1 p-3 rounded-lg bg-secondary/50 text-center">
            <p className="text-sm font-medium text-foreground">🧘 Mobilidade</p>
          </div>
          <div className="flex-1 p-3 rounded-lg bg-secondary/50 text-center">
            <p className="text-sm font-medium text-foreground">🚶 Cardio leve</p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl border border-border p-5 sm:p-6 card-elevated"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center",
            isPending ? "bg-yellow-500/10" : "bg-primary/10"
          )}>
            {isPending ? (
              <AlertTriangle className="w-6 h-6 text-yellow-500" />
            ) : (
              <Flame className="w-6 h-6 text-primary" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">
              {isPending ? '⚠ Treino Pendente' : '🔥 Treino de Hoje'}
            </h3>
            <p className="text-sm text-muted-foreground">
              Semana {currentWeek} · {workoutToShow?.name}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">{currentBlock?.name}</p>
          <p className="text-xs font-medium text-primary">{workoutToShow?.focus}</p>
        </div>
      </div>

      {/* Exercise preview */}
      {workoutToShow && (
        <div className="space-y-1.5 mb-4">
          {workoutToShow.exercises.slice(0, 5).map((ex, i) => (
            <div key={i} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-secondary/40">
              <div className="flex items-center gap-2">
                <div className={cn("w-2 h-2 rounded-full", ex.category === 'compound' ? 'bg-primary' : 'bg-muted-foreground')} />
                <span className="text-sm text-foreground">{ex.name}</span>
              </div>
              <span className="text-xs text-muted-foreground font-mono">
                {ex.sets.map(s => `${s.targetSets}×${s.targetReps}`).join(' + ')}
              </span>
            </div>
          ))}
          {workoutToShow.exercises.length > 5 && (
            <p className="text-xs text-muted-foreground text-center">
              +{workoutToShow.exercises.length - 5} exercícios
            </p>
          )}
        </div>
      )}

      {/* CTA */}
      <Link
        to="/train"
        className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3.5 rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors"
      >
        <Zap className="w-4 h-4" />
        {isPending ? 'INICIAR TREINO PENDENTE' : 'INICIAR TREINO'}
      </Link>

      {/* Stats row */}
      <div className="flex gap-3 mt-3">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Dumbbell className="w-3 h-3" />
          {workoutToShow?.exercises.length || 0} exercícios
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          ~{Math.round((workoutToShow?.exercises.length || 6) * 8)} min
        </div>
      </div>
    </motion.div>
  );
}
