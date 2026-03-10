import { motion } from 'framer-motion';
import { Trophy, Flame, Dumbbell, Timer, X, Share2 } from 'lucide-react';

interface WorkoutSummaryProps {
  exerciseCount: number;
  totalSets: number;
  totalVolume: number; // kg
  duration?: number; // seconds
  xpEarned: number;
  onClose: () => void;
}

export default function WorkoutSummary({ exerciseCount, totalSets, totalVolume, duration, xpEarned, onClose }: WorkoutSummaryProps) {
  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    return `${m} min`;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm flex items-center justify-center px-4"
    >
      <motion.div
        initial={{ scale: 0.8, y: 40 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 20 }}
        className="bg-card border border-border rounded-2xl p-8 max-w-sm w-full text-center space-y-6 card-elevated"
      >
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground">
          <X className="w-5 h-5" />
        </button>

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
        >
          <Flame className="w-16 h-16 text-primary mx-auto" />
        </motion.div>

        <div>
          <h2 className="text-2xl font-bold text-foreground">Treino Concluído! 🔥</h2>
          <p className="text-sm text-muted-foreground mt-1">Ótimo trabalho, continue assim!</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-secondary/50 rounded-xl p-3">
            <Dumbbell className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground">{exerciseCount}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Exercícios</p>
          </div>
          <div className="bg-secondary/50 rounded-xl p-3">
            <p className="text-lg font-bold text-foreground">{totalSets}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Séries</p>
          </div>
          <div className="bg-secondary/50 rounded-xl p-3">
            <p className="text-lg font-bold text-foreground">{totalVolume.toLocaleString('pt-BR')}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Volume (kg)</p>
          </div>
          <div className="bg-secondary/50 rounded-xl p-3">
            <Trophy className="w-5 h-5 text-warning mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground">+{xpEarned}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">XP</p>
          </div>
        </div>

        {duration && duration > 0 && (
          <div className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
            <Timer className="w-4 h-4" />
            <span>Duração: {formatDuration(duration)}</span>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors"
        >
          Continuar
        </button>
      </motion.div>
    </motion.div>
  );
}
