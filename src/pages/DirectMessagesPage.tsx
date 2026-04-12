import { useState, useEffect } from 'react';
import { ArrowLeft, Search, Plus, Loader2, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface ConversationItem {
  conversation_id: string;
  other_user_id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
}

interface SearchResult {
  user_id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
}

export default function DirectMessagesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => { loadConversations(); }, [user]);

  const loadConversations = async () => {
    if (!user) return;
    setLoading(true);
    const { data: parts } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', user.id);
    if (!parts || parts.length === 0) { setLoading(false); return; }

    const convIds = parts.map(p => p.conversation_id);

    // Get other participants
    const { data: allParts } = await supabase
      .from('conversation_participants')
      .select('conversation_id, user_id')
      .in('conversation_id', convIds)
      .neq('user_id', user.id);

    if (!allParts || allParts.length === 0) { setLoading(false); return; }

    const otherUserIds = [...new Set(allParts.map(p => p.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, display_name, username, avatar_url')
      .in('user_id', otherUserIds);
    const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));

    // Get last message per conversation
    const items: ConversationItem[] = [];
    for (const convId of convIds) {
      const otherPart = allParts.find(p => p.conversation_id === convId);
      if (!otherPart) continue;
      const prof = profileMap.get(otherPart.user_id);

      const { data: lastMsg } = await supabase
        .from('messages')
        .select('content, created_at')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const { count: unread } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('conversation_id', convId)
        .neq('sender_id', user.id)
        .eq('is_read', false);

      items.push({
        conversation_id: convId,
        other_user_id: otherPart.user_id,
        display_name: prof?.display_name || null,
        username: prof?.username || null,
        avatar_url: prof?.avatar_url || null,
        last_message: lastMsg?.content || null,
        last_message_at: lastMsg?.created_at || null,
        unread_count: unread || 0,
      });
    }

    items.sort((a, b) => {
      if (!a.last_message_at) return 1;
      if (!b.last_message_at) return -1;
      return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime();
    });

    setConversations(items);
    setLoading(false);
  };

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const timeout = setTimeout(async () => {
      setSearching(true);
      const q = searchQuery.trim();
      const { data } = await supabase
        .from('profiles')
        .select('user_id, display_name, username, avatar_url')
        .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
        .neq('user_id', user?.id || '')
        .limit(20);
      setSearchResults((data || []) as SearchResult[]);
      setSearching(false);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery, user]);

  const openOrCreateConversation = async (targetUserId: string) => {
    if (!user) return;
    // Check if conversation exists
    const existing = conversations.find(c => c.other_user_id === targetUserId);
    if (existing) {
      navigate(`/direct/${existing.conversation_id}`);
      return;
    }
    // Create new conversation
    const { data: conv } = await supabase.from('conversations').insert({}).select('id').single();
    if (!conv) return;
    await supabase.from('conversation_participants').insert([
      { conversation_id: conv.id, user_id: user.id },
      { conversation_id: conv.id, user_id: targetUserId },
    ]);
    navigate(`/direct/${conv.id}`);
  };

  const getName = (c: ConversationItem | SearchResult) => c.display_name || c.username || 'Atleta';

  return (
    <div className="max-w-xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between px-1 mb-4">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/feed')} className="p-1.5 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-foreground tracking-tight">Mensagens</h1>
        </div>
        <button onClick={() => setShowSearch(true)}
          className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
          <Plus className="w-5 h-5" />
        </button>
      </motion.div>

      {/* New conversation search */}
      <AnimatePresence>
        {showSearch && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="mb-4 overflow-hidden">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                autoFocus
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar usuário..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-secondary/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            {searching && <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-primary" /></div>}
            {searchResults.length > 0 && (
              <div className="mt-2 bg-card rounded-xl border border-border overflow-hidden">
                {searchResults.map(u => (
                  <button key={u.user_id} onClick={() => { openOrCreateConversation(u.user_id); setShowSearch(false); setSearchQuery(''); }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors text-left">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                      {u.avatar_url ? <img src={u.avatar_url} className="w-full h-full object-cover" /> : <span className="text-sm font-bold text-primary">{getName(u).charAt(0).toUpperCase()}</span>}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{getName(u)}</p>
                      {u.username && <p className="text-xs text-muted-foreground">@{u.username}</p>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Conversations list */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : conversations.length === 0 ? (
        <div className="text-center py-16">
          <MessageCircle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">Nenhuma conversa ainda.</p>
          <button onClick={() => setShowSearch(true)} className="mt-3 text-sm text-primary font-medium">Iniciar conversa</button>
        </div>
      ) : (
        <div className="space-y-1">
          {conversations.map(c => (
            <button key={c.conversation_id}
              onClick={() => navigate(`/direct/${c.conversation_id}`)}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-secondary/50 transition-colors text-left">
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                  {c.avatar_url ? <img src={c.avatar_url} className="w-full h-full object-cover" /> : <span className="text-lg font-bold text-primary">{getName(c).charAt(0).toUpperCase()}</span>}
                </div>
                {c.unread_count > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                    {c.unread_count > 9 ? '9+' : c.unread_count}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className={cn("text-sm truncate", c.unread_count > 0 ? "font-bold text-foreground" : "font-medium text-foreground")}>{getName(c)}</p>
                  {c.last_message_at && (
                    <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                      {formatDistanceToNow(new Date(c.last_message_at), { addSuffix: false, locale: ptBR })}
                    </span>
                  )}
                </div>
                {c.last_message && (
                  <p className={cn("text-xs truncate mt-0.5", c.unread_count > 0 ? "text-foreground font-medium" : "text-muted-foreground")}>
                    {c.last_message}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
