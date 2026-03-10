import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ExerciseHistoryEntry {
  setNumber: number;
  weight: number;
  reps: number;
  date: string;
}

export function useExerciseHistory(exerciseName: string) {
  const { user } = useAuth();
  const [history, setHistory] = useState<ExerciseHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || !exerciseName) return;

    const load = async () => {
      setLoading(true);
      try {
        // Get the most recent workout that has this exercise
        const { data } = await supabase
          .from('performed_sets')
          .select('set_number, weight_used, reps_completed, created_at')
          .eq('user_id', user.id)
          .eq('exercise_name', exerciseName)
          .eq('completed', true)
          .order('created_at', { ascending: false })
          .limit(10);

        if (data && data.length > 0) {
          // Group by workout date (same day)
          const latestDate = data[0].created_at.substring(0, 10);
          const latestSets = data
            .filter(d => d.created_at.substring(0, 10) === latestDate)
            .map(d => ({
              setNumber: d.set_number,
              weight: d.weight_used || 0,
              reps: d.reps_completed || 0,
              date: d.created_at,
            }));
          setHistory(latestSets);
        } else {
          setHistory([]);
        }
      } catch {
        setHistory([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user, exerciseName]);

  return { history, loading };
}
