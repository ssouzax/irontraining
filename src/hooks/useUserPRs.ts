import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface UserPR {
  id: string;
  exercise_name: string;
  weight: number;
  reps: number;
  estimated_1rm: number;
  display_order: number;
}

function calculate1RM(weight: number, reps: number): number {
  if (reps === 1) return weight;
  if (reps === 0 || weight === 0) return 0;
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}

export function useUserPRs() {
  const { user } = useAuth();
  const [prs, setPrs] = useState<UserPR[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPRs = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('user_prs')
      .select('*')
      .eq('user_id', user.id)
      .order('display_order', { ascending: true });
    if (data) setPrs(data as UserPR[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { loadPRs(); }, [loadPRs]);

  const addPR = async (exerciseName: string) => {
    if (!user) return;
    const order = prs.length;
    const { data, error } = await supabase
      .from('user_prs')
      .insert({ user_id: user.id, exercise_name: exerciseName, weight: 0, reps: 1, estimated_1rm: 0, display_order: order })
      .select()
      .single();
    if (error) throw error;
    if (data) setPrs(prev => [...prev, data as UserPR]);
  };

  const updatePR = async (id: string, weight: number, reps: number) => {
    const e1rm = calculate1RM(weight, reps);
    await supabase.from('user_prs').update({ weight, reps, estimated_1rm: e1rm }).eq('id', id);
    setPrs(prev => prev.map(p => p.id === id ? { ...p, weight, reps, estimated_1rm: e1rm } : p));
  };

  const removePR = async (id: string) => {
    await supabase.from('user_prs').delete().eq('id', id);
    setPrs(prev => prev.filter(p => p.id !== id));
  };

  const total = prs.reduce((sum, p) => sum + p.estimated_1rm, 0);

  return { prs, loading, total, addPR, updatePR, removePR, reload: loadPRs };
}
