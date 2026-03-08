import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, Calendar, Zap, AlertTriangle, ArrowUpRight, Shield, Loader2, CreditCard, CheckCircle2, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { usePremium, PremiumTier } from '@/hooks/usePremium';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SubscriptionDetail {
  id: string;
  status: string;
  plan_id: string;
  started_at: string;
  expires_at: string | null;
  canceled_at: string | null;
  kiwify_subscription_id: string | null;
  plan_name: string;
  plan_tier: string;
  plan_price: number;
  plan_interval: string;
}

interface PaymentLog {
  id: string;
  amount_cents: number;
  status: string;
  created_at: string;
  reference_id: string | null;
}

const TIER_COLORS: Record<string, string> = {
  free: 'text-muted-foreground',
  basic: 'text-blue-400',
  standard: 'text-primary',
  premium: 'text-yellow-400',
};

const TIER_LABELS: Record<string, string> = {
  free: 'Gratuito',
  basic: 'Básico',
  standard: 'Padrão',
  premium: 'Premium',
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  active: { label: 'Ativo', color: 'text-green-400 bg-green-400/10 border-green-400/20', icon: CheckCircle2 },
  canceled: { label: 'Cancelado', color: 'text-red-400 bg-red-400/10 border-red-400/20', icon: XCircle },
  replaced: { label: 'Substituído', color: 'text-muted-foreground bg-muted/10 border-border', icon: XCircle },
  expired: { label: 'Expirado', color: 'text-orange-400 bg-orange-400/10 border-orange-400/20', icon: AlertTriangle },
};

export default function SubscriptionManager() {
  const { user } = useAuth();
  const { tier, isPremium, loading: premiumLoading } = usePremium();
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState<SubscriptionDetail | null>(null);
  const [history, setHistory] = useState<SubscriptionDetail[]>([]);
  const [payments, setPayments] = useState<PaymentLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    const [subsRes, paymentsRes] = await Promise.all([
      supabase
        .from('user_subscriptions')
        .select('*, subscription_plans(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('payment_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('payment_type', 'subscription')
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

    if (subsRes.data) {
      const mapped = subsRes.data.map((s: any) => ({
        id: s.id,
        status: s.status,
        plan_id: s.plan_id,
        started_at: s.started_at,
        expires_at: s.expires_at,
        canceled_at: s.canceled_at,
        kiwify_subscription_id: s.kiwify_subscription_id,
        plan_name: s.subscription_plans?.name || s.plan_id,
        plan_tier: s.subscription_plans?.tier || 'basic',
        plan_price: s.subscription_plans?.price_cents || 0,
        plan_interval: s.subscription_plans?.interval || 'monthly',
      }));

      const active = mapped.find((s: SubscriptionDetail) => s.status === 'active');
      setSubscription(active || null);
      setHistory(mapped);
    }

    if (paymentsRes.data) {
      setPayments(paymentsRes.data as PaymentLog[]);
    }

    setLoading(false);
  };

  if (loading || premiumLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  const daysRemaining = subscription?.expires_at
    ? Math.max(0, Math.ceil((new Date(subscription.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  const isExpiringSoon = daysRemaining !== null && daysRemaining <= 7;

  return (
    <div className="space-y-4">
      {/* Current Plan Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-xl border border-border card-elevated overflow-hidden"
      >
        {/* Header gradient */}
        <div className={cn(
          "h-2",
          tier === 'premium' ? 'bg-gradient-to-r from-yellow-500 to-amber-400' :
          tier === 'standard' ? 'bg-gradient-to-r from-primary to-primary/60' :
          tier === 'basic' ? 'bg-gradient-to-r from-blue-500 to-blue-400' :
          'bg-gradient-to-r from-muted to-muted-foreground/20'
        )} />

        <div className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center",
                isPremium ? 'bg-primary/10' : 'bg-secondary'
              )}>
                <Crown className={cn("w-6 h-6", TIER_COLORS[tier] || 'text-muted-foreground')} />
              </div>
              <div>
                <h3 className="font-bold text-foreground text-lg">
                  {subscription ? subscription.plan_name : 'Plano Gratuito'}
                </h3>
                <p className={cn("text-sm font-medium", TIER_COLORS[tier])}>
                  {TIER_LABELS[tier] || 'Gratuito'}
                </p>
              </div>
            </div>

            {subscription && (
              <div className={cn(
                "px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5",
                STATUS_CONFIG[subscription.status]?.color || 'text-muted-foreground'
              )}>
                {(() => {
                  const Icon = STATUS_CONFIG[subscription.status]?.icon || CheckCircle2;
                  return <Icon className="w-3.5 h-3.5" />;
                })()}
                {STATUS_CONFIG[subscription.status]?.label || subscription.status}
              </div>
            )}
          </div>

          {/* Subscription Details */}
          {subscription ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-secondary/50 rounded-lg p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Valor</p>
                  <p className="text-sm font-bold text-foreground mt-0.5">
                    R${(subscription.plan_price / 100).toFixed(2).replace('.', ',')}
                    <span className="text-xs text-muted-foreground font-normal">
                      /{subscription.plan_interval === 'yearly' ? 'ano' : 'mês'}
                    </span>
                  </p>
                </div>
                <div className="bg-secondary/50 rounded-lg p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Início</p>
                  <p className="text-sm font-bold text-foreground mt-0.5">
                    {format(new Date(subscription.started_at), 'dd/MM/yyyy', { locale: ptBR })}
                  </p>
                </div>
              </div>

              {subscription.expires_at && (
                <div className={cn(
                  "rounded-lg p-3 flex items-center gap-3",
                  isExpiringSoon ? 'bg-orange-500/10 border border-orange-500/20' : 'bg-secondary/50'
                )}>
                  <Calendar className={cn("w-4 h-4", isExpiringSoon ? 'text-orange-400' : 'text-muted-foreground')} />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">
                      {subscription.status === 'active' ? 'Renova em' : 'Expirou em'}
                    </p>
                    <p className={cn("text-sm font-semibold", isExpiringSoon ? 'text-orange-400' : 'text-foreground')}>
                      {format(new Date(subscription.expires_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      {daysRemaining !== null && subscription.status === 'active' && (
                        <span className="text-xs font-normal text-muted-foreground ml-2">
                          ({daysRemaining} dias restantes)
                        </span>
                      )}
                    </p>
                  </div>
                  {isExpiringSoon && <AlertTriangle className="w-4 h-4 text-orange-400" />}
                </div>
              )}

              {subscription.canceled_at && (
                <div className="rounded-lg p-3 bg-red-500/10 border border-red-500/20 flex items-center gap-3">
                  <XCircle className="w-4 h-4 text-red-400" />
                  <div>
                    <p className="text-xs text-muted-foreground">Cancelado em</p>
                    <p className="text-sm font-semibold text-red-400">
                      {format(new Date(subscription.canceled_at), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-secondary/30 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">Você está no plano gratuito</p>
              <p className="text-xs text-muted-foreground">Faça upgrade para desbloquear recursos avançados</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 mt-4">
            {(!subscription || subscription.status !== 'active') && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/subscribe')}
                className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
              >
                <Zap className="w-4 h-4" /> Fazer Upgrade
              </motion.button>
            )}
            {subscription?.status === 'active' && tier !== 'premium' && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/subscribe')}
                className="flex-1 py-3 rounded-xl bg-primary/10 text-primary text-sm font-semibold flex items-center justify-center gap-2 hover:bg-primary/20 transition-colors border border-primary/20"
              >
                <ArrowUpRight className="w-4 h-4" /> Mudar Plano
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Payment History */}
      {payments.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-xl border border-border card-elevated p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-primary" /> Histórico de Pagamentos
            </h3>
          </div>

          <div className="space-y-2">
            {payments.map(payment => (
              <div key={payment.id} className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center",
                    payment.status === 'completed' ? 'bg-green-500/10' : 'bg-red-500/10'
                  )}>
                    {payment.status === 'completed'
                      ? <CheckCircle2 className="w-4 h-4 text-green-400" />
                      : <XCircle className="w-4 h-4 text-red-400" />
                    }
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      R${(payment.amount_cents / 100).toFixed(2).replace('.', ',')}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {format(new Date(payment.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
                <span className={cn(
                  "text-[10px] font-semibold px-2 py-1 rounded-full",
                  payment.status === 'completed' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                )}>
                  {payment.status === 'completed' ? 'Pago' : 'Falhou'}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Subscription History */}
      {history.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-xl border border-border card-elevated p-5"
        >
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full flex items-center justify-between text-sm font-semibold text-foreground"
          >
            <span className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" /> Histórico de Planos
            </span>
            <span className="text-xs text-muted-foreground">{showHistory ? 'Ocultar' : 'Ver tudo'}</span>
          </button>

          {showHistory && (
            <div className="mt-3 space-y-2">
              {history.filter(s => s.id !== subscription?.id).map(sub => (
                <div key={sub.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-secondary/30">
                  <div>
                    <p className="text-sm font-medium text-foreground">{sub.plan_name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {format(new Date(sub.started_at), 'dd/MM/yyyy', { locale: ptBR })}
                    </p>
                  </div>
                  <span className={cn(
                    "text-[10px] font-semibold px-2 py-1 rounded-full border",
                    STATUS_CONFIG[sub.status]?.color || 'text-muted-foreground'
                  )}>
                    {STATUS_CONFIG[sub.status]?.label || sub.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
