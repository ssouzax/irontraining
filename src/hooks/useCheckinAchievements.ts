import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const CHECKIN_MILESTONES = [
  { days: 7, title: 'Dedicado', description: '7 dias consecutivos de check-in', icon: '🔥', rarity: 'common' },
  { days: 15, title: 'Disciplinado', description: '15 dias consecutivos de check-in', icon: '💪', rarity: 'uncommon' },
  { days: 30, title: 'Máquina', description: '30 dias consecutivos de check-in', icon: '⚙️', rarity: 'rare' },
  { days: 50, title: 'Imparável', description: '50 dias consecutivos de check-in', icon: '🚀', rarity: 'epic' },
  { days: 100, title: 'Lenda', description: '100 dias consecutivos de check-in', icon: '👑', rarity: 'legendary' },
  { days: 150, title: 'Titã', description: '150 dias consecutivos de check-in', icon: '🏛️', rarity: 'legendary' },
  { days: 200, title: 'Imortal', description: '200 dias consecutivos de check-in', icon: '⭐', rarity: 'legendary' },
];

export function useCheckinAchievements() {
  const { user } = useAuth();

  const checkAndUnlock = useCallback(async (streakDays: number) => {
    if (!user) return [];

    const unlocked: typeof CHECKIN_MILESTONES = [];

    for (const milestone of CHECKIN_MILESTONES) {
      if (streakDays < milestone.days) continue;

      // Check if already unlocked
      const { data: existing } = await supabase
        .from('achievements')
        .select('id')
        .eq('user_id', user.id)
        .eq('type', 'checkin_streak')
        .eq('title', milestone.title)
        .limit(1);

      if (existing && existing.length > 0) continue;

      // Unlock
      await supabase.from('achievements').insert({
        user_id: user.id,
        type: 'checkin_streak',
        title: milestone.title,
        description: milestone.description,
        icon: milestone.icon,
        value: milestone.days,
      });

      unlocked.push(milestone);
    }

    return unlocked;
  }, [user]);

  return { checkAndUnlock, milestones: CHECKIN_MILESTONES };
}
