import { useState, useEffect, useRef } from 'react';
import { Sparkles, Download, Share2, Trophy, Flame, Zap, Dumbbell, Crown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTraining } from '@/contexts/TrainingContext';
import { calculate1RM } from '@/data/defaultProfile';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
// html2canvas is dynamically imported to avoid mixed static/dynamic import issues

type CardType = 'stats' | 'prs' | 'streak' | 'level';

export function MobileWrappedCards() {
  const { user } = useAuth();
  const { profile } = useTraining();
  const [activeCard, setActiveCard] = useState<CardType>('stats');
  const [displayName, setDisplayName] = useState('Atleta');
  const [streak, setStreak] = useState(0);
  const [totalWorkouts, setTotalWorkouts] = useState(0);
  const [prCount, setPrCount] = useState(0);
  const [level, setLevel] = useState(1);
  const [title, setTitle] = useState('Novato');
  const [exporting, setExporting] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const squat1RM = calculate1RM(profile.currentLifts.squat.weight, profile.currentLifts.squat.reps);
  const bench1RM = calculate1RM(profile.currentLifts.bench.weight, profile.currentLifts.bench.reps);
  const deadlift1RM = calculate1RM(profile.currentLifts.deadlift.weight, profile.currentLifts.deadlift.reps);
  const total = squat1RM + bench1RM + deadlift1RM;

  useEffect(() => { loadData(); }, [user]);

  const loadData = async () => {
    if (!user) return;
    const { data: prof } = await supabase.from('profiles').select('display_name').eq('user_id', user.id).single();
    if (prof?.display_name) setDisplayName(prof.display_name);

    const { data: streakData } = await supabase.from('training_streaks').select('current_streak').eq('user_id', user.id).single();
    if (streakData) setStreak(streakData.current_streak);

    const { count: workoutCount } = await supabase.from('workout_logs').select('id', { count: 'exact' }).eq('user_id', user.id);
    setTotalWorkouts(workoutCount || 0);

    const { count: prs } = await supabase.from('personal_records').select('id', { count: 'exact' }).eq('user_id', user.id);
    setPrCount(prs || 0);

    const { data: levelData } = await supabase.from('player_levels').select('player_level, title').eq('user_id', user.id).single();
    if (levelData) { setLevel(levelData.player_level); setTitle(levelData.title || 'Novato'); }
  };

  const exportCard = async () => {
    if (!cardRef.current) return;
    setExporting(true);
    try {
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(cardRef.current, { backgroundColor: null, scale: 2 });
      const link = document.createElement('a');
      link.download = `powerbuild-${activeCard}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success('Card exportado!');
    } catch {
      toast.error('Erro ao exportar');
    }
    setExporting(false);
  };

  const shareCard = async () => {
    if (!cardRef.current) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(cardRef.current, { backgroundColor: null, scale: 2 });
      canvas.toBlob(async (blob) => {
        if (blob && navigator.share) {
          const file = new File([blob], 'powerbuild-stats.png', { type: 'image/png' });
          await navigator.share({ files: [file], title: 'PowerBuild Stats' });
        } else {
          exportCard();
        }
        setExporting(false);
      });
    } catch {
      setExporting(false);
      exportCard();
    }
  };

  return (
    <div className="p-4 space-y-5">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" /> Wrapped Cards
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">Compartilhe suas conquistas nas redes sociais</p>
      </motion.div>

      {/* Card type selector */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4">
        {([
          { key: 'stats' as CardType, label: 'Resumo', icon: Zap },
          { key: 'prs' as CardType, label: 'PRs', icon: Trophy },
          { key: 'streak' as CardType, label: 'Streak', icon: Flame },
          { key: 'level' as CardType, label: 'Nível', icon: Crown },
        ]).map(card => (
          <button key={card.key} onClick={() => setActiveCard(card.key)}
            className={cn("flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-colors shrink-0",
              activeCard === card.key ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
            )}>
            <card.icon className="w-3.5 h-3.5" />
            {card.label}
          </button>
        ))}
      </div>

      {/* Card Preview */}
      <div className="flex justify-center">
        <div ref={cardRef} className="w-[320px] aspect-[9/16] rounded-3xl overflow-hidden relative">
          {activeCard === 'stats' && (
            <div className="w-full h-full bg-gradient-to-br from-primary via-primary/80 to-accent p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Dumbbell className="w-5 h-5 text-primary-foreground/80" />
                  <span className="text-xs font-bold text-primary-foreground/80 uppercase tracking-widest">PowerBuild</span>
                </div>
                <h3 className="text-2xl font-extrabold text-primary-foreground mt-6">{displayName}</h3>
                <p className="text-sm text-primary-foreground/70">Resumo de Força</p>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Agachamento', val: `${squat1RM}kg` },
                    { label: 'Supino', val: `${bench1RM}kg` },
                    { label: 'Terra', val: `${deadlift1RM}kg` },
                    { label: 'Total', val: `${total}kg` },
                  ].map(s => (
                    <div key={s.label} className="p-3 rounded-xl bg-primary-foreground/10 backdrop-blur-sm">
                      <p className="text-[10px] text-primary-foreground/60 uppercase">{s.label}</p>
                      <p className="text-xl font-extrabold text-primary-foreground">{s.val}</p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-2xl font-extrabold text-primary-foreground">{totalWorkouts}</p>
                    <p className="text-[10px] text-primary-foreground/60">Treinos</p>
                  </div>
                  <div>
                    <p className="text-2xl font-extrabold text-primary-foreground">{prCount}</p>
                    <p className="text-[10px] text-primary-foreground/60">PRs</p>
                  </div>
                  <div>
                    <p className="text-2xl font-extrabold text-primary-foreground">{streak}</p>
                    <p className="text-[10px] text-primary-foreground/60">Streak</p>
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-primary-foreground/40 text-center">powerbuild.app</p>
            </div>
          )}

          {activeCard === 'prs' && (
            <div className="w-full h-full bg-gradient-to-br from-yellow-600 via-amber-500 to-orange-500 p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-white/80" />
                  <span className="text-xs font-bold text-white/80 uppercase tracking-widest">Personal Records</span>
                </div>
                <h3 className="text-2xl font-extrabold text-white mt-6">{displayName}</h3>
              </div>
              <div className="space-y-4">
                {[
                  { label: 'Agachamento', val: squat1RM },
                  { label: 'Supino', val: bench1RM },
                  { label: 'Levantamento Terra', val: deadlift1RM },
                ].map(pr => (
                  <div key={pr.label} className="p-4 rounded-xl bg-white/10 backdrop-blur-sm">
                    <p className="text-xs text-white/60 uppercase tracking-wider">{pr.label}</p>
                    <p className="text-4xl font-extrabold text-white">{pr.val}<span className="text-lg">kg</span></p>
                  </div>
                ))}
                <div className="p-4 rounded-xl bg-white/20 backdrop-blur-sm text-center">
                  <p className="text-xs text-white/60 uppercase">Total Powerlifting</p>
                  <p className="text-5xl font-extrabold text-white">{total}<span className="text-xl">kg</span></p>
                </div>
              </div>
              <p className="text-[10px] text-white/40 text-center">powerbuild.app</p>
            </div>
          )}

          {activeCard === 'streak' && (
            <div className="w-full h-full bg-gradient-to-br from-orange-600 via-red-500 to-rose-600 p-6 flex flex-col justify-center items-center gap-6">
              <Flame className="w-16 h-16 text-white/30" />
              <div className="text-center">
                <p className="text-8xl font-extrabold text-white">{streak}</p>
                <p className="text-lg font-bold text-white/80 uppercase tracking-widest mt-2">Day Streak</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-white">{displayName}</p>
                <p className="text-sm text-white/60">{totalWorkouts} treinos completados</p>
              </div>
              <div className="flex items-center gap-2 mt-auto">
                <Dumbbell className="w-4 h-4 text-white/40" />
                <span className="text-[10px] text-white/40 uppercase tracking-widest">PowerBuild</span>
              </div>
            </div>
          )}

          {activeCard === 'level' && (
            <div className="w-full h-full bg-gradient-to-br from-violet-600 via-purple-500 to-indigo-600 p-6 flex flex-col justify-center items-center gap-6">
              <Crown className="w-16 h-16 text-white/30" />
              <div className="text-center">
                <p className="text-[10px] text-white/60 uppercase tracking-widest mb-2">Nível</p>
                <p className="text-8xl font-extrabold text-white">{level}</p>
                <p className="text-lg font-bold text-white/80 mt-2">{title}</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-white">{displayName}</p>
                <p className="text-sm text-white/60">Total: {total}kg · {prCount} PRs</p>
              </div>
              <div className="flex items-center gap-2 mt-auto">
                <Dumbbell className="w-4 h-4 text-white/40" />
                <span className="text-[10px] text-white/40 uppercase tracking-widest">PowerBuild</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={exportCard} disabled={exporting}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-card border border-border text-sm font-medium text-foreground disabled:opacity-50">
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          Baixar
        </button>
        <button onClick={shareCard} disabled={exporting}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50">
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
          Compartilhar
        </button>
      </div>
    </div>
  );
}
