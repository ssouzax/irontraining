import { useState } from 'react';
import { Brain, Loader2, TrendingUp, Calendar, Target, AlertTriangle, Zap, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTraining } from '@/contexts/TrainingContext';
import { calculate1RM } from '@/data/defaultProfile';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

interface Prediction {
  exercise: string;
  current_1rm: number;
  predicted_1rm_4w: number;
  predicted_1rm_8w: number;
  predicted_1rm_12w: number;
  weekly_gain_kg: number;
  weeks_to_next_pr: number;
  confidence: number;
  level: string;
  plateau_risk: string;
}

interface NextTopSet {
  exercise: string;
  suggested_weight: number;
  suggested_reps: number;
  suggested_rir: number;
}

interface PredictionResult {
  predictions: Prediction[];
  overall_analysis: string;
  recommendations: string[];
  next_top_sets: NextTopSet[];
}

const LEVEL_COLORS: Record<string, string> = {
  iniciante: 'bg-emerald-500/10 text-emerald-400',
  intermediario: 'bg-blue-500/10 text-blue-400',
  avancado: 'bg-purple-500/10 text-purple-400',
  elite: 'bg-amber-500/10 text-amber-400',
};

const RISK_COLORS: Record<string, string> = {
  baixo: 'text-emerald-400',
  medio: 'text-amber-400',
  alto: 'text-red-400',
};

export function MobilePredictor() {
  const { user } = useAuth();
  const { profile } = useTraining();
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [timeframe, setTimeframe] = useState<'4w' | '8w' | '12w'>('8w');

  const squat1RM = calculate1RM(profile.currentLifts.squat.weight, profile.currentLifts.squat.reps);
  const bench1RM = calculate1RM(profile.currentLifts.bench.weight, profile.currentLifts.bench.reps);
  const deadlift1RM = calculate1RM(profile.currentLifts.deadlift.weight, profile.currentLifts.deadlift.reps);

  const generatePredictions = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('predict-strength', {
        body: { squat1RM, bench1RM, deadlift1RM, bodyWeight: profile.bodyWeight },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setResult(data);
      toast.success('Predições IA geradas!');
    } catch (err: any) {
      toast.error(err.message || 'Falha ao gerar predições');
    } finally {
      setLoading(false);
    }
  };

  const getPredictedValue = (pred: Prediction) => {
    if (timeframe === '4w') return pred.predicted_1rm_4w;
    if (timeframe === '8w') return pred.predicted_1rm_8w;
    return pred.predicted_1rm_12w;
  };

  return (
    <div className="p-4 space-y-5">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" /> Preditor IA
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">IA analisa seu progresso e prevê seus PRs</p>
      </motion.div>

      {/* Current Stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Agachamento', val: squat1RM },
          { label: 'Supino', val: bench1RM },
          { label: 'Terra', val: deadlift1RM },
        ].map(s => (
          <div key={s.label} className="text-center p-3 rounded-xl bg-card border border-border">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
            <p className="text-xl font-extrabold text-foreground">{s.val}<span className="text-xs">kg</span></p>
            <p className="text-[10px] text-muted-foreground">E1RM atual</p>
          </div>
        ))}
      </div>

      <button onClick={generatePredictions} disabled={loading}
        className="w-full bg-primary text-primary-foreground py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
        {loading ? 'Analisando com IA...' : 'Gerar Predições com IA'}
      </button>

      {result && (
        <div className="space-y-4">
          {/* Timeframe Selector */}
          <div className="flex gap-1 p-1 bg-secondary rounded-xl">
            {([['4w', '4 sem'], ['8w', '8 sem'], ['12w', '12 sem']] as const).map(([key, label]) => (
              <button key={key} onClick={() => setTimeframe(key)}
                className={cn("flex-1 py-2 rounded-lg text-xs font-medium transition-colors",
                  timeframe === key ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                )}>
                {label}
              </button>
            ))}
          </div>

          {/* Predictions Cards */}
          {result.predictions.map((pred, i) => {
            const predicted = getPredictedValue(pred);
            const gain = predicted - pred.current_1rm;
            return (
              <motion.div key={pred.exercise}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-card rounded-2xl border border-border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary" /> {pred.exercise}
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium", LEVEL_COLORS[pred.level] || LEVEL_COLORS.intermediario)}>
                      {pred.level}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                      {pred.confidence}%
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Atual</span>
                    <span className="text-muted-foreground">Predição {timeframe}</span>
                  </div>
                  <div className="relative h-8 rounded-lg bg-secondary overflow-hidden">
                    <div className="absolute inset-y-0 left-0 bg-primary/30 rounded-lg transition-all duration-1000"
                      style={{ width: `${(pred.current_1rm / predicted) * 100}%` }} />
                    <div className="absolute inset-0 flex items-center justify-between px-3">
                      <span className="text-sm font-bold text-foreground">{pred.current_1rm}kg</span>
                      <span className="text-sm font-extrabold text-primary">{predicted}kg</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs mt-1">
                    <div className="flex items-center gap-1 text-primary">
                      <TrendingUp className="w-3 h-3" />
                      <span className="font-medium">+{gain}kg ({(gain / pred.current_1rm * 100).toFixed(1)}%)</span>
                    </div>
                    <span className="text-muted-foreground">+{pred.weekly_gain_kg.toFixed(1)}kg/sem</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl bg-primary/5 text-xs">
                    <Calendar className="w-3.5 h-3.5 text-primary" />
                    <span className="font-medium text-foreground">Próx PR: <span className="text-primary">{pred.weeks_to_next_pr} sem</span></span>
                  </div>
                  <div className="flex items-center gap-1 py-2 px-3 rounded-xl bg-secondary text-xs">
                    <AlertTriangle className={cn("w-3.5 h-3.5", RISK_COLORS[pred.plateau_risk] || RISK_COLORS.baixo)} />
                    <span className={cn("font-medium", RISK_COLORS[pred.plateau_risk] || RISK_COLORS.baixo)}>
                      {pred.plateau_risk === 'baixo' ? 'Baixo' : pred.plateau_risk === 'medio' ? 'Médio' : 'Alto'}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {/* Next Top Sets */}
          {result.next_top_sets.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="bg-card rounded-2xl border border-border p-4 space-y-3">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" /> Próximos Top Sets Sugeridos
              </h3>
              <div className="space-y-2">
                {result.next_top_sets.map((ts, i) => (
                  <div key={i} className="flex items-center justify-between py-2 px-3 rounded-xl bg-secondary/50">
                    <span className="text-xs font-medium text-foreground">{ts.exercise}</span>
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="font-mono font-bold text-primary">{ts.suggested_weight}kg</span>
                      <span className="text-muted-foreground">×{ts.suggested_reps}</span>
                      <span className="text-muted-foreground">RIR {ts.suggested_rir}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Analysis */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="bg-card rounded-2xl border border-border p-4 space-y-3">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Brain className="w-4 h-4 text-primary" /> Análise Geral
            </h3>
            <div className="text-xs text-muted-foreground leading-relaxed prose prose-sm prose-invert max-w-none">
              <ReactMarkdown>{result.overall_analysis}</ReactMarkdown>
            </div>
          </motion.div>

          {/* Recommendations */}
          {result.recommendations.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
              className="bg-card rounded-2xl border border-border p-4 space-y-3">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <ArrowRight className="w-4 h-4 text-primary" /> Recomendações
              </h3>
              <div className="space-y-2">
                {result.recommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <span className="text-primary font-bold mt-0.5">•</span>
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
