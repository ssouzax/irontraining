
-- Achievements table
CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT DEFAULT 'trophy',
  exercise TEXT,
  value NUMERIC,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own achievements" ON public.achievements
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements" ON public.achievements
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Leaderboard function (returns public data)
CREATE OR REPLACE FUNCTION public.get_leaderboard(lift_name TEXT, weight_class_min NUMERIC DEFAULT 0, weight_class_max NUMERIC DEFAULT 999)
RETURNS TABLE(
  display_name TEXT,
  body_weight NUMERIC,
  exercise TEXT,
  weight NUMERIC,
  reps INTEGER,
  estimated_1rm NUMERIC,
  recorded_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    COALESCE(p.display_name, split_part(p.email, '@', 1)) as display_name,
    p.body_weight,
    cl.exercise,
    cl.weight,
    cl.reps,
    ROUND(CASE WHEN cl.reps = 1 THEN cl.weight ELSE cl.weight * (1 + cl.reps::NUMERIC / 30) END, 1) as estimated_1rm,
    cl.recorded_at
  FROM current_lifts cl
  JOIN profiles p ON p.user_id = cl.user_id
  WHERE cl.exercise = lift_name
    AND cl.is_pr = true
    AND (p.body_weight IS NULL OR (p.body_weight >= weight_class_min AND p.body_weight < weight_class_max))
  ORDER BY ROUND(CASE WHEN cl.reps = 1 THEN cl.weight ELSE cl.weight * (1 + cl.reps::NUMERIC / 30) END, 1) DESC
  LIMIT 50;
$$;
