import { motion } from 'framer-motion';
import { Star, Zap } from 'lucide-react';
import { usePlayerLevel } from '@/hooks/usePlayerLevel';
import { cn } from '@/lib/utils';

const fadeIn = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4 } };

export function PlayerLevelCard() {
  const { playerLevel, loading } = usePlayerLevel();

  if (loading || !playerLevel) return null;

  const progressPct = playerLevel.xp_needed > 0
    ? Math.round((playerLevel.xp_in_level / playerLevel.xp_needed) * 100)
    : 0;

  return (
    <motion.div {...fadeIn} className="bg-card rounded-xl border border-border p-4 sm:p-5 card-elevated">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Nível do Atleta</h3>
        </div>
        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
          {playerLevel.title}
        </span>
      </div>

      <div className="flex items-end gap-1 mb-2">
        <span className="text-3xl font-black text-foreground tabular-nums">
          Lv.{playerLevel.player_level}
        </span>
      </div>

      {/* XP Progress Bar */}
      <div className="space-y-1">
        <div className="w-full h-2.5 rounded-full bg-secondary overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>{playerLevel.xp_in_level} XP</span>
          <span>{playerLevel.xp_needed} XP</span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-border">
        <Zap className="w-3.5 h-3.5 text-warning" />
        <span className="text-xs text-muted-foreground">
          Hoje: <strong className="text-foreground">{playerLevel.daily_xp}</strong> / 1000 XP
        </span>
      </div>
    </motion.div>
  );
}
