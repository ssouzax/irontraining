import { useState, useEffect } from 'react';
import { Bookmark, Loader2, FolderPlus, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SavedPost {
  id: string;
  post_id: string;
  collection_name: string;
  created_at: string;
  post?: {
    id: string;
    media_urls: string[] | null;
    caption: string | null;
    likes_count: number;
    comments_count: number;
  };
}

export default function SavedPostsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [saved, setSaved] = useState<SavedPost[]>([]);
  const [collections, setCollections] = useState<string[]>([]);
  const [activeCollection, setActiveCollection] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [newCollName, setNewCollName] = useState('');
  const [showNewColl, setShowNewColl] = useState(false);

  useEffect(() => { loadSaved(); }, [user]);

  const loadSaved = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('saved_posts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!data) { setLoading(false); return; }

    const postIds = data.map(s => s.post_id);
    const { data: posts } = postIds.length > 0
      ? await supabase.from('posts').select('id, media_urls, caption, likes_count, comments_count').in('id', postIds)
      : { data: [] };

    const postMap = new Map((posts || []).map(p => [p.id, p]));
    const enriched = data.map(s => ({ ...s, post: postMap.get(s.post_id) || undefined }));
    setSaved(enriched);

    const colls = [...new Set(data.map(s => s.collection_name))];
    setCollections(colls);
    setLoading(false);
  };

  const createCollection = () => {
    if (!newCollName.trim()) return;
    setCollections(prev => [...new Set([...prev, newCollName.trim()])]);
    setActiveCollection(newCollName.trim());
    setNewCollName('');
    setShowNewColl(false);
  };

  const filtered = activeCollection
    ? saved.filter(s => s.collection_name === activeCollection)
    : saved;

  return (
    <div className="max-w-xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bookmark className="w-5 h-5 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Salvos</h1>
        </div>
        <button onClick={() => setShowNewColl(!showNewColl)}
          className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground">
          <FolderPlus className="w-4 h-4" />
        </button>
      </motion.div>

      {showNewColl && (
        <div className="flex gap-2 mb-4">
          <input value={newCollName} onChange={e => setNewCollName(e.target.value)}
            placeholder="Nome da coleção..."
            className="flex-1 px-3 py-2 rounded-lg bg-secondary text-sm text-foreground border border-border"
          />
          <button onClick={createCollection}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">
            Criar
          </button>
        </div>
      )}

      {/* Collection tabs */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-4">
        <button onClick={() => setActiveCollection(null)}
          className={cn("px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 transition-colors",
            !activeCollection ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
          )}>
          Todos ({saved.length})
        </button>
        {collections.map(c => (
          <button key={c} onClick={() => setActiveCollection(c)}
            className={cn("px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 transition-colors",
              activeCollection === c ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
            )}>
            {c} ({saved.filter(s => s.collection_name === c).length})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Bookmark className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Nenhum post salvo</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-0.5">
          {filtered.map(s => (
            <div key={s.id} className="aspect-square bg-secondary overflow-hidden cursor-pointer hover:opacity-80 transition-opacity">
              {s.post?.media_urls?.[0] ? (
                <img src={s.post.media_urls[0]} alt="" className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground p-2 text-center">
                  {s.post?.caption?.slice(0, 60) || 'Post salvo'}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
