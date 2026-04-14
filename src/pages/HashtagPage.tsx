import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Hash, Loader2, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';

export default function HashtagPage() {
  const { tag } = useParams<{ tag: string }>();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tag) return;
    loadPosts();
  }, [tag]);

  const loadPosts = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('posts')
      .select('id, media_urls, caption, likes_count, comments_count, created_at')
      .ilike('caption', `%#${tag}%`)
      .order('created_at', { ascending: false })
      .limit(50);
    setPosts(data || []);
    setLoading(false);
  };

  return (
    <div className="max-w-xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-1">
            <Hash className="w-5 h-5 text-primary" /> {tag}
          </h1>
          <p className="text-xs text-muted-foreground">{posts.length} post{posts.length !== 1 ? 's' : ''}</p>
        </div>
      </motion.div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : posts.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-16">Nenhum post com #{tag}</p>
      ) : (
        <div className="grid grid-cols-3 gap-0.5 rounded-xl overflow-hidden">
          {posts.map(p => (
            <div key={p.id} className="aspect-square bg-secondary overflow-hidden">
              {p.media_urls?.[0] ? (
                <img src={p.media_urls[0]} alt="" className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground p-2 text-center">
                  {p.caption?.slice(0, 60) || 'Post'}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
