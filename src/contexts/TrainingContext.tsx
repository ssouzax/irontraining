import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { TrainingProgram, UserProfile, WorkoutLog, LoggedSet } from '@/types/training';
import { defaultProfile, getProfileForUser, emptyProgram, getProgramForUser } from '@/data/defaultProfile';
import { useAuth } from '@/contexts/AuthContext';

interface TrainingState {
  profile: UserProfile;
  program: TrainingProgram;
  currentWeek: number;
  currentDay: number;
  workoutLogs: WorkoutLog[];
  setCurrentWeek: (w: number) => void;
  setCurrentDay: (d: number) => void;
  logWorkout: (log: WorkoutLog) => void;
  updateProfile: (p: Partial<UserProfile>) => void;
}

const TrainingContext = createContext<TrainingState | null>(null);

export function TrainingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  
  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('pb_profile');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.bodyWeight > 0) return parsed;
    }
    return defaultProfile;
  });
  const [program, setProgram] = useState<TrainingProgram>(emptyProgram);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [currentDay, setCurrentDay] = useState(0);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>(() => {
    const saved = localStorage.getItem('pb_logs');
    return saved ? JSON.parse(saved) : [];
  });

  // Initialize profile and program based on user email
  useEffect(() => {
    if (user?.email) {
      const saved = localStorage.getItem('pb_profile');
      if (!saved || JSON.parse(saved).bodyWeight === 0) {
        setProfile(getProfileForUser(user.email));
      }
      setProgram(getProgramForUser(user.email));
    }
  }, [user?.email]);

  useEffect(() => {
    localStorage.setItem('pb_profile', JSON.stringify(profile));
  }, [profile]);

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
      profile, program, currentWeek, currentDay, workoutLogs,
      setCurrentWeek, setCurrentDay, logWorkout, updateProfile,
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
