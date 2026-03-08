import { motion } from 'framer-motion';
import { useState } from 'react';
import { Sparkles, Loader2, ChevronDown, ChevronRight, Dumbbell, Target, Zap, Brain } from 'lucide-react';
import { useTraining } from '@/contexts/TrainingContext';
import { calculate1RM } from '@/data/defaultProfile';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface GeneratedProgram {
  name: string;
  description: string;
  durationWeeks: number;
  blocks: {
    name: string;
    goal: string;
    weekRange: string;
    weeks: {
      weekNumber: number;
      days: {
        name: string;
        dayOfWeek: string;
        focus: string;
        exercises: {
          name: string;
          category: string;
          muscleGroup: string;
          sets: {
            type: string;
            targetSets: number;
            targetReps: number;
            targetRIR?: number;
            targetWeight?: number;
            percentage?: number;
            restSeconds?: number;
          }[];
        }[];
      }[];
    }[];
  }[];
}

export default function ProgramGenerator() {
  const { profile } = useTraining();
  const squat1RM = calculate1RM(profile.currentLifts.squat.weight, profile.currentLifts.squat.reps);
  const bench1RM = calculate1RM(profile.currentLifts.bench.weight, profile.currentLifts.bench.reps);
  const deadlift1RM = calculate1RM(profile.currentLifts.deadlift.weight, profile.currentLifts.deadlift.reps);

  const [squat, setSquat] = useState(squat1RM);
  const [bench, setBench] = useState(bench1RM);
  const [deadlift, setDeadlift] = useState(deadlift1RM);
  const [bodyWeight, setBodyWeight] = useState(profile.bodyWeight);
  const [goal, setGoal] = useState('powerbuilding');
  const [frequency, setFrequency] = useState(5);
  const [usePredictions, setUsePredictions] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [program, setProgram] = useState<GeneratedProgram | null>(null);
  const [expandedBlock, setExpandedBlock] = useState<number | null>(null);
  const [expandedWeek, setExpandedWeek] = useState<string | null>(null);

  const generate = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-program', {
        body: { squat1RM: squat, bench1RM: bench, deadlift1RM: deadlift, bodyWeight, goal, frequency, usePredictions },
      });
      if (error) throw error;
      if (data?.program) {
        setProgram(data.program);
        setExpandedBlock(0);
        toast.success(usePredictions ? 'Programa gerado com predições IA!' : 'Programa gerado com sucesso!');
      } else if (data?.error) {
        throw new Error(data.error);
      }
    } catch (err: any) {
      toast.error(err.message || 'Falha ao gerar programa');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Gerar Programa</h1>
        <p className="text-muted-foreground mt-1">Programa personalizado baseado nos seus PRs</p>
      </motion.div>

      {/* Input Form */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-xl border border-border p-5 sm:p-6 card-elevated space-y-5">
        
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" /> Seus 1RMs Estimados
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Agachamento', value: squat, set: setSquat },
            { label: 'Supino', value: bench, set: setBench },
            { label: 'Terra', value: deadlift, set: setDeadlift },
          ].map(({ label, value, set }) => (
            <div key={label}>
              <label className="text-xs text-muted-foreground block mb-1.5">{label} 1RM (kg)</label>
              <input
                type="number"
                value={value}
                onChange={e => set(parseFloat(e.target.value) || 0)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground font-mono text-center focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">Peso Corporal (kg)</label>
            <input
              type="number"
              value={bodyWeight}
              onChange={e => setBodyWeight(parseFloat(e.target.value) || 0)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground font-mono text-center focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">Objetivo</label>
            <select
              value={goal}
              onChange={e => setGoal(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="powerbuilding">Powerbuilding</option>
              <option value="strength">Força</option>
              <option value="hypertrophy">Hipertrofia</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">Dias por Semana</label>
            <select
              value={frequency}
              onChange={e => setFrequency(parseInt(e.target.value))}
              className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value={3}>3 dias</option>
              <option value={4}>4 dias</option>
              <option value={5}>5 dias</option>
              <option value={6}>6 dias</option>
            </select>
          </div>
        </div>

        {/* Prediction Toggle */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/20">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-primary" />
            <div>
              <p className="text-sm font-medium text-foreground">Usar Predições IA</p>
              <p className="text-[10px] text-muted-foreground">Ajusta cargas baseado no seu histórico de progressão</p>
            </div>
          </div>
          <button
            onClick={() => setUsePredictions(!usePredictions)}
            className={cn("w-11 h-6 rounded-full transition-colors relative",
              usePredictions ? "bg-primary" : "bg-secondary"
            )}
          >
            <div className={cn("absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform",
              usePredictions ? "translate-x-5" : "translate-x-0.5"
            )} />
          </button>
        </div>

        <button
          onClick={generate}
          disabled={generating}
          className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-medium text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {usePredictions ? 'Gerando com predições IA...' : 'Gerando programa com IA...'}
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              {usePredictions ? 'Gerar com Predições IA' : 'Gerar Programa Personalizado'}
            </>
          )}
        </button>
      </motion.div>

      {/* Generated Program */}
      {program && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="bg-card rounded-xl border border-border p-5 sm:p-6 card-elevated">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Dumbbell className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-bold text-foreground">{program.name}</h2>
                <p className="text-xs text-muted-foreground">{program.description}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{program.durationWeeks} semanas · {program.blocks.length} blocos</p>
          </div>

          {program.blocks.map((block, bIdx) => (
            <div key={bIdx} className="bg-card rounded-xl border border-border card-elevated overflow-hidden">
              <button
                onClick={() => setExpandedBlock(expandedBlock === bIdx ? null : bIdx)}
                className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-secondary/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-foreground text-sm">{block.name}</p>
                    <p className="text-xs text-muted-foreground">{block.weekRange} · {block.goal}</p>
                  </div>
                </div>
                {expandedBlock === bIdx ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
              </button>

              {expandedBlock === bIdx && (
                <div className="border-t border-border">
                  {block.weeks.map(week => {
                    const weekKey = `${bIdx}-${week.weekNumber}`;
                    return (
                      <div key={weekKey} className="border-b border-border last:border-0">
                        <button
                          onClick={() => setExpandedWeek(expandedWeek === weekKey ? null : weekKey)}
                          className="w-full flex items-center justify-between px-4 sm:px-5 py-3 hover:bg-secondary/20 transition-colors"
                        >
                          <span className="text-sm text-foreground font-medium">Semana {week.weekNumber}</span>
                          {expandedWeek === weekKey ? <ChevronDown className="w-3 h-3 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 text-muted-foreground" />}
                        </button>

                        {expandedWeek === weekKey && (
                          <div className="px-4 sm:px-5 pb-4 space-y-3">
                            {week.days.map((day, dIdx) => (
                              <div key={dIdx} className="p-3 rounded-lg bg-secondary/30">
                                <p className="text-sm font-medium text-foreground">{day.dayOfWeek} — {day.name}</p>
                                <p className="text-xs text-muted-foreground mb-2">{day.focus}</p>
                                <div className="space-y-1">
                                  {day.exercises.map((ex, eIdx) => (
                                    <div key={eIdx} className="flex items-center justify-between py-1 px-2 rounded bg-background/50">
                                      <div className="flex items-center gap-2">
                                        <div className={cn("w-1.5 h-1.5 rounded-full", ex.category === 'compound' ? 'bg-primary' : 'bg-muted-foreground')} />
                                        <span className="text-xs text-foreground">{ex.name}</span>
                                      </div>
                                      <span className="text-[10px] text-muted-foreground font-mono">
                                        {ex.sets.map(s => {
                                          let label = `${s.targetSets}×${s.targetReps}`;
                                          if (s.targetWeight) label += ` ${s.targetWeight}kg`;
                                          if (s.targetRIR !== undefined) label += ` R${s.targetRIR}`;
                                          return label;
                                        }).join(' + ')}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
