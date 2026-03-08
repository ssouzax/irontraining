
-- Create timestamp update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  email TEXT,
  body_weight NUMERIC DEFAULT 94,
  goals TEXT DEFAULT 'Increase strength while building muscle',
  target_squat TEXT DEFAULT '180–190 kg',
  target_deadlift TEXT DEFAULT '185–200 kg',
  target_bench TEXT DEFAULT '+5–10 kg',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Current lifts tracking
CREATE TABLE public.current_lifts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise TEXT NOT NULL,
  weight NUMERIC NOT NULL,
  reps INTEGER NOT NULL DEFAULT 1,
  is_pr BOOLEAN DEFAULT false,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.current_lifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own lifts" ON public.current_lifts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own lifts" ON public.current_lifts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own lifts" ON public.current_lifts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own lifts" ON public.current_lifts FOR DELETE USING (auth.uid() = user_id);

-- Workout logs
CREATE TABLE public.workout_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_week INTEGER NOT NULL,
  day_index INTEGER NOT NULL,
  day_name TEXT NOT NULL,
  body_weight NUMERIC,
  fatigue INTEGER CHECK (fatigue >= 1 AND fatigue <= 10),
  notes TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own logs" ON public.workout_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own logs" ON public.workout_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own logs" ON public.workout_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own logs" ON public.workout_logs FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_workout_logs_updated_at BEFORE UPDATE ON public.workout_logs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Set logs (individual set records)
CREATE TABLE public.set_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_log_id UUID NOT NULL REFERENCES public.workout_logs(id) ON DELETE CASCADE,
  exercise_name TEXT NOT NULL,
  set_type TEXT NOT NULL DEFAULT 'normal',
  set_number INTEGER NOT NULL,
  target_reps INTEGER,
  target_weight NUMERIC,
  target_rir INTEGER,
  actual_weight NUMERIC,
  actual_reps INTEGER,
  actual_rir INTEGER,
  completed BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.set_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own set logs" ON public.set_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own set logs" ON public.set_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own set logs" ON public.set_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own set logs" ON public.set_logs FOR DELETE USING (auth.uid() = user_id);

-- AI coaching recommendations
CREATE TABLE public.ai_recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  exercise TEXT,
  suggested_change JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own recommendations" ON public.ai_recommendations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own recommendations" ON public.ai_recommendations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own recommendations" ON public.ai_recommendations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own recommendations" ON public.ai_recommendations FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_current_lifts_user ON public.current_lifts(user_id, exercise);
CREATE INDEX idx_workout_logs_user ON public.workout_logs(user_id, created_at DESC);
CREATE INDEX idx_set_logs_workout ON public.set_logs(workout_log_id);
CREATE INDEX idx_ai_recommendations_user ON public.ai_recommendations(user_id, status);
