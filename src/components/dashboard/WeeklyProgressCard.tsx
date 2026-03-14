import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Dumbbell, Calendar } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

const fadeIn = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4 } };

interface WeeklyStats {
  totalVolume: number;
  workoutCount: number;
  totalSets: number;
  avgLoad: number;
  prevWeekVolume: number;
}

export function WeeklyProgressCard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<WeeklyStats | null>(null);

  useEffect(() => {
    if (!user) return;

    const loadStats = async () => {
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      weekStart.setHours(0, 0, 0, 0);

      const prevWeekStart = new Date(weekStart);
      prevWeekStart.setDate(prevWeekStart.getDate() - 7);

      const [thisWeekRes, prevWeekRes, workoutCountRes] = await Promise.all([
        supabase
          .from('performed_sets')
          .select('weight_used, reps_completed')
          .eq('user_id', user.id)
          .eq('completed', true)
          .gte('created_at', weekStart.toISOString()),
        supabase
          .from('performed_sets')
          .select('weight_used, reps_completed')
          .eq('user_id', user.id)
          .eq('completed', true)
          .gte('created_at', prevWeekStart.toISOString())
          .lt('created_at', weekStart.toISOString()),
        supabase
          .from('workout_logs')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id)
          .gte('created_at', weekStart.toISOString()),
      ]);

      const thisWeekSets = thisWeekRes.data || [];
      const prevWeekSets = prevWeekRes.data || [];

      const totalVolume = thisWeekSets.reduce((sum, s) => sum + ((s.weight_used || 0) * (s.reps_completed || 0)), 0);
      const prevWeekVolume = prevWeekSets.reduce((sum, s) => sum + ((s.weight_used || 0) * (s.reps_completed || 0)), 0);
      const totalSets = thisWeekSets.length;
      const avgLoad = totalSets > 0
        ? Math.round(thisWeekSets.reduce((sum, s) => sum + (s.weight_used || 0), 0) / totalSets)
        : 0;

      setStats({
        totalVolume: Math.round(totalVolume),
        workoutCount: workoutCountRes.count || 0,
        totalSets,
        avgLoad,
        prevWeekVolume: Math.round(prevWeekVolume),
      });
    };

    loadStats();
  }, [user]);

  if (!stats) return null;

  const volumeChange = stats.prevWeekVolume > 0
    ? Math.round(((stats.totalVolume - stats.prevWeekVolume) / stats.prevWeekVolume) * 100)
    : 0;

  return (
    <motion.div {...fadeIn} className="bg-card rounded-xl border border-border p-4 sm:p-5 card-elevated">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Progresso Semanal</h3>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="text-center p-3 rounded-lg bg-secondary/40">
          <Calendar className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
          <p className="text-xl font-bold text-foreground">{stats.workoutCount}</p>
          <p className="text-[10px] text-muted-foreground">Treinos</p>
        </div>
        <div className="text-center p-3 rounded-lg bg-secondary/40">
          <Dumbbell className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
          <p className="text-xl font-bold text-foreground">{stats.totalSets}</p>
          <p className="text-[10px] text-muted-foreground">Séries</p>
        </div>
        <div className="text-center p-3 rounded-lg bg-secondary/40">
          <TrendingUp className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
          <p className="text-xl font-bold text-foreground">{stats.avgLoad}<span className="text-xs">kg</span></p>
          <p className="text-[10px] text-muted-foreground">Carga Média</p>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          Volume total: <strong className="text-foreground">{(stats.totalVolume / 1000).toFixed(1)}t</strong>
        </span>
        {volumeChange !== 0 && (
          <span className={cn(
            "text-xs font-medium flex items-center gap-0.5",
            volumeChange > 0 ? "text-success" : "text-destructive"
          )}>
            <TrendingUp className={cn("w-3 h-3", volumeChange < 0 && "rotate-180")} />
            {volumeChange > 0 ? '+' : ''}{volumeChange}% vs semana anterior
          </span>
        )}
      </div>
    </motion.div>
  );
}
