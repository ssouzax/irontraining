import { useState, useEffect } from 'react';
import { Activity, Moon, Zap, AlertTriangle, TrendingUp, Loader2, Plus, Battery, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface RecoveryMetric {
  id: string;
  metric_date: string;
  fatigue_level: number;
  sleep_quality: number | null;
  soreness_level: number | null;
  readiness_score: number;
  volume_load: number;
  intensity_avg: number;
}

export function MobileRecoveryTimeline() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<RecoveryMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [fatigue, setFatigue] = useState(5);
  const [sleep, setSleep] = useState(7);
  const [soreness, setSoreness] = useState(5);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (user) loadMetrics(); }, [user]);

  const loadMetrics = async () => {
    if (!user) return;
    const since = new Date();
    since.setDate(since.getDate() - 30);
    
    const { data } = await (supabase as any)
      .from('recovery_metrics')
      .select('*')
      .eq('user_id', user.id)
      .gte('metric_date', since.toISOString().split('T')[0])
      .order('metric_date', { ascending: true });
    
    setMetrics((data as RecoveryMetric[]) || []);
    setLoading(false);
  };

  const saveMetric = async () => {
    if (!user) return;
    setSaving(true);
    const readiness = Math.round(((10 - fatigue) * 30 + sleep * 30 + (10 - soreness) * 40) / 10);
    
    const { error } = await supabase.from('recovery_metrics').upsert({
      user_id: user.id,
      metric_date: new Date().toISOString().split('T')[0],
      fatigue_level: fatigue,
      sleep_quality: sleep,
      soreness_level: soreness,
      readiness_score: readiness,
    }, { onConflict: 'user_id,metric_date' });

    if (error) toast.error('Erro ao salvar');
    else {
      toast.success('Métricas salvas!');
      setShowForm(false);
      loadMetrics();
    }
    setSaving(false);
  };

  const latest = metrics.length > 0 ? metrics[metrics.length - 1] : null;
  const readiness = latest?.readiness_score || 50;
  
  const getReadinessColor = (score: number) => {
    if (score >= 70) return 'text-emerald-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getReadinessLabel = (score: number) => {
    if (score >= 80) return 'Excelente';
    if (score >= 60) return 'Bom';
    if (score >= 40) return 'Moderado';
    if (score >= 20) return 'Fadiga Alta';
    return 'Descanso Necessário';
  };

  const getRecommendation = (score: number) => {
    if (score >= 80) return { text: 'Top set intenso! Dia perfeito para PR.', icon: '🔥', type: 'go' };
    if (score >= 60) return { text: 'Treino normal. Mantenha o plano.', icon: '✅', type: 'normal' };
    if (score >= 40) return { text: 'Reduza volume. Foque em técnica.', icon: '⚠️', type: 'caution' };
    return { text: 'Descanso ativo ou folga. Seu corpo precisa recuperar.', icon: '🛌', type: 'rest' };
  };

  const recommendation = getRecommendation(readiness);

  const chartData = metrics.map(m => ({
    date: new Date(m.metric_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
    readiness: m.readiness_score,
    fadiga: m.fatigue_level,
    sono: m.sleep_quality || 0,
    dor: m.soreness_level || 0,
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
              <Activity className="w-5 h-5 text-primary" /> Recuperação
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">Fadiga, sono e prontidão para treino</p>
          </div>
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-medium">
            <Plus className="w-4 h-4" /> Check-in
          </button>
        </div>
      </motion.div>

      {/* Check-in Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden">
            <div className="p-4 rounded-2xl bg-card border border-border space-y-4">
              {[
                { label: 'Fadiga', value: fatigue, set: setFatigue, icon: Battery, low: 'Descansado', high: 'Exausto' },
                { label: 'Qualidade do Sono', value: sleep, set: setSleep, icon: Moon, low: 'Péssimo', high: 'Ótimo' },
                { label: 'Dor Muscular', value: soreness, set: setSoreness, icon: Heart, low: 'Nenhuma', high: 'Intensa' },
              ].map(item => (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <item.icon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs font-semibold text-foreground">{item.label}</span>
                    </div>
                    <span className="text-sm font-extrabold text-primary">{item.value}/10</span>
                  </div>
                  <input type="range" min="1" max="10" value={item.value} onChange={e => item.set(Number(e.target.value))}
                    className="w-full accent-primary" />
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
                    <span>{item.low}</span><span>{item.high}</span>
                  </div>
                </div>
              ))}
              <button onClick={saveMetric} disabled={saving}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50">
                {saving ? 'Salvando...' : 'Salvar Check-in'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Readiness Score */}
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className={cn("p-5 rounded-2xl border text-center",
          readiness >= 60 ? "bg-emerald-500/5 border-emerald-500/20" :
          readiness >= 40 ? "bg-yellow-500/5 border-yellow-500/20" :
          "bg-red-500/5 border-red-500/20"
        )}>
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-2">Prontidão para Treino</p>
        <p className={cn("text-6xl font-extrabold", getReadinessColor(readiness))}>{Math.round(readiness)}</p>
        <p className={cn("text-sm font-semibold mt-1", getReadinessColor(readiness))}>{getReadinessLabel(readiness)}</p>
        
        <div className={cn("mt-4 p-3 rounded-xl inline-flex items-center gap-2",
          recommendation.type === 'go' ? "bg-emerald-500/10" :
          recommendation.type === 'normal' ? "bg-blue-500/10" :
          recommendation.type === 'caution' ? "bg-yellow-500/10" : "bg-red-500/10"
        )}>
          <span className="text-lg">{recommendation.icon}</span>
          <span className="text-xs font-medium text-foreground">{recommendation.text}</span>
        </div>
      </motion.div>

      {/* Quick Metrics */}
      {latest && (
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-2xl bg-card border border-border text-center">
            <Battery className="w-4 h-4 text-orange-400 mx-auto mb-1" />
            <p className="text-lg font-extrabold text-foreground">{latest.fatigue_level}</p>
            <p className="text-[10px] text-muted-foreground">Fadiga</p>
          </div>
          <div className="p-3 rounded-2xl bg-card border border-border text-center">
            <Moon className="w-4 h-4 text-indigo-400 mx-auto mb-1" />
            <p className="text-lg font-extrabold text-foreground">{latest.sleep_quality || '—'}</p>
            <p className="text-[10px] text-muted-foreground">Sono</p>
          </div>
          <div className="p-3 rounded-2xl bg-card border border-border text-center">
            <Heart className="w-4 h-4 text-red-400 mx-auto mb-1" />
            <p className="text-lg font-extrabold text-foreground">{latest.soreness_level || '—'}</p>
            <p className="text-[10px] text-muted-foreground">Dor</p>
          </div>
        </div>
      )}

      {/* Readiness Chart */}
      {chartData.length > 1 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="p-4 rounded-2xl bg-card border border-border">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Prontidão (30 dias)</p>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="readinessGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 12 }} />
              <Area type="monotone" dataKey="readiness" stroke="hsl(var(--primary))" fill="url(#readinessGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Fatigue Bars */}
      {chartData.length > 1 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="p-4 rounded-2xl bg-card border border-border">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Fadiga vs Sono</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis domain={[0, 10]} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 12 }} />
              <Bar dataKey="fadiga" fill="#f97316" radius={[4, 4, 0, 0]} />
              <Bar dataKey="sono" fill="#818cf8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {metrics.length === 0 && !showForm && (
        <div className="text-center py-12">
          <Activity className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">Nenhum check-in ainda.</p>
          <p className="text-muted-foreground text-xs mt-1">Registre como você está se sentindo</p>
        </div>
      )}
    </div>
  );
}
