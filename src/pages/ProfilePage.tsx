import { motion } from 'framer-motion';
import { useTraining } from '@/contexts/TrainingContext';
import { calculate1RM } from '@/data/defaultProfile';
import { User, Target, Dumbbell } from 'lucide-react';

export default function ProfilePage() {
  const { profile } = useTraining();

  const squat1RM = calculate1RM(profile.currentLifts.squat.weight, profile.currentLifts.squat.reps);
  const deadlift1RM = calculate1RM(profile.currentLifts.deadlift.weight, profile.currentLifts.deadlift.reps);
  const bench1RM = calculate1RM(profile.currentLifts.bench.weight, profile.currentLifts.bench.reps);

  return (
    <div className="space-y-6 max-w-2xl">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Profile</h1>
        <p className="text-muted-foreground mt-1">Your training data</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-xl border border-border p-6 card-elevated">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-8 h-8 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-foreground">{profile.email}</p>
            <p className="text-sm text-muted-foreground">Body Weight: {profile.bodyWeight} kg</p>
          </div>
        </div>

        <div className="border-t border-border pt-4 space-y-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-primary" /> Current Lifts
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-secondary/40 text-center">
              <p className="text-xs text-muted-foreground">Squat</p>
              <p className="text-lg font-bold text-foreground">{profile.currentLifts.squat.weight}kg</p>
              <p className="text-xs text-muted-foreground">×{profile.currentLifts.squat.reps} (E1RM: {squat1RM})</p>
            </div>
            <div className="p-3 rounded-lg bg-secondary/40 text-center">
              <p className="text-xs text-muted-foreground">Deadlift</p>
              <p className="text-lg font-bold text-foreground">{profile.currentLifts.deadlift.weight}kg</p>
              <p className="text-xs text-muted-foreground">PR (E1RM: {deadlift1RM})</p>
            </div>
            <div className="p-3 rounded-lg bg-secondary/40 text-center">
              <p className="text-xs text-muted-foreground">Bench</p>
              <p className="text-lg font-bold text-foreground">{profile.currentLifts.bench.weight}kg</p>
              <p className="text-xs text-muted-foreground">×{profile.currentLifts.bench.reps} (E1RM: {bench1RM})</p>
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-4 mt-4 space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" /> Goals
          </h3>
          <p className="text-sm text-muted-foreground">{profile.goals}</p>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Squat → {profile.targetProgression.squat}</p>
            <p className="text-xs text-muted-foreground">Deadlift → {profile.targetProgression.deadlift}</p>
            <p className="text-xs text-muted-foreground">Bench → {profile.targetProgression.bench}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
