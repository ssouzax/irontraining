
CREATE TABLE public.user_prs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  exercise_name text NOT NULL,
  weight numeric NOT NULL DEFAULT 0,
  reps integer NOT NULL DEFAULT 1,
  estimated_1rm numeric NOT NULL DEFAULT 0,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, exercise_name)
);

ALTER TABLE public.user_prs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own PRs" ON public.user_prs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own PRs" ON public.user_prs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own PRs" ON public.user_prs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own PRs" ON public.user_prs FOR DELETE USING (auth.uid() = user_id);
