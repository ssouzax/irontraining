import { useState, useEffect } from 'react';
import { Flame, Trophy, Calendar, TrendingUp, Loader2, Share2, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTrainingStreak } from '@/hooks/useTrainingStreak';
import { usePlayerLevel } from '@/hooks/usePlayerLevel';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export function MobileStreakCard() {
  const { streak, loading } = useTrainingStreak();
  const { playerLevel } = usePlayerLevel();
  const { user } = useAuth();
  const navigate = useNavigate();

  const shareStreak = async () => {
    if (!user || !streak) return;
    await supabase.from('posts').insert({
      user_id: user.id,
      post_type: 'update',
      caption: `🔥 ${streak.current_streak} dias de training streak! Recorde pessoal: ${streak.longest_streak} dias. Nunca paro! 💪`,
    });
    toast.success('Streak compartilhado no feed!');
  };

  if (loading || !streak) return null;

  const streakEmoji = streak.current_streak >= 30 ? '🔥' : streak.current_streak >= 14 ? '💪' : streak.current_streak >= 7 ? '⚡' : '🏋️';
  const streakColor = streak.current_streak >= 30 ? 'from-orange-500/20 to-red-500/20 border-orange-500/30' :
    streak.current_streak >= 14 ? 'from-primary/20 to-primary/10 border-primary/30' :
    streak.current_streak >= 7 ? 'from-yellow-500/20 to-amber-500/20 border-yellow-500/30' :
    'from-secondary to-secondary border-border';

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className={cn("mx-4 mt-4 p-4 rounded-2xl bg-gradient-to-r border", streakColor)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{streakEmoji}</span>
          <div>
            <p className="text-2xl font-extrabold text-foreground tracking-tight">{streak.current_streak}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Dias de Streak</p>
          </div>
        </div>
        <button onClick={shareStreak} className="p-2 rounded-full bg-background/50 text-muted-foreground hover:text-foreground">
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="text-center p-2 rounded-xl bg-background/40">
          <Trophy className="w-3.5 h-3.5 text-primary mx-auto mb-0.5" />
          <p className="text-sm font-bold text-foreground">{streak.longest_streak}</p>
          <p className="text-[9px] text-muted-foreground">Recorde</p>
        </div>
        <div className="text-center p-2 rounded-xl bg-background/40">
          <Calendar className="w-3.5 h-3.5 text-primary mx-auto mb-0.5" />
          <p className="text-sm font-bold text-foreground">{streak.weekly_consistency_streak}</p>
          <p className="text-[9px] text-muted-foreground">Semanas</p>
        </div>
        <div className="text-center p-2 rounded-xl bg-background/40">
          <Crown className="w-3.5 h-3.5 text-primary mx-auto mb-0.5" />
          <p className="text-sm font-bold text-foreground">Lv.{playerLevel?.player_level || 1}</p>
          <p className="text-[9px] text-muted-foreground">{playerLevel?.title || 'Novato'}</p>
        </div>
      </div>
    </motion.div>
  );
}
