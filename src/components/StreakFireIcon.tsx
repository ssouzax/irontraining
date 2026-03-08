import { useTrainingStreak } from '@/hooks/useTrainingStreak';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export function StreakFireIcon() {
  const { streak, loading } = useTrainingStreak();

  if (loading || !streak) return null;

  const count = streak.current_streak;
  const lastDate = streak.last_workout_date;
  const today = new Date().toISOString().split('T')[0];

  // Determine status
  const daysSinceLast = lastDate
    ? Math.floor((new Date(today).getTime() - new Date(lastDate).getTime()) / 86400000)
    : 999;

  const status: 'frozen' | 'active' | 'hot' =
    daysSinceLast > 3 ? 'frozen' :
    count >= 7 ? 'hot' : 'active';

  const emoji = status === 'frozen' ? '🧊' : count >= 30 ? '🔥' : count >= 7 ? '🔥' : '🔥';

  return (
    <motion.div
      className="relative flex items-center justify-center"
      animate={status === 'hot' ? {
        scale: [1, 1.15, 1],
      } : undefined}
      transition={status === 'hot' ? {
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      } : undefined}
    >
      <span className={cn(
        "text-lg leading-none",
        status === 'frozen' && "opacity-50 grayscale",
        status === 'hot' && "drop-shadow-[0_0_6px_hsl(var(--destructive)/0.6)]"
      )}>
        {emoji}
      </span>
      {count > 0 && status !== 'frozen' && (
        <span className={cn(
          "absolute -bottom-1.5 -right-1.5 min-w-[16px] h-4 px-0.5 rounded-full text-[9px] font-extrabold flex items-center justify-center",
          count >= 30
            ? "bg-destructive text-destructive-foreground"
            : count >= 7
            ? "bg-orange-500 text-white"
            : "bg-primary text-primary-foreground"
        )}>
          {count}
        </span>
      )}
    </motion.div>
  );
}
