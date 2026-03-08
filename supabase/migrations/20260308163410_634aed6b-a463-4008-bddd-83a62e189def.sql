
-- Create gyms table
CREATE TABLE public.gyms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  latitude numeric,
  longitude numeric,
  city text,
  country text,
  verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.gyms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view gyms" ON public.gyms FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create gyms" ON public.gyms FOR INSERT TO authenticated WITH CHECK (true);

-- Create gym_members table
CREATE TABLE public.gym_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  gym_id uuid NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, gym_id)
);

ALTER TABLE public.gym_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view gym members" ON public.gym_members FOR SELECT USING (true);
CREATE POLICY "Users can join gyms" ON public.gym_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave gyms" ON public.gym_members FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Create gym_leaderboards table
CREATE TABLE public.gym_leaderboards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  exercise_type text NOT NULL,
  weight_lifted numeric NOT NULL DEFAULT 0,
  bodyweight numeric NOT NULL DEFAULT 0,
  relative_strength numeric GENERATED ALWAYS AS (
    CASE WHEN bodyweight > 0 THEN ROUND(weight_lifted / bodyweight, 2) ELSE 0 END
  ) STORED,
  estimated_1rm numeric NOT NULL DEFAULT 0,
  dots_score numeric NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(gym_id, user_id, exercise_type)
);

ALTER TABLE public.gym_leaderboards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view gym leaderboards" ON public.gym_leaderboards FOR SELECT USING (true);
CREATE POLICY "Users can upsert own leaderboard" ON public.gym_leaderboards FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own leaderboard" ON public.gym_leaderboards FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Add gym fields to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gym_id uuid REFERENCES public.gyms(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gym_visibility text DEFAULT 'public';

-- Function to get gym leaderboard
CREATE OR REPLACE FUNCTION public.get_gym_leaderboard(target_gym_id uuid, target_exercise text DEFAULT 'total')
RETURNS TABLE(
  user_id uuid,
  display_name text,
  username text,
  avatar_url text,
  exercise_type text,
  weight_lifted numeric,
  bodyweight numeric,
  relative_strength numeric,
  estimated_1rm numeric,
  dots_score numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    gl.user_id,
    COALESCE(p.display_name, split_part(p.email, '@', 1)) as display_name,
    p.username,
    p.avatar_url,
    gl.exercise_type,
    gl.weight_lifted,
    gl.bodyweight,
    gl.relative_strength,
    gl.estimated_1rm,
    gl.dots_score
  FROM gym_leaderboards gl
  JOIN profiles p ON p.user_id = gl.user_id
  WHERE gl.gym_id = target_gym_id
    AND gl.exercise_type = target_exercise
  ORDER BY gl.relative_strength DESC
  LIMIT 100;
$$;
