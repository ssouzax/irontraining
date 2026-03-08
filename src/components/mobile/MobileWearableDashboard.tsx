import { useState, useEffect } from 'react';
import { Heart, Activity, Flame, Moon, Brain, TrendingUp, Plus, AlertTriangle, CheckCircle, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar } from 'recharts';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

function calculateFatigueScore(hr: number, hrv: number, sleep: number, restingHr: number): number {
  const hrFactor = Math.min(1, hr / 180) * 30;
  const hrvFactor = Math.max(0, 1 - hrv / 80) * 25;
  const sleepFactor = Math.max(0, 1 - sleep / 8) * 25;
  const restFactor = Math.min(1, restingHr / 75) * 20;
  return Math.round(hrFactor + hrvFactor + sleepFactor + restFactor);
}

function calculateReadiness(fatigue: number, sleep: number, hrv: number): number {
  const base = 100 - fatigue;
  const sleepBonus = Math.min(15, (sleep / 8) * 15);
  const hrvBonus = Math.min(15, (hrv / 70) * 15);
  return Math.round(Math.min(100, Math.max(0, base + sleepBonus + hrvBonus)));
}

function getRecommendation(readiness: number): { text: string; color: string; icon: typeof CheckCircle } {
  if (readiness >= 80) return { text: 'Dia perfeito para PR! Treine pesado.', color: 'text-green-400', icon: CheckCircle };
  if (readiness >= 60) return { text: 'Treino normal. Siga o programa.', color: 'text-yellow-400', icon: Activity };
  if (readiness >= 40) return { text: 'Reduza 10-15% da carga hoje.', color: 'text-orange-400', icon: AlertTriangle };
  return { text: 'Recuperação ativa ou descanso recomendado.', color: 'text-red-400', icon: AlertTriangle };
}

export function MobileWearableDashboard() {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [form, setForm] = useState({
    heart_rate: '', hrv: '', calories: '', spo2: '', sleep: '', resting_hr: '',
  });

  useEffect(() => {
    if (user) loadLogs();
  }, [user]);

  const loadLogs = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('wearable_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('logged_at', { ascending: false })
      .limit(30);
    if (data) setLogs(data);
  };

  const submitLog = async () => {
    if (!user) return;
    const hr = Number(form.heart_rate) || 70;
    const hrv = Number(form.hrv) || 50;
    const sleep = Number(form.sleep) || 7;
    const restHr = Number(form.resting_hr) || 60;
    const fatigue = calculateFatigueScore(hr, hrv, sleep, restHr);
    const readiness = calculateReadiness(fatigue, sleep, hrv);

    await supabase.from('wearable_logs').insert({
      user_id: user.id,
      heart_rate: hr,
      hrv: hrv,
      calories_burned: Number(form.calories) || 0,
      spo2: Number(form.spo2) || 98,
      sleep_hours: sleep,
      resting_hr: restHr,
      fatigue_score: fatigue,
      readiness_score: readiness,
    });

    toast.success('Dados registrados!');
    setShowForm(false);
    setForm({ heart_rate: '', hrv: '', calories: '', spo2: '', sleep: '', resting_hr: '' });
    loadLogs();
  };

  const latest = logs[0];
  const readiness = latest ? calculateReadiness(latest.fatigue_score, latest.sleep_hours || 7, latest.hrv || 50) : 0;
  const recommendation = getRecommendation(readiness);

  const chartData = [...logs].reverse().slice(-14).map((l, i) => ({
    day: `D${i + 1}`,
    hr: l.heart_rate,
    hrv: l.hrv,
    fatigue: l.fatigue_score,
    readiness: l.readiness_score,
    sleep: l.sleep_hours,
  }));

  const radialData = latest ? [{ name: 'Readiness', value: readiness, fill: readiness >= 70 ? 'hsl(145, 65%, 45%)' : readiness >= 50 ? 'hsl(38, 92%, 55%)' : 'hsl(0, 72%, 55%)' }] : [];

  return (
    <div className="px-4 pt-3 pb-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
          <Heart className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">Wearable Dashboard</h2>
          <p className="text-xs text-muted-foreground">Métricas de saúde e fadiga</p>
        </div>
      </div>

      {/* Readiness gauge */}
      {latest && (
        <div className="bg-card rounded-2xl border border-border p-4">
          <div className="flex items-center gap-4">
            <div className="w-24 h-24">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" data={radialData} startAngle={90} endAngle={-270}>
                  <RadialBar dataKey="value" cornerRadius={10} background={{ fill: 'hsl(230, 12%, 18%)' }} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="relative -mt-[62px] text-center">
                <p className="text-xl font-bold text-foreground">{readiness}</p>
                <p className="text-[8px] text-muted-foreground">READINESS</p>
              </div>
            </div>
            <div className="flex-1">
              <div className={cn("flex items-center gap-1.5 mb-1", recommendation.color)}>
                <recommendation.icon className="w-4 h-4" />
                <span className="text-xs font-bold">Recomendação</span>
              </div>
              <p className="text-xs text-foreground">{recommendation.text}</p>
            </div>
          </div>
        </div>
      )}

      {/* Quick stats */}
      {latest && (
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'FC', value: latest.heart_rate, unit: 'bpm', icon: Heart, color: 'text-red-400' },
            { label: 'HRV', value: latest.hrv, unit: 'ms', icon: Activity, color: 'text-green-400' },
            { label: 'Sono', value: latest.sleep_hours?.toFixed(1), unit: 'h', icon: Moon, color: 'text-blue-400' },
            { label: 'Calorias', value: latest.calories_burned, unit: 'kcal', icon: Flame, color: 'text-orange-400' },
            { label: 'SpO₂', value: latest.spo2, unit: '%', icon: Brain, color: 'text-purple-400' },
            { label: 'Fadiga', value: latest.fatigue_score, unit: '/100', icon: Zap, color: 'text-yellow-400' },
          ].map(s => (
            <div key={s.label} className="bg-card rounded-xl border border-border p-2.5 text-center">
              <s.icon className={cn("w-4 h-4 mx-auto mb-1", s.color)} />
              <p className="text-sm font-bold text-foreground">{s.value}<span className="text-[8px] text-muted-foreground ml-0.5">{s.unit}</span></p>
              <p className="text-[9px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Charts */}
      {chartData.length >= 3 && (
        <div className="space-y-3">
          <div className="bg-card rounded-xl border border-border p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2">FC & HRV (14 dias)</p>
            <ResponsiveContainer width="100%" height={130}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(230, 12%, 18%)" />
                <XAxis dataKey="day" tick={{ fill: 'hsl(215, 15%, 50%)', fontSize: 9 }} />
                <YAxis tick={{ fill: 'hsl(215, 15%, 50%)', fontSize: 9 }} />
                <Tooltip contentStyle={{ background: 'hsl(230, 15%, 11%)', border: '1px solid hsl(230, 12%, 18%)', borderRadius: 8, fontSize: 10 }} />
                <Line type="monotone" dataKey="hr" stroke="hsl(0, 72%, 55%)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="hrv" stroke="hsl(145, 65%, 45%)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card rounded-xl border border-border p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Fadiga vs Readiness</p>
            <ResponsiveContainer width="100%" height={130}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="fatigueG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(0, 72%, 55%)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="hsl(0, 72%, 55%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="readyG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(145, 65%, 45%)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="hsl(145, 65%, 45%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(230, 12%, 18%)" />
                <XAxis dataKey="day" tick={{ fill: 'hsl(215, 15%, 50%)', fontSize: 9 }} />
                <YAxis tick={{ fill: 'hsl(215, 15%, 50%)', fontSize: 9 }} />
                <Tooltip contentStyle={{ background: 'hsl(230, 15%, 11%)', border: '1px solid hsl(230, 12%, 18%)', borderRadius: 8, fontSize: 10 }} />
                <Area type="monotone" dataKey="fatigue" stroke="hsl(0, 72%, 55%)" fill="url(#fatigueG)" strokeWidth={2} />
                <Area type="monotone" dataKey="readiness" stroke="hsl(145, 65%, 45%)" fill="url(#readyG)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Input form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-card rounded-xl border border-border p-4 space-y-3"
          >
            <p className="text-sm font-bold text-foreground">Registrar Dados</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'heart_rate', label: 'FC (bpm)', placeholder: '72' },
                { key: 'hrv', label: 'HRV (ms)', placeholder: '55' },
                { key: 'calories', label: 'Calorias', placeholder: '450' },
                { key: 'spo2', label: 'SpO₂ (%)', placeholder: '98' },
                { key: 'sleep', label: 'Sono (h)', placeholder: '7.5' },
                { key: 'resting_hr', label: 'FC Repouso', placeholder: '58' },
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
              <button onClick={submitLog} className="flex-1 py-2 rounded-lg bg-primary text-sm font-bold text-primary-foreground">Salvar</button>
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
          Registrar Dados
        </button>
      )}

      {!latest && !showForm && (
        <div className="text-center py-8">
          <Heart className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">Registre dados do seu wearable</p>
          <p className="text-[10px] text-muted-foreground/60 mt-1">FC, HRV, sono e mais para análise de fadiga por IA</p>
        </div>
      )}
    </div>
  );
}
