
-- Exercise Library
CREATE TABLE public.exercises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  primary_muscle TEXT NOT NULL,
  movement_pattern TEXT,
  video_url TEXT,
  instructions TEXT,
  common_mistakes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Exercises are viewable by everyone" ON public.exercises FOR SELECT TO authenticated USING (true);

-- Training Programs
CREATE TABLE public.training_programs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  program_type TEXT NOT NULL DEFAULT 'powerbuilding',
  description TEXT,
  duration_weeks INTEGER NOT NULL DEFAULT 12,
  days_per_week INTEGER NOT NULL DEFAULT 5,
  start_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.training_programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own programs" ON public.training_programs FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Training Blocks
CREATE TABLE public.training_blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id UUID NOT NULL REFERENCES public.training_programs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  block_type TEXT NOT NULL DEFAULT 'hypertrophy',
  goal TEXT,
  start_week INTEGER NOT NULL,
  end_week INTEGER NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.training_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own blocks" ON public.training_blocks FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.training_programs tp WHERE tp.id = program_id AND tp.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.training_programs tp WHERE tp.id = program_id AND tp.user_id = auth.uid()));

-- Training Weeks
CREATE TABLE public.training_weeks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  block_id UUID NOT NULL REFERENCES public.training_blocks(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.training_weeks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own weeks" ON public.training_weeks FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.training_blocks tb JOIN public.training_programs tp ON tp.id = tb.program_id WHERE tb.id = block_id AND tp.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.training_blocks tb JOIN public.training_programs tp ON tp.id = tb.program_id WHERE tb.id = block_id AND tp.user_id = auth.uid()));

-- Training Days
CREATE TABLE public.training_days (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  week_id UUID NOT NULL REFERENCES public.training_weeks(id) ON DELETE CASCADE,
  day_name TEXT NOT NULL,
  day_of_week TEXT,
  focus TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.training_days ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own days" ON public.training_days FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.training_weeks tw
    JOIN public.training_blocks tb ON tb.id = tw.block_id
    JOIN public.training_programs tp ON tp.id = tb.program_id
    WHERE tw.id = week_id AND tp.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.training_weeks tw
    JOIN public.training_blocks tb ON tb.id = tw.block_id
    JOIN public.training_programs tp ON tp.id = tb.program_id
    WHERE tw.id = week_id AND tp.user_id = auth.uid()
  ));

-- Workout Exercises (exercises assigned to a training day)
CREATE TABLE public.workout_exercises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  day_id UUID NOT NULL REFERENCES public.training_days(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES public.exercises(id),
  exercise_name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'compound',
  muscle_group TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own workout exercises" ON public.workout_exercises FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.training_days td
    JOIN public.training_weeks tw ON tw.id = td.week_id
    JOIN public.training_blocks tb ON tb.id = tw.block_id
    JOIN public.training_programs tp ON tp.id = tb.program_id
    WHERE td.id = day_id AND tp.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.training_days td
    JOIN public.training_weeks tw ON tw.id = td.week_id
    JOIN public.training_blocks tb ON tb.id = tw.block_id
    JOIN public.training_programs tp ON tp.id = tb.program_id
    WHERE td.id = day_id AND tp.user_id = auth.uid()
  ));

-- Planned Sets (training prescription)
CREATE TABLE public.planned_sets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_exercise_id UUID NOT NULL REFERENCES public.workout_exercises(id) ON DELETE CASCADE,
  set_number INTEGER NOT NULL DEFAULT 1,
  target_sets INTEGER NOT NULL DEFAULT 1,
  target_reps INTEGER NOT NULL,
  target_rir INTEGER,
  target_weight NUMERIC,
  load_percentage NUMERIC,
  rest_seconds INTEGER DEFAULT 120,
  is_top_set BOOLEAN NOT NULL DEFAULT false,
  is_backoff BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.planned_sets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own planned sets" ON public.planned_sets FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.workout_exercises we
    JOIN public.training_days td ON td.id = we.day_id
    JOIN public.training_weeks tw ON tw.id = td.week_id
    JOIN public.training_blocks tb ON tb.id = tw.block_id
    JOIN public.training_programs tp ON tp.id = tb.program_id
    WHERE we.id = workout_exercise_id AND tp.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.workout_exercises we
    JOIN public.training_days td ON td.id = we.day_id
    JOIN public.training_weeks tw ON tw.id = td.week_id
    JOIN public.training_blocks tb ON tb.id = tw.block_id
    JOIN public.training_programs tp ON tp.id = tb.program_id
    WHERE we.id = workout_exercise_id AND tp.user_id = auth.uid()
  ));

-- Performed Sets (actual logged data)
CREATE TABLE public.performed_sets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  planned_set_id UUID REFERENCES public.planned_sets(id) ON DELETE SET NULL,
  workout_log_id UUID REFERENCES public.workout_logs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  exercise_name TEXT NOT NULL,
  set_number INTEGER NOT NULL DEFAULT 1,
  weight_used NUMERIC,
  reps_completed INTEGER,
  rir_reported INTEGER,
  completed BOOLEAN NOT NULL DEFAULT false,
  estimated_1rm NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.performed_sets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own performed sets" ON public.performed_sets FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Personal Records
CREATE TABLE public.personal_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  exercise_name TEXT NOT NULL,
  weight NUMERIC NOT NULL,
  reps INTEGER NOT NULL DEFAULT 1,
  estimated_1rm NUMERIC NOT NULL,
  pr_type TEXT NOT NULL DEFAULT 'weight',
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.personal_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own PRs" ON public.personal_records FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Workout Notes
CREATE TABLE public.workout_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  workout_log_id UUID REFERENCES public.workout_logs(id) ON DELETE CASCADE,
  fatigue_level INTEGER,
  body_weight NUMERIC,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.workout_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own notes" ON public.workout_notes FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Trigger for training_programs updated_at
CREATE TRIGGER update_training_programs_updated_at
  BEFORE UPDATE ON public.training_programs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed exercise library
INSERT INTO public.exercises (name, primary_muscle, movement_pattern, instructions, common_mistakes) VALUES
('Back Squat', 'Quadríceps', 'squat', 'Barra nas costas, descer até paralelo ou abaixo, empurrar o chão.', 'Joelhos colapsando para dentro, tronco caindo para frente.'),
('Bench Press', 'Peitoral', 'push_horizontal', 'Deitar no banco, descer a barra ao peito, empurrar até extensão completa.', 'Não retrair escápulas, bounce no peito.'),
('Conventional Deadlift', 'Posterior/Costas', 'hinge', 'Barra sobre os pés, quadril para trás, puxar mantendo costas neutras.', 'Costas arredondadas, barra longe do corpo.'),
('Overhead Press', 'Ombros', 'push_vertical', 'Barra na frente dos ombros, empurrar para cima em linha reta.', 'Inclinar demais o tronco, não travar no topo.'),
('Barbell Row', 'Costas', 'pull_horizontal', 'Inclinar o tronco, puxar a barra até o abdômen.', 'Usar impulso, não contrair as escápulas.'),
('Romanian Deadlift', 'Posteriores', 'hinge', 'Descer a barra deslizando nas pernas, sentir alongamento nos posteriores.', 'Flexionar demais os joelhos, arredondar costas.'),
('Weighted Pull-ups', 'Costas', 'pull_vertical', 'Pendurar-se, puxar até o queixo passar a barra.', 'Kipping, não descer totalmente.'),
('Leg Press', 'Quadríceps', 'squat', 'Pés na plataforma, descer até 90° de flexão do joelho.', 'Tirar o glúteo do banco, travar joelhos no topo.'),
('Incline Dumbbell Press', 'Peitoral Superior', 'push_horizontal', 'Banco a 30-45°, descer halteres ao lado do peito.', 'Ângulo muito alto, sem controle na descida.'),
('Lateral Raises', 'Deltóide Lateral', 'isolation', 'Levantar halteres lateralmente até altura dos ombros.', 'Usar impulso, subir acima dos ombros.'),
('Tricep Pushdowns', 'Tríceps', 'isolation', 'Polia alta, empurrar para baixo mantendo cotovelos fixos.', 'Mover os cotovelos, inclinar o tronco.'),
('Face Pulls', 'Deltóide Posterior', 'pull_horizontal', 'Polia alta, puxar em direção ao rosto com rotação externa.', 'Peso muito alto, não fazer rotação externa.'),
('Barbell Curl', 'Bíceps', 'isolation', 'Barra com pegada supinada, flexionar os cotovelos.', 'Balançar o corpo, não descer completamente.'),
('Leg Extensions', 'Quadríceps', 'isolation', 'Sentar na máquina, estender as pernas.', 'Usar impulso, não controlar a descida.'),
('Leg Curl', 'Posteriores', 'isolation', 'Deitar na máquina, flexionar as pernas.', 'Levantar o quadril, não controlar a excêntrica.'),
('Hip Thrust', 'Glúteos', 'hinge', 'Costas apoiadas no banco, empurrar o quadril para cima.', 'Hiperestender a lombar, posição dos pés errada.'),
('Cable Flyes', 'Peitoral', 'isolation', 'Polias altas, juntar os braços à frente com cotovelos levemente flexionados.', 'Braços muito estendidos, sem controle.'),
('Front Squat', 'Quadríceps', 'squat', 'Barra na frente dos ombros, descer mantendo tronco vertical.', 'Cotovelos caindo, tronco inclinando.'),
('Good Mornings', 'Lombar/Posteriores', 'hinge', 'Barra nas costas, inclinar o tronco mantendo costas neutras.', 'Arredondar costas, peso excessivo.'),
('Dips', 'Peitoral/Tríceps', 'push_vertical', 'Descer até 90° nos cotovelos, empurrar para cima.', 'Não descer o suficiente, ombros à frente demais.');
