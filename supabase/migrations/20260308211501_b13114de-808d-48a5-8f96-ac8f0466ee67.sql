
-- Bar velocity/power logs
CREATE TABLE public.bar_velocity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  exercise_name TEXT NOT NULL,
  set_number INTEGER NOT NULL DEFAULT 1,
  weight NUMERIC NOT NULL DEFAULT 0,
  reps INTEGER NOT NULL DEFAULT 1,
  mean_velocity NUMERIC NOT NULL DEFAULT 0,
  peak_velocity NUMERIC NOT NULL DEFAULT 0,
  power_output NUMERIC NOT NULL DEFAULT 0,
  time_under_tension NUMERIC NOT NULL DEFAULT 0,
  rom_percentage NUMERIC NOT NULL DEFAULT 100,
  estimated_rir INTEGER,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bar_velocity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own velocity logs" ON public.bar_velocity_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own velocity logs" ON public.bar_velocity_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own velocity logs" ON public.bar_velocity_logs FOR DELETE USING (auth.uid() = user_id);

-- Wearable health logs
CREATE TABLE public.wearable_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  heart_rate INTEGER,
  hrv NUMERIC,
  calories_burned NUMERIC DEFAULT 0,
  spo2 NUMERIC,
  sleep_hours NUMERIC,
  resting_hr INTEGER,
  fatigue_score NUMERIC DEFAULT 0,
  readiness_score NUMERIC DEFAULT 0,
  session_type TEXT NOT NULL DEFAULT 'training',
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.wearable_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wearable logs" ON public.wearable_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own wearable logs" ON public.wearable_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own wearable logs" ON public.wearable_logs FOR DELETE USING (auth.uid() = user_id);

-- Execution grades per set
CREATE TABLE public.execution_grades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  exercise_name TEXT NOT NULL,
  set_number INTEGER NOT NULL DEFAULT 1,
  grade TEXT NOT NULL DEFAULT 'good',
  grade_score NUMERIC NOT NULL DEFAULT 75,
  posture_score NUMERIC DEFAULT 0,
  rom_score NUMERIC DEFAULT 0,
  tempo_score NUMERIC DEFAULT 0,
  stability_score NUMERIC DEFAULT 0,
  notes TEXT,
  xp_bonus INTEGER NOT NULL DEFAULT 0,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.execution_grades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own grades" ON public.execution_grades FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own grades" ON public.execution_grades FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own grades" ON public.execution_grades FOR DELETE USING (auth.uid() = user_id);
