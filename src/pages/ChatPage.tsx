import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Image as ImageIcon, Loader2, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { format, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface Message {
  id: string;
  sender_id: string;
  content: string | null;
  media_url: string | null;
  media_type: string | null;
  created_at: string;
  is_read: boolean;
}

interface OtherUser {
  user_id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
}

export default function ChatPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!conversationId || !user) return;
    loadChat();
    markAsRead();

    const channel = supabase
      .channel(`chat-${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, (payload) => {
        const newMsg = payload.new as Message;
        setMessages(prev => [...prev, newMsg]);
        if (newMsg.sender_id !== user.id) markAsRead();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conversationId, user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadChat = async () => {
    if (!conversationId || !user) return;
    setLoading(true);

    // Get other user
    const { data: parts } = await supabase
      .from('conversation_participants')
      .select('user_id')
      .eq('conversation_id', conversationId)
      .neq('user_id', user.id);
    if (parts && parts.length > 0) {
      const { data: prof } = await supabase
        .from('profiles')
        .select('user_id, display_name, username, avatar_url')
        .eq('user_id', parts[0].user_id)
        .single();
      if (prof) setOtherUser(prof as OtherUser);
    }

    // Get messages
    const { data: msgs } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(200);
    setMessages((msgs || []) as Message[]);
    setLoading(false);
  };

  const markAsRead = async () => {
    if (!conversationId || !user) return;
    await supabase
      .from('messages')
      .update({ is_read: true } as any)
      .eq('conversation_id', conversationId)
      .neq('sender_id', user.id)
      .eq('is_read', false);
  };

  const sendMessage = async () => {
    if (!user || !conversationId || !text.trim()) return;
    setSending(true);
    const content = text.trim();
    setText('');
    await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content,
    });
    setSending(false);
    inputRef.current?.focus();
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !conversationId) return;
    const ext = file.name.split('.').pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('social-media').upload(path, file);
    if (error) return;
    const { data: urlData } = supabase.storage.from('social-media').getPublicUrl(path);
    const mediaType = file.type.startsWith('video') ? 'video' : 'image';
    await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: user.id,
      media_url: urlData.publicUrl,
      media_type: mediaType,
    });
  };

  const formatTimestamp = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isToday(d)) return format(d, 'HH:mm');
    if (isYesterday(d)) return 'Ontem ' + format(d, 'HH:mm');
    return format(d, "dd/MM HH:mm");
  };

  const shouldShowTimestamp = (idx: number) => {
    if (idx === 0) return true;
    const prev = new Date(messages[idx - 1].created_at);
    const curr = new Date(messages[idx].created_at);
    return curr.getTime() - prev.getTime() > 10 * 60 * 1000; // 10 min gap
  };

  const otherName = otherUser?.display_name || otherUser?.username || 'Atleta';

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] max-w-xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 px-3 py-3 border-b border-border bg-card/80 backdrop-blur-sm shrink-0">
        <button onClick={() => navigate('/direct')} className="p-1.5 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <button onClick={() => otherUser && navigate(`/athlete/${otherUser.user_id}`)} className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
            {otherUser?.avatar_url ? <img src={otherUser.avatar_url} className="w-full h-full object-cover" /> : <User className="w-4 h-4 text-primary" />}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{otherName}</p>
            {otherUser?.username && <p className="text-[10px] text-muted-foreground">@{otherUser.username}</p>}
          </div>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">Envie uma mensagem para iniciar a conversa!</p>
          </div>
        ) : messages.map((msg, idx) => {
          const isMine = msg.sender_id === user?.id;
          return (
            <div key={msg.id}>
              {shouldShowTimestamp(idx) && (
                <div className="flex justify-center my-3">
                  <span className="text-[10px] text-muted-foreground bg-secondary/50 px-2.5 py-0.5 rounded-full">{formatTimestamp(msg.created_at)}</span>
                </div>
              )}
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className={cn("flex mb-1", isMine ? "justify-end" : "justify-start")}>
                <div className={cn("max-w-[75%] rounded-2xl px-3.5 py-2",
                  isMine ? "bg-primary text-primary-foreground rounded-br-md" : "bg-secondary text-foreground rounded-bl-md"
                )}>
                  {msg.media_url && (
                    <div className="rounded-lg overflow-hidden mb-1.5">
                      {msg.media_type === 'video' ? (
                        <video src={msg.media_url} controls className="max-w-full max-h-48 rounded-lg" />
                      ) : (
                        <img src={msg.media_url} className="max-w-full max-h-48 rounded-lg object-cover" />
                      )}
                    </div>
                  )}
                  {msg.content && <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>}
                  <p className={cn("text-[9px] mt-0.5 text-right", isMine ? "text-primary-foreground/60" : "text-muted-foreground")}>
                    {format(new Date(msg.created_at), 'HH:mm')}
                  </p>
                </div>
              </motion.div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="shrink-0 border-t border-border bg-card px-3 py-2.5 flex items-center gap-2">
        <label className="p-2 text-muted-foreground hover:text-foreground cursor-pointer">
          <ImageIcon className="w-5 h-5" />
          <input type="file" accept="image/*,video/*" className="hidden" onChange={handleMediaUpload} />
        </label>
        <input
          ref={inputRef}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          placeholder="Mensagem..."
          className="flex-1 bg-secondary/50 rounded-full px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <button onClick={sendMessage} disabled={!text.trim() || sending}
          className="p-2 text-primary disabled:opacity-40">
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
