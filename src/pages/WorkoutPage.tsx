import { motion } from 'framer-motion';
import { useTraining } from '@/contexts/TrainingContext';
import { useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LoggedSet } from '@/types/training';
import { Link } from 'react-router-dom';
import { Zap } from 'lucide-react';

export default function WorkoutPage() {
  const { program, currentWeek, currentDay, setCurrentDay } = useTraining();

  const currentBlock = program.blocks.find(b =>
    b.weeks.some(w => w.weekNumber === currentWeek)
  ) || program.blocks[0];

  const weekData = currentBlock?.weeks?.find(w => w.weekNumber === currentWeek) || currentBlock?.weeks?.[0];
  const dayData = weekData?.days?.[currentDay];

  const [logData, setLogData] = useState<Record<string, Record<string, LoggedSet[]>>>({});

  const getSetLog = (exerciseId: string, setId: string, setIdx: number, targetReps: number): LoggedSet => {
    return logData[exerciseId]?.[setId]?.[setIdx] || {
      setNumber: setIdx + 1, weight: 0, reps: targetReps, rir: undefined, completed: false,
    };
  };

  const updateSetLog = (exerciseId: string, setId: string, setIdx: number, field: keyof LoggedSet, value: any) => {
    setLogData(prev => {
      const exData = { ...prev[exerciseId] || {} };
      const setArr = [...(exData[setId] || [])];
      setArr[setIdx] = { ...getSetLog(exerciseId, setId, setIdx, 0), ...setArr[setIdx], [field]: value };
      exData[setId] = setArr;
      return { ...prev, [exerciseId]: exData };
    });
  };

  if (!dayData) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Nenhum treino agendado</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">{dayData.name}</h1>
            <p className="text-muted-foreground mt-1">Semana {currentWeek} · {dayData.dayOfWeek} · {dayData.focus}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/train" className="text-xs bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-1">
              <Zap className="w-3 h-3" /> Modo App
            </Link>
            <button onClick={() => setCurrentDay(Math.max(0, currentDay - 1))} disabled={currentDay === 0} className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 disabled:opacity-30 transition-colors">
              <ChevronLeft className="w-4 h-4 text-foreground" />
            </button>
            <span className="text-sm text-muted-foreground font-mono px-2">{currentDay + 1}/{weekData.days.length}</span>
            <button onClick={() => setCurrentDay(Math.min(weekData.days.length - 1, currentDay + 1))} disabled={currentDay === weekData.days.length - 1} className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 disabled:opacity-30 transition-colors">
              <ChevronRight className="w-4 h-4 text-foreground" />
            </button>
          </div>
        </div>
      </motion.div>

      <div className="space-y-4">
        {dayData.exercises.map((exercise, exIdx) => (
          <motion.div
            key={exercise.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: exIdx * 0.05 }}
            className="bg-card rounded-xl border border-border card-elevated overflow-hidden"
          >
            <div className="p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className={cn("w-2 h-8 rounded-full", exercise.category === 'compound' ? 'bg-primary' : 'bg-muted-foreground/40')} />
                <div>
                  <h3 className="font-semibold text-foreground text-sm">{exercise.name}</h3>
                  <p className="text-xs text-muted-foreground">{exercise.muscleGroup}</p>
                </div>
              </div>
            </div>

            <div className="p-4 space-y-3">
              {exercise.sets.map(setGroup => (
                <div key={setGroup.id} className="space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={cn(
                      "text-xs font-medium px-2 py-0.5 rounded",
                      setGroup.type === 'top' ? 'bg-primary/20 text-primary' :
                      setGroup.type === 'backoff' ? 'bg-warning/20 text-warning' :
                      'bg-secondary text-secondary-foreground'
                    )}>
                      {setGroup.type === 'top' ? 'Top Set' : setGroup.type === 'backoff' ? 'Back Off' : 'Trabalho'}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">
                      {setGroup.targetSets}×{setGroup.targetReps}
                      {setGroup.targetRIR !== undefined && ` RIR${setGroup.targetRIR}`}
                      {setGroup.percentage && ` @${setGroup.percentage}%`}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {Array.from({ length: setGroup.targetSets }, (_, i) => {
                      const log = getSetLog(exercise.id, setGroup.id, i, setGroup.targetReps);
                      return (
                        <div key={i} className="flex flex-wrap sm:flex-nowrap items-center gap-2 py-1.5 px-3 rounded-lg bg-secondary/30">
                          <span className="text-xs text-muted-foreground font-mono w-6">{i + 1}</span>
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="text-[9px] text-muted-foreground uppercase">Peso (kg)</span>
                            <div className="flex items-center gap-1">
                              <button onClick={() => updateSetLog(exercise.id, setGroup.id, i, 'weight', Math.max(0, log.weight - 2.5))} className="p-1 rounded hover:bg-secondary transition-colors">
                                <Minus className="w-3 h-3 text-muted-foreground" />
                              </button>
                              <input type="number" value={log.weight || ''} onChange={e => updateSetLog(exercise.id, setGroup.id, i, 'weight', parseFloat(e.target.value) || 0)} placeholder="80" className="w-14 sm:w-16 bg-background border border-border rounded px-2 py-1 text-xs text-center text-foreground font-mono" />
                              <button onClick={() => updateSetLog(exercise.id, setGroup.id, i, 'weight', log.weight + 2.5)} className="p-1 rounded hover:bg-secondary transition-colors">
                                <Plus className="w-3 h-3 text-muted-foreground" />
                              </button>
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground">×</span>
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="text-[9px] text-muted-foreground uppercase">Reps</span>
                            <div className="flex items-center gap-1">
                              <button onClick={() => updateSetLog(exercise.id, setGroup.id, i, 'reps', Math.max(0, log.reps - 1))} className="p-1 rounded hover:bg-secondary transition-colors">
                                <Minus className="w-3 h-3 text-muted-foreground" />
                              </button>
                              <input type="number" value={log.reps} onChange={e => updateSetLog(exercise.id, setGroup.id, i, 'reps', parseInt(e.target.value) || 0)} placeholder="8" className="w-10 sm:w-12 bg-background border border-border rounded px-2 py-1 text-xs text-center text-foreground font-mono" />
                              <button onClick={() => updateSetLog(exercise.id, setGroup.id, i, 'reps', log.reps + 1)} className="p-1 rounded hover:bg-secondary transition-colors">
                                <Plus className="w-3 h-3 text-muted-foreground" />
                              </button>
                            </div>
                          </div>
                          <button
                            onClick={() => updateSetLog(exercise.id, setGroup.id, i, 'completed', !log.completed)}
                            className={cn("ml-auto p-1.5 rounded-lg transition-all", log.completed ? "bg-success text-success-foreground" : "bg-secondary hover:bg-secondary/80")}
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
