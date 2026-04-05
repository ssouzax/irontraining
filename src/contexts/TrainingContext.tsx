import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { TrainingProgram, TrainingBlock, TrainingWeek, TrainingDay, Exercise, TrainingSet, UserProfile, WorkoutLog, LoggedSet } from '@/types/training';
import { defaultProfile, getProfileForUser, emptyProgram, getProgramForUser } from '@/data/defaultProfile';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface TrainingState {
  profile: UserProfile;
  program: TrainingProgram;
  currentWeek: number;
  currentDay: number;
  workoutLogs: WorkoutLog[];
  programLoading: boolean;
  setCurrentWeek: (w: number) => void;
  setCurrentDay: (d: number) => void;
  logWorkout: (log: WorkoutLog) => void;
  updateProfile: (p: Partial<UserProfile>) => void;
  setProgram: (p: TrainingProgram) => void;
  loadActiveProgram: () => Promise<void>;
}

const TrainingContext = createContext<TrainingState | null>(null);

export function TrainingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const isOwner = user?.email?.toLowerCase() === 'samuelsouzapon@gmail.com';
  
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [program, setProgramState] = useState<TrainingProgram>(emptyProgram);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [currentDay, setCurrentDay] = useState(0);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [programLoading, setProgramLoading] = useState(false);

  const setProgram = useCallback((p: TrainingProgram) => {
    setProgramState(p);
  }, []);

  // Load active program from database
  const loadActiveProgram = useCallback(async () => {
    if (!user?.id) return;
    setProgramLoading(true);
    try {
      // 1. Fetch active program
      const { data: prog, error: progErr } = await supabase
        .from('training_programs')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (progErr) throw progErr;
      if (!prog) {
        setProgramState(emptyProgram);
        setProgramLoading(false);
        return;
      }

      // 2. Fetch blocks
      const { data: blocks } = await supabase
        .from('training_blocks')
        .select('*')
        .eq('program_id', prog.id)
        .order('order_index');

      if (!blocks || blocks.length === 0) {
        setProgramState(emptyProgram);
        setProgramLoading(false);
        return;
      }

      // 3. Fetch weeks for all blocks
      const blockIds = blocks.map(b => b.id);
      const { data: weeks } = await supabase
        .from('training_weeks')
        .select('*')
        .in('block_id', blockIds)
        .order('week_number');

      // 4. Fetch days for all weeks
      const weekIds = (weeks || []).map(w => w.id);
      const { data: days } = await supabase
        .from('training_days')
        .select('*')
        .in('week_id', weekIds)
        .order('order_index');

      // 5. Fetch exercises for all days
      const dayIds = (days || []).map(d => d.id);
      const { data: exercises } = await supabase
        .from('workout_exercises')
        .select('*')
        .in('day_id', dayIds)
        .order('order_index');

      // 6. Fetch planned sets for all exercises
      const exerciseIds = (exercises || []).map(e => e.id);
      // Handle large arrays by chunking (supabase limit)
      let allSets: any[] = [];
      const chunkSize = 500;
      for (let i = 0; i < exerciseIds.length; i += chunkSize) {
        const chunk = exerciseIds.slice(i, i + chunkSize);
        const { data: sets } = await supabase
          .from('planned_sets')
          .select('*')
          .in('workout_exercise_id', chunk)
          .order('set_number');
        if (sets) allSets = allSets.concat(sets);
      }

      // Build lookup maps
      const setsMap = new Map<string, any[]>();
      for (const s of allSets) {
        const arr = setsMap.get(s.workout_exercise_id) || [];
        arr.push(s);
        setsMap.set(s.workout_exercise_id, arr);
      }

      const exercisesMap = new Map<string, any[]>();
      for (const ex of (exercises || [])) {
        const arr = exercisesMap.get(ex.day_id) || [];
        arr.push(ex);
        exercisesMap.set(ex.day_id, arr);
      }

      const daysMap = new Map<string, any[]>();
      for (const d of (days || [])) {
        const arr = daysMap.get(d.week_id) || [];
        arr.push(d);
        daysMap.set(d.week_id, arr);
      }

      const weeksMap = new Map<string, any[]>();
      for (const w of (weeks || [])) {
        const arr = weeksMap.get(w.block_id) || [];
        arr.push(w);
        weeksMap.set(w.block_id, arr);
      }

      // 7. Assemble TrainingProgram
      const trainingBlocks: TrainingBlock[] = blocks.map(block => {
        const blockWeeks = weeksMap.get(block.id) || [];
        const trainingWeeks: TrainingWeek[] = blockWeeks.map(week => {
          const weekDays = daysMap.get(week.id) || [];
          const trainingDays: TrainingDay[] = weekDays.map(day => {
            const dayExercises = exercisesMap.get(day.id) || [];
            const trainingExercises: Exercise[] = dayExercises.map(ex => {
              const exSets = setsMap.get(ex.id) || [];
              const trainingSets: TrainingSet[] = exSets.map(s => ({
                id: s.id,
                type: s.is_top_set ? 'top' as const : s.is_backoff ? 'backoff' as const : 'normal' as const,
                targetSets: s.target_sets || 1,
                targetReps: s.target_reps || 8,
                targetWeight: s.target_weight ?? undefined,
                targetRIR: s.target_rir ?? undefined,
                percentage: s.load_percentage ?? undefined,
                restSeconds: s.rest_seconds ?? undefined,
              }));
              return {
                id: ex.id,
                name: ex.exercise_name,
                category: ex.category as 'compound' | 'accessory',
                muscleGroup: ex.muscle_group || '',
                sets: trainingSets,
              };
            });
            return {
              id: day.id,
              name: day.day_name,
              dayOfWeek: day.day_of_week || '',
              focus: day.focus || '',
              exercises: trainingExercises,
            };
          });
          return {
            id: week.id,
            weekNumber: week.week_number,
            days: trainingDays,
          };
        });
        return {
          id: block.id,
          name: block.name,
          goal: block.goal || '',
          weekRange: `Semanas ${block.start_week}-${block.end_week}`,
          weeks: trainingWeeks,
        };
      });

      const trainingProgram: TrainingProgram = {
        id: prog.id,
        name: prog.name,
        description: prog.description || '',
        durationWeeks: prog.duration_weeks || 12,
        daysPerWeek: prog.days_per_week || 5,
        blocks: trainingBlocks,
      };

      setProgramState(trainingProgram);
      setCurrentWeek(1);
      setCurrentDay(0);
      console.log(`Loaded active program: ${trainingProgram.name}, ${trainingBlocks.length} blocks`);
    } catch (err) {
      console.error('Error loading active program:', err);
    } finally {
      setProgramLoading(false);
    }
  }, [user?.id]);

  // Load data based on user
  useEffect(() => {
    if (!user?.email) return;
    
    if (isOwner) {
      const savedProfile = localStorage.getItem('pb_profile');
      const savedLogs = localStorage.getItem('pb_logs');
      setProfile(savedProfile ? JSON.parse(savedProfile) : getProfileForUser(user.email));
      setWorkoutLogs(savedLogs ? JSON.parse(savedLogs) : []);
    } else {
      const savedProfile = localStorage.getItem('pb_profile');
      const savedLogs = localStorage.getItem('pb_logs');
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        if (parsed.bodyWeight > 0 && parsed.email === user.email) {
          setProfile(parsed);
        } else {
          setProfile(defaultProfile);
          localStorage.removeItem('pb_profile');
        }
      }
      if (savedLogs) {
        setWorkoutLogs(JSON.parse(savedLogs));
      }
    }

    // Always try to load active program from DB
    loadActiveProgram();
  }, [user?.email, isOwner, loadActiveProgram]);

  useEffect(() => {
    if (user?.email) {
      localStorage.setItem('pb_profile', JSON.stringify({ ...profile, email: user.email }));
    }
  }, [profile, user?.email]);

  useEffect(() => {
    localStorage.setItem('pb_logs', JSON.stringify(workoutLogs));
  }, [workoutLogs]);

  const logWorkout = (log: WorkoutLog) => {
    setWorkoutLogs(prev => [...prev.filter(l => l.dayId !== log.dayId || l.date !== log.date), log]);
  };

  const updateProfile = (p: Partial<UserProfile>) => {
    setProfile(prev => ({ ...prev, ...p }));
  };

  return (
    <TrainingContext.Provider value={{
      profile, program, currentWeek, currentDay, workoutLogs, programLoading,
      setCurrentWeek, setCurrentDay, logWorkout, updateProfile, setProgram, loadActiveProgram,
    }}>
      {children}
    </TrainingContext.Provider>
  );
}

export const useTraining = () => {
  const ctx = useContext(TrainingContext);
  if (!ctx) throw new Error('useTraining must be used within TrainingProvider');
  return ctx;
};
