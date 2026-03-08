import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface DailyChallenge {
  id: string;
  gym_id: string | null;
  challenge_type: string;
  exercise_name: string;
  challenge_date: string;
  entries: ChallengeEntry[];
}

export interface ChallengeEntry {
  id: string;
  user_id: string;
  value: number;
  display_name?: string;
  avatar_url?: string;
}

export function useDailyChallenges(gymId?: string) {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<DailyChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const today = new Date().toISOString().split('T')[0];

  const loadChallenges = useCallback(async () => {
    if (!user) return;
    let query = supabase
      .from('daily_challenges')
      .select('*, challenge_entries(*)')
      .eq('challenge_date', today);
    
    if (gymId) query = query.eq('gym_id', gymId);

    const { data } = await query.order('created_at', { ascending: false });

    if (data) {
      // Enrich entries with profiles
      const allUserIds = new Set<string>();
      (data as any[]).forEach((c: any) => c.challenge_entries?.forEach((e: any) => allUserIds.add(e.user_id)));
      
      let profileMap: Record<string, any> = {};
      if (allUserIds.size > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, display_name, avatar_url, email')
          .in('user_id', Array.from(allUserIds));
        profiles?.forEach(p => { profileMap[p.user_id] = p; });
      }

      const enriched = (data as any[]).map((c: any) => ({
        ...c,
        entries: (c.challenge_entries || [])
          .map((e: any) => ({
            ...e,
            display_name: profileMap[e.user_id]?.display_name || profileMap[e.user_id]?.email?.split('@')[0] || 'Anônimo',
            avatar_url: profileMap[e.user_id]?.avatar_url,
          }))
          .sort((a: any, b: any) => b.value - a.value),
      }));
      setChallenges(enriched);
    }
    setLoading(false);
  }, [user, today, gymId]);

  useEffect(() => { loadChallenges(); }, [loadChallenges]);

  const createChallenge = useCallback(async (exerciseName: string, challengeType: string = 'max_weight') => {
    if (!user) return;
    await supabase.from('daily_challenges').insert({
      gym_id: gymId || null,
      challenge_type: challengeType,
      exercise_name: exerciseName,
      challenge_date: today,
    } as any);
    loadChallenges();
  }, [user, gymId, today, loadChallenges]);

  const submitEntry = useCallback(async (challengeId: string, value: number) => {
    if (!user) return;
    await supabase.from('challenge_entries').upsert({
      challenge_id: challengeId,
      user_id: user.id,
      value,
    } as any, { onConflict: 'challenge_id,user_id' });
    loadChallenges();
  }, [user, loadChallenges]);

  return { challenges, loading, createChallenge, submitEntry, refresh: loadChallenges };
}
