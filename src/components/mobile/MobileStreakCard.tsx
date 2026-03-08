import { useState, useEffect, useRef } from 'react';
import { Flame, Trophy, Calendar, Share2, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTrainingStreak } from '@/hooks/useTrainingStreak';
import { usePlayerLevel } from '@/hooks/usePlayerLevel';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import ShareableCard from '@/components/ShareableCard';

const MILESTONES = [7, 15, 30, 50, 100, 150, 200];
const CONFETTI_MILESTONES = [7, 30, 100];

function useConfetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const fire = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.display = 'block';

    const particles: { x: number; y: number; vx: number; vy: number; color: string; size: number; life: number }[] = [];
    const colors = ['#ff6b35', '#ff4444', '#ffd700', '#ff8c00', '#ff1493', '#00ff88', '#4dabf7'];

    for (let i = 0; i < 120; i++) {
      particles.push({
        x: canvas.width / 2 + (Math.random() - 0.5) * 200,
        y: canvas.height / 2,
        vx: (Math.random() - 0.5) * 16,
        vy: Math.random() * -18 - 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 3,
        life: 1,
      });
    }

    let frame = 0;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      particles.forEach(p => {
        if (p.life <= 0) return;
        alive = true;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.4;
        p.life -= 0.012;
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.roundRect(p.x, p.y, p.size, p.size * 1.5, 2);
        ctx.fill();
      });
      frame++;
      if (alive && frame < 180) {
        requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        canvas.style.display = 'none';
      }
    };
    requestAnimationFrame(animate);
  };

  return { canvasRef, fire };
}

export function MobileStreakCard() {
  const { streak, loading } = useTrainingStreak();
  const { playerLevel } = usePlayerLevel();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showShareCard, setShowShareCard] = useState(false);
  const { canvasRef, fire: fireConfetti } = useConfetti();
  const firedRef = useRef(false);

  // Fire confetti on milestone
  useEffect(() => {
    if (!streak || firedRef.current) return;
    const shownKey = `confetti_shown_${user?.id}_${streak.current_streak}`;
    if (CONFETTI_MILESTONES.includes(streak.current_streak) && !localStorage.getItem(shownKey)) {
      firedRef.current = true;
      localStorage.setItem(shownKey, '1');
      setTimeout(() => fireConfetti(), 500);
    }
  }, [streak, user]);

  const handleShare = () => {
    setShowShareCard(true);
    // Also post to feed
    if (user && streak) {
      supabase.from('posts').insert({
        user_id: user.id,
        post_type: 'update',
        caption: `🔥 ${streak.current_streak} dias de training streak! Recorde pessoal: ${streak.longest_streak} dias. Nunca paro! 💪`,
      });
    }
  };

  if (loading || !streak) return null;

  const streakEmoji = streak.current_streak >= 30 ? '🔥' : streak.current_streak >= 14 ? '💪' : streak.current_streak >= 7 ? '⚡' : '🏋️';
  const streakColor = streak.current_streak >= 30 ? 'from-orange-500/20 to-red-500/20 border-orange-500/30' :
    streak.current_streak >= 14 ? 'from-primary/20 to-primary/10 border-primary/30' :
    streak.current_streak >= 7 ? 'from-yellow-500/20 to-amber-500/20 border-yellow-500/30' :
    'from-secondary to-secondary border-border';

  const getBadgeLabel = (days: number) => {
    if (days >= 200) return 'Imortal';
    if (days >= 100) return 'Lenda';
    if (days >= 50) return 'Titã';
    if (days >= 30) return 'Máquina';
    if (days >= 7) return 'Dedicado';
    return 'Iniciante';
  };

  return (
    <>
      {/* Confetti canvas */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 z-[100] pointer-events-none"
        style={{ display: 'none' }}
      />

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
          <div className="flex items-center gap-1">
            <button onClick={() => navigate('/streaks')} className="p-2 rounded-full bg-background/50 text-muted-foreground hover:text-foreground">
              <Trophy className="w-4 h-4" />
            </button>
            <button onClick={handleShare} className="p-2 rounded-full bg-background/50 text-muted-foreground hover:text-foreground">
              <Share2 className="w-4 h-4" />
            </button>
          </div>
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

      {/* Shareable streak card */}
      <ShareableCard
        open={showShareCard}
        onClose={() => setShowShareCard(false)}
        type="streak"
        title={getBadgeLabel(streak.current_streak)}
        subtitle={`Recorde: ${streak.longest_streak} dias · ${streak.weekly_consistency_streak} semanas consistentes`}
        icon="🔥"
        streakDays={streak.current_streak}
        username={undefined}
      />
    </>
  );
}
