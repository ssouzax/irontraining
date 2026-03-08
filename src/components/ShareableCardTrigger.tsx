import { useState } from 'react';
import { Share2 } from 'lucide-react';
import ShareableCard from './ShareableCard';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ShareableCardTriggerProps {
  type: 'achievement' | 'pr' | 'streak';
  title: string;
  subtitle: string;
  stat?: string;
  statLabel?: string;
  icon?: string;
  username?: string;
  autoPost?: boolean;
  exerciseName?: string;
  weight?: number;
  reps?: number;
  estimated1rm?: number;
}

export function ShareableCardTrigger({
  type, title, subtitle, stat, statLabel, icon, username,
  autoPost, exerciseName, weight, reps, estimated1rm,
}: ShareableCardTriggerProps) {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();

  const handleAutoPost = async () => {
    if (!user || !autoPost) return;
    try {
      await supabase.from('posts').insert({
        user_id: user.id,
        post_type: type === 'pr' ? 'pr' : 'achievement',
        caption: `${type === 'pr' ? '🏆 Novo PR' : '🎖️ Conquista'}: ${title} — ${subtitle}`,
        exercise_name: exerciseName || null,
        weight: weight || null,
        reps: reps || null,
        estimated_1rm: estimated1rm || null,
        is_pr: type === 'pr',
      });
      toast.success('PR publicado no feed!');
    } catch {
      toast.error('Erro ao publicar');
    }
  };

  return (
    <>
      <button
        onClick={() => {
          setOpen(true);
          if (autoPost) handleAutoPost();
        }}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
      >
        <Share2 className="w-3.5 h-3.5" />
        Compartilhar
      </button>
      <ShareableCard
        open={open}
        onClose={() => setOpen(false)}
        type={type}
        title={title}
        subtitle={subtitle}
        stat={stat}
        statLabel={statLabel}
        icon={icon}
        username={username}
      />
    </>
  );
}
