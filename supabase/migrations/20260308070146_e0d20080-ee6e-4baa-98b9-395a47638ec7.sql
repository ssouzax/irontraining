
-- Add unique constraint on achievements to prevent duplicates
ALTER TABLE public.achievements ADD CONSTRAINT achievements_user_type_unique UNIQUE (user_id, type);
