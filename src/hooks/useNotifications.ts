import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface AppNotification {
  id: string;
  type: 'workout_pending' | 'achievement_unlocked' | 'pr_achieved' | 'level_up' | 'gym_pr';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  link?: string;
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const checkPendingWorkouts = useCallback(async () => {
    if (!user) return [];
    
    const today = new Date();
    const dayOfWeek = today.getDay();
    // If it's a weekday (Mon-Fri) and no workout logged today
    if (dayOfWeek === 0 || dayOfWeek === 6) return [];

    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);

    const { data: todayLogs } = await supabase
      .from('workout_logs')
      .select('id')
      .eq('user_id', user.id)
      .gte('created_at', startOfDay.toISOString())
      .limit(1);

    if (!todayLogs || todayLogs.length === 0) {
      return [{
        id: `workout-pending-${today.toDateString()}`,
        type: 'workout_pending' as const,
        title: 'Treino pendente',
        message: 'Você ainda não treinou hoje. Bora treinar! 💪',
        timestamp: new Date(),
        read: false,
        link: '/train',
      }];
    }
    return [];
  }, [user]);

  const checkRecentAchievements = useCallback(async () => {
    if (!user) return [];

    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const { data } = await supabase
      .from('achievements')
      .select('id, title, description, unlocked_at')
      .eq('user_id', user.id)
      .gte('unlocked_at', oneDayAgo.toISOString())
      .order('unlocked_at', { ascending: false })
      .limit(5);

    return (data || []).map(a => ({
      id: `achievement-${a.id}`,
      type: 'achievement_unlocked' as const,
      title: '🏆 Conquista desbloqueada!',
      message: a.title,
      timestamp: new Date(a.unlocked_at),
      read: false,
      link: '/achievements',
    }));
  }, [user]);

  const checkRecentPRs = useCallback(async () => {
    if (!user) return [];

    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const { data } = await supabase
      .from('personal_records')
      .select('id, exercise_name, weight, reps, recorded_at')
      .eq('user_id', user.id)
      .gte('recorded_at', oneDayAgo.toISOString())
      .order('recorded_at', { ascending: false })
      .limit(5);

    return (data || []).map(pr => ({
      id: `pr-${pr.id}`,
      type: 'pr_achieved' as const,
      title: '🔥 Novo PR!',
      message: `${pr.exercise_name}: ${pr.weight}kg x ${pr.reps}`,
      timestamp: new Date(pr.recorded_at),
      read: false,
      link: '/analytics',
    }));
  }, [user]);

  const checkGymPRs = useCallback(async () => {
    if (!user) return [];

    // Get user's gym
    const { data: profile } = await supabase.from('profiles').select('gym_id').eq('user_id', user.id).single();
    if (!profile?.gym_id) return [];

    // Get gym members
    const { data: members } = await supabase.from('gym_members').select('user_id').eq('gym_id', profile.gym_id);
    if (!members) return [];
    const mateIds = members.map(m => m.user_id).filter(id => id !== user.id);
    if (mateIds.length === 0) return [];

    // Get today's PRs from gym mates
    const today = new Date().toISOString().split('T')[0];
    const { data: prs } = await supabase
      .from('personal_records')
      .select('id, exercise_name, weight, reps, user_id, recorded_at')
      .in('user_id', mateIds)
      .gte('recorded_at', `${today}T00:00:00`)
      .order('recorded_at', { ascending: false })
      .limit(5);

    if (!prs || prs.length === 0) return [];

    const prUserIds = [...new Set(prs.map(p => p.user_id))];
    const { data: profiles } = await supabase.from('profiles').select('user_id, display_name').in('user_id', prUserIds);
    const nameMap = new Map((profiles || []).map(p => [p.user_id, p.display_name || 'Atleta']));

    return prs.map(pr => ({
      id: `gym-pr-${pr.id}`,
      type: 'gym_pr' as const,
      title: '🏋️ PR na sua academia!',
      message: `${nameMap.get(pr.user_id)} bateu ${pr.weight}kg x ${pr.reps} no ${pr.exercise_name}`,
      timestamp: new Date(pr.recorded_at),
      read: false,
      link: '/gym',
    }));
  }, [user]);

  const refreshNotifications = useCallback(async () => {
    if (!user) return;

    const readIds = JSON.parse(localStorage.getItem(`notifications_read_${user.id}`) || '[]');

    const [workouts, achievements, prs, gymPrs] = await Promise.all([
      checkPendingWorkouts(),
      checkRecentAchievements(),
      checkRecentPRs(),
      checkGymPRs(),
    ]);

    const all = [...workouts, ...achievements, ...prs, ...gymPrs]
      .map(n => ({ ...n, read: readIds.includes(n.id) }))
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    setNotifications(all);
    setUnreadCount(all.filter(n => !n.read).length);
  }, [user, checkPendingWorkouts, checkRecentAchievements, checkRecentPRs, checkGymPRs]);

  const markAsRead = useCallback((id: string) => {
    if (!user) return;
    const readIds = JSON.parse(localStorage.getItem(`notifications_read_${user.id}`) || '[]');
    if (!readIds.includes(id)) {
      readIds.push(id);
      localStorage.setItem(`notifications_read_${user.id}`, JSON.stringify(readIds));
    }
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, [user]);

  const markAllAsRead = useCallback(() => {
    if (!user) return;
    const readIds = notifications.map(n => n.id);
    localStorage.setItem(`notifications_read_${user.id}`, JSON.stringify(readIds));
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, [user, notifications]);

  useEffect(() => {
    refreshNotifications();
    const interval = setInterval(refreshNotifications, 5 * 60 * 1000); // refresh every 5 min
    return () => clearInterval(interval);
  }, [refreshNotifications]);

  return { notifications, unreadCount, markAsRead, markAllAsRead, refreshNotifications };
}
