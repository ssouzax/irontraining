import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRightLeft } from 'lucide-react';
import { findVariations, type ExerciseVariation } from '@/data/exerciseLibrary';

interface AdaptExerciseModalProps {
  exerciseName: string;
  open: boolean;
  onClose: () => void;
  onSelect: (newName: string) => void;
}

export default function AdaptExerciseModal({ exerciseName, open, onClose, onSelect }: AdaptExerciseModalProps) {
  const variations = findVariations(exerciseName);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            onClick={e => e.stopPropagation()}
            className="bg-card border border-border rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[70vh] overflow-auto p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">Adaptar Exercício</h3>
              </div>
              <button onClick={onClose} className="p-1.5 text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground mb-3">
              Atual: <span className="text-foreground font-medium">{exerciseName}</span>
            </p>

            {variations.length > 0 ? (
              <div className="space-y-1.5">
                {variations.map(v => (
                  <button
                    key={v.id}
                    onClick={() => { onSelect(v.name); onClose(); }}
                    className="w-full text-left px-4 py-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
                  >
                    <p className="text-sm font-medium text-foreground">{v.name}</p>
                    <p className="text-xs text-muted-foreground">{v.equipment}</p>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">
                Nenhuma variação encontrada para este exercício.
              </p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
