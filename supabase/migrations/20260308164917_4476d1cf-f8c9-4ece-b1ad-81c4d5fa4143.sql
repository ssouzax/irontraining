
-- Gym Points Log table
CREATE TABLE public.gym_points_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  points integer NOT NULL DEFAULT 0,
  reason text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.gym_points_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view gym points" ON public.gym_points_log FOR SELECT USING (true);
CREATE POLICY "Users can insert own points" ON public.gym_points_log FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add points and tier columns to gyms
ALTER TABLE public.gyms ADD COLUMN IF NOT EXISTS total_points integer NOT NULL DEFAULT 0;
ALTER TABLE public.gyms ADD COLUMN IF NOT EXISTS tier text NOT NULL DEFAULT 'bronze';

-- Exercise Rankings table
CREATE TABLE public.exercise_rankings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_name text NOT NULL,
  user_id uuid NOT NULL,
  gym_id uuid REFERENCES public.gyms(id),
  weight numeric NOT NULL DEFAULT 0,
  reps integer NOT NULL DEFAULT 1,
  estimated_1rm numeric NOT NULL DEFAULT 0,
  bodyweight numeric NOT NULL DEFAULT 0,
  dots_score numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(exercise_name, user_id)
);

ALTER TABLE public.exercise_rankings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view exercise rankings" ON public.exercise_rankings FOR SELECT USING (true);
CREATE POLICY "Users can upsert own rankings" ON public.exercise_rankings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own rankings" ON public.exercise_rankings FOR UPDATE USING (auth.uid() = user_id);

-- Live gym activity table for realtime
CREATE TABLE public.gym_live_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  activity_type text NOT NULL DEFAULT 'pr',
  exercise_name text NOT NULL,
  weight numeric NOT NULL DEFAULT 0,
  reps integer NOT NULL DEFAULT 1,
  estimated_1rm numeric NOT NULL DEFAULT 0,
  message text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.gym_live_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view live activity" ON public.gym_live_activity FOR SELECT USING (true);
CREATE POLICY "Users can insert own activity" ON public.gym_live_activity FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Enable realtime for live activity
ALTER PUBLICATION supabase_realtime ADD TABLE public.gym_live_activity;

-- Function to get exercise leaderboard
CREATE OR REPLACE FUNCTION public.get_exercise_leaderboard(target_exercise text, limit_count integer DEFAULT 50)
RETURNS TABLE(
  user_id uuid,
  display_name text,
  username text,
  avatar_url text,
  exercise_name text,
  weight numeric,
  reps integer,
  estimated_1rm numeric,
  bodyweight numeric,
  dots_score numeric,
  gym_name text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT
    er.user_id,
    COALESCE(p.display_name, split_part(p.email, '@', 1)) as display_name,
    p.username,
    p.avatar_url,
    er.exercise_name,
    er.weight,
    er.reps,
    er.estimated_1rm,
    er.bodyweight,
    er.dots_score,
    g.name as gym_name
  FROM exercise_rankings er
  JOIN profiles p ON p.user_id = er.user_id
  LEFT JOIN gyms g ON g.id = er.gym_id
  WHERE er.exercise_name = target_exercise
  ORDER BY er.estimated_1rm DESC
  LIMIT limit_count;
$$;

-- Function to get gym points summary
CREATE OR REPLACE FUNCTION public.get_gym_rankings(limit_count integer DEFAULT 50)
RETURNS TABLE(
  gym_id uuid,
  gym_name text,
  city text,
  country text,
  total_points bigint,
  tier text,
  member_count bigint,
  pr_count bigint
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT
    g.id as gym_id,
    g.name as gym_name,
    g.city,
    g.country,
    COALESCE(SUM(gpl.points), 0)::bigint as total_points,
    g.tier,
    (SELECT COUNT(*) FROM gym_members gm WHERE gm.gym_id = g.id) as member_count,
    (SELECT COUNT(*) FROM gym_points_log gpl2 WHERE gpl2.gym_id = g.id AND gpl2.reason = 'pr') as pr_count
  FROM gyms g
  LEFT JOIN gym_points_log gpl ON gpl.gym_id = g.id
  GROUP BY g.id, g.name, g.city, g.country, g.tier
  ORDER BY COALESCE(SUM(gpl.points), 0) DESC
  LIMIT limit_count;
$$;
