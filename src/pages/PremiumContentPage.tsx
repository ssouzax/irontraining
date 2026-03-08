import { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Play, BookOpen, FileText, Dumbbell, Lock, Crown, Star, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { usePremium } from '@/hooks/usePremium';
import { cn } from '@/lib/utils';
import { PremiumBadge } from '@/components/PremiumGate';

interface Content {
  id: string;
  title: string;
  description: string;
  content_type: string;
  thumbnail_url: string | null;
  min_tier: string;
  price_cents: number;
  author_name: string | null;
  category: string;
}

const TYPE_ICONS: Record<string, any> = {
  video: Play,
  program: Dumbbell,
  ebook: BookOpen,
  guide: FileText,
};

const TYPE_LABELS: Record<string, string> = {
  all: 'Todos',
  video: 'Vídeos',
  program: 'Programas',
  ebook: 'E-books',
  guide: 'Guias',
};

function ContentCard({ content, hasAccess, purchased, delay }: {
  content: Content; hasAccess: boolean; purchased: boolean; delay: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-20px' });
  const Icon = TYPE_ICONS[content.content_type] || FileText;
  const unlocked = hasAccess || purchased;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay }}
      whileHover={{ scale: 1.02, y: -4 }}
      className={cn(
        'relative rounded-2xl border overflow-hidden cursor-pointer group',
        unlocked ? 'border-border/50 bg-card/60' : 'border-border/30 bg-card/30'
      )}
    >
      {/* Thumbnail area */}
      <div className="relative h-40 bg-gradient-to-br from-primary/10 to-secondary flex items-center justify-center">
        {!unlocked && (
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center z-10">
            <Lock className="w-8 h-8 text-muted-foreground" />
          </div>
        )}
        <Icon className="w-12 h-12 text-primary/40" />
        <div className="absolute top-3 left-3">
          <PremiumBadge small />
        </div>
      </div>

      <div className="p-4">
        <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
          {TYPE_LABELS[content.content_type] || content.content_type}
        </span>
        <h3 className="font-bold text-foreground text-sm mt-1 mb-1 line-clamp-1">{content.title}</h3>
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{content.description}</p>

        {content.author_name && (
          <p className="text-[10px] text-muted-foreground mb-3">
            Por <span className="text-foreground font-medium">{content.author_name}</span>
          </p>
        )}

        {unlocked ? (
          <Button size="sm" className="w-full rounded-xl text-xs gap-1">
            <Play className="w-3 h-3" /> Acessar
          </Button>
        ) : content.price_cents > 0 ? (
          <Button size="sm" variant="secondary" className="w-full rounded-xl text-xs gap-1">
            Comprar R${(content.price_cents / 100).toFixed(2).replace('.', ',')}
          </Button>
        ) : (
          <Button size="sm" variant="secondary" className="w-full rounded-xl text-xs gap-1" onClick={() => {}}>
            <Crown className="w-3 h-3" /> Assinar para acessar
          </Button>
        )}
      </div>
    </motion.div>
  );
}

export default function PremiumContentPage() {
  const { user } = useAuth();
  const { tier, hasAccess } = usePremium();
  const [contents, setContents] = useState<Content[]>([]);
  const [purchasedIds, setPurchasedIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    supabase.from('premium_content').select('*').eq('is_active', true).order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setContents(data); });

    if (user) {
      supabase.from('content_purchases').select('content_id').eq('user_id', user.id)
        .then(({ data }) => { if (data) setPurchasedIds(new Set(data.map(d => d.content_id))); });
    }
  }, [user]);

  const filtered = filter === 'all' ? contents : contents.filter(c => c.content_type === filter);

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="text-center mb-10">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4"
        >
          <BookOpen className="w-8 h-8 text-primary" />
        </motion.div>
        <h1 className="text-4xl font-extrabold mb-2">
          Conteúdo <span className="text-gradient">Premium</span>
        </h1>
        <p className="text-muted-foreground">Vídeos, programas e guias exclusivos de especialistas</p>
      </div>

      {/* Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-8 justify-center flex-wrap">
        {Object.entries(TYPE_LABELS).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={cn(
              'px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap',
              filter === key ? 'bg-primary text-primary-foreground shadow' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((c, i) => (
          <ContentCard
            key={c.id}
            content={c}
            hasAccess={hasAccess(c.min_tier as any)}
            purchased={purchasedIds.has(c.id)}
            delay={i * 0.05}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nenhum conteúdo disponível nesta categoria</p>
        </div>
      )}
    </div>
  );
}
