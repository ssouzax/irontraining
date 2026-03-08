
-- 1. Remove duplicate achievements keeping only the earliest per user
DELETE FROM public.achievements a
USING public.achievements b
WHERE a.user_id = b.user_id
  AND a.type = b.type
  AND a.created_at > b.created_at;

-- 2. Add unique constraint to prevent future duplicates
ALTER TABLE public.achievements ADD CONSTRAINT achievements_user_id_type_unique UNIQUE (user_id, type);

-- 3. Add gym_class column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gym_class text DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS coach_personality text DEFAULT 'motivational';

-- 4. Create gym_classes reference table
CREATE TABLE IF NOT EXISTS public.gym_classes (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL DEFAULT '🏋️',
  key_metrics text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.gym_classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view gym classes" ON public.gym_classes FOR SELECT USING (true);

-- 5. Insert gym classes
INSERT INTO public.gym_classes (id, name, description, icon, key_metrics) VALUES
  ('powerlifter', 'Powerlifter', 'Foco em força máxima nos levantamentos compostos. Agachamento, Supino e Terra são seus pilares.', '🏋️', ARRAY['squat', 'bench', 'deadlift', 'total']),
  ('bodybuilder', 'Bodybuilder', 'Foco em hipertrofia e desenvolvimento muscular. Volume e variedade são essenciais.', '💪', ARRAY['volume', 'exercise_variety', 'frequency']),
  ('powerbuilder', 'Powerbuilder', 'Equilíbrio entre força e hipertrofia. O melhor dos dois mundos.', '⚡', ARRAY['compound_prs', 'total_volume']),
  ('hybrid', 'Atleta Híbrido', 'Força, condicionamento e diversidade de treino. Versátil e completo.', '🔥', ARRAY['workout_variety', 'weekly_activity']),
  ('strength', 'Atleta de Força', 'Treinamento de força geral sem especialização rígida. Progressão constante.', '🎯', ARRAY['pr_frequency', 'strength_progression'])
ON CONFLICT (id) DO NOTHING;
