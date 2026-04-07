
-- Stories table
CREATE TABLE IF NOT EXISTS public.stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  media_url text NOT NULL,
  media_type text NOT NULL DEFAULT 'photo',
  caption text,
  views_count integer NOT NULL DEFAULT 0,
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '24 hours'),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view non-expired stories" ON public.stories
  FOR SELECT TO authenticated
  USING (expires_at > now());

CREATE POLICY "Users can insert own stories" ON public.stories
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own stories" ON public.stories
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Story views table
CREATE TABLE IF NOT EXISTS public.story_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  viewer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(story_id, viewer_id)
);

ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Story owners can view who viewed" ON public.story_views
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.stories s WHERE s.id = story_id AND s.user_id = auth.uid()));

CREATE POLICY "Users can insert own views" ON public.story_views
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = viewer_id);

-- Add followers_count, following_count, posts_count to profiles if missing
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='followers_count') THEN
    ALTER TABLE public.profiles ADD COLUMN followers_count integer DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='following_count') THEN
    ALTER TABLE public.profiles ADD COLUMN following_count integer DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='posts_count') THEN
    ALTER TABLE public.profiles ADD COLUMN posts_count integer DEFAULT 0;
  END IF;
END$$;

-- Trigger to increment story views_count
CREATE OR REPLACE FUNCTION public.increment_story_views()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.stories SET views_count = views_count + 1 WHERE id = NEW.story_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_story_view_insert
  AFTER INSERT ON public.story_views
  FOR EACH ROW EXECUTE FUNCTION public.increment_story_views();

-- Enable realtime for stories
ALTER PUBLICATION supabase_realtime ADD TABLE public.stories;
