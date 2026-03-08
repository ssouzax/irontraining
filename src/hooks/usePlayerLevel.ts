import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const MAX_DAILY_XP = 1000;

const LEVEL_TITLES: Record<number, string> = {
  1: 'Novato',
  5: 'Iniciante',
  10: 'Levantador Dedicado',
  20: 'Atleta de Ferro',
  30: 'Guerreiro da Força',
  40: 'Levantador Elite',
  50: 'Lenda de Ferro',
  75: 'Titã da Força',
  100: 'Atleta Lendário',
};

function getTitle(level: number): string {
  let title = 'Novato';
  for (const [lvl, t] of Object.entries(LEVEL_TITLES)) {
    if (level >= Number(lvl)) title = t;
  }
  return title;
}

function xpForLevel(level: number): number {
  return Math.round(100 * Math.pow(level, 1.5));
}

function getLevelFromXP(totalXP: number): { level: number; xpInLevel: number; xpNeeded: number } {
  let level = 1;
  let remaining = totalXP;
  while (remaining >= xpForLevel(level)) {
    remaining -= xpForLevel(level);
    level++;
  }
  return { level, xpInLevel: remaining, xpNeeded: xpForLevel(level) };
}

export interface PlayerLevel {
  player_level: number;
  total_xp: number;
  lifetime_xp: number;
  title: string;
  xp_in_level: number;
  xp_needed: number;
  daily_xp: number;
}

export function usePlayerLevel() {
  const { user } = useAuth();
  const [playerLevel, setPlayerLevel] = useState<PlayerLevel | null>(null);
  const [loading, setLoading] = useState(true);
  const [levelUpEvent, setLevelUpEvent] = useState<{ newLevel: number; title: string } | null>(null);

  const loadLevel = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    const { data } = await supabase
      .from('player_levels')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      const info = getLevelFromXP(data.total_xp as number);
      const today = new Date().toISOString().split('T')[0];
      const dailyXp = (data.last_xp_date as string) === today ? (data.daily_xp as number) : 0;
      setPlayerLevel({
        player_level: info.level,
        total_xp: data.total_xp as number,
        lifetime_xp: data.lifetime_xp as number,
        title: getTitle(info.level),
        xp_in_level: info.xpInLevel,
        xp_needed: info.xpNeeded,
        daily_xp: dailyXp,
      });
    } else {
      // Create initial record
      await supabase.from('player_levels').insert({
        user_id: user.id,
        player_level: 1,
        total_xp: 0,
        lifetime_xp: 0,
        title: 'Novato',
        daily_xp: 0,
      });
      setPlayerLevel({
        player_level: 1, total_xp: 0, lifetime_xp: 0,
        title: 'Novato', xp_in_level: 0, xp_needed: xpForLevel(1), daily_xp: 0,
      });
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { loadLevel(); }, [loadLevel]);

  const addXP = useCallback(async (amount: number, reason?: string) => {
    if (!user || !playerLevel) return;
    
    const today = new Date().toISOString().split('T')[0];
    const currentDailyXP = playerLevel.daily_xp;
    
    if (currentDailyXP >= MAX_DAILY_XP) return; // Daily cap
    
    const cappedAmount = Math.min(amount, MAX_DAILY_XP - currentDailyXP);
    if (cappedAmount <= 0) return;

    const newTotalXP = playerLevel.total_xp + cappedAmount;
    const newLifetimeXP = playerLevel.lifetime_xp + cappedAmount;
    const oldLevel = playerLevel.player_level;
    const info = getLevelFromXP(newTotalXP);
    const newTitle = getTitle(info.level);

    await supabase.from('player_levels').update({
      total_xp: newTotalXP,
      lifetime_xp: newLifetimeXP,
      player_level: info.level,
      title: newTitle,
      daily_xp: currentDailyXP + cappedAmount,
      last_xp_date: today,
      updated_at: new Date().toISOString(),
    }).eq('user_id', user.id);

    if (info.level > oldLevel) {
      setLevelUpEvent({ newLevel: info.level, title: newTitle });
    }

    setPlayerLevel({
      player_level: info.level,
      total_xp: newTotalXP,
      lifetime_xp: newLifetimeXP,
      title: newTitle,
      xp_in_level: info.xpInLevel,
      xp_needed: info.xpNeeded,
      daily_xp: currentDailyXP + cappedAmount,
    });
  }, [user, playerLevel]);

  const dismissLevelUp = useCallback(() => setLevelUpEvent(null), []);

  return { playerLevel, loading, addXP, levelUpEvent, dismissLevelUp, xpForLevel, getTitle, LEVEL_TITLES };
}
