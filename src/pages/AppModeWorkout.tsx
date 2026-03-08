import { motion, AnimatePresence } from 'framer-motion';
import { useTraining } from '@/contexts/TrainingContext';
import { useState, useEffect, useRef } from 'react';
import { Check, ChevronLeft, ChevronRight, Minus, Plus, Timer, RotateCcw, X, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LoggedSet } from '@/types/training';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

function estimate1RM(weight: number, reps: number): number {
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}

function RestTimer({ seconds, onComplete, onDismiss, elapsed }: { seconds: number; onComplete: () => void; onDismiss: () => void; elapsed?: number }) {
  const [remaining, setRemaining] = useState(seconds);
  const [totalElapsed, setTotalElapsed] = useState(elapsed || 0);

  useEffect(() => {
    const t = setInterval(() => {
      setRemaining(r => (r <= 0 ? r - 1 : r - 1));
      setTotalElapsed(e => e + 1);
    }, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (remaining <= 0 && seconds > 0) onComplete();
  }, [remaining, onComplete, seconds]);

  const mins = Math.floor(Math.abs(remaining) / 60);
  const secs = Math.abs(remaining) % 60;
  const isOvertime = remaining < 0;
  const progress = seconds > 0 ? Math.min(((seconds - remaining) / seconds) * 100, 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 bg-card border border-border rounded-2xl p-5 sm:p-6 card-elevated flex flex-col items-center gap-3 min-w-[220px] sm:min-w-[260px]"
    >
      <button onClick={onDismiss} className="absolute top-2 right-2 p-1.5 text-muted-foreground hover:text-foreground">
        <X className="w-4 h-4" />
      </button>
      <Timer className={cn("w-5 h-5", isOvertime ? "text-warning" : "text-primary")} />
      <p className={cn("text-4xl font-bold font-mono", isOvertime ? "text-warning" : "text-foreground")}>
        {isOvertime ? '+' : ''}{mins}:{secs.toString().padStart(2, '0')}
      </p>
      <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
        <motion.div
          className={cn("h-full rounded-full", isOvertime ? "bg-warning" : "bg-primary")}
          animate={{ width: `${Math.min(progress, 100)}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Clock className="w-3 h-3" />
        <span>Descanso: {Math.floor(totalElapsed / 60)}:{(totalElapsed % 60).toString().padStart(2, '0')}</span>
      </div>
      <p className="text-xs text-muted-foreground">{isOvertime ? 'Tempo extra!' : 'Descansando...'}</p>
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
  restTime?: number;
  onUpdate: (field: keyof LoggedSet, value: any) => void;
  onComplete: () => void;
}

function SetRow({ setIndex, targetReps, targetRIR, setType, log, lastWeight, restTime, onUpdate, onComplete }: SetRowProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: setIndex * 0.03 }}
      className={cn(
        "flex flex-wrap sm:flex-nowrap items-center gap-2 py-2.5 px-3 rounded-xl transition-all",
        log.completed ? "bg-success/10 border border-success/20" : "bg-secondary/30"
      )}
    >
      <div className={cn(
        "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
        setType === 'top' ? 'bg-primary/20 text-primary' :
        setType === 'backoff' ? 'bg-warning/20 text-warning' :
        'bg-secondary text-muted-foreground'
      )}>
        {setIndex + 1}
      </div>

      <div className="w-16 sm:w-20 shrink-0">
        <p className="text-xs text-muted-foreground font-mono">
          {targetReps}r {targetRIR !== undefined ? `RIR${targetRIR}` : ''}
        </p>
      </div>

      <div className="flex items-center gap-1">
        <button onClick={() => onUpdate('weight', Math.max(0, log.weight - 2.5))} className="p-1 sm:p-1.5 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
          <Minus className="w-3 h-3 text-muted-foreground" />
        </button>
        <input
          type="number"
          value={log.weight || ''}
          onChange={e => onUpdate('weight', parseFloat(e.target.value) || 0)}
          placeholder="kg"
          className="w-14 sm:w-16 bg-background border border-border rounded-lg px-1 sm:px-2 py-1.5 text-sm text-center text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <button onClick={() => onUpdate('weight', log.weight + 2.5)} className="p-1 sm:p-1.5 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
          <Plus className="w-3 h-3 text-muted-foreground" />
        </button>
      </div>

      <span className="text-muted-foreground text-xs">×</span>

      <div className="flex items-center gap-1">
        <button onClick={() => onUpdate('reps', Math.max(0, log.reps - 1))} className="p-1 sm:p-1.5 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
          <Minus className="w-3 h-3 text-muted-foreground" />
        </button>
        <input
          type="number"
          value={log.reps}
          onChange={e => onUpdate('reps', parseInt(e.target.value) || 0)}
          className="w-10 sm:w-12 bg-background border border-border rounded-lg px-1 py-1.5 text-sm text-center text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <button onClick={() => onUpdate('reps', log.reps + 1)} className="p-1 sm:p-1.5 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
          <Plus className="w-3 h-3 text-muted-foreground" />
        </button>
      </div>

      <input
        type="number"
        value={log.rir ?? ''}
        onChange={e => onUpdate('rir', parseInt(e.target.value))}
        placeholder="RIR"
        className="w-10 sm:w-12 bg-background border border-border rounded-lg px-1 py-1.5 text-xs text-center text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary"
      />

      <div className="hidden sm:flex gap-1">
        <button onClick={() => onUpdate('weight', log.weight + 2.5)} className="text-[10px] px-1.5 py-1 rounded bg-secondary text-muted-foreground hover:text-foreground transition-colors">+2.5</button>
        <button onClick={() => onUpdate('weight', log.weight + 5)} className="text-[10px] px-1.5 py-1 rounded bg-secondary text-muted-foreground hover:text-foreground transition-colors">+5</button>
        {lastWeight && lastWeight > 0 && (
          <button onClick={() => onUpdate('weight', lastWeight)} className="p-1 rounded bg-secondary text-muted-foreground hover:text-foreground transition-colors" title="Repetir último">
            <RotateCcw className="w-3 h-3" />
          </button>
        )}
      </div>

      {restTime !== undefined && restTime > 0 && log.completed && (
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Clock className="w-3 h-3" />
          {Math.floor(restTime / 60)}:{(restTime % 60).toString().padStart(2, '0')}
        </div>
      )}

      <button
        onClick={onComplete}
        className={cn(
          "p-2 rounded-xl transition-all shrink-0 ml-auto",
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
  const [restTimes, setRestTimes] = useState<Record<string, number>>({});
  const [restTimer, setRestTimer] = useState<{ active: boolean; seconds: number; key: string }>({ active: false, seconds: 0, key: '' });
  const [saving, setSaving] = useState(false);
  const lastCompletionTime = useRef<number | null>(null);

  const getSetKey = (exerciseId: string, setId: string) => `${exerciseId}__${setId}`;
  const getSetRestKey = (exerciseId: string, setId: string, idx: number) => `${exerciseId}__${setId}__${idx}`;

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

  const completeSet = (key: string, setIdx: number, restSeconds?: number, exerciseId?: string, setId?: string) => {
    if (lastCompletionTime.current && exerciseId && setId) {
      const actualRest = Math.round((Date.now() - lastCompletionTime.current) / 1000);
      const restKey = getSetRestKey(exerciseId, setId, setIdx);
      setRestTimes(prev => ({ ...prev, [restKey]: actualRest }));
    }
    
    updateSetLog(key, setIdx, 'completed', true);
    lastCompletionTime.current = Date.now();
    
    if (restSeconds && restSeconds > 0) {
      setRestTimer({ active: true, seconds: restSeconds, key: `${key}__${setIdx}` });
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

      // Save to both old set_logs and new performed_sets for compatibility
      const setInserts: any[] = [];
      const performedInserts: any[] = [];
      
      dayData.exercises.forEach(exercise => {
        exercise.sets.forEach(setGroup => {
          const key = getSetKey(exercise.id, setGroup.id);
          for (let i = 0; i < setGroup.targetSets; i++) {
            const log = getSetLog(key, i, setGroup.targetReps);
            if (log.completed) {
              const restKey = getSetRestKey(exercise.id, setGroup.id, i);
              const e1rm = log.weight > 0 && log.reps > 0 ? estimate1RM(log.weight, log.reps) : null;
              
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
                notes: restTimes[restKey] ? `descanso:${restTimes[restKey]}s` : undefined,
              });

              performedInserts.push({
                user_id: user.id,
                workout_log_id: workoutLog.id,
                exercise_name: exercise.name,
                set_number: i + 1,
                weight_used: log.weight,
                reps_completed: log.reps,
                rir_reported: log.rir,
                completed: true,
                estimated_1rm: e1rm,
              });
            }
          }
        });
      });

      if (setInserts.length > 0) {
        const { error: sError } = await supabase.from('set_logs').insert(setInserts);
        if (sError) throw sError;
      }
      if (performedInserts.length > 0) {
        const { error: pError } = await supabase.from('performed_sets').insert(performedInserts);
        if (pError) throw pError;
      }


      }

      toast.success('Treino salvo com sucesso!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar treino');
    } finally {
      setSaving(false);
    }
  };

  if (!dayData) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Nenhum treino agendado</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">{dayData.name}</h1>
          <p className="text-sm text-muted-foreground">S{currentWeek} · {dayData.dayOfWeek} · {dayData.focus}</p>
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

      <div className="bg-card rounded-xl border border-border p-3 card-elevated">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">Progresso</span>
          <span className="text-xs font-mono text-foreground">{completedSets}/{totalSets} séries</span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            animate={{ width: `${totalSets > 0 ? (completedSets / totalSets) * 100 : 0}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>

      {dayData.exercises.map((exercise, exIdx) => (
        <motion.div
          key={exercise.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: exIdx * 0.04 }}
          className="bg-card rounded-xl border border-border card-elevated overflow-hidden"
        >
          <div className="p-3 sm:p-4 border-b border-border flex items-center gap-3">
            <div className={cn("w-1.5 h-10 rounded-full", exercise.category === 'compound' ? 'bg-primary' : 'bg-muted-foreground/30')} />
            <div>
              <h3 className="font-semibold text-foreground text-sm">{exercise.name}</h3>
              <p className="text-xs text-muted-foreground">{exercise.muscleGroup}</p>
            </div>
          </div>

          <div className="p-2 sm:p-3 space-y-2">
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
                      {setGroup.type === 'top' ? 'TOP SET' : setGroup.type === 'backoff' ? 'BACK OFF' : 'TRABALHO'}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {setGroup.targetSets}×{setGroup.targetReps}
                      {setGroup.targetRIR !== undefined && ` RIR${setGroup.targetRIR}`}
                      {setGroup.percentage && ` @${setGroup.percentage}%`}
                    </span>
                    {setGroup.restSeconds && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <Timer className="w-3 h-3" />{Math.floor(setGroup.restSeconds / 60)}:{(setGroup.restSeconds % 60).toString().padStart(2, '0')}
                      </span>
                    )}
                  </div>
                  {Array.from({ length: setGroup.targetSets }, (_, i) => {
                    const log = getSetLog(key, i, setGroup.targetReps);
                    const prevLog = i > 0 ? getSetLog(key, i - 1, setGroup.targetReps) : undefined;
                    const restKey = getSetRestKey(exercise.id, setGroup.id, i);
                    return (
                      <SetRow
                        key={i}
                        setIndex={i}
                        targetReps={setGroup.targetReps}
                        targetRIR={setGroup.targetRIR}
                        setType={setGroup.type}
                        log={log}
                        lastWeight={prevLog?.weight}
                        restTime={restTimes[restKey]}
                        onUpdate={(field, value) => updateSetLog(key, i, field, value)}
                        onComplete={() => completeSet(key, i, setGroup.restSeconds, exercise.id, setGroup.id)}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>
        </motion.div>
      ))}

      {/* Rest Timer */}
      <AnimatePresence>
        {restTimer.active && (
          <RestTimer
            seconds={restTimer.seconds}
            onComplete={() => {
              if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);
            }}
            onDismiss={() => setRestTimer({ active: false, seconds: 0, key: '' })}
          />
        )}
      </AnimatePresence>

      {/* Save Button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-md"
      >
        <button
          onClick={saveWorkout}
          disabled={saving || completedSets === 0}
          className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-medium text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors card-elevated flex items-center justify-center gap-2"
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
          ) : (
            <Check className="w-4 h-4" />
          )}
          {saving ? 'Salvando...' : `Salvar Treino (${completedSets}/${totalSets} séries)`}
        </button>
      </motion.div>
    </div>
  );
}
