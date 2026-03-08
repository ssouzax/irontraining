import { useState, useEffect } from 'react';
import { Compass, Flame, Trophy, TrendingUp, Loader2, Heart, MessageCircle, User, Crown, MapPin, Dumbbell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';

interface TrendingPost {
  post_id: string;
  user_id: string;
  post_type: string;
  caption: string | null;
  exercise_name: string | null;
  weight: number | null;
  reps: number | null;
  estimated_1rm: number | null;
  is_pr: boolean;
  likes_count: number;
  comments_count: number;
  media_urls: string[] | null;
  created_at: string;
  engagement_score: number;
  boost_multiplier: number;
  profile?: { display_name: string | null; username: string | null; avatar_url: string | null; email: string | null };
}

interface TrendingGym {
  gym_id: string;
  gym_name: string;
  city: string | null;
  total_prs: number;
  top_squat: number;
  top_bench: number;
  top_deadlift: number;
  intensity_score: number;
  member_count: number;
}

type ExploreTab = 'trending' | 'prs' | 'gyms';

export function MobileExplore() {
  const { user } = useAuth();
  const [tab, setTab] = useState<ExploreTab>('trending');
  const [trendingPosts, setTrendingPosts] = useState<TrendingPost[]>([]);
  const [trendingGyms, setTrendingGyms] = useState<TrendingGym[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  useEffect(() => { loadData(); }, [user]);

  const loadData = async () => {
    setLoading(true);
    const [postsRes, gymsRes, likesRes] = await Promise.all([
      supabase.rpc('get_trending_posts', { limit_count: 30 }),
      supabase.rpc('get_gym_heatmap', { days_back: 7 }),
      user ? supabase.from('likes').select('post_id').eq('user_id', user.id) : Promise.resolve({ data: [] }),
    ]);

    if (postsRes.data) {
      const userIds = [...new Set((postsRes.data as any[]).map((p: any) => p.user_id))];
      const { data: profiles } = await supabase.from('profiles').select('user_id, display_name, username, avatar_url, email').in('user_id', userIds);
      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
      setTrendingPosts((postsRes.data as any[]).map(p => ({ ...p, profile: profileMap.get(p.user_id) })));
    }

    if (gymsRes.data) setTrendingGyms(gymsRes.data as TrendingGym[]);
    if (likesRes.data) setLikedPosts(new Set((likesRes.data as any[]).map((l: any) => l.post_id)));
    setLoading(false);
  };

  const toggleLike = async (postId: string) => {
    if (!user) return;
    if (likedPosts.has(postId)) {
      await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', user.id);
      setLikedPosts(prev => { const n = new Set(prev); n.delete(postId); return n; });
      setTrendingPosts(prev => prev.map(p => p.post_id === postId ? { ...p, likes_count: Math.max(0, p.likes_count - 1) } : p));
    } else {
      await supabase.from('likes').insert({ post_id: postId, user_id: user.id });
      setLikedPosts(prev => new Set(prev).add(postId));
      setTrendingPosts(prev => prev.map(p => p.post_id === postId ? { ...p, likes_count: p.likes_count + 1 } : p));
    }
  };

  const prPosts = trendingPosts.filter(p => p.is_pr);
  const displayPosts = tab === 'prs' ? prPosts : trendingPosts;

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Compass className="w-5 h-5 text-primary" /> Explorar
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">Descubra lifts virais e academias em alta</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 px-4 pb-3 overflow-x-auto">
        {([
          { key: 'trending' as ExploreTab, icon: Flame, label: 'Em Alta' },
          { key: 'prs' as ExploreTab, icon: Trophy, label: 'PRs do Dia' },
          { key: 'gyms' as ExploreTab, icon: MapPin, label: 'Top Academias' },
        ]).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={cn("flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap shrink-0 transition-colors",
              tab === t.key ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
            )}>
            <t.icon className="w-3.5 h-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {/* Trending Posts / PRs */}
      {(tab === 'trending' || tab === 'prs') && (
        <div className="divide-y divide-border">
          {displayPosts.length === 0 ? (
            <div className="text-center py-12 px-4">
              <Dumbbell className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Nenhum post em alta esta semana</p>
            </div>
          ) : displayPosts.map((post, i) => (
            <motion.div key={post.post_id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
              className="bg-card px-4 py-3">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                  {post.profile?.avatar_url ? (
                    <img src={post.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-4 h-4 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{post.profile?.display_name || 'Atleta'}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ptBR })}
                  </p>
                </div>
                {post.engagement_score > 10 && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-destructive/10 text-destructive text-[10px] font-medium">
                    <Flame className="w-3 h-3" /> Viral
                  </span>
                )}
              </div>

              {post.exercise_name && (
                <div className={cn("p-3 rounded-xl mb-2",
                  post.is_pr ? "bg-gradient-to-r from-primary/10 to-accent/5 border border-primary/15" : "bg-secondary/30"
                )}>
                  {post.is_pr && (
                    <div className="flex items-center gap-1 mb-1">
                      <Trophy className="w-3.5 h-3.5 text-warning" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-warning">PR!</span>
                    </div>
                  )}
                  <p className="text-sm font-bold text-foreground">{post.exercise_name}</p>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    {post.weight && <span className="text-xl font-extrabold text-foreground">{post.weight}<span className="text-xs">kg</span></span>}
                    {post.reps && <span className="text-sm text-muted-foreground">× {post.reps}</span>}
                  </div>
                  {post.estimated_1rm && <p className="text-[11px] text-primary font-medium mt-0.5">E1RM: {post.estimated_1rm}kg</p>}
                </div>
              )}

              {post.caption && <p className="text-sm text-foreground/80 mb-2">{post.caption}</p>}

              {post.media_urls && post.media_urls.length > 0 && (
                <div className="rounded-lg overflow-hidden mb-2">
                  <img src={post.media_urls[0]} alt="" className="w-full max-h-48 object-cover" />
                </div>
              )}

              <div className="flex items-center gap-4">
                <button onClick={() => toggleLike(post.post_id)} className="flex items-center gap-1">
                  <Heart className={cn("w-4 h-4", likedPosts.has(post.post_id) ? "fill-destructive text-destructive" : "text-muted-foreground")} />
                  <span className="text-xs text-muted-foreground">{post.likes_count}</span>
                </button>
                <div className="flex items-center gap-1">
                  <MessageCircle className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{post.comments_count}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Top Gyms */}
      {tab === 'gyms' && (
        <div className="px-4 space-y-3">
          {trendingGyms.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Nenhuma academia ativa esta semana</p>
            </div>
          ) : trendingGyms.map((gym, i) => (
            <motion.div key={gym.gym_id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className={cn("rounded-2xl border p-4", i < 3 ? "bg-gradient-to-r from-primary/10 to-card border-primary/20" : "bg-card border-border")}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    {i < 3 && (
                      <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold",
                        i === 0 ? "bg-yellow-500/20 text-yellow-400" : i === 1 ? "bg-gray-400/20 text-gray-400" : "bg-amber-700/20 text-amber-600"
                      )}>#{i + 1}</div>
                    )}
                    <span className="text-sm font-bold text-foreground">{gym.gym_name}</span>
                  </div>
                  {gym.city && (
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" /> {gym.city}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <User className="w-3 h-3" /> {gym.member_count}
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'PRs', val: gym.total_prs, emoji: '🏆' },
                  { label: 'SQT', val: gym.top_squat > 0 ? `${gym.top_squat}` : '—', emoji: '' },
                  { label: 'BNC', val: gym.top_bench > 0 ? `${gym.top_bench}` : '—', emoji: '' },
                  { label: 'DL', val: gym.top_deadlift > 0 ? `${gym.top_deadlift}` : '—', emoji: '' },
                ].map(s => (
                  <div key={s.label} className="text-center p-1.5 rounded-lg bg-background/50">
                    <p className="text-[10px] text-muted-foreground">{s.label}</p>
                    <p className="text-sm font-bold text-foreground">{s.emoji}{s.val}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
