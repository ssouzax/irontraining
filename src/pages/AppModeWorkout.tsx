import { motion, AnimatePresence } from 'framer-motion';
import { useTraining } from '@/contexts/TrainingContext';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Check, ChevronLeft, ChevronRight, Minus, Plus, Timer, RotateCcw, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LoggedSet, Exercise, TrainingSet } from '@/types/training';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

function RestTimer({ seconds, onComplete, onDismiss }: { seconds: number; onComplete: () => void; onDismiss: () => void }) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    if (remaining <= 0) { onComplete(); return; }
    const t = setTimeout(() => setRemaining(r => r - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining, onComplete]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const progress = ((seconds - remaining) / seconds) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-card border border-border rounded-2xl p-6 card-elevated flex flex-col items-center gap-3 min-w-[200px]"
    >
      <button onClick={onDismiss} className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-foreground">
        <X className="w-4 h-4" />
      </button>
      <Timer className="w-5 h-5 text-primary" />
      <p className="text-3xl font-bold text-foreground font-mono">{mins}:{secs.toString().padStart(2, '0')}</p>
      <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-primary rounded-full"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      <p className="text-xs text-muted-foreground">Rest Timer</p>
    </motion.div>
  );
}

interface SetRowProps {
  setIndex: number;
  targetReps: number;
  targetRIR?: number;
  setType: string;
  log: LoggedSet;
  lastWeight?: number;
  onUpdate: (field: keyof LoggedSet, value: any) => void;
  onComplete: () => void;
}

function SetRow({ setIndex, targetReps, targetRIR, setType, log, lastWeight, onUpdate, onComplete }: SetRowProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: setIndex * 0.03 }}
      className={cn(
        "flex items-center gap-2 py-2.5 px-3 rounded-xl transition-all",
        log.completed ? "bg-success/10 border border-success/20" : "bg-secondary/30"
      )}
    >
      {/* Set number */}
      <div className={cn(
        "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
        setType === 'top' ? 'bg-primary/20 text-primary' :
        setType === 'backoff' ? 'bg-warning/20 text-warning' :
        'bg-secondary text-muted-foreground'
      )}>
        {setIndex + 1}
      </div>

      {/* Target info */}
      <div className="w-20 shrink-0">
        <p className="text-xs text-muted-foreground font-mono">
          {targetReps}r {targetRIR !== undefined ? `RIR${targetRIR}` : ''}
        </p>
      </div>

      {/* Weight input */}
      <div className="flex items-center gap-1 flex-1">
        <button onClick={() => onUpdate('weight', Math.max(0, log.weight - 2.5))} className="p-1.5 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
          <Minus className="w-3 h-3 text-muted-foreground" />
        </button>
        <input
          type="number"
          value={log.weight || ''}
          onChange={e => onUpdate('weight', parseFloat(e.target.value) || 0)}
          placeholder="kg"
          className="w-16 bg-background border border-border rounded-lg px-2 py-1.5 text-sm text-center text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <button onClick={() => onUpdate('weight', log.weight + 2.5)} className="p-1.5 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
          <Plus className="w-3 h-3 text-muted-foreground" />
        </button>
      </div>

      <span className="text-muted-foreground text-xs">×</span>

      {/* Reps input */}
      <div className="flex items-center gap-1">
        <button onClick={() => onUpdate('reps', Math.max(0, log.reps - 1))} className="p-1.5 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
          <Minus className="w-3 h-3 text-muted-foreground" />
        </button>
        <input
          type="number"
          value={log.reps}
          onChange={e => onUpdate('reps', parseInt(e.target.value) || 0)}
          className="w-12 bg-background border border-border rounded-lg px-2 py-1.5 text-sm text-center text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <button onClick={() => onUpdate('reps', log.reps + 1)} className="p-1.5 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
          <Plus className="w-3 h-3 text-muted-foreground" />
        </button>
      </div>

      {/* RIR */}
      <input
        type="number"
        value={log.rir ?? ''}
        onChange={e => onUpdate('rir', parseInt(e.target.value))}
        placeholder="RIR"
        className="w-12 bg-background border border-border rounded-lg px-1 py-1.5 text-xs text-center text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary"
      />

      {/* Quick buttons */}
      <div className="flex gap-1">
        <button onClick={() => onUpdate('weight', log.weight + 2.5)} className="text-[10px] px-1.5 py-1 rounded bg-secondary text-muted-foreground hover:text-foreground transition-colors">+2.5</button>
        <button onClick={() => onUpdate('weight', log.weight + 5)} className="text-[10px] px-1.5 py-1 rounded bg-secondary text-muted-foreground hover:text-foreground transition-colors">+5</button>
        {lastWeight && (
          <button onClick={() => onUpdate('weight', lastWeight)} className="p-1 rounded bg-secondary text-muted-foreground hover:text-foreground transition-colors" title="Repeat last">
            <RotateCcw className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Complete */}
      <button
        onClick={onComplete}
        className={cn(
          "p-2 rounded-xl transition-all shrink-0",
          log.completed ? "bg-success text-success-foreground scale-110" : "bg-secondary hover:bg-primary/20 hover:text-primary"
        )}
      >
        <Check className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

export default function AppModeWorkout() {
  const { program, currentWeek, currentDay, setCurrentDay } = useTraining();
  const { user } = useAuth();

  const currentBlock = program.blocks.find(b =>
    b.weeks.some(w => w.weekNumber === currentWeek)
  ) || program.blocks[0];
  const weekData = currentBlock.weeks.find(w => w.weekNumber === currentWeek) || currentBlock.weeks[0];
  const dayData = weekData.days[currentDay];

  const [logData, setLogData] = useState<Record<string, LoggedSet[]>>({});
  const [restTimer, setRestTimer] = useState<{ active: boolean; seconds: number }>({ active: false, seconds: 0 });
  const [saving, setSaving] = useState(false);

  const getSetKey = (exerciseId: string, setId: string) => `${exerciseId}__${setId}`;

  const getSetLog = (key: string, setIdx: number, targetReps: number): LoggedSet => {
    return logData[key]?.[setIdx] || {
      setNumber: setIdx + 1,
      weight: 0,
      reps: targetReps,
      rir: undefined,
      completed: false,
    };
  };

  const updateSetLog = (key: string, setIdx: number, field: keyof LoggedSet, value: any) => {
    setLogData(prev => {
      const arr = [...(prev[key] || [])];
      arr[setIdx] = { ...getSetLog(key, setIdx, 0), ...arr[setIdx], [field]: value };
      return { ...prev, [key]: arr };
    });
  };

  const completeSet = (key: string, setIdx: number, restSeconds?: number) => {
    updateSetLog(key, setIdx, 'completed', true);
    if (restSeconds && restSeconds > 0) {
      setRestTimer({ active: true, seconds: restSeconds });
    }
  };

  const totalSets = dayData?.exercises.reduce((acc, ex) => acc + ex.sets.reduce((a, s) => a + s.targetSets, 0), 0) || 0;
  const completedSets = Object.values(logData).reduce((acc, sets) => acc + sets.filter(s => s?.completed).length, 0);

  const saveWorkout = async () => {
    if (!user || !dayData) return;
    setSaving(true);
    try {
      const { data: workoutLog, error: wError } = await supabase
        .from('workout_logs')
        .insert({
          user_id: user.id,
          program_week: currentWeek,
          day_index: currentDay,
          day_name: dayData.name,
          completed_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (wError) throw wError;

      const setInserts: any[] = [];
      dayData.exercises.forEach(exercise => {
        exercise.sets.forEach(setGroup => {
          const key = getSetKey(exercise.id, setGroup.id);
          for (let i = 0; i < setGroup.targetSets; i++) {
            const log = getSetLog(key, i, setGroup.targetReps);
            if (log.completed) {
              setInserts.push({
                user_id: user.id,
                workout_log_id: workoutLog.id,
                exercise_name: exercise.name,
                set_type: setGroup.type,
                set_number: i + 1,
                target_reps: setGroup.targetReps,
                target_weight: setGroup.targetWeight,
                target_rir: setGroup.targetRIR,
                actual_weight: log.weight,
                actual_reps: log.reps,
                actual_rir: log.rir,
                completed: true,
              });
            }
          }
        });
      });

      if (setInserts.length > 0) {
        const { error: sError } = await supabase.from('set_logs').insert(setInserts);
        if (sError) throw sError;
      }

      toast.success('Workout saved!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save workout');
    } finally {
      setSaving(false);
    }
  };

  if (!dayData) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">No workout scheduled</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">{dayData.name}</h1>
          <p className="text-sm text-muted-foreground">W{currentWeek} · {dayData.dayOfWeek} · {dayData.focus}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setCurrentDay(Math.max(0, currentDay - 1))} disabled={currentDay === 0} className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 disabled:opacity-30 transition-colors">
            <ChevronLeft className="w-4 h-4 text-foreground" />
          </button>
          <span className="text-xs text-muted-foreground font-mono">{currentDay + 1}/{weekData.days.length}</span>
          <button onClick={() => setCurrentDay(Math.min(weekData.days.length - 1, currentDay + 1))} disabled={currentDay === weekData.days.length - 1} className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 disabled:opacity-30 transition-colors">
            <ChevronRight className="w-4 h-4 text-foreground" />
          </button>
        </div>
      </motion.div>

      {/* Progress bar */}
      <div className="bg-card rounded-xl border border-border p-3 card-elevated">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">Progress</span>
          <span className="text-xs font-mono text-foreground">{completedSets}/{totalSets} sets</span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            animate={{ width: `${totalSets > 0 ? (completedSets / totalSets) * 100 : 0}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Exercises */}
      {dayData.exercises.map((exercise, exIdx) => (
        <motion.div
          key={exercise.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: exIdx * 0.04 }}
          className="bg-card rounded-xl border border-border card-elevated overflow-hidden"
        >
          <div className="p-4 border-b border-border flex items-center gap-3">
            <div className={cn("w-1.5 h-10 rounded-full", exercise.category === 'compound' ? 'bg-primary' : 'bg-muted-foreground/30')} />
            <div>
              <h3 className="font-semibold text-foreground text-sm">{exercise.name}</h3>
              <p className="text-xs text-muted-foreground">{exercise.muscleGroup}</p>
            </div>
          </div>

          <div className="p-3 space-y-2">
            {exercise.sets.map(setGroup => {
              const key = getSetKey(exercise.id, setGroup.id);
              return (
                <div key={setGroup.id} className="space-y-1.5">
                  <div className="flex items-center gap-2 px-1 mb-1">
                    <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded",
                      setGroup.type === 'top' ? 'bg-primary/20 text-primary' :
                      setGroup.type === 'backoff' ? 'bg-warning/20 text-warning' :
                      'bg-secondary text-secondary-foreground'
                    )}>
                      {setGroup.type === 'top' ? 'TOP SET' : setGroup.type === 'backoff' ? 'BACK OFF' : 'WORKING'}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {setGroup.targetSets}×{setGroup.targetReps}
                      {setGroup.targetRIR !== undefined && ` RIR${setGroup.targetRIR}`}
                      {setGroup.percentage && ` @${setGroup.percentage}%`}
                    </span>
                  </div>
                  {Array.from({ length: setGroup.targetSets }, (_, i) => {
                    const log = getSetLog(key, i, setGroup.targetReps);
                    const prevLog = i > 0 ? getSetLog(key, i - 1, setGroup.targetReps) : undefined;
                    return (
                      <SetRow
                        key={i}
                        setIndex={i}
                        targetReps={setGroup.targetReps}
                        targetRIR={setGroup.targetRIR}
                        setType={setGroup.type}
                        log={log}
                        lastWeight={prevLog?.weight}
                        onUpdate={(field, value) => updateSetLog(key, i, field, value)}
                        onComplete={() => completeSet(key, i, setGroup.restSeconds)}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>
        </motion.div>
      ))}

      {/* Save button */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed bottom-6 right-6 z-40">
        <button
          onClick={saveWorkout}
          disabled={saving || completedSets === 0}
          className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-medium text-sm hover:bg-primary/90 disabled:opacity-50 transition-all card-elevated flex items-center gap-2"
        >
          {saving ? <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
          Save Workout
        </button>
      </motion.div>

      {/* Rest Timer */}
      <AnimatePresence>
        {restTimer.active && (
          <RestTimer
            seconds={restTimer.seconds}
            onComplete={() => setRestTimer({ active: false, seconds: 0 })}
            onDismiss={() => setRestTimer({ active: false, seconds: 0 })}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
