import { useState, useEffect, useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { Crown, Sparkles, Gift, ShoppingBag, Star, Filter, Flame, Award, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ShopItem {
  id: string;
  name: string;
  description: string;
  category: string;
  item_type: string;
  price_cents: number;
  rarity: string;
  preview_url: string | null;
  metadata: any;
  is_seasonal: boolean;
}

const RARITY_COLORS: Record<string, string> = {
  common: 'border-muted-foreground/30 bg-muted/20',
  rare: 'border-info/40 bg-info/5',
  epic: 'border-primary/40 bg-primary/5',
  legendary: 'border-warning/40 bg-warning/5 shadow-[0_0_20px_-8px_hsl(var(--warning)/0.3)]',
};

const RARITY_LABELS: Record<string, { label: string; color: string }> = {
  common: { label: 'Comum', color: 'text-muted-foreground' },
  rare: { label: 'Raro', color: 'text-info' },
  epic: { label: 'Épico', color: 'text-primary' },
  legendary: { label: 'Lendário', color: 'text-warning' },
};

const CATEGORY_ICONS: Record<string, any> = {
  avatar: Crown,
  skin: Sparkles,
  effect: Flame,
  lootbox: Gift,
  badge: Award,
};

const CATEGORY_LABELS: Record<string, string> = {
  all: 'Todos',
  avatar: 'Avatares',
  skin: 'Skins',
  effect: 'Efeitos',
  lootbox: 'Lootboxes',
  badge: 'Badges',
};

function ItemCard({ item, owned, delay }: { item: ShopItem; owned: boolean; delay: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-20px' });
  const price = (item.price_cents / 100).toFixed(2).replace('.', ',');
  const Icon = CATEGORY_ICONS[item.category] || Package;
  const rarity = RARITY_LABELS[item.rarity] || RARITY_LABELS.common;

  const EMOJI_MAP: Record<string, string> = {
    avatar: '🛡️',
    skin: '✨',
    effect: '🔥',
    lootbox: '🎁',
    badge: '🏅',
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.5, delay }}
      whileHover={{ scale: 1.04, y: -4 }}
      className={cn(
        'relative p-5 rounded-2xl border cursor-pointer transition-all group overflow-hidden',
        owned ? 'border-success/40 bg-success/5' : RARITY_COLORS[item.rarity]
      )}
    >
      {item.is_seasonal && (
        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-destructive/20 text-destructive text-[9px] font-bold">
          SAZONAL
        </div>
      )}

      <div className="flex flex-col items-center text-center">
        <motion.div
          animate={item.rarity === 'legendary' ? { rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] } : {}}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="text-4xl mb-3"
        >
          {EMOJI_MAP[item.category] || '🎯'}
        </motion.div>

        <span className={cn('text-[10px] font-bold uppercase tracking-wider mb-1', rarity.color)}>
          {rarity.label}
        </span>
        <h3 className="font-bold text-foreground text-sm mb-1">{item.name}</h3>
        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{item.description}</p>

        {owned ? (
          <span className="text-xs font-bold text-success flex items-center gap-1">
            <Star className="w-3 h-3" /> Na sua coleção
          </span>
        ) : (
          <Button size="sm" className="rounded-xl text-xs font-bold gap-1">
            <ShoppingBag className="w-3 h-3" />
            R${price}
          </Button>
        )}
      </div>
    </motion.div>
  );
}

export default function ShopPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<ShopItem[]>([]);
  const [ownedIds, setOwnedIds] = useState<Set<string>>(new Set());
  const [category, setCategory] = useState('all');

  useEffect(() => {
    supabase.from('shop_items').select('*').eq('is_active', true).order('rarity').then(({ data }) => {
      if (data) setItems(data);
    });

    if (user) {
      supabase.from('user_inventory').select('item_id').eq('user_id', user.id).then(({ data }) => {
        if (data) setOwnedIds(new Set(data.map(d => d.item_id)));
      });
    }
  }, [user]);

  const filtered = category === 'all' ? items : items.filter(i => i.category === category);

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="text-center mb-10">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="w-16 h-16 rounded-2xl bg-warning/10 flex items-center justify-center mx-auto mb-4"
        >
          <ShoppingBag className="w-8 h-8 text-warning" />
        </motion.div>
        <h1 className="text-4xl font-extrabold mb-2">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-warning to-primary">Loja</span>
        </h1>
        <p className="text-muted-foreground">Avatares, skins, efeitos e itens exclusivos</p>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-8 justify-center flex-wrap">
        {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setCategory(key)}
            className={cn(
              'px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap',
              category === key
                ? 'bg-primary text-primary-foreground shadow'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Items grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map((item, i) => (
          <ItemCard
            key={item.id}
            item={item}
            owned={ownedIds.has(item.id)}
            delay={i * 0.05}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nenhum item nesta categoria</p>
        </div>
      )}
    </div>
  );
}
