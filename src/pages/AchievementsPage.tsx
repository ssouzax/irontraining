import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useMemo } from 'react';
import { Trophy, Share2, Lock, Eye, EyeOff, TreePine, Calendar, Sparkles, Star, Crown, Gem, Medal } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTraining } from '@/contexts/TrainingContext';
import { calculate1RM } from '@/data/defaultProfile';
import { cn } from '@/lib/utils';
import ShareableCard from '@/components/ShareableCard';
import { usePlayerLevel } from '@/hooks/usePlayerLevel';
import LevelUpModal from '@/components/LevelUpModal';

interface AchievementLevel {
  id: string;
  achievement_key: string;
  category: string;
  title: string;
  description: string;
  requirement_type: string;
  requirement_value: number;
  icon: string | null;
  rarity: string;
  is_secret: boolean;
  is_seasonal: boolean;
  season_id: number | null;
  tree_id: string | null;
  tree_order: number;
  parent_achievement_key: string | null;
  unlock_count: number;
  total_users: number;
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

const RARITY_CONFIG: Record<string, { label: string; color: string; border: string; bg: string; icon: any }> = {
  common: { label: 'Comum', color: 'text-muted-foreground', border: 'border-border', bg: 'bg-secondary', icon: Medal },
  uncommon: { label: 'Incomum', color: 'text-green-400', border: 'border-green-500/30', bg: 'bg-green-500/10', icon: Star },
  rare: { label: 'Raro', color: 'text-blue-400', border: 'border-blue-500/30', bg: 'bg-blue-500/10', icon: Gem },
  epic: { label: 'Épico', color: 'text-purple-400', border: 'border-purple-500/30', bg: 'bg-purple-500/10', icon: Sparkles },
  legendary: { label: 'Lendário', color: 'text-yellow-400', border: 'border-yellow-500/30', bg: 'bg-yellow-500/10', icon: Crown },
};

const CATEGORY_LABELS: Record<string, { label: string; emoji: string }> = {
  strength: { label: 'Força', emoji: '🏋️' },
  consistency: { label: 'Consistência', emoji: '🔥' },
  milestones: { label: 'PRs & Marcos', emoji: '⚡' },
  volume: { label: 'Volume', emoji: '📈' },
  social: { label: 'Social', emoji: '🌐' },
};

const TREE_LABELS: Record<string, string> = {
  squat_tree: '🏋️ Árvore do Agachamento',
  bench_tree: '💪 Árvore do Supino',
  deadlift_tree: '🏋️ Árvore do Terra',
  total_tree: '⭐ Árvore do Total',
  pr_tree: '🏆 Árvore de PRs',
  consistency_tree: '🔥 Árvore de Consistência',
};

type TabType = 'all' | 'secret' | 'seasonal' | 'trees';

export default function AchievementsPage() {
  const { user } = useAuth();
  const { profile } = useTraining();
  const { playerLevel, addXP, levelUpEvent, dismissLevelUp } = usePlayerLevel();
  const [allLevels, setAllLevels] = useState<AchievementLevel[]>([]);
  const [unlocked, setUnlocked] = useState<UserAchievement[]>([]);
  const [tab, setTab] = useState<TabType>('all');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [shareCard, setShareCard] = useState<{ open: boolean; title: string; subtitle: string; stat?: string; icon?: string; rarity?: string } | null>(null);

  const squat1RM = calculate1RM(profile.currentLifts.squat.weight, profile.currentLifts.squat.reps);
  const bench1RM = calculate1RM(profile.currentLifts.bench.weight, profile.currentLifts.bench.reps);
  const deadlift1RM = calculate1RM(profile.currentLifts.deadlift.weight, profile.currentLifts.deadlift.reps);
  const total = squat1RM + bench1RM + deadlift1RM;
  const bw = profile.bodyWeight || 94;

  useEffect(() => { loadData(); }, [user]);

  const loadData = async () => {
    const [levelsRes, unlockedRes] = await Promise.all([
      supabase.from('achievement_levels').select('*').order('category').order('requirement_value'),
      user ? supabase.from('achievements').select('*').eq('user_id', user.id).order('unlocked_at', { ascending: false }) : Promise.resolve({ data: [] }),
    ]);
    if (levelsRes.data) setAllLevels(levelsRes.data as unknown as AchievementLevel[]);
    if (unlockedRes.data) setUnlocked(unlockedRes.data as UserAchievement[]);
  };

  // Auto-unlock
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
      if (def.is_seasonal || def.is_secret) return false; // Don't auto-unlock these from lifts
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
      supabase.from('achievements').upsert(inserts, { onConflict: 'user_id,type', ignoreDuplicates: true }).then(() => {
        // Award XP per achievement
        toUnlock.forEach(def => {
          const xpMap: Record<string, number> = { common: 50, uncommon: 80, rare: 120, epic: 200, legendary: 350 };
          addXP(xpMap[def.rarity] || 50);
        });
        loadData();
      });
    }
  }, [user, allLevels, squat1RM, bench1RM, deadlift1RM]);

  const unlockedTypes = new Set(unlocked.map(a => a.type));

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

  const getUnit = (type: string) => type.includes('ratio') ? 'x' : type.includes('1rm') || type === 'total' ? 'kg' : '';

  const getUnlockPct = (def: AchievementLevel) => {
    if (def.total_users === 0) return null;
    return Math.round((def.unlock_count / def.total_users) * 1000) / 10;
  };

  // Filtered data
  const filteredLevels = useMemo(() => {
    let levels = allLevels;
    if (tab === 'secret') levels = levels.filter(l => l.is_secret);
    else if (tab === 'seasonal') levels = levels.filter(l => l.is_seasonal);
    else if (tab === 'trees') levels = levels.filter(l => l.tree_id);
    else levels = levels.filter(l => !l.is_secret || unlockedTypes.has(l.achievement_key));

    if (activeCategory !== 'all' && tab === 'all') levels = levels.filter(l => l.category === activeCategory);
    return levels;
  }, [allLevels, tab, activeCategory, unlockedTypes]);

  const treeGroups = useMemo(() => {
    if (tab !== 'trees') return {};
    const groups: Record<string, AchievementLevel[]> = {};
    filteredLevels.forEach(l => {
      if (l.tree_id) {
        if (!groups[l.tree_id]) groups[l.tree_id] = [];
        groups[l.tree_id].push(l);
      }
    });
    Object.values(groups).forEach(g => g.sort((a, b) => a.tree_order - b.tree_order));
    return groups;
  }, [filteredLevels, tab]);

  const categories = ['all', ...Object.keys(CATEGORY_LABELS)];
  const totalUnlocked = unlocked.length;

  const renderAchievementCard = (def: AchievementLevel, isUnlocked: boolean, ach?: UserAchievement) => {
    const rarity = RARITY_CONFIG[def.rarity] || RARITY_CONFIG.common;
    const RarityIcon = rarity.icon;
    const isHiddenSecret = def.is_secret && !isUnlocked;
    const current = getCurrentValue(def);
    const progress = Math.min(100, (current / def.requirement_value) * 100);
    const unit = getUnit(def.requirement_type);
    const showProgress = !isUnlocked && current > 0 && ['squat_1rm', 'bench_1rm', 'deadlift_1rm', 'total', 'squat_bw_ratio', 'bench_bw_ratio', 'deadlift_bw_ratio', 'total_bw_ratio'].includes(def.requirement_type);
    const unlockPct = getUnlockPct(def);

    return (
      <motion.div
        key={def.achievement_key}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "bg-card rounded-xl p-4 card-elevated flex items-start gap-3 border transition-colors",
          isUnlocked ? rarity.border : "border-border opacity-60"
        )}
      >
        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0",
          isUnlocked ? rarity.bg : "bg-secondary grayscale"
        )}>
          {isHiddenSecret ? <Lock className="w-5 h-5 text-muted-foreground" /> : (def.icon || '🏆')}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-semibold text-foreground truncate">
              {isHiddenSecret ? '???' : def.title}
            </p>
            <RarityIcon className={cn("w-3 h-3 shrink-0", rarity.color)} />
          </div>
          <p className="text-xs text-muted-foreground">
            {isHiddenSecret ? 'Conquista secreta — desbloqueie para revelar' : def.description}
          </p>
          
          {/* Rarity badge */}
          <div className="flex items-center gap-2 mt-1.5">
            <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium", rarity.bg, rarity.color)}>
              {rarity.label}
            </span>
            {unlockPct !== null && (
              <span className="text-[10px] text-muted-foreground">{unlockPct}% desbloquearam</span>
            )}
            {def.is_seasonal && <span className="text-[10px] text-primary">🗓️ Sazonal</span>}
          </div>

          {isUnlocked && ach && (
            <p className="text-[10px] text-muted-foreground mt-1">
              {new Date(ach.unlocked_at).toLocaleDateString('pt-BR')}
            </p>
          )}

          {showProgress && !isHiddenSecret && (
            <div className="mt-2">
              <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                <div className={cn("h-full rounded-full transition-all", rarity.bg.replace('/10', '/40'))} style={{ width: `${progress}%` }} />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                {Math.round(current * 100) / 100}{unit} / {def.requirement_value}{unit}
              </p>
            </div>
          )}
        </div>
        {isUnlocked && !isHiddenSecret && (
          <button onClick={() => setShareCard({
            open: true, title: def.title, subtitle: def.description,
            stat: ach?.value ? `${ach.value}kg` : undefined, icon: def.icon || '🏆', rarity: def.rarity,
          })} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors shrink-0">
            <Share2 className="w-3.5 h-3.5" />
          </button>
        )}
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Level Up Modal */}
      {levelUpEvent && (
        <LevelUpModal open={true} level={levelUpEvent.newLevel} title={levelUpEvent.title} onClose={dismissLevelUp} />
      )}

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Conquistas</h1>
        <p className="text-muted-foreground mt-1">{totalUnlocked} de {allLevels.filter(l => !l.is_secret || unlockedTypes.has(l.achievement_key)).length} desbloqueadas</p>
      </motion.div>

      {/* Player Level Card */}
      {playerLevel && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-primary/10 via-card to-card rounded-xl border border-primary/20 p-5 card-elevated">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center">
              <span className="text-2xl font-extrabold text-primary">{playerLevel.player_level}</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground">{playerLevel.title}</p>
              <p className="text-xs text-muted-foreground">Nível {playerLevel.player_level} • {playerLevel.lifetime_xp.toLocaleString()} XP total</p>
              <div className="mt-2">
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <motion.div className="h-full bg-primary rounded-full"
                    animate={{ width: `${(playerLevel.xp_in_level / playerLevel.xp_needed) * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {playerLevel.xp_in_level} / {playerLevel.xp_needed} XP • {MAX_DAILY_XP - playerLevel.daily_xp} XP restante hoje
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Progress Bar */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-xl border border-border p-5 card-elevated">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">Progresso Geral</span>
          <span className="text-xs text-muted-foreground font-mono">{totalUnlocked}/{allLevels.length}</span>
        </div>
        <div className="h-3 bg-secondary rounded-full overflow-hidden">
          <motion.div className="h-full bg-primary rounded-full"
            animate={{ width: `${allLevels.length > 0 ? (totalUnlocked / allLevels.length) * 100 : 0}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary/50 rounded-xl p-1">
        {([
          { key: 'all' as TabType, label: '🏅 Todas', icon: Trophy },
          { key: 'secret' as TabType, label: '🤫 Secretas', icon: EyeOff },
          { key: 'seasonal' as TabType, label: '🗓️ Sazonais', icon: Calendar },
          { key: 'trees' as TabType, label: '🌳 Árvores', icon: TreePine },
        ]).map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); setActiveCategory('all'); }}
            className={cn("flex-1 py-2 rounded-lg text-xs font-medium transition-colors",
              tab === t.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            )}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Category filter (only for 'all' tab) */}
      {tab === 'all' && (
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
      )}

      {/* Trees View */}
      {tab === 'trees' ? (
        <div className="space-y-6">
          {Object.entries(treeGroups).map(([treeId, nodes]) => (
            <div key={treeId} className="space-y-2">
              <h3 className="text-sm font-bold text-foreground">{TREE_LABELS[treeId] || treeId}</h3>
              <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-border" />
                <div className="space-y-2">
                  {nodes.map((node, idx) => {
                    const isUnlocked = unlockedTypes.has(node.achievement_key);
                    const ach = unlocked.find(a => a.type === node.achievement_key);
                    const rarity = RARITY_CONFIG[node.rarity] || RARITY_CONFIG.common;
                    return (
                      <div key={node.achievement_key} className="relative pl-14">
                        {/* Node dot */}
                        <div className={cn(
                          "absolute left-4 top-4 w-4 h-4 rounded-full border-2 z-10",
                          isUnlocked ? "bg-primary border-primary" : "bg-secondary border-border"
                        )} />
                        {renderAchievementCard(node, isUnlocked, ach)}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Unlocked */}
          {(() => {
            const unlockedHere = filteredLevels.filter(def => unlockedTypes.has(def.achievement_key));
            if (unlockedHere.length === 0) return null;
            return (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-yellow-400" /> Desbloqueadas ({unlockedHere.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {unlockedHere.map(def => {
                    const ach = unlocked.find(a => a.type === def.achievement_key);
                    return renderAchievementCard(def, true, ach);
                  })}
                </div>
              </div>
            );
          })()}

          {/* Locked */}
          {(() => {
            const lockedHere = filteredLevels.filter(def => !unlockedTypes.has(def.achievement_key));
            if (lockedHere.length === 0) return null;
            return (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  {tab === 'secret' ? '🔒 Conquistas Secretas' : 'Bloqueadas'} ({lockedHere.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {lockedHere.map(def => renderAchievementCard(def, false))}
                </div>
              </div>
            );
          })()}
        </>
      )}

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
