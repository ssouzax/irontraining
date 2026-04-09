-- Add media_type and location columns to posts
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS media_type text;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS location text;

-- Add parent_comment_id to comments for threaded replies
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS parent_comment_id uuid REFERENCES public.comments(id) ON DELETE CASCADE;