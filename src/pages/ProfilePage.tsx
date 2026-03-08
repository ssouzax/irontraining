import { motion } from 'framer-motion';
import { useTraining } from '@/contexts/TrainingContext';
import { calculate1RM } from '@/data/defaultProfile';
import { User, Target, Dumbbell } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function ProfilePage() {
  const { profile } = useTraining();
  const { user } = useAuth();

  const squat1RM = calculate1RM(profile.currentLifts.squat.weight, profile.currentLifts.squat.reps);
  const deadlift1RM = calculate1RM(profile.currentLifts.deadlift.weight, profile.currentLifts.deadlift.reps);
  const bench1RM = calculate1RM(profile.currentLifts.bench.weight, profile.currentLifts.bench.reps);

  return (
    <div className="space-y-6 max-w-2xl">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Perfil</h1>
        <p className="text-muted-foreground mt-1">Seus dados de treino</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-xl border border-border p-5 sm:p-6 card-elevated">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-foreground">{user?.email || profile.email}</p>
            <p className="text-sm text-muted-foreground">Peso Corporal: {profile.bodyWeight} kg</p>
          </div>
        </div>

        <div className="border-t border-border pt-4 space-y-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-primary" /> Cargas Atuais
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-secondary/40 text-center">
              <p className="text-xs text-muted-foreground">Agachamento</p>
              <p className="text-lg font-bold text-foreground">{profile.currentLifts.squat.weight}kg</p>
              <p className="text-xs text-muted-foreground">×{profile.currentLifts.squat.reps} (E1RM: {squat1RM})</p>
            </div>
            <div className="p-3 rounded-lg bg-secondary/40 text-center">
              <p className="text-xs text-muted-foreground">Terra</p>
              <p className="text-lg font-bold text-foreground">{profile.currentLifts.deadlift.weight}kg</p>
              <p className="text-xs text-muted-foreground">PR (E1RM: {deadlift1RM})</p>
            </div>
            <div className="p-3 rounded-lg bg-secondary/40 text-center">
              <p className="text-xs text-muted-foreground">Supino</p>
              <p className="text-lg font-bold text-foreground">{profile.currentLifts.bench.weight}kg</p>
              <p className="text-xs text-muted-foreground">×{profile.currentLifts.bench.reps} (E1RM: {bench1RM})</p>
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-4 mt-4 space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" /> Objetivos
          </h3>
          <p className="text-sm text-muted-foreground">{profile.goals}</p>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Agachamento → {profile.targetProgression.squat}</p>
            <p className="text-xs text-muted-foreground">Terra → {profile.targetProgression.deadlift}</p>
            <p className="text-xs text-muted-foreground">Supino → {profile.targetProgression.bench}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
