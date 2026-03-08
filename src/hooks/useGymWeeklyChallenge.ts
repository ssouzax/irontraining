import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface GymChallengeEntry {
  gym_id: string;
  gym_name: string;
  checkin_count: number;
  is_winner: boolean;
}

export function useGymWeeklyChallenge(gymId: string | null) {
  const { user } = useAuth();
  const [rankings, setRankings] = useState<GymChallengeEntry[]>([]);
  const [myGymRank, setMyGymRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [weekLabel, setWeekLabel] = useState('');

  const getWeekBounds = () => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
    const start = new Date(now);
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  };

  const load = useCallback(async () => {
    setLoading(true);
    const { start, end } = getWeekBounds();
    setWeekLabel(`${start.getDate()}/${start.getMonth() + 1} - ${end.getDate()}/${end.getMonth() + 1}`);

    // Get all checkins this week grouped by gym
    const { data: checkins } = await supabase
      .from('gym_checkins')
      .select('gym_id')
      .gte('checked_in_at', start.toISOString())
      .lte('checked_in_at', end.toISOString());

    if (!checkins || checkins.length === 0) {
      setRankings([]);
      setLoading(false);
      return;
    }

    // Count per gym
    const counts = new Map<string, number>();
    checkins.forEach(c => counts.set(c.gym_id, (counts.get(c.gym_id) || 0) + 1));
    const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);

    // Get gym names
    const gymIds = sorted.map(s => s[0]);
    const { data: gyms } = await supabase.from('gyms').select('id, name').in('id', gymIds);
    const gymMap = new Map((gyms || []).map(g => [g.id, g.name]));

    const maxCount = sorted[0]?.[1] || 0;
    const entries: GymChallengeEntry[] = sorted.map(([gid, count]) => ({
      gym_id: gid,
      gym_name: gymMap.get(gid) || 'Academia',
      checkin_count: count,
      is_winner: count === maxCount,
    }));

    setRankings(entries);

    if (gymId) {
      const idx = entries.findIndex(e => e.gym_id === gymId);
      setMyGymRank(idx >= 0 ? idx + 1 : null);
    }

    setLoading(false);
  }, [gymId]);

  useEffect(() => { load(); }, [load]);

  return { rankings, myGymRank, loading, weekLabel, refresh: load };
}
