import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Trophy, Medal, Star, Crown, Award } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTraining } from '@/contexts/TrainingContext';
import { calculate1RM } from '@/data/defaultProfile';
import { ACHIEVEMENT_DEFS } from '@/lib/strengthStandards';
import { cn } from '@/lib/utils';

interface Achievement {
  id: string;
  type: string;
  title: string;
  description: string;
  icon: string;
  exercise: string | null;
  value: number | null;
  unlocked_at: string;
}

const ICON_MAP: Record<string, any> = { trophy: Trophy, medal: Medal, star: Star, crown: Crown, award: Award };

export default function AchievementsPage() {
  const { user } = useAuth();
  const { profile } = useTraining();
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  const squat1RM = calculate1RM(profile.currentLifts.squat.weight, profile.currentLifts.squat.reps);
  const bench1RM = calculate1RM(profile.currentLifts.bench.weight, profile.currentLifts.bench.reps);
  const deadlift1RM = calculate1RM(profile.currentLifts.deadlift.weight, profile.currentLifts.deadlift.reps);
  const total = squat1RM + bench1RM + deadlift1RM;

  const currentValues: Record<string, number> = { squat: squat1RM, bench: bench1RM, deadlift: deadlift1RM, total };

  useEffect(() => {
    if (!user) return;
    supabase.from('achievements').select('*').eq('user_id', user.id).order('unlocked_at', { ascending: false })
      .then(({ data }) => { if (data) setAchievements(data as Achievement[]); });
  }, [user]);

  const unlockedTypes = new Set(achievements.map(a => a.type));

  // Check & auto-unlock achievements
  useEffect(() => {
    if (!user) return;
    const toUnlock = ACHIEVEMENT_DEFS.filter(def => {
      if (unlockedTypes.has(def.type)) return false;
      return currentValues[def.exercise] >= def.threshold;
    });
    if (toUnlock.length > 0) {
      const inserts = toUnlock.map(def => ({
        user_id: user.id,
        type: def.type,
        title: def.title,
        description: def.description,
        icon: 'trophy',
        exercise: def.exercise,
        value: currentValues[def.exercise],
      }));
      supabase.from('achievements').insert(inserts).then(() => {
        supabase.from('achievements').select('*').eq('user_id', user.id).order('unlocked_at', { ascending: false })
          .then(({ data }) => { if (data) setAchievements(data as Achievement[]); });
      });
    }
  }, [user, squat1RM, bench1RM, deadlift1RM]);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Conquistas</h1>
        <p className="text-muted-foreground mt-1">{achievements.length} de {ACHIEVEMENT_DEFS.length} desbloqueadas</p>
      </motion.div>

      {/* Progress */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-xl border border-border p-5 card-elevated">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">Progresso Geral</span>
          <span className="text-xs text-muted-foreground font-mono">{achievements.length}/{ACHIEVEMENT_DEFS.length}</span>
        </div>
        <div className="h-3 bg-secondary rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            animate={{ width: `${(achievements.length / ACHIEVEMENT_DEFS.length) * 100}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </motion.div>

      {/* Unlocked */}
      {achievements.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-400" /> Desbloqueadas
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {achievements.map((ach, i) => (
              <motion.div key={ach.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                className="bg-card rounded-xl border border-primary/20 p-4 card-elevated flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl shrink-0">
                  {ACHIEVEMENT_DEFS.find(d => d.type === ach.type)?.icon || '🏆'}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{ach.title}</p>
                  <p className="text-xs text-muted-foreground">{ach.description}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {new Date(ach.unlocked_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Locked */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground text-muted-foreground">Bloqueadas</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ACHIEVEMENT_DEFS.filter(def => !unlockedTypes.has(def.type)).map(def => {
            const current = currentValues[def.exercise] || 0;
            const progress = Math.min(100, (current / def.threshold) * 100);
            return (
              <div key={def.type} className="bg-card rounded-xl border border-border p-4 card-elevated flex items-start gap-3 opacity-60">
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-2xl shrink-0 grayscale">
                  {def.icon}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{def.title}</p>
                  <p className="text-xs text-muted-foreground">{def.description}</p>
                  <div className="mt-2">
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-muted-foreground/30 rounded-full" style={{ width: `${progress}%` }} />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">{current}kg / {def.threshold}kg</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
