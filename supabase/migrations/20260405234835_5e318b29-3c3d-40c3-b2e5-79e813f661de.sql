
-- =====================================================
-- 1. CONVERSATIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. CONVERSATION PARTICIPANTS (must exist before conversations policy)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.conversation_participants (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_read_at timestamp with time zone DEFAULT now(),
  UNIQUE(conversation_id, user_id)
);

ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;

-- Now add conversations policy that references conversation_participants
CREATE POLICY "Participants can view conversations" ON public.conversations
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.conversation_participants cp WHERE cp.conversation_id = id AND cp.user_id = auth.uid())
  );

CREATE POLICY "Authenticated users can create conversations" ON public.conversations
  FOR INSERT TO authenticated WITH CHECK (true);

-- Conversation participants policies
CREATE POLICY "Participants can view members" ON public.conversation_participants
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.conversation_participants cp2 WHERE cp2.conversation_id = conversation_id AND cp2.user_id = auth.uid())
  );

CREATE POLICY "Users can join conversations" ON public.conversation_participants
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own read status" ON public.conversation_participants
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- =====================================================
-- 3. MESSAGES
-- =====================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text,
  media_url text,
  media_type text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view messages" ON public.messages
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.conversation_participants cp WHERE cp.conversation_id = conversation_id AND cp.user_id = auth.uid())
  );

CREATE POLICY "Participants can send messages" ON public.messages
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (SELECT 1 FROM public.conversation_participants cp WHERE cp.conversation_id = conversation_id AND cp.user_id = auth.uid())
  );

CREATE POLICY "Participants can update message read status" ON public.messages
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.conversation_participants cp WHERE cp.conversation_id = conversation_id AND cp.user_id = auth.uid())
  );

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- =====================================================
-- 4. STORAGE BUCKETS
-- =====================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('posts-media', 'posts-media', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('stories-media', 'stories-media', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Anyone can view posts media" ON storage.objects FOR SELECT TO public USING (bucket_id = 'posts-media');
CREATE POLICY "Auth users can upload posts media" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'posts-media');
CREATE POLICY "Users can delete own posts media" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'posts-media' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Anyone can view stories media" ON storage.objects FOR SELECT TO public USING (bucket_id = 'stories-media');
CREATE POLICY "Auth users can upload stories media" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'stories-media');
CREATE POLICY "Users can delete own stories media" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'stories-media' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Anyone can view avatars" ON storage.objects FOR SELECT TO public USING (bucket_id = 'avatars');
CREATE POLICY "Auth users can upload avatars" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars');
CREATE POLICY "Users can delete own avatars" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
