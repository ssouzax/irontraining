import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface StreakData {
  current_streak: number;
  longest_streak: number;
  last_workout_date: string | null;
  program_streak: number;
  weekly_consistency_streak: number;
}

export function useTrainingStreak() {
  const { user } = useAuth();
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStreak = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('training_streaks')
      .select('*')
      .eq('user_id', user.id)
      .single();
    if (data) {
      setStreak(data as any);
    }
    setLoading(false);
  }, [user]);

  const updateStreak = useCallback(async () => {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];

    // Get current streak data
    const { data: existing } = await supabase
      .from('training_streaks')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!existing) {
      // First workout ever
      await supabase.from('training_streaks').insert({
        user_id: user.id,
        current_streak: 1,
        longest_streak: 1,
        last_workout_date: today,
      });
      loadStreak();
      return;
    }

    const lastDate = existing.last_workout_date;
    if (lastDate === today) return; // Already logged today

    const daysSinceLastWorkout = lastDate
      ? Math.floor((new Date(today).getTime() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    let newStreak: number;
    if (daysSinceLastWorkout <= 3) {
      // Continue streak
      newStreak = (existing.current_streak || 0) + 1;
    } else {
      // Reset streak
      newStreak = 1;
    }

    const newLongest = Math.max(existing.longest_streak || 0, newStreak);

    // Check weekly consistency (workouts this week)
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const { count: weekWorkouts } = await supabase
      .from('workout_logs')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id)
      .gte('created_at', weekStart.toISOString());

    const weeklyStreak = (weekWorkouts || 0) >= 3
      ? (existing.weekly_consistency_streak || 0) + 1
      : existing.weekly_consistency_streak || 0;

    await supabase.from('training_streaks').update({
      current_streak: newStreak,
      longest_streak: newLongest,
      last_workout_date: today,
      weekly_consistency_streak: weeklyStreak,
    }).eq('user_id', user.id);

    loadStreak();
  }, [user, loadStreak]);

  useEffect(() => { loadStreak(); }, [loadStreak]);

  return { streak, loading, updateStreak };
}
