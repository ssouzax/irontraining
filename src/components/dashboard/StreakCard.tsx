import { motion } from 'framer-motion';
import { Flame, Snowflake, Calendar, Award } from 'lucide-react';
import { useTrainingStreak } from '@/hooks/useTrainingStreak';
import { cn } from '@/lib/utils';

const fadeIn = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4 } };

export function StreakCard() {
  const { streak, loading } = useTrainingStreak();

  if (loading) return null;

  const current = streak?.current_streak ?? 0;
  const longest = streak?.longest_streak ?? 0;
  const lastDate = streak?.last_workout_date;
  const today = new Date().toISOString().split('T')[0];
  const daysSinceLast = lastDate
    ? Math.floor((new Date(today).getTime() - new Date(lastDate).getTime()) / 86400000)
    : 999;

  const isActive = daysSinceLast <= 3 && current > 0;
  const isHot = current >= 7;

  return (
    <motion.div {...fadeIn} className="bg-card rounded-xl border border-border p-4 sm:p-5 card-elevated">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {isActive ? (
            <motion.div
              animate={isHot ? { scale: [1, 1.15, 1], rotate: [0, -3, 3, 0] } : { scale: [1, 1.05, 1] }}
              transition={{ duration: isHot ? 1.2 : 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Flame className={cn("w-5 h-5", isHot ? "text-destructive" : "text-primary")} />
            </motion.div>
          ) : (
            <Snowflake className="w-5 h-5 text-muted-foreground" />
          )}
          <h3 className="text-sm font-semibold text-foreground">Streak de Treinos</h3>
        </div>
      </div>

      <div className="flex items-end gap-1 mb-2">
        <span className={cn(
          "text-3xl font-black tabular-nums",
          isHot ? "text-destructive" : isActive ? "text-primary" : "text-muted-foreground"
        )}>
          {current}
        </span>
        <span className="text-sm text-muted-foreground mb-1">dias</span>
      </div>

      {!isActive && current === 0 && (
        <p className="text-xs text-warning">⚠ Streak interrompida — treine hoje para recomeçar!</p>
      )}
      {isActive && isHot && (
        <p className="text-xs text-destructive font-medium">🔥 Você está on fire! Continue assim!</p>
      )}

      <div className="flex gap-3 mt-3 pt-3 border-t border-border">
        <div className="flex items-center gap-1.5">
          <Award className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Recorde: <strong className="text-foreground">{longest}</strong></span>
        </div>
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Consistência: <strong className="text-foreground">{streak?.weekly_consistency_streak ?? 0}</strong> sem</span>
        </div>
      </div>
    </motion.div>
  );
}
