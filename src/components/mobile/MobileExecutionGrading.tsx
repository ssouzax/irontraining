import { useState, useEffect } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Star, Flame, Trophy, Plus, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type Grade = 'excellent' | 'good' | 'adjust';

const GRADE_CONFIG: Record<Grade, { label: string; color: string; bg: string; icon: typeof CheckCircle; xp: number }> = {
  excellent: { label: 'Excelente', color: 'text-green-400', bg: 'bg-green-400/15', icon: CheckCircle, xp: 30 },
  good: { label: 'Bom', color: 'text-yellow-400', bg: 'bg-yellow-400/15', icon: AlertTriangle, xp: 15 },
  adjust: { label: 'Ajustar', color: 'text-red-400', bg: 'bg-red-400/15', icon: XCircle, xp: 5 },
};

interface GradeEntry {
  exercise: string;
  setNum: number;
  grade: Grade;
  posture: number;
  rom: number;
  tempo: number;
  stability: number;
  total: number;
  xp: number;
}

export function MobileExecutionGrading() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<GradeEntry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [exercise, setExercise] = useState('Supino Reto');
  const [scores, setScores] = useState({ posture: 80, rom: 85, tempo: 75, stability: 80 });
  const [history, setHistory] = useState<any[]>([]);

  const exercises = ['Supino Reto', 'Agachamento', 'Levantamento Terra', 'Desenvolvimento', 'Remada Curvada'];

  useEffect(() => {
    if (user) loadHistory();
  }, [user]);

  const loadHistory = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('execution_grades')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    if (data) setHistory(data);
  };

  const calculateGrade = (total: number): Grade => {
    if (total >= 85) return 'excellent';
    if (total >= 60) return 'good';
    return 'adjust';
  };

  const submitGrade = async () => {
    const total = Math.round((scores.posture + scores.rom + scores.tempo + scores.stability) / 4);
    const grade = calculateGrade(total);
    const xp = GRADE_CONFIG[grade].xp;

    const entry: GradeEntry = {
      exercise,
      setNum: entries.filter(e => e.exercise === exercise).length + 1,
      grade,
      posture: scores.posture,
      rom: scores.rom,
      tempo: scores.tempo,
      stability: scores.stability,
      total,
      xp,
    };

    setEntries(prev => [...prev, entry]);
    setShowForm(false);

    if (user) {
      await supabase.from('execution_grades').insert({
        user_id: user.id,
        exercise_name: exercise,
        set_number: entry.setNum,
        grade,
        grade_score: total,
        posture_score: scores.posture,
        rom_score: scores.rom,
        tempo_score: scores.tempo,
        stability_score: scores.stability,
        xp_bonus: xp,
      });
    }

    toast.success(
      <div className="flex items-center gap-2">
        <span>{GRADE_CONFIG[grade].label}!</span>
        <span className="text-primary font-bold">+{xp} XP</span>
      </div>
    );
  };

  const totalXP = entries.reduce((a, e) => a + e.xp, 0);
  const excellentCount = entries.filter(e => e.grade === 'excellent').length;
  const avgScore = entries.length ? Math.round(entries.reduce((a, e) => a + e.total, 0) / entries.length) : 0;

  const chartData = entries.map(e => ({
    name: `${e.exercise.slice(0, 3)} S${e.setNum}`,
    score: e.total,
    fill: e.grade === 'excellent' ? 'hsl(145, 65%, 45%)' : e.grade === 'good' ? 'hsl(38, 92%, 55%)' : 'hsl(0, 72%, 55%)',
  }));

  const radarData = entries.length ? [
    { metric: 'Postura', value: Math.round(entries.reduce((a, e) => a + e.posture, 0) / entries.length) },
    { metric: 'ROM', value: Math.round(entries.reduce((a, e) => a + e.rom, 0) / entries.length) },
    { metric: 'Tempo', value: Math.round(entries.reduce((a, e) => a + e.tempo, 0) / entries.length) },
    { metric: 'Estabilidade', value: Math.round(entries.reduce((a, e) => a + e.stability, 0) / entries.length) },
  ] : [];

  return (
    <div className="px-4 pt-3 pb-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
          <Star className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">Notas de Execução</h2>
          <p className="text-xs text-muted-foreground">Avalie cada série e ganhe XP</p>
        </div>
      </div>

      {/* Session stats */}
      {entries.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-card rounded-xl border border-border p-3 text-center">
            <Trophy className="w-5 h-5 mx-auto mb-1 text-yellow-400" />
            <p className="text-lg font-bold text-foreground">{excellentCount}</p>
            <p className="text-[9px] text-muted-foreground">Perfeitas</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-3 text-center">
            <TrendingUp className="w-5 h-5 mx-auto mb-1 text-primary" />
            <p className="text-lg font-bold text-foreground">{avgScore}</p>
            <p className="text-[9px] text-muted-foreground">Score Médio</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-3 text-center">
            <Flame className="w-5 h-5 mx-auto mb-1 text-orange-400" />
            <p className="text-lg font-bold text-primary">+{totalXP}</p>
            <p className="text-[9px] text-muted-foreground">XP Ganho</p>
          </div>
        </div>
      )}

      {/* Entries */}
      {entries.length > 0 && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="p-3 border-b border-border">
            <p className="text-xs font-bold text-foreground">Séries Avaliadas</p>
          </div>
          <div className="divide-y divide-border">
            {entries.map((e, i) => {
              const config = GRADE_CONFIG[e.grade];
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 px-3 py-2.5"
                >
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", config.bg)}>
                    <config.icon className={cn("w-4 h-4", config.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground">{e.exercise} - Série {e.setNum}</p>
                    <div className="flex gap-2 mt-0.5">
                      {[
                        { l: 'P', v: e.posture },
                        { l: 'R', v: e.rom },
                        { l: 'T', v: e.tempo },
                        { l: 'E', v: e.stability },
                      ].map(m => (
                        <span key={m.l} className="text-[9px] text-muted-foreground">{m.l}:{m.v}</span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn("text-xs font-bold", config.color)}>{e.total}pts</p>
                    <p className="text-[10px] text-primary font-medium">+{e.xp}XP</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Charts */}
      {entries.length >= 2 && (
        <div className="space-y-3">
          <div className="bg-card rounded-xl border border-border p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Score por Série</p>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(230, 12%, 18%)" />
                <XAxis dataKey="name" tick={{ fill: 'hsl(215, 15%, 50%)', fontSize: 8 }} />
                <YAxis domain={[0, 100]} tick={{ fill: 'hsl(215, 15%, 50%)', fontSize: 9 }} />
                <Tooltip contentStyle={{ background: 'hsl(230, 15%, 11%)', border: '1px solid hsl(230, 12%, 18%)', borderRadius: 8, fontSize: 10 }} />
                <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <motion.rect key={index} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card rounded-xl border border-border p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Radar de Qualidade</p>
            <ResponsiveContainer width="100%" height={180}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="hsl(230, 12%, 18%)" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: 'hsl(215, 15%, 50%)', fontSize: 10 }} />
                <Radar dataKey="value" stroke="hsl(145, 65%, 45%)" fill="hsl(145, 65%, 45%)" fillOpacity={0.2} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Grading form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-card rounded-xl border border-border p-4 space-y-3"
          >
            <p className="text-sm font-bold text-foreground">Avaliar Série</p>

            {/* Exercise selector */}
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {exercises.map(e => (
                <button
                  key={e}
                  onClick={() => setExercise(e)}
                  className={cn(
                    "shrink-0 px-2.5 py-1 rounded-full text-[10px] font-medium border transition-colors",
                    exercise === e ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border"
                  )}
                >
                  {e}
                </button>
              ))}
            </div>

            {/* Score sliders */}
            {[
              { key: 'posture' as const, label: 'Postura', desc: 'Alinhamento e forma' },
              { key: 'rom' as const, label: 'ROM', desc: 'Amplitude de movimento' },
              { key: 'tempo' as const, label: 'Tempo', desc: 'Cadência e controle' },
              { key: 'stability' as const, label: 'Estabilidade', desc: 'Firmeza e equilíbrio' },
            ].map(s => {
              const val = scores[s.key];
              const grade = val >= 85 ? 'excellent' : val >= 60 ? 'good' : 'adjust';
              const color = grade === 'excellent' ? 'accent-green-400' : grade === 'good' ? 'accent-yellow-400' : 'accent-red-400';
              return (
                <div key={s.key}>
                  <div className="flex items-center justify-between mb-0.5">
                    <div>
                      <span className="text-xs font-medium text-foreground">{s.label}</span>
                      <span className="text-[9px] text-muted-foreground ml-1">{s.desc}</span>
                    </div>
                    <span className={cn("text-xs font-bold", grade === 'excellent' ? 'text-green-400' : grade === 'good' ? 'text-yellow-400' : 'text-red-400')}>
                      {val}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={val}
                    onChange={e => setScores(prev => ({ ...prev, [s.key]: Number(e.target.value) }))}
                    className="w-full h-1.5 bg-muted rounded-full appearance-none cursor-pointer"
                  />
                </div>
              );
            })}

            {/* Preview grade */}
            {(() => {
              const total = Math.round((scores.posture + scores.rom + scores.tempo + scores.stability) / 4);
              const grade = calculateGrade(total);
              const config = GRADE_CONFIG[grade];
              return (
                <div className={cn("flex items-center justify-between p-2.5 rounded-lg", config.bg)}>
                  <div className="flex items-center gap-2">
                    <config.icon className={cn("w-5 h-5", config.color)} />
                    <span className={cn("text-sm font-bold", config.color)}>{config.label}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-foreground">{total}pts</span>
                    <span className="text-xs text-primary ml-2">+{config.xp}XP</span>
                  </div>
                </div>
              );
            })()}

            <div className="flex gap-2">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2 rounded-lg bg-muted text-sm font-medium text-muted-foreground">Cancelar</button>
              <button onClick={submitGrade} className="flex-1 py-2 rounded-lg bg-primary text-sm font-bold text-primary-foreground">Avaliar</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm"
        >
          <Plus className="w-4 h-4" />
          Avaliar Série
        </button>
      )}

      {entries.length === 0 && !showForm && (
        <div className="text-center py-8">
          <Star className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">Avalie suas séries para ganhar XP</p>
          <p className="text-[10px] text-muted-foreground/60 mt-1">Verde = Perfeita · Amarelo = Boa · Vermelho = Ajustar</p>
        </div>
      )}
    </div>
  );
}
