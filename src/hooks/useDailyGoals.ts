import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface DailyGoal {
  id: string;
  goal_type: string;
  exercise_name: string | null;
  target_value: number;
  target_unit: string;
  current_value: number;
  completed: boolean;
  goal_date: string;
  xp_reward: number;
}

export function useDailyGoals() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<DailyGoal[]>([]);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split('T')[0];

  const loadGoals = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('daily_goals')
      .select('*')
      .eq('user_id', user.id)
      .eq('goal_date', today)
      .order('created_at', { ascending: true });
    setGoals((data as any[]) || []);
    setLoading(false);
  }, [user, today]);

  useEffect(() => { loadGoals(); }, [loadGoals]);

  const addGoal = useCallback(async (goal: {
    goal_type: string;
    exercise_name?: string;
    target_value: number;
    target_unit: string;
    xp_reward?: number;
  }) => {
    if (!user) return;
    await supabase.from('daily_goals').insert({
      user_id: user.id,
      goal_type: goal.goal_type,
      exercise_name: goal.exercise_name || null,
      target_value: goal.target_value,
      target_unit: goal.target_unit,
      goal_date: today,
      xp_reward: goal.xp_reward || 25,
    } as any);
    loadGoals();
  }, [user, today, loadGoals]);

  const updateProgress = useCallback(async (goalId: string, newValue: number) => {
    if (!user) return;
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    const completed = newValue >= goal.target_value;
    await supabase.from('daily_goals').update({
      current_value: newValue,
      completed,
    } as any).eq('id', goalId);
    loadGoals();
    return completed;
  }, [user, goals, loadGoals]);

  const deleteGoal = useCallback(async (goalId: string) => {
    if (!user) return;
    await supabase.from('daily_goals').delete().eq('id', goalId);
    loadGoals();
  }, [user, loadGoals]);

  const completedCount = goals.filter(g => g.completed).length;
  const totalCount = goals.length;

  return { goals, loading, addGoal, updateProgress, deleteGoal, completedCount, totalCount, refresh: loadGoals };
}
