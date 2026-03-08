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
    week: `S${i + 1}`,
    agachamento: Math.round(squat1RM + (i * 2.5) + Math.random() * 3),
    terra: Math.round(deadlift1RM + (i * 2) + Math.random() * 2),
    supino: Math.round(bench1RM + (i * 1.2) + Math.random() * 2),
  }));

  const volumeByGroup = [
    { grupo: 'Peito', series: 16 }, { grupo: 'Costas', series: 18 }, { grupo: 'Quadríceps', series: 20 },
    { grupo: 'Posteriores', series: 12 }, { grupo: 'Ombros', series: 10 }, { grupo: 'Braços', series: 12 },
    { grupo: 'Core', series: 6 },
  ];

  const radarData = [
    { lift: 'Agachamento', value: (squat1RM / 200) * 100 },
    { lift: 'Terra', value: (deadlift1RM / 220) * 100 },
    { lift: 'Supino', value: (bench1RM / 140) * 100 },
    { lift: 'Desenvolvimento', value: 55 },
    { lift: 'Remada', value: 62 },
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
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Análises</h1>
        <p className="text-muted-foreground mt-1">Acompanhe sua progressão de força e volume</p>
      </motion.div>

      {/* PR Cards */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {[
          { name: 'Agachamento', value: squat1RM, target: profile.targetProgression.squat },
          { name: 'Terra', value: deadlift1RM, target: profile.targetProgression.deadlift },
          { name: 'Supino', value: bench1RM, target: profile.targetProgression.bench },
        ].map(lift => (
          <motion.div key={lift.name} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl border border-border p-3 sm:p-5 card-elevated text-center">
            <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">{lift.name} E1RM</p>
            <p className="text-xl sm:text-3xl font-bold text-foreground">{lift.value}<span className="text-sm sm:text-lg text-muted-foreground ml-1">kg</span></p>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Meta: {lift.target}</p>
          </motion.div>
        ))}
      </div>

      {/* E1RM Over Time */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-xl border border-border p-4 sm:p-6 card-elevated">
        <h3 className="text-sm font-semibold text-foreground mb-4">Progressão E1RM</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={e1rmHistory}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={11} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey="agachamento" stroke="hsl(var(--chart-1))" strokeWidth={2} name="Agachamento" />
            <Line type="monotone" dataKey="terra" stroke="hsl(var(--chart-2))" strokeWidth={2} name="Terra" />
            <Line type="monotone" dataKey="supino" stroke="hsl(var(--chart-3))" strokeWidth={2} name="Supino" />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Volume by Muscle Group */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl border border-border p-4 sm:p-6 card-elevated">
          <h3 className="text-sm font-semibold text-foreground mb-4">Volume Semanal por Grupo Muscular</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={volumeByGroup}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="grupo" stroke="hsl(var(--muted-foreground))" fontSize={10} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="series" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} name="Séries" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Strength Radar */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl border border-border p-4 sm:p-6 card-elevated">
          <h3 className="text-sm font-semibold text-foreground mb-4">Equilíbrio de Força</h3>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis dataKey="lift" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <Radar dataKey="value" stroke="hsl(var(--chart-1))" fill="hsl(var(--chart-1) / 0.2)" strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  );
}
