import { useState, useEffect } from 'react';
import { Compass, Flame, Trophy, TrendingUp, Loader2, Heart, MessageCircle, User, Crown, MapPin, Dumbbell, Award, Star, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

import { ExploreTrendingFeed } from './explore/ExploreTrendingFeed';
import { ExplorePRsOfDay } from './explore/ExplorePRsOfDay';
import { ExploreHotAthletes } from './explore/ExploreHotAthletes';
import { ExploreRecentAchievements } from './explore/ExploreRecentAchievements';
import { ExploreTopGyms } from './explore/ExploreTopGyms';

type ExploreTab = 'trending' | 'prs' | 'athletes' | 'achievements' | 'gyms';

const tabs: { key: ExploreTab; icon: typeof Flame; label: string }[] = [
  { key: 'trending', icon: Flame, label: 'Em Alta' },
  { key: 'prs', icon: Trophy, label: 'PRs do Dia' },
  { key: 'athletes', icon: TrendingUp, label: 'Atletas' },
  { key: 'achievements', icon: Award, label: 'Conquistas' },
  { key: 'gyms', icon: MapPin, label: 'Academias' },
];

export function MobileExplore() {
  const [tab, setTab] = useState<ExploreTab>('trending');
  const [direction, setDirection] = useState(0);

  const handleTabChange = (newTab: ExploreTab) => {
    const currentIndex = tabs.findIndex(t => t.key === tab);
    const newIndex = tabs.findIndex(t => t.key === newTab);
    setDirection(newIndex > currentIndex ? 1 : -1);
    setTab(newTab);
  };

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
  };

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Compass className="w-5 h-5 text-primary" /> Explorar
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">Descubra lifts virais, atletas e conquistas</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 px-4 pb-3 overflow-x-auto scrollbar-hide">
        {tabs.map(t => (
          <button key={t.key} onClick={() => handleTabChange(t.key)}
            className={cn(
              "relative flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap shrink-0 transition-all duration-200",
              tab === t.key ? "text-primary-foreground" : "bg-secondary text-muted-foreground hover:bg-secondary/80"
            )}>
            {tab === t.key && (
              <motion.div
                layoutId="explore-tab-bg"
                className="absolute inset-0 bg-primary rounded-full"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <t.icon className="w-3.5 h-3.5" /> {t.label}
            </span>
          </button>
        ))}
      </div>

      {/* Content with slide animation */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={tab}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.2, ease: 'easeInOut' }}
        >
          {tab === 'trending' && <ExploreTrendingFeed />}
          {tab === 'prs' && <ExplorePRsOfDay />}
          {tab === 'athletes' && <ExploreHotAthletes />}
          {tab === 'achievements' && <ExploreRecentAchievements />}
          {tab === 'gyms' && <ExploreTopGyms />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
