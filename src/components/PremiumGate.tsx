import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Crown, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePremium, PremiumTier } from '@/hooks/usePremium';
import { useNavigate } from 'react-router-dom';

interface PremiumGateProps {
  requiredTier?: PremiumTier;
  children: ReactNode;
  fallback?: ReactNode;
  feature?: string;
}

export function PremiumGate({ requiredTier = 'basic', children, fallback, feature }: PremiumGateProps) {
  const { hasAccess, loading } = usePremium();
  const navigate = useNavigate();

  if (loading) return null;
  if (hasAccess(requiredTier)) return <>{children}</>;

  if (fallback) return <>{fallback}</>;

  const tierLabels: Record<PremiumTier, string> = {
    free: 'Gratuito',
    basic: 'Básico',
    standard: 'Padrão',
    premium: 'Premium',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center p-8 rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
        <Lock className="w-8 h-8 text-primary" />
      </div>
      <h3 className="text-xl font-bold text-foreground mb-2">
        {feature || 'Recurso Premium'}
      </h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm">
        Este recurso está disponível no plano{' '}
        <span className="text-primary font-semibold">{tierLabels[requiredTier]}</span>{' '}
        ou superior. Assine para desbloquear.
      </p>
      <Button
        onClick={() => navigate('/subscribe')}
        className="gap-2 rounded-xl shadow-[0_0_20px_-5px_hsl(var(--primary)/0.4)]"
      >
        <Crown className="w-4 h-4" />
        Ver Planos
      </Button>
    </motion.div>
  );
}

export function PremiumBadge({ small = false }: { small?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold ${small ? 'text-[10px]' : 'text-xs'}`}>
      <Crown className={small ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
      PRO
    </span>
  );
}
