import { useState, useEffect, useRef } from 'react';
import { X, Send, Heart, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface Comment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  parent_comment_id: string | null;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
}

interface CommentsSheetProps {
  postId: string | null;
  onClose: () => void;
  onCommentAdded: (postId: string) => void;
}

export function CommentsSheet({ postId, onClose, onCommentAdded }: CommentsSheetProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (postId) loadComments();
  }, [postId]);

  const loadComments = async () => {
    if (!postId) return;
    setLoading(true);
    const { data: commentsData } = await supabase
      .from('comments').select('*').eq('post_id', postId).order('created_at', { ascending: true });
    if (!commentsData) { setLoading(false); return; }
    const userIds = [...new Set(commentsData.map((c: any) => c.user_id))];
    const { data: profiles } = await supabase
      .from('profiles').select('user_id, display_name, username, avatar_url').in('user_id', userIds);
    const pMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));
    setComments(commentsData.map((c: any) => {
      const p = pMap.get(c.user_id);
      return { ...c, display_name: p?.display_name, username: p?.username, avatar_url: p?.avatar_url };
    }));
    setLoading(false);
  };

  const submitComment = async () => {
    if (!user || !postId || !text.trim()) return;
    setSubmitting(true);
    await supabase.from('comments').insert({
      post_id: postId, user_id: user.id, content: text.trim(),
      ...(replyTo ? { parent_comment_id: replyTo.id } as any : {}),
    });
    setText('');
    setReplyTo(null);
    onCommentAdded(postId);
    await loadComments();
    setSubmitting(false);
  };

  const topLevel = comments.filter(c => !c.parent_comment_id);
  const replies = (parentId: string) => comments.filter(c => c.parent_comment_id === parentId);

  const getName = (c: Comment) => c.display_name || c.username || 'Atleta';

  if (!postId) return null;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60" onClick={onClose}>
        <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          onClick={e => e.stopPropagation()}
          className="absolute bottom-0 left-0 right-0 max-h-[75vh] bg-card rounded-t-2xl border-t border-border flex flex-col">
          {/* Handle */}
          <div className="flex justify-center pt-2 pb-1">
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
          </div>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">Comentários</h3>
            <button onClick={onClose} className="p-1 text-muted-foreground"><X className="w-5 h-5" /></button>
          </div>

          {/* Comments list */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
            ) : topLevel.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">Nenhum comentário ainda. Seja o primeiro!</p>
            ) : topLevel.map(c => (
              <div key={c.id}>
                <CommentRow comment={c} onReply={() => { setReplyTo(c); inputRef.current?.focus(); }} getName={getName} />
                {/* Replies */}
                {replies(c.id).length > 0 && (
                  <div className="ml-10 mt-2 space-y-2 border-l-2 border-border pl-3">
                    {replies(c.id).map(r => (
                      <CommentRow key={r.id} comment={r} onReply={() => { setReplyTo(c); inputRef.current?.focus(); }} getName={getName} isReply />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Reply indicator */}
          {replyTo && (
            <div className="px-4 py-1.5 bg-secondary/50 flex items-center justify-between text-xs text-muted-foreground">
              <span>Respondendo a <strong className="text-foreground">{getName(replyTo)}</strong></span>
              <button onClick={() => setReplyTo(null)}><X className="w-3.5 h-3.5" /></button>
            </div>
          )}

          {/* Input */}
          <div className="flex items-center gap-2 px-4 py-3 border-t border-border bg-card">
            <input ref={inputRef} value={text} onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submitComment()}
              placeholder={replyTo ? `Responder a ${getName(replyTo)}...` : 'Adicione um comentário...'}
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none" />
            <button onClick={submitComment} disabled={!text.trim() || submitting}
              className="text-primary font-semibold text-sm disabled:opacity-40">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Publicar'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function CommentRow({ comment, onReply, getName, isReply }: { comment: Comment; onReply: () => void; getName: (c: Comment) => string; isReply?: boolean }) {
  return (
    <div className="flex gap-2.5">
      <div className={cn("rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0 overflow-hidden",
        isReply ? "w-6 h-6 text-[9px]" : "w-8 h-8 text-xs")}>
        {comment.avatar_url ? <img src={comment.avatar_url} alt="" className="w-full h-full object-cover" />
          : getName(comment).charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("text-foreground", isReply ? "text-xs" : "text-sm")}>
          <span className="font-semibold mr-1">{comment.username || getName(comment)}</span>
          {comment.content}
        </p>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-[10px] text-muted-foreground">
            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: ptBR })}
          </span>
          <button onClick={onReply} className="text-[10px] text-muted-foreground font-semibold hover:text-foreground">
            Responder
          </button>
        </div>
      </div>
      <button className="self-center p-1 text-muted-foreground hover:text-foreground">
        <Heart className="w-3 h-3" />
      </button>
    </div>
  );
}
