import { useTrainingStreak } from '@/hooks/useTrainingStreak';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export function StreakFireIcon() {
  const { streak, loading } = useTrainingStreak();

  const count = streak?.current_streak ?? 0;
  const lastDate = streak?.last_workout_date;
  const today = new Date().toISOString().split('T')[0];

  const daysSinceLast = lastDate
    ? Math.floor((new Date(today).getTime() - new Date(lastDate).getTime()) / 86400000)
    : 999;

  const status: 'frozen' | 'active' | 'hot' =
    (!streak || daysSinceLast > 3) ? 'frozen' :
    count >= 7 ? 'hot' : 'active';

  const emoji = status === 'frozen' ? '🧊' : '🔥';

  return (
    <motion.div
      className="relative flex items-center justify-center w-9 h-9 rounded-lg"
      animate={status === 'hot' ? {
        scale: [1, 1.18, 1],
        rotate: [0, -3, 3, 0],
      } : status === 'active' ? {
        scale: [1, 1.06, 1],
      } : undefined}
      transition={status !== 'frozen' ? {
        duration: status === 'hot' ? 1.2 : 2,
        repeat: Infinity,
        ease: 'easeInOut',
      } : undefined}
    >
      {/* Glow ring for hot streaks */}
      {status === 'hot' && (
        <motion.div
          className="absolute inset-0 rounded-lg bg-destructive/15"
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      <span className={cn(
        "text-xl leading-none relative z-10",
        status === 'frozen' && "opacity-40 grayscale",
        status === 'hot' && "drop-shadow-[0_0_8px_hsl(var(--destructive)/0.7)]",
        status === 'active' && "drop-shadow-[0_0_4px_hsl(var(--primary)/0.5)]",
      )}>
        {emoji}
      </span>

      {/* Counter badge — always visible */}
      <span className={cn(
        "absolute -bottom-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-extrabold flex items-center justify-center z-20 border-2 border-background",
        status === 'frozen'
          ? "bg-muted text-muted-foreground"
          : count >= 30
          ? "bg-destructive text-destructive-foreground"
          : count >= 7
          ? "bg-destructive/80 text-destructive-foreground"
          : "bg-primary text-primary-foreground"
      )}>
        {count}
      </span>
    </motion.div>
  );
}
