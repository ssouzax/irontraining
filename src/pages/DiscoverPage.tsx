import { motion } from 'framer-motion';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Trophy, TrendingUp, Flame, Crown, Star, Heart, MessageCircle, Dumbbell, Users, Loader2, Search, X, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useFollows } from '@/hooks/useFollows';
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
  media_urls: string[] | null;
  created_at: string;
  display_name?: string;
  avatar_url?: string;
}

interface SearchUser {
  user_id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
}

export default function DiscoverPage() {
  const { user } = useAuth();
  const { isFollowing, toggleFollow } = useFollows();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'popular' | 'athletes' | 'prs'>('popular');
  const [popularPosts, setPopularPosts] = useState<TrendingPost[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<SearchUser[]>([]);
  const [hashtags, setHashtags] = useState<{ tag: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([loadPopular(), loadSuggested(), loadHashtags()]);
    setLoading(false);
  };

  const loadPopular = async () => {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const { data } = await supabase
      .from('posts')
      .select('*')
      .gte('created_at', twoDaysAgo.toISOString())
      .order('likes_count', { ascending: false })
      .limit(30);
    if (!data) return;
    const userIds = [...new Set(data.map(p => p.user_id))];
    const { data: profiles } = userIds.length > 0
      ? await supabase.from('profiles').select('user_id, display_name, avatar_url, email').in('user_id', userIds)
      : { data: [] };
    const pMap = new Map((profiles || []).map(p => [p.user_id, p]));
    setPopularPosts(data.map(p => ({
      ...p, is_pr: p.is_pr ?? false, likes_count: p.likes_count ?? 0, comments_count: p.comments_count ?? 0,
      display_name: pMap.get(p.user_id)?.display_name || pMap.get(p.user_id)?.email?.split('@')[0] || 'Atleta',
      avatar_url: pMap.get(p.user_id)?.avatar_url,
    })));
  };

  const loadSuggested = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('user_id, display_name, username, avatar_url')
      .neq('user_id', user.id)
      .limit(20);
    if (data) setSuggestedUsers(data);
  };

  const loadHashtags = async () => {
    const { data } = await supabase.from('posts').select('caption').not('caption', 'is', null).limit(500);
    if (!data) return;
    const tagCount = new Map<string, number>();
    data.forEach(p => {
      const matches = (p.caption || '').match(/#(\w+)/g);
      if (matches) matches.forEach(t => {
        const tag = t.toLowerCase();
        tagCount.set(tag, (tagCount.get(tag) || 0) + 1);
      });
    });
    const sorted = [...tagCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
    setHashtags(sorted.map(([tag, count]) => ({ tag, count })));
  };

  const handleSearch = useCallback((q: string) => {
    setSearchQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length < 2) { setSearchResults([]); setSearching(false); return; }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      const cleanQ = q.startsWith('@') ? q.slice(1) : q;
      const { data } = await supabase
        .from('profiles')
        .select('user_id, display_name, username, avatar_url')
        .or(`username.ilike.%${cleanQ}%,display_name.ilike.%${cleanQ}%`)
        .limit(20);
      setSearchResults(data || []);
      setSearching(false);
    }, 300);
  }, []);

  const isSearching = searchQuery.length >= 2;

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Explorar</h1>
      </motion.div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={searchQuery}
          onChange={e => handleSearch(e.target.value)}
          placeholder="Buscar @username ou nome..."
          className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-secondary text-sm text-foreground border border-border placeholder:text-muted-foreground"
        />
        {searchQuery && (
          <button onClick={() => { setSearchQuery(''); setSearchResults([]); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Search Results */}
      {isSearching ? (
        <div className="space-y-1">
          {searching ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
          ) : searchResults.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum resultado</p>
          ) : (
            searchResults.map(u => (
              <div key={u.user_id}
                className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border hover:bg-secondary/30 transition-colors">
                <button onClick={() => navigate(`/athlete/${u.user_id}`)} className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0 overflow-hidden">
                    {u.avatar_url ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" /> : (u.display_name || 'A').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{u.display_name || 'Atleta'}</p>
                    {u.username && <p className="text-xs text-muted-foreground">@{u.username}</p>}
                  </div>
                </button>
                {user && u.user_id !== user.id && (
                  <button onClick={() => toggleFollow(u.user_id)}
                    className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                      isFollowing(u.user_id) ? "bg-secondary text-foreground" : "bg-primary text-primary-foreground"
                    )}>
                    {isFollowing(u.user_id) ? 'Seguindo' : 'Seguir'}
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      ) : loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : (
        <>
          {/* Popular posts grid */}
          {popularPosts.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-warning" /> Populares
              </h2>
              <div className="grid grid-cols-3 gap-0.5 rounded-xl overflow-hidden">
                {popularPosts.slice(0, 9).map(p => (
                  <div key={p.id} className="aspect-square bg-secondary overflow-hidden cursor-pointer hover:opacity-80 transition-opacity relative">
                    {p.media_urls?.[0] ? (
                      <img src={p.media_urls[0]} alt="" className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center">
                        {p.is_pr && <Trophy className="w-5 h-5 text-warning mb-1" />}
                        <span className="text-[10px] text-muted-foreground">{p.exercise_name || p.caption?.slice(0, 30) || 'Post'}</span>
                      </div>
                    )}
                    <div className="absolute bottom-1 left-1 flex items-center gap-1">
                      <span className="text-[9px] text-white bg-black/50 rounded px-1 flex items-center gap-0.5">
                        <Heart className="w-2.5 h-2.5" /> {p.likes_count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggested users */}
          {suggestedUsers.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-primary" /> Sugeridos para você
              </h2>
              <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
                {suggestedUsers.filter(u => user && !isFollowing(u.user_id) && u.user_id !== user.id).slice(0, 10).map(u => (
                  <div key={u.user_id}
                    className="flex flex-col items-center gap-1.5 p-3 bg-card rounded-xl border border-border min-w-[100px] shrink-0">
                    <button onClick={() => navigate(`/athlete/${u.user_id}`)}>
                      <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold overflow-hidden">
                        {u.avatar_url ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" /> : (u.display_name || 'A').charAt(0).toUpperCase()}
                      </div>
                    </button>
                    <p className="text-xs font-medium text-foreground truncate max-w-[80px]">{u.display_name || 'Atleta'}</p>
                    <button onClick={() => toggleFollow(u.user_id)}
                      className="px-3 py-1 rounded-lg bg-primary text-primary-foreground text-[10px] font-medium">
                      Seguir
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trending hashtags */}
          {hashtags.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
                <Hash className="w-4 h-4 text-accent-foreground" /> Trending
              </h2>
              <div className="space-y-1">
                {hashtags.map((h, i) => (
                  <button key={h.tag}
                    onClick={() => navigate(`/hashtag/${h.tag.replace('#', '')}`)}
                    className="w-full flex items-center gap-3 p-2.5 bg-card rounded-lg border border-border hover:bg-secondary/30 transition-colors">
                    <span className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-muted-foreground">{i + 1}</span>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-foreground">{h.tag}</p>
                      <p className="text-[10px] text-muted-foreground">{h.count} post{h.count !== 1 ? 's' : ''}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
