
-- Gym check-ins table
CREATE TABLE public.gym_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  gym_id uuid NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  checked_in_at timestamp with time zone NOT NULL DEFAULT now(),
  xp_awarded integer NOT NULL DEFAULT 15,
  streak_day integer NOT NULL DEFAULT 1
);

ALTER TABLE public.gym_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view checkins" ON public.gym_checkins FOR SELECT USING (true);
CREATE POLICY "Users can insert own checkins" ON public.gym_checkins FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own checkins" ON public.gym_checkins FOR DELETE USING (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX idx_gym_checkins_user_date ON public.gym_checkins (user_id, checked_in_at DESC);
CREATE INDEX idx_gym_checkins_gym ON public.gym_checkins (gym_id, checked_in_at DESC);

-- Add chain/network column to gyms for filtering
ALTER TABLE public.gyms ADD COLUMN IF NOT EXISTS chain text DEFAULT null;
ALTER TABLE public.gyms ADD COLUMN IF NOT EXISTS address text DEFAULT null;
