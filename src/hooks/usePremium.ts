import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type PremiumTier = 'free' | 'basic' | 'standard' | 'premium';

const TIER_HIERARCHY: Record<PremiumTier, number> = {
  free: 0,
  basic: 1,
  standard: 2,
  premium: 3,
};

interface PremiumState {
  tier: PremiumTier;
  isActive: boolean;
  expiresAt: string | null;
  planId: string | null;
  loading: boolean;
}

export function usePremium(): PremiumState & {
  hasAccess: (requiredTier: PremiumTier) => boolean;
  isPremium: boolean;
} {
  const { user } = useAuth();
  const [state, setState] = useState<PremiumState>({
    tier: 'free',
    isActive: false,
    expiresAt: null,
    planId: null,
    loading: true,
  });

  useEffect(() => {
    if (!user) {
      setState(s => ({ ...s, loading: false, tier: 'free', isActive: false }));
      return;
    }

    const fetchSub = async () => {
      const { data } = await supabase
        .from('user_subscriptions')
        .select('*, subscription_plans(*)')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data && data.subscription_plans) {
        const plan = data.subscription_plans as any;
        const isExpired = data.expires_at ? new Date(data.expires_at) < new Date() : false;
        setState({
          tier: isExpired ? 'free' : (plan.tier as PremiumTier),
          isActive: !isExpired,
          expiresAt: data.expires_at,
          planId: data.plan_id,
          loading: false,
        });
      } else {
        setState({ tier: 'free', isActive: false, expiresAt: null, planId: null, loading: false });
      }
    };

    fetchSub();
  }, [user]);

  const hasAccess = (requiredTier: PremiumTier) =>
    TIER_HIERARCHY[state.tier] >= TIER_HIERARCHY[requiredTier];

  return {
    ...state,
    hasAccess,
    isPremium: state.tier !== 'free' && state.isActive,
  };
}
