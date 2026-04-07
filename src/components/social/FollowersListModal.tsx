import { useState, useEffect } from 'react';
import { X, Loader2, UserPlus, UserMinus } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface UserItem {
  user_id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
}

interface Props {
  userId: string;
  type: 'followers' | 'following';
  onClose: () => void;
  followingIds: Set<string>;
  onToggleFollow: (targetId: string) => void;
}

export function FollowersListModal({ userId, type, onClose, followingIds, onToggleFollow }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, [userId, type]);

  const loadUsers = async () => {
    const col = type === 'followers' ? 'following_id' : 'follower_id';
    const targetCol = type === 'followers' ? 'follower_id' : 'following_id';
    const { data: follows } = await supabase.from('follows').select(targetCol).eq(col, userId);
    if (!follows || follows.length === 0) { setLoading(false); return; }

    const ids = follows.map((f: any) => f[targetCol]);
    const { data: profiles } = await supabase.from('profiles')
      .select('user_id, display_name, username, avatar_url')
      .in('user_id', ids);
    if (profiles) setUsers(profiles as UserItem[]);
    setLoading(false);
  };

  const goToProfile = (uid: string) => {
    onClose();
    navigate(`/athlete/${uid}`);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center"
      onClick={onClose}>
      <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
        onClick={e => e.stopPropagation()}
        className="bg-card border border-border rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[70vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <h3 className="font-semibold text-foreground">{type === 'followers' ? 'Seguidores' : 'Seguindo'}</h3>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
          ) : users.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">Nenhum usuário</p>
          ) : users.map(u => (
            <div key={u.user_id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50 transition-colors">
              <button onClick={() => goToProfile(u.user_id)} className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                  {u.avatar_url ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                    : <span className="text-sm font-bold text-primary">{(u.display_name || u.username || 'A').charAt(0).toUpperCase()}</span>}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{u.display_name || u.username || 'Atleta'}</p>
                  {u.username && <p className="text-xs text-muted-foreground">@{u.username}</p>}
                </div>
              </button>
              {user && u.user_id !== user.id && (
                <button onClick={() => onToggleFollow(u.user_id)}
                  className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0",
                    followingIds.has(u.user_id) ? "bg-secondary text-muted-foreground" : "bg-primary text-primary-foreground"
                  )}>
                  {followingIds.has(u.user_id) ? 'Seguindo' : 'Seguir'}
                </button>
              )}
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
