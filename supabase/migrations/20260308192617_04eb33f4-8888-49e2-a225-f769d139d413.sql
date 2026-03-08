
-- Weekly gym challenges table
CREATE TABLE public.gym_weekly_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  week_end date NOT NULL,
  total_checkins integer NOT NULL DEFAULT 0,
  bonus_awarded boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_gym_weekly_unique ON public.gym_weekly_challenges(gym_id, week_start);
CREATE INDEX idx_gym_weekly_week ON public.gym_weekly_challenges(week_start);

ALTER TABLE public.gym_weekly_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view weekly challenges" ON public.gym_weekly_challenges FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert challenges" ON public.gym_weekly_challenges FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update challenges" ON public.gym_weekly_challenges FOR UPDATE USING (true);
