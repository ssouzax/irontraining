
-- Social Profiles (extends existing profiles)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS cover_url TEXT,
ADD COLUMN IF NOT EXISTS instagram_url TEXT,
ADD COLUMN IF NOT EXISTS tiktok_url TEXT,
ADD COLUMN IF NOT EXISTS youtube_url TEXT,
ADD COLUMN IF NOT EXISTS website_url TEXT,
ADD COLUMN IF NOT EXISTS profile_public BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_bodyweight BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_prs BOOLEAN DEFAULT true;

-- Posts
CREATE TABLE public.posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  post_type TEXT NOT NULL DEFAULT 'update',
  caption TEXT,
  exercise_name TEXT,
  weight NUMERIC,
  reps INTEGER,
  estimated_1rm NUMERIC,
  workout_log_id UUID REFERENCES public.workout_logs(id) ON DELETE SET NULL,
  is_pr BOOLEAN DEFAULT false,
  media_urls TEXT[] DEFAULT '{}',
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view public posts" ON public.posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own posts" ON public.posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts" ON public.posts FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts" ON public.posts FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Likes
CREATE TABLE public.likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view likes" ON public.likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own likes" ON public.likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own likes" ON public.likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Comments
CREATE TABLE public.comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view comments" ON public.comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own comments" ON public.comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON public.comments FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Follows
CREATE TABLE public.follows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL,
  following_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view follows" ON public.follows FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can follow" ON public.follows FOR INSERT TO authenticated WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow" ON public.follows FOR DELETE TO authenticated USING (auth.uid() = follower_id);

-- Achievement Levels (expanded)
CREATE TABLE public.achievement_levels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  achievement_key TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'strength',
  level_number INTEGER NOT NULL DEFAULT 1,
  level_name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  requirement_type TEXT NOT NULL,
  requirement_value NUMERIC NOT NULL,
  icon TEXT DEFAULT 'trophy',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.achievement_levels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Achievement levels are viewable" ON public.achievement_levels FOR SELECT TO authenticated USING (true);

-- Update profiles RLS to allow public viewing
CREATE POLICY "Public profiles are viewable" ON public.profiles FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Functions for like counts
CREATE OR REPLACE FUNCTION public.increment_likes()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.decrement_likes()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$;

CREATE TRIGGER on_like_insert AFTER INSERT ON public.likes FOR EACH ROW EXECUTE FUNCTION public.increment_likes();
CREATE TRIGGER on_like_delete AFTER DELETE ON public.likes FOR EACH ROW EXECUTE FUNCTION public.decrement_likes();

-- Comment count triggers
CREATE OR REPLACE FUNCTION public.increment_comments()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.decrement_comments()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.posts SET comments_count = GREATEST(0, comments_count - 1) WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$;

CREATE TRIGGER on_comment_insert AFTER INSERT ON public.comments FOR EACH ROW EXECUTE FUNCTION public.increment_comments();
CREATE TRIGGER on_comment_delete AFTER DELETE ON public.comments FOR EACH ROW EXECUTE FUNCTION public.decrement_comments();

-- Seed achievement levels
INSERT INTO public.achievement_levels (achievement_key, category, level_number, level_name, title, description, requirement_type, requirement_value, icon) VALUES
-- Workout consistency
('workouts_completed', 'consistency', 1, 'Iniciante', 'Primeiros Passos', 'Complete 10 treinos', 'total_workouts', 10, '🏃'),
('workouts_completed', 'consistency', 2, 'Regular', 'Rotina Sólida', 'Complete 50 treinos', 'total_workouts', 50, '💪'),
('workouts_completed', 'consistency', 3, 'Dedicado', 'Máquina de Treino', 'Complete 150 treinos', 'total_workouts', 150, '🔥'),
('workouts_completed', 'consistency', 4, 'Elite', 'Atleta Elite', 'Complete 500 treinos', 'total_workouts', 500, '⚡'),
('workouts_completed', 'consistency', 5, 'Lendário', 'Lenda do Iron', 'Complete 1000 treinos', 'total_workouts', 1000, '👑'),
-- Squat milestones
('squat_weight', 'strength', 1, 'Iniciante', 'Agachamento 60kg', 'Agache 60kg', 'squat_1rm', 60, '🦵'),
('squat_weight', 'strength', 2, 'Intermediário', 'Agachamento 100kg', 'Agache 100kg', 'squat_1rm', 100, '🦵'),
('squat_weight', 'strength', 3, 'Avançado', 'Agachamento 140kg', 'Agache 140kg', 'squat_1rm', 140, '🦵'),
('squat_weight', 'strength', 4, 'Elite', 'Agachamento 180kg', 'Agache 180kg', 'squat_1rm', 180, '🦵'),
('squat_weight', 'strength', 5, 'Lendário', 'Agachamento 220kg', 'Agache 220kg', 'squat_1rm', 220, '🦵'),
-- Bench milestones
('bench_weight', 'strength', 1, 'Iniciante', 'Supino 40kg', 'Supino 40kg', 'bench_1rm', 40, '🏋️'),
('bench_weight', 'strength', 2, 'Intermediário', 'Supino 80kg', 'Supino 80kg', 'bench_1rm', 80, '🏋️'),
('bench_weight', 'strength', 3, 'Avançado', 'Supino 100kg', 'Supino 100kg', 'bench_1rm', 100, '🏋️'),
('bench_weight', 'strength', 4, 'Elite', 'Supino 130kg', 'Supino 130kg', 'bench_1rm', 130, '🏋️'),
('bench_weight', 'strength', 5, 'Lendário', 'Supino 160kg', 'Supino 160kg', 'bench_1rm', 160, '🏋️'),
-- Deadlift milestones
('deadlift_weight', 'strength', 1, 'Iniciante', 'Terra 80kg', 'Terra 80kg', 'deadlift_1rm', 80, '💀'),
('deadlift_weight', 'strength', 2, 'Intermediário', 'Terra 140kg', 'Terra 140kg', 'deadlift_1rm', 140, '💀'),
('deadlift_weight', 'strength', 3, 'Avançado', 'Terra 180kg', 'Terra 180kg', 'deadlift_1rm', 180, '💀'),
('deadlift_weight', 'strength', 4, 'Elite', 'Terra 220kg', 'Terra 220kg', 'deadlift_1rm', 220, '💀'),
('deadlift_weight', 'strength', 5, 'Lendário', 'Terra 260kg', 'Terra 260kg', 'deadlift_1rm', 260, '💀'),
-- PR count
('pr_count', 'milestones', 1, 'Iniciante', 'Primeiro PR', '1 PR registrado', 'total_prs', 1, '🏆'),
('pr_count', 'milestones', 2, 'Colecionador', '5 PRs', '5 PRs registrados', 'total_prs', 5, '🏆'),
('pr_count', 'milestones', 3, 'Veterano', '25 PRs', '25 PRs registrados', 'total_prs', 25, '🏆'),
('pr_count', 'milestones', 4, 'Elite', '100 PRs', '100 PRs registrados', 'total_prs', 100, '🏆'),
-- Volume
('volume_total', 'volume', 1, 'Iniciante', '10 Toneladas', '10.000kg de volume total', 'total_volume_kg', 10000, '📊'),
('volume_total', 'volume', 2, 'Intermediário', '100 Toneladas', '100.000kg de volume total', 'total_volume_kg', 100000, '📊'),
('volume_total', 'volume', 3, 'Avançado', '500 Toneladas', '500.000kg de volume total', 'total_volume_kg', 500000, '📊'),
('volume_total', 'volume', 4, 'Elite', '1M kg', '1.000.000kg de volume total', 'total_volume_kg', 1000000, '📊');

-- Storage bucket for social media
INSERT INTO storage.buckets (id, name, public) VALUES ('social-media', 'social-media', true);

CREATE POLICY "Anyone can view social media" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'social-media');
CREATE POLICY "Users can upload social media" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'social-media');
CREATE POLICY "Users can delete own social media" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'social-media' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Enable realtime for posts
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
