import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import {
  MessageSquare, Send, Tag, BarChart3, Brain, Zap,
  ThumbsUp, ThumbsDown, Minus, AlertTriangle, Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const quickTags = [
  { label: 'Fadiga alta', emoji: '😓', color: 'bg-destructive/10 text-destructive border-destructive/20' },
  { label: 'Carga leve', emoji: '🪶', color: 'bg-muted/60 text-muted-foreground border-border' },
  { label: 'Carga pesada', emoji: '🏋️', color: 'bg-warning/10 text-warning border-warning/20' },
  { label: 'Execução ruim', emoji: '❌', color: 'bg-destructive/10 text-destructive border-destructive/20' },
  { label: 'Execução ótima', emoji: '✅', color: 'bg-success/10 text-success border-success/20' },
  { label: 'Dor muscular', emoji: '🔥', color: 'bg-warning/10 text-warning border-warning/20' },
  { label: 'Falta de estabilidade', emoji: '⚠️', color: 'bg-warning/10 text-warning border-warning/20' },
  { label: 'Falha técnica', emoji: '🔧', color: 'bg-muted/60 text-muted-foreground border-border' },
  { label: 'Dormi mal', emoji: '😴', color: 'bg-destructive/10 text-destructive border-destructive/20' },
  { label: 'Muito cansado', emoji: '💤', color: 'bg-warning/10 text-warning border-warning/20' },
  { label: 'Energia alta', emoji: '⚡', color: 'bg-success/10 text-success border-success/20' },
  { label: 'Pump excelente', emoji: '💪', color: 'bg-primary/10 text-primary border-primary/20' },
];

const energyLevels = [
  { value: 'low', label: 'Baixa', icon: ThumbsDown, color: 'text-destructive' },
  { value: 'medium', label: 'Média', icon: Minus, color: 'text-warning' },
  { value: 'high', label: 'Alta', icon: ThumbsUp, color: 'text-success' },
];

export default function TrainingNotesPage() {
  const { user } = useAuth();
  const [effortScale, setEffortScale] = useState(7);
  const [energy, setEnergy] = useState('medium');
  const [painNote, setPainNote] = useState('');
  const [freeNote, setFreeNote] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [weeklyNote, setWeeklyNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [insights, setInsights] = useState<string[]>([]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const saveNotes = async () => {
    if (!user) return;
    setSaving(true);
    try {
      // Save as a workout log note using ai_recommendations as storage
      const noteData = {
        effort_scale: effortScale,
        energy,
        pain: painNote,
        free_note: freeNote,
        tags: selectedTags,
        weekly_note: weeklyNote,
        date: new Date().toISOString().split('T')[0],
      };

      await supabase.from('ai_recommendations').insert({
        user_id: user.id,
        type: 'training_note',
        title: `Nota de treino – ${new Date().toLocaleDateString('pt-BR')}`,
        description: JSON.stringify(noteData),
        status: 'pending',
      });

      toast.success('Anotação salva com sucesso!');
      
      // Generate simple insights based on tags
      const newInsights: string[] = [];
      if (selectedTags.includes('Fadiga alta') || selectedTags.includes('Muito cansado')) {
        newInsights.push('⚠️ Fadiga detectada. Considere reduzir o volume em 10% no próximo treino.');
      }
      if (selectedTags.includes('Execução ótima') && effortScale >= 8) {
        newInsights.push('✅ Ótimo treino! Seus dados indicam que pode progredir carga na próxima sessão.');
      }
      if (selectedTags.includes('Dormi mal')) {
        newInsights.push('😴 Sono ruim afeta a recuperação. Considere um treino regenerativo hoje.');
      }
      if (selectedTags.includes('Dor muscular')) {
        newInsights.push('🔥 Dor muscular pode indicar overtraining. Monitore nas próximas sessões.');
      }
      if (effortScale >= 9) {
        newInsights.push('💪 Esforço máximo registrado! Garanta descanso adequado antes do próximo treino.');
      }
      setInsights(newInsights);

    } catch (err) {
      toast.error('Erro ao salvar anotação');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Training Intelligence Notes</h1>
            <p className="text-sm text-muted-foreground">Registre feedback e a IA ajusta seu treino</p>
          </div>
        </div>
      </motion.div>

      {/* Effort Scale */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="bg-card rounded-xl border border-border p-5 card-elevated space-y-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" /> Escala de Esforço (RPE)
        </h3>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={1}
            max={10}
            value={effortScale}
            onChange={e => setEffortScale(parseInt(e.target.value))}
            className="flex-1 accent-primary"
          />
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold",
            effortScale <= 3 ? "bg-success/10 text-success" :
            effortScale <= 6 ? "bg-warning/10 text-warning" :
            effortScale <= 8 ? "bg-orange-500/10 text-orange-500" :
            "bg-destructive/10 text-destructive"
          )}>
            {effortScale}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {effortScale <= 3 ? 'Treino leve – recuperação ativa' :
           effortScale <= 5 ? 'Esforço moderado – zona de conforto' :
           effortScale <= 7 ? 'Treino intenso – boa progressão' :
           effortScale <= 9 ? 'Esforço alto – próximo do limite' :
           'Esforço máximo – falha muscular'}
        </p>
      </motion.div>

      {/* Energy Level */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-card rounded-xl border border-border p-5 card-elevated space-y-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" /> Energia no Treino
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {energyLevels.map(level => (
            <button
              key={level.value}
              onClick={() => setEnergy(level.value)}
              className={cn(
                "flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all",
                energy === level.value
                  ? "border-primary bg-primary/5"
                  : "border-border bg-secondary/30 hover:bg-secondary/50"
              )}
            >
              <level.icon className={cn("w-5 h-5", level.color)} />
              <span className="text-xs font-medium text-foreground">{level.label}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Quick Tags */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="bg-card rounded-xl border border-border p-5 card-elevated space-y-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Tag className="w-4 h-4 text-primary" /> Tags Rápidas
        </h3>
        <div className="flex flex-wrap gap-2">
          {quickTags.map(tag => (
            <button
              key={tag.label}
              onClick={() => toggleTag(tag.label)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                selectedTags.includes(tag.label)
                  ? "ring-2 ring-primary ring-offset-1 ring-offset-background " + tag.color
                  : tag.color + " opacity-70 hover:opacity-100"
              )}
            >
              {tag.emoji} {tag.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Pain / Discomfort */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="bg-card rounded-xl border border-border p-5 card-elevated space-y-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-warning" /> Dor ou Desconforto
        </h3>
        <input
          type="text"
          value={painNote}
          onChange={e => setPainNote(e.target.value)}
          placeholder="Ex: dor leve no ombro esquerdo..."
          className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </motion.div>

      {/* Free Note */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        className="bg-card rounded-xl border border-border p-5 card-elevated space-y-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-primary" /> Comentário Livre
        </h3>
        <textarea
          value={freeNote}
          onChange={e => setFreeNote(e.target.value)}
          placeholder="Como foi o treino de hoje? Observações sobre execução, carga, motivação..."
          rows={3}
          className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
        />
      </motion.div>

      {/* Weekly Note */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="bg-card rounded-xl border border-border p-5 card-elevated space-y-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary" /> Resumo da Semana
        </h3>
        <textarea
          value={weeklyNote}
          onChange={e => setWeeklyNote(e.target.value)}
          placeholder="Ex: Corrida cansou minhas pernas, dormi mal essa semana..."
          rows={2}
          className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
        />
      </motion.div>

      {/* Save */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
        <button
          onClick={saveNotes}
          disabled={saving}
          className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          <Send className="w-4 h-4" />
          {saving ? 'Salvando...' : 'Salvar Anotação'}
        </button>
      </motion.div>

      {/* AI Insights */}
      {insights.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl border border-primary/20 p-5 card-elevated space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Brain className="w-4 h-4 text-primary" /> Training Insights
          </h3>
          <div className="space-y-2">
            {insights.map((insight, i) => (
              <p key={i} className="text-sm text-muted-foreground bg-secondary/30 rounded-lg px-3 py-2">
                {insight}
              </p>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
