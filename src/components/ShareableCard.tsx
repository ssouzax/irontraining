import { useRef, useState } from 'react';
import { Download, Share2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ShareableCardProps {
  open: boolean;
  onClose: () => void;
  type: 'achievement' | 'pr' | 'streak';
  title: string;
  subtitle: string;
  stat?: string;
  statLabel?: string;
  icon?: string;
  username?: string;
  streakDays?: number;
}

const GRADIENTS: Record<string, string> = {
  achievement: 'from-violet-600 via-purple-600 to-indigo-700',
  pr: 'from-amber-500 via-orange-600 to-red-600',
  streak: 'from-orange-500 via-red-600 to-rose-700',
  streak_hot: 'from-red-600 via-orange-500 to-yellow-500',
};

export default function ShareableCard({ open, onClose, type, title, subtitle, stat, statLabel, icon, username, streakDays }: ShareableCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const gradient = GRADIENTS[Math.abs(title.length) % GRADIENTS.length];

  const downloadCard = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        backgroundColor: null,
        useCORS: true,
        width: 360,
        height: 640,
      });
      const link = document.createElement('a');
      link.download = `${type}-${title.replace(/\s/g, '-').toLowerCase()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch {
      // Fallback: just close
    } finally {
      setDownloading(false);
    }
  };

  const shareCard = async () => {
    if (!navigator.share) {
      downloadCard();
      return;
    }
    try {
      await navigator.share({
        title: `${type === 'pr' ? '🏆 Novo PR' : '🎖️ Conquista'}: ${title}`,
        text: `${subtitle}${stat ? ` — ${stat}` : ''}`,
        url: window.location.href,
      });
    } catch { /* user cancelled */ }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
            onClick={e => e.stopPropagation()}
            className="flex flex-col items-center gap-4 max-w-sm w-full"
          >
            {/* Card preview (9:16 aspect ratio scaled down) */}
            <div
              ref={cardRef}
              className={cn(
                "w-[360px] h-[640px] rounded-3xl overflow-hidden relative flex flex-col items-center justify-center p-8 text-white bg-gradient-to-br",
                gradient
              )}
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {/* Decorative elements */}
              <div className="absolute top-0 left-0 w-full h-full opacity-10">
                <div className="absolute top-8 left-8 w-32 h-32 border-2 border-white rounded-full" />
                <div className="absolute bottom-12 right-8 w-48 h-48 border border-white rounded-full" />
                <div className="absolute top-1/3 right-12 w-20 h-20 border border-white rotate-45" />
              </div>

              {/* Content */}
              <div className="relative z-10 text-center space-y-6">
                <span className="text-7xl block">{icon || (type === 'pr' ? '🏆' : '🎖️')}</span>
                
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] opacity-70 mb-2">
                    {type === 'pr' ? 'NOVO RECORDE PESSOAL' : 'CONQUISTA DESBLOQUEADA'}
                  </p>
                  <h2 className="text-2xl font-bold leading-tight">{title}</h2>
                  <p className="text-sm opacity-80 mt-2">{subtitle}</p>
                </div>

                {stat && (
                  <div className="bg-white/15 backdrop-blur-sm rounded-2xl px-8 py-5">
                    <p className="text-4xl font-extrabold tracking-tight">{stat}</p>
                    {statLabel && <p className="text-xs uppercase tracking-wider opacity-70 mt-1">{statLabel}</p>}
                  </div>
                )}

                {username && (
                  <p className="text-sm opacity-60">@{username}</p>
                )}
              </div>

              {/* Branding */}
              <div className="absolute bottom-6 left-0 right-0 text-center">
                <p className="text-[10px] uppercase tracking-[0.2em] opacity-40">IRON TRAINING</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 w-full">
              <button
                onClick={downloadCard}
                disabled={downloading}
                className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                {downloading ? 'Gerando...' : 'Baixar Imagem'}
              </button>
              <button
                onClick={shareCard}
                className="flex-1 flex items-center justify-center gap-2 bg-secondary text-foreground py-3 rounded-xl text-sm font-medium hover:bg-secondary/80 transition-colors"
              >
                <Share2 className="w-4 h-4" />
                Compartilhar
              </button>
            </div>

            <button onClick={onClose} className="p-2 rounded-full bg-secondary text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
