
-- Leaderboard scores with DOTS
CREATE TABLE public.leaderboard_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  squat_pr NUMERIC DEFAULT 0,
  bench_pr NUMERIC DEFAULT 0,
  deadlift_pr NUMERIC DEFAULT 0,
  total NUMERIC DEFAULT 0,
  bodyweight NUMERIC DEFAULT 0,
  dots_score NUMERIC DEFAULT 0,
  league TEXT DEFAULT 'bronze_3',
  league_points INTEGER DEFAULT 0,
  season INTEGER DEFAULT 1,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.leaderboard_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view leaderboard" ON public.leaderboard_scores FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can upsert own score" ON public.leaderboard_scores FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own score" ON public.leaderboard_scores FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Function to calculate DOTS score
CREATE OR REPLACE FUNCTION public.calculate_dots(total_kg NUMERIC, bw_kg NUMERIC, is_male BOOLEAN DEFAULT true)
RETURNS NUMERIC
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  coeff NUMERIC;
  a NUMERIC; b NUMERIC; c NUMERIC; d NUMERIC; e NUMERIC;
BEGIN
  IF bw_kg <= 0 OR total_kg <= 0 THEN RETURN 0; END IF;
  
  IF is_male THEN
    a := -307.75076; b := 24.0900756; c := -0.1918759221; d := 0.0007391293; e := -0.000001093;
  ELSE
    a := -57.96288; b := 13.6175032; c := -0.1126655495; d := 0.0005158568; e := -0.0000010706;
  END IF;
  
  coeff := 500.0 / (a + b * bw_kg + c * bw_kg^2 + d * bw_kg^3 + e * bw_kg^4);
  RETURN ROUND(total_kg * coeff, 2);
END;
$$;

-- Enhanced leaderboard with DOTS
CREATE OR REPLACE FUNCTION public.get_dots_leaderboard(min_bw NUMERIC DEFAULT 0, max_bw NUMERIC DEFAULT 999)
RETURNS TABLE(
  display_name TEXT,
  username TEXT,
  bodyweight NUMERIC,
  squat_pr NUMERIC,
  bench_pr NUMERIC,
  deadlift_pr NUMERIC,
  total NUMERIC,
  dots_score NUMERIC,
  league TEXT,
  league_points INTEGER
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    COALESCE(p.display_name, split_part(p.email, '@', 1)) as display_name,
    p.username,
    ls.bodyweight,
    ls.squat_pr,
    ls.bench_pr,
    ls.deadlift_pr,
    ls.total,
    ls.dots_score,
    ls.league,
    ls.league_points
  FROM leaderboard_scores ls
  JOIN profiles p ON p.user_id = ls.user_id
  WHERE ls.bodyweight >= min_bw AND ls.bodyweight < max_bw
  ORDER BY ls.dots_score DESC
  LIMIT 100;
$$;
