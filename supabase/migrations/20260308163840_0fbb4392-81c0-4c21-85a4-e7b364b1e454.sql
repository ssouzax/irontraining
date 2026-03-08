
-- Rivals table
CREATE TABLE public.rivals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  rival_user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  active boolean NOT NULL DEFAULT true,
  UNIQUE(user_id, rival_user_id)
);

ALTER TABLE public.rivals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rivals" ON public.rivals FOR SELECT TO authenticated USING (auth.uid() = user_id OR auth.uid() = rival_user_id);
CREATE POLICY "Users can insert own rivals" ON public.rivals FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own rivals" ON public.rivals FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own rivals" ON public.rivals FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Power scores table
CREATE TABLE public.power_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  power_score numeric NOT NULL DEFAULT 0,
  dots_component numeric NOT NULL DEFAULT 0,
  pr_frequency_component numeric NOT NULL DEFAULT 0,
  consistency_component numeric NOT NULL DEFAULT 0,
  volume_component numeric NOT NULL DEFAULT 0,
  last_updated timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.power_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view power scores" ON public.power_scores FOR SELECT USING (true);
CREATE POLICY "Users can upsert own power score" ON public.power_scores FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own power score" ON public.power_scores FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Function to find rivals based on similar DOTS and bodyweight
CREATE OR REPLACE FUNCTION public.find_potential_rivals(target_user_id uuid, dots_threshold numeric DEFAULT 20, bw_threshold numeric DEFAULT 10)
RETURNS TABLE(
  user_id uuid,
  display_name text,
  username text,
  avatar_url text,
  bodyweight numeric,
  dots_score numeric,
  squat_pr numeric,
  bench_pr numeric,
  deadlift_pr numeric,
  total numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH my_stats AS (
    SELECT ls.dots_score, ls.bodyweight
    FROM leaderboard_scores ls
    WHERE ls.user_id = target_user_id
    LIMIT 1
  )
  SELECT
    ls.user_id,
    COALESCE(p.display_name, split_part(p.email, '@', 1)) as display_name,
    p.username,
    p.avatar_url,
    ls.bodyweight,
    ls.dots_score,
    ls.squat_pr,
    ls.bench_pr,
    ls.deadlift_pr,
    ls.total
  FROM leaderboard_scores ls
  JOIN profiles p ON p.user_id = ls.user_id
  CROSS JOIN my_stats ms
  WHERE ls.user_id != target_user_id
    AND ABS(ls.dots_score - ms.dots_score) < dots_threshold
    AND ABS(ls.bodyweight - ms.bodyweight) < bw_threshold
    AND ls.dots_score > 0
  ORDER BY ABS(ls.dots_score - ms.dots_score) ASC
  LIMIT 20;
$$;

-- Function to get power score leaderboard
CREATE OR REPLACE FUNCTION public.get_power_score_leaderboard()
RETURNS TABLE(
  user_id uuid,
  display_name text,
  username text,
  avatar_url text,
  power_score numeric,
  last_updated timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ps.user_id,
    COALESCE(p.display_name, split_part(p.email, '@', 1)) as display_name,
    p.username,
    p.avatar_url,
    ps.power_score,
    ps.last_updated
  FROM power_scores ps
  JOIN profiles p ON p.user_id = ps.user_id
  WHERE ps.power_score > 0
  ORDER BY ps.power_score DESC
  LIMIT 100;
$$;
