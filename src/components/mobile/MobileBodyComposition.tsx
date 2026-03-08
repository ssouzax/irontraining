import { useState, useEffect } from 'react';
import { Scale, TrendingUp, TrendingDown, Plus, Loader2, Activity, Droplets, Flame, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

interface WeightLog {
  id: string;
  weight_kg: number;
  body_fat_pct: number | null;
  logged_at: string;
  notes: string | null;
}

type TimeRange = '7d' | '30d' | '90d' | '1y';

export function MobileBodyComposition() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<WeightLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [weight, setWeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [range, setRange] = useState<TimeRange>('30d');

  useEffect(() => { if (user) loadLogs(); }, [user, range]);

  const loadLogs = async () => {
    if (!user) return;
    const days = range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 365;
    const since = new Date();
    since.setDate(since.getDate() - days);
    
    const { data } = await supabase
      .from('body_weight_logs')
      .select('*')
      .eq('user_id', user.id)
      .gte('logged_at', since.toISOString().split('T')[0])
      .order('logged_at', { ascending: true });
    
    setLogs((data as WeightLog[]) || []);
    setLoading(false);
  };

  const saveLog = async () => {
    if (!user || !weight) return;
    setSaving(true);
    const { error } = await supabase.from('body_weight_logs').upsert({
      user_id: user.id,
      weight_kg: parseFloat(weight),
      body_fat_pct: bodyFat ? parseFloat(bodyFat) : null,
      notes: notes || null,
      logged_at: new Date().toISOString().split('T')[0],
    }, { onConflict: 'user_id,logged_at' });
    
    if (error) toast.error('Erro ao salvar');
    else {
      toast.success('Peso registrado!');
      setShowForm(false);
      setWeight('');
      setBodyFat('');
      setNotes('');
      loadLogs();
    }
    setSaving(false);
  };

  const currentWeight = logs.length > 0 ? logs[logs.length - 1].weight_kg : null;
  const previousWeight = logs.length > 1 ? logs[logs.length - 2].weight_kg : null;
  const weightDiff = currentWeight && previousWeight ? currentWeight - previousWeight : null;
  const firstWeight = logs.length > 0 ? logs[0].weight_kg : null;
  const totalChange = currentWeight && firstWeight ? currentWeight - firstWeight : null;

  // Estimations
  const height = 1.75; // Default, could be profile-based
  const bmi = currentWeight ? currentWeight / (height * height) : null;
  const currentBF = logs.length > 0 ? logs[logs.length - 1].body_fat_pct : null;
  const leanMass = currentWeight && currentBF ? currentWeight * (1 - currentBF / 100) : null;
  const fatMass = currentWeight && currentBF ? currentWeight * (currentBF / 100) : null;
  // Mifflin-St Jeor for males
  const bmr = currentWeight ? 10 * currentWeight + 6.25 * (height * 100) - 5 * 25 + 5 : null;
  const tdee = bmr ? Math.round(bmr * 1.55) : null;

  const chartData = logs.map(l => ({
    date: new Date(l.logged_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
    peso: l.weight_kg,
    bf: l.body_fat_pct,
  }));

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="p-4 space-y-5">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Scale className="w-5 h-5 text-primary" /> Evolução Corporal
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">Acompanhe peso, BF e composição</p>
          </div>
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-medium">
            <Plus className="w-4 h-4" /> Registrar
          </button>
        </div>
      </motion.div>

      {/* Quick Entry Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden">
            <div className="p-4 rounded-2xl bg-card border border-border space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground font-medium">Peso (kg)</label>
                  <input type="number" step="0.1" value={weight} onChange={e => setWeight(e.target.value)}
                    className="w-full mt-1 px-3 py-2.5 rounded-xl bg-secondary border border-border text-sm text-foreground"
                    placeholder="Ex: 85.5" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground font-medium">BF % (opcional)</label>
                  <input type="number" step="0.1" value={bodyFat} onChange={e => setBodyFat(e.target.value)}
                    className="w-full mt-1 px-3 py-2.5 rounded-xl bg-secondary border border-border text-sm text-foreground"
                    placeholder="Ex: 15.0" />
                </div>
              </div>
              <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-secondary border border-border text-sm text-foreground"
                placeholder="Notas (opcional)" />
              <button onClick={saveLog} disabled={saving || !weight}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Salvar'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Cards */}
      {currentWeight && (
        <div className="grid grid-cols-2 gap-3">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="p-4 rounded-2xl bg-card border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Scale className="w-4 h-4 text-primary" />
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Peso Atual</span>
            </div>
            <p className="text-3xl font-extrabold text-foreground">{currentWeight}<span className="text-sm font-medium text-muted-foreground ml-1">kg</span></p>
            {weightDiff !== null && (
              <div className={cn("flex items-center gap-1 mt-1", weightDiff > 0 ? "text-orange-400" : "text-emerald-400")}>
                {weightDiff > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                <span className="text-xs font-semibold">{weightDiff > 0 ? '+' : ''}{weightDiff.toFixed(1)}kg</span>
              </div>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.05 }}
            className="p-4 rounded-2xl bg-card border border-border">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 text-accent" />
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">IMC</span>
            </div>
            <p className="text-3xl font-extrabold text-foreground">{bmi?.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {bmi && bmi < 18.5 ? 'Abaixo' : bmi && bmi < 25 ? 'Normal' : bmi && bmi < 30 ? 'Sobrepeso' : 'Obesidade'}
            </p>
          </motion.div>

          {currentBF && (
            <>
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
                className="p-4 rounded-2xl bg-card border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Droplets className="w-4 h-4 text-blue-400" />
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Massa Magra</span>
                </div>
                <p className="text-2xl font-extrabold text-foreground">{leanMass?.toFixed(1)}<span className="text-sm font-medium text-muted-foreground ml-1">kg</span></p>
                <p className="text-xs text-muted-foreground mt-1">BF: {currentBF}%</p>
              </motion.div>

              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }}
                className="p-4 rounded-2xl bg-card border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Flame className="w-4 h-4 text-orange-400" />
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">TDEE Est.</span>
                </div>
                <p className="text-2xl font-extrabold text-foreground">{tdee}<span className="text-sm font-medium text-muted-foreground ml-1">kcal</span></p>
                <p className="text-xs text-muted-foreground mt-1">Atividade moderada</p>
              </motion.div>
            </>
          )}
        </div>
      )}

      {/* Time Range Selector */}
      <div className="flex gap-1.5">
        {(['7d', '30d', '90d', '1y'] as TimeRange[]).map(r => (
          <button key={r} onClick={() => setRange(r)}
            className={cn("flex-1 py-2 rounded-xl text-xs font-semibold transition-colors",
              range === r ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
            )}>
            {r === '7d' ? '7 dias' : r === '30d' ? '30 dias' : r === '90d' ? '3 meses' : '1 ano'}
          </button>
        ))}
      </div>

      {/* Weight Chart */}
      {chartData.length > 1 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="p-4 rounded-2xl bg-card border border-border">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Evolução do Peso</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 12 }} />
              <Area type="monotone" dataKey="peso" stroke="hsl(var(--primary))" fill="url(#weightGrad)" strokeWidth={2} dot={{ r: 3, fill: 'hsl(var(--primary))' }} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* BF Chart */}
      {chartData.some(d => d.bf) && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="p-4 rounded-2xl bg-card border border-border">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Body Fat %</p>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={chartData.filter(d => d.bf)}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 12 }} />
              <Line type="monotone" dataKey="bf" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3, fill: '#f59e0b' }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Period Summary */}
      {totalChange !== null && logs.length > 1 && (
        <div className="p-4 rounded-2xl bg-card border border-border">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Resumo do Período</p>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className={cn("text-lg font-extrabold", totalChange > 0 ? "text-orange-400" : "text-emerald-400")}>
                {totalChange > 0 ? '+' : ''}{totalChange.toFixed(1)}kg
              </p>
              <p className="text-[10px] text-muted-foreground">Variação</p>
            </div>
            <div>
              <p className="text-lg font-extrabold text-foreground">{Math.min(...logs.map(l => l.weight_kg)).toFixed(1)}kg</p>
              <p className="text-[10px] text-muted-foreground">Mínimo</p>
            </div>
            <div>
              <p className="text-lg font-extrabold text-foreground">{Math.max(...logs.map(l => l.weight_kg)).toFixed(1)}kg</p>
              <p className="text-[10px] text-muted-foreground">Máximo</p>
            </div>
          </div>
        </div>
      )}

      {logs.length === 0 && !showForm && (
        <div className="text-center py-12">
          <Scale className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">Nenhum registro ainda.</p>
          <p className="text-muted-foreground text-xs mt-1">Toque em "Registrar" para começar</p>
        </div>
      )}
    </div>
  );
}
