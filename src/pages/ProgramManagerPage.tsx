import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { Calendar, Target, ChevronDown, ChevronRight, Dumbbell, Power, Loader2, Check, X, Upload, FileText, FileJson, FileSpreadsheet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

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

interface ParsedSet {
  target_sets: number;
  target_reps: number;
  target_rir?: number;
  load_percentage?: number;
  is_top_set?: boolean;
  is_backoff?: boolean;
  rest_seconds?: number;
  notes?: string;
}

interface ParsedExercise {
  exercise_name: string;
  category: string;
  muscle_group: string;
  sets: ParsedSet[];
}

interface ParsedDay {
  day_name: string;
  focus?: string;
  day_of_week?: string;
  exercises: ParsedExercise[];
}

interface ParsedWeek {
  week_number: number;
  days: ParsedDay[];
}

interface ParsedBlock {
  name: string;
  block_type: string;
  goal?: string;
  start_week: number;
  end_week: number;
  weeks: ParsedWeek[];
}

interface ParsedProgram {
  name: string;
  description?: string;
  program_type: string;
  duration_weeks: number;
  days_per_week: number;
  blocks: ParsedBlock[];
}

export default function ProgramManagerPage() {
  const { user } = useAuth();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedProgram, setExpandedProgram] = useState<string | null>(null);
  const [programData, setProgramData] = useState<Record<string, { blocks: Block[]; weeks: Week[]; days: Day[]; exercises: WExercise[] }>>({});
  const [loadingStructure, setLoadingStructure] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  // Import state
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [parsedProgram, setParsedProgram] = useState<ParsedProgram | null>(null);
  const [savingImport, setSavingImport] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      'application/pdf',
      'application/json',
      'text/plain',
      'text/csv',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ];

    // Also check by extension for better compatibility
    const allowedExtensions = ['.pdf', '.json', '.txt', '.csv', '.doc', '.docx'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      toast.error('Formato não suportado. Use PDF, Word, JSON, TXT ou CSV.');
      return;
    }

    setImportLoading(true);
    setParsedProgram(null);

    try {
      let fileContent = '';

      if (file.type === 'application/json' || fileExtension === '.json') {
        fileContent = await file.text();
        // Try to parse directly if it's already in our format
        try {
          const parsed = JSON.parse(fileContent);
          if (parsed.name && parsed.blocks && Array.isArray(parsed.blocks)) {
            setParsedProgram(parsed as ParsedProgram);
            setImportLoading(false);
            return;
          }
        } catch {
          // Not our format, send to AI
        }
      }

      // Read file content
      if (file.type.includes('text') || fileExtension === '.txt' || fileExtension === '.csv') {
        fileContent = await file.text();
      } else {
        // For binary files (PDF, Word), convert to base64 and let AI handle it
        // Note: For production, you'd want a proper document parser
        const arrayBuffer = await file.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        
        // For PDFs and Word docs, we'll extract what text we can
        // This is a simplified approach - in production use a proper parser
        if (file.type === 'application/json' || fileExtension === '.json') {
          fileContent = await file.text();
        } else {
          // Try to extract readable text from binary
          fileContent = binary.replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/\s+/g, ' ').trim();
          if (fileContent.length < 100) {
            toast.error('Não foi possível ler o conteúdo do arquivo. Tente um formato de texto.');
            setImportLoading(false);
            return;
          }
        }
      }

      // Call edge function to parse with AI
      const { data, error } = await supabase.functions.invoke('parse-program', {
        body: {
          fileContent: fileContent.substring(0, 50000), // Limit content size
          fileName: file.name,
          fileType: file.type || fileExtension,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Falha ao processar arquivo');

      setParsedProgram(data.program);
      toast.success('Programa importado! Revise antes de salvar.');

    } catch (error: any) {
      console.error('Import error:', error);
      toast.error(error.message || 'Erro ao importar programa');
    } finally {
      setImportLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const saveImportedProgram = async () => {
    if (!parsedProgram || !user) return;

    setSavingImport(true);
    try {
      // Create program
      const { data: prog, error: progError } = await supabase
        .from('training_programs')
        .insert({
          user_id: user.id,
          name: parsedProgram.name,
          description: parsedProgram.description || null,
          program_type: parsedProgram.program_type,
          duration_weeks: parsedProgram.duration_weeks,
          days_per_week: parsedProgram.days_per_week,
          is_active: false,
        })
        .select()
        .single();

      if (progError) throw progError;

      // Create blocks
      for (let bIdx = 0; bIdx < parsedProgram.blocks.length; bIdx++) {
        const block = parsedProgram.blocks[bIdx];

        const { data: blk, error: blkError } = await supabase
          .from('training_blocks')
          .insert({
            program_id: prog.id,
            name: block.name,
            block_type: block.block_type,
            goal: block.goal || null,
            start_week: block.start_week,
            end_week: block.end_week,
            order_index: bIdx,
          })
          .select()
          .single();

        if (blkError) throw blkError;

        // Create weeks
        for (const week of block.weeks) {
          const { data: wk, error: wkError } = await supabase
            .from('training_weeks')
            .insert({
              block_id: blk.id,
              week_number: week.week_number,
            })
            .select()
            .single();

          if (wkError) throw wkError;

          // Create days
          for (let dIdx = 0; dIdx < week.days.length; dIdx++) {
            const day = week.days[dIdx];

            const { data: dy, error: dyError } = await supabase
              .from('training_days')
              .insert({
                week_id: wk.id,
                day_name: day.day_name,
                focus: day.focus || null,
                day_of_week: day.day_of_week || null,
                order_index: dIdx,
              })
              .select()
              .single();

            if (dyError) throw dyError;

            // Create exercises
            for (let eIdx = 0; eIdx < day.exercises.length; eIdx++) {
              const ex = day.exercises[eIdx];

              const { data: exData, error: exError } = await supabase
                .from('workout_exercises')
                .insert({
                  day_id: dy.id,
                  exercise_name: ex.exercise_name,
                  category: ex.category,
                  muscle_group: ex.muscle_group,
                  order_index: eIdx,
                })
                .select()
                .single();

              if (exError) throw exError;

              // Create planned sets
              for (let sIdx = 0; sIdx < ex.sets.length; sIdx++) {
                const set = ex.sets[sIdx];
                await supabase.from('planned_sets').insert({
                  workout_exercise_id: exData.id,
                  set_number: sIdx + 1,
                  target_sets: set.target_sets,
                  target_reps: set.target_reps,
                  target_rir: set.target_rir || null,
                  load_percentage: set.load_percentage || null,
                  is_top_set: set.is_top_set || false,
                  is_backoff: set.is_backoff || false,
                  rest_seconds: set.rest_seconds || 120,
                  notes: set.notes || null,
                });
              }
            }
          }
        }
      }

      toast.success('Programa salvo com sucesso!');
      setParsedProgram(null);
      setImportModalOpen(false);
      loadPrograms();

    } catch (error: any) {
      console.error('Save error:', error);
      toast.error('Erro ao salvar programa: ' + error.message);
    } finally {
      setSavingImport(false);
    }
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
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Meus Programas</h1>
          <p className="text-muted-foreground mt-1">{programs.length} programa(s) salvos</p>
        </div>
        <Button onClick={() => setImportModalOpen(true)} variant="outline" className="gap-2">
          <Upload className="w-4 h-4" />
          Importar
        </Button>
      </motion.div>

      {programs.length === 0 ? (
        <div className="text-center py-16">
          <Calendar className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">Nenhum programa salvo. Gere um programa com IA ou importe!</p>
          <Button onClick={() => setImportModalOpen(true)} variant="outline" className="gap-2">
            <Upload className="w-4 h-4" />
            Importar Programa
          </Button>
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

      {/* Import Modal */}
      <Dialog open={importModalOpen} onOpenChange={setImportModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Importar Programa de Treino</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {!parsedProgram ? (
              <>
                <p className="text-sm text-muted-foreground">
                  Selecione um arquivo com seu programa de treino. Formatos suportados: PDF, Word, JSON, TXT, CSV.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-secondary/50 text-center">
                    <FileText className="w-8 h-8 text-red-500" />
                    <span className="text-xs text-muted-foreground">PDF</span>
                  </div>
                  <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-secondary/50 text-center">
                    <FileText className="w-8 h-8 text-blue-500" />
                    <span className="text-xs text-muted-foreground">Word</span>
                  </div>
                  <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-secondary/50 text-center">
                    <FileJson className="w-8 h-8 text-yellow-500" />
                    <span className="text-xs text-muted-foreground">JSON</span>
                  </div>
                  <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-secondary/50 text-center">
                    <FileSpreadsheet className="w-8 h-8 text-green-500" />
                    <span className="text-xs text-muted-foreground">TXT/CSV</span>
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.json,.txt,.csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={importLoading}
                  className="w-full gap-2"
                  size="lg"
                >
                  {importLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Selecionar Arquivo
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <div className="p-4 rounded-lg bg-success/10 border border-success/20">
                  <h3 className="font-semibold text-foreground">{parsedProgram.name}</h3>
                  {parsedProgram.description && (
                    <p className="text-sm text-muted-foreground mt-1">{parsedProgram.description}</p>
                  )}
                  <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                    <span>{typeLabel[parsedProgram.program_type] || parsedProgram.program_type}</span>
                    <span>·</span>
                    <span>{parsedProgram.duration_weeks} semanas</span>
                    <span>·</span>
                    <span>{parsedProgram.days_per_week}x/semana</span>
                  </div>
                </div>

                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {parsedProgram.blocks.map((block, bIdx) => (
                    <div key={bIdx} className="p-3 rounded-lg bg-secondary/30">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <span className="text-sm font-medium">{block.name}</span>
                        <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded">{block.block_type}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Semanas {block.start_week}–{block.end_week} · {block.weeks.reduce((acc, w) => acc + w.days.length, 0)} dias · {block.weeks.reduce((acc, w) => acc + w.days.reduce((a, d) => a + d.exercises.length, 0), 0)} exercícios
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setParsedProgram(null)}
                    className="flex-1"
                  >
                    Importar Outro
                  </Button>
                  <Button
                    onClick={saveImportedProgram}
                    disabled={savingImport}
                    className="flex-1 gap-2"
                  >
                    {savingImport ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        Salvar Programa
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
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
