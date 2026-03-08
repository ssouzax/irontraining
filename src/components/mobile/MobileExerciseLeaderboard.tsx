import { useState, useEffect } from 'react';
import { Trophy, Crown, Search, Loader2, Dumbbell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';

const POPULAR_EXERCISES = [
  'Agachamento', 'Supino', 'Terra', 'Overhead Press', 'Barra Fixa',
  'Remada Curvada', 'Leg Press', 'Rosca Direta', 'Tríceps Corda',
  'Elevação Lateral', 'Panturrilha', 'Elevação Pélvica', 'Abdominais',
  'Desenvolvimento', 'Stiff', 'Hack Squat', 'Cadeira Extensora',
  'Cadeira Flexora', 'Puxada Frontal', 'Mergulho',
];

interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  username: string | null;
  avatar_url: string | null;
  exercise_name: string;
  weight: number;
  reps: number;
  estimated_1rm: number;
  bodyweight: number;
  dots_score: number;
  gym_name: string | null;
}

export function MobileExerciseLeaderboard() {
  const { user } = useAuth();
  const [selectedExercise, setSelectedExercise] = useState('Agachamento');
  const [searchQuery, setSearchQuery] = useState('');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadLeaderboard(selectedExercise); }, [selectedExercise]);

  const loadLeaderboard = async (exercise: string) => {
    setLoading(true);
    const { data } = await supabase.rpc('get_exercise_leaderboard', {
      target_exercise: exercise,
      limit_count: 50,
    });
    if (data) setEntries(data as LeaderboardEntry[]);
    setLoading(false);
  };

  const filteredExercises = searchQuery
    ? POPULAR_EXERCISES.filter(e => e.toLowerCase().includes(searchQuery.toLowerCase()))
    : POPULAR_EXERCISES;

  return (
    <div className="p-4 space-y-4">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Dumbbell className="w-5 h-5 text-primary" /> Ranking por Exercício
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">Leaderboard para cada exercício</p>
      </motion.div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          placeholder="Buscar exercício..."
          className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
      </div>

      {/* Exercise pills */}
      <div className="flex flex-wrap gap-1.5">
        {filteredExercises.slice(0, 12).map(ex => (
          <button key={ex} onClick={() => setSelectedExercise(ex)}
            className={cn("px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
              selectedExercise === ex ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
            )}>
            {ex}
          </button>
        ))}
      </div>

      {/* Leaderboard */}
      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <Crown className="w-4 h-4 text-yellow-400" />
          <span className="text-sm font-semibold text-foreground">{selectedExercise}</span>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-16">
            <Trophy className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Nenhum registro para {selectedExercise}</p>
            <p className="text-xs text-muted-foreground mt-1">Seja o primeiro a registrar!</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {entries.map((entry, i) => (
              <div key={entry.user_id} className={cn("flex items-center gap-3 px-4 py-3", i < 3 && "bg-primary/5")}>
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0",
                  i === 0 ? "bg-yellow-500/20 text-yellow-400" :
                  i === 1 ? "bg-gray-400/20 text-gray-400" :
                  i === 2 ? "bg-amber-700/20 text-amber-600" :
                  "bg-secondary text-muted-foreground"
                )}>{i + 1}</div>
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                  {entry.avatar_url ? (
                    <img src={entry.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs font-bold text-primary">{entry.display_name[0]?.toUpperCase()}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{entry.display_name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {entry.bodyweight}kg · {entry.gym_name || 'Sem academia'}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-base font-extrabold text-primary">{entry.estimated_1rm}<span className="text-xs font-medium">kg</span></p>
                  <p className="text-[10px] text-muted-foreground">{entry.weight}kg × {entry.reps}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
