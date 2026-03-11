import { Lock, Crown } from 'lucide-react';
import { usePremium, PremiumTier } from '@/hooks/usePremium';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface PremiumLockProps {
  requiredTier?: PremiumTier;
  children: React.ReactNode;
  className?: string;
}

const tierLabels: Record<PremiumTier, string> = {
  free: 'Gratuito',
  basic: 'Básico',
  standard: 'Padrão',
  premium: 'Premium',
};

/**
 * Inline lock overlay for sidebar items and feature cards.
 * Shows the content with a lock icon overlay when user doesn't have access.
 */
export function PremiumLock({ requiredTier = 'basic', children, className }: PremiumLockProps) {
  const { hasAccess, loading } = usePremium();
  const navigate = useNavigate();

  if (loading || hasAccess(requiredTier)) return <>{children}</>;

  return (
    <div
      className={cn("relative cursor-pointer group", className)}
      onClick={() => navigate('/subscribe')}
      title={`Disponível no plano ${tierLabels[requiredTier]}`}
    >
      <div className="opacity-40 pointer-events-none">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-card/90 backdrop-blur-sm border border-border rounded-lg px-3 py-1.5 flex items-center gap-1.5 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
          <Lock className="w-3 h-3 text-primary" />
          <span className="text-[10px] font-medium text-foreground">Plano {tierLabels[requiredTier]}</span>
        </div>
      </div>
      <div className="absolute top-1 right-1">
        <Lock className="w-3.5 h-3.5 text-primary/60" />
      </div>
    </div>
  );
}

/**
 * Small lock badge for sidebar nav items.
 */
export function PremiumLockBadge({ requiredTier = 'basic' }: { requiredTier?: PremiumTier }) {
  const { hasAccess, loading } = usePremium();
  if (loading || hasAccess(requiredTier)) return null;
  return <Lock className="w-3 h-3 text-primary/50 shrink-0 ml-auto" />;
}
