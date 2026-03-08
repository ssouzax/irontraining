
-- Daily Goals (Mini Metas Diárias)
CREATE TABLE public.daily_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  goal_type TEXT NOT NULL DEFAULT 'sets', -- 'sets', 'volume', 'exercise_specific', 'custom'
  exercise_name TEXT,
  target_value NUMERIC NOT NULL DEFAULT 0,
  target_unit TEXT NOT NULL DEFAULT 'sets', -- 'sets', 'reps', 'kg', 'volume'
  current_value NUMERIC NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  goal_date DATE NOT NULL DEFAULT CURRENT_DATE,
  xp_reward INTEGER NOT NULL DEFAULT 25,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.daily_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own goals" ON public.daily_goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own goals" ON public.daily_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own goals" ON public.daily_goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own goals" ON public.daily_goals FOR DELETE USING (auth.uid() = user_id);

-- Daily Challenges (Competição Instantânea)
CREATE TABLE public.daily_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gym_id UUID REFERENCES public.gyms(id),
  challenge_type TEXT NOT NULL DEFAULT 'max_weight', -- 'max_weight', 'max_reps', 'max_volume'
  exercise_name TEXT NOT NULL,
  challenge_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view challenges" ON public.daily_challenges FOR SELECT USING (true);
CREATE POLICY "Auth users can create challenges" ON public.daily_challenges FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE TABLE public.challenge_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID REFERENCES public.daily_challenges(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  value NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(challenge_id, user_id)
);
ALTER TABLE public.challenge_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view entries" ON public.challenge_entries FOR SELECT USING (true);
CREATE POLICY "Users can insert own entries" ON public.challenge_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own entries" ON public.challenge_entries FOR UPDATE USING (auth.uid() = user_id);

-- Temporary Badges (from challenges)
CREATE TABLE public.temporary_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  badge_type TEXT NOT NULL, -- 'daily_champion', 'pr_destroyer', 'volume_king'
  badge_title TEXT NOT NULL,
  challenge_id UUID REFERENCES public.daily_challenges(id),
  exercise_name TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.temporary_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view badges" ON public.temporary_badges FOR SELECT USING (true);
CREATE POLICY "System can insert badges" ON public.temporary_badges FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Seasonal Events
CREATE TABLE public.seasonal_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL DEFAULT 'seasonal', -- 'seasonal', 'special', 'weekly'
  theme_color TEXT DEFAULT '#FF6B00',
  icon TEXT DEFAULT '🎄',
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  xp_multiplier NUMERIC NOT NULL DEFAULT 1.5,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.seasonal_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view events" ON public.seasonal_events FOR SELECT USING (true);

CREATE TABLE public.event_participation (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES public.seasonal_events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  points_earned INTEGER NOT NULL DEFAULT 0,
  challenges_completed INTEGER NOT NULL DEFAULT 0,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);
ALTER TABLE public.event_participation ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view participation" ON public.event_participation FOR SELECT USING (true);
CREATE POLICY "Users can join events" ON public.event_participation FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own participation" ON public.event_participation FOR UPDATE USING (auth.uid() = user_id);

-- Avatar config
CREATE TABLE public.avatar_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  avatar_tier TEXT NOT NULL DEFAULT 'beginner', -- 'beginner', 'intermediate', 'advanced', 'elite', 'legendary'
  frame_style TEXT DEFAULT 'none',
  glow_color TEXT DEFAULT NULL,
  badge_overlay TEXT DEFAULT NULL,
  animation_type TEXT DEFAULT 'none', -- 'none', 'pulse', 'flame', 'lightning', 'rainbow'
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.avatar_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view avatars" ON public.avatar_config FOR SELECT USING (true);
CREATE POLICY "Users can upsert own avatar" ON public.avatar_config FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own avatar" ON public.avatar_config FOR UPDATE USING (auth.uid() = user_id);
