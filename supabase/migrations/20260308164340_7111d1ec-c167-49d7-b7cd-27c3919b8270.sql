
-- Training Streaks table
CREATE TABLE public.training_streaks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  current_streak integer NOT NULL DEFAULT 0,
  longest_streak integer NOT NULL DEFAULT 0,
  last_workout_date date,
  program_streak integer NOT NULL DEFAULT 0,
  weekly_consistency_streak integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.training_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view streaks" ON public.training_streaks FOR SELECT USING (true);
CREATE POLICY "Users can upsert own streak" ON public.training_streaks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own streak" ON public.training_streaks FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Post engagement scoring
CREATE TABLE public.post_engagement (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL UNIQUE REFERENCES public.posts(id) ON DELETE CASCADE,
  engagement_score numeric NOT NULL DEFAULT 0,
  boost_multiplier numeric NOT NULL DEFAULT 1,
  is_trending boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.post_engagement ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view engagement" ON public.post_engagement FOR SELECT USING (true);
CREATE POLICY "System can upsert engagement" ON public.post_engagement FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "System can update engagement" ON public.post_engagement FOR UPDATE TO authenticated USING (true);

-- Gym heatmap metrics
CREATE TABLE public.gym_heatmap_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  daily_pr_count integer NOT NULL DEFAULT 0,
  daily_volume numeric NOT NULL DEFAULT 0,
  top_squat numeric NOT NULL DEFAULT 0,
  top_bench numeric NOT NULL DEFAULT 0,
  top_deadlift numeric NOT NULL DEFAULT 0,
  top_total numeric NOT NULL DEFAULT 0,
  intensity_score numeric NOT NULL DEFAULT 0,
  UNIQUE(gym_id, date)
);

ALTER TABLE public.gym_heatmap_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view heatmap metrics" ON public.gym_heatmap_metrics FOR SELECT USING (true);
CREATE POLICY "Users can upsert heatmap metrics" ON public.gym_heatmap_metrics FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update heatmap metrics" ON public.gym_heatmap_metrics FOR UPDATE TO authenticated USING (true);

-- City strength metrics
CREATE TABLE public.city_strength_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city text NOT NULL,
  country text,
  date date NOT NULL DEFAULT CURRENT_DATE,
  pr_count integer NOT NULL DEFAULT 0,
  total_volume numeric NOT NULL DEFAULT 0,
  top_lift numeric NOT NULL DEFAULT 0,
  top_lift_type text,
  intensity_score numeric NOT NULL DEFAULT 0,
  UNIQUE(city, date)
);

ALTER TABLE public.city_strength_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view city metrics" ON public.city_strength_metrics FOR SELECT USING (true);
CREATE POLICY "Users can upsert city metrics" ON public.city_strength_metrics FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update city metrics" ON public.city_strength_metrics FOR UPDATE TO authenticated USING (true);

-- Function to get trending posts (viral feed)
CREATE OR REPLACE FUNCTION public.get_trending_posts(limit_count integer DEFAULT 50)
RETURNS TABLE(
  post_id uuid,
  user_id uuid,
  post_type text,
  caption text,
  exercise_name text,
  weight numeric,
  reps integer,
  estimated_1rm numeric,
  is_pr boolean,
  likes_count integer,
  comments_count integer,
  media_urls text[],
  created_at timestamptz,
  engagement_score numeric,
  boost_multiplier numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id as post_id,
    p.user_id,
    p.post_type,
    p.caption,
    p.exercise_name,
    p.weight,
    p.reps,
    p.estimated_1rm,
    p.is_pr,
    p.likes_count,
    p.comments_count,
    p.media_urls,
    p.created_at,
    COALESCE(pe.engagement_score, 0) as engagement_score,
    COALESCE(pe.boost_multiplier, 1) as boost_multiplier
  FROM posts p
  LEFT JOIN post_engagement pe ON pe.post_id = p.id
  WHERE p.created_at > now() - interval '7 days'
  ORDER BY (
    COALESCE(pe.engagement_score, 0) * COALESCE(pe.boost_multiplier, 1)
    + CASE WHEN p.is_pr THEN 50 ELSE 0 END
    + p.likes_count * 1 + p.comments_count * 2
  ) DESC
  LIMIT limit_count;
$$;

-- Function to get gym heatmap data
CREATE OR REPLACE FUNCTION public.get_gym_heatmap(days_back integer DEFAULT 7)
RETURNS TABLE(
  gym_id uuid,
  gym_name text,
  city text,
  country text,
  latitude numeric,
  longitude numeric,
  total_prs integer,
  total_volume numeric,
  top_squat numeric,
  top_bench numeric,
  top_deadlift numeric,
  intensity_score numeric,
  member_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    g.id as gym_id,
    g.name as gym_name,
    g.city,
    g.country,
    g.latitude,
    g.longitude,
    COALESCE(SUM(ghm.daily_pr_count), 0)::integer as total_prs,
    COALESCE(SUM(ghm.daily_volume), 0) as total_volume,
    COALESCE(MAX(ghm.top_squat), 0) as top_squat,
    COALESCE(MAX(ghm.top_bench), 0) as top_bench,
    COALESCE(MAX(ghm.top_deadlift), 0) as top_deadlift,
    COALESCE(AVG(ghm.intensity_score), 0) as intensity_score,
    (SELECT COUNT(*) FROM gym_members gm WHERE gm.gym_id = g.id) as member_count
  FROM gyms g
  LEFT JOIN gym_heatmap_metrics ghm ON ghm.gym_id = g.id AND ghm.date >= CURRENT_DATE - days_back
  GROUP BY g.id, g.name, g.city, g.country, g.latitude, g.longitude
  HAVING COALESCE(SUM(ghm.daily_pr_count), 0) > 0 OR (SELECT COUNT(*) FROM gym_members gm WHERE gm.gym_id = g.id) > 0
  ORDER BY COALESCE(AVG(ghm.intensity_score), 0) DESC
  LIMIT 100;
$$;
