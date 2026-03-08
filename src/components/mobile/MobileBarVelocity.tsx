import { useState } from 'react';
import { Gauge, Zap, Timer, TrendingUp, Plus, BarChart3, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const VELOCITY_ZONES = [
  { label: 'Força Máxima', range: '< 0.35 m/s', color: 'bg-red-500', min: 0, max: 0.35 },
  { label: 'Força-Velocidade', range: '0.35–0.60 m/s', color: 'bg-orange-500', min: 0.35, max: 0.6 },
  { label: 'Potência', range: '0.60–0.85 m/s', color: 'bg-yellow-500', min: 0.6, max: 0.85 },
  { label: 'Velocidade-Força', range: '0.85–1.10 m/s', color: 'bg-green-500', min: 0.85, max: 1.1 },
  { label: 'Velocidade', range: '> 1.10 m/s', color: 'bg-blue-500', min: 1.1, max: 2.0 },
];

function getVelocityZone(v: number) {
  return VELOCITY_ZONES.find(z => v >= z.min && v < z.max) || VELOCITY_ZONES[0];
}

function estimateRIR(velocity: number): number {
  if (velocity >= 0.8) return 4;
  if (velocity >= 0.6) return 3;
  if (velocity >= 0.45) return 2;
  if (velocity >= 0.3) return 1;
  return 0;
}

interface SetEntry {
  setNum: number;
  weight: number;
  reps: number;
  velocity: number;
  peakVelocity: number;
  tut: number;
  rom: number;
}

export function MobileBarVelocity() {
  const { user } = useAuth();
  const [exercise, setExercise] = useState('Supino Reto');
  const [sets, setSets] = useState<SetEntry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ weight: '', reps: '1', velocity: '', peakVelocity: '', tut: '', rom: '100' });

  const exercises = ['Supino Reto', 'Agachamento', 'Levantamento Terra', 'Desenvolvimento', 'Remada Curvada'];

  const addSet = async () => {
    const entry: SetEntry = {
      setNum: sets.length + 1,
      weight: Number(form.weight) || 0,
      reps: Number(form.reps) || 1,
      velocity: Number(form.velocity) || 0,
      peakVelocity: Number(form.peakVelocity) || 0,
      tut: Number(form.tut) || 0,
      rom: Number(form.rom) || 100,
    };
    setSets(prev => [...prev, entry]);
    setShowForm(false);
    setForm({ weight: '', reps: '1', velocity: '', peakVelocity: '', tut: '', rom: '100' });

    if (user) {
      const power = entry.velocity * entry.weight * 9.81;
      await supabase.from('bar_velocity_logs').insert({
        user_id: user.id,
        exercise_name: exercise,
        set_number: entry.setNum,
        weight: entry.weight,
        reps: entry.reps,
        mean_velocity: entry.velocity,
        peak_velocity: entry.peakVelocity,
        power_output: Math.round(power),
        time_under_tension: entry.tut,
        rom_percentage: entry.rom,
        estimated_rir: estimateRIR(entry.velocity),
      });
      toast.success(`Série ${entry.setNum} registrada`);
    }
  };

  const avgVelocity = sets.length ? sets.reduce((a, s) => a + s.velocity, 0) / sets.length : 0;
  const avgPower = sets.length ? sets.reduce((a, s) => a + s.velocity * s.weight * 9.81, 0) / sets.length : 0;
  const avgTut = sets.length ? sets.reduce((a, s) => a + s.tut, 0) / sets.length : 0;
  const velocityDrop = sets.length >= 2 ? ((sets[0].velocity - sets[sets.length - 1].velocity) / sets[0].velocity * 100) : 0;

  const chartData = sets.map(s => ({
    name: `S${s.setNum}`,
    velocity: s.velocity,
    peak: s.peakVelocity,
    power: Math.round(s.velocity * s.weight * 9.81),
    tut: s.tut,
    rir: estimateRIR(s.velocity),
  }));

  const radarData = sets.length ? [
    { metric: 'Velocidade', value: Math.min(100, avgVelocity * 100) },
    { metric: 'Potência', value: Math.min(100, avgPower / 20) },
    { metric: 'TUT', value: Math.min(100, avgTut * 2) },
    { metric: 'ROM', value: sets.reduce((a, s) => a + s.rom, 0) / sets.length },
    { metric: 'Consistência', value: Math.max(0, 100 - velocityDrop * 2) },
  ] : [];

  return (
    <div className="px-4 pt-3 pb-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
          <Gauge className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">Velocidade & Potência</h2>
          <p className="text-xs text-muted-foreground">Análise de performance da barra</p>
        </div>
      </div>

      {/* Exercise selector */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
        {exercises.map(e => (
          <button
            key={e}
            onClick={() => { setExercise(e); setSets([]); }}
            className={cn(
              "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border",
              exercise === e ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border"
            )}
          >
            {e}
          </button>
        ))}
      </div>

      {/* Stats overview */}
      {sets.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Vel. Média', value: `${avgVelocity.toFixed(2)}`, unit: 'm/s', icon: Gauge, color: 'text-orange-400' },
            { label: 'Potência', value: `${Math.round(avgPower)}`, unit: 'W', icon: Zap, color: 'text-yellow-400' },
            { label: 'TUT Médio', value: `${avgTut.toFixed(1)}`, unit: 's', icon: Timer, color: 'text-blue-400' },
            { label: 'Queda Vel.', value: `${velocityDrop.toFixed(0)}`, unit: '%', icon: TrendingUp, color: 'text-red-400' },
          ].map(stat => (
            <div key={stat.label} className="bg-card rounded-xl border border-border p-2.5 text-center">
              <stat.icon className={cn("w-4 h-4 mx-auto mb-1", stat.color)} />
              <p className="text-sm font-bold text-foreground">{stat.value}<span className="text-[9px] text-muted-foreground ml-0.5">{stat.unit}</span></p>
              <p className="text-[9px] text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Velocity zone indicator */}
      {sets.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Zona de Velocidade</p>
          <div className="flex gap-1 mb-2">
            {VELOCITY_ZONES.map(z => {
              const active = avgVelocity >= z.min && avgVelocity < z.max;
              return (
                <div key={z.label} className="flex-1 text-center">
                  <div className={cn("h-2 rounded-full mb-1", z.color, active ? 'opacity-100 ring-2 ring-white/30' : 'opacity-30')} />
                  <p className={cn("text-[8px]", active ? 'text-foreground font-bold' : 'text-muted-foreground')}>{z.label}</p>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-center text-muted-foreground">
            RIR Estimado: <span className="font-bold text-foreground">{estimateRIR(avgVelocity)}</span>
          </p>
        </div>
      )}

      {/* Charts */}
      {sets.length >= 2 && (
        <div className="space-y-3">
          <div className="bg-card rounded-xl border border-border p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Velocidade por Série</p>
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="velGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(250, 80%, 65%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(250, 80%, 65%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(230, 12%, 18%)" />
                <XAxis dataKey="name" tick={{ fill: 'hsl(215, 15%, 50%)', fontSize: 10 }} />
                <YAxis tick={{ fill: 'hsl(215, 15%, 50%)', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: 'hsl(230, 15%, 11%)', border: '1px solid hsl(230, 12%, 18%)', borderRadius: 8, fontSize: 11 }} />
                <Area type="monotone" dataKey="velocity" stroke="hsl(250, 80%, 65%)" fill="url(#velGrad)" strokeWidth={2} dot={{ r: 4, fill: 'hsl(250, 80%, 65%)' }} />
                <Area type="monotone" dataKey="peak" stroke="hsl(38, 92%, 55%)" fill="transparent" strokeWidth={1.5} strokeDasharray="4 4" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card rounded-xl border border-border p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Potência & RIR</p>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(230, 12%, 18%)" />
                <XAxis dataKey="name" tick={{ fill: 'hsl(215, 15%, 50%)', fontSize: 10 }} />
                <YAxis tick={{ fill: 'hsl(215, 15%, 50%)', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: 'hsl(230, 15%, 11%)', border: '1px solid hsl(230, 12%, 18%)', borderRadius: 8, fontSize: 11 }} />
                <Bar dataKey="power" fill="hsl(38, 92%, 55%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Radar */}
          <div className="bg-card rounded-xl border border-border p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Radar de Performance</p>
            <ResponsiveContainer width="100%" height={180}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="hsl(230, 12%, 18%)" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: 'hsl(215, 15%, 50%)', fontSize: 9 }} />
                <Radar dataKey="value" stroke="hsl(250, 80%, 65%)" fill="hsl(250, 80%, 65%)" fillOpacity={0.2} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Set log */}
      {sets.length > 0 && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="p-3 border-b border-border">
            <p className="text-xs font-bold text-foreground">Séries Registradas</p>
          </div>
          <div className="divide-y divide-border">
            {sets.map(s => {
              const zone = getVelocityZone(s.velocity);
              const power = Math.round(s.velocity * s.weight * 9.81);
              return (
                <div key={s.setNum} className="flex items-center gap-3 px-3 py-2.5">
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white", zone.color)}>
                    S{s.setNum}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground">{s.weight}kg × {s.reps}rep</p>
                    <p className="text-[10px] text-muted-foreground">{zone.label}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-foreground">{s.velocity} m/s</p>
                    <p className="text-[10px] text-muted-foreground">{power}W · {s.tut}s</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add set form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-card rounded-xl border border-border p-4 space-y-3"
          >
            <p className="text-sm font-bold text-foreground">Nova Série</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'weight', label: 'Peso (kg)', placeholder: '100' },
                { key: 'reps', label: 'Reps', placeholder: '1' },
                { key: 'velocity', label: 'Vel. Média (m/s)', placeholder: '0.55' },
                { key: 'peakVelocity', label: 'Vel. Pico (m/s)', placeholder: '0.75' },
                { key: 'tut', label: 'TUT (seg)', placeholder: '3.2' },
                { key: 'rom', label: 'ROM (%)', placeholder: '100' },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-[10px] text-muted-foreground font-medium">{f.label}</label>
                  <input
                    type="number"
                    step="any"
                    placeholder={f.placeholder}
                    value={form[f.key as keyof typeof form]}
                    onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    className="w-full mt-0.5 px-2.5 py-1.5 bg-muted rounded-lg text-sm text-foreground border border-border focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2 rounded-lg bg-muted text-sm font-medium text-muted-foreground">Cancelar</button>
              <button onClick={addSet} className="flex-1 py-2 rounded-lg bg-primary text-sm font-bold text-primary-foreground">Salvar</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm"
        >
          <Plus className="w-4 h-4" />
          Registrar Série
        </button>
      )}

      {/* Empty state */}
      {sets.length === 0 && !showForm && (
        <div className="text-center py-8">
          <Gauge className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">Registre séries para ver análise de velocidade e potência</p>
          <p className="text-[10px] text-muted-foreground/60 mt-1">Use dados do seu sensor de barra ou insira manualmente</p>
        </div>
      )}
    </div>
  );
}
