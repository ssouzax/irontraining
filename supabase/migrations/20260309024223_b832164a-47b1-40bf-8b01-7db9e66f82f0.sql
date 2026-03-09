-- Extend influencers table for self-service
ALTER TABLE public.influencers ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.influencers ADD COLUMN IF NOT EXISTS referral_code text UNIQUE;
ALTER TABLE public.influencers ADD COLUMN IF NOT EXISTS commission_rate numeric DEFAULT 10;
ALTER TABLE public.influencers ADD COLUMN IF NOT EXISTS total_referrals integer DEFAULT 0;
ALTER TABLE public.influencers ADD COLUMN IF NOT EXISTS total_revenue_cents integer DEFAULT 0;
ALTER TABLE public.influencers ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false;
ALTER TABLE public.influencers ADD COLUMN IF NOT EXISTS kiwify_affiliate_id text;

-- Add referred_by to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referred_by_influencer_id uuid REFERENCES public.influencers(id);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_coupon_used text;

-- Influencer coupons
CREATE TABLE public.influencer_coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  influencer_id uuid REFERENCES public.influencers(id) ON DELETE CASCADE NOT NULL,
  code text UNIQUE NOT NULL,
  discount_percent integer DEFAULT 10,
  max_uses integer,
  times_used integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

ALTER TABLE public.influencer_coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active coupons" ON public.influencer_coupons
  FOR SELECT USING (is_active = true);

CREATE POLICY "Influencers manage own coupons" ON public.influencer_coupons
  FOR ALL USING (
    influencer_id IN (SELECT id FROM public.influencers WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins manage all coupons" ON public.influencer_coupons
  FOR ALL USING (is_admin());

-- Referral tracking
CREATE TABLE public.influencer_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  influencer_id uuid REFERENCES public.influencers(id) NOT NULL,
  referred_user_id uuid NOT NULL,
  coupon_id uuid REFERENCES public.influencer_coupons(id),
  commission_cents integer DEFAULT 0,
  commission_paid boolean DEFAULT false,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.influencer_referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Influencers view own referrals" ON public.influencer_referrals
  FOR SELECT USING (
    influencer_id IN (SELECT id FROM public.influencers WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins manage referrals" ON public.influencer_referrals
  FOR ALL USING (is_admin());

CREATE POLICY "System inserts referrals" ON public.influencer_referrals
  FOR INSERT WITH CHECK (true);

-- Payout history
CREATE TABLE public.influencer_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  influencer_id uuid REFERENCES public.influencers(id) NOT NULL,
  amount_cents integer NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  status text DEFAULT 'pending',
  paid_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.influencer_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Influencers view own payouts" ON public.influencer_payouts
  FOR SELECT USING (
    influencer_id IN (SELECT id FROM public.influencers WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins manage payouts" ON public.influencer_payouts
  FOR ALL USING (is_admin());

-- Add self-service policies to influencers
CREATE POLICY "Users create own influencer profile" ON public.influencers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own influencer profile" ON public.influencers
  FOR UPDATE USING (auth.uid() = user_id);

-- Enable realtime for referrals
ALTER PUBLICATION supabase_realtime ADD TABLE public.influencer_referrals;