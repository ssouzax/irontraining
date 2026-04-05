import { motion } from 'framer-motion';
import { useState } from 'react';
import { Sparkles, Loader2, ChevronDown, ChevronRight, Dumbbell, Target, Zap, Brain, AlertTriangle, Clock, User, CheckCircle2, Play } from 'lucide-react';
import { useTraining } from '@/contexts/TrainingContext';
import { calculate1RM } from '@/data/defaultProfile';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

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

const goalOptions = [
  { value: 'powerbuilding', label: 'Powerbuilding', desc: 'Força + hipertrofia' },
  { value: 'strength', label: 'Força Máxima', desc: 'Foco em 1RM' },
  { value: 'hypertrophy', label: 'Hipertrofia', desc: 'Ganho muscular' },
  { value: 'recomp', label: 'Recomposição', desc: 'Perda de gordura + ganho muscular' },
  { value: 'endurance', label: 'Resistência Muscular', desc: 'Alta repetição' },
];

const experienceLevels = [
  { value: 'beginner', label: 'Iniciante', desc: 'Menos de 1 ano' },
  { value: 'intermediate', label: 'Intermediário', desc: '1 a 3 anos' },
  { value: 'advanced', label: 'Avançado', desc: '3+ anos' },
];

const equipmentOptions = [
  { value: 'full', label: 'Academia completa' },
  { value: 'limited', label: 'Academia limitada' },
  { value: 'home', label: 'Treino em casa' },
];

const injuryOptions = [
  { value: 'none', label: 'Nenhuma' },
  { value: 'shoulder', label: 'Ombro' },
  { value: 'knee', label: 'Joelho' },
  { value: 'lower_back', label: 'Lombar' },
  { value: 'wrist', label: 'Punho' },
  { value: 'hip', label: 'Quadril' },
];

const focusOptions = [
  { value: 'none', label: 'Equilibrado' },
  { value: 'chest', label: 'Peito' },
  { value: 'back', label: 'Costas' },
  { value: 'legs', label: 'Pernas' },
  { value: 'glutes', label: 'Glúteos' },
  { value: 'arms', label: 'Braços' },
  { value: 'shoulders', label: 'Ombros' },
];

export default function ProgramGenerator() {
  const { profile, loadActiveProgram } = useTraining();
  const navigate = useNavigate();
  const squat1RM = calculate1RM(profile.currentLifts.squat.weight, profile.currentLifts.squat.reps);
  const bench1RM = calculate1RM(profile.currentLifts.bench.weight, profile.currentLifts.bench.reps);
  const deadlift1RM = calculate1RM(profile.currentLifts.deadlift.weight, profile.currentLifts.deadlift.reps);

  const [squat, setSquat] = useState(squat1RM);
  const [bench, setBench] = useState(bench1RM);
  const [deadlift, setDeadlift] = useState(deadlift1RM);
  const [bodyWeight, setBodyWeight] = useState(profile.bodyWeight);
  const [age, setAge] = useState(25);
  const [height, setHeight] = useState(175);
  const [sex, setSex] = useState('male');
  const [goal, setGoal] = useState('powerbuilding');
  const [frequency, setFrequency] = useState(5);
  const [experience, setExperience] = useState('intermediate');
  const [equipment, setEquipment] = useState('full');
  const [sessionTime, setSessionTime] = useState(60);
  const [injuries, setInjuries] = useState<string[]>(['none']);
  const [muscleFocus, setMuscleFocus] = useState('none');
  const [preferDumbell, setPreferDumbell] = useState(false);
  const [usePredictions, setUsePredictions] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState('');
  const [program, setProgram] = useState<GeneratedProgram | null>(null);
  const [expandedBlock, setExpandedBlock] = useState<number | null>(null);
  const [expandedWeek, setExpandedWeek] = useState<string | null>(null);

  const toggleInjury = (val: string) => {
    if (val === 'none') {
      setInjuries(['none']);
    } else {
      setInjuries(prev => {
        const without = prev.filter(v => v !== 'none');
        return without.includes(val) ? without.filter(v => v !== val) : [...without, val];
      });
    }
  };

  const generate = async () => {
    setGenerating(true);
    setGenerationStatus('Construindo estrutura do programa...');
    setProgram(null);
    try {
      setGenerationStatus('Gerando exercícios bloco a bloco com IA...');
      const { data, error } = await supabase.functions.invoke('generate-program', {
        body: {
          squat1RM: squat, bench1RM: bench, deadlift1RM: deadlift,
          bodyWeight, age, height, sex, goal, frequency, experience,
          equipment, sessionTime, injuries: injuries.filter(i => i !== 'none'),
          muscleFocus, usePredictions, preferDumbell,
        },
      });
      if (error) throw error;
      if (data?.program) {
        setProgram(data.program);
        setExpandedBlock(0);
        setGenerationStatus('');
        const totalDays = data.program.blocks.reduce(
          (acc: number, b: any) => acc + b.weeks.reduce((wa: number, w: any) => wa + (w.days?.length || 0), 0), 0
        );
        const totalExercises = data.program.blocks.reduce(
          (acc: number, b: any) => acc + b.weeks.reduce(
            (wa: number, w: any) => wa + w.days.reduce((da: number, d: any) => da + (d.exercises?.length || 0), 0), 0
          ), 0
        );
        toast.success(`Programa completo: ${data.program.durationWeeks} semanas, ${totalDays} treinos, ${totalExercises} exercícios!`);
        // Auto-load into training context
        await loadActiveProgram();
      } else if (data?.error) {
        throw new Error(data.error);
      }
    } catch (err: any) {
      toast.error(err.message || 'Falha ao gerar programa');
      setGenerationStatus('');
    } finally {
      setGenerating(false);
    }
  };

  const InputField = ({ label, value, onChange, type = 'number', placeholder = '' }: any) => (
    <div>
      <label className="text-xs text-muted-foreground block mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground font-mono text-center focus:outline-none focus:ring-1 focus:ring-primary"
      />
    </div>
  );

  const SelectField = ({ label, value, onChange, children }: any) => (
    <div>
      <label className="text-xs text-muted-foreground block mb-1.5">{label}</label>
      <select
        value={value}
        onChange={onChange}
        className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
      >
        {children}
      </select>
    </div>
  );

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Gerar Programa</h1>
        <p className="text-muted-foreground mt-1">Programa personalizado com periodização profissional</p>
      </motion.div>

      {/* Section 1: Personal Data */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="bg-card rounded-xl border border-border p-5 card-elevated space-y-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <User className="w-4 h-4 text-primary" /> Dados Pessoais
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <InputField label="Peso (kg)" value={bodyWeight} onChange={(e: any) => setBodyWeight(parseFloat(e.target.value) || 0)} placeholder="80" />
          <InputField label="Altura (cm)" value={height} onChange={(e: any) => setHeight(parseInt(e.target.value) || 0)} placeholder="175" />
          <InputField label="Idade" value={age} onChange={(e: any) => setAge(parseInt(e.target.value) || 0)} placeholder="25" />
          <SelectField label="Sexo" value={sex} onChange={(e: any) => setSex(e.target.value)}>
            <option value="male">Masculino</option>
            <option value="female">Feminino</option>
          </SelectField>
        </div>
      </motion.div>

      {/* Section 2: 1RMs */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-card rounded-xl border border-border p-5 card-elevated space-y-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" /> 1RMs Estimados
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <InputField label="Agachamento (kg)" value={squat} onChange={(e: any) => setSquat(parseFloat(e.target.value) || 0)} placeholder="140" />
          <InputField label="Supino (kg)" value={bench} onChange={(e: any) => setBench(parseFloat(e.target.value) || 0)} placeholder="100" />
          <InputField label="Levantamento terra (kg)" value={deadlift} onChange={(e: any) => setDeadlift(parseFloat(e.target.value) || 0)} placeholder="180" />
        </div>
        <p className="text-[10px] text-muted-foreground">Se não souber, coloque 0 e o sistema estimará baseado no seu nível.</p>
      </motion.div>

      {/* Section 3: Experience */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="bg-card rounded-xl border border-border p-5 card-elevated space-y-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Dumbbell className="w-4 h-4 text-primary" /> Nível de Experiência
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {experienceLevels.map(lvl => (
            <button key={lvl.value} onClick={() => setExperience(lvl.value)}
              className={cn("p-3 rounded-xl border text-center transition-all",
                experience === lvl.value ? "border-primary bg-primary/5" : "border-border hover:bg-secondary/50"
              )}>
              <p className="text-sm font-medium text-foreground">{lvl.label}</p>
              <p className="text-[10px] text-muted-foreground">{lvl.desc}</p>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Section 4: Goal */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="bg-card rounded-xl border border-border p-5 card-elevated space-y-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" /> Objetivo Principal
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {goalOptions.map(g => (
            <button key={g.value} onClick={() => setGoal(g.value)}
              className={cn("p-3 rounded-xl border text-left transition-all",
                goal === g.value ? "border-primary bg-primary/5" : "border-border hover:bg-secondary/50"
              )}>
              <p className="text-sm font-medium text-foreground">{g.label}</p>
              <p className="text-[10px] text-muted-foreground">{g.desc}</p>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Section 5: Training Preferences */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        className="bg-card rounded-xl border border-border p-5 card-elevated space-y-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" /> Preferências de Treino
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <SelectField label="Dias por semana" value={frequency} onChange={(e: any) => setFrequency(parseInt(e.target.value))}>
            {[2, 3, 4, 5, 6, 7].map(d => <option key={d} value={d}>{d} dias</option>)}
          </SelectField>
          <SelectField label="Tempo por sessão" value={sessionTime} onChange={(e: any) => setSessionTime(parseInt(e.target.value))}>
            <option value={45}>45 minutos</option>
            <option value={60}>60 minutos</option>
            <option value={90}>90 minutos</option>
            <option value={120}>120+ minutos</option>
          </SelectField>
          <SelectField label="Equipamento disponível" value={equipment} onChange={(e: any) => setEquipment(e.target.value)}>
            {equipmentOptions.map(eq => <option key={eq.value} value={eq.value}>{eq.label}</option>)}
          </SelectField>
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border">
          <div>
            <p className="text-sm font-medium text-foreground">Preferir halteres</p>
            <p className="text-xs text-muted-foreground">Substitui barra por halteres sempre que possível</p>
          </div>
          <button
            onClick={() => setPreferDumbell(prev => !prev)}
            className={cn(
              "relative w-11 h-6 rounded-full transition-colors duration-200",
              preferDumbell ? "bg-primary" : "bg-muted-foreground/30"
            )}
          >
            <span className={cn(
              "absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200",
              preferDumbell ? "translate-x-5" : "translate-x-0"
            )} />
          </button>
        </div>
      </motion.div>

      {/* Section 6: Focus & Injuries */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="bg-card rounded-xl border border-border p-5 card-elevated space-y-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-primary" /> Foco Muscular e Limitações
        </h3>
        <div>
          <label className="text-xs text-muted-foreground block mb-2">Prioridade muscular (opcional)</label>
          <div className="flex flex-wrap gap-2">
            {focusOptions.map(f => (
              <button key={f.value} onClick={() => setMuscleFocus(f.value)}
                className={cn("px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                  muscleFocus === f.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:bg-secondary/50"
                )}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-2">Lesões ou limitações</label>
          <div className="flex flex-wrap gap-2">
            {injuryOptions.map(inj => (
              <button key={inj.value} onClick={() => toggleInjury(inj.value)}
                className={cn("px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                  injuries.includes(inj.value)
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:bg-secondary/50"
                )}>
                {inj.label}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Prediction Toggle */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
        className="flex items-center justify-between p-4 rounded-xl bg-primary/5 border border-primary/20">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-primary" />
          <div>
            <p className="text-sm font-medium text-foreground">Usar Predições IA</p>
            <p className="text-[10px] text-muted-foreground">Ajusta cargas baseado no seu histórico</p>
          </div>
        </div>
        <button
          onClick={() => setUsePredictions(!usePredictions)}
          className={cn("w-11 h-6 rounded-full transition-colors relative",
            usePredictions ? "bg-primary" : "bg-secondary"
          )}>
          <div className={cn("absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform",
            usePredictions ? "translate-x-5" : "translate-x-0.5"
          )} />
        </button>
      </motion.div>

      {/* Generate Button */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <button
          onClick={generate}
          disabled={generating}
          className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-semibold text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Gerando programa completo...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Gerar Programa Profissional (12 semanas)
            </>
          )}
        </button>

        {/* Generation progress */}
        {generating && generationStatus && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-3 p-4 rounded-xl bg-card border border-border space-y-3"
          >
            <div className="flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">{generationStatus}</p>
            </div>
            <div className="space-y-1.5">
              {['Estrutura do programa', 'Bloco Hipertrofia', 'Bloco Força', 'Bloco Intensificação', 'Bloco PR/Deload', 'Validação e salvamento'].map((step, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className={cn("w-1.5 h-1.5 rounded-full", i === 0 ? 'bg-primary' : 'bg-muted')} />
                  <span className="text-[10px] text-muted-foreground">{step}</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground italic">
              A IA gera cada bloco separadamente para garantir programa 100% completo. Isso pode levar 30-60 segundos.
            </p>
          </motion.div>
        )}
      </motion.div>

      {/* Generated Program Display */}
      {program && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="bg-card rounded-xl border border-border p-5 card-elevated">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-bold text-foreground">{program.name}</h2>
                <p className="text-xs text-muted-foreground">{program.description}</p>
              </div>
            </div>
            <div className="flex gap-3 mt-3">
              <div className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium">
                {program.durationWeeks} semanas
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium">
                {program.blocks.length} blocos
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium">
                {program.blocks.reduce((a, b) => a + b.weeks.reduce((wa, w) => wa + w.days.length, 0), 0)} treinos
              </div>
            </div>
          </div>

          {program.blocks.map((block, bIdx) => (
            <div key={bIdx} className="bg-card rounded-xl border border-border card-elevated overflow-hidden">
              <button
                onClick={() => setExpandedBlock(expandedBlock === bIdx ? null : bIdx)}
                className="w-full flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors"
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
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">{block.weeks.length} sem</span>
                  {expandedBlock === bIdx ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                </div>
              </button>

              {expandedBlock === bIdx && (
                <div className="border-t border-border">
                  {block.weeks.map(week => {
                    const weekKey = `${bIdx}-${week.weekNumber}`;
                    return (
                      <div key={weekKey} className="border-b border-border last:border-0">
                        <button
                          onClick={() => setExpandedWeek(expandedWeek === weekKey ? null : weekKey)}
                          className="w-full flex items-center justify-between px-4 py-3 hover:bg-secondary/20 transition-colors"
                        >
                          <span className="text-sm text-foreground font-medium">Semana {week.weekNumber}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground">{week.days?.length || 0} dias</span>
                            {expandedWeek === weekKey ? <ChevronDown className="w-3 h-3 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 text-muted-foreground" />}
                          </div>
                        </button>

                        {expandedWeek === weekKey && (
                          <div className="px-4 pb-4 space-y-3">
                            {(week.days || []).map((day, dIdx) => (
                              <div key={dIdx} className="p-3 rounded-lg bg-secondary/30">
                                <p className="text-sm font-medium text-foreground">{day.dayOfWeek} — {day.name}</p>
                                <p className="text-xs text-muted-foreground mb-2">{day.focus}</p>
                                <div className="space-y-1">
                                  {(day.exercises || []).map((ex, eIdx) => (
                                    <div key={eIdx} className="flex items-center justify-between py-1 px-2 rounded bg-background/50">
                                      <div className="flex items-center gap-2">
                                        <div className={cn("w-1.5 h-1.5 rounded-full", ex.category === 'compound' ? 'bg-primary' : 'bg-muted-foreground')} />
                                        <span className="text-xs text-foreground">{ex.name}</span>
                                      </div>
                                      <span className="text-[10px] text-muted-foreground font-mono">
                                        {(ex.sets || []).map(s => {
                                          let label = `${s.targetSets}×${s.targetReps}`;
                                          if (s.targetWeight) label += ` ${s.targetWeight}kg`;
                                          if (s.targetRIR !== undefined) label += ` R${s.targetRIR}`;
                                          return label;
                                        }).join(' + ')}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                                <p className="text-[10px] text-muted-foreground mt-1">{(day.exercises || []).length} exercícios</p>
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
