
-- 1. App roles enum and user_roles table
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'user');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check admin role (avoids recursion)
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin');
$$;

CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.is_admin());

-- 2. Influencers table
CREATE TABLE IF NOT EXISTS public.influencers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  instagram_handle TEXT,
  youtube_handle TEXT,
  tiktok_handle TEXT,
  whatsapp TEXT,
  email TEXT,
  followers_count INTEGER DEFAULT 0,
  niche TEXT DEFAULT 'fitness',
  status TEXT DEFAULT 'active',
  deal_type TEXT DEFAULT 'free',
  notes TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.influencers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage influencers" ON public.influencers FOR ALL USING (public.is_admin());
CREATE POLICY "Anyone can view active influencers" ON public.influencers FOR SELECT USING (status = 'active');

-- 3. Brands table
CREATE TABLE IF NOT EXISTS public.brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT,
  website TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_whatsapp TEXT,
  deal_type TEXT DEFAULT 'sponsor',
  deal_value_cents INTEGER DEFAULT 0,
  deal_description TEXT,
  status TEXT DEFAULT 'active',
  category TEXT DEFAULT 'supplements',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage brands" ON public.brands FOR ALL USING (public.is_admin());

-- 4. Specialist plans (personalized plans by experts)
CREATE TABLE IF NOT EXISTS public.specialist_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  specialist_name TEXT NOT NULL,
  specialist_bio TEXT,
  specialist_avatar_url TEXT,
  category TEXT DEFAULT 'training',
  price_cents INTEGER NOT NULL DEFAULT 0,
  whatsapp_contact TEXT,
  features JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.specialist_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active specialist plans" ON public.specialist_plans FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage specialist plans" ON public.specialist_plans FOR ALL USING (public.is_admin());

-- 5. Gym promo plans
CREATE TABLE IF NOT EXISTS public.gym_promo_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID REFERENCES public.gyms(id) ON DELETE SET NULL,
  gym_name TEXT NOT NULL,
  contact_name TEXT,
  contact_whatsapp TEXT,
  contact_email TEXT,
  plan_type TEXT DEFAULT 'basic',
  monthly_value_cents INTEGER DEFAULT 0,
  description TEXT,
  status TEXT DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.gym_promo_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage gym promo plans" ON public.gym_promo_plans FOR ALL USING (public.is_admin());
CREATE POLICY "Anyone can view active gym promos" ON public.gym_promo_plans FOR SELECT USING (status = 'active');

-- 6. Diet profiles
CREATE TABLE IF NOT EXISTS public.diet_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  age INTEGER,
  height_cm NUMERIC,
  weight_kg NUMERIC,
  health_conditions TEXT,
  waist_cm NUMERIC,
  hip_cm NUMERIC,
  chest_cm NUMERIC,
  arm_cm NUMERIC,
  thigh_cm NUMERIC,
  meals_per_day INTEGER DEFAULT 3,
  water_liters_per_day NUMERIC DEFAULT 2,
  foods_at_home TEXT,
  foods_easy_to_buy TEXT,
  uses_supplements BOOLEAN DEFAULT false,
  supplement_notes TEXT,
  goal TEXT DEFAULT 'weight_loss',
  activity_level TEXT DEFAULT 'moderate',
  diet_restrictions TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.diet_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own diet profile" ON public.diet_profiles FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all diet profiles" ON public.diet_profiles FOR SELECT USING (public.is_admin());

-- 7. Add whatsapp field to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS whatsapp TEXT;

-- 8. Triggers for updated_at
CREATE OR REPLACE TRIGGER update_influencers_updated_at
  BEFORE UPDATE ON public.influencers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_brands_updated_at
  BEFORE UPDATE ON public.brands
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_specialist_plans_updated_at
  BEFORE UPDATE ON public.specialist_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_gym_promo_plans_updated_at
  BEFORE UPDATE ON public.gym_promo_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_diet_profiles_updated_at
  BEFORE UPDATE ON public.diet_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
