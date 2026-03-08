import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';

interface LevelUpModalProps {
  open: boolean;
  level: number;
  title: string;
  onClose: () => void;
}

export default function LevelUpModal({ open, level, title, onClose }: LevelUpModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', damping: 15 }}
            onClick={e => e.stopPropagation()}
            className="bg-card border border-primary/30 rounded-3xl p-8 text-center max-w-sm w-full card-elevated relative overflow-hidden"
          >
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent pointer-events-none" />
            
            <div className="relative z-10 space-y-4">
              <motion.div
                initial={{ rotate: -180, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
              >
                <Sparkles className="w-16 h-16 text-primary mx-auto" />
              </motion.div>

              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-primary font-medium">LEVEL UP!</p>
                <motion.p
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: 'spring' }}
                  className="text-6xl font-extrabold text-foreground mt-2"
                >
                  {level}
                </motion.p>
              </div>

              <div className="bg-primary/10 rounded-xl px-4 py-3">
                <p className="text-xs text-muted-foreground">Novo título</p>
                <p className="text-lg font-bold text-primary">{title}</p>
              </div>

              <button
                onClick={onClose}
                className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-medium text-sm hover:bg-primary/90 transition-colors"
              >
                Continuar
              </button>
            </div>

            <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
