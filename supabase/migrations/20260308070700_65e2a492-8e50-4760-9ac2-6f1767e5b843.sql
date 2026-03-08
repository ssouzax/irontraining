
-- Add gamification columns to achievement_levels
ALTER TABLE public.achievement_levels
  ADD COLUMN IF NOT EXISTS rarity text NOT NULL DEFAULT 'common',
  ADD COLUMN IF NOT EXISTS is_secret boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_seasonal boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS season_id integer REFERENCES public.seasons(id) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS tree_id text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS tree_order integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS parent_achievement_key text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS unlock_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_users integer NOT NULL DEFAULT 0;

-- Create player_levels table
CREATE TABLE public.player_levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  player_level integer NOT NULL DEFAULT 1,
  total_xp integer NOT NULL DEFAULT 0,
  lifetime_xp integer NOT NULL DEFAULT 0,
  title text DEFAULT 'Novato',
  daily_xp integer NOT NULL DEFAULT 0,
  last_xp_date date DEFAULT CURRENT_DATE,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.player_levels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view player levels" ON public.player_levels FOR SELECT USING (true);
CREATE POLICY "Users can insert own level" ON public.player_levels FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own level" ON public.player_levels FOR UPDATE USING (auth.uid() = user_id);

-- Also allow public viewing of achievements for athlete profiles
DROP POLICY IF EXISTS "Users can view own achievements" ON public.achievements;
CREATE POLICY "Anyone can view achievements" ON public.achievements FOR SELECT USING (true);
