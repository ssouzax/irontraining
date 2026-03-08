
CREATE OR REPLACE FUNCTION public.get_streak_leaderboard(target_gym_id uuid DEFAULT NULL)
RETURNS TABLE(
  user_id uuid,
  display_name text,
  username text,
  avatar_url text,
  current_streak integer,
  longest_streak integer,
  weekly_consistency_streak integer,
  gym_name text,
  gym_id uuid
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    ts.user_id,
    COALESCE(p.display_name, split_part(p.email, '@', 1)) as display_name,
    p.username,
    p.avatar_url,
    ts.current_streak,
    ts.longest_streak,
    ts.weekly_consistency_streak,
    g.name as gym_name,
    p.gym_id
  FROM training_streaks ts
  JOIN profiles p ON p.user_id = ts.user_id
  LEFT JOIN gyms g ON g.id = p.gym_id
  WHERE ts.current_streak > 0
    AND (target_gym_id IS NULL OR p.gym_id = target_gym_id)
  ORDER BY ts.current_streak DESC
  LIMIT 100;
$$;
