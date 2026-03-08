import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Calendar, Target, ChevronDown, ChevronRight, Dumbbell, Power, Loader2, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Program {
  id: string;
  name: string;
  description: string | null;
  program_type: string;
  duration_weeks: number;
  days_per_week: number;
  is_active: boolean;
  start_date: string | null;
  created_at: string;
}

interface Block {
  id: string;
  name: string;
  block_type: string;
  goal: string | null;
  start_week: number;
  end_week: number;
  order_index: number;
}

interface Week {
  id: string;
  week_number: number;
  block_id: string;
}

interface Day {
  id: string;
  day_name: string;
  focus: string | null;
  day_of_week: string | null;
  week_id: string;
  order_index: number;
}

interface WExercise {
  id: string;
  exercise_name: string;
  category: string;
  muscle_group: string | null;
  day_id: string;
  order_index: number;
}

export default function ProgramManagerPage() {
  const { user } = useAuth();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedProgram, setExpandedProgram] = useState<string | null>(null);
  const [programData, setProgramData] = useState<Record<string, { blocks: Block[]; weeks: Week[]; days: Day[]; exercises: WExercise[] }>>({});
  const [loadingStructure, setLoadingStructure] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    if (user) loadPrograms();
  }, [user]);

  const loadPrograms = async () => {
    const { data } = await supabase
      .from('training_programs')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });
    if (data) setPrograms(data as Program[]);
    setLoading(false);
  };

  const toggleExpand = async (programId: string) => {
    if (expandedProgram === programId) {
      setExpandedProgram(null);
      return;
    }
    setExpandedProgram(programId);

    if (programData[programId]) return;

    setLoadingStructure(programId);
    const { data: blocks } = await supabase
      .from('training_blocks')
      .select('*')
      .eq('program_id', programId)
      .order('order_index');

    if (!blocks || blocks.length === 0) {
      setProgramData(prev => ({ ...prev, [programId]: { blocks: [], weeks: [], days: [], exercises: [] } }));
      setLoadingStructure(null);
      return;
    }

    const blockIds = blocks.map(b => b.id);
    const { data: weeks } = await supabase
      .from('training_weeks')
      .select('*')
      .in('block_id', blockIds)
      .order('week_number');

    const weekIds = (weeks || []).map(w => w.id);
    const { data: days } = weekIds.length > 0
      ? await supabase.from('training_days').select('*').in('week_id', weekIds).order('order_index')
      : { data: [] };

    const dayIds = (days || []).map(d => d.id);
    const { data: exercises } = dayIds.length > 0
      ? await supabase.from('workout_exercises').select('*').in('day_id', dayIds).order('order_index')
      : { data: [] };

    setProgramData(prev => ({
      ...prev,
      [programId]: {
        blocks: blocks as Block[],
        weeks: (weeks || []) as Week[],
        days: (days || []) as Day[],
        exercises: (exercises || []) as WExercise[],
      },
    }));
    setLoadingStructure(null);
  };

  const toggleActive = async (program: Program) => {
    setToggling(program.id);
    
    if (!program.is_active) {
      // Deactivate all others first
      await supabase
        .from('training_programs')
        .update({ is_active: false })
        .eq('user_id', user!.id);
    }

    await supabase
      .from('training_programs')
      .update({ is_active: !program.is_active })
      .eq('id', program.id);

    await loadPrograms();
    setToggling(null);
    toast.success(program.is_active ? 'Programa desativado' : 'Programa ativado!');
  };

  const typeLabel: Record<string, string> = {
    powerbuilding: 'Powerbuilding',
    strength: 'Força',
    hypertrophy: 'Hipertrofia',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Meus Programas</h1>
        <p className="text-muted-foreground mt-1">{programs.length} programa(s) salvos</p>
      </motion.div>

      {programs.length === 0 ? (
        <div className="text-center py-16">
          <Calendar className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">Nenhum programa salvo. Gere um programa com IA!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {programs.map(program => {
            const isExpanded = expandedProgram === program.id;
            const data = programData[program.id];

            return (
              <motion.div
                key={program.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-xl border border-border card-elevated overflow-hidden"
              >
                {/* Header */}
                <div className="flex items-center gap-3 p-4 sm:p-5">
                  <button onClick={() => toggleExpand(program.id)} className="flex-1 flex items-center gap-3 text-left">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                      program.is_active ? "bg-success/20" : "bg-secondary"
                    )}>
                      <Target className={cn("w-5 h-5", program.is_active ? "text-success" : "text-muted-foreground")} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground text-sm truncate">{program.name}</p>
                        {program.is_active && (
                          <span className="text-[10px] bg-success/20 text-success px-1.5 py-0.5 rounded font-bold uppercase shrink-0">Ativo</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {typeLabel[program.program_type] || program.program_type} · {program.duration_weeks} sem · {program.days_per_week}x/sem
                      </p>
                      {program.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{program.description}</p>
                      )}
                    </div>
                  </button>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => toggleActive(program)}
                      disabled={toggling === program.id}
                      className={cn(
                        "p-2 rounded-lg transition-colors",
                        program.is_active
                          ? "bg-success/20 text-success hover:bg-success/30"
                          : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                      )}
                      title={program.is_active ? 'Desativar' : 'Ativar'}
                    >
                      {toggling === program.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : program.is_active ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Power className="w-4 h-4" />
                      )}
                    </button>
                    <button onClick={() => toggleExpand(program.id)} className="p-2 text-muted-foreground hover:text-foreground">
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Structure */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-border overflow-hidden"
                    >
                      {loadingStructure === program.id ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="w-5 h-5 animate-spin text-primary" />
                        </div>
                      ) : !data || data.blocks.length === 0 ? (
                        <div className="p-6 text-center text-sm text-muted-foreground">
                          Estrutura não encontrada. O programa pode ter sido gerado sem persistência no banco.
                        </div>
                      ) : (
                        <ProgramStructure data={data} />
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ProgramStructure({ data }: { data: { blocks: Block[]; weeks: Week[]; days: Day[]; exercises: WExercise[] } }) {
  const [expandedBlock, setExpandedBlock] = useState<string | null>(data.blocks[0]?.id || null);
  const [expandedWeek, setExpandedWeek] = useState<string | null>(null);

  return (
    <div className="divide-y divide-border">
      {data.blocks.map(block => {
        const blockWeeks = data.weeks.filter(w => w.block_id === block.id);
        const isExpanded = expandedBlock === block.id;

        return (
          <div key={block.id}>
            <button
              onClick={() => setExpandedBlock(isExpanded ? null : block.id)}
              className="w-full flex items-center justify-between px-4 sm:px-5 py-3 hover:bg-secondary/20 transition-colors"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-sm font-medium text-foreground">{block.name}</span>
                <span className="text-[10px] bg-secondary text-muted-foreground px-1.5 py-0.5 rounded capitalize">
                  {block.block_type}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Sem {block.start_week}–{block.end_week}</span>
                {isExpanded ? <ChevronDown className="w-3 h-3 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 text-muted-foreground" />}
              </div>
            </button>

            {isExpanded && (
              <div className="pl-4 sm:pl-6">
                {blockWeeks.map(week => {
                  const weekDays = data.days.filter(d => d.week_id === week.id);
                  const isWeekExpanded = expandedWeek === week.id;

                  return (
                    <div key={week.id} className="border-t border-border/50">
                      <button
                        onClick={() => setExpandedWeek(isWeekExpanded ? null : week.id)}
                        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-secondary/10 transition-colors text-sm"
                      >
                        <span className="text-muted-foreground">Semana {week.week_number}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{weekDays.length} dias</span>
                          {isWeekExpanded ? <ChevronDown className="w-3 h-3 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 text-muted-foreground" />}
                        </div>
                      </button>

                      {isWeekExpanded && (
                        <div className="pl-3 pb-3 space-y-2">
                          {weekDays.map(day => {
                            const dayExercises = data.exercises.filter(e => e.day_id === day.id);
                            return (
                              <div key={day.id} className="p-3 rounded-lg bg-secondary/30">
                                <div className="flex items-center justify-between mb-2">
                                  <p className="text-xs font-medium text-foreground">{day.day_name}</p>
                                  {day.focus && <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">{day.focus}</span>}
                                </div>
                                <div className="space-y-1">
                                  {dayExercises.map(ex => (
                                    <div key={ex.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                                      <Dumbbell className="w-3 h-3 shrink-0" />
                                      <span>{ex.exercise_name}</span>
                                      <span className="text-[10px] capitalize bg-secondary px-1 py-0.5 rounded">{ex.category}</span>
                                    </div>
                                  ))}
                                  {dayExercises.length === 0 && (
                                    <p className="text-xs text-muted-foreground/50">Sem exercícios registrados</p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
