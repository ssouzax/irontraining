import { motion } from 'framer-motion';
import { useTraining } from '@/contexts/TrainingContext';
import { calculate1RM } from '@/data/defaultProfile';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts';

export default function AnalyticsPage() {
  const { profile } = useTraining();

  const squat1RM = calculate1RM(profile.currentLifts.squat.weight, profile.currentLifts.squat.reps);
  const deadlift1RM = calculate1RM(profile.currentLifts.deadlift.weight, profile.currentLifts.deadlift.reps);
  const bench1RM = calculate1RM(profile.currentLifts.bench.weight, profile.currentLifts.bench.reps);

  const e1rmHistory = Array.from({ length: 12 }, (_, i) => ({
    week: `W${i + 1}`,
    squat: Math.round(squat1RM + (i * 2.5) + Math.random() * 3),
    deadlift: Math.round(deadlift1RM + (i * 2) + Math.random() * 2),
    bench: Math.round(bench1RM + (i * 1.2) + Math.random() * 2),
  }));

  const volumeByGroup = [
    { group: 'Chest', sets: 16 }, { group: 'Back', sets: 18 }, { group: 'Quads', sets: 20 },
    { group: 'Hams', sets: 12 }, { group: 'Shoulders', sets: 10 }, { group: 'Arms', sets: 12 },
    { group: 'Core', sets: 6 },
  ];

  const radarData = [
    { lift: 'Squat', value: (squat1RM / 200) * 100 },
    { lift: 'Deadlift', value: (deadlift1RM / 220) * 100 },
    { lift: 'Bench', value: (bench1RM / 140) * 100 },
    { lift: 'OHP', value: 55 },
    { lift: 'Row', value: 62 },
  ];

  const tooltipStyle = {
    background: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '8px',
    color: 'hsl(var(--foreground))',
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Analytics</h1>
        <p className="text-muted-foreground mt-1">Track your strength and volume progress</p>
      </motion.div>

      {/* PR Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { name: 'Squat', value: squat1RM, target: profile.targetProgression.squat, color: 'var(--chart-1)' },
          { name: 'Deadlift', value: deadlift1RM, target: profile.targetProgression.deadlift, color: 'var(--chart-2)' },
          { name: 'Bench', value: bench1RM, target: profile.targetProgression.bench, color: 'var(--chart-3)' },
        ].map(lift => (
          <motion.div key={lift.name} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl border border-border p-5 card-elevated text-center">
            <p className="text-xs text-muted-foreground mb-1">{lift.name} E1RM</p>
            <p className="text-3xl font-bold text-foreground">{lift.value}<span className="text-lg text-muted-foreground ml-1">kg</span></p>
            <p className="text-xs text-muted-foreground mt-1">Target: {lift.target}</p>
          </motion.div>
        ))}
      </div>

      {/* E1RM Over Time */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-xl border border-border p-6 card-elevated">
        <h3 className="text-sm font-semibold text-foreground mb-4">Estimated 1RM Progression</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={e1rmHistory}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey="squat" stroke="hsl(var(--chart-1))" strokeWidth={2} name="Squat" />
            <Line type="monotone" dataKey="deadlift" stroke="hsl(var(--chart-2))" strokeWidth={2} name="Deadlift" />
            <Line type="monotone" dataKey="bench" stroke="hsl(var(--chart-3))" strokeWidth={2} name="Bench" />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Volume by Muscle Group */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl border border-border p-6 card-elevated">
          <h3 className="text-sm font-semibold text-foreground mb-4">Weekly Volume by Muscle Group</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={volumeByGroup}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="group" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="sets" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Strength Radar */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl border border-border p-6 card-elevated">
          <h3 className="text-sm font-semibold text-foreground mb-4">Strength Balance</h3>
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis dataKey="lift" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Radar dataKey="value" stroke="hsl(var(--chart-1))" fill="hsl(var(--chart-1) / 0.2)" strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  );
}
