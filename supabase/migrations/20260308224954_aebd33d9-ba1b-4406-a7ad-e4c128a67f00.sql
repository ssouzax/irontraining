
-- Subscription plans reference table
CREATE TABLE public.subscription_plans (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text,
  price_cents integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'BRL',
  interval text NOT NULL DEFAULT 'monthly', -- monthly, yearly
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  tier text NOT NULL DEFAULT 'basic', -- basic, standard, premium
  is_active boolean NOT NULL DEFAULT true,
  kiwify_product_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view plans" ON public.subscription_plans FOR SELECT USING (true);

-- User subscriptions
CREATE TABLE public.user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id text NOT NULL REFERENCES public.subscription_plans(id),
  status text NOT NULL DEFAULT 'active', -- active, canceled, expired, trial
  started_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  canceled_at timestamptz,
  kiwify_subscription_id text,
  kiwify_customer_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own subscriptions" ON public.user_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert subscriptions" ON public.user_subscriptions FOR INSERT WITH CHECK (true);
CREATE POLICY "System can update subscriptions" ON public.user_subscriptions FOR UPDATE USING (true);

-- Premium content library
CREATE TABLE public.premium_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  content_type text NOT NULL DEFAULT 'video', -- video, program, ebook, guide
  thumbnail_url text,
  content_url text,
  min_tier text NOT NULL DEFAULT 'basic', -- basic, standard, premium
  price_cents integer DEFAULT 0, -- for individual purchase
  author_name text,
  category text NOT NULL DEFAULT 'training',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.premium_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active content metadata" ON public.premium_content FOR SELECT USING (is_active = true);

-- Individual content purchases
CREATE TABLE public.content_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id uuid NOT NULL REFERENCES public.premium_content(id),
  price_cents integer NOT NULL DEFAULT 0,
  purchased_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, content_id)
);

ALTER TABLE public.content_purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own purchases" ON public.content_purchases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert purchases" ON public.content_purchases FOR INSERT WITH CHECK (true);

-- Shop items (avatars, skins, effects)
CREATE TABLE public.shop_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'avatar', -- avatar, skin, effect, lootbox, badge
  item_type text NOT NULL DEFAULT 'permanent', -- permanent, temporary, consumable
  price_cents integer NOT NULL DEFAULT 490,
  rarity text NOT NULL DEFAULT 'common', -- common, rare, epic, legendary
  preview_url text,
  metadata jsonb DEFAULT '{}'::jsonb,
  is_seasonal boolean NOT NULL DEFAULT false,
  season_id integer REFERENCES public.seasons(id),
  is_active boolean NOT NULL DEFAULT true,
  stock_limit integer, -- null = unlimited
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.shop_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active shop items" ON public.shop_items FOR SELECT USING (is_active = true);

-- User inventory (purchased items)
CREATE TABLE public.user_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES public.shop_items(id),
  equipped boolean NOT NULL DEFAULT false,
  purchased_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz -- for temporary items
);

ALTER TABLE public.user_inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own inventory" ON public.user_inventory FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view equipped items" ON public.user_inventory FOR SELECT USING (equipped = true);
CREATE POLICY "System can insert inventory" ON public.user_inventory FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own inventory" ON public.user_inventory FOR UPDATE USING (auth.uid() = user_id);

-- Gym business plans
CREATE TABLE public.gym_business_plans (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text,
  price_cents integer NOT NULL DEFAULT 0,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.gym_business_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view gym plans" ON public.gym_business_plans FOR SELECT USING (true);

-- Gym subscriptions (B2B)
CREATE TABLE public.gym_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  plan_id text NOT NULL REFERENCES public.gym_business_plans(id),
  status text NOT NULL DEFAULT 'active',
  started_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.gym_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view gym subscriptions" ON public.gym_subscriptions FOR SELECT USING (true);
CREATE POLICY "System can manage gym subscriptions" ON public.gym_subscriptions FOR INSERT WITH CHECK (true);
CREATE POLICY "System can update gym subscriptions" ON public.gym_subscriptions FOR UPDATE USING (true);

-- Payment/transaction log
CREATE TABLE public.payment_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  gym_id uuid REFERENCES public.gyms(id) ON DELETE SET NULL,
  amount_cents integer NOT NULL,
  currency text NOT NULL DEFAULT 'BRL',
  payment_type text NOT NULL, -- subscription, content, shop_item, gym_plan
  reference_id text, -- kiwify transaction id
  status text NOT NULL DEFAULT 'completed',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own payments" ON public.payment_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert payments" ON public.payment_logs FOR INSERT WITH CHECK (true);

-- Insert default subscription plans
INSERT INTO public.subscription_plans (id, name, description, price_cents, interval, tier, features) VALUES
  ('basic_monthly', 'Básico Mensal', 'IA avançada + Preditor de PR + Streaks + Feed social completo', 1990, 'monthly', 'basic', '["IA avançada de treino", "Preditor de PRs", "Streaks premium", "Feed social completo"]'::jsonb),
  ('standard_monthly', 'Padrão Mensal', 'Todas do Básico + Mentoria AI/Coach VIP + Dieta personalizada', 2990, 'monthly', 'standard', '["Tudo do Básico", "Mentoria AI/Coach VIP", "Dieta personalizada", "Analytics avançado"]'::jsonb),
  ('premium_monthly', 'Premium Mensal', 'Todas do Padrão + Co-Training + Eventos VIP + Conteúdo exclusivo', 4990, 'monthly', 'premium', '["Tudo do Padrão", "Co-Training colaborativo", "Eventos VIP", "Mini-games imersivos", "Conteúdo exclusivo"]'::jsonb),
  ('premium_yearly', 'Plano Anual', 'Premium completo com bônus exclusivos', 29900, 'yearly', 'premium', '["Premium completo", "2 meses grátis", "Badge exclusiva anual", "Lootboxes premium", "Skins limitadas"]'::jsonb);

-- Insert default gym business plans
INSERT INTO public.gym_business_plans (id, name, description, price_cents, features) VALUES
  ('gym_highlight', 'Destaque no Mapa', 'Sua academia em destaque no mapa e busca', 4900, '["Destaque no mapa", "Pin personalizado", "Prioridade na busca"]'::jsonb),
  ('gym_explore', 'Top Gym Explore', 'Apareça no feed como academia recomendada', 9900, '["Tudo do Destaque", "Feed Explore", "Badge Top Gym", "Analytics de visibilidade"]'::jsonb),
  ('gym_premium', 'Gym Premium', 'Pacote completo com desafios e gamificação', 19900, '["Tudo do Explore", "Desafios internos", "Badges patrocinados", "Dashboard B2B completo"]'::jsonb);

-- Insert sample shop items
INSERT INTO public.shop_items (name, description, category, price_cents, rarity, metadata) VALUES
  ('Chama Neon', 'Efeito de streak com chama neon azul', 'effect', 490, 'common', '{"streak_effect": "neon_blue"}'::jsonb),
  ('Avatar Guerreiro', 'Skin de avatar estilo guerreiro espartano', 'avatar', 990, 'rare', '{"avatar_style": "spartan"}'::jsonb),
  ('Pack Lendário', 'Lootbox com 5 itens aleatórios', 'lootbox', 990, 'epic', '{"items_count": 5}'::jsonb),
  ('Chama Dourada', 'Efeito de streak dourado premium', 'effect', 1490, 'legendary', '{"streak_effect": "gold"}'::jsonb),
  ('Badge Diamante', 'Badge exclusiva de diamante para perfil', 'badge', 790, 'epic', '{"badge_type": "diamond"}'::jsonb),
  ('GIF Pack PR', 'Pack de GIFs animados para compartilhar PRs', 'effect', 290, 'common', '{"gif_pack": "pr_celebration"}'::jsonb);
