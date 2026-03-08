import { motion } from 'framer-motion';
import { useState } from 'react';
import { Trophy, Medal, Crown, Filter } from 'lucide-react';
import { useTraining } from '@/contexts/TrainingContext';
import { calculate1RM } from '@/data/defaultProfile';
import { getStrengthLevel } from '@/lib/strengthStandards';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface LeaderboardEntry {
  display_name: string;
  body_weight: number;
  exercise: string;
  weight: number;
  reps: number;
  estimated_1rm: number;
  recorded_at: string;
}

const WEIGHT_CLASSES = [
  { label: 'Todas', min: 0, max: 999 },
  { label: '-66kg', min: 0, max: 66 },
  { label: '-74kg', min: 66, max: 74 },
  { label: '-83kg', min: 74, max: 83 },
  { label: '-93kg', min: 83, max: 93 },
  { label: '-105kg', min: 93, max: 105 },
  { label: '+105kg', min: 105, max: 999 },
];

const EXERCISES = [
  { value: 'squat', label: 'Agachamento' },
  { value: 'bench', label: 'Supino' },
  { value: 'deadlift', label: 'Terra' },
];

export default function RankingsPage() {
  const { profile } = useTraining();
  const { user } = useAuth();
  const [selectedExercise, setSelectedExercise] = useState('squat');
  const [selectedClass, setSelectedClass] = useState(0);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const squat1RM = calculate1RM(profile.currentLifts.squat.weight, profile.currentLifts.squat.reps);
  const bench1RM = calculate1RM(profile.currentLifts.bench.weight, profile.currentLifts.bench.reps);
  const deadlift1RM = calculate1RM(profile.currentLifts.deadlift.weight, profile.currentLifts.deadlift.reps);

  const myE1RM: Record<string, number> = { squat: squat1RM, bench: bench1RM, deadlift: deadlift1RM };
  const myLevel = getStrengthLevel(selectedExercise as any, myE1RM[selectedExercise], profile.bodyWeight);

  const loadLeaderboard = async () => {
    setLoading(true);
    const wc = WEIGHT_CLASSES[selectedClass];
    const { data, error } = await supabase.rpc('get_leaderboard', {
      lift_name: selectedExercise,
      weight_class_min: wc.min,
      weight_class_max: wc.max,
    });
    if (data) setEntries(data as LeaderboardEntry[]);
    setLoaded(true);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Ranking</h1>
        <p className="text-muted-foreground mt-1">Compare sua força com outros atletas</p>
      </motion.div>

      {/* Your Stats */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-xl border border-border p-5 card-elevated">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Medal className="w-4 h-4 text-primary" /> Seus Lifts
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { name: 'Agachamento', e1rm: squat1RM, ex: 'squat' as const },
            { name: 'Supino', e1rm: bench1RM, ex: 'bench' as const },
            { name: 'Terra', e1rm: deadlift1RM, ex: 'deadlift' as const },
          ].map(lift => {
            const lvl = getStrengthLevel(lift.ex, lift.e1rm, profile.bodyWeight);
            return (
              <div key={lift.name} className="text-center p-3 rounded-lg bg-secondary/40">
                <p className="text-xs text-muted-foreground">{lift.name}</p>
                <p className="text-xl font-bold text-foreground">{lift.e1rm}kg</p>
                <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded", lvl.level.bgColor, lvl.level.color)}>
                  {lvl.level.label}
                </span>
              </div>
            );
          })}
        </div>
        <div className="mt-3 pt-3 border-t border-border text-center">
          <p className="text-xs text-muted-foreground">Total: <span className="font-bold text-foreground text-lg">{squat1RM + bench1RM + deadlift1RM}kg</span></p>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-xl border border-border p-4 card-elevated space-y-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Filtros</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {EXERCISES.map(ex => (
            <button key={ex.value} onClick={() => { setSelectedExercise(ex.value); setLoaded(false); }}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                selectedExercise === ex.value ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
              )}>
              {ex.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {WEIGHT_CLASSES.map((wc, i) => (
            <button key={i} onClick={() => { setSelectedClass(i); setLoaded(false); }}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                selectedClass === i ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
              )}>
              {wc.label}
            </button>
          ))}
        </div>
        <button onClick={loadLeaderboard} disabled={loading}
          className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
          {loading ? <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> : <Trophy className="w-4 h-4" />}
          Carregar Ranking
        </button>
      </motion.div>

      {/* Leaderboard */}
      {loaded && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl border border-border card-elevated overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Crown className="w-4 h-4 text-yellow-400" />
              Leaderboard — {EXERCISES.find(e => e.value === selectedExercise)?.label}
            </h3>
          </div>
          {entries.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-muted-foreground">Nenhum atleta nesta categoria ainda. Seja o primeiro a registrar um PR!</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {entries.map((entry, i) => (
                <div key={i} className={cn("flex items-center gap-3 px-4 py-3", i < 3 && "bg-primary/5")}>
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                    i === 0 ? "bg-yellow-500/20 text-yellow-400" :
                    i === 1 ? "bg-gray-400/20 text-gray-400" :
                    i === 2 ? "bg-amber-700/20 text-amber-600" :
                    "bg-secondary text-muted-foreground"
                  )}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{entry.display_name}</p>
                    <p className="text-xs text-muted-foreground">{entry.body_weight}kg PC</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground">{entry.estimated_1rm}kg</p>
                    <p className="text-[10px] text-muted-foreground">{entry.weight}kg × {entry.reps}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
