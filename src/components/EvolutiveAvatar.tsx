import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';

interface EvolutiveAvatarProps {
  userId?: string;
  avatarUrl?: string | null;
  displayName?: string | null;
  level?: number;
  streak?: number;
  totalXP?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

function getAvatarTier(level: number, streak: number, totalXP: number) {
  if (level >= 75 || totalXP >= 50000) return 'legendary';
  if (level >= 50 || totalXP >= 25000) return 'elite';
  if (level >= 30 || streak >= 100) return 'advanced';
  if (level >= 10 || streak >= 30) return 'intermediate';
  return 'beginner';
}

const TIER_CONFIG = {
  beginner: {
    ring: 'ring-muted',
    glow: '',
    animation: undefined as any,
    badge: null,
    gradient: '',
  },
  intermediate: {
    ring: 'ring-primary',
    glow: 'shadow-[0_0_12px_hsl(var(--primary)/0.3)]',
    animation: { scale: [1, 1.02, 1] },
    badge: '⚡',
    gradient: 'from-primary/20 to-primary/5',
  },
  advanced: {
    ring: 'ring-orange-500',
    glow: 'shadow-[0_0_16px_rgba(249,115,22,0.4)]',
    animation: { scale: [1, 1.04, 1] },
    badge: '🔥',
    gradient: 'from-orange-500/20 to-amber-500/5',
  },
  elite: {
    ring: 'ring-purple-500',
    glow: 'shadow-[0_0_20px_rgba(168,85,247,0.4)]',
    animation: { scale: [1, 1.05, 1], rotate: [0, 1, -1, 0] },
    badge: '💎',
    gradient: 'from-purple-500/20 to-violet-500/5',
  },
  legendary: {
    ring: 'ring-yellow-400',
    glow: 'shadow-[0_0_24px_rgba(250,204,21,0.5)]',
    animation: { scale: [1, 1.06, 1], rotate: [0, 2, -2, 0] },
    badge: '👑',
    gradient: 'from-yellow-400/30 to-amber-500/10',
  },
};

const SIZES = {
  sm: { container: 'w-8 h-8', ring: 'ring-[1.5px]', badge: 'text-[8px] -top-0.5 -right-0.5 w-3.5 h-3.5', text: 'text-xs' },
  md: { container: 'w-10 h-10', ring: 'ring-2', badge: 'text-[9px] -top-0.5 -right-0.5 w-4 h-4', text: 'text-sm' },
  lg: { container: 'w-16 h-16', ring: 'ring-[3px]', badge: 'text-sm -top-1 -right-1 w-6 h-6', text: 'text-xl' },
  xl: { container: 'w-24 h-24', ring: 'ring-[4px]', badge: 'text-base -top-1 -right-1 w-7 h-7', text: 'text-3xl' },
};

export function EvolutiveAvatar({
  avatarUrl,
  displayName,
  level = 1,
  streak = 0,
  totalXP = 0,
  size = 'md',
  className,
}: EvolutiveAvatarProps) {
  const tier = getAvatarTier(level, streak, totalXP);
  const config = TIER_CONFIG[tier];
  const sizeConfig = SIZES[size];

  return (
    <motion.div
      className={cn("relative inline-flex", className)}
      animate={config.animation}
      transition={config.animation ? { duration: 3, repeat: Infinity, ease: 'easeInOut' } : undefined}
    >
      {/* Outer glow */}
      {tier !== 'beginner' && (
        <div className={cn(
          "absolute inset-[-3px] rounded-full bg-gradient-to-br opacity-50",
          config.gradient,
        )} />
      )}

      {/* Avatar */}
      <div
        className={cn(
          sizeConfig.container,
          "rounded-full ring",
          sizeConfig.ring,
          config.ring,
          config.glow,
          "overflow-hidden bg-muted flex items-center justify-center relative z-10",
        )}
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt={displayName || ''} className="w-full h-full object-cover" />
        ) : (
          <span className={cn(sizeConfig.text, "font-bold text-muted-foreground")}>
            {displayName?.[0]?.toUpperCase() || '?'}
          </span>
        )}
      </div>

      {/* Tier badge */}
      {config.badge && (
        <span className={cn(
          "absolute z-20 flex items-center justify-center rounded-full bg-background border border-border",
          sizeConfig.badge,
        )}>
          {config.badge}
        </span>
      )}
    </motion.div>
  );
}
