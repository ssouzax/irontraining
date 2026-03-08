import { motion } from 'framer-motion';
import { useTraining } from '@/contexts/TrainingContext';
import { calculate1RM } from '@/data/defaultProfile';
import { TrendingUp, Target, Dumbbell, Calendar, Activity, Zap } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const fadeIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};

function StatCard({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: string; sub?: string; color?: string }) {
  return (
    <motion.div {...fadeIn} className="bg-card rounded-xl border border-border p-5 card-elevated">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{label}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-primary/10`}>
          <Icon className="w-5 h-5 text-primary" />
        </div>
      </div>
    </motion.div>
  );
}

export default function Dashboard() {
  const { profile, program, currentWeek } = useTraining();

  const squat1RM = calculate1RM(profile.currentLifts.squat.weight, profile.currentLifts.squat.reps);
  const deadlift1RM = calculate1RM(profile.currentLifts.deadlift.weight, profile.currentLifts.deadlift.reps);
  const bench1RM = calculate1RM(profile.currentLifts.bench.weight, profile.currentLifts.bench.reps);

  const currentBlock = program.blocks.find(b => {
    const weeks = b.weeks.map(w => w.weekNumber);
    return weeks.includes(currentWeek);
  }) || program.blocks[0];

  const currentWeekData = currentBlock.weeks.find(w => w.weekNumber === currentWeek) || currentBlock.weeks[0];
  const todayIndex = new Date().getDay();
  const dayMap: Record<number, number> = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4 };
  const todayWorkout = currentWeekData.days[dayMap[todayIndex] ?? 0];

  // Mock progression data
  const progressData = [
    { week: 'W1', squat: squat1RM, deadlift: deadlift1RM, bench: bench1RM },
    { week: 'W2', squat: squat1RM + 2, deadlift: deadlift1RM + 1, bench: bench1RM + 1 },
    { week: 'W3', squat: squat1RM + 3, deadlift: deadlift1RM + 2, bench: bench1RM + 1.5 },
    { week: 'W4', squat: squat1RM + 5, deadlift: deadlift1RM + 3, bench: bench1RM + 2 },
  ];

  const volumeData = [
    { day: 'Mon', sets: 22 }, { day: 'Tue', sets: 19 }, { day: 'Wed', sets: 20 },
    { day: 'Thu', sets: 20 }, { day: 'Fri', sets: 16 },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div {...fadeIn}>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Week {currentWeek} · {currentBlock.name}
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={TrendingUp} label="Est. Squat 1RM" value={`${squat1RM} kg`} sub={`Target: ${profile.targetProgression.squat}`} />
        <StatCard icon={Target} label="Est. Deadlift 1RM" value={`${deadlift1RM} kg`} sub={`Target: ${profile.targetProgression.deadlift}`} />
        <StatCard icon={Dumbbell} label="Est. Bench 1RM" value={`${bench1RM} kg`} sub={`Target: ${profile.targetProgression.bench}`} />
        <StatCard icon={Activity} label="Body Weight" value={`${profile.bodyWeight} kg`} sub="Current" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1RM Progress */}
        <motion.div {...fadeIn} className="bg-card rounded-xl border border-border p-6 card-elevated">
          <h3 className="text-sm font-semibold text-foreground mb-4">Estimated 1RM Progress</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={progressData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--foreground))',
                }}
              />
              <Line type="monotone" dataKey="squat" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={{ r: 4 }} name="Squat" />
              <Line type="monotone" dataKey="deadlift" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={{ r: 4 }} name="Deadlift" />
              <Line type="monotone" dataKey="bench" stroke="hsl(var(--chart-3))" strokeWidth={2} dot={{ r: 4 }} name="Bench" />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Weekly Volume */}
        <motion.div {...fadeIn} className="bg-card rounded-xl border border-border p-6 card-elevated">
          <h3 className="text-sm font-semibold text-foreground mb-4">Weekly Volume (Sets)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={volumeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--foreground))',
                }}
              />
              <Area type="monotone" dataKey="sets" stroke="hsl(var(--chart-4))" fill="hsl(var(--chart-4) / 0.2)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Today's Workout */}
      {todayWorkout && (
        <motion.div {...fadeIn} className="bg-card rounded-xl border border-border p-6 card-elevated">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Today's Workout</h3>
              <p className="text-xs text-muted-foreground">{todayWorkout.name} — {todayWorkout.focus}</p>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">{todayWorkout.exercises.length} exercises</span>
            </div>
          </div>
          <div className="space-y-2">
            {todayWorkout.exercises.map(ex => (
              <div key={ex.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-secondary/50">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${ex.category === 'compound' ? 'bg-primary' : 'bg-muted-foreground'}`} />
                  <span className="text-sm text-foreground">{ex.name}</span>
                </div>
                <span className="text-xs text-muted-foreground font-mono">
                  {ex.sets.map(s => `${s.targetSets}×${s.targetReps}`).join(' + ')}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Program Overview */}
      <motion.div {...fadeIn} className="bg-card rounded-xl border border-border p-6 card-elevated">
        <h3 className="text-sm font-semibold text-foreground mb-4">Program Blocks</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {program.blocks.map((block, i) => (
            <div
              key={block.id}
              className={`p-4 rounded-lg border transition-all ${
                block === currentBlock
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-secondary/30'
              }`}
            >
              <p className="text-xs text-muted-foreground">{block.weekRange}</p>
              <p className="text-sm font-medium text-foreground mt-1">{block.name}</p>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{block.goal}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
