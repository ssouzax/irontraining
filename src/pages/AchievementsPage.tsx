import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Trophy, Share2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTraining } from '@/contexts/TrainingContext';
import { calculate1RM } from '@/data/defaultProfile';
import { cn } from '@/lib/utils';
import ShareableCard from '@/components/ShareableCard';

interface AchievementLevel {
  id: string;
  achievement_key: string;
  category: string;
  level_name: string;
  level_number: number;
  title: string;
  description: string;
  requirement_type: string;
  requirement_value: number;
  icon: string | null;
}

interface UserAchievement {
  id: string;
  type: string;
  title: string;
  description: string;
  icon: string | null;
  unlocked_at: string;
  value: number | null;
}

const CATEGORY_LABELS: Record<string, { label: string; emoji: string }> = {
  strength: { label: 'Força', emoji: '🏋️' },
  consistency: { label: 'Consistência', emoji: '🔥' },
  milestones: { label: 'PRs & Marcos', emoji: '⚡' },
  volume: { label: 'Volume', emoji: '📈' },
  social: { label: 'Social', emoji: '🌐' },
};

export default function AchievementsPage() {
  const { user } = useAuth();
  const { profile } = useTraining();
  const [allLevels, setAllLevels] = useState<AchievementLevel[]>([]);
  const [unlocked, setUnlocked] = useState<UserAchievement[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [shareCard, setShareCard] = useState<{ open: boolean; title: string; subtitle: string; stat?: string; icon?: string } | null>(null);

  const squat1RM = calculate1RM(profile.currentLifts.squat.weight, profile.currentLifts.squat.reps);
  const bench1RM = calculate1RM(profile.currentLifts.bench.weight, profile.currentLifts.bench.reps);
  const deadlift1RM = calculate1RM(profile.currentLifts.deadlift.weight, profile.currentLifts.deadlift.reps);
  const total = squat1RM + bench1RM + deadlift1RM;
  const bw = profile.bodyWeight || 94;

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    const [levelsRes, unlockedRes] = await Promise.all([
      supabase.from('achievement_levels').select('*').order('category').order('requirement_value'),
      user ? supabase.from('achievements').select('*').eq('user_id', user.id).order('unlocked_at', { ascending: false }) : Promise.resolve({ data: [] }),
    ]);
    if (levelsRes.data) setAllLevels(levelsRes.data as AchievementLevel[]);
    if (unlockedRes.data) setUnlocked(unlockedRes.data as UserAchievement[]);
  };

  // Auto-unlock strength achievements based on current lifts
  useEffect(() => {
    if (!user || allLevels.length === 0) return;
    const unlockedTypes = new Set(unlocked.map(a => a.type));

    const currentValues: Record<string, number> = {
      squat_1rm: squat1RM, bench_1rm: bench1RM, deadlift_1rm: deadlift1RM, total,
      squat_bw_ratio: bw > 0 ? squat1RM / bw : 0,
      bench_bw_ratio: bw > 0 ? bench1RM / bw : 0,
      deadlift_bw_ratio: bw > 0 ? deadlift1RM / bw : 0,
      total_bw_ratio: bw > 0 ? total / bw : 0,
    };

    const toUnlock = allLevels.filter(def => {
      if (unlockedTypes.has(def.achievement_key)) return false;
      const val = currentValues[def.requirement_type];
      return val !== undefined && val >= def.requirement_value;
    });

    if (toUnlock.length > 0) {
      const inserts = toUnlock.map(def => ({
        user_id: user.id,
        type: def.achievement_key,
        title: def.title,
        description: def.description,
        icon: def.icon,
        exercise: def.category,
        value: currentValues[def.requirement_type] || null,
      }));
      // Use upsert-like approach: insert with ON CONFLICT DO NOTHING via unique constraint
      supabase.from('achievements').upsert(inserts, { onConflict: 'user_id,type', ignoreDuplicates: true }).then(() => loadData());
    }
  }, [user, allLevels, squat1RM, bench1RM, deadlift1RM]);

  const unlockedTypes = new Set(unlocked.map(a => a.type));
  const categories = ['all', ...Object.keys(CATEGORY_LABELS)];

  const filteredLevels = activeCategory === 'all' ? allLevels : allLevels.filter(l => l.category === activeCategory);
  const unlockedFiltered = activeCategory === 'all' ? unlocked : unlocked.filter(a => {
    const level = allLevels.find(l => l.achievement_key === a.type);
    return level?.category === activeCategory;
  });

  const getCurrentValue = (def: AchievementLevel): number => {
    const map: Record<string, number> = {
      squat_1rm: squat1RM, bench_1rm: bench1RM, deadlift_1rm: deadlift1RM, total,
      squat_bw_ratio: bw > 0 ? squat1RM / bw : 0,
      bench_bw_ratio: bw > 0 ? bench1RM / bw : 0,
      deadlift_bw_ratio: bw > 0 ? deadlift1RM / bw : 0,
      total_bw_ratio: bw > 0 ? total / bw : 0,
    };
    return map[def.requirement_type] || 0;
  };

  const getUnit = (type: string) => {
    if (type.includes('ratio')) return 'x';
    if (type.includes('1rm') || type === 'total') return 'kg';
    return '';
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Conquistas</h1>
        <p className="text-muted-foreground mt-1">{unlocked.length} de {allLevels.length} desbloqueadas</p>
      </motion.div>

      {/* Progress */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-xl border border-border p-5 card-elevated">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">Progresso Geral</span>
          <span className="text-xs text-muted-foreground font-mono">{unlocked.length}/{allLevels.length}</span>
        </div>
        <div className="h-3 bg-secondary rounded-full overflow-hidden">
          <motion.div className="h-full bg-primary rounded-full"
            animate={{ width: `${allLevels.length > 0 ? (unlocked.length / allLevels.length) * 100 : 0}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </motion.div>

      {/* Category Filter */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {categories.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            className={cn("px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors",
              activeCategory === cat ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
            )}>
            {cat === 'all' ? '🏅 Todas' : `${CATEGORY_LABELS[cat]?.emoji} ${CATEGORY_LABELS[cat]?.label}`}
          </button>
        ))}
      </div>

      {/* Unlocked */}
      {unlockedFiltered.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-400" /> Desbloqueadas ({unlockedFiltered.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {unlockedFiltered.map((ach, i) => (
              <motion.div key={ach.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }}
                className="bg-card rounded-xl border border-primary/20 p-4 card-elevated flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl shrink-0">
                  {ach.icon || '🏆'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{ach.title}</p>
                  <p className="text-xs text-muted-foreground">{ach.description}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {new Date(ach.unlocked_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <button onClick={() => setShareCard({
                  open: true, title: ach.title, subtitle: ach.description,
                  stat: ach.value ? `${ach.value}kg` : undefined, icon: ach.icon || '🏆',
                })} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors shrink-0">
                  <Share2 className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Locked */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground">Bloqueadas</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredLevels.filter(def => !unlockedTypes.has(def.achievement_key)).map(def => {
            const current = getCurrentValue(def);
            const progress = Math.min(100, (current / def.requirement_value) * 100);
            const unit = getUnit(def.requirement_type);
            const showProgress = current > 0 && ['squat_1rm', 'bench_1rm', 'deadlift_1rm', 'total', 'squat_bw_ratio', 'bench_bw_ratio', 'deadlift_bw_ratio', 'total_bw_ratio'].includes(def.requirement_type);
            return (
              <div key={def.achievement_key} className="bg-card rounded-xl border border-border p-4 card-elevated flex items-start gap-3 opacity-60">
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-2xl shrink-0 grayscale">
                  {def.icon || '🏆'}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{def.title}</p>
                  <p className="text-xs text-muted-foreground">{def.description}</p>
                  {showProgress && (
                    <div className="mt-2">
                      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-muted-foreground/30 rounded-full transition-all" style={{ width: `${progress}%` }} />
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {Math.round(current * 100) / 100}{unit} / {def.requirement_value}{unit}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Share Card Modal */}
      {shareCard && (
        <ShareableCard
          open={shareCard.open}
          onClose={() => setShareCard(null)}
          type="achievement"
          title={shareCard.title}
          subtitle={shareCard.subtitle}
          stat={shareCard.stat}
          icon={shareCard.icon}
        />
      )}
    </div>
  );
}
