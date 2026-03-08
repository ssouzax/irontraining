
-- Members of shared workouts (create first since referenced in policies)
CREATE TABLE public.shared_workout_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID NOT NULL,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(workout_id, user_id)
);

-- Shared workouts for co-training
CREATE TABLE public.shared_workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add FK now that both tables exist
ALTER TABLE public.shared_workout_members ADD CONSTRAINT shared_workout_members_workout_id_fkey FOREIGN KEY (workout_id) REFERENCES public.shared_workouts(id) ON DELETE CASCADE;

-- Shared workout activity feed
CREATE TABLE public.shared_workout_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID NOT NULL REFERENCES public.shared_workouts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  activity_type TEXT NOT NULL DEFAULT 'workout_log',
  message TEXT,
  exercise_name TEXT,
  weight NUMERIC,
  reps INTEGER,
  estimated_1rm NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.shared_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_workout_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_workout_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view shared workouts" ON public.shared_workouts FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.shared_workout_members m WHERE m.workout_id = shared_workouts.id AND m.user_id = auth.uid())
  OR created_by = auth.uid()
);
CREATE POLICY "Users can create shared workouts" ON public.shared_workouts FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Owners can update shared workouts" ON public.shared_workouts FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Owners can delete shared workouts" ON public.shared_workouts FOR DELETE USING (auth.uid() = created_by);

CREATE POLICY "Members can view members" ON public.shared_workout_members FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.shared_workout_members m2 WHERE m2.workout_id = shared_workout_members.workout_id AND m2.user_id = auth.uid())
);
CREATE POLICY "Users can join workouts" ON public.shared_workout_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave workouts" ON public.shared_workout_members FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Members can view activity" ON public.shared_workout_activity FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.shared_workout_members m WHERE m.workout_id = shared_workout_activity.workout_id AND m.user_id = auth.uid())
);
CREATE POLICY "Members can post activity" ON public.shared_workout_activity FOR INSERT WITH CHECK (auth.uid() = user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.shared_workout_activity;
