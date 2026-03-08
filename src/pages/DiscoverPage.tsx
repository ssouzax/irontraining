import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Trophy, TrendingUp, Flame, Crown, Star, Heart, MessageCircle, Dumbbell, Users, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

interface TrendingPost {
  id: string;
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
  created_at: string;
  display_name?: string;
  avatar_url?: string;
}

interface TopAthlete {
  user_id: string;
  display_name: string;
  username: string | null;
  avatar_url: string | null;
  dots_score: number;
  total: number;
  league: string;
}

interface Season {
  id: number;
  season_number: number;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

export default function DiscoverPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'trending' | 'athletes' | 'prs'>('trending');
  const [trendingPosts, setTrendingPosts] = useState<TrendingPost[]>([]);
  const [topAthletes, setTopAthletes] = useState<TopAthlete[]>([]);
  const [prPosts, setPrPosts] = useState<TrendingPost[]>([]);
  const [season, setSeason] = useState<Season | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([loadTrending(), loadTopAthletes(), loadPRsOfDay(), loadSeason()]);
    setLoading(false);
  };

  const loadTrending = async () => {
    const { data } = await supabase
      .from('posts')
      .select('*')
      .order('likes_count', { ascending: false })
      .limit(20);
    if (!data) return;

    const userIds = [...new Set(data.map(p => p.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, display_name, avatar_url, email')
      .in('user_id', userIds);

    const pMap = new Map((profiles || []).map(p => [p.user_id, p]));
    setTrendingPosts(data.map(p => ({
      ...p,
      is_pr: p.is_pr ?? false,
      likes_count: p.likes_count ?? 0,
      comments_count: p.comments_count ?? 0,
      display_name: pMap.get(p.user_id)?.display_name || pMap.get(p.user_id)?.email?.split('@')[0] || 'Atleta',
      avatar_url: pMap.get(p.user_id)?.avatar_url,
    })));
  };

  const loadTopAthletes = async () => {
    const { data } = await supabase.rpc('get_dots_leaderboard', { min_bw: 0, max_bw: 999 });
    if (data) {
      // Need user_ids - fetch from leaderboard_scores
      const { data: scores } = await supabase.from('leaderboard_scores').select('user_id, dots_score, total, league').order('dots_score', { ascending: false }).limit(20);
      if (!scores) return;
      const userIds = scores.map(s => s.user_id);
      const { data: profiles } = await supabase.from('profiles').select('user_id, display_name, username, avatar_url').in('user_id', userIds);
      const pMap = new Map((profiles || []).map(p => [p.user_id, p]));
      setTopAthletes(scores.map(s => ({
        user_id: s.user_id,
        display_name: pMap.get(s.user_id)?.display_name || 'Atleta',
        username: pMap.get(s.user_id)?.username || null,
        avatar_url: pMap.get(s.user_id)?.avatar_url || null,
        dots_score: s.dots_score || 0,
        total: s.total || 0,
        league: s.league || 'bronze_3',
      })));
    }
  };

  const loadPRsOfDay = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { data } = await supabase
      .from('posts')
      .select('*')
      .eq('is_pr', true)
      .gte('created_at', today.toISOString())
      .order('estimated_1rm', { ascending: false })
      .limit(20);
    if (!data) return;

    const userIds = [...new Set(data.map(p => p.user_id))];
    const { data: profiles } = userIds.length > 0
      ? await supabase.from('profiles').select('user_id, display_name, avatar_url, email').in('user_id', userIds)
      : { data: [] };

    const pMap = new Map((profiles || []).map(p => [p.user_id, p]));
    setPrPosts(data.map(p => ({
      ...p,
      is_pr: p.is_pr ?? false,
      likes_count: p.likes_count ?? 0,
      comments_count: p.comments_count ?? 0,
      display_name: pMap.get(p.user_id)?.display_name || pMap.get(p.user_id)?.email?.split('@')[0] || 'Atleta',
      avatar_url: pMap.get(p.user_id)?.avatar_url,
    })));
  };

  const loadSeason = async () => {
    const { data } = await supabase.from('seasons').select('*').eq('is_active', true).single();
    if (data) setSeason(data as Season);
  };

  const daysLeft = season ? Math.max(0, Math.ceil((new Date(season.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0;

  const tabs = [
    { key: 'trending' as const, label: 'Em Alta', icon: Flame },
    { key: 'athletes' as const, label: 'Top Atletas', icon: Crown },
    { key: 'prs' as const, label: 'PRs do Dia', icon: Trophy },
  ];

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Explorar</h1>
        <p className="text-muted-foreground mt-1">Descubra atletas e PRs incríveis</p>
      </motion.div>

      {/* Season Banner */}
      {season && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-xl p-4 bg-gradient-to-r from-primary/20 to-accent/10 border border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-primary">Temporada Ativa</p>
              <p className="text-sm font-semibold text-foreground mt-0.5">{season.name}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-foreground">{daysLeft}</p>
              <p className="text-[10px] text-muted-foreground">dias restantes</p>
            </div>
          </div>
          <div className="mt-3 h-1.5 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${Math.max(5, 100 - (daysLeft / 90) * 100)}%` }}
            />
          </div>
        </motion.div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary/50 rounded-xl p-1">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn("flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors",
              tab === t.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Trending Posts */}
          {tab === 'trending' && (
            <div className="space-y-3">
              {trendingPosts.length === 0 ? (
                <EmptyState text="Nenhum post em alta ainda" />
              ) : trendingPosts.map(post => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}

          {/* Top Athletes */}
          {tab === 'athletes' && (
            <div className="space-y-2">
              {topAthletes.length === 0 ? (
                <EmptyState text="Nenhum atleta registrado no ranking" />
              ) : topAthletes.map((athlete, i) => (
                <motion.div
                  key={athlete.user_id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => navigate(`/athlete/${athlete.user_id}`)}
                  className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border card-elevated cursor-pointer hover:bg-secondary/30 transition-colors"
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                    i === 0 ? "bg-yellow-500/20 text-yellow-400" :
                    i === 1 ? "bg-gray-400/20 text-gray-400" :
                    i === 2 ? "bg-amber-700/20 text-amber-600" :
                    "bg-secondary text-muted-foreground"
                  )}>
                    {i + 1}
                  </div>
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                    {athlete.display_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{athlete.display_name}</p>
                    {athlete.username && <p className="text-xs text-muted-foreground">@{athlete.username}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-primary">{athlete.dots_score}</p>
                    <p className="text-[10px] text-muted-foreground">DOTS · {athlete.total}kg</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* PRs of the Day */}
          {tab === 'prs' && (
            <div className="space-y-3">
              {prPosts.length === 0 ? (
                <EmptyState text="Nenhum PR registrado hoje. Seja o primeiro!" />
              ) : prPosts.map(post => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function PostCard({ post }: { post: TrendingPost }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl border border-border card-elevated overflow-hidden"
    >
      <div className="flex items-center gap-3 p-4">
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
          {(post.display_name || 'A').charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">{post.display_name}</p>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ptBR })}
          </p>
        </div>
        {post.is_pr && (
          <span className="text-[10px] font-bold uppercase bg-warning/20 text-warning px-2 py-0.5 rounded">PR</span>
        )}
      </div>

      {post.exercise_name && (
        <div className={cn("mx-4 mb-3 p-3 rounded-lg",
          post.is_pr ? "bg-gradient-to-r from-primary/10 to-warning/10 border border-primary/20" : "bg-secondary/30"
        )}>
          <div className="flex items-center gap-2">
            {post.is_pr ? <Trophy className="w-4 h-4 text-warning" /> : <Dumbbell className="w-4 h-4 text-primary" />}
            <span className="text-sm font-medium text-foreground">{post.exercise_name}</span>
          </div>
          <div className="flex gap-3 mt-1">
            {post.weight && <span className="text-xs text-foreground font-mono">{post.weight}kg</span>}
            {post.reps && <span className="text-xs text-muted-foreground">×{post.reps}</span>}
            {post.estimated_1rm && <span className="text-xs text-primary">E1RM: {post.estimated_1rm}kg</span>}
          </div>
        </div>
      )}

      {post.caption && <p className="px-4 pb-3 text-sm text-foreground">{post.caption}</p>}

      <div className="flex items-center gap-4 px-4 py-2.5 border-t border-border">
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Heart className="w-3.5 h-3.5" /> {post.likes_count}
        </span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <MessageCircle className="w-3.5 h-3.5" /> {post.comments_count}
        </span>
      </div>
    </motion.div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="text-center py-16">
      <Star className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
