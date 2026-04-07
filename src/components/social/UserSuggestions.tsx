import { useState, useEffect } from 'react';
import { UserPlus, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface SuggestedUser {
  user_id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
}

interface Props {
  followingIds: Set<string>;
  onToggleFollow: (id: string) => void;
}

export function UserSuggestions({ followingIds, onToggleFollow }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState<SuggestedUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSuggestions();
  }, [user, followingIds]);

  const loadSuggestions = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('user_id, display_name, username, avatar_url, bio')
      .neq('user_id', user.id)
      .limit(20);

    if (data) {
      const filtered = (data as SuggestedUser[]).filter(u => !followingIds.has(u.user_id));
      setSuggestions(filtered.slice(0, 10));
    }
    setLoading(false);
  };

  if (loading) return <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>;
  if (suggestions.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground px-1">Sugestões para você</h3>
      <div className="space-y-1">
        {suggestions.map(u => (
          <div key={u.user_id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50 transition-colors">
            <button onClick={() => navigate(`/athlete/${u.user_id}`)} className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                {u.avatar_url ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                  : <span className="text-sm font-bold text-primary">{(u.display_name || u.username || 'A').charAt(0).toUpperCase()}</span>}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{u.display_name || u.username || 'Atleta'}</p>
                {u.username && <p className="text-xs text-muted-foreground">@{u.username}</p>}
                {u.bio && <p className="text-xs text-muted-foreground/70 truncate">{u.bio}</p>}
              </div>
            </button>
            <button onClick={() => { onToggleFollow(u.user_id); setSuggestions(prev => prev.filter(s => s.user_id !== u.user_id)); }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shrink-0 flex items-center gap-1">
              <UserPlus className="w-3 h-3" /> Seguir
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
