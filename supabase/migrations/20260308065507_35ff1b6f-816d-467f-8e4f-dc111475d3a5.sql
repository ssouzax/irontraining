
-- Seasons table
CREATE TABLE public.seasons (
  id SERIAL PRIMARY KEY,
  season_number INTEGER NOT NULL UNIQUE,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view seasons" ON public.seasons FOR SELECT TO authenticated USING (true);

-- Season rewards
CREATE TABLE public.season_rewards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  season_id INTEGER NOT NULL REFERENCES public.seasons(id),
  final_rank INTEGER,
  final_dots NUMERIC,
  league TEXT,
  badge_title TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, season_id)
);
ALTER TABLE public.season_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own rewards" ON public.season_rewards FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "System can insert rewards" ON public.season_rewards FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Seed current season
INSERT INTO public.seasons (season_number, name, start_date, end_date, is_active)
VALUES (1, 'Temporada 1 — Gênesis', '2026-01-01', '2026-03-31', true);

-- Expand achievement_levels with 70+ more achievements
INSERT INTO public.achievement_levels (achievement_key, category, level_number, level_name, title, description, requirement_type, requirement_value, icon) VALUES
-- Total lifted volume
('volume_total', 'volume', 5, 'Lendário', '5M kg Levantados', '5.000.000kg de volume total', 'total_volume_kg', 5000000, '📊'),
-- PR streaks
('pr_streak', 'milestones', 1, 'Iniciante', 'Semana de PR', 'PRs em 2 semanas seguidas', 'pr_streak_weeks', 2, '🔥'),
('pr_streak', 'milestones', 2, 'Intermediário', 'Mês de Fogo', 'PRs em 4 semanas seguidas', 'pr_streak_weeks', 4, '🔥'),
('pr_streak', 'milestones', 3, 'Avançado', 'Imparável', 'PRs em 8 semanas seguidas', 'pr_streak_weeks', 8, '🔥'),
-- Training streak
('training_streak', 'consistency', 1, 'Iniciante', '7 Dias Seguidos', 'Treinou 7 dias seguidos', 'training_streak_days', 7, '📅'),
('training_streak', 'consistency', 2, 'Regular', '14 Dias Seguidos', 'Treinou 14 dias seguidos', 'training_streak_days', 14, '📅'),
('training_streak', 'consistency', 3, 'Dedicado', '30 Dias Seguidos', 'Treinou 30 dias seguidos', 'training_streak_days', 30, '📅'),
('training_streak', 'consistency', 4, 'Elite', '90 Dias Seguidos', 'Treinou 90 dias seguidos', 'training_streak_days', 90, '📅'),
('training_streak', 'consistency', 5, 'Lendário', '365 Dias Seguidos', 'Treinou 365 dias seguidos', 'training_streak_days', 365, '📅'),
-- Social
('social_posts', 'social', 1, 'Iniciante', 'Primeiro Post', '1 post publicado', 'total_posts', 1, '📱'),
('social_posts', 'social', 2, 'Ativo', '10 Posts', '10 posts publicados', 'total_posts', 10, '📱'),
('social_posts', 'social', 3, 'Influencer', '50 Posts', '50 posts publicados', 'total_posts', 50, '📱'),
('social_posts', 'social', 4, 'Estrela', '200 Posts', '200 posts publicados', 'total_posts', 200, '📱'),
('social_likes', 'social', 1, 'Iniciante', '10 Curtidas', 'Recebeu 10 curtidas', 'total_likes_received', 10, '❤️'),
('social_likes', 'social', 2, 'Popular', '100 Curtidas', 'Recebeu 100 curtidas', 'total_likes_received', 100, '❤️'),
('social_likes', 'social', 3, 'Viral', '1000 Curtidas', 'Recebeu 1000 curtidas', 'total_likes_received', 1000, '❤️'),
('social_followers', 'social', 1, 'Iniciante', '5 Seguidores', '5 seguidores', 'total_followers', 5, '👥'),
('social_followers', 'social', 2, 'Popular', '25 Seguidores', '25 seguidores', 'total_followers', 25, '👥'),
('social_followers', 'social', 3, 'Influencer', '100 Seguidores', '100 seguidores', 'total_followers', 100, '👥'),
('social_followers', 'social', 4, 'Estrela', '500 Seguidores', '500 seguidores', 'total_followers', 500, '👥'),
-- Bodyweight milestones
('total_strength', 'strength', 1, 'Iniciante', 'Total 200kg', 'Total SBD 200kg', 'total_sbd', 200, '⚡'),
('total_strength', 'strength', 2, 'Intermediário', 'Total 300kg', 'Total SBD 300kg', 'total_sbd', 300, '⚡'),
('total_strength', 'strength', 3, 'Avançado', 'Total 400kg', 'Total SBD 400kg', 'total_sbd', 400, '⚡'),
('total_strength', 'strength', 4, 'Elite', 'Total 500kg', 'Total SBD 500kg', 'total_sbd', 500, '⚡'),
('total_strength', 'strength', 5, 'Lendário', 'Total 600kg', 'Total SBD 600kg', 'total_sbd', 600, '⚡'),
-- DOTS milestones
('dots_score', 'strength', 1, 'Iniciante', 'DOTS 150', 'Score DOTS acima de 150', 'dots_score', 150, '📈'),
('dots_score', 'strength', 2, 'Intermediário', 'DOTS 250', 'Score DOTS acima de 250', 'dots_score', 250, '📈'),
('dots_score', 'strength', 3, 'Avançado', 'DOTS 350', 'Score DOTS acima de 350', 'dots_score', 350, '📈'),
('dots_score', 'strength', 4, 'Elite', 'DOTS 450', 'Score DOTS acima de 450', 'dots_score', 450, '📈'),
('dots_score', 'strength', 5, 'Lendário', 'DOTS 550', 'Score DOTS acima de 550', 'dots_score', 550, '📈'),
-- Endurance
('long_workout', 'endurance', 1, 'Iniciante', 'Treino +60min', 'Treino com mais de 60 minutos', 'longest_workout_min', 60, '⏱️'),
('long_workout', 'endurance', 2, 'Intermediário', 'Treino +90min', 'Treino com mais de 90 minutos', 'longest_workout_min', 90, '⏱️'),
('long_workout', 'endurance', 3, 'Avançado', 'Treino +120min', 'Treino com mais de 120 minutos', 'longest_workout_min', 120, '⏱️'),
-- Sets completed
('total_sets', 'volume', 1, 'Iniciante', '100 Séries', '100 séries completadas', 'total_sets_completed', 100, '🎯'),
('total_sets', 'volume', 2, 'Intermediário', '500 Séries', '500 séries completadas', 'total_sets_completed', 500, '🎯'),
('total_sets', 'volume', 3, 'Avançado', '2000 Séries', '2000 séries completadas', 'total_sets_completed', 2000, '🎯'),
('total_sets', 'volume', 4, 'Elite', '5000 Séries', '5000 séries completadas', 'total_sets_completed', 5000, '🎯'),
('total_sets', 'volume', 5, 'Lendário', '10000 Séries', '10000 séries completadas', 'total_sets_completed', 10000, '🎯'),
-- Exercises variety
('exercise_variety', 'progress', 1, 'Iniciante', '10 Exercícios', 'Fez 10 exercícios diferentes', 'unique_exercises', 10, '🔄'),
('exercise_variety', 'progress', 2, 'Intermediário', '25 Exercícios', 'Fez 25 exercícios diferentes', 'unique_exercises', 25, '🔄'),
('exercise_variety', 'progress', 3, 'Avançado', '50 Exercícios', 'Fez 50 exercícios diferentes', 'unique_exercises', 50, '🔄'),
-- Body weight ratios
('bw_squat', 'strength', 1, 'Iniciante', 'Agachamento 1xPC', 'Agachamento ≥ 1x peso corporal', 'squat_bw_ratio', 1, '🦵'),
('bw_squat', 'strength', 2, 'Intermediário', 'Agachamento 1.5xPC', 'Agachamento ≥ 1.5x peso corporal', 'squat_bw_ratio', 1.5, '🦵'),
('bw_squat', 'strength', 3, 'Avançado', 'Agachamento 2xPC', 'Agachamento ≥ 2x peso corporal', 'squat_bw_ratio', 2, '🦵'),
('bw_squat', 'strength', 4, 'Elite', 'Agachamento 2.5xPC', 'Agachamento ≥ 2.5x peso corporal', 'squat_bw_ratio', 2.5, '🦵'),
('bw_bench', 'strength', 1, 'Iniciante', 'Supino 0.75xPC', 'Supino ≥ 0.75x peso corporal', 'bench_bw_ratio', 0.75, '🏋️'),
('bw_bench', 'strength', 2, 'Intermediário', 'Supino 1xPC', 'Supino ≥ 1x peso corporal', 'bench_bw_ratio', 1, '🏋️'),
('bw_bench', 'strength', 3, 'Avançado', 'Supino 1.5xPC', 'Supino ≥ 1.5x peso corporal', 'bench_bw_ratio', 1.5, '🏋️'),
('bw_bench', 'strength', 4, 'Elite', 'Supino 2xPC', 'Supino ≥ 2x peso corporal', 'bench_bw_ratio', 2, '🏋️'),
('bw_deadlift', 'strength', 1, 'Iniciante', 'Terra 1.25xPC', 'Terra ≥ 1.25x peso corporal', 'deadlift_bw_ratio', 1.25, '💀'),
('bw_deadlift', 'strength', 2, 'Intermediário', 'Terra 1.75xPC', 'Terra ≥ 1.75x peso corporal', 'deadlift_bw_ratio', 1.75, '💀'),
('bw_deadlift', 'strength', 3, 'Avançado', 'Terra 2.5xPC', 'Terra ≥ 2.5x peso corporal', 'deadlift_bw_ratio', 2.5, '💀'),
('bw_deadlift', 'strength', 4, 'Elite', 'Terra 3xPC', 'Terra ≥ 3x peso corporal', 'deadlift_bw_ratio', 3, '💀'),
-- League achievements
('league_rank', 'milestones', 1, 'Prata', 'Liga Prata', 'Alcançou a liga Prata', 'league_tier', 1, '🥈'),
('league_rank', 'milestones', 2, 'Ouro', 'Liga Ouro', 'Alcançou a liga Ouro', 'league_tier', 2, '🥇'),
('league_rank', 'milestones', 3, 'Platina', 'Liga Platina', 'Alcançou a liga Platina', 'league_tier', 3, '💎'),
('league_rank', 'milestones', 4, 'Diamante', 'Liga Diamante', 'Alcançou a liga Diamante', 'league_tier', 4, '💠'),
('league_rank', 'milestones', 5, 'Elite', 'Liga Elite', 'Alcançou a liga Elite', 'league_tier', 5, '👑'),
-- Season achievements
('season_finish', 'milestones', 1, 'Participante', 'Primeira Temporada', 'Completou a primeira temporada', 'seasons_completed', 1, '🏅'),
('season_finish', 'milestones', 2, 'Veterano', '3 Temporadas', 'Completou 3 temporadas', 'seasons_completed', 3, '🏅'),
('season_finish', 'milestones', 3, 'Lenda', '10 Temporadas', 'Completou 10 temporadas', 'seasons_completed', 10, '🏅')
ON CONFLICT DO NOTHING;
